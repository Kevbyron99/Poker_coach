import React, { useState, useEffect } from 'react';
import { Hand } from 'pokersolver';
import './PokerAssistant.css';

import GameManager from './GameManager';
import CardSelector from './CardSelector';
import AIAdvice from './AIAdvice';
import HandRankings from './HandRankings';
import GameStateTracker from './GameStateTracker';

// Preflop starting hand strength ratings (percentage chance of winning)
// Higher numbers = stronger starting hands
const preflopHandStrength = {
  // Pairs
  'AA': 85, 'KK': 82, 'QQ': 80, 'JJ': 78, 'TT': 75, 
  '99': 72, '88': 69, '77': 66, '66': 63, '55': 60,
  '44': 57, '33': 54, '22': 51,
  
  // Ace high
  'AK': 67, 'AQ': 66, 'AJ': 65, 'AT': 64, 'A9': 60, 'A8': 60, 'A7': 59,
  'A6': 58, 'A5': 58, 'A4': 57, 'A3': 56, 'A2': 55,
  
  // King high
  'KQ': 63, 'KJ': 62, 'KT': 61, 'K9': 58, 'K8': 56, 'K7': 55,
  'K6': 54, 'K5': 53, 'K4': 52, 'K3': 51, 'K2': 50,
  
  // Queen high
  'QJ': 59, 'QT': 58, 'Q9': 55, 'Q8': 53, 'Q7': 52,
  'Q6': 51, 'Q5': 50, 'Q4': 49, 'Q3': 48, 'Q2': 47,
  
  // Jack high
  'JT': 57, 'J9': 54, 'J8': 51, 'J7': 50,
  'J6': 48, 'J5': 47, 'J4': 46, 'J3': 45, 'J2': 44,
  
  // Ten high
  'T9': 53, 'T8': 50, 'T7': 48, 'T6': 46,
  'T5': 45, 'T4': 44, 'T3': 43, 'T2': 42,
  
  // Nine high and below
  '98': 48, '97': 46, '96': 44, '95': 43, '94': 41, '93': 40, '92': 39,
  '87': 45, '86': 43, '85': 41, '84': 40, '83': 39, '82': 38,
  '76': 42, '75': 40, '74': 39, '73': 38, '72': 36,
  '65': 39, '64': 38, '63': 36, '62': 35,
  '54': 37, '53': 35, '52': 34,
  '43': 34, '42': 33,
  '32': 32
};

// Adjust preflop strength based on whether cards are suited
function getPreflopStrength(card1, card2) {
  try {
    if (!card1 || !card2 || card1.length < 2 || card2.length < 2) {
      return 30; // Default strength for invalid cards
    }
    
    // Extract the rank (first character) and suit (second character)
    const rank1 = card1[0].toUpperCase();
    const rank2 = card2[0].toUpperCase();
    const suit1 = card1[1].toLowerCase();
    const suit2 = card2[1].toLowerCase();
    
    // Check if the hand is a pair
    const isPair = rank1 === rank2;
    
    // Check if the hand is suited (same suit)
    const isSuited = suit1 === suit2;
    
    console.log(`Hand: ${rank1}${suit1}, ${rank2}${suit2}, Paired: ${isPair}, Suited: ${isSuited}`);
    
    // Sort the ranks to get the hand key (e.g., "AK" for A and K)
    // Custom sort function to handle poker card ranks
    const sortedRanks = [rank1, rank2].sort((a, b) => {
      const rankOrder = {'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2};
      return rankOrder[b] - rankOrder[a];
    });
    
    const rankSorted = sortedRanks.join('');
    
    // Look up the strength from our preflop chart
    let strength = preflopHandStrength[rankSorted] || 30;
    
    // Adjust strength based on pair/suited status
    if (isPair) {
      // Pairs are already accounted for in the chart
    } else if (isSuited) {
      strength += 3; // Suited hands are stronger
      console.log(`${rankSorted} is suited, adding 3 points`);
    } else {
      console.log(`${rankSorted} is not suited`);
    }
    
    console.log("Preflop hand strength:", strength);
    return strength;
  } catch (error) {
    console.error("Error calculating preflop strength:", error);
    return 30; // Default fallback
  }
}

function PokerAssistant() {
  const [gameDetails, setGameDetails] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [trainingMessage, setTrainingMessage] = useState(null);
  const [gameState, setGameState] = useState({
    potSize: 0,
    playerStacks: {},
    currentBets: {},
    betToCall: 0
  });

  // Calculate odds when cards change
  useEffect(() => {
    calculateOdds();
  }, [playerCards, communityCards]);

  const handleGameCreated = (details) => {
    setGameDetails(details);
    // Reset everything else
    setPlayerCards([]);
    setCommunityCards([]);
    setResults(null);
    setError('');
  };

  const handlePlayerCardsSelected = (cards) => {
    console.log("Player cards selected:", cards);
    setPlayerCards(cards);
  };

  const handleCommunityCardsSelected = (cards) => {
    console.log("Community cards selected:", cards);
    setCommunityCards(cards);
  };

  const calculateOdds = () => {
    // Only calculate if we have player cards
    if (!playerCards || playerCards.length < 2) {
      setResults(null);
      return;
    }

    try {
      console.log("=============================================");
      console.log("DETAILED DEBUGGING FOR ODDS CALCULATION");
      console.log("Player cards:", playerCards);
      console.log("Community cards:", communityCards);
      
      // Special case for preflop (no community cards)
      if (communityCards.length === 0) {
        console.log("Preflop evaluation...");
        
        // Get preflop strength
        const strength = getPreflopStrength(playerCards[0], playerCards[1]);
        console.log("Preflop hand strength:", strength);
        
        // Normalize to a percentage
        const normalizedStrength = strength / 100;
        
        // Create equity calculation
        const preflopEquity = [normalizedStrength, 1 - normalizedStrength];
        console.log("Preflop equity:", preflopEquity);
        
        setResults(preflopEquity);
        setError('Using preflop hand strength chart.');
        return; // Exit early
      }
      
      // Use the pokersolver library for hand evaluation
      try {
        console.log("Using pokersolver for hand evaluation...");
        
        // Convert cards to pokersolver format (e.g., "As", "Td", etc.)
        const formatPokerSolverCard = (card) => {
          if (!card || card.length < 2) return null;
          
          // Map our values to pokersolver values
          const valueMap = {
            'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': 'T', '10': 'T',
            '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
          };
          
          // Map our suits to pokersolver suits
          const suitMap = {
            's': 's', 'h': 'h', 'd': 'd', 'c': 'c',
            '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'
          };
          
          const value = valueMap[card[0].toUpperCase()] || card[0];
          const suit = suitMap[card[1].toLowerCase()] || card[1];
          
          return value + suit;
        };
        
        const pokerSolverPlayerCards = playerCards
          .map(formatPokerSolverCard)
          .filter(Boolean);
          
        const pokerSolverCommunityCards = communityCards
          .map(formatPokerSolverCard)
          .filter(Boolean);
        
        console.log("PokeSolver player cards:", pokerSolverPlayerCards);
        console.log("PokerSolver community cards:", pokerSolverCommunityCards);
        
        if (pokerSolverPlayerCards.length < 2) {
          throw new Error("Need two valid player cards for PokeSolver");
        }
        
        // Combine player cards and community cards
        const allCards = [...pokerSolverPlayerCards, ...pokerSolverCommunityCards];
        
        // If we have at least 5 cards (2 player + 3 community), we can evaluate the hand
        if (allCards.length >= 5) {
          // Evaluate the player's hand
          const playerHand = Hand.solve(allCards);
          console.log("Player hand evaluation:", playerHand);
          
          // We can't calculate exact win probabilities with just pokersolver,
          // but we can estimate based on hand strength
          const handName = playerHand.name;
          console.log("Hand name:", handName);
          
          // Simplified hand strength based on hand type
          const handStrengthMap = {
            'Royal Flush': 0.95,
            'Straight Flush': 0.9,
            'Four of a Kind': 0.85,
            'Full House': 0.8,
            'Flush': 0.75,
            'Straight': 0.65,
            'Three of a Kind': 0.5,
            'Two Pair': 0.4,
            'Pair': 0.3,
            'High Card': 0.2
          };
          
          // Get the hand strength based on the hand type
          const handStrength = handStrengthMap[handName] || 0.2; // Default to High Card
          console.log("Hand strength based on type:", handStrength);
          
          // Adjust based on the specific cards in the hand
          // For example, a pair of aces is stronger than a pair of twos
          let adjustedStrength = handStrength;
          
          // Get the rank of the primary cards in the hand
          const rankValue = playerHand.rank;
          console.log("Hand rank value:", rankValue);
          
          // Adjust strength based on rank (higher rank = stronger hand)
          // This is a simplified adjustment
          if (rankValue > 6) {
            adjustedStrength += 0.05; // Boost for high cards
          } else if (rankValue < 3) {
            adjustedStrength -= 0.05; // Penalty for low cards
          }
          
          console.log("Adjusted hand strength:", adjustedStrength);
          
          // Create equity calculation
          const equity = [adjustedStrength, 1 - adjustedStrength];
          console.log("Final equity calculation:", equity);
          
          setResults(equity);
          setError('Using hand type evaluation.');
          return; // Exit early
        } else {
          throw new Error("Need at least 5 cards for hand evaluation");
        }
      } catch (pokerSolverError) {
        console.error("PokeSolver approach failed:", pokerSolverError);
        throw pokerSolverError; // Re-throw to hit our fallback
      }
      
    } catch (err) {
      console.error("==========================================");
      console.error("ODDS CALCULATION FAILED");
      console.error("Error type:", err.constructor.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.error("==========================================");
      
      // Use the fallback evaluator
      const strength = evaluateHandStrength(playerCards, communityCards);
      console.log("Using fallback evaluation. Hand strength:", strength);
      
      // Create a fallback equity calculation
      const fallbackEquity = [strength / 100, 1 - (strength / 100)];
      setResults(fallbackEquity);
      
      setError('Using simplified hand evaluation. Odds are approximate.');
    }
  };
  
  // Improve the fallback hand strength evaluator
  const evaluateHandStrength = (playerCards, communityCards) => {
    // Combine all cards
    const allCards = [...playerCards, ...communityCards];
    
    // Early exit for insufficient cards
    if (playerCards.length === 0) return 0;
    
    // Extract suits and values for analysis
    const suits = allCards.map(card => card[1].toLowerCase());
    const values = allCards.map(card => card[0].toLowerCase());
    
    // Card value mapping (2 is lowest, Ace is highest)
    const cardValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
      't': 10, 'j': 11, 'q': 12, 'k': 13, 'a': 14
    };
    
    // Get numeric values of cards
    const numericValues = values.map(v => cardValues[v] || parseInt(v) || 0);
    
    // Count suits for flush detection
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    
    // Count values for pairs, trips, etc.
    const valueCounts = {};
    values.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // Check for flush
    const hasFlush = Object.values(suitCounts).some(count => count >= 5);
    
    // Check for straight (five consecutive values)
    const uniqueValues = [...new Set(numericValues)].sort((a, b) => a - b);
    let hasStraight = false;
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
        hasStraight = true;
        break;
      }
    }
    // Special case for A-5 straight (Ace can be low)
    if (!hasStraight && uniqueValues.includes(14)) {
      // Temporarily treat Ace as 1 and check again
      const lowAceValues = [...uniqueValues.filter(v => v !== 14), 1].sort((a, b) => a - b);
      for (let i = 0; i <= lowAceValues.length - 5; i++) {
        if (lowAceValues[i + 4] - lowAceValues[i] === 4) {
          hasStraight = true;
          break;
        }
      }
    }
    
    // Check for pairs, trips, quads
    const pairs = Object.values(valueCounts).filter(count => count === 2).length;
    const trips = Object.values(valueCounts).filter(count => count === 3).length;
    const quads = Object.values(valueCounts).filter(count => count === 4).length;
    
    // Check for full house
    const hasFullHouse = (trips >= 1 && pairs >= 1) || trips >= 2;
    
    // Check for flush straight
    const straightFlush = hasFlush && hasStraight;
    
    // Determine hand category and assign strength
    let strength = 20; // Base strength for high card
    
    // High card strength based on highest card in player's hand
    const playerCardValues = playerCards.map(card => 
      cardValues[card[0].toLowerCase()] || parseInt(card[0]) || 0
    );
    const highestPlayerCard = Math.max(...playerCardValues);
    
    // Adjust strength based on hand category
    if (straightFlush) {
      strength = 95; // Nearly unbeatable
    } else if (quads > 0) {
      strength = 90; // Four of a kind
    } else if (hasFullHouse) {
      strength = 85; // Full house
    } else if (hasFlush) {
      strength = 80; // Flush
    } else if (hasStraight) {
      strength = 75; // Straight
    } else if (trips > 0) {
      strength = 70; // Three of a kind
    } else if (pairs >= 2) {
      strength = 65; // Two pair
    } else if (pairs === 1) {
      strength = 50; // One pair
    } else {
      // High card only - adjust based on card value
      strength = 20 + ((highestPlayerCard - 2) * 2);
    }
    
    // Adjust for position in the hand (more community cards = more certainty)
    // Early in the hand, be more conservative
    if (communityCards.length <= 3) {
      strength = strength * 0.9; // Reduce strength estimate pre-turn
    }
    
    // Cap strength between 1% and 95%
    return Math.max(1, Math.min(strength, 95));
  };

  const clearCards = () => {
    console.log("Clearing cards");
    setPlayerCards([]);
    setCommunityCards([]);
    setResults(null);
  }

  const resetGame = () => {
    console.log("Resetting game");
    setGameDetails(null);
    setPlayerCards([]);
    setCommunityCards([]);
    setResults(null);
    setError('');
  }

  const updatePlayerCount = (changeAmount) => {
    if (!gameDetails) return;
    
    // Ensure we don't go below 2 players or above 10
    const newPlayerCount = Math.max(2, Math.min(10, gameDetails.players + changeAmount));
    
    if (newPlayerCount === gameDetails.players) return;
    
    // Adjust position if needed
    let newPosition = gameDetails.playerPosition;
    if (newPosition >= newPlayerCount) {
      newPosition = newPlayerCount - 1; // Move to last position if current position is removed
    }
    
    setGameDetails({
      ...gameDetails,
      players: newPlayerCount,
      playerPosition: newPosition
    });
  };

  // Add handler for training game button
  const handleTrainingGameClick = () => {
    setTrainingMessage("Training mode functionality coming soon!");
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setTrainingMessage(null);
    }, 3000);
  };

  const handleGameStateUpdate = (newState) => {
    console.log("Game state updated:", newState);
    setGameState(newState);
  };

  return (
    <div className="poker-assistant">
      <h2>Poker Game Assistant</h2>
      
      {!gameDetails ? (
        // Landing page layout - without hand rankings
        <div className="landing-page">
          <div className="buttons-container">
            <GameManager onGameCreated={handleGameCreated} />
            <button 
              className="training-game-btn" 
              onClick={handleTrainingGameClick}
            >
              Start Training Game
            </button>
          </div>
          
          {trainingMessage && (
            <div className="training-message">
              {trainingMessage}
            </div>
          )}
        </div>
      ) : (
        // Game view - three-column layout
        <div className="game-view">
          {/* Left sidebar with hand rankings */}
          <div className="left-sidebar">
            <HandRankings />
          </div>
          
          {/* Main content with game tracking */}
          <div className="main-content">
            <div className="game-container">
              <div className="game-header">
                <h3>{gameDetails.tableName || 'Poker Table'}</h3>
                <div className="game-info">
                  <span>Players: {gameDetails.players}</span>
                  <div className="player-controls">
                    <button onClick={() => updatePlayerCount(-1)} disabled={gameDetails.players <= 2}>Player Left</button>
                    <button onClick={() => updatePlayerCount(1)} disabled={gameDetails.players >= 10}>Player Joined</button>
                  </div>
                  <span>Your Position: {gameDetails.playerPosition + 1}</span>
                  <span>SB/BB: ${gameDetails.smallBlind}/${gameDetails.bigBlind}</span>
                </div>
                <div className="game-controls">
                  <button className="next-hand-btn" onClick={clearCards}>Clear Hand</button>
                  <button className="reset-game-btn" onClick={resetGame}>Start New Game</button>
                </div>
              </div>
              
              {/* Game state tracker */}
              <GameStateTracker 
                gameDetails={gameDetails}
                onGameStateUpdate={handleGameStateUpdate}
                playerCount={gameDetails.players}
                playerCards={playerCards}
                communityCards={communityCards}
                onSelectPlayerCard={handlePlayerCardsSelected}
                onSelectCommunityCard={handleCommunityCardsSelected}
              />
              
              {/* Card selectors */}
              <div className="card-selectors">
                <CardSelector 
                  label="Your Hand"
                  maxCards={2}
                  onCardsSelected={handlePlayerCardsSelected}
                  selectedCards={playerCards}
                  disabledCards={[]}
                />
                
                <CardSelector 
                  label="Community Cards"
                  maxCards={5}
                  onCardsSelected={handleCommunityCardsSelected}
                  selectedCards={communityCards}
                  disabledCards={playerCards}
                />
              </div>
              
              {/* Error message */}
              {error && <div className="error">{error}</div>}
              
              {/* Win probabilities */}
              {results && (
                <div className="results">
                  <h3>Win Probabilities:</h3>
                  <div className="probability-table">
                    <div className="probability-row header">
                      <div className="player-name">Player</div>
                      <div className="win-probability">Win %</div>
                    </div>
                    <div className="probability-row you">
                      <div className="player-name">You</div>
                      <div className="win-probability">{(results[0] * 100).toFixed(2)}%</div>
                    </div>
                    <div className="probability-row">
                      <div className="player-name">Opponents (Random)</div>
                      <div className="win-probability">{(results[1] * 100).toFixed(2)}%</div>
                    </div>
                    {/* Calculate tie probability */}
                    <div className="probability-row tie">
                      <div className="player-name">Tie</div>
                      <div className="win-probability">
                        {(100 - (results[0] + results[1]) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right sidebar with AI advice */}
          <div className="right-sidebar">
            <AIAdvice 
              gameDetails={gameDetails}
              playerCards={playerCards}
              communityCards={communityCards}
              odds={results}
              gameState={gameState}
              onClearCards={clearCards}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PokerAssistant; 