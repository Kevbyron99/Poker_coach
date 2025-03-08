import React, { useState } from 'react';
import { calculateEquity } from 'poker-odds';
import './PokerCalculator.css';

function PokerCalculator() {
  // State variables
  const [player1Hand, setPlayer1Hand] = useState('');
  const [player2Hand, setPlayer2Hand] = useState('');
  const [communityCards, setCommunityCards] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Helper function to validate card format
  const validateCardInput = (cards) => {
    // Basic validation - cards should be in format like "Ah Kd" (Ace of hearts, King of diamonds)
    const cardPattern = /^(?:[2-9TJQKA][hdcs]( |$))+$/i;
    return cardPattern.test(cards.trim());
  };

  // Calculate poker odds
  const calculateOdds = () => {
    // Reset previous results and errors
    setResults(null);
    setError('');

    // Validate inputs
    if (!player1Hand || !player2Hand) {
      setError('Please enter hands for both players');
      return;
    }

    if (!validateCardInput(player1Hand) || !validateCardInput(player2Hand)) {
      setError('Invalid card format. Use format like "Ah Kd" (Ace of hearts, King of diamonds)');
      return;
    }

    // Format the input for the poker-odds library
    const player1Cards = player1Hand.trim().split(' ');
    const player2Cards = player2Hand.trim().split(' ');
    const board = communityCards ? communityCards.trim().split(' ') : [];

    try {
      // Calculate equity for both players
      const equity = calculateEquity([player1Cards, player2Cards], board);
      setResults(equity);
    } catch (err) {
      setError('Error calculating odds. Please check your inputs.');
      console.error(err);
    }
  };

  return (
    <div className="poker-calculator">
      <h2>Poker Odds Calculator</h2>
      
      <div className="input-group">
        <label>
          Player 1 Hand:
          <input 
            type="text" 
            value={player1Hand} 
            onChange={(e) => setPlayer1Hand(e.target.value)} 
            placeholder="e.g., Ah Kd" 
          />
        </label>
      </div>
      
      <div className="input-group">
        <label>
          Player 2 Hand:
          <input 
            type="text" 
            value={player2Hand} 
            onChange={(e) => setPlayer2Hand(e.target.value)} 
            placeholder="e.g., Jc Qc" 
          />
        </label>
      </div>
      
      <div className="input-group">
        <label>
          Community Cards (optional):
          <input 
            type="text" 
            value={communityCards} 
            onChange={(e) => setCommunityCards(e.target.value)} 
            placeholder="e.g., 2h 5c Td" 
          />
        </label>
      </div>
      
      <button onClick={calculateOdds}>Calculate Odds</button>
      
      {error && <div className="error">{error}</div>}
      
      {results && (
        <div className="results">
          <h3>Results:</h3>
          <p>Player 1 Win Probability: {(results[0] * 100).toFixed(2)}%</p>
          <p>Player 2 Win Probability: {(results[1] * 100).toFixed(2)}%</p>
          <p>Tie Probability: {((1 - results[0] - results[1]) * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default PokerCalculator; 