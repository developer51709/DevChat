# Discord Developers Board

A real-time messaging board for Discord development teams.

## Recent Changes (March 19, 2026)
- Added profile picture support: upload via Settings, shown everywhere (avatars, messages, profile page)
- Added real file attachment sending: images previewed inline, other files as download links
- Fixed emoji reactions not showing in chat (storage was returning hardcoded empty reactions)
- Fixed channel message deletion FK constraint (reports.targetMessageId now uses onDelete: set null)
- Fixed DM edit/delete/reactions with unified server routes + WebSocket events for UPDATE_DM/DELETE_DM
- Removed duplicate /api/reports/app route

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
- Token-based authentication (Bearer tokens stored in localStorage)
- WebSocket server on /ws path
- Multer for file uploads (stored in /uploads directory, served statically)

## Database Schema

### Tables
- **users**: id, username (unique), displayName, password (hashed), role, bio, avatarUrl, isBanned, timeoutUntil, createdAt
- **channels**: id, name, description, createdBy (user ref), createdAt
- **messages**: id, content, channelId (cascade delete), userId (user ref), attachments (text[]), reactions (JSON string), createdAt
- **direct_messages**: id, content, senderId, receiverId, attachments (text[]), reactions (JSON string), createdAt
- **reports**: id, reporterId, targetUserId, targetMessageId (set null on delete), reason, status, createdAt
- **moderation_logs**: id, action, targetId, reason, adminId, createdAt

## API Routes

### Authentication
- POST /api/register - Register new user
- POST /api/login - Login user
- POST /api/logout - Logout current user
- GET /api/user - Get current authenticated user

### Channels
- GET /api/channels - Get all channels
- GET /api/channels/:id - Get specific channel
- POST /api/channels - Create channel (admin only)
- PATCH /api/channels/:id - Update channel (admin only)
- DELETE /api/channels/:id - Delete channel (admin only)

### Messages
- GET /api/channels/:channelId/messages - Get channel messages
- POST /api/messages - Send channel message (supports attachments array)
- PATCH /api/messages/:id - Edit message (works for both channel messages and DMs)
- DELETE /api/messages/:id - Delete message (works for both channel messages and DMs)
- POST /api/messages/:id/reactions - Toggle emoji reaction (works for both)

### Direct Messages
- POST /api/dms - Send DM (supports attachments array)
- GET /api/dms/:userId - Get DM conversation
- GET /api/dms/conversations - Get recent conversation list

### File Uploads
- POST /api/upload - Upload file attachment (multipart/form-data, field: "file")
- POST /api/user/avatar - Upload profile picture (multipart/form-data, field: "avatar")

### Profile & Settings
- PATCH /api/user/profile - Update profile (username, displayName, bio, avatarUrl)
- PATCH /api/user/password - Change password
- DELETE /api/user - Delete account

### Moderation (Admin/Moderator)
- GET /api/admin/users - List all users
- PATCH /api/admin/users/:id/role - Change user role
- DELETE /api/admin/users/:id - Delete user
- POST /api/admin/users/:id/ban - Ban user
- POST /api/admin/users/:id/unban - Unban user
- POST /api/admin/users/:id/timeout - Timeout user
- POST /api/admin/users/:id/untimeout - Remove timeout
- GET /api/admin/logs - Get moderation logs
- GET /api/admin/reports - Get user reports
- PATCH /api/admin/reports/:id - Update report status
- DELETE /api/moderation/messages/:id - Moderator delete message
- POST /api/reports - Submit a user/message report
- POST /api/reports/app - Submit an app issue report

## WebSocket Events
- NEW_MESSAGE / UPDATE_MESSAGE / DELETE_MESSAGE - Channel message events (invalidate channel messages cache)
- NEW_DM / UPDATE_DM / DELETE_DM - Direct message events (invalidate DM cache)
- USER_UPDATE - Profile/avatar changes (invalidate user cache)

## File Storage
- Files stored in /uploads directory at project root
- Served statically at /uploads/* path
- 10MB size limit per file
- Allowed types: images (jpg/png/gif/webp), pdf, txt, doc, docx, zip, mp4, mp3

## Running the App
- Server runs on port 5000
- Frontend served via Vite
- Database: PostgreSQL
- Environment variables: DATABASE_URL, SESSION_SECRET
