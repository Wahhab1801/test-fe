import { randomUUID } from "crypto";
import { AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

import { DispatchSummary } from "@/app/types/livekit";
import {
  SERVER_AGENT_NAME,
  buildLivekitApiUrl,
  createParticipantToken,
  dispatchAgent,
  ensureRoom,
  hasValidLivekitConfig,
} from "@/app/utils/livekitServer";

// Issues a LiveKit access token and ensures a fresh agent is dispatched to the caller's room.
export async function GET(req: NextRequest) {
  try {
    const requestedRoom = req.nextUrl.searchParams.get("roomName");
    const roomName = requestedRoom || `session-${randomUUID()}`;
    const participantName =
      req.nextUrl.searchParams.get("participantName") ||
      `user-${Math.floor(Math.random() * 1000)}`;

    const livekitApiUrl = buildLivekitApiUrl();

    // Fail fast if we don't have a complete LiveKit configuration.
    if (!livekitApiUrl || !hasValidLivekitConfig(livekitApiUrl)) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Clients for room management and agent dispatch.
    const roomService = new RoomServiceClient(
      livekitApiUrl,
      process.env.LIVEKIT_API_KEY as string,
      process.env.LIVEKIT_API_SECRET as string
    );

    const dispatchClient = new AgentDispatchClient(
      livekitApiUrl,
      process.env.LIVEKIT_API_KEY as string,
      process.env.LIVEKIT_API_SECRET as string
    );

    let dispatchSummary: DispatchSummary | undefined;

    try {
      // Create/ensure the room exists before dispatching the agent.
      await ensureRoom(roomService, roomName);

      // Always dispatch a fresh agent into the room.
      dispatchSummary = await dispatchAgent(dispatchClient, roomName);
    } catch (error) {
      console.error("Failed to manage agent dispatch:", error);
      dispatchSummary = {
        error: (error as Error).message,
      };
    }

    // Generate a token for the caller to join/publish/subscribe to the room.
    const token = await createParticipantToken(roomName, participantName);

    return NextResponse.json({
      token,
      room: roomName,
      agent: {
        name: SERVER_AGENT_NAME,
        present: true,
        dispatchId: dispatchSummary?.id,
        dispatchState: dispatchSummary?.state,
        dispatchJobs: dispatchSummary?.jobCount,
        jobStatuses: dispatchSummary?.jobStatuses,
        error: dispatchSummary?.error,
      },
    });
  } catch (error) {
    console.error("Token endpoint failed:", error);
    const message = (error as Error).message || "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
