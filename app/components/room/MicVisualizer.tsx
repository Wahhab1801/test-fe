import { BarVisualizer, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { ReactNode } from "react";

type TrackRef = ReturnType<typeof useTracks>[number];

type MicVisualizerProps = {
  trackSelector: (track: TrackRef) => boolean;
  fallback: ReactNode;
};

export function MicVisualizer({ trackSelector, fallback }: MicVisualizerProps) {
  const tracks = useTracks([Track.Source.Microphone]);
  const selectedTrack = tracks.find(trackSelector);

  if (!selectedTrack) {
    return <div className="text-gray-500">{fallback}</div>;
  }

  return (
    <BarVisualizer
      state="speaking"
      barCount={5}
      trackRef={selectedTrack}
      className="h-full w-full"
      options={{ minHeight: 20 }}
    />
  );
}
