// Short definitions for the words on a pick card. Betting terms only.
// The tip is the tooltip. The answer is the longer FAQ version.

export const TERMS = {
  odds: {
    tip: "American odds. −110 means you risk $110 to win $100. +150 means a $100 bet wins $150.",
    q: "What does −110 mean?",
    a: "That is the price, in American odds. A minus number is what you risk to win $100, so −110 risks $110 to win $100. A plus number is what you win if you risk $100, so +150 wins $150. I grade the pick at the price on the card.",
  },
  unit: {
    tip: "1 unit is 1% of a bankroll. +0.91u means the pick won 0.91 units at the posted price.",
    q: "What is a unit?",
    a: "1 unit is 1% of your bankroll. NBA props are 1 unit each. NHL picks are 1 unit, or 2 for the strongest edges.",
  },
  over: {
    tip: "The player has to finish with more than the line.",
    q: "What does over or under mean?",
    a: "A player prop sets a line, like 27.5 points. Over wins if the player finishes above the line. Under wins if the player finishes below it. If the line is a whole number and the player lands on it, the pick is a push.",
  },
  under: {
    tip: "The player has to finish with less than the line.",
  },
  moneyline: {
    tip: "A bet on which team wins the game. No point spread.",
    q: "What is a moneyline?",
    a: "A bet on which team wins the game. There is no point spread. The NHL picks on this site are moneylines.",
  },
  median: {
    tip: "The middle price among the books I track. NHL picks are graded at that price.",
  },
  closing: {
    tip: "The last price before the game. Closing-line value is how far that price moved toward the pick after I posted it.",
  },
};
