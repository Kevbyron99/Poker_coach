# Poker Assistant

A React application that helps you analyze poker hands and provides AI-powered advice for better decision making.

## Features

- Create and manage poker games with customizable settings
- Visual card selection interface for your hand and community cards
- Track known opponent cards
- Real-time win probability calculations
- AI-powered strategic advice based on your current poker situation
- Responsive design for desktop and mobile use

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your OpenAI API key (see below)
4. Start the development server:
   ```
   npm start
   ```

## Setting Up OpenAI API Integration

This application uses OpenAI's API to provide strategic poker advice. To set up the API key:

1. Get an API key from [OpenAI](https://platform.openai.com/account/api-keys)
2. Create a file named `.env.development.local` in the project root (if it doesn't exist)
3. Add your API key to this file:
   ```
   REACT_APP_OPENAI_API_KEY=your_api_key_here
   ```
4. Restart the development server if it's already running

**IMPORTANT SECURITY NOTES:**
- NEVER commit files containing API keys to version control
- The current implementation uses the API key directly in the browser, which is not recommended for production
- For a production application, you should set up a secure backend server to handle API requests

## OpenAI Assistant Integration

This application now uses OpenAI Assistants API to provide personalized poker advice. The assistant:

- Maintains a persistent thread to learn from your gameplay
- Offers context-aware poker strategy advice
- Analyzes your hand strength, position, and odds
- Provides tailored recommendations based on the current game state

### Setup

1. Make sure you have an OpenAI account and have created an Assistant with poker instructions
2. Add your OpenAI API key to the `.env.development.local` file:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```
3. The application uses the Assistant ID: `asst_njK8PBKyiIeYVWBbsUsjmKBM`
   - You can change this in the `AIAdvice.js` component if you want to use your own assistant

### Running the Application with Assistant

To run the application with the poker assistant:

```bash
# Install dependencies
npm install

# Run both server and client
npm run dev
```

This will start both the React frontend and the Express backend server that handles the OpenAI Assistant API calls.

## How to Use

1. Click "Start New Game" to set up a new poker game
2. Fill in game details (number of players, blinds, etc.) and create the game
3. Select your cards and community cards using the visual card selector
4. View real-time win probabilities
5. Click "Get AI Advice" to receive strategic recommendations for your current situation

## Card Notation

- Use the following format for cards: [Rank][Suit]
- Ranks: 2, 3, 4, 5, 6, 7, 8, 9, T (10), J (Jack), Q (Queen), K (King), A (Ace)
- Suits: h (hearts), d (diamonds), c (clubs), s (spades)

## Dependencies

- React
- poker-odds (for calculating poker odds)
- OpenAI API (for AI-powered advice)

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
