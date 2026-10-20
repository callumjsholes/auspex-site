/* Auspex Sports — edit this file to change words, the email address, the X handle,
   and the Beehiiv form. The pages read it in the browser. There is no build step.

   Do not put record numbers here. Record, units, ROI, bet counts, and drawdowns
   are filled from site/data/*.json by site.js. Those JSON files are rewritten by
   the model automation. Never hand-edit them.

   Words in {curly braces} are filled from the data files. Leave the braces in place.

   Hardcoded facts that are NOT in site/data (so they can go stale):
   - hero.kicker — the live record start date. No launch date field exists in the JSON.
   - fallbacks.unitNote — used only if meta.json has no unit_note.
   - tiers — rounded NHL cutoffs (about 9%, 5%, 1%). summary.json still has the old point gaps, and the page does not print those.
   - fallbacks.nbaRule — used only if nba_live.json has no rules.
   The page does not state a closing-line minute count or a morning clock time.
   Those values are not copied into site/data.
*/
window.AUSPEX = {
  brand: {
    name: "Auspex Sports",
    email: "hello@auspexsports.com",
    xHandle: "@AuspexSports",
    xUrl: "https://x.com/AuspexSports",
    siteUrl: "https://auspexsports.com/"
  },

  /* Link previews read the <title> and meta description in each HTML file.
     They do not run JavaScript. Keep those tags in sync with seo.title and
     seo.description. seo.withNumbers is added in the browser once the JSON loads. */
  seo: {
    title: "Auspex Sports — NHL and NBA picks, posted before the game",
    description: "I post NHL moneylines and NBA player props before the line moves. I grade each pick at the price I posted. It stays up, win or lose.",
    withNumbers: "I post NHL moneylines and NBA player props before the line moves and grade each one at the price I posted. Tests, not the live record: NHL {nhlRoi} ROI, {nhlUnits} units, on {nhlBets} bets. NBA props {nbaRoi} ROI, {nbaUnits} units, on {nbaBets} unseen bets."
  },

  /* Beehiiv is connected. To point this at a different form, paste the new form id.
     Beehiiv → Subscribe forms → your form → Get embed code. The id is the
     data-beehiiv-form value in that script tag.
     The loader renders the form where that script sits. One form per page:
     a second copy is the same list, and the loader can hide extras after a signup.
     Other buttons on the page scroll to #waitlist.
     subscribeUrl is the public newsletter. It is the link when the embed does not
     load, and the link in the page's <noscript> block (that one is written in
     index.html because it has to work with JavaScript off).
     Kit or Buttondown: set provider to "kit" or "buttondown" and fill that action.
     Leave them blank while Beehiiv is in use. */
  waitlist: {
    provider: "beehiiv",
    formId: "2c08e9f0-814d-4936-8543-36d17a958249",
    publicationId: "pub_204c4896-f2e4-456c-bc85-1d74bd014583",
    loaderUrl: "https://subscribe-forms.beehiiv.com/v3/loader.js",
    attributionUrl: "https://subscribe-forms.beehiiv.com/attribution.js",
    subscribeUrl: "https://auspexsports.beehiiv.com",
    subscribeHost: "auspexsports.beehiiv.com",
    kitAction: "",
    kitEmailField: "email_address",
    buttondownAction: "",
    buttondownEmailField: "email",
    extra: {}
  },

  nav: { nba: "NBA", nhl: "NHL", method: "Method", rules: "Rules", record: "Record", faq: "FAQ", menu: "Menu", close: "Close" },
  switch: { nba: "NBA props", nhl: "NHL", method: "Method" },

  hero: {
    kicker: "Live record from October 20, 2026",
    title: "NHL and NBA picks",
    deck: "I built an NHL model from play-by-play data, and an NBA props model. I post every pick before the line moves. I grade it at the price I posted. It stays up, win or lose.",
    ctaNba: "Today's NBA",
    ctaNhl: "Today's NHL",
    email: "Email list"
  },

  follow: { lead: "Follow", email: "Email list" },

  slip: {
    title: "Record",
    day1: "Nothing graded yet.",
    loading: "Loading the test results. They are not the live record.",
    graded: "Graded at the posted price",
    full: "Full record"
  },

  steps: {
    heading: "How it works",
    lede: "I update it from every game. Each morning I add last night's results, so team ratings and player numbers stay current.",
    items: [
      { n: "01", h: "I price it", p: "I estimate the chance. NHL uses shot quality. NBA props use minutes, role, and matchup. I compare my price to the books, with their margin removed." },
      { n: "02", h: "I post it", p: "If the price pays enough, I post the pick, the book, and the price before the game. If it does not, I pass." },
      { n: "03", h: "I grade it", p: "The result stays up, win or lose, at the price I posted. I also save the closing line." }
    ]
  },

  edge: {
    heading: "Expected value",
    body: "I only bet when the price pays more than the model thinks it should. Expected value (EV) is how much a bet should return on average, per dollar. For an NHL game I use the median price I lock.",
    techSummary: "No-vig and the locked price",
    tech: "No-vig means the books' margin is removed. If both sides are −110, each side is 50% with the margin out. I do not stake NHL from that point gap. I stake from expected value at the price I lock. Closing line value is whether the line moved my way after I posted. Positive means it did.",
    exampleTitle: "Example",
    exampleBody: "Say I think a team wins 60% of the time, and the price I would lock is +110. That bet should return about 26 cents per dollar. About 9% is a best bet, so this would be 2 units. This is an example. It is not a pick on today's card."
  },

  /* Rounded for readers. Exact cutoffs: docs/ev_price_tiers.md. Do not read these from summary.json staking. That list is still the old point gap. */
  tiers: {
    headTier: "Tier",
    headEv: "Expected value",
    headStake: "Stake",
    best: "Best bet",
    bestEv: "about 9%",
    bestStake: "2 units",
    bet: "Bet",
    betEv: "about 5%",
    betStake: "1 unit",
    lean: "Lean",
    leanEv: "about 1%",
    leanStake: "none",
    note: "Rounded for reading. The exact cutoffs are in the docs. A lean is not a stake. NBA props are separate: expected value at the book's price, plus a 2-point gap."
  },

  rules: {
    label: "Rules",
    body: "Picks lock before the game and get a timestamp. I grade them at the posted price and book. I do not edit or delete a result. Backtests use only games the model had not seen."
  },

  nhl: {
    heading: "NHL moneylines",
    today: "Today",
    todayNote: "Picks lock before the first game. A marked game is a bet. The rest are a lean, not a pick.",
    units: "Unit curve",
    before: "Before launch",
    beforeCap: "Season totals from the test. Not the live record.",
    seasons: "By season",
    clv: "Closing line",
    clvLede: "The closing line is the last price before the game. I record it shortly before puck drop. Beating it over a long run is a good sign. One hot or cold week is not.",
    history: "Every NHL pick",
    show: "Show",
    csv: "Download CSV",
    how: "How I price an NHL game",
    shotTitle: "Shot quality",
    shot: "How dangerous the chances are, at even strength and on special teams. Each morning I add last night's shots and rebuild team ratings from every game so far.",
    whoTitle: "Who is playing",
    who: "Goalies, lines, injuries, rest, and travel change the price for that game.",
    gapTitle: "The price has to pay",
    gap: "I stake an NHL pick from expected value at the median price I lock. About 9% is 2 units. About 5% is 1 unit. About 1% is a lean, and I do not stake it.",
    techSummary: "More detail",
    techBody: "Shot quality means expected goals. Each game is priced only from earlier games. I stake from expected value at the locked price, not from the point gap."
  },

  nba: {
    heading: "NBA player props",
    lede: "Points, rebounds, and assists. I post a prop only when my price and the books disagree by enough.",
    today: "Today",
    todayCap: "Props lock before tip, after the injury report. The stake and the cutoff come from the data file.",
    history: "Every NBA pick",
    test: "Test results",
    testLede: "These games were not used to set the rules. This is not the live record.",
    units: "Units over that test",
    month: "By month",
    stat: "By stat",
    books: "Same bets, different books",
    tests: "Other tests",
    testsLede: "Most of these did not beat the market.",
    sample: "How close were the probabilities?",
    how: "How I price a prop",
    techSummary: "More detail",
    minutesTitle: "Minutes",
    minutes: "Recent minutes, role, rest, and injuries. Each morning I add last night's box scores, so minutes and rates stay current.",
    matchTitle: "Matchup",
    match: "Per-minute scoring, and how the defense plays that position.",
    blendTitle: "The books",
    blend: "I blend my chance with the books' no-vig price. I bet when that book's price has enough expected value, and my chance beats the no-vig price by 2 points.",
    techBody: "I blend my chance with the books' price. Brier score is the average squared error of the probabilities. Lower is better."
  },

  method: {
    heading: "Method",
    lede: "The numbers behind the picks, including the parts that do not look good. Tests use games the model had not seen.",
    cal: "Does a stated chance happen?",
    calLede: "If the model says 40%, it should happen about 40% of the time. Each dot is a group of lines. On the diagonal, the probability was honest. Hollow dots are the books.",
    buckets: "Does a bigger gap return more?",
    bucketsLede: "This is the older NHL test, grouped by the point gap. Live stakes use expected value. It is not a perfect staircase.",
    nhlBuckets: "NHL moneylines",
    nhlBucketsCap: "Older test. Gap versus the no-vig price, in points. Not the live rule.",
    nbaBuckets: "NBA props",
    nbaBucketsCap: "Expected value at the best price I found. Unseen games.",
    seasons: "NHL by season",
    seasonsLede: "Log loss measures how sharp the probabilities are. Lower is better. I do not beat the market on log loss in most seasons. The return shows up where the price is off.",
    glossary: "Glossary",
    log: "Changelog",
    data: "Data files",
    dataLede: "The numbers on this page come from these files."
  },

  glossary: [
    { term: "Shot quality", def: "How dangerous a chance was, not just whether it scored. Also called expected goals." },
    { term: "No-vig", def: "The books' price with their margin taken out, so both sides add up to 100%." },
    { term: "Expected value", def: "How much a bet should return on average, per dollar. Also called EV. I stake NHL picks from this, at the price I lock." },
    { term: "Edge", def: "For NHL, expected value at the price I lock. For NBA props, expected value at the book's price, plus a 2-point gap versus no-vig." },
    { term: "Closing line value", def: "Whether the closing line moved my way after I posted. Also called CLV." },
    { term: "Calibration", def: "If I say 40%, it happens about 40% of the time." },
    { term: "Unit", def: "1% of bankroll.", id: "unit-def" },
    { term: "ROI", def: "Profit divided by the amount risked." },
    { term: "Out of sample", def: "Games the model never saw while the rules were chosen." },
    { term: "Drawdown", def: "The deepest drop from a peak on the unit curve." }
  ],

  downloads: [
    { href: "data/nba_live.json", label: "Every NBA pick", note: "Lock time, book, price, closing price, and result." },
    { href: "data/picks.json", label: "Every NHL pick", note: "Lock time, price, closing price, and result." },
    { href: "data/backtest.json", label: "NHL test summary", note: "Season by season." },
    { href: "data/nba.json", label: "NBA props test", note: "Results by sportsbook." },
    { href: "data/research.json", label: "Method charts", note: "The series behind the method section." },
    { href: "data/charts.json", label: "Unit curves", note: "The series behind the line charts." }
  ],

  story: {
    heading: "The name",
    body: "Auspex is Latin for a person who watched birds before a decision. I watch shots and possessions, then post a price before the line moves.",
    imageAlt: "Auspex Sports eagle mark"
  },

  email: {
    heading: "Email list",
    body: "Picks on this page are free while the live record is new. Join if you want a note when a paid tier opens. Nothing is charged now.",
    cost: "The data behind this costs me hundreds of dollars a month. The more people who follow along, the more time I can put into the models.",
    or: "Or subscribe at",
    items: [
      "NHL moneylines on game days",
      "NBA points, rebounds, and assists",
      "The book and the price",
      "The full record, wins and losses"
    ],
    failed: "The form did not load."
  },

  legal: {
    playTitle: "Play responsibly",
    play: "Picks are information, not advice. Past results, including tests, do not guarantee future results. Bet only what you can afford to lose, and only where it is legal for you. 18+ (19+ in most of Canada, 21+ in most US states).",
    help: "If betting stops being fun, help is free and confidential: 1-800-GAMBLER in the US, ConnexOntario 1-866-531-2600 in Ontario, or your provincial helpline.",
    gradeTitle: "How picks are graded",
    grade: "I grade at the posted price and book. If a player does not play, that prop is not a win or a loss.",
    checkTitle: "Check the record",
    record: "Live record",
    method: "Method and tests",
    terms: "Terms",
    privacy: "Privacy"
  },

  footer: {
    rights: "© 2026 Auspex Sports.",
    note: "Not affiliated with the NHL, the NBA, or any sportsbook."
  },

  sticky: { today: "Today's picks", email: "Email list" },
  notFound: {
    title: "That page is not here.",
    body: "The record, today's picks, and the method are on the home page.",
    back: "Back to the record"
  },

  /* The live record page. Numbers come from site/data, not from this file. */
  record: {
    title: "Record",
    kicker: "Live record from October 20, 2026",
    lede: "Every graded pick is here. I grade at the price I posted. It stays up, win or lose.",
    empty: "First graded picks show up here after tonight's games.",
    caption: "Graded NHL and NBA picks",
    tableTitle: "Graded picks",
    showLeague: "League",
    showResult: "Result",
    csv: "Download CSV",
    colDate: "Date",
    colLeague: "League",
    colMatchup: "Matchup",
    colPick: "Pick",
    colOdds: "Odds",
    colStake: "Stake",
    colResult: "Result",
    colUnits: "Units",
    colRunning: "Running",
    colRecord: "Record",
    kpiRecord: "Record",
    kpiUnits: "Units",
    kpiStaked: "Units staked",
    kpiRoi: "ROI at the posted price",
    chartSummary: "Cumulative units after each graded pick. Latest point: {end} units.",
    filterEmpty: "Nothing in this filter.",
    loadError: "The record did not load. Refresh in a minute.",
    clvTitle: "Closing line",
    clvLede: "I compare the price I locked with the closing price. Positive means I beat the close.",
    clvMissing: "Tracking starts with today's picks.",
    clvCount: "{n} picks have a closing price.",
    clvBeat: "They beat that price {pct}% of the time.",
    clvPriceUp: "On average, the price I locked was {n}% better than the close.",
    clvPriceDown: "On average, the price I locked was {n}% worse than the close.",
    clvPriceFlat: "On average, the price I locked matched the close.",
    clvNovigBeat: "The no-vig line moved my way {pct}% of the time.",
    clvNovigUp: "On average, that move was {n} points my way.",
    clvNovigDown: "On average, that move was {n} points against me.",
    clvNovigFlat: "On average, the no-vig line did not move.",
    clvRange: "The 95% range on the average is {lo} to {hi}.",
    nhl: "NHL",
    nba: "NBA"
  },

  faq: {
    heading: "Questions",
    lede: "Short answers. The live pages use the same rules.",
    items: [
      {
        id: "lock",
        q: "When do picks lock?",
        a: "Each NBA pick locks about 50 minutes before that game's tip-off. NHL picks lock about 2 hours before the first game."
      },
      {
        id: "unit",
        q: "What is a unit?",
        a: "1 unit is 1% of bankroll."
      },
      {
        q: "How do the tiers work?",
        a: "NHL tiers are assigned by expected value. About 9% is a best bet, 2 units. About 5% is a bet, 1 unit. About 1% is a lean. I do not stake a lean. An NBA prop is 1 unit when my price and the book's price disagree by enough."
      },
      {
        q: "How are results graded?",
        a: "I grade each pick at the price I posted. It stays up, win or lose. If a player does not play, that prop is not a win or a loss."
      },
      {
        q: "Do the models update?",
        a: "Yes. I update the models after every game. Each morning I add last night's results."
      },
      {
        q: "Is this advice?",
        a: "No. This is not financial advice. Bet only what you can afford to lose, and only where it is legal for you."
      }
    ]
  },

  /* Sentences site.js fills from the JSON. Edit the words, not the {tokens}. */
  templates: {
    slipNone: "Nothing is graded yet. The rows below are tests on games the models had not seen. They are not the live record.",
    slipLive: "Live results are first. Test rows are marked. They only count games the model had not seen.",
    nhlBanner: "No graded picks yet. The numbers below are the test, from before launch.",
    kpiTestBets: "Bets in the test",
    kpiTestUnits: "Units, before launch",
    kpiTestRoi: "ROI at the closing price",
    kpiTestDrop: "Deepest drop from a peak",
    kpiLive: "Live record",
    kpiLiveUnits: "Live units",
    kpiLiveRoi: "Live ROI at the posted price",
    kpiBeat: "Picks that beat the closing line",
    nhlWordsEmpty: "The 95% range on that return is {lo}% to {hi}%. The deepest drop was {dd} units, on {staked} units staked across {games} games. A later slice in the file ({seasons}) was {blindRoi}% on {blindPicks} bets ({blindUnits} units). The live record has not started.",
    nhlWordsLive: "Before launch: {roi}% ROI on {bets} bets, {units} units. The 95% range was {lo}% to {hi}%. The deepest drop was {dd} units.",
    todayNote: "Picks lock about {window} before the first game. A marked game is a bet. The rest are a lean, not a pick.",
    todayStale: "It is {today} Eastern. The last NHL slate I published is {slate}. Today's games post with the morning update.",
    todayFuture: "It is {today} Eastern. This file is the {slate} slate, so it is labeled with that date.",
    emptyToday: "Today's slate is not up yet.",
    emptyNoGames: "No games on this slate.",
    noPriced: "No priced game yet.",
    pickTag: "{team} to win, {stake}u",
    noBet: "No bet",
    priceSoon: "Price posts soon",
    lastSlate: "Last published slate",
    upcoming: "Upcoming slate",
    filterEmpty: "Nothing in this filter.",
    liveEmptyNhl: "No NHL pick has been graded.",
    liveEmptyNba: "No NBA pick has been posted.",
    clvEmpty: "No live closing price yet. I record closing prices shortly before each game. The chart is the older test of how often the closing line moved my way. {missing}",
    clvPost: "ROI at the price I posted",
    clvClose: "ROI at the closing price",
    clvNote: "{n} with a closing price{avg}. This needs a few hundred picks before it settles.",
    chartLiveEmptyTitle: "No live curve yet",
    chartLiveEmptyBody: "It will draw after two graded picks. The next chart is the test.",
    chartLiveSummary: "Live units since {start}. Latest point: {end} units. {unit}",
    chartBeforeSummary: "Before launch, season units were {seasons}. The published total is {units} units on {staked} staked, a {roi}% return. The deepest drop was {dd} units. The 95% range is {lo}% to {hi}%.",
    seasonSummary: "Return by season, before launch. {bits}.",
    clvLiveSummary: "Closing line value, in percentage points, for {n} picks. Average {avg} points.",
    clvOldSummary: "Before launch, the closing line moved my way on {bits}. {missing} This is not the live record.",
    nbaBanner: "No graded props yet. The test is in the section below.",
    nbaWordsEmpty: "No NBA prop is graded yet. The test below is what I can show today.",
    nbaWordsClv: "Average closing line value is {avg} points over {n} picks.",
    nbaWordsWait: "I log the closing price shortly before tip.",
    nbaTodayCap: "Each game locks about {window} before tip, after the injury report. Every pick is {units} {unitWord} at the best price I found. The book is named.",
    nbaTodayFuture: "It is {today} Eastern. This block is the {slate} slate.",
    nbaNoGames: "No NBA games today.",
    nbaNext: "Next slate is {date}.",
    nbaPass: "No prop cleared the bar in the games priced so far.",
    nbaWaiting: "Picks post here as each game locks. Passing is part of the plan.",
    nbaNotPosted: "Today's NBA slate has not posted yet.",
    reasonChance: "My chance is {model}%. The market implies {market}%.",
    reasonEv: "Expected value is {ev}%.",
    faqLock: "Each NBA pick locks about {nba} before that game's tip-off. NHL picks lock about {nhl} before the first game.",
    propWhy: "Projection {proj} in {min} minutes. My chance {model}%, books {market}%.",
    actual: "Actual {n}",
    ev: "EV {n}",
    nbaClv: "Average closing line value is {avg} points over {n} picks. Positive means the line moved my way after I posted.",
    nbaClvWait: "Closing prices are logged shortly before tip. None are in yet.",
    nbaFoot: "Out of sample. {label}. {winPct}% of those bets won. The 95% range is {lo}% to {hi}%. The deepest drop on that path was {dd} units{trough}. By month: {months}. {inSample}. The {roi}% on {bets} unseen bets is the number to remember. The other sample was used to set the rules.",
    nbaEqSummary: "The unseen test ({label}) finished at {units} units on {bets} bets, a {roi}% return, record {record}. The deepest drop was {dd} units. This is not the live record.",
    nbaMonthSummary: "By month, same unseen bets. {bits}.",
    nbaStatSummary: "By stat, same unseen bets. {bits}. A reshuffle of the same bets, {paths} paths of {pathBets} bets, finished ahead {profit}% of the time. Median end {end} units. Median drop {drop} units. That reshuffle is not this path.",
    calKey: "Filled dots are the model. Hollow dots are the books' no-vig prices. Groups under 200 lines are left out. {bits}.",
    updated: "Updated {when} ET",
    nhlDown: "NHL data did not load. Refresh in a minute.",
    nbaDown: "NBA results did not load. Refresh in a minute.",
    slateDown: "Today's slate did not load. Refresh in a minute.",
    nhlTech: "Shot quality here means expected goals. Each game is priced only from games before it. Log loss measures how sharp the probabilities are. Lower is better. I do not beat the market's log loss in most seasons. I stake from expected value at the locked price, not from the point gap. {unit}",
    nbaTech: "Minutes come first, then a per-minute rate, then the chance of clearing the line. I blend that chance with the books' no-vig price. {rule} Brier score is the average squared error of the probabilities. Lower is better.",
    nbaRule: "A pick needs at least {ev}% expected value and a {edge}-point gap. Every pick is {units} {unitWord}.",
    follow: "Follow {handle} for picks as they lock.",
    emailList: "Email list"
  },

  fallbacks: {
    unitNote: "1 unit is 1% of bankroll.",
    nbaRule: "A pick needs at least 4% expected value and a 2-point gap. Every pick is 1 unit.",
    chartEmpty: "No curve yet.",
    chartEmptyBody: "It will draw once there are two points."
  }
};

(function applyAuspexContent(root) {
  const A = window.AUSPEX;
  const $ = (sel, base) => (base || document).querySelector(sel);
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), A);
  root.querySelectorAll("[data-c]").forEach((node) => {
    const value = get(node.getAttribute("data-c"));
    if (typeof value === "string") node.textContent = value;
  });
  root.querySelectorAll("[data-alt]").forEach((node) => {
    const value = get(node.getAttribute("data-alt"));
    if (typeof value === "string") node.alt = value;
  });
  root.querySelectorAll("[data-brand]").forEach((node) => {
    const key = node.getAttribute("data-brand");
    if (key === "email") {
      node.textContent = A.brand.email;
      if (node.tagName === "A") node.setAttribute("href", "mailto:" + A.brand.email);
    } else if (key === "x") {
      node.textContent = A.brand.xHandle;
      if (node.tagName === "A") node.setAttribute("href", A.brand.xUrl);
    } else if (key === "beehiiv") {
      node.textContent = A.waitlist.subscribeHost;
      if (node.tagName === "A") node.setAttribute("href", A.waitlist.subscribeUrl);
    }
  });
  const steps = $("[data-list='steps']", root);
  if (steps) {
    steps.replaceChildren();
    A.steps.items.forEach((item) => {
      const li = document.createElement("li");
      const n = document.createElement("span");
      n.textContent = item.n;
      const h = document.createElement("h3");
      h.textContent = item.h;
      const p = document.createElement("p");
      p.textContent = item.p;
      li.append(n, h, p);
      steps.append(li);
    });
  }
  const glossary = $("[data-list='glossary']", root);
  if (glossary) {
    glossary.replaceChildren();
    A.glossary.forEach((item) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = item.term;
      const dd = document.createElement("dd");
      dd.textContent = item.def;
      if (item.id) dd.id = item.id;
      wrap.append(dt, dd);
      glossary.append(wrap);
    });
  }
  const faq = $("[data-list='faq']", root);
  if (faq && A.faq && A.faq.items) {
    faq.replaceChildren();
    faq.classList.add("faq-list");
    A.faq.items.forEach((item) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = item.q;
      const dd = document.createElement("dd");
      dd.textContent = item.a;
      if (item.id) dd.setAttribute("data-faq", item.id);
      wrap.append(dt, dd);
      faq.append(wrap);
    });
  }
  const perks = $("[data-list='perks']", root);
  if (perks) {
    perks.replaceChildren();
    A.email.items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      perks.append(li);
    });
  }
  const files = $("[data-list='files']", root);
  if (files) {
    files.replaceChildren();
    A.downloads.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.setAttribute("download", "");
      a.textContent = item.label;
      li.append(a, document.createTextNode(". " + item.note));
      files.append(li);
    });
  }
  if (document.body && document.body.dataset.page === "home" && A.seo && A.seo.title) {
    document.title = A.seo.title;
  }
  const navBtn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (navBtn && nav) {
    const setNav = (open) => {
      nav.classList.toggle("open", open);
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? (A.nav.close || "Close") : (A.nav.menu || "Menu");
    };
    navBtn.addEventListener("click", () => setNav(!nav.classList.contains("open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  }
})(document);
