import React, { useState } from 'react';
import './CardSelector.css';

function CardSelector({ onCardsSelected, maxCards, label, selectedCards = [], disabledCards = [] }) {
  // Only use local state for the modal visibility, not for card selection
  const [showSelector, setShowSelector] = useState(false);
  
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const suits = ['h', 'd', 'c', 's'];
  const suitSymbols = {
    'h': '♥',
    'd': '♦',
    'c': '♣',
    's': '♠'
  };
  const suitColors = {
    'h': 'red',
    'd': 'red',
    'c': 'black',
    's': 'black'
  };

  function debugCardFormat(card) {
    console.log(`Card debug - raw card: "${card}"`);
    if (card && card.length >= 2) {
      console.log(`Card debug - value: "${card[0]}", suit: "${card[1]}"`);
    }
    return card;
  }

  const toggleCard = (card) => {
    console.log("Card selected:", card);
    debugCardFormat(card);
    
    // Check if card is disabled (already selected in another hand)
    if (disabledCards.includes(card)) {
      console.log("Card is disabled, can't select");
      return;
    }
    
    let newSelectedCards;
    if (selectedCards.includes(card)) {
      // Remove card if already selected
      newSelectedCards = selectedCards.filter(c => c !== card);
    } else if (selectedCards.length < maxCards) {
      // Add card if not at max
      newSelectedCards = [...selectedCards, card];
    } else {
      // At max cards, don't add
      return;
    }
    
    // Pass the new selection back to parent
    onCardsSelected(newSelectedCards);
  };

  const handleDone = () => {
    setShowSelector(false);
  };

  const handleClear = () => {
    // Tell parent to clear cards
    onCardsSelected([]);
  };

  return (
    <div className="card-selector-container">
      <div className="selected-cards-display" onClick={() => setShowSelector(true)}>
        <span className="cards-label">{label}:</span>
        {selectedCards.length > 0 ? (
          <div className="selected-cards">
            {selectedCards.map((card, index) => {
              const rank = card[0];
              const suit = card[1];
              return (
                <div 
                  key={index} 
                  className="card-display"
                  style={{ color: suitColors[suit] }}
                >
                  {rank}{suitSymbols[suit]}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-cards">Click to select cards</div>
        )}
      </div>
      
      {showSelector && (
        <div className="card-selection-modal">
          <div className="card-selection-panel">
            <h3>{label} Selection</h3>
            <p>Select up to {maxCards} cards</p>
            
            <div className="card-grid">
              {ranks.map(rank => (
                suits.map(suit => {
                  const card = `${rank}${suit}`;
                  const isSelected = selectedCards.includes(card);
                  const isDisabled = disabledCards.includes(card);
                  
                  return (
                    <div 
                      key={card} 
                      className={`card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      style={{ color: suitColors[suit] }}
                      onClick={() => !isDisabled && toggleCard(card)}
                    >
                      {rank}{suitSymbols[suit]}
                    </div>
                  );
                })
              ))}
            </div>
            
            <div className="selection-actions">
              <button className="clear-btn" onClick={handleClear}>Clear</button>
              <button className="done-btn" onClick={handleDone}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardSelector; 