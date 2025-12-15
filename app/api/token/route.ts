import { AgentDispatchState } from '@livekit/protocol';
import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const AGENT_NAME =
  process.env.LIVEKIT_AGENT_NAME ||
  process.env.LK_AGENT_NAME ||
  process.env.NEXT_PUBLIC_AGENT_NAME ||
  'my-voice-agent';

function normalizeDispatchState(state: any): string | undefined {
  if (state === undefined || state === null) return undefined;
  if (typeof state === 'string') return state;
  if (typeof state === 'number') return (AgentDispatchState as any)[state] ?? String(state);
  if (typeof state === 'object') {
    const inner = (state as any).state ?? (state as any).value ?? (state as any).status;
    if (typeof inner === 'string') return inner;
    if (typeof inner === 'number') return (AgentDispatchState as any)[inner] ?? String(inner);
    try {
      return JSON.stringify(state);
    } catch {
      return String(state);
    }
  }
  return String(state);
}

function isAgentIdentity(identity: string | undefined | null) {
  if (!identity) return false;
  const normalized = identity.toLowerCase();
  const agentName = AGENT_NAME.toLowerCase();

  return (
    normalized === agentName ||
    normalized === `agent-${agentName}` ||
    normalized === `agent_${agentName}` ||
    normalized.startsWith('agent-') ||
    normalized.startsWith('agent_')
  );
}

export async function GET(req: NextRequest) {
  const roomName = req.nextUrl.searchParams.get('roomName') || 'default-room';
  const participantName = req.nextUrl.searchParams.get('participantName') || 'user-' + Math.floor(Math.random() * 1000);

  const livekitApiUrl =
    process.env.LIVEKIT_API_URL ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss/i, 'https');

  if (
    !process.env.LIVEKIT_API_KEY ||
    !process.env.LIVEKIT_API_SECRET ||
    !process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    !livekitApiUrl
  ) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  // 1. Check if agent is already in the room or dispatched
  const roomService = new RoomServiceClient(
    livekitApiUrl,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );

  const dispatchClient = new AgentDispatchClient(
    livekitApiUrl,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );

  let existingAgent;
  let agentDispatchId: string | undefined;
  let agentDispatchError: string | undefined;
  let dispatchState: string | undefined;
  let dispatchJobs: number | undefined;
  let jobStatuses: Array<{ id?: string; status?: string; workerId?: string }> | undefined;

  try {
    // Check if agent is already in the room
    const participants = await roomService.listParticipants(roomName);
    existingAgent = participants.find((p) => isAgentIdentity(p.identity));
    
    // Only dispatch if no agent is present
    if (!existingAgent) {
      console.log(`Dispatching agent to room: ${roomName}`);
      const dispatch = await dispatchClient.createDispatch(
        roomName,
        AGENT_NAME
      );
      agentDispatchId = dispatch?.id;
      dispatchState = normalizeDispatchState(dispatch?.state);
      const jobs = (dispatch as any)?.jobs;
      dispatchJobs = Array.isArray(jobs) ? jobs.length : undefined;
      jobStatuses = Array.isArray(jobs)
        ? jobs.map((j: any) => ({
            id: j?.id,
            status: normalizeDispatchState(j?.state?.status),
            workerId: j?.state?.workerId,
          }))
        : undefined;

      // Refresh dispatch info (some servers return minimal info on create)
      const dispatches = await dispatchClient.listDispatch(roomName);
      const latest = dispatches.find((d) => d.id === agentDispatchId) ?? dispatches[0];
      if (latest) {
        agentDispatchId = latest.id;
        dispatchState = normalizeDispatchState(latest.state);
        const latestJobs = (latest as any)?.jobs;
        dispatchJobs = Array.isArray(latestJobs) ? latestJobs.length : dispatchJobs;
        jobStatuses = Array.isArray(latestJobs)
          ? latestJobs.map((j: any) => ({
              id: j?.id,
              status: normalizeDispatchState(j?.state?.status),
              workerId: j?.state?.workerId,
            }))
          : jobStatuses;
      }
    } else {
      console.log(`Agent already present in room ${roomName}: ${existingAgent.identity}`);
    }

  } catch (error) {
    // If room doesn't exist yet, dispatch the agent
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      console.log(`Room ${roomName} doesn't exist yet, dispatching agent...`);
      try {
        await roomService.createRoom({ name: roomName });
        await dispatchClient.createDispatch(
          roomName,
          AGENT_NAME
        );
        const dispatches = await dispatchClient.listDispatch(roomName);
        const newDispatch = dispatches[0];
        agentDispatchId = newDispatch?.id || 'created-after-room-init';
        dispatchState = normalizeDispatchState(newDispatch?.state);
        const newJobs = (newDispatch as any)?.jobs;
        dispatchJobs = Array.isArray(newJobs) ? newJobs.length : undefined;
        jobStatuses = Array.isArray(newJobs)
          ? newJobs.map((j: any) => ({
              id: j?.id,
              status: normalizeDispatchState(j?.state?.status),
              workerId: j?.state?.workerId,
            }))
          : undefined;
      } catch (dispatchError) {
        console.error('Failed to dispatch agent:', dispatchError);
        agentDispatchError = (dispatchError as Error).message;
      }
    } else {
      console.error('Failed to manage agent dispatch:', error);
      agentDispatchError = (error as Error).message;
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

  return NextResponse.json({
    token: await at.toJwt(),
    agent: {
      name: AGENT_NAME,
      present: Boolean(existingAgent),
      dispatchId: agentDispatchId,
      dispatchState,
      dispatchJobs,
      jobStatuses,
      error: agentDispatchError,
    },
  });
}
