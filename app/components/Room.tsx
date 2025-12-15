"use client";

import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useTracks,
  useConnectionState,
  useVoiceAssistant,
  useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, Participant } from "livekit-client";
import { useEffect, useRef, useState } from "react";

export default function Room() {
  const [token, setToken] = useState("");
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    (async () => {
      try {
        const resp = await fetch(
          `/api/token?roomName=pre-test-room-3&participantName=user-${Math.floor(Math.random() * 1000)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (token === "") {
    return <div>Getting token...</div>;
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100vh" }}
    >
      <RoomContent />
    </LiveKitRoom>
  );
}

function RoomContent() {
  const roomState = useConnectionState();
  const { agentTranscribing, userTranscribing } = useVoiceAssistant() as any;
  const participants = useParticipants();
  const agentParticipant = participants.find((p: Participant) => 
    p.identity.startsWith('agent-') || p.identity === 'my-voice-agent'
  );
  const isAgentConnected = !!agentParticipant;

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
        <h1 className="text-2xl font-bold mb-4">LiveKit Voice Agent</h1>
        <div className="flex flex-col items-center gap-2 mb-4 text-sm">
            <div className="text-gray-400">
                Room Status: <span className={roomState === "connected" ? "text-green-500" : "text-yellow-500"}>{roomState}</span>
            </div>
            <div className="text-gray-400">
                Agent Status: <span className={isAgentConnected ? "text-green-500" : "text-red-500"}>{isAgentConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="flex flex-col gap-1 mt-2 w-full max-w-xs bg-gray-900 p-3 rounded border border-gray-800">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                    Participants ({participants.length})
                </div>
                {participants.map((p) => (
                    <div key={p.identity} className="text-xs text-gray-300 flex items-center justify-between">
                        <span className="truncate" title={p.identity}>
                            {p.identity} {p.isLocal && "(You)"}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${p.identity.startsWith("agent-") || p.identity === "my-voice-agent" ? "bg-blue-500" : "bg-green-500"}`} title={p.identity.startsWith("agent-") ? "Agent" : "User"}></span>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl items-center justify-center">
          {/* Agent Section */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <div className="text-lg font-semibold text-blue-400">Agent</div>
            <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800">
                <AgentVisualizer />
            </div>
            <div className="h-12 w-full text-center flex items-center justify-center">
                {agentTranscribing && (
                    <p className="text-blue-200 text-sm italic animate-pulse">
                        "{agentTranscribing.text}"
                    </p>
                )}
            </div>
          </div>

          {/* User Section */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <div className="text-lg font-semibold text-green-400">You</div>
            <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-800">
                <UserVisualizer />
            </div>
            <div className="h-12 w-full text-center flex items-center justify-center">
                {userTranscribing && (
                    <p className="text-green-200 text-sm italic animate-pulse">
                        "{userTranscribing.text}"
                    </p>
                )}
            </div>
          </div>
        </div>

        <ControlBar controls={{ camera: false, screenShare: false }} />
      </div>
      <RoomAudioRenderer />
    </>
  );
}

function AgentVisualizer() {
  const tracks = useTracks([Track.Source.Microphone]);
  const agentTrack = tracks.find((t) => t.participant.identity !== "me" && !t.participant.isLocal);

  if (!agentTrack) {
    return <div className="text-gray-500">Waiting for agent...</div>;
  }

  return (
    <BarVisualizer
      state="speaking"
      barCount={5}
      trackRef={agentTrack}
      className="h-full w-full"
      options={{ minHeight: 20 }}
    />
  );
}

function UserVisualizer() {
  const tracks = useTracks([Track.Source.Microphone]);
  const localTrack = tracks.find((t) => t.participant.isLocal);

  if (!localTrack) {
    return <div className="text-gray-500">Mic not connected</div>;
  }

  return (
    <BarVisualizer
      state="speaking"
      barCount={5}
      trackRef={localTrack}
      className="h-full w-full"
      options={{ minHeight: 20 }}
    />
  );
}
