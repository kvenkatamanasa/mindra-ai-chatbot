# 🤖 Mindra — AI Chatbot

Mindra is a modern AI chatbot built with **Next.js, Supabase, and Ollama**. It provides a ChatGPT-style conversational interface with user authentication, conversation management, persistent chat history, and locally hosted AI models.

## 🚀 Features

* 🤖 AI chatbot powered by local Ollama models
* 💬 Real-time chat interface
* 🔐 User authentication with Supabase
* 💾 Persistent conversations and messages
* 🗂️ Create and manage multiple conversations
* ✏️ Rename conversations
* 🗑️ Delete conversations
* 🧹 Clear conversations
* 📌 Pin conversations
* 🎨 Light / Dark / System theme
* ⚙️ Chat settings
* 📤 Export conversations
* ⌨️ Keyboard shortcuts
* 📱 Responsive chatbot interface
* 🔒 No OpenAI API credits required for local AI usage

## 🛠️ Tech Stack

| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| Next.js        | Frontend and application framework |
| React          | User interface                     |
| TypeScript     | Type-safe development              |
| Supabase       | Authentication and database        |
| Ollama         | Local AI model execution           |
| Tailwind CSS   | UI styling                         |
| React Markdown | Markdown rendering                 |
| Remark GFM     | GitHub-flavored Markdown           |

## 📁 Project Structure

```text
mindra-chatbot/
│
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── conversations/
│   │   │   └── route.ts
│   │   └── messages/
│   │       └── route.ts
│   │
│   ├── chat/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── register/
│   │   └── page.tsx
│   │
│   └── page.tsx
│
├── components/
│
├── public/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Requirements

Before running Mindra locally, install:

* Node.js
* npm
* Git
* Ollama

You also need a Supabase project.

## 📥 Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

Move into the project:

```bash
cd mindra-chatbot
```

Install dependencies:

```bash
npm install
```

## 🔐 Environment Variables

Create a file named:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can use `.env.example` as a template.

### ⚠️ Important

Never upload `.env.local` to GitHub.

Make sure `.gitignore` contains:

```gitignore
.env
.env.local
.env*.local
```

## 🗄️ Supabase Setup

Create a Supabase project and configure authentication and the required database tables for:

* Users
* Conversations
* Messages

The application uses Supabase for authentication and persistent chat storage.

## 🤖 Ollama Setup

Install Ollama and download a model.

For example:

```bash
ollama pull llama3.2
```

Start Ollama if it is not already running:

```bash
ollama serve
```

You can check the installed models with:

```bash
ollama list
```

Mindra can then communicate with the locally running Ollama service.

## ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## ☁️ Deploy to Vercel

Mindra can be deployed to Vercel.

### 1. Push the project to GitHub

```bash
git add .
git commit -m "Initial Mindra chatbot"
git push
```

### 2. Import the repository into Vercel

Create a new Vercel project and select your GitHub repository.

### 3. Add Environment Variables

In:

```text
Vercel
→ Project
→ Settings
→ Environment Variables
```

Add:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Use your actual Supabase values.

### 4. Redeploy

After adding or changing environment variables, redeploy the project.

> `.env.local` is used for local development. Vercel uses the Environment Variables configured in the Vercel project.

## 🔒 Security

Do not commit sensitive credentials.

Never upload:

```text
.env.local
```

to GitHub.

Use:

```text
.env.example
```

to show the required variable names without exposing credentials.

## ⌨️ Keyboard Shortcuts

| Shortcut               | Action            |
| ---------------------- | ----------------- |
| `Ctrl + K` / `Cmd + K` | Focus chat/search |
| `Shift + N`            | New conversation  |
| `Shift + S`            | Open settings     |
| `Esc`                  | Stop/close        |

## 🧠 Supported AI Models

Depending on your Ollama installation, Mindra can work with models such as:

```text
llama3.2:latest
llama3.2:3b
llama3.1:8b
mistral:latest
gemma3:latest
```

Models must be installed locally through Ollama before they can be used.

## 📌 Important Deployment Note

Ollama runs locally on your computer.

Therefore, deploying the Next.js frontend/backend to Vercel does **not automatically make your local Ollama installation available to the Vercel deployment**.

For a fully deployed AI chatbot, the AI inference service needs to be accessible from the deployed application.

For local development:

```text
Browser
   ↓
Mindra / Next.js
   ↓
Ollama
   ↓
Local AI Model
```

For production deployment, you need an AI inference service that the deployed application can securely access.

## 🎯 Project Goal

Mindra was created as a full-stack AI chatbot project demonstrating:

* Modern Next.js development
* Authentication
* Database integration
* AI integration
* Conversation persistence
* API development
* Responsive UI design
* Local AI model usage

## 📄 License

This project is available for educational and personal development purposes.
