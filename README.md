# LiveKit Voice Agent (frontend)

A small Next.js + LiveKit frontend that joins a room, requests a token, and dispatches a voice agent.

## Quick start

```bash
npm install

cat > .env.local <<'EOF'
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
NEXT_PUBLIC_AGENT_NAME=my-voice-agent
EOF

npm run dev
```

Open http://localhost:3000 and allow microphone access.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – start the built app
- `npm run lint` – ESLint (uses Next.js config)

## Requirements

- Node.js 20+
- LiveKit API key/secret and a reachable LiveKit server (`NEXT_PUBLIC_LIVEKIT_URL`)
- An agent worker registered under `NEXT_PUBLIC_AGENT_NAME` so dispatch succeeds
