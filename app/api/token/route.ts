import { AgentDispatchState, Job } from '@livekit/protocol';
import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const AGENT_NAME =
  process.env.LIVEKIT_AGENT_NAME ||
  process.env.LK_AGENT_NAME ||
  process.env.NEXT_PUBLIC_AGENT_NAME ||
  'my-voice-agent';
const ROOM_EMPTY_TIMEOUT = 30; // seconds
const MAX_PARTICIPANTS = 2;

type JobStatus = {
  id?: string;
  status?: string;
  workerId?: string;
};

function normalizeDispatchState(state: unknown): string | undefined {
  if (state === undefined || state === null) return undefined;
  if (typeof state === 'string') return state;
  if (typeof state === 'number') return AgentDispatchState[state] ?? String(state);
  if (typeof state === 'object') {
    const inner = (state as { state?: unknown; value?: unknown; status?: unknown }).state
      ?? (state as { value?: unknown }).value
      ?? (state as { status?: unknown }).status;
    if (typeof inner === 'string') return inner;
    if (typeof inner === 'number') return AgentDispatchState[inner] ?? String(inner);
    try {
      return JSON.stringify(state);
    } catch {
      return String(state);
    }
  }
  return String(state);
}

export async function GET(req: NextRequest) {
  const requestedRoom = req.nextUrl.searchParams.get('roomName');
  const roomName = requestedRoom || `session-${randomUUID()}`;
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

  let agentDispatchId: string | undefined;
  let agentDispatchError: string | undefined;
  let dispatchState: string | undefined;
  let dispatchJobs: number | undefined;
  let jobStatuses: JobStatus[] | undefined;

  try {
    // Create an isolated room for this session
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: ROOM_EMPTY_TIMEOUT,
        maxParticipants: MAX_PARTICIPANTS,
      });
    } catch (roomError) {
      // Ignore conflicts if the room already exists
      const message = (roomError as Error).message || '';
      if (!message.toLowerCase().includes('already exists')) {
        throw roomError;
      }
    }

    // Always dispatch a fresh agent into the room
    console.log(`Dispatching agent to room: ${roomName}`);
    const dispatch = await dispatchClient.createDispatch(
      roomName,
      AGENT_NAME
    );
    agentDispatchId = dispatch?.id;
    dispatchState = normalizeDispatchState(dispatch?.state);
    const jobs = dispatch?.jobs;
    dispatchJobs = Array.isArray(jobs) ? jobs.length : undefined;
    jobStatuses = Array.isArray(jobs)
      ? jobs.map((j: Job) => ({
          id: j?.id,
          status: normalizeDispatchState(j?.state?.status),
          workerId: j?.state?.workerId,
        }))
      : undefined;

    // Refresh dispatch info to capture job state
    const latest = await dispatchClient.getDispatch(agentDispatchId, roomName);
    if (latest) {
      agentDispatchId = latest.id;
      dispatchState = normalizeDispatchState(latest.state);
      const latestJobs = latest?.jobs;
      dispatchJobs = Array.isArray(latestJobs) ? latestJobs.length : dispatchJobs;
      jobStatuses = Array.isArray(latestJobs)
        ? latestJobs.map((j: Job) => ({
            id: j?.id,
            status: normalizeDispatchState(j?.state?.status),
            workerId: j?.state?.workerId,
          }))
        : jobStatuses;
    }

  } catch (error) {
    console.error('Failed to manage agent dispatch:', error);
    agentDispatchError = (error as Error).message;
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
    room: roomName,
    agent: {
      name: AGENT_NAME,
      present: true,
      dispatchId: agentDispatchId,
      dispatchState,
      dispatchJobs,
      jobStatuses,
      error: agentDispatchError,
    },
  });
}
