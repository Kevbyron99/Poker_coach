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
  const [isConnected, setIsConnected] = useState(false);

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
          setIsConnected(true);
        } else {
          console.log("No thread ID found, creating a new thread...");
          
          // Clear any old errors
          setError('');
          setIsLoading(true);
          
          console.log("Creating a new thread...");
          await createNewThread();
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

  // Get the base URL for API calls
  const getApiBaseUrl = () => {
    // In production deployment, use the absolute URL of the deployment
    // This ensures API calls go to the correct domain when deployed on Vercel
    if (process.env.NODE_ENV === 'production') {
      // Use the current origin (domain)
      return window.location.origin;
    }
    // In development, use the relative path (assuming backend is on the same host)
    return '';
  };

  // Get API URL for specific endpoints
  const getApiUrl = (endpoint) => {
    // For Vercel serverless functions, we need to use a different path structure
    if (process.env.NODE_ENV === 'production') {
      // In production, use /api/[endpoint] format (Vercel serverless functions)
      return `${getApiBaseUrl()}/api/${endpoint}`;
    } else {
      // In development, use /api/openai/[endpoint] format (Express routes)
      return `${getApiBaseUrl()}/api/openai/${endpoint}`;
    }
  };

  const createNewThread = async (retryCount = 0, maxRetries = 3) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`Creating a new thread (attempt ${retryCount + 1} of ${maxRetries + 1})...`);
      
      const apiUrl = getApiUrl('createThread');
      console.log(`Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`API error (${response.status}): Thread creation failed`);
        
        // Special handling for timeout errors (504)
        if (response.status === 504) {
          console.warn("Gateway timeout detected - API request took too long");
          
          if (retryCount < maxRetries) {
            console.log(`Retrying thread creation (attempt ${retryCount + 1} of ${maxRetries})...`);
            setError(`Connection attempt timed out. Retrying (${retryCount + 1}/${maxRetries})...`);
            
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Retry the request
            return createNewThread(retryCount + 1, maxRetries);
          }
        }
        
        // Get error data if available
        try {
          const responseText = await response.text();
          console.error('Error response:', responseText);
          
          if (responseText && responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
            } catch (jsonError) {
              throw new Error(`API error (${response.status}): ${responseText.substring(0, 100)}`);
            }
          } else {
            throw new Error(`API error (${response.status}): Empty response`);
          }
        } catch (error) {
          throw new Error(`API error: ${response.statusText || response.status}`);
        }
      }
      
      // Processing the response
      console.log(`API response status: ${response.status} ${response.statusText}`);
      
      let responseData;
      const responseText = await response.text();
      
      console.log('Raw API response:', responseText);
      
      // Only try to parse as JSON if there's actual content
      if (responseText && responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
      } else {
        // Handle empty response
        console.error('Empty response received from API');
        throw new Error('Empty response from server');
      }
      
      // Store the thread ID
      if (responseData.threadId) {
        console.log(`Thread created: ${responseData.threadId}`);
        localStorage.setItem('pokerAssistantThreadId', responseData.threadId);
        threadIdRef.current = responseData.threadId;
        setIsLoading(false);
        setError('');
        setIsConnected(true);
      } else {
        throw new Error('No thread ID in response');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('failed to fetch')
      )) {
        console.log(`Network error, retrying thread creation (${retryCount + 1}/${maxRetries})...`);
        setError(`Connection failed. Retrying (${retryCount + 1}/${maxRetries})...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        
        // Retry
        return createNewThread(retryCount + 1, maxRetries);
      }
      
      setError(`Failed to connect to AI assistant: ${error.message}`);
      setIsLoading(false);
      setIsConnected(false);
    }
  };

  const getAdvice = async (retryCount = 0, maxRetries = 3) => {
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
          await createNewThread();
          
          // If we successfully created a thread, retry getting advice
          if (threadIdRef.current) {
            return getAdvice(retryCount + 1);
          } else {
            throw new Error('Failed to establish connection to AI assistant after retry');
          }
        } else {
          throw new Error('Failed to establish connection to AI assistant');
        }
      }
      
      // Prepare message data
      const messageData = {
        threadId: threadIdRef.current,
        assistantId: 'asst_njK8PBKyiIeYVWBbsUsjmKBM',
        message: JSON.stringify({
          // Player's hand
          playerCards: playerCards || [],
          
          // Community cards
          communityCards: communityCards || [],
          
          // Stage of the game
          stage: determineStage(communityCards),
          
          // Hand analysis
          handDescriptor: '',
          possibleHands: calculateHandPotential(playerCards, communityCards),
          
          // Current hand strength (using percentile odds)
          handStrength: odds?.percent || 0,
          
          // Position information
          position: gameDetails?.playerPosition || 0,
          positionName: getPositionName(gameDetails?.playerPosition, gameDetails?.players),
          blindPositions: {
            smallBlinding: gameDetails?.smallBlind || 1,
            bigBlind: gameDetails?.bigBlind || 2,
            activePlayer: gameDetails?.playerPosition || 0,
            isActivePlayer: gameDetails?.playerPosition !== undefined
          },
          
          // Current betting round information
          playerActions: {
            0: gameState?.playerActions?.[0] || null,
            1: gameState?.playerActions?.[1] || null,
            2: gameState?.playerActions?.[2] || null,
            3: gameState?.playerActions?.[3] || null,
          },
          
          // Folded players
          foldedPlayers: gameState?.foldedPlayers || [],
          
          // Pot information
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
      
      const apiUrl = getApiUrl('getAssistantAdvice');
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
        
        // Special handling for timeout errors (504)
        if (response.status === 504) {
          console.warn("Gateway timeout detected - API request took too long");
          
          if (retryCount < maxRetries) {
            console.log(`Retrying request (attempt ${retryCount + 1} of ${maxRetries})...`);
            setError(`Request timed out. Retrying (${retryCount + 1}/${maxRetries})...`);
            
            // Wait a moment before retrying to allow system to recover
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Retry the request
            return getAdvice(retryCount + 1, maxRetries);
          }
        }
        
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
        } catch (jsonError) {
          // If we can't parse JSON, just use the status text
          throw new Error(`API error: ${response.statusText || response.status}`);
        }
      }
      
      // Processing the response
      console.log(`API response status: ${response.status} ${response.statusText}`);
      
      let responseData;
      const responseText = await response.text();
      
      console.log('Raw API response:', responseText);
      
      // Only try to parse as JSON if there's actual content
      if (responseText && responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
      } else {
        // Handle empty response
        console.error('Empty response received from API');
        throw new Error('Empty response from server');
      }
      
      if (responseData.advice) {
        // The backend returns { advice: "content" } structure
        console.log("Setting advice from API:", responseData.advice);
        setAdvice(responseData.advice);
      } else if (responseData.content) {
        // Just in case the structure is { content: "content" }
        console.log("Setting content from API:", responseData.content);
        setAdvice(responseData.content);
      } else {
        console.log("No advice in API response");
        throw new Error("No advice was returned from the AI assistant");
      }
      
      // Clear any previous errors
      setError('');
    } catch (error) {
      console.error("Failed to get advice from AI assistant:", error);
      
      if (error.message.includes('timed out') || error.message.includes('timeout')) {
        setError(`Request timed out. The AI service is taking too long to respond. Please try again later or refresh the page.`);
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
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
      
      const apiUrl = getApiUrl('getAssistantAdvice');
      console.log(`Calling API endpoint for next hand: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
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

  // Determine the stage of the game based on community cards
  const determineStage = (cards) => {
    if (!cards || cards.length === 0) return 'preflop';
    if (cards.length === 3) return 'flop';
    if (cards.length === 4) return 'turn';
    if (cards.length === 5) return 'river';
    return 'unknown';
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
      
      const apiUrl = getApiUrl('getAssistantAdvice');
      console.log(`Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
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
            {isLoading ? 'Connecting...' : 'Retry Connection'}
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
        <div className="ai-advice-container">
          <div className="advice-content">
            <p>Select your cards to get advice from the AI assistant.</p>
          </div>
        </div>
      )}
      
      {/* Button controls */}
      <div className="ai-buttons">
        <button className="reset-thread-btn" onClick={resetThread}>
          <span>Reset Thread</span>
        </button>
        <button className="next-hand-btn" onClick={nextHand}>
          <span>Next Hand</span>
        </button>
        <button className="test-btn" onClick={testConnection}>
          <span>Test API</span>
        </button>
      </div>
    </div>
  );
}

export default AIAdvice; 