# 🎮 CHOR-SIPAHI — Real-Time Multiplayer Gaming Platform

A modern digital adaptation of the traditional Indian Chor-Sipahi game, built to bring friends together through real-time multiplayer gameplay.

## 📌 About the Project

CHOR-SIPAHI is a full-stack web application where players can create private game rooms, invite friends using a unique room code, receive secret roles, and compete in an interactive multiplayer game.

The platform combines traditional gameplay with modern web technologies, secure authentication, real-time communication, and a responsive user interface.

## ✨ Features

- **Landing Page:** Professional introduction to the game and its features.
- **User Authentication:** Registration, login, JWT authentication, and password hashing.
- **Responsive UI:** Designed for mobile phones, tablets, laptops, and desktops.
- **Private Game Rooms:** Create and join rooms using unique game codes.
- **Real-Time Multiplayer:** Live player updates using Socket.IO.
- **Secret Role Assignment:** Server-side random role assignment.
- **Interactive Gameplay:** Sipahi attempts to identify the Chor.
- **Game Timer:** Server-controlled countdown for each round.
- **Automatic Scoring:** Scores calculated by the backend.
- **Leaderboard:** Compare player points and performance.
- **Game History:** Review previous games and results.
- **Player Profile:** Track games played, wins, and total points.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend user interface |
| Tailwind CSS | Responsive styling |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modeling |
| Socket.IO | Real-time multiplayer communication |
| JWT | Authentication |
| bcrypt | Password hashing |
| Git & GitHub | Version control |

## 🎭 Game Roles

- **Raja:** The highest-scoring role.
- **Sipahi:** Attempts to identify the Chor.
- **Chor:** Attempts to avoid identification.
- **Other:** Participates in the round.

Each four-player round contains one of each role. The backend manages role assignment and scoring.

## 🔄 How It Works

1. Register a new account or log in.
2. Create a private room or join one using a game code.
3. Wait for four players to join the lobby.
4. Start the game and receive a secret role.
5. The Sipahi selects the player suspected of being the Chor.
6. The server calculates the result and updates scores.
7. View the result, leaderboard, and game history.

## 🏗️ Architecture

```text
React.js Frontend
       |
       | REST API
       v
Node.js + Express.js
       |
       ├── JWT Authentication
       ├── Game Logic
       ├── Scoring Engine
       └── Socket.IO
              |
              v
          MongoDB
```

## 🗄️ Database Design

The application uses MongoDB collections to manage:

- `users` — User accounts and player statistics
- `games` — Game rooms, participants, and game status
- `gameHistory` — Completed games, roles, results, and points

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or local MongoDB
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/chor-sipahi-multiplayer-game.git
cd chor-sipahi-multiplayer-game
```

Install the frontend and backend dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
```

Never commit your real `.env` file or expose database credentials.

### Run the Application

Start the backend using the script configured in your `server/package.json`, for example:

```bash
npm run dev
```

In another terminal, start the frontend:

```bash
cd client
npm run dev
```

Open the local frontend URL displayed in your terminal.

## 🔐 Security

- Password hashing with bcrypt
- JWT-protected API routes
- Server-side authorization
- Server-controlled role assignment and scoring
- Input validation and error handling
- Environment variables for sensitive configuration

## 📱 Responsive Design

The interface is designed to adapt to mobile, tablet, and desktop screens, including the landing page, authentication forms, game lobby, gameplay, leaderboard, and profile pages.

## 🔮 Future Enhancements

- Public matchmaking
- In-game chat and voice communication
- Player achievements and ranking tiers
- Tournament mode
- Spectator mode
- AI opponents
- Progressive Web App (PWA)

## 🎓 Learning Outcomes

This project demonstrates full-stack web development, NoSQL database modeling, authentication, REST API design, real-time event handling, responsive UI development, and server-side game logic.

## 👨‍💻 Author

**Your Name**

- GitHub: https://github.com/YOUR_USERNAME

## 📄 License

This project can be distributed under the MIT License if an MIT `LICENSE` file is added to the repository.
