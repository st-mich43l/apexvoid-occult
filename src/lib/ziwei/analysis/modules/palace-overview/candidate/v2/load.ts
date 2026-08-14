import packJson from "../../../../knowledge/palace-overview/candidates/interaction-v2/profile.json";
import type { InteractionCandidateV2Pack } from "./types";

export function loadInteractionCandidateV2Pack(): InteractionCandidateV2Pack {
  return packJson as InteractionCandidateV2Pack;
}
