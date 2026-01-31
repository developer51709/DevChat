# Discord Developers Board

A real-time messaging board for Discord development teams.

## Recent Changes (Jan 31, 2026)
- Migrated to PostgreSQL for robust data management.
- Implemented full moderation suite: bans, timeouts, message removal, and audit logs.
- Added real-time profile sync via WebSockets.
- Fixed DM reliability and conversation list visibility.
- Enabled moderation reporting for all users.
- Added unban and untimeout functionality in the admin dashboard.

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + Shadcn UI components
- TanStack Query for data fetching
- Wouter for routing
- WebSocket for real-time updates

### Backend
- Express.js
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- WebSocket server on /ws path
- Session-based authentication

## Database Schema

### Tables
- **users**: id (varchar UUID), username (unique), password (hashed), createdAt
- **channels**: id (varchar UUID), name, description, createdBy (user ref), createdAt
- **messages**: id (varchar UUID), content, channelId (channel ref), userId (user ref), createdAt

## API Routes

### Authentication
- POST /api/register - Register new user (username, password)
- POST /api/login - Login user (username, password)
- POST /api/logout - Logout current user
- GET /api/user - Get current authenticated user (returns 401 if not logged in)

### Channels
- GET /api/channels - Get all channels (requires auth)
- GET /api/channels/:id - Get specific channel (requires auth)
- POST /api/channels - Create new channel (requires auth, body: { name, description? })

### Messages
- GET /api/channels/:channelId/messages - Get all messages for a channel (requires auth)
- POST /api/messages - Send message (requires auth, body: { content, channelId })

## WebSocket

- Connected on path: /ws
- Real-time message updates broadcast to all connected clients
- Message format: { type: "NEW_MESSAGE", channelId, message }

## Application Flow

1. **Authentication**: Users must register/login to access the app
2. **Channel Management**: Users can create channels with names and descriptions
3. **Messaging**: Users can send messages in any channel
4. **Real-time Updates**: Messages appear instantly via WebSocket for all users

## UI Structure

- **Auth Page** (/auth): Login and registration forms with hero section
- **Home Page** (/): Three-column layout
  - Left: Channel list with create button and user profile at bottom
  - Center: Message area with channel header and message input
  - Messages show user avatar, username, timestamp, and content
  
## Running the App

- Server runs on port 5000
- Frontend served via Vite
- Database: PostgreSQL (Neon)
- Environment variables: DATABASE_URL, SESSION_SECRET

## Key Features

- Dark mode by default (Discord-inspired theme)
- Real-time message updates
- Session-based authentication with secure password hashing
- Message history persistence
- Responsive design
