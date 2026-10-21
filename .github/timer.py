"""Wait until data/wake.json says so, then start Update picks on the private repo.

This file is copied to the public site repo. It has no model code. Minutes it
spends waiting are on the public repo, which does not count against the
private repo's 2,000 Actions minutes. If NHL_MODEL_DISPATCH_TOKEN is unset it
exits 0 so a schedule can exist before the secret does.

The published schedule includes the next morning preview. This file also
invents that slot when an older wake.json has only locks, and it does not
exit overnight, so a skipped GitHub cron still gets a slate.
"""
import datetime as dt, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent  # repo root when this file lives at .github/timer.py
BUDGET = 5.3 * 3600
ACTIVE = {"queued", "in_progress", "waiting", "requested", "pending"}
ET = ZoneInfo("America/New_York")
WAKE_ATTEMPTS = 4
# Slot clock in Eastern. pipeline/wake.py is the source of truth when this
# file is published from NHL-MODEL. 9:15 is 15 min after the 09:00 NHL preview;
# 10:15 is 15 min after the 10:00 NBA preview. A slate published after 09:00 /
# 10:00 already happened (the cron fires at minute 7). Noon is the cutoff for
# inventing a missed NHL morning when wake.json has no morning slot of its own:
# past that, the published plan owns the decision so a catch-up cannot land
# inside the lock window.
NHL_SLOT = (9, 15)
NBA_SLOT = (10, 15)
NHL_PROOF = (9, 0)
NBA_PROOF = (10, 0)
NHL_HEAL_UNTIL = (12, 0)
MORNING_KEYS = {"morning", "nba:morning"}


def acting_timer(env_mode, published_mode):
    """Return 'public' or 'private'. Keep in step with pipeline/timer_role.py.

    The site timer dispatches only when this returns 'public'. An explicit
    private (rescue) from the environment or from wake.json wins over public.
    """
    env = (env_mode or "").strip().lower()
    published = (published_mode or "").strip().lower()
    if env == "private" or published == "private":
        return "private"
    if env == "public" or published == "public":
        return "public"
    return "private"


def log(msg):
    print(f"{dt.datetime.now(dt.timezone.utc):%H:%M:%S}Z {msg}", flush=True)


def pull_main():
    """Update main. A failed rebase is aborted so the checkout is never left mid-rebase."""
    proc = subprocess.run(["git", "pull", "-q", "--rebase", "origin", "main"], cwd=ROOT, check=False)
    if proc.returncode != 0:
        subprocess.run(["git", "rebase", "--abort"], cwd=ROOT, check=False)
    return proc.returncode == 0


def _t(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))


def _api(method, url, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as err:
        return err.code, {"message": err.read().decode(errors="replace")[:300]}


def dispatch(repo, workflow, token, inputs=None):
    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow}/dispatches"
    status, payload = _api("POST", url, token, {"ref": "main", "inputs": inputs or {}})
    if status not in (204, 200, 201):
        log(f"dispatch {workflow} failed: HTTP {status} {payload.get('message', '')}")
        return False
    log(f"dispatched {repo} {workflow} {inputs or ''}")
    return True


def timer_busy(repo, token, my_id):
    url = f"https://api.github.com/repos/{repo}/actions/workflows/timer.yml/runs?per_page=30"
    status, payload = _api("GET", url, token)
    if status != 200:
        log(f"could not list timer runs (HTTP {status}); not treating that as busy")
        return False
    for run in payload.get("workflow_runs", []):
        if str(run.get("id")) == str(my_id):
            continue
        if run.get("status") in ACTIVE:
            return True
    return False


def read_wake(path, attempts=WAKE_ATTEMPTS, sleep_fn=None, pull_fn=None):
    """Parse wake.json. Retry a few times. None means it was there and did not parse.

    A missing file is an empty schedule. A parse error is not: the caller must
    not treat it as "nothing left to do today".
    """
    sleep_fn = sleep_fn or time.sleep
    path = Path(path)
    for i in range(attempts):
        if i and pull_fn:
            pull_fn()
        try:
            if not path.exists():
                return {"events": []}
            data = json.loads(path.read_text())
            if not isinstance(data, dict):
                raise json.JSONDecodeError("wake.json was not an object", "", 0)
            return data
        except (OSError, json.JSONDecodeError):
            log(f"wake.json could not be read (attempt {i + 1} of {attempts})")
            if i + 1 < attempts:
                sleep_fn(5)
    return None


def arm_should_start(env_mode, spec):
    """False when a readable schedule says this chain is not on duty.

    An unreadable wake.json still starts the waiter so it can retry the read.
    """
    if spec is None:
        return True
    published = spec.get("auspex_timer") if isinstance(spec, dict) else ""
    return acting_timer(env_mode, published) == "public"


def _clock(day, hour, minute):
    return dt.datetime(day.year, day.month, day.day, hour, minute, tzinfo=ET)


def _proof_time(doc, day, hour, minute):
    """True when a published file is this Eastern date and was written after the morning clock."""
    if not isinstance(doc, dict):
        return False
    if (doc.get("date") or doc.get("today")) != day.isoformat():
        return False
    try:
        return _t(doc["generated_at"]) >= _clock(day, hour, minute)
    except (KeyError, TypeError, ValueError):
        return False


def _listed(spec, field):
    if field not in spec:
        return None
    value = spec.get(field) or []
    return {str(item) for item in value}


def _synth(day, hour, minute, key, mode, nba_mode):
    when = _clock(day, hour, minute)
    return {"at": when.astimezone(dt.timezone.utc).isoformat(timespec="seconds"), "key": key, "mode": mode, "nba_mode": nba_mode}


def ensure_mornings(spec, now, nhl_doc=None, nba_doc=None):
    """Add morning slots when wake.json was written before this waiter knew about them.

    If a morning key is already in `events`, the private plan decided (including
    the lock-window cutoff) and this function leaves that key alone. Two days
    are kept so the waiter is already holding tomorrow when it fires today.
    Other fields, including auspex_timer, are left in place.
    """
    spec = dict(spec or {})
    events = [dict(event) for event in (spec.get("events") or []) if isinstance(event, dict)]
    today = now.astimezone(ET).date()
    nhl_done = _listed(spec, "nhl_morning_done")
    nba_done = _listed(spec, "nba_morning_done")

    def nhl_open(day):
        if nhl_done is not None:
            return day.isoformat() not in nhl_done
        return not _proof_time(nhl_doc, day, *NHL_PROOF)

    def nba_open(day):
        if nba_done is not None:
            return day.isoformat() not in nba_done
        return not _proof_time(nba_doc, day, *NBA_PROOF)

    def fill(key, open_fn, hour, minute, mode, nba_mode, heal_until):
        if any(event.get("key") == key for event in events):
            return
        added = 0
        for offset in range(7):
            day = today + dt.timedelta(days=offset)
            if not open_fn(day):
                continue
            slot = _clock(day, hour, minute)
            if heal_until and offset == 0 and now >= _clock(day, *heal_until) and now >= slot:
                continue
            events.append(_synth(day, hour, minute, key, mode, nba_mode))
            added += 1
            if added == 2:
                break

    fill("morning", nhl_open, *NHL_SLOT, "morning", "skip", NHL_HEAL_UNTIL)
    fill("nba:morning", nba_open, *NBA_SLOT, "skip", "morning", None)
    events.sort(key=lambda event: event.get("at") or "")
    spec["events"] = events
    return spec


def pick_next(pairs, now):
    """`(when, event)` list from `due`. A lock that is already due beats a catch-up morning."""
    due_locks = [item for item in pairs if item[0] <= now and item[1].get("key") not in MORNING_KEYS]
    return due_locks[0] if due_locks else pairs[0]


def due(spec, done_at, now):
    out = []
    for event in spec.get("events") or []:
        try:
            when = _t(event["at"])
        except (KeyError, TypeError, ValueError):
            continue
        key = event.get("key") or ""
        prev = done_at.get(key)
        if prev is not None and prev >= when - dt.timedelta(minutes=5):
            continue
        out.append((when, event))
    out.sort(key=lambda item: item[0])
    return out


def _stand_down():
    log("site timer standing down (AUSPEX_TIMER is not public)")
    return 0


def _unreadable(start, sleep_fn, handoff_fn):
    """A bad wake.json is retried until the budget runs out. It does not end the day."""
    log("wake.json could not be read; retrying")
    if time.time() - start > BUDGET:
        if handoff_fn:
            handoff_fn()
        log("handing over to a fresh timer run")
        return 0
    sleep_fn(60)
    return None


def watch(now_fn=None, sleep_fn=None, pull_fn=None, dispatch_fn=None, load_fn=None, handoff_fn=None, start=None, gate_fn=None):
    now_fn = now_fn or (lambda: dt.datetime.now(dt.timezone.utc))
    sleep_fn = sleep_fn or time.sleep
    start = start if start is not None else time.time()
    done_at = {}
    while True:
        if pull_fn:
            pull_fn()
        spec = load_fn() if load_fn else {}
        if spec is None:
            if _unreadable(start, sleep_fn, handoff_fn) == 0:
                return 0
            continue
        if gate_fn is not None and not gate_fn(spec):
            return _stand_down()
        events = due(spec, done_at, now_fn())
        until = spec.get("keep_watching_until")
        if not events:
            try:
                horizon = _t(until) if until else None
            except ValueError:
                horizon = None
            if horizon and now_fn() < horizon and time.time() - start < BUDGET:
                sleep_fn(300)
                continue
            log("nothing left to do today")
            return 0
        when, event = pick_next(events, now_fn())
        log(f"next: {event.get('key')} at {when:%H:%M}Z")
        while now_fn() < when:
            if time.time() - start > BUDGET:
                if handoff_fn:
                    handoff_fn()
                log("handing over to a fresh timer run")
                return 0
            sleep_fn(min(60, max(1, (when - now_fn()).total_seconds())))
        if pull_fn:
            pull_fn()
        if load_fn:
            fresh = load_fn()
            if fresh is None:
                if _unreadable(start, sleep_fn, handoff_fn) == 0:
                    return 0
                continue
            spec = fresh
        if gate_fn is not None and not gate_fn(spec):
            return _stand_down()
        inputs = {"mode": event.get("mode") or "skip", "nba_mode": event.get("nba_mode") or "skip"}
        if dispatch_fn(inputs):
            key = event.get("key") or ""
            done_at[key] = dt.datetime.max.replace(tzinfo=dt.timezone.utc) if key == "pregame" else when
        sleep_fn(240)


def arm():
    token = os.environ.get("GH_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    my_id = os.environ.get("GITHUB_RUN_ID", "")
    if not os.environ.get("NHL_MODEL_DISPATCH_TOKEN", "").strip():
        log("site timer arm skipped: NHL_MODEL_DISPATCH_TOKEN is not set")
        return 0
    env_mode = os.environ.get("AUSPEX_TIMER", "")
    wake = ROOT / "data" / "wake.json"

    spec = read_wake(wake, pull_fn=pull_main)
    if not arm_should_start(env_mode, spec):
        log("site timer arm skipped (AUSPEX_TIMER is not public)")
        return 0
    if timer_busy(repo, token, my_id):
        log("site timer already running or queued")
        return 0
    published = spec.get("auspex_timer") if isinstance(spec, dict) else ""
    mode = "public" if acting_timer(env_mode, published) == "public" else env_mode.strip().lower()
    dispatch(repo, "timer.yml", token, {"auspex_timer": mode})
    return 0


def wait():
    token = os.environ.get("NHL_MODEL_DISPATCH_TOKEN", "").strip()
    if not token:
        log("site timer skipped: NHL_MODEL_DISPATCH_TOKEN is not set")
        return 0
    private = os.environ.get("NHL_MODEL_REPO", "").strip() or "callumjsholes/NHL-MODEL"
    gh = os.environ.get("GH_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    wake = ROOT / "data" / "wake.json"

    def _read(path):
        try:
            return json.loads(path.read_text()) if path.exists() else None
        except (OSError, json.JSONDecodeError):
            return None

    def load():
        spec = read_wake(wake, pull_fn=pull_main)
        if spec is None:
            return None
        # Fold a missed morning in here, not in watch(), so a test that feeds
        # watch() its own events is not given an extra day to wait for.
        # A parse failure stays None so the waiter retries instead of ending the day.
        return ensure_mornings(
            spec,
            dt.datetime.now(dt.timezone.utc),
            _read(ROOT / "data" / "today.json"),
            _read(ROOT / "data" / "nba_live.json"),
        )

    def fire(inputs):
        return dispatch(private, "daily.yml", token, inputs)

    def handoff():
        if gh and repo:
            dispatch(repo, "timer.yml", gh, {"auspex_timer": os.environ.get("AUSPEX_TIMER", "").strip().lower()})

    def gate(spec):
        published = spec.get("auspex_timer") if isinstance(spec, dict) else ""
        return acting_timer(os.environ.get("AUSPEX_TIMER", ""), published) == "public"

    if not wake.exists():
        pull_main()
    return watch(pull_fn=pull_main, dispatch_fn=fire, load_fn=load, handoff_fn=handoff, gate_fn=gate)


if __name__ == "__main__":
    cmd = os.environ.get("TIMER_CMD") or (sys.argv[1] if len(sys.argv) > 1 else "wait")
    raise SystemExit(arm() if cmd == "arm" else wait())
