# LiveKit Voice Agent (frontend)

A small Next.js + LiveKit frontend that joins a room, requests a token, and dispatches a voice agent.  
Live demo: https://test-fe-two-eta.vercel.app/

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   LIVEKIT_API_KEY=your_api_key_here
   LIVEKIT_API_SECRET=your_api_secret_here
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
   NEXT_PUBLIC_AGENT_NAME=my-voice-agent
   ```

## Setup notes

- Needs a reachable LiveKit server and an agent worker registered under `NEXT_PUBLIC_AGENT_NAME` so dispatch succeeds.
- Keep `.env.local` out of version control (ignored by default).

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – start the built app
- `npm run lint` – ESLint (uses Next.js config)

## Requirements

- Node.js 20+
- LiveKit API key/secret and a reachable LiveKit server (`NEXT_PUBLIC_LIVEKIT_URL`)
- An agent worker registered under `NEXT_PUBLIC_AGENT_NAME` so dispatch succeeds

```

```
