import React, { useState, useEffect, useCallback } from 'react';
import './GameStateTracker.css';

// Create a more efficient card selection component
function QuickCardSelector({ 
  playerCards,
  communityCards, 
  onSelectPlayerCard, 
  onSelectCommunityCard 
}) {
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectingFor, setSelectingFor] = useState('player'); // 'player' or 'community'
  
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['s', 'h', 'd', 'c'];
  const suitSymbols = {'s': '♠', 'h': '♥', 'd': '♦', 'c': '♣'};
  const suitColors = {'s': 'black', 'h': 'red', 'd': 'red', 'c': 'black'};
  
  // Determine which cards are already used
  const usedCards = [...playerCards, ...communityCards];
  
  // Handle rank selection
  const handleRankSelect = (rank) => {
    setSelectedRank(rank);
  };
  
  // Handle suit selection after rank is selected
  const handleSuitSelect = (suit) => {
    if (!selectedRank) return;
    
    const card = `${selectedRank}${suit}`;
    
    // Check if card is already used
    if (usedCards.includes(card)) {
      // If the card is in the current selection type, remove it
      if (selectingFor === 'player' && playerCards.includes(card)) {
        onSelectPlayerCard(playerCards.filter(c => c !== card));
      } else if (selectingFor === 'community' && communityCards.includes(card)) {
        onSelectCommunityCard(communityCards.filter(c => c !== card));
      }
    } else {
      // Add the card to the appropriate selection
      if (selectingFor === 'player') {
        // If we already have 2 player cards, replace the oldest one
        if (playerCards.length >= 2) {
          onSelectPlayerCard([playerCards[1], card]);
        } else {
          onSelectPlayerCard([...playerCards, card]);
        }
      } else {
        // If we already have 5 community cards, replace the oldest one
        if (communityCards.length >= 5) {
          onSelectCommunityCard([...communityCards.slice(1), card]);
        } else {
          onSelectCommunityCard([...communityCards, card]);
        }
      }
    }
    
    // Reset selected rank after selection
    setSelectedRank(null);
  };
  
  // Clear player cards
  const clearPlayerCards = () => {
    onSelectPlayerCard([]);
  };
  
  // Clear community cards
  const clearCommunityCards = () => {
    onSelectCommunityCard([]);
  };

  return (
    <div className="card-selector-container">
      {/* Display both card sections */}
      <div className="card-sections">
        {/* Player Cards Section */}
        <div className="card-section">
          <div className="section-header">
            <h4>Your Cards ({playerCards.length}/2)</h4>
            <button className="clear-btn" onClick={clearPlayerCards}>Clear</button>
          </div>
          <div className="card-display">
            {playerCards.map((card, index) => (
              <div 
                key={index} 
                className="card-display-item" 
                style={{ color: suitColors[card[1]] }}
              >
                {card[0]}{suitSymbols[card[1]]}
              </div>
            ))}
            {playerCards.length < 2 && (
              [...Array(2 - playerCards.length)].map((_, i) => (
                <div key={`empty-player-${i}`} className="card-display-empty">
                  ?
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Community Cards Section */}
        <div className="card-section">
          <div className="section-header">
            <h4>Community Cards ({communityCards.length}/5)</h4>
            <button className="clear-btn" onClick={clearCommunityCards}>Clear</button>
          </div>
          <div className="card-display">
            {communityCards.map((card, index) => (
              <div 
                key={index} 
                className="card-display-item" 
                style={{ color: suitColors[card[1]] }}
              >
                {card[0]}{suitSymbols[card[1]]}
              </div>
            ))}
            {communityCards.length < 5 && (
              [...Array(5 - communityCards.length)].map((_, i) => (
                <div key={`empty-community-${i}`} className="card-display-empty">
                  ?
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Selection controls */}
      <div className="card-selection-controls">
        <div className="selection-toggle">
          <button 
            className={`toggle-btn ${selectingFor === 'player' ? 'active' : ''}`}
            onClick={() => setSelectingFor('player')}
          >
            Select Your Cards
          </button>
          <button 
            className={`toggle-btn ${selectingFor === 'community' ? 'active' : ''}`}
            onClick={() => setSelectingFor('community')}
          >
            Select Community Cards
          </button>
        </div>
        
        {/* Rank selection */}
        <div className="rank-selector">
          {ranks.map(rank => (
            <button 
              key={rank} 
              className="rank-btn"
              onClick={() => handleRankSelect(rank)}
            >
              {rank}
            </button>
          ))}
        </div>
        
        {/* Suit selection */}
        {selectedRank && (
          <div className="suit-selector">
            {suits.map(suit => (
              <button
                key={suit}
                className="suit-btn"
                style={{ color: suitColors[suit] }}
                onClick={() => handleSuitSelect(suit)}
                disabled={usedCards.includes(`${selectedRank}${suit}`)}
              >
                {suitSymbols[suit]}
              </button>
            ))}
            <button className="cancel-btn" onClick={() => setSelectedRank(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GameStateTracker({ gameDetails, onGameStateUpdate, playerCount, playerCards = [], communityCards = [], onSelectPlayerCard, onSelectCommunityCard }) {
  const [potSize, setPotSize] = useState(gameDetails?.bigBlind * 1.5 || 0);
  const [playerStacks, setPlayerStacks] = useState(() => {
    // Initialize player stacks based on player count
    const stacks = {};
    // Use the starting chips value if provided, otherwise calculate a default
    const defaultStack = gameDetails?.startingChips || 100 * (gameDetails?.bigBlind || 2);
    
    for (let i = 0; i < (playerCount || 6); i++) {
      stacks[i] = defaultStack;
    }
    return stacks;
  });
  
  // Track blind positions (initial values from game setup)
  const [blindPositions, setBlindPositions] = useState({
    smallBlind: 0, // Default: first player is SB
    bigBlind: 1,   // Default: second player is BB
  });
  
  // Track blind levels
  const [blindLevels, setBlindLevels] = useState([
    { smallBlind: gameDetails?.smallBlind || 1, bigBlind: gameDetails?.bigBlind || 2 },
    { smallBlind: (gameDetails?.smallBlind || 1) * 2, bigBlind: (gameDetails?.bigBlind || 2) * 2 },
    { smallBlind: (gameDetails?.smallBlind || 1) * 4, bigBlind: (gameDetails?.bigBlind || 2) * 4 },
    { smallBlind: (gameDetails?.smallBlind || 1) * 8, bigBlind: (gameDetails?.bigBlind || 2) * 8 },
    { smallBlind: (gameDetails?.smallBlind || 1) * 16, bigBlind: (gameDetails?.bigBlind || 2) * 16 },
  ]);
  
  // Current blind level index
  const [currentBlindLevel, setCurrentBlindLevel] = useState(0);
  
  // Current blind values
  const [currentBlinds, setCurrentBlinds] = useState({
    smallBlind: gameDetails?.smallBlind || 1,
    bigBlind: gameDetails?.bigBlind || 2
  });
  
  // Track the current active player (whose turn it is)
  const [activePlayer, setActivePlayer] = useState(
    // Start with player after big blind
    (blindPositions.bigBlind + 1) % playerCount
  );
  
  // Track player actions in the current street
  const [playerActions, setPlayerActions] = useState(() => {
    const actions = {};
    for (let i = 0; i < (playerCount || 6); i++) {
      actions[i] = null; // null means no action yet
    }
    return actions;
  });
  
  // Track players who have folded
  const [foldedPlayers, setFoldedPlayers] = useState([]);
  
  // Track the current street (preflop, flop, turn, river)
  const [currentStreet, setCurrentStreet] = useState('preflop');
  
  // Track the current bet amount in this round
  const [currentBetAmount, setCurrentBetAmount] = useState(currentBlinds.bigBlind);
  
  const [currentBets, setCurrentBets] = useState(() => {
    const bets = {};
    for (let i = 0; i < (playerCount || 6); i++) {
      bets[i] = 0;
    }
    // Set initial blinds
    if (gameDetails) {
      bets[blindPositions.smallBlind] = currentBlinds.smallBlind; // Small blind
      bets[blindPositions.bigBlind] = currentBlinds.bigBlind;   // Big blind
    }
    return bets;
  });
  
  const [betToCall, setBetToCall] = useState(currentBlinds.bigBlind);
  
  // Add a state for custom raise amounts
  const [customRaiseAmounts, setCustomRaiseAmounts] = useState({});
  
  // Handle custom raise amount change
  const handleRaiseAmountChange = (position, value) => {
    const numValue = parseInt(value) || 0;
    setCustomRaiseAmounts({
      ...customRaiseAmounts,
      [position]: numValue
    });
  };
  
  // Initialize game state when component mounts or gameDetails changes
  useEffect(() => {
    updateGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Helper to check if a player can take an action
  const canPlayerAct = (position) => {
    return position === activePlayer && !foldedPlayers.includes(position);
  };
  
  // Handle player action (fold, check, call, raise)
  const handlePlayerAction = (position, action, raiseAmount = 0) => {
    if (!canPlayerAct(position)) return;
    
    // Clone current state
    const newBets = { ...currentBets };
    const newStacks = { ...playerStacks };
    const newActions = { ...playerActions };
    let newPotSize = potSize;
    let newFoldedPlayers = [...foldedPlayers];
    
    // Process action
    switch (action) {
      case 'fold':
        newFoldedPlayers.push(position);
        newActions[position] = 'fold';
        break;
        
      case 'check':
        // Can only check if no bet to call or already matched
        if (betToCall === 0 || currentBets[position] === betToCall) {
          newActions[position] = 'check';
        } else {
          console.error("Cannot check when there's a bet to call");
          return;
        }
        break;
        
      case 'call':
        // Calculate call amount
        const callAmount = betToCall - (currentBets[position] || 0);
        if (callAmount <= 0) {
          newActions[position] = 'check';
        } else {
          // Update stack
          newStacks[position] -= callAmount;
          // Update bets
          newBets[position] = betToCall;
          // Update pot
          newPotSize += callAmount;
          newActions[position] = 'call';
        }
        break;
        
      case 'raise':
        // Calculate raise amount
        const totalBet = betToCall + raiseAmount;
        const toAdd = totalBet - (currentBets[position] || 0);
        
        // Update stack
        newStacks[position] -= toAdd;
        // Update bets
        newBets[position] = totalBet;
        // Update pot
        newPotSize += toAdd;
        // Update bet to call
        setBetToCall(totalBet);
        setCurrentBetAmount(totalBet);
        newActions[position] = `raise to ${totalBet}`;
        break;
        
      case 'allin':
        // Player is going all-in with their entire stack
        const playerStack = playerStacks[position];
        const currentBet = currentBets[position] || 0;
        const totalAllInBet = currentBet + playerStack;
        
        // Update bets
        newBets[position] = totalAllInBet;
        // Update pot
        newPotSize += playerStack;
        // Update stack to 0
        newStacks[position] = 0;
        
        // If this all-in raises the bet, update bet to call
        if (totalAllInBet > betToCall) {
          setBetToCall(totalAllInBet);
          setCurrentBetAmount(totalAllInBet);
        }
        
        newActions[position] = `all-in (${totalAllInBet})`;
        break;
        
      default:
        console.error("Unknown action:", action);
        return;
    }
    
    // Update state
    setPlayerStacks(newStacks);
    setCurrentBets(newBets);
    setPotSize(newPotSize);
    setPlayerActions(newActions);
    setFoldedPlayers(newFoldedPlayers);
    
    // Move to next active player
    moveToNextPlayer();
    
    // Update game state
    updateGameState();
  };
  
  // Move to the next active player
  const moveToNextPlayer = () => {
    let nextPlayer = (activePlayer + 1) % playerCount;
    
    // Skip folded players
    while (foldedPlayers.includes(nextPlayer)) {
      nextPlayer = (nextPlayer + 1) % playerCount;
    }
    
    // Check if we've completed the round (everyone has acted)
    const allPlayersActed = Object.values(playerActions).every(
      (action, index) => action !== null || foldedPlayers.includes(index)
    );
    
    if (allPlayersActed) {
      // Move to next street
      if (currentStreet === 'preflop') {
        setCurrentStreet('flop');
      } else if (currentStreet === 'flop') {
        setCurrentStreet('turn');
      } else if (currentStreet === 'turn') {
        setCurrentStreet('river');
      } else {
        // End of hand, showdown
        setCurrentStreet('showdown');
      }
      
      // Reset actions and bets for new street
      resetForNewStreet();
      
      // Start with player after small blind
      setActivePlayer((blindPositions.smallBlind + 1) % playerCount);
    } else {
      setActivePlayer(nextPlayer);
    }
  };
  
  // Reset actions and bets for a new street
  const resetForNewStreet = () => {
    // Reset actions
    const newActions = {};
    for (let i = 0; i < playerCount; i++) {
      newActions[i] = null;
    }
    setPlayerActions(newActions);
    
    // Reset bets but keep track of them for the pot
    const currentBetsTotal = Object.values(currentBets).reduce((sum, bet) => sum + bet, 0);
    setPotSize(prev => prev + currentBetsTotal);
    
    const newBets = {};
    for (let i = 0; i < playerCount; i++) {
      newBets[i] = 0;
    }
    setCurrentBets(newBets);
    
    // Reset bet to call
    setBetToCall(0);
    setCurrentBetAmount(0);
  };
  
  // Update player stack
  const updatePlayerStack = (position, newStack) => {
    setPlayerStacks(prev => ({
      ...prev,
      [position]: newStack
    }));
    
    // Update the game state in the parent component
    updateGameState();
  };
  
  // Update pot size
  const updatePot = (newSize) => {
    setPotSize(newSize);
    updateGameState();
  };
  
  // Update current bet for a position
  const updateBet = (position, betAmount) => {
    // Update the current bet
    setCurrentBets(prev => {
      const newBets = { ...prev, [position]: betAmount };
      // Calculate new bet to call (highest bet)
      const highestBet = Math.max(...Object.values(newBets));
      setBetToCall(highestBet);
      return newBets;
    });
    
    // Update the pot size
    setPotSize(prev => prev + betAmount);
    
    // Update player's stack
    setPlayerStacks(prev => ({
      ...prev,
      [position]: prev[position] - betAmount
    }));
    
    updateGameState();
  };
  
  // Reset bets for a new street (flop, turn, river)
  const resetBetsForNewStreet = () => {
    setCurrentBets(() => {
      const bets = {};
      for (let i = 0; i < (playerCount || 6); i++) {
        bets[i] = 0;
      }
      return bets;
    });
    setBetToCall(0);
    updateGameState();
  };
  
  // Move blinds to next positions (rotate)
  const moveBlindPositions = () => {
    setBlindPositions(prev => {
      // Calculate next positions, ensuring they wrap around the table
      const nextSmallBlind = (prev.smallBlind + 1) % playerCount;
      const nextBigBlind = (prev.bigBlind + 1) % playerCount;
      
      return {
        smallBlind: nextSmallBlind,
        bigBlind: nextBigBlind
      };
    });
    
    // Reset the bets and update with new blind positions
    setCurrentBets(() => {
      const newBets = {};
      for (let i = 0; i < playerCount; i++) {
        newBets[i] = 0;
      }
      
      // Set new blinds based on updated positions
      const nextSmallBlind = (blindPositions.smallBlind + 1) % playerCount;
      const nextBigBlind = (blindPositions.bigBlind + 1) % playerCount;
      
      newBets[nextSmallBlind] = currentBlinds.smallBlind;
      newBets[nextBigBlind] = currentBlinds.bigBlind;
      
      return newBets;
    });
    
    // Update the pot with the new blinds
    setPotSize(currentBlinds.smallBlind + currentBlinds.bigBlind);
    
    // Update player stacks for the blinds
    setPlayerStacks(prev => {
      const newStacks = { ...prev };
      const nextSmallBlind = (blindPositions.smallBlind + 1) % playerCount;
      const nextBigBlind = (blindPositions.bigBlind + 1) % playerCount;
      
      newStacks[nextSmallBlind] -= currentBlinds.smallBlind;
      newStacks[nextBigBlind] -= currentBlinds.bigBlind;
      
      return newStacks;
    });
    
    updateGameState();
  };
  
  // Increase to next blind level
  const increaseBlindLevel = () => {
    if (currentBlindLevel < blindLevels.length - 1) {
      const nextLevel = currentBlindLevel + 1;
      setCurrentBlindLevel(nextLevel);
      setCurrentBlinds(blindLevels[nextLevel]);
      
      // Update the current bets with new blind values
      setCurrentBets(prev => {
        const newBets = { ...prev };
        newBets[blindPositions.smallBlind] = blindLevels[nextLevel].smallBlind;
        newBets[blindPositions.bigBlind] = blindLevels[nextLevel].bigBlind;
        return newBets;
      });
      
      // Update the pot
      setPotSize(prev => prev - currentBlinds.smallBlind - currentBlinds.bigBlind + 
                       blindLevels[nextLevel].smallBlind + blindLevels[nextLevel].bigBlind);
      
      // Update player stacks for the blinds
      setPlayerStacks(prev => {
        const newStacks = { ...prev };
        newStacks[blindPositions.smallBlind] += currentBlinds.smallBlind - blindLevels[nextLevel].smallBlind;
        newStacks[blindPositions.bigBlind] += currentBlinds.bigBlind - blindLevels[nextLevel].bigBlind;
        return newStacks;
      });
      
      updateGameState();
    }
  };
  
  // Add a custom blind level
  const addCustomBlindLevel = (smallBlind, bigBlind) => {
    setBlindLevels(prev => [...prev, { smallBlind, bigBlind }]);
  };
  
  // Start a new hand - move blinds and reset pot
  const startNewHand = () => {
    // Move blinds automatically
    moveBlindPositions();
    
    // Check if blinds have made a full rotation back to player 1
    if (blindPositions.smallBlind === 0 || blindPositions.bigBlind === 0) {
      // If we've completed a full rotation, increase blinds
      increaseBlindLevel();
    }
    
    // Reset the street to preflop
    setCurrentStreet('preflop');
    
    // Reset other hand state
    setPotSize(currentBlinds.smallBlind + currentBlinds.bigBlind);
    setBetToCall(currentBlinds.bigBlind);
    
    // Reset player actions
    const newActions = {};
    for (let i = 0; i < playerCount; i++) {
      newActions[i] = null;
    }
    setPlayerActions(newActions);
    
    // Clear player and community cards
    if (onSelectPlayerCard) {
      onSelectPlayerCard([]);
    }
    
    if (onSelectCommunityCard) {
      onSelectCommunityCard([]);
    }
    
    // Reset folded players
    setFoldedPlayers([]);
    
    // Set active player to player after big blind
    setActivePlayer((blindPositions.bigBlind + 1) % playerCount);
    
    // Reset bets for new hand
    resetBetsForNewStreet();
    
    // Update game state
    updateGameState();
    
    // Notify any listeners that a new hand has started
    if (window.pokerAssistantNewHand) {
      window.pokerAssistantNewHand();
    }
  };
  
  // Update the parent component with the current game state
  const updateGameState = () => {
    if (onGameStateUpdate) {
      onGameStateUpdate({
        potSize,
        playerStacks,
        currentBets,
        betToCall,
        blindPositions,
        currentBlinds,
        currentBlindLevel,
        activePlayer,
        playerActions,
        foldedPlayers,
        currentStreet
      });
    }
  };
  
  // Calculate pot odds
  const getPotOdds = () => {
    if (betToCall <= 0) return "N/A";
    const odds = (potSize / betToCall).toFixed(1);
    return `${odds}:1`;
  };
  
  return (
    <div className="game-state-tracker">
      <div className="game-state-summary">
        <div className="pot-info">
          <h4>Pot: ${potSize}</h4>
          <div className="street-indicator">
            <span className="current-street">{currentStreet.toUpperCase()}</span>
          </div>
        </div>
        
        <div className="bet-info">
          <h4>Bet to Call: ${betToCall}</h4>
          <div className="pot-odds">
            <span>Pot Odds: {getPotOdds()}</span>
          </div>
        </div>
      </div>
      
      {/* Card Selection Interface - Replaced with QuickCardSelector */}
      <div className="card-selection-interface">
        <QuickCardSelector 
          playerCards={playerCards}
          communityCards={communityCards}
          onSelectPlayerCard={onSelectPlayerCard}
          onSelectCommunityCard={onSelectCommunityCard}
        />
      </div>
      
      <div className="blind-controls">
        <h4>Blinds: SB ${currentBlinds.smallBlind} / BB ${currentBlinds.bigBlind}</h4>
        <div className="blind-actions">
          <button className="new-hand-btn" onClick={startNewHand}>Next Hand</button>
        </div>
        <div className="blind-positions">
          <div>Small Blind: Player {blindPositions.smallBlind + 1}</div>
          <div>Big Blind: Player {blindPositions.bigBlind + 1}</div>
        </div>
      </div>
      
      <div className="player-stacks">
        <h4>Players</h4>
        <div className="player-stack-grid">
          {Object.keys(playerStacks).map(position => {
            const posInt = parseInt(position);
            const isSmallBlind = posInt === blindPositions.smallBlind;
            const isBigBlind = posInt === blindPositions.bigBlind;
            const isActive = posInt === activePlayer;
            const hasFolded = foldedPlayers.includes(posInt);
            const playerAction = playerActions[posInt];
            
            let playerClass = "player-stack";
            
            if (posInt === gameDetails?.playerPosition) {
              playerClass += " your-stack";
            }
            if (isSmallBlind) {
              playerClass += " small-blind";
            }
            if (isBigBlind) {
              playerClass += " big-blind";
            }
            if (isActive) {
              playerClass += " active-player";
            }
            if (hasFolded) {
              playerClass += " folded-player";
            }
            
            return (
              <div key={position} className={playerClass}>
                <div className="player-info">
                  <span className="player-label">
                    Player {posInt + 1} {posInt === gameDetails?.playerPosition ? "(You)" : ""}
                    {isSmallBlind ? " (SB)" : ""}
                    {isBigBlind ? " (BB)" : ""}
                  </span>
                  
                  <div className="stack-bet-info">
                    <span className="stack-amount">Stack: ${playerStacks[position]}</span>
                    {currentBets[position] > 0 && (
                      <span className="bet-amount">Bet: ${currentBets[position]}</span>
                    )}
                  </div>
                  
                  {playerAction && (
                    <div className="player-action-indicator">
                      {playerAction}
                    </div>
                  )}
                </div>
                
                <div className="player-actions">
                  <button 
                    className="action-btn fold-btn"
                    onClick={() => handlePlayerAction(posInt, 'fold')}
                    disabled={!canPlayerAct(posInt) || hasFolded}
                  >
                    Fold
                  </button>
                  
                  <button 
                    className="action-btn check-btn"
                    onClick={() => handlePlayerAction(posInt, 'check')}
                    disabled={!canPlayerAct(posInt) || hasFolded || (betToCall > 0 && currentBets[posInt] < betToCall)}
                  >
                    {betToCall === 0 || currentBets[posInt] === betToCall ? "Check" : "Can't Check"}
                  </button>
                  
                  <button 
                    className="action-btn call-btn"
                    onClick={() => handlePlayerAction(posInt, 'call')}
                    disabled={!canPlayerAct(posInt) || hasFolded || betToCall === 0 || playerStacks[posInt] < (betToCall - currentBets[posInt])}
                  >
                    Call ${betToCall}
                  </button>
                  
                  <div className="raise-control">
                    <input
                      type="number"
                      className="raise-amount-input"
                      min={betToCall}
                      max={playerStacks[posInt] + (currentBets[posInt] || 0)}
                      value={customRaiseAmounts[posInt] || betToCall * 2}
                      onChange={(e) => handleRaiseAmountChange(posInt, e.target.value)}
                      disabled={!canPlayerAct(posInt) || hasFolded}
                    />
                    <button 
                      className="action-btn raise-btn"
                      onClick={() => handlePlayerAction(posInt, 'raise', (customRaiseAmounts[posInt] || betToCall) - betToCall)}
                      disabled={!canPlayerAct(posInt) || hasFolded || playerStacks[posInt] < ((customRaiseAmounts[posInt] || betToCall) - currentBets[posInt])}
                    >
                      Raise
                    </button>
                  </div>
                  
                  <button 
                    className="action-btn allin-btn"
                    onClick={() => handlePlayerAction(posInt, 'allin')}
                    disabled={!canPlayerAct(posInt) || hasFolded || playerStacks[posInt] <= 0}
                  >
                    All In (${playerStacks[posInt]})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GameStateTracker; 