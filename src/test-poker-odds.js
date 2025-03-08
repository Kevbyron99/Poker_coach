// Test file for poker-odds-calculator
const pokerOdds = require('poker-odds-calculator');
console.log("Loaded poker-odds-calculator:", pokerOdds);
console.log("Available exports:", Object.keys(pokerOdds));

try {
  const { Card, CardGroup, OddsCalculator } = pokerOdds;
  
  console.log("\nTesting Card class...");
  console.log("Card constructor:", Card);
  const aceSpades = new Card('A', 's');
  const kingHearts = new Card('K', 'h');
  console.log("Created cards:", aceSpades, kingHearts);

  console.log("\nTesting CardGroup class...");
  console.log("CardGroup constructor:", CardGroup);
  console.log("Creating CardGroup with:", [aceSpades, kingHearts]);
  
  // Create a new CardGroup and manually add each card
  const playerCards = new CardGroup();
  playerCards.push(aceSpades);
  playerCards.push(kingHearts);
  
  console.log("Created player cards group:", playerCards);
  console.log("playerCards instanceof CardGroup:", playerCards instanceof CardGroup);
  console.log("playerCards length:", playerCards.length);
  console.log("playerCards[0]:", playerCards[0]);
  console.log("playerCards[1]:", playerCards[1]);

  if (pokerOdds.FullDeckGame) {
    console.log("\nTesting FullDeckGame class...");
    const game = new pokerOdds.FullDeckGame();
    console.log("Created game:", game);
    
    // Check available methods on the game object
    console.log("Game methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(game)));
    
    // Try different methods to add player hand
    try {
      if (typeof game.addPlayer === 'function') {
        game.addPlayer(playerCards);
        console.log("Added player using addPlayer method");
      } else if (typeof game.addHand === 'function') {
        game.addHand(playerCards);
        console.log("Added player using addHand method");
      } else {
        console.log("No method found to add player hand to game");
      }
      
      console.log("\nCalculating odds...");
      const result = game.calculate();
      console.log("Calculation result:", result);
      
      // Try different ways to get equity
      if (result && result.players && result.players.length > 0) {
        console.log("Player equity:", result.players[0].equity);
      } else if (result && typeof result.getEquity === 'function') {
        console.log("Player equity (from getEquity):", result.getEquity());
      } else {
        console.log("Could not extract equity from result");
      }
    } catch (gameErr) {
      console.error("Error using FullDeckGame:", gameErr.message);
    }
  } else {
    console.log("\nFullDeckGame not available in this version");
  }

  console.log("\nTesting OddsCalculator class...");
  console.log("OddsCalculator constructor:", OddsCalculator);
  const calculator = new OddsCalculator();
  console.log("Created calculator:", calculator);
  calculator.setPlayerHand(playerCards);
  console.log("Set player hand");
  
  console.log("\nCalculating with OddsCalculator...");
  const calcResult = calculator.calculate();
  console.log("OddsCalculator result:", calcResult);
  
  console.log("\nAll tests passed!");
} catch (error) {
  console.error("Test failed:", error);
  console.error("Error details:", error.message);
  console.error("Error stack:", error.stack);
} 