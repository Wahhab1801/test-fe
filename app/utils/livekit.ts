import { AGENT_NAME, ROOM_PREFIX } from "./constants";

export function isAgentIdentity(identity?: string | null) {
  if (!identity) return false;
  const normalized = identity.toLowerCase();
  const agentName = AGENT_NAME.toLowerCase();

  return (
    normalized === agentName ||
    normalized === `agent-${agentName}` ||
    normalized === `agent_${agentName}` ||
    normalized.startsWith("agent-") ||
    normalized.startsWith("agent_")
  );
}

export function generateRoomName() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `${ROOM_PREFIX}-${suffix}`;
}
