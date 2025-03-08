import React from 'react';
import './HandRankings.css';

function HandRankings() {
  const handRankings = [
    { name: 'Royal Flush', description: 'A, K, Q, J, 10 of the same suit', example: 'A♠ K♠ Q♠ J♠ 10♠' },
    { name: 'Straight Flush', description: 'Five sequential cards of the same suit', example: '8♥ 7♥ 6♥ 5♥ 4♥' },
    { name: 'Four of a Kind', description: 'Four cards of the same rank', example: 'K♠ K♥ K♦ K♣ 7♠' },
    { name: 'Full House', description: 'Three of a kind plus a pair', example: 'J♠ J♥ J♦ 8♠ 8♥' },
    { name: 'Flush', description: 'Five cards of the same suit', example: 'A♦ J♦ 8♦ 6♦ 2♦' },
    { name: 'Straight', description: 'Five sequential cards of mixed suits', example: 'Q♠ J♥ 10♦ 9♠ 8♣' },
    { name: 'Three of a Kind', description: 'Three cards of the same rank', example: '10♠ 10♥ 10♦ K♠ 4♥' },
    { name: 'Two Pair', description: 'Two separate pairs', example: 'A♠ A♥ J♦ J♠ 3♥' },
    { name: 'Pair', description: 'Two cards of the same rank', example: '9♠ 9♥ A♦ K♠ 2♣' },
    { name: 'High Card', description: 'Highest card plays', example: 'A♠ J♦ 8♠ 6♥ 4♣' }
  ];

  return (
    <div className="hand-rankings">
      <h3>Poker Hand Rankings</h3>
      <div className="rankings-container">
        {handRankings.map((hand, index) => (
          <div key={index} className="hand-rank">
            <div className="rank-number">{10-index}</div>
            <div className="rank-details">
              <h4>{hand.name}</h4>
              <p className="description">{hand.description}</p>
              <p className="example">{hand.example}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HandRankings; 