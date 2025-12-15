import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const roomName = req.nextUrl.searchParams.get('roomName') || 'default-room';
  const participantName = req.nextUrl.searchParams.get('participantName') || 'user-' + Math.floor(Math.random() * 1000);

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  // 1. Check if agent is already in the room or dispatched
  const roomService = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );

  const dispatchClient = new AgentDispatchClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );

  try {
    // Check if agent is already in the room
    const participants = await roomService.listParticipants(roomName);
    const existingAgent = participants.find((p) => p.identity.startsWith('agent-') || p.identity === 'my-voice-agent');
    
    // Only dispatch if no agent is present
    if (!existingAgent) {
      console.log(`Dispatching agent to room: ${roomName}`);
      await dispatchClient.createDispatch(
        roomName,
        'my-voice-agent'
      );
    } else {
      console.log(`Agent already present in room ${roomName}: ${existingAgent.identity}`);
    }

  } catch (error) {
    // If room doesn't exist yet, dispatch the agent
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      console.log(`Room ${roomName} doesn't exist yet, dispatching agent...`);
      try {
        await dispatchClient.createDispatch(
          roomName,
          'my-voice-agent'
        );
      } catch (dispatchError) {
        console.error('Failed to dispatch agent:', dispatchError);
      }
    } else {
      console.error('Failed to manage agent dispatch:', error);
    }
  }

  // 2. Generate Token for the User
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
    }
  );

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}
