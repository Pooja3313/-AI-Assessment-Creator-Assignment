# VedaAI — AI-Powered Assessment Creator

A full-stack web application for teachers to create AI-powered question papers. Teachers can generate, view, download, and manage assignments using AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for MongoDB + Redis)
- Groq API key (in `.env`)

### 1. Start Backend Services (MongoDB + Redis)
```bash
docker-compose up -d
```

### 2. Install & Build
```bash
cd vedaai
npm install
npm run build -w @vedaai/types
```

### 3. Start Development
Open 3 terminals:

```bash
# Terminal 1 - Backend Server
npm run dev:backend

# Terminal 2 - AI Worker
npm run worker

# Terminal 3 - Frontend
npm run dev:frontend
```

Visit **http://localhost:3000**

## 🏗️ Architecture

```
vedaai/
├── apps/
│   ├── backend/        # Express + Socket.IO + BullMQ server
│   │   └── src/
│   │       ├── server.ts            # Express app entry
│   │       ├── socket.ts            # WebSocket handling
│   │       ├── routes/assignments.ts # CRUD API routes
│   │       ├── models/Assignment.ts  # Mongoose schema
│   │       ├── queues/              # BullMQ queue
│   │       ├── workers/             # AI generation worker
│   │       └── lib/redis.ts         # Redis cache helper
│   └── frontend/       # Next.js 14 app (React + Tailwind)
│       └── src/
│           ├── app/
│           │   ├── assignments/      # Listing + Create
│           │   ├── result/[id]/      # View paper/answers
│           │   ├── login/            # Auth page
│           │   └── signup/           # Registration page
│           ├── components/
│           │   ├── layout/          # Sidebar, AppShell, MobileNav
│           │   ├── ui/             # Button, Card, Dialog, etc.
│           │   ├── AssignmentCard   # Card with 3-dot menu
│           │   ├── QuestionPaper    # Full paper display
│           │   ├── AssignmentPDF    # PDF generation
│           │   └── PdfDownloadButton # PDF download button
│           ├── store/assignmentStore.ts # Zustand state
│           └── hooks/useAssignmentSocket.ts # WebSocket hook
└── packages/
    └── types/          # Shared TypeScript types
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Question Generation** | Powered by Groq API (llama-3.3-70b) |
| **7 Question Types** | MCQ, Short/Long Answer, True/False, Diagram, Numerical, Fill-in-Blanks |
| **Real-time Progress** | WebSocket updates during generation |
| **PDF Download** | Generate styled PDFs for both paper & answer key |
| **Search & Filter** | Real-time search by title, filter by status/subject |
| **Authentication** | Login/Signup pages (JWT ready) |
| **Mobile Responsive** | Bottom nav + FAB button on mobile |
| **Animations** | Staggered cards, swipe transitions, rotateY loading, floating icons |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List all assignments |
| `POST` | `/api/assignments` | Create new assignment (returns job ID) |
| `GET` | `/api/assignments/:id` | Get single assignment with generated paper |
| `DELETE` | `/api/assignments/:id` | Delete assignment |

## 🎨 Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO, BullMQ, Mongoose
- **Database:** MongoDB, Redis
- **AI:** Groq SDK (llama-3.3-70b-versatile)
- **PDF:** @react-pdf/renderer

## 🔧 Configuration

**apps/backend/.env:**
```
PORT=8000
MONGODB_URL=mongodb://localhost:27017/vedaai
REDIS_URL=redis://127.0.0.1:6379
GROQ_API_KEY=gsk_...
FRONTEND_URL=http://localhost:3000
```

**apps/frontend/.env.local:**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 📦 Deployment (Railway)

```bash
# Build frontend
cd apps/frontend
npm run build

# Backend & worker auto-deploy from root
# Set env vars in Railway dashboard
```

## 📁 Project Structure Summary

```
apps/backend/src/
  server.ts          → Express server (port 8000)
  socket.ts           → WebSocket init + event emitter
  routes/assignments.ts  → GET/POST/DELETE endpoints
  models/Assignment.ts   → MongoDB schema
  queues/assignmentQueue.ts → BullMQ queue
  workers/generationWorker.ts → AI generation worker
  lib/redis.ts       → Redis cache helper

apps/frontend/src/
  app/
    page.tsx          → Redirects to /assignments
    assignments/page.tsx     → Card grid with search/filter
    assignments/create/page.tsx → Multi-row question form
    result/[id]/page.tsx     → Paper + answer key view
    login/page.tsx           → Teacher login
    signup/page.tsx          → Teacher registration
  components/
    layout/AppShell.tsx      → Main layout with sidebar
    layout/Sidebar.tsx       → Sticky sidebar (280px, #0F172A)
    layout/MobileNav.tsx     → Bottom nav for mobile
    AssignmentCard.tsx       → Card with 3-dot menu + delete
    QuestionPaper.tsx        → Full exam paper with school header
    AssignmentPDF.tsx        → PDF document generator
    PdfDownloadButton.tsx    → Download button (paper/answer key)
  store/assignmentStore.ts   → Zustand state management
  hooks/useAssignmentSocket.ts → Real-time WebSocket hook
  lib/utils.ts               → cn() helper
  lib/difficulty.ts          → Difficulty slider logic
  lib/pdfExtract.ts          → PDF text extraction
```
</write_to_file>