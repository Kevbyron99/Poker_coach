import './App.css';
import PokerAssistant from './components/PokerAssistant';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Poker Odds Calculator</h1>
        <p>Welcome to the Updated Poker Odds Calculator</p>
      </header>
      <main>
        <PokerAssistant />
      </main>
      <footer>
        <p>© {new Date().getFullYear()} Poker Assistant</p>
      </footer>
    </div>
  );
}

export default App;
