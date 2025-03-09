import React, { useState, useEffect } from 'react';
import './CardSelector.css';
import './SmartCardSelector.css';

function SmartCardSelector({ 
  onPlayerCardsSelected, 
  onCommunityCardsSelected, 
  playerCards = [], 
  communityCards = [] 
}) {
  const [showSelector, setShowSelector] = useState(false);
  const [allSelectedCards, setAllSelectedCards] = useState([...playerCards, ...communityCards]);
  
  // Maximum number of cards for each category
  const MAX_PLAYER_CARDS = 2;
  const MAX_COMMUNITY_CARDS = 5;
  
  // Handle changes in props
  useEffect(() => {
    setAllSelectedCards([...playerCards, ...communityCards]);
  }, [playerCards, communityCards]);
  
  // Organize cards in a more intuitive way for poker
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
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

  const toggleCard = (card) => {
    console.log("Card selected:", card);
    
    let newAllSelected;
    
    // If card is already selected, remove it
    if (allSelectedCards.includes(card)) {
      newAllSelected = allSelectedCards.filter(c => c !== card);
    } else {
      // If we have room for more cards, add it
      if (allSelectedCards.length < (MAX_PLAYER_CARDS + MAX_COMMUNITY_CARDS)) {
        newAllSelected = [...allSelectedCards, card];
      } else {
        // At max cards, don't add
        return;
      }
    }
    
    setAllSelectedCards(newAllSelected);
    
    // Distribute cards between player and community
    const newPlayerCards = newAllSelected.slice(0, Math.min(newAllSelected.length, MAX_PLAYER_CARDS));
    const newCommunityCards = newAllSelected.slice(
      Math.min(newAllSelected.length, MAX_PLAYER_CARDS), 
      Math.min(newAllSelected.length, MAX_PLAYER_CARDS + MAX_COMMUNITY_CARDS)
    );
    
    // Update parent components
    onPlayerCardsSelected(newPlayerCards);
    onCommunityCardsSelected(newCommunityCards);
  };
  
  // Function to reset all cards
  const resetAllCards = () => {
    setAllSelectedCards([]);
    onPlayerCardsSelected([]);
    onCommunityCardsSelected([]);
  };

  const handleDone = () => {
    setShowSelector(false);
  };

  const handleClear = () => {
    setAllSelectedCards([]);
    onPlayerCardsSelected([]);
    onCommunityCardsSelected([]);
  };

  // Calculate remaining cards
  const remainingPlayerCards = MAX_PLAYER_CARDS - playerCards.length;
  const remainingCommunityCards = MAX_COMMUNITY_CARDS - communityCards.length;

  return (
    <div className="card-selector-container smart-selector">
      {/* Simplified display of selected cards */}
      <div className="card-summary">
        <div className="player-cards-summary">
          <span className="summary-label">Your Hand:</span>
          <div className="summary-cards">
            {playerCards.length > 0 ? 
              playerCards.map((card, i) => (
                <span key={i} 
                  className="card-pill" 
                  style={{color: suitColors[card[1]]}}
                >
                  {card[0]}{suitSymbols[card[1]]}
                </span>
              )) : 
              <span className="empty-selection">No cards</span>
            }
          </div>
        </div>
        <div className="community-cards-summary">
          <span className="summary-label">Community:</span>
          <div className="summary-cards">
            {communityCards.length > 0 ? 
              communityCards.map((card, i) => (
                <span key={i} 
                  className="card-pill" 
                  style={{color: suitColors[card[1]]}}
                >
                  {card[0]}{suitSymbols[card[1]]}
                </span>
              )) : 
              <span className="empty-selection">No cards</span>
            }
          </div>
        </div>
      </div>
      
      {/* Quick Selection Button */}
      <button className="quick-select-btn" onClick={() => setShowSelector(true)}>
        Select Cards
      </button>
      
      {/* Card Selection Modal - Simplified for Speed */}
      {showSelector && (
        <div className="card-selection-modal">
          <div className="card-selection-panel">
            <div className="selection-header">
              <h3>Quick Card Selection</h3>
              <div className="selection-counter">
                <div className="counter-pill player-counter">
                  Hand: {playerCards.length}/{MAX_PLAYER_CARDS}
                </div>
                <div className="counter-pill community-counter">
                  Community: {communityCards.length}/{MAX_COMMUNITY_CARDS}
                </div>
              </div>
            </div>
            
            <div className="quick-selection-explanation">
              First {MAX_PLAYER_CARDS} cards = Your Hand • Next {MAX_COMMUNITY_CARDS} = Community
            </div>
            
            <div className="rapid-card-grid">
              {ranks.map(rank => (
                <div key={rank} className="rank-group">
                  {suits.map(suit => {
                    const card = `${rank}${suit}`;
                    const isSelected = allSelectedCards.includes(card);
                    const isPlayerCard = playerCards.includes(card);
                    const isCommunityCard = communityCards.includes(card);
                    
                    // Determine card class based on selection type
                    let cardClass = "rapid-card";
                    if (isPlayerCard) cardClass += " player-card";
                    if (isCommunityCard) cardClass += " community-card";
                    if (isSelected) cardClass += " selected";
                    
                    return (
                      <div 
                        key={`${rank}${suit}`} 
                        className={cardClass}
                        style={{ color: suitColors[suit] }}
                        onClick={() => toggleCard(card)}
                      >
                        {rank}{suitSymbols[suit]}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="selection-actions">
              <button className="clear-btn" onClick={handleClear}>Clear All</button>
              <button className="done-btn" onClick={handleDone}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartCardSelector; 