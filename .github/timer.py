"""Wait until data/wake.json says so, then start Update picks on the private repo.

This file is copied to the public site repo. It has no model code. Minutes it
spends waiting are on the public repo, which does not count against the
private repo's 2,000 Actions minutes. If NHL_MODEL_DISPATCH_TOKEN is unset it
exits 0 so a schedule can exist before the secret does.
"""
import datetime as dt, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # repo root when this file lives at .github/timer.py
BUDGET = 5.3 * 3600
ACTIVE = {"queued", "in_progress", "waiting", "requested", "pending"}


def log(msg):
    print(f"{dt.datetime.now(dt.timezone.utc):%H:%M:%S}Z {msg}", flush=True)


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


def watch(now_fn=None, sleep_fn=None, pull_fn=None, dispatch_fn=None, load_fn=None, handoff_fn=None, start=None):
    now_fn = now_fn or (lambda: dt.datetime.now(dt.timezone.utc))
    sleep_fn = sleep_fn or time.sleep
    start = start if start is not None else time.time()
    done_at = {}
    while True:
        if pull_fn:
            pull_fn()
        spec = load_fn() if load_fn else {}
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
        when, event = events[0]
        log(f"next: {event.get('key')} at {when:%H:%M}Z")
        while now_fn() < when:
            if time.time() - start > BUDGET:
                if handoff_fn:
                    handoff_fn()
                log("handing over to a fresh timer run")
                return 0
            sleep_fn(min(60, max(1, (when - now_fn()).total_seconds())))
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
    if timer_busy(repo, token, my_id):
        log("site timer already running or queued")
        return 0
    dispatch(repo, "timer.yml", token)
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

    def pull():
        subprocess.run(["git", "pull", "-q", "--rebase", "origin", "main"], cwd=ROOT, check=False)

    def load():
        try:
            return json.loads(wake.read_text()) if wake.exists() else {"events": []}
        except (OSError, json.JSONDecodeError):
            log("wake.json could not be read")
            return {"events": []}

    def fire(inputs):
        return dispatch(private, "daily.yml", token, inputs)

    def handoff():
        if gh and repo:
            dispatch(repo, "timer.yml", gh)

    if not wake.exists():
        pull()
    return watch(pull_fn=pull, dispatch_fn=fire, load_fn=load, handoff_fn=handoff)


if __name__ == "__main__":
    cmd = os.environ.get("TIMER_CMD") or (sys.argv[1] if len(sys.argv) > 1 else "wait")
    raise SystemExit(arm() if cmd == "arm" else wait())
