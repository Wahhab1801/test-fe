# LiveKit Voice Agent

A real-time voice assistant application built with Next.js and LiveKit, featuring AI-powered voice interactions with speech-to-text and text-to-speech capabilities.

![LiveKit Voice Agent Demo](https://img.shields.io/badge/LiveKit-Enabled-blue?style=for-the-badge&logo=livekit)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## Features

- **Real-time Voice Interaction** - Seamless voice communication with AI agents
- **AI Voice Agent** - Automated agent dispatch and connection management
- **Modern UI** - Clean, responsive interface with real-time status indicators
- **Live Visualizers** - Audio visualizers for both user and agent
- **Auto-reconnection** - Robust connection handling with automatic recovery
- **Participant Tracking** - Real-time display of room participants

## Tech Stack

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) with TypeScript
- **Real-time Communication**: [LiveKit](https://livekit.io/)
- **UI Components**: [@livekit/components-react](https://github.com/livekit/components-js)
- **Styling**: TailwindCSS 4
- **Language**: TypeScript 5

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A LiveKit Cloud account (or self-hosted LiveKit server)
- LiveKit API credentials (API Key, API Secret, WebSocket URL)
- A LiveKit Agent worker running (Python backend)

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
   NEXT_PUBLIC_ROOM_NAME=pre-test-room-3
   ```

   > **Important**: Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

## Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Start talking!**
   
   Allow microphone permissions and start speaking. The AI agent will automatically join and respond.

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── token/
│   │       └── route.ts          # Token generation & agent dispatch
│   ├── components/
│   │   └── Room.tsx              # Main LiveKit room component
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── .env.local                    # Environment variables (not committed)
├── .gitignore                    # Git ignore rules
└── package.json                  # Dependencies
```

## How It Works

### Agent Dispatch Flow

1. User connects to the application
2. Frontend requests a token from `/api/token`
3. Backend checks if an agent already exists in the room
4. If no agent exists, dispatches a new agent via LiveKit Agent Dispatch API
5. Backend Python worker accepts the dispatch and joins the room
6. Frontend detects the agent and displays "Connected" status

### Key Components

- **`Room.tsx`**: Main component handling LiveKit room connection, participant management, and UI rendering
- **`/api/token/route.ts`**: API endpoint for generating user tokens and managing agent dispatch
- **Agent Detection**: Identifies agents by checking for identities starting with `agent-` or matching `my-voice-agent`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Configuration

### Room Settings

The default room name is `pre-test-room-3`. To change it, modify:

```typescript
// app/components/Room.tsx
const resp = await fetch(
  `/api/token?roomName=your-room-name&participantName=user-${Math.floor(Math.random() * 1000)}`
);
```

### Agent Identity

Agent identities are configured in:

```typescript
// app/api/token/route.ts
await dispatchClient.createDispatch(
  roomName,
  'my-voice-agent'  // Change this to customize agent identity
);
```

## Troubleshooting

### Agent Not Connecting

- Verify your backend Python agent worker is running
- Check that environment variables are set correctly
- Ensure LiveKit credentials are valid
- Check browser console for errors

### Audio Not Working

- Grant microphone permissions in your browser
- Check that your microphone is properly connected
- Verify audio devices in system settings

### Connection Issues

- Verify `NEXT_PUBLIC_LIVEKIT_URL` is correct
- Check network connectivity
- Review browser console for WebSocket errors

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_API_KEY` | Your LiveKit API key | `APIxxxxxxx` |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret | `xxxxxxxxxx` |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_AGENT_NAME` | Agent name configured in backend/LiveKit Cloud | `my-voice-agent` |
| `NEXT_PUBLIC_ROOM_NAME` | Default room to join when requesting a token | `pre-test-room-3` |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:

- **Build**: `npm run build`
- **Start**: `npm start`

## Backend Agent

This frontend works with a LiveKit Agent worker (Python backend). For the complete setup, you'll need:

1. A Python worker that uses `livekit-agents` SDK
2. Integration with STT (Speech-to-Text) service
3. Integration with LLM (e.g., OpenAI, Groq)
4. Integration with TTS (Text-to-Speech) service

Refer to the [LiveKit Agents documentation](https://docs.livekit.io/agents/) for backend setup.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [LiveKit Components React](https://docs.livekit.io/reference/components/react/)
- [LiveKit Agents Guide](https://docs.livekit.io/agents/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [LiveKit Discord](https://livekit.io/discord)
- Review [LiveKit documentation](https://docs.livekit.io/)

---

Built with using [LiveKit](https://livekit.io/) and [Next.js](https://nextjs.org/)
