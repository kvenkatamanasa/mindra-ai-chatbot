# Mindra — fixes and required Supabase setup

## Fixed in this version
- Login/register flow is enforced: `/` sends unauthenticated users to `/login`; `/chat` is protected by `proxy.ts`.
- Signup email confirmation redirects through `/auth/callback` back to `/chat`.
- Theme switching now works with Tailwind v4 because `dark:*` utilities are tied to the app's `.dark` class.
- Streaming assistant responses are saved through `POST /api/messages` after generation and the returned database message id is attached to the UI, so thumbs-up/down feedback can be saved.
- Conversation rename uses `PATCH /api/conversations`.
- Conversation delete uses `DELETE /api/conversations` and removes its messages.
- Conversation history is loaded from Supabase per authenticated user.

## Before running/deploying
1. Create/configure the Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL Editor.
3. In Supabase Authentication, enable Email/Password.
4. If you want Google login, enable the Google provider and configure its OAuth credentials.
5. Add your production Vercel URL to Supabase Authentication URL configuration / redirect URLs, including:
   - `https://YOUR-DOMAIN.vercel.app/auth/callback`
6. In Vercel Environment Variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` and optionally `OPENAI_MODEL` for cloud AI, OR a reachable `OLLAMA_URL` for a publicly accessible Ollama server.
7. Do not upload `.env.local` to GitHub/Vercel.

## Local
```bash
npm install
npm run dev
```


## Mindra configuration

### Local development with Ollama
Install/start Ollama and make sure the selected model exists:

```powershell
ollama pull llama3.2:latest
ollama serve
```

The app defaults to:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
```

### Vercel deployment
Vercel cannot normally reach an Ollama server running on your Windows PC. For a cloud deployment, add these Environment Variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

`OPENAI_API_KEY` is optional and is only used if Gemini is not configured.

### Supported file uploads
PDF, DOCX, TXT, Markdown, CSV and JSON are supported. The deployment-safe upload limit is 3.5 MB.

### Google login
Google OAuth has been removed from the login and signup screens. Email/password authentication remains.

### Clear all chats
The Clear all conversations action now uses one authenticated bulk-delete request. Supabase's `ON DELETE CASCADE` removes the related messages.

### Feedback
Thumbs-up/down feedback is saved against the authenticated assistant message. If feedback fails, check that the `messages.feedback` column from `supabase-schema.sql` exists and that the messages RLS policy is enabled.

### Voice input
Voice input uses the browser Web Speech API. Chrome/Edge over localhost or HTTPS are recommended. Allow microphone permission when prompted.
