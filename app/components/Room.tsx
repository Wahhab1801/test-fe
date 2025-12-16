"use client";

import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  StartAudio,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Participant } from "livekit-client";
import { useEffect, useState } from "react";
import { MicVisualizer } from "./room/MicVisualizer";
import { StatusBadge } from "./room/StatusBadge";
import { VisualizerCard } from "./room/VisualizerCard";
import { LoadingState } from "./room/LoadingState";
import { Backdrop } from "./room/Backdrop";
import { ErrorState } from "./room/ErrorState";
import { generateRoomName, isAgentIdentity } from "../utils/livekit";
import { AGENT_NAME } from "../utils/constants";
import { parseJsonSafe } from "../utils/http";

export default function Room() {
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const room = generateRoomName();
    setRoomName(room);

    (async () => {
      try {
        const participant = `user-${Math.floor(Math.random() * 1000)}`;
        const resp = await fetch(
          `/api/token?roomName=${encodeURIComponent(
            room
          )}&participantName=${participant}`
        );
        if (!resp.ok) {
          const errorText = await resp.text().catch(() => "");
          throw new Error(
            `Token request failed (${resp.status}): ${
              errorText || "No response body"
            }`
          );
        }

        const data = await parseJsonSafe<{ token?: string; room?: string }>(
          resp
        );
        if (!data?.token) {
          throw new Error("Token response was empty or missing token");
        }

        if (cancelled) return;
        setToken(data.token);
        setRoomName(data.room ?? room);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError((e as Error).message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <ErrorState message={error} onRetry={() => location.reload()} />;
  }

  if (token === "") {
    return <LoadingState />;
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connectOptions={{
        autoSubscribe: true,
      }}
      data-lk-theme="default"
      style={{ height: "100vh" }}
    >
      <RoomContent />
    </LiveKitRoom>
  );
}

function RoomContent() {
  const roomState = useConnectionState();
  const participants = useParticipants();
  const agentParticipant = participants.find((p: Participant) =>
    isAgentIdentity(p.identity)
  );
  const isAgentConnected = !!agentParticipant;
  const agentLabel = agentParticipant?.identity || AGENT_NAME || "None";
  const connectionReady = roomState === "connected";
  const mobileAudioButton = (
    <StartAudio
      label="Tap to enable audio"
      className="w-full rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 sm:hidden"
    />
  );

  return (
    <Backdrop>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 md:py-12">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Voice Console
              </p>
              <h1 className="text-3xl font-semibold leading-tight text-white">
                LiveKit Voice Agent
              </h1>
            </div>

            <StartAudio
              label="Enable audio"
              className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 sm:w-auto"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatusBadge
              label="Connection"
              value={roomState}
              tone={connectionReady ? "success" : "warn"}
            />
            <StatusBadge
              label="Agent"
              value={isAgentConnected ? "Connected" : "Offline"}
              description={agentLabel}
              tone={isAgentConnected ? "success" : "error"}
            />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <VisualizerCard
            title="Agent"
            status={
              isAgentConnected
                ? "Agent is live and listening"
                : "Waiting for agent"
            }
            accent="from-indigo-500/60 to-blue-500/40"
            border="border-indigo-500/30"
            action={mobileAudioButton}
          >
            <MicVisualizer
              trackSelector={(track) =>
                !track.participant.isLocal &&
                isAgentIdentity(track.participant.identity)
              }
              fallback="Waiting for agent..."
            />
          </VisualizerCard>

          <VisualizerCard
            title="You"
            status={
              connectionReady
                ? "Your mic levels animate as you speak"
                : "Connecting you to the room..."
            }
            accent="from-emerald-500/60 to-teal-500/30"
            border="border-emerald-500/30"
            action={mobileAudioButton}
          >
            <MicVisualizer
              trackSelector={(track) => track.participant.isLocal}
              fallback="Mic not connected"
            />
          </VisualizerCard>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <ControlBar
            controls={{ camera: false, screenShare: false }}
            className="!bg-transparent px-2 py-3 sm:px-4"
          />
        </div>
      </div>
      <RoomAudioRenderer />
    </Backdrop>
  );
}
