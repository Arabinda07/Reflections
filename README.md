<div align="center">

<img width="80" src="https://vitejs.dev/logo.svg" alt="Reflections Logo" />
# 🌿 Reflections

A calm, AI-powered journaling sanctuary for mental clarity and self-understanding.

No streaks. No pressure. No optimisation loops.  
Just a quiet space to think, write, and understand yourself.

---

## 📖 Overview

Reflections is a journaling application designed to help users process thoughts, track emotions, and build self-awareness over time.

It focuses on:
- Simplicity over complexity
- Reflection over productivity
- Privacy over data exploitation

---

## ✨ Features

### 📝 Writing
- Rich text editor (Quill.js)
- Focus mode for distraction-free writing
- Mood tracking
- Tags for organisation
- Attachments (images, files, tasks)

### 🤖 AI Reflection
- On-demand reflections powered by Google Gemini
- Human-like tone (non-clinical)
- User-triggered (never automatic)
- Crisis detection before API usage

### 📊 Insights
- Mood trends over time
- Tag-based theme tracking
- Writing consistency insights

### 🔐 Privacy & Security
- Supabase Authentication (Email + Google OAuth)
- Row Level Security (RLS)
- Secure file storage with signed URLs
- No AI training on user data

---

## 🛠 Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Google Gemini |
| Editor | Quill.js |
| Charts | Recharts |
| Animations | Motion |
| Audio | Web Audio API |

---

## 📂 Project Structure

```
├── pages/
├── components/
├── services/
├── context/
├── supabase_setup.sql
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Supabase project
- Google Gemini API key

### Installation

```bash
git clone https://github.com/Arabinda07/Reflections.git
cd Reflections
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_api_key
```

### Run the App

```bash
npm run dev
```

---

## 🧪 Testing

```bash
npm test
```

---

## 🚧 Roadmap

- Stripe integration
- End-to-end encryption
- Offline support
- Export notes (PDF/Markdown)

---

## 👤 Author

Arabinda Saha

---

## 📄 License

MIT License
