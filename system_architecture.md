# System Architecture

## Component Diagram

This diagram illustrates the high-level components and their connections.

```mermaid
graph TD
    subgraph "External Services"
        Discord[Discord API]
        YouTube[YouTube Data API]
    end

    subgraph "ParticipationManagerBot (Node.js)"
        DiscordClient[Discord Client]
        APIServer[API Server (Express :3000)]
        GameManager[GameManager (Logic)]
        Storage[Storage]
        DataFile[(data.json)]

        DiscordClient <--> Discord
        DiscordClient --> GameManager
        APIServer --> GameManager
        GameManager --> Storage
        Storage --> DataFile
    end

    subgraph "ParticipationManager (Web App)"
        UI[Vue.js UI]
        BotClient[Bot API Client]
        YTClient[YouTube Client]

        UI --> BotClient
        UI --> YTClient
        YTClient <--> YouTube
    end

    %% Interactions
    BotClient -- "Control & Sync" --> APIServer
    
    classDef service fill:#f9f,stroke:#333,stroke-width:2px;
    classDef component fill:#bbf,stroke:#333,stroke-width:1px;
    classDef storage fill:#ff9,stroke:#333,stroke-width:1px;
    
    class Discord,YouTube service;
    class DiscordClient,APIServer,GameManager,UI,BotClient,YTClient component;
    class DataFile storage;
```

## Sequence Diagrams

### 1. User Joins via YouTube Chat
This flow shows how a YouTube comment ("参加希望") is processed to add a user to the Bot's queue.

```mermaid
sequenceDiagram
    participant User
    participant YouTube
    participant WebApp as Web App (Browser)
    participant Bot as Bot API (:3000)
    participant Logic as GameManager
    participant Discord

    User->>YouTube: Comment "参加希望"
    loop Every 5s
        WebApp->>YouTube: Poll Chat Messages
        YouTube-->>WebApp: New Messages
    end
    WebApp->>WebApp: Detect "参加希望"
    WebApp->>Bot: POST /api/join {name, id}
    Bot->>Logic: addPlayer(id, name)
    Logic-->>Bot: Success
    Bot-->>WebApp: 200 OK
    
    par Sync UI
        loop Every 2s
            WebApp->>Bot: GET /api/state
            Bot-->>WebApp: {queue, session...}
            WebApp->>WebApp: Update UI
        end
    and Notify Discord
        Logic->>Discord: (Optional: Announce join)
    end
```

### 2. User Joins via Discord
This flow shows how a Discord message ("!join" or "参加希望") is processed.

```mermaid
sequenceDiagram
    participant User
    participant Discord
    participant BotClient as DiscordClient
    participant Logic as GameManager
    participant WebApp as Web App (Browser)

    User->>Discord: Message "!join" / "参加希望"
    Discord->>BotClient: Event: MessageCreate
    BotClient->>Logic: addPlayer(id, name)
    Logic-->>BotClient: Success
    BotClient->>Discord: Reply "Added to queue"
    Discord-->>User: Show Reply

    loop Every 2s
        WebApp->>Logic: GET /api/state (via API)
        Logic-->>WebApp: {queue, session...}
        WebApp->>WebApp: Update UI
    end
```

### 3. Session Management (Web App)
This flow shows how the Web App controls the Bot to start a new session.

```mermaid
sequenceDiagram
    participant Admin as User (Web)
    participant WebApp
    participant Bot as Bot API
    participant Logic as GameManager
    participant Discord

    Admin->>WebApp: Click "Start Next Session"
    WebApp->>Bot: POST /api/next {size}
    Bot->>Logic: pickSession(size)
    Logic->>Logic: Sort Queue & Pick Players
    Logic->>Logic: Save to data.json
    Logic-->>Bot: Success {players}
    Bot-->>WebApp: 200 OK
    
    par Update UI
        WebApp->>WebApp: Start Timer
        WebApp->>WebApp: Update Session View
    and Announce
        Logic->>Discord: Send "Session Started" Message
    end
```
