# CHOR-SIPAHI

A real-time multiplayer digital version of the traditional Chor-Sipahi game, designed for friends to create private rooms, assign secret roles, and compete in fast, social rounds.

## About the project

CHOR-SIPAHI is a full-stack web application built with React, Node.js, Express, Socket.IO, and MongoDB. Players can register, create or join game rooms, wait in a lobby, receive secret roles, and compete to identify the hidden Chor before the timer runs out.

## Features

- Professional landing page
- User authentication and secure JWT-based sessions
- Private room creation and invite-by-code gameplay
- Real-time multiplayer communication with Socket.IO
- Secret role assignment and server-side validation
- Live scoring and leaderboard updates
- Game history and player statistics
- Responsive design for desktop and mobile

## Tech stack

- React.js
- Vite
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT + bcrypt

## How it works

1. Sign up or log in.
2. Create a private room or join one using a game code.
3. Wait for four players to join the lobby.
4. Each player receives a secret role.
5. The Sipahi tries to identify the Chor.
6. Results and scores are calculated server-side.
7. View your leaderboard and match history.

## Run locally

### Prerequisites

- Node.js and npm
- MongoDB running locally or MongoDB Atlas
- Git

### 1) Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2) Set environment variables

Create a `.env` file in `server/`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
```

### 3) Start the app

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

The client runs at `http://localhost:5173` and the API runs on port `5000`.

## Data model

- `users` stores authentication data and player statistics
- `games` stores room state, role assignment, timer, and results
- `gameHistory` tracks completed matches

## Security notes

- Password hashing with bcrypt
- JWT-protected routes
- Server-side validation for game rules, scoring, and role assignment
- Sensitive config stored in environment variables

## Production notes

For a production deployment, use MongoDB Atlas or a replicated MongoDB setup, configure secure environment variables, and run Socket.IO behind a multi-instance-ready architecture with Redis if scaling horizontally.

## Future scope

- Public matchmaking
- In-game chat
- Achievements and rankings
- Tournament mode
- Spectator mode
- AI players

## Author

Dhiraj Kumar

GitHub: https://github.com/dhirajkumar62
