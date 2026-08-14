import profileJson from "../../../knowledge/palace-overview/candidates/interaction-v1/profile.json";
import type { InteractionCandidateProfile } from "./types";

export function loadInteractionCandidateProfile(): InteractionCandidateProfile {
  return profileJson as InteractionCandidateProfile;
}
