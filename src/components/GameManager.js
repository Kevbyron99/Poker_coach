import React, { useState } from 'react';
import './GameManager.css';

function GameManager({ onGameCreated }) {
  const [gameDetails, setGameDetails] = useState({
    tableName: '',
    players: 2,
    playerPosition: 0,
    smallBlind: 1,
    bigBlind: 2,
    startingChips: 200,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGameDetails({
      ...gameDetails,
      [name]: name === 'players' || name === 'playerPosition' || name === 'smallBlind' || name === 'bigBlind' || name === 'startingChips' 
        ? parseInt(value, 10) 
        : value
    });
  };

  const handleSubmit = (e, isTraining = false) => {
    e.preventDefault();
    if (isTraining) {
      // Training game functionality to be added later
      console.log('Training game selected:', gameDetails);
      return;
    }
    onGameCreated(gameDetails);
  };

  return (
    <div className="game-manager">
      <div className="game-creation-form">
        <h3>Create New Game</h3>
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="form-group">
            <label htmlFor="tableName">Table Name</label>
            <input
              type="text"
              id="tableName"
              name="tableName"
              value={gameDetails.tableName}
              onChange={handleInputChange}
              placeholder="e.g., PokerStars Table #1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="players">Number of Players</label>
            <select
              id="players"
              name="players"
              value={gameDetails.players}
              onChange={handleInputChange}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="playerPosition">Your Position (Seat #)</label>
            <select
              id="playerPosition"
              name="playerPosition"
              value={gameDetails.playerPosition}
              onChange={handleInputChange}
            >
              {Array.from({ length: gameDetails.players }, (_, i) => (
                <option key={i} value={i}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startingChips">Starting Chips ($)</label>
            <input
              type="number"
              id="startingChips"
              name="startingChips"
              value={gameDetails.startingChips}
              onChange={handleInputChange}
              min="1"
              step="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="smallBlind">Small Blind ($)</label>
            <input
              type="number"
              id="smallBlind"
              name="smallBlind"
              value={gameDetails.smallBlind}
              onChange={handleInputChange}
              min="0"
              step="0.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bigBlind">Big Blind ($)</label>
            <input
              type="number"
              id="bigBlind"
              name="bigBlind"
              value={gameDetails.bigBlind}
              onChange={handleInputChange}
              min="0"
              step="0.5"
            />
          </div>

          <div className="game-buttons">
            <button type="submit" className="game-btn">Start New Game</button>
            <button type="button" className="game-btn" onClick={(e) => handleSubmit(e, true)}>Start Training Game</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameManager; 