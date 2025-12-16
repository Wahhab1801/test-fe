import { AgentDispatchState } from "@livekit/protocol";
import {
  AccessToken,
  AgentDispatchClient,
  RoomServiceClient,
} from "livekit-server-sdk";

import { DispatchSummary, JobStatus } from "@/app/types/livekit";

// Server-side helpers for working with LiveKit auth and agent dispatch.
export const SERVER_AGENT_NAME =
  process.env.LIVEKIT_AGENT_NAME ||
  process.env.LK_AGENT_NAME ||
  process.env.NEXT_PUBLIC_AGENT_NAME ||
  "my-voice-agent";

const ROOM_EMPTY_TIMEOUT_SECONDS = 30;
const MAX_PARTICIPANTS = 2;

// Resolve the HTTP(S) API endpoint from configured URLs.
export function buildLivekitApiUrl(): string | undefined {
  return (
    process.env.LIVEKIT_API_URL ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss/i, "https")
  );
}

// Quick validation to ensure all LiveKit secrets are present.
export function hasValidLivekitConfig(livekitApiUrl?: string): boolean {
  const missing =
    !process.env.LIVEKIT_API_KEY ||
    !process.env.LIVEKIT_API_SECRET ||
    !process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    !livekitApiUrl;

  return !missing;
}

function normalizeDispatchState(state: unknown): string | undefined {
  if (state === undefined || state === null) return undefined;
  if (typeof state === "string") return state;
  if (typeof state === "number") {
    const lookup = AgentDispatchState as typeof AgentDispatchState &
      Record<number, string>;
    return lookup[state] ?? String(state);
  }
  if (typeof state === "object") {
    const inner =
      (state as { state?: unknown; value?: unknown; status?: unknown }).state ??
      (state as { value?: unknown }).value ??
      (state as { status?: unknown }).status;
    if (typeof inner === "string") return inner;
    if (typeof inner === "number") {
      const lookup = AgentDispatchState as typeof AgentDispatchState &
        Record<number, string>;
      return lookup[inner] ?? String(inner);
    }
    try {
      return JSON.stringify(state);
    } catch {
      return String(state);
    }
  }
  return String(state);
}

// Convert raw job payloads from the API into a typed, UI-friendly shape.
function parseJobStatuses(jobs?: unknown): JobStatus[] | undefined {
  if (!Array.isArray(jobs)) return undefined;
  return jobs.map((job: unknown) => {
    const maybeJob = job as
      | {
          id?: unknown;
          state?: { status?: unknown; workerId?: unknown };
        }
      | undefined;
    return {
      id: typeof maybeJob?.id === "string" ? maybeJob.id : undefined,
      status: normalizeDispatchState(maybeJob?.state?.status),
      workerId:
        typeof maybeJob?.state?.workerId === "string"
          ? maybeJob.state.workerId
          : undefined,
    };
  });
}

// Create an isolated room for this session; ignore conflicts when it already exists.
export async function ensureRoom(
  roomService: RoomServiceClient,
  roomName: string
) {
  try {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: ROOM_EMPTY_TIMEOUT_SECONDS,
      maxParticipants: MAX_PARTICIPANTS,
    });
  } catch (roomError) {
    const message = (roomError as Error).message?.toLowerCase() ?? "";
    if (!message.includes("already exists")) {
      throw roomError;
    }
  }
}

export async function dispatchAgent(
  dispatchClient: AgentDispatchClient,
  roomName: string
): Promise<DispatchSummary> {
  // Default empty summary keeps the return type stable even on failures.
  let summary: DispatchSummary = {};

  // Trigger agent dispatch.
  const dispatch = await dispatchClient.createDispatch(
    roomName,
    SERVER_AGENT_NAME
  );
  const dispatchJobs = dispatch?.state?.jobs;
  summary = {
    id: dispatch?.id,
    state: normalizeDispatchState(dispatch?.state),
    jobCount: dispatchJobs?.length,
    jobStatuses: parseJobStatuses(dispatchJobs),
  };

  // Refresh to capture latest job info.
  if (summary.id) {
    const latest = await dispatchClient.getDispatch(summary.id, roomName);
    const latestJobs = latest?.state?.jobs;
    summary = {
      id: latest?.id ?? summary.id,
      state: normalizeDispatchState(latest?.state) ?? summary.state,
      jobCount: latestJobs?.length ?? summary.jobCount,
      jobStatuses: parseJobStatuses(latestJobs) ?? summary.jobStatuses,
      error: summary.error,
    };
  }

  return summary;
}

export async function createParticipantToken(
  roomName: string,
  participantName: string
): Promise<string> {
  // Issue a short-lived JWT scoped to the target room and participant identity.
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY as string,
    process.env.LIVEKIT_API_SECRET as string,
    {
      identity: participantName,
    }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}
