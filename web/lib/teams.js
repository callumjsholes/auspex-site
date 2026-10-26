// Public team names for page titles. Abbreviations come from the published feeds.
// The nickname is what the title uses ("Bruins vs Red Wings"). `place` is the home city.

function row(city, nick, place = city) {
  return { city, nick, place, full: `${city} ${nick}` };
}

const NBA = {
  ATL: row("Atlanta", "Hawks"),
  BOS: row("Boston", "Celtics"),
  BKN: row("Brooklyn", "Nets"),
  CHA: row("Charlotte", "Hornets"),
  CHI: row("Chicago", "Bulls"),
  CLE: row("Cleveland", "Cavaliers"),
  DAL: row("Dallas", "Mavericks"),
  DEN: row("Denver", "Nuggets"),
  DET: row("Detroit", "Pistons"),
  GSW: row("Golden State", "Warriors", "San Francisco"),
  HOU: row("Houston", "Rockets"),
  IND: row("Indiana", "Pacers", "Indianapolis"),
  LAC: row("Los Angeles", "Clippers", "Inglewood"),
  LAL: row("Los Angeles", "Lakers"),
  MEM: row("Memphis", "Grizzlies"),
  MIA: row("Miami", "Heat"),
  MIL: row("Milwaukee", "Bucks"),
  MIN: row("Minnesota", "Timberwolves", "Minneapolis"),
  NOP: row("New Orleans", "Pelicans"),
  NYK: row("New York", "Knicks"),
  OKC: row("Oklahoma City", "Thunder"),
  ORL: row("Orlando", "Magic"),
  PHI: row("Philadelphia", "76ers"),
  PHX: row("Phoenix", "Suns"),
  POR: row("Portland", "Trail Blazers"),
  SAC: row("Sacramento", "Kings"),
  SAS: row("San Antonio", "Spurs"),
  TOR: row("Toronto", "Raptors"),
  UTA: row("Utah", "Jazz", "Salt Lake City"),
  WAS: row("Washington", "Wizards"),
};

const NHL = {
  ANA: row("Anaheim", "Ducks"),
  BOS: row("Boston", "Bruins"),
  BUF: row("Buffalo", "Sabres"),
  CAR: row("Carolina", "Hurricanes", "Raleigh"),
  CBJ: row("Columbus", "Blue Jackets"),
  CGY: row("Calgary", "Flames"),
  CHI: row("Chicago", "Blackhawks"),
  COL: row("Colorado", "Avalanche", "Denver"),
  DAL: row("Dallas", "Stars"),
  DET: row("Detroit", "Red Wings"),
  EDM: row("Edmonton", "Oilers"),
  FLA: row("Florida", "Panthers", "Sunrise"),
  LAK: row("Los Angeles", "Kings"),
  MIN: row("Minnesota", "Wild", "Saint Paul"),
  MTL: row("Montreal", "Canadiens"),
  NJD: row("New Jersey", "Devils", "Newark"),
  NSH: row("Nashville", "Predators"),
  NYI: row("New York", "Islanders", "Elmont"),
  NYR: row("New York", "Rangers"),
  OTT: row("Ottawa", "Senators"),
  PHI: row("Philadelphia", "Flyers"),
  PIT: row("Pittsburgh", "Penguins"),
  SEA: row("Seattle", "Kraken"),
  SJS: row("San Jose", "Sharks"),
  STL: row("St. Louis", "Blues"),
  TBL: row("Tampa Bay", "Lightning", "Tampa"),
  TOR: row("Toronto", "Maple Leafs"),
  UTA: row("Utah", "Mammoth", "Salt Lake City"),
  VAN: row("Vancouver", "Canucks"),
  VGK: row("Vegas", "Golden Knights", "Las Vegas"),
  WPG: row("Winnipeg", "Jets"),
  WSH: row("Washington", "Capitals"),
};

export function team(league, abbr) {
  const known = (league === "NHL" ? NHL : NBA)[abbr];
  if (known) return { abbr, ...known };
  return { abbr, city: abbr, nick: abbr, place: abbr, full: abbr };
}

export function gameSlug(away, home) {
  return `${String(away).trim().toLowerCase()}-at-${String(home).trim().toLowerCase()}`;
}

export function gamePath(league, date, away, home) {
  if (!league || !date || !away || !home) return null;
  return `/${String(league).toLowerCase()}/${date}/${gameSlug(away, home)}`;
}

// "BOS at DET" (the matchup string on a pick) to a game path.
export function matchupPath(league, date, gameText) {
  const parts = String(gameText || "").split(" at ");
  if (parts.length !== 2) return null;
  return gamePath(league, date, parts[0].trim(), parts[1].trim());
}
