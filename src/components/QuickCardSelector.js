import React, { useState } from 'react';

const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = ['♠', '♥', '♣', '♦'];
const suitColors = {
  '♠': '#2c3e50',
  '♥': '#e74c3c',
  '♣': '#2c3e50',
  '♦': '#e74c3c'
};

function QuickCardSelector({ playerCards, communityCards, onSelectPlayerCard, onSelectCommunityCard }) {
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectingFor, setSelectingFor] = useState('player');

  const handleRankSelect = (rank) => {
    setSelectedRank(rank);
  };

  const handleSuitSelect = (suit) => {
    const card = selectedRank + suit;
    if (selectingFor === 'player' && playerCards.length < 2) {
      onSelectPlayerCard([...playerCards, card]);
    } else if (selectingFor === 'community' && communityCards.length < 5) {
      onSelectCommunityCard([...communityCards, card]);
    }
    setSelectedRank(null);
  };

  const isCardUsed = (card) => {
    return playerCards.includes(card) || communityCards.includes(card);
  };

  return (
    <div className="card-selection-interface">
      <div className="cards-display">
        {/* Player Cards Section */}
        <div className="cards-section">
          <div className="cards-section-header">Your Cards ({playerCards.length}/2)</div>
          <div className="cards-container">
            {playerCards.map((card, index) => (
              <div key={index} className={`card ${card[1].toLowerCase()}`}>
                {card}
              </div>
            ))}
            {[...Array(2 - playerCards.length)].map((_, index) => (
              <div key={`placeholder-${index}`} className="card card-placeholder">
                ?
              </div>
            ))}
          </div>
          <button 
            className="clear-button"
            onClick={() => onSelectPlayerCard([])}
          >
            Clear Your Cards
          </button>
        </div>

        {/* Community Cards Section */}
        <div className="cards-section">
          <div className="cards-section-header">Community Cards ({communityCards.length}/5)</div>
          <div className="cards-container">
            {communityCards.map((card, index) => (
              <div key={index} className={`card ${card[1].toLowerCase()}`}>
                {card}
              </div>
            ))}
            {[...Array(5 - communityCards.length)].map((_, index) => (
              <div key={`placeholder-${index}`} className="card card-placeholder">
                ?
              </div>
            ))}
          </div>
          <button 
            className="clear-button"
            onClick={() => onSelectCommunityCard([])}
          >
            Clear Community Cards
          </button>
        </div>
      </div>

      {/* Card Selection Controls */}
      <div className="card-controls">
        <div className="rank-buttons">
          {ranks.map(rank => (
            <button
              key={rank}
              className="rank-button"
              onClick={() => handleRankSelect(rank)}
            >
              {rank}
            </button>
          ))}
        </div>
        
        {selectedRank && (
          <div className="suit-buttons">
            {suits.map(suit => (
              <button
                key={suit}
                className="suit-button"
                onClick={() => handleSuitSelect(suit)}
                disabled={isCardUsed(selectedRank + suit)}
                style={{ color: suitColors[suit] }}
              >
                {suit}
              </button>
            ))}
            <button 
              className="suit-button"
              onClick={() => setSelectedRank(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickCardSelector; 