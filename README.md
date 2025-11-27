# ParticipationManagerBot

Discord Bot for managing participation queues and sessions, designed to integrate with the ParticipationManager Web App.

## Features

- **Queue Management**: Users can join/leave a waiting list.
- **Session Management**: Automatically picks players based on play count (fairness) and join time.
- **Persistence**: Data is saved to `data.json` and survives restarts.
- **Web API**: Exposes a local API (port 3000) for external control (e.g., from the Web App).
- **Natural Language Support**: Detects "参加希望" and "参加辞退" in messages.

## Commands

| Command | Description |
| :--- | :--- |
| `!join [Name]` | Join the waiting queue. |
| `!leave` | Leave the waiting queue. |
| `!list` | Show the current waiting queue. |
| `!next [size]` | Start a new session with `[size]` players (default 1). |
| `!session` | Show players in the current session. |
| `!finish` | End the current session and update play counts. |
| `!reset` | Reset the queue and session (History is preserved). |
| `!ping` | Check if bot is alive. |

### Keywords
You can also use natural language in any message:
- **"参加希望"**: Same as `!join`
- **"参加辞退"**: Same as `!leave`

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   ```

3. **Run**:
   ```bash
   node index.js
   ```

## API Integration

The bot starts an Express server on `http://localhost:3000`.
- `GET /api/state`: Get current queue/session/history.
- `POST /api/join`: Add a player.
- `POST /api/remove`: Remove a player.
- `POST /api/next`: Start session.
- `POST /api/finish`: End session.
