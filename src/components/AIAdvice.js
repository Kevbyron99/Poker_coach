import React, { useState, useEffect, useRef } from 'react';
import './AIAdvice.css';
import { Hand } from 'pokersolver';

function calculateHandPotential(playerCards, communityCards) {
  try {
    // Convert cards to pokersolver format
    const formatPokerSolverCard = (card) => {
      if (!card || card.length < 2) return null;
      
      // Map values to pokersolver values
      const valueMap = {
        'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': 'T', '10': 'T',
        '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
      };
      
      // Map suits to pokersolver suits
      const suitMap = {
        's': 's', 'h': 'h', 'd': 'd', 'c': 'c',
        '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'
      };
      
      const value = valueMap[card[0].toUpperCase()] || card[0];
      const suit = suitMap[card[1].toLowerCase()] || card[1];
      
      return value + suit;
    };
    
    // Format the cards
    const formattedPlayerCards = playerCards.map(formatPokerSolverCard).filter(Boolean);
    const formattedCommunityCards = communityCards.map(formatPokerSolverCard).filter(Boolean);
    
    // If we don't have enough cards, return empty potential
    if (formattedPlayerCards.length < 2) {
      return {
        currentHand: 'Incomplete',
        possibleHands: []
      };
    }
    
    // Combine the cards
    const allCards = [...formattedPlayerCards, ...formattedCommunityCards];
    
    // Get current hand if we have 5+ cards
    let currentHand = 'High Card';
    let handDescriptor = '';
    if (allCards.length >= 5) {
      try {
        const hand = Hand.solve(allCards);
        currentHand = hand.name;
        handDescriptor = hand.descr;
      } catch (e) {
        console.error('Error evaluating current hand:', e);
      }
    }
    
    // Analyze board for potential hands
    const possibleHands = [];
    
    // Extract all card information
    const suits = allCards.map(card => card[1]);
    const values = allCards.map(card => card[0]);
    
    // Card value mapping for accurate straight analysis
    const cardValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
      'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    
    // Count suits for flush analysis
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    
    // Check for flush draws - need to be more specific
    const communityCardSuits = formattedCommunityCards.map(card => card[1]);
    const suitCountsOnBoard = {};
    communityCardSuits.forEach(suit => {
      suitCountsOnBoard[suit] = (suitCountsOnBoard[suit] || 0) + 1;
    });
    
    // Check player's flush potential
    const playerSuits = formattedPlayerCards.map(card => card[1]);
    const hasFlushDraw = playerSuits[0] === playerSuits[1] && suitCountsOnBoard[playerSuits[0]] >= 2;
    
    // Check flush draws on the board (for opponent potential)
    const flushDrawOnBoard = Object.entries(suitCountsOnBoard)
      .some(([suit, count]) => count >= 3);
    
    if (Object.values(suitCounts).some(count => count >= 5)) {
      possibleHands.push('Flush');
    } else if (hasFlushDraw) {
      possibleHands.push('Flush Draw (Yours)');
    } else if (flushDrawOnBoard) {
      possibleHands.push('Potential Flush Draw (Opponents)');
    }
    
    // Check for straight and straight draws
    const numericValues = allCards.map(card => cardValues[card[0]] || 0);
    const uniqueValues = [...new Set(numericValues)].sort((a, b) => a - b);
    
    // Find the longest consecutive sequence
    let maxSequenceLength = 1;
    let currentSequenceLength = 1;
    
    for (let i = 1; i < uniqueValues.length; i++) {
      if (uniqueValues[i] === uniqueValues[i-1] + 1) {
        currentSequenceLength++;
        maxSequenceLength = Math.max(maxSequenceLength, currentSequenceLength);
      } else if (uniqueValues[i] > uniqueValues[i-1] + 1) {
        currentSequenceLength = 1;
      }
    }
    
    // Special case for Ace low (A-2-3-4-5 straight)
    if (uniqueValues.includes(14)) {
      const lowAceValues = [1, ...uniqueValues.filter(v => v <= 5)].sort((a, b) => a - b);
      let lowAceSequenceLength = 1;
      
      for (let i = 1; i < lowAceValues.length; i++) {
        if (lowAceValues[i] === lowAceValues[i-1] + 1) {
          lowAceSequenceLength++;
        } else {
          break;
        }
      }
      
      maxSequenceLength = Math.max(maxSequenceLength, lowAceSequenceLength);
    }
    
    // Check straight combinations
    if (maxSequenceLength >= 5) {
      possibleHands.push('Straight');
    } else if (maxSequenceLength === 4) {
      possibleHands.push('Open-Ended Straight Draw');
    } else if (maxSequenceLength === 3) {
      possibleHands.push('Straight Draw');
    }
    
    // Count values for pair analysis
    const valueCounts = {};
    values.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // Check for pair-based hands
    const pairs = Object.values(valueCounts).filter(count => count === 2).length;
    const trips = Object.values(valueCounts).filter(count => count === 3).length;
    const quads = Object.values(valueCounts).filter(count => count === 4).length;
    
    if (quads > 0) {
      possibleHands.push('Four of a Kind');
    } else if (trips > 0 && pairs > 0) {
      possibleHands.push('Full House');
    } else if (trips > 0) {
      possibleHands.push('Three of a Kind');
      possibleHands.push('Full House Draw');
    } else if (pairs >= 2) {
      possibleHands.push('Two Pair');
      possibleHands.push('Full House Draw');
    } else if (pairs === 1) {
      possibleHands.push('Pair');
      possibleHands.push('Two Pair Draw');
      possibleHands.push('Trips Draw');
    }
    
    return {
      currentHand,
      handDescriptor,
      possibleHands: [...new Set(possibleHands)]  // Remove duplicates
    };
  } catch (error) {
    console.error("Error calculating hand potential:", error);
    return { currentHand: 'Unknown', possibleHands: [] };
  }
}

function AIAdvice({ gameDetails, playerCards, communityCards, odds, gameState, onClearCards }) {
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const threadIdRef = useRef(null);

  // Initialize thread ID on component mount
  useEffect(() => {
    console.log("Initializing thread ID...");
    const initialize = async () => {
      try {
        // Check if we have a stored thread ID
        const storedThreadId = localStorage.getItem('pokerAssistantThreadId');
        
        if (storedThreadId) {
          console.log("Using stored thread ID:", storedThreadId);
          threadIdRef.current = storedThreadId;
        } else {
          console.log("No thread ID found, creating a new thread...");
          
          // Clear any old errors
          setError('');
          setIsLoading(true);
          
          console.log("Creating a new thread...");
          const response = await fetch('/api/openai/createThread', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || response.status}`);
          }
          
          const data = await response.json();
          threadIdRef.current = data.threadId;
          
          // Store thread ID in localStorage
          localStorage.setItem('pokerAssistantThreadId', data.threadId);
          console.log("New thread created:", data.threadId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize thread:", error);
        setError("Failed to initialize AI assistant. Please check your API key or network connection and refresh the page.");
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Generate AI advice when cards change, but ONLY if we have player cards
  useEffect(() => {
    if (playerCards && playerCards.length > 0) {
      getAdvice();
    }
  }, [playerCards, communityCards, odds, gameDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to create a new thread
  const createNewThread = async () => {
    try {
      console.log("Creating a new thread...");
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/openai/createThread'
        : '/api/openai/createThread';
      
      console.log(`Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Thread creation failed with status:', response.status, errorData);
        throw new Error(`API error: ${errorData.error || errorData.message || response.status}`);
      }
      
      const data = await response.json();
      threadIdRef.current = data.threadId;
      
      // Store thread ID in localStorage
      localStorage.setItem('pokerAssistantThreadId', data.threadId);
      console.log("New thread created:", data.threadId);
      setError('');
    } catch (error) {
      console.error('Failed to create thread:', error);
      setError(`Failed to connect to AI assistant: ${error.message}`);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const getAdvice = async (retryCount = 0) => {
    // If we don't have any player cards, don't try to get advice
    if (!playerCards || playerCards.length === 0) {
      console.log("No player cards provided, not requesting advice");
      setAdvice('');
      setError('');
      setIsLoading(false);
      return;
    }
    
    // Debug the player cards
    console.log("Player cards detected:", playerCards);
    if (playerCards.length === 2) {
      console.log(`You have: ${playerCards[0]} and ${playerCards[1]}`);
      
      // Check if it's a pair
      if (playerCards[0][0] === playerCards[1][0]) {
        console.log(`This is a pair of ${playerCards[0][0]}'s`);
      }
    }
    
    // Set loading state on first attempt
    if (retryCount === 0) {
      setIsLoading(true);
    }
    
    try {
      // If we don't have a thread ID, we can't call the assistant
      if (!threadIdRef.current) {
        console.error("No thread ID available");
        if (retryCount === 0) {
          setError('No connection to AI assistant. Attempting to reconnect...');
          // Try to create a new thread
          const response = await fetch('/api/openai/createThread', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to reconnect to AI assistant');
          }
          
          const data = await response.json();
          threadIdRef.current = data.threadId;
          localStorage.setItem('pokerAssistantThreadId', data.threadId);
          
          // Now retry getting advice with the new thread
          return getAdvice(retryCount + 1);
        } else {
          throw new Error('Failed to establish connection to AI assistant after retry');
        }
      }
      
      const stage = communityCards.length === 0 ? 'preflop' : 
                    communityCards.length === 3 ? 'flop' : 
                    communityCards.length === 4 ? 'turn' : 'river';
      
      console.log(`Getting advice for ${stage} with thread ${threadIdRef.current}`);
      
      // Calculate hand potential
      const handPotential = calculateHandPotential(playerCards, communityCards);
      console.log("Hand potential:", handPotential);
      
      // Check if the two player cards are suited
      const areSuited = playerCards.length === 2 && playerCards[0][1] === playerCards[1][1];
      
      // Check if the two player cards are paired
      const isPair = playerCards.length === 2 && playerCards[0][0] === playerCards[1][0];
      
      // Format the message for the assistant
      const messageData = {
        threadId: threadIdRef.current,
        assistantId: 'asst_njK8PBKyiIeYVWBbsUsjmKBM',
        message: JSON.stringify({
          playerCards: playerCards.join(', '),
          communityCards: communityCards.length > 0 ? communityCards.join(', ') : 'none',
          odds: odds ? `${(odds[0] * 100).toFixed(1)}%` : 'unknown',
          stage: gameState?.currentStreet || 'preflop',
          handPotential: handPotential,
          isSuited: areSuited,
          isPair: isPair,
          handDescription: isPair ? `Pair of ${playerCards[0][0]}'s` : `${playerCards[0][0]}${playerCards[1][0]}${areSuited ? 's' : 'o'}`,
          
          // Add position information
          inPosition: isInPosition(gameDetails?.playerPosition, gameDetails?.players),
          positionName: getPositionName(gameDetails?.playerPosition, gameDetails?.players),
          
          // Add blind information
          blindPositions: gameState?.blindPositions,
          isPlayerSB: gameState?.blindPositions?.smallBlind === gameDetails?.playerPosition,
          isPlayerBB: gameState?.blindPositions?.bigBlind === gameDetails?.playerPosition,
          currentBlinds: gameState?.currentBlinds,
          
          // Add action tracking information
          activePlayer: gameState?.activePlayer,
          isActivePlayer: gameState?.activePlayer === gameDetails?.playerPosition,
          playerActions: gameState?.playerActions,
          foldedPlayers: gameState?.foldedPlayers,
          
          // Add pot information
          potSize: gameState?.potSize || 0,
          betToCall: gameState?.betToCall || 0,
          potOdds: gameState?.potSize && gameState?.betToCall && gameState?.betToCall > 0
            ? `${(gameState.potSize / gameState.betToCall).toFixed(1)}:1` 
            : "N/A",
          
          // Your stack information
          yourStack: gameState?.playerStacks[gameDetails?.playerPosition] || 0,
          
          // Stack-to-pot ratio
          spr: gameState?.potSize ? 
            (gameState?.playerStacks[gameDetails?.playerPosition] / gameState?.potSize).toFixed(1) 
            : "N/A",
          
          gameDetails: gameDetails ? {
            players: gameDetails.players,
            position: gameDetails.playerPosition,
            blinds: `${gameDetails.smallBlind}/${gameDetails.bigBlind}`,
          } : null
        })
      };
      
      // Send message to assistant and get advice
      console.log("Sending request to OpenAI assistant...");
      console.log("Request body:", JSON.stringify(messageData));
      
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/openai/getAssistantAdvice'
        : '/api/openai/getAssistantAdvice';
      
      console.log(`Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        // Log detailed error information
        console.error(`API error (${response.status}): Advice request failed`);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
        } catch (jsonError) {
          // If we can't parse JSON, just use the status text
          throw new Error(`API error: ${response.statusText || response.status}`);
        }
      }
      
      // Here was the problem - we need to set the advice with the response
      const data = await response.json();
      console.log("API Response:", data);
      
      if (data.advice) {
        // The backend returns { advice: "content" } structure
        console.log("Setting advice from API:", data.advice);
        setAdvice(data.advice);
      } else if (data.content) {
        // Just in case the structure is { content: "content" }
        console.log("Setting content from API:", data.content);
        setAdvice(data.content);
      } else {
        console.log("No advice in API response");
        setAdvice("The AI assistant did not return any advice. Please try again.");
      }
      setError('');
      
    } catch (error) {
      console.error('Failed to get advice from AI assistant:', error);
      
      // Only retry once and only for certain types of errors
      if (retryCount < 2 && (
          error.message.includes('timeout') || 
          error.message.includes('network') ||
          error.message.includes('connection') ||
          error.message.includes('500') ||
          error.message.includes('503')
      )) {
        console.log(`Retrying... (${retryCount + 1})`);
        setTimeout(() => getAdvice(retryCount + 1), 2000);
        return;
      }
      
      setError(`AI assistant unavailable: ${error.message}. Please try refreshing the page or clicking the retry button below.`);
      
    } finally {
      if (retryCount === 0) {
        setIsLoading(false);
      }
    }
  };

  // Add a way to reset the thread if needed
  const resetThread = () => {
    localStorage.removeItem('pokerAssistantThreadId');
    threadIdRef.current = null;
    setError('Thread reset. Refresh the page to create a new thread.');
    
    // Clear selected cards
    console.log("Reset Thread: Clearing cards via callback");
    if (onClearCards) {
      onClearCards();
    } else {
      console.error("No card clearing callback provided");
    }
  };

  // Add a function to mark the transition to a new hand
  const nextHand = async () => {
    try {
      setIsLoading(true);
      setError('');
      setAdvice(''); // Clear previous advice
      
      // Clear selected cards
      console.log("Next Hand: Clearing cards via callback");
      if (onClearCards) {
        onClearCards();
      } else {
        console.error("No card clearing callback provided");
      }
      
      if (!threadIdRef.current) {
        throw new Error('No active thread. Please refresh the page.');
      }
      
      // Tell the assistant we're moving to the next hand
      const messageData = {
        threadId: threadIdRef.current,
        assistantId: 'asst_njK8PBKyiIeYVWBbsUsjmKBM',
        message: JSON.stringify({
          system: "NEW_HAND",
          gameDetails: gameDetails ? {
            players: gameDetails.players,
            position: gameDetails.playerPosition,
            blinds: `${gameDetails.smallBlind}/${gameDetails.bigBlind}`,
          } : null
        })
      };
      
      const response = await fetch('/api/openai/getAssistantAdvice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to notify assistant about new hand');
      }
      
    } catch (error) {
      console.error('Error moving to next hand:', error);
      setError(`Failed to reset for next hand: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get position name based on player position and count
  const getPositionName = (position, playerCount) => {
    if (position === undefined || playerCount === undefined) return 'Unknown';
    
    if (position === 0) return 'Early';
    if (position === playerCount - 1) return 'Button';
    if (position === playerCount - 2) return 'Cutoff';
    if (position === 1) return 'UTG+1';
    
    // Check if in blinds based on game state
    if (gameState?.blindPositions) {
      if (position === gameState.blindPositions.smallBlind) return 'Small Blind';
      if (position === gameState.blindPositions.bigBlind) return 'Big Blind';
    }
    
    // Middle positions
    if (position < Math.floor(playerCount / 2)) return 'Early-Mid';
    return 'Late-Mid';
  };

  // Check if player is in position (acting later in the betting round)
  const isInPosition = (position, playerCount) => {
    if (position === undefined || playerCount === undefined) return false;
    
    // Button is always in position
    return position === playerCount - 1;
  };

  // Add a function to test the connection to OpenAI
  const testConnection = async () => {
    setIsLoading(true);
    setError('');
    setAdvice('');
    try {
      console.log("Testing connection to OpenAI API...");
      
      // First check if we have a thread ID
      if (!threadIdRef.current) {
        console.log("No thread ID found, creating a new one...");
        await createNewThread();
      }
      
      // Now send a test message
      const testMessageData = {
        threadId: threadIdRef.current,
        assistantId: 'asst_njK8PBKyiIeYVWBbsUsjmKBM',
        message: JSON.stringify({
          test: true,
          message: "This is a test connection to verify the API is working."
        })
      };
      
      console.log("Sending test message:", testMessageData);
      
      const response = await fetch('/api/openai/getAssistantAdvice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessageData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Test Connection Error:", errorData);
        throw new Error(`API connection test failed: ${errorData.error || response.status}`);
      }
      
      const data = await response.json();
      console.log("Test Connection Response:", data);
      
      if (data.advice) {
        setAdvice("✅ Connection successful! The AI assistant is ready to provide advice.");
      } else {
        setAdvice("✓ API connection successful, but no advice returned.");
      }
      
    } catch (error) {
      console.error("Test Connection Failed:", error);
      setError(`Connection test failed: ${error.message}. Check browser console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-advice">
      <h3>AI Poker Coach</h3>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="retry-btn" 
            onClick={() => getAdvice()}
            disabled={isLoading}
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="loading">
          <p>Getting advice from AI assistant...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {/* OpenAI assistant advice */}
      {advice && !isLoading && (
        <div className="ai-advice-container">
          <div className="advice-content">
            <div dangerouslySetInnerHTML={{ __html: advice }}></div>
          </div>
        </div>
      )}
      
      {/* Show placeholder message when no cards selected or advice loaded */}
      {!advice && !isLoading && !error && playerCards && playerCards.length > 0 && (
        <div className="ai-advice-container">
          <div className="advice-content">
            <p>AI assistant is analyzing your hand... <span className="analyzing-animation"></span></p>
          </div>
        </div>
      )}
      
      {/* No cards selected message */}
      {!advice && !isLoading && !error && (!playerCards || playerCards.length === 0) && (
        <div className="advice-content">
          <p>Select your cards to get advice from the AI assistant.</p>
        </div>
      )}
      
      {/* Button controls */}
      <div className="ai-buttons">
        <button className="reset-thread-btn" onClick={resetThread}>Reset Thread</button>
        <button className="next-hand-btn" onClick={nextHand}>Next Hand</button>
        <button className="test-btn" onClick={testConnection}>Test API</button>
      </div>
    </div>
  );
}

export default AIAdvice; 