# ShipIt 🚢

**A real-time project management and collaboration app — built for teams who actually ship.**

Live demo: [shipit.gosagirma.me](https://shipit.gosagirma.me)

---

## What is ShipIt?

ShipIt is a full-stack Kanban-style project management tool, inspired by tools like Linear. It lets teams create workspaces, organize work into projects and boards, and collaborate in real time — no refreshing, no waiting, no syncing delays.

Every feature in ShipIt was built around one question: *would I actually use this if someone else built it?*

---

## Features

### Workspaces & Projects
- Create and manage workspaces with multiple members
- Organize work into projects within a workspace
- Workspace join requests — send, accept, or reject requests to join a team
- Role-based access for workspace admins (manage members, change roles, remove members)

### Kanban Board
- Drag-and-drop board built with `@hello-pangea/dnd`
- Optimistic UI — cards move instantly on screen before the server confirms
- Columns and cards with precise ordering, so positions stay accurate across drags
- Priority levels (urgent, high, medium, low) with color-coded badges
- "For you" badge for cards assigned to the current user

### Real-Time Collaboration
- Powered by Socket.io across the entire app
- Move a card and every teammate viewing the board sees it instantly
- Live activity logs broadcast to everyone on the board
- "Online now" indicator showing active workspace members
- Toast-style popup notifications when cards are moved (auto-dismiss after 5 seconds)

### Card Details & Comments
- Click any card to view full details, edit, or delete it
- Per-card comment threads with live updates via Socket.io
- Read/unread tracking for comments — see exactly which cards have unread messages, Telegram-style

### Search & Filtering
- Search for any card by title
- Filter cards by assignee or urgency

### Dashboard
- Personal command center on login
- At-a-glance stats: assigned to you, high urgency, unread notifications, your activity
- Board health overview: To Do / In Progress / Done counts, unassigned cards, overdue cards
- Recently touched cards and recent activity feed
- Quick actions to create a new card or project without leaving the page

### Settings
- Profile management: name, email, password, profile picture (via Cloudinary), account deletion
- Workspace settings (admin only): rename workspace, change icon, manage members and roles, delete workspace
- Notification preferences for card moves, messages, and join requests

### Authentication
- JWT-based auth with full login/register flow
- Protected routes on both frontend and backend

---

## Tech Stack

**Frontend**
- React + TypeScript
- Tailwind CSS
- Framer Motion (animations)
- `@hello-pangea/dnd` (drag and drop)
- Socket.io Client
- React Router

**Backend**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- Cloudinary (image storage)

**Deployment**
- Frontend: Vercel
- Backend: Render
- Custom subdomain: `shipit.gosagirma.me`

---

## Architecture Highlights

**Real-time presence system**
A nested `workspacePresence` map tracks which users are online in which workspace, enabling the "Online now" feature and live collaboration indicators.

**Read receipts**
A dedicated `CommentRead` model stores each user's last-read timestamp per card, rather than tracking every message individually. Unread counts are computed by comparing message timestamps against this record — the same pattern apps like Telegram use under the hood.

**Card and column ordering**
Both columns and cards store an `order` field to track exact position. Moving a card between columns triggers a reorder of both the source and destination columns, keeping every user's board in sync without conflicts.

**Optimistic UI**
When a card is dragged, the frontend updates state immediately and the server request happens in the background. If the request fails, the UI reverts — keeping the board feeling instant without sacrificing data integrity.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Cloudinary account (for profile picture uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/shipit.git
cd shipit

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

### Running Locally

```bash
# Start the backend
cd server
npm run dev

# Start the frontend (in a separate terminal)
cd client
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## Roadmap

ShipIt is actively being developed. Planned improvements include:

- Due dates and overdue card automation
- AI-assisted card suggestions
- Mobile-responsive board view
- Email notifications
- Integrations (GitHub, Slack)

---

## Author

Built by **Gosa Girma** — Full-Stack Developer

If you're a team looking for a real-time project management tool, give ShipIt a try. And if you do, I'd genuinely love your honest feedback.
