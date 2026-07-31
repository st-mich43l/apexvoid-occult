export interface MajorFortuneProductionFamilyAdmission {
  signalFamilyId: string;

  productionStatus:
    | "legacy-engineering-admitted"
    | "source-verified-candidate"
    | "shadow-only"
    | "production-admitted"
    | "blocked"
    | "excluded";

  pillarId:
    | "thien-thoi"
    | "dia-loi"
    | "nhan-hoa"
    | "tu-hoa-sat-tinh";

  schoolScope:
    | "nam-phai"
    | "trung-chau"
    | "shared";

  temporalScope: "major-fortune";

  scoringAuthority:
    | "engineering-heuristic"
    | "source-backed";

  minimumResearchDecisionId: string | null;
  sourceObligationIds: string[];
  claimAdjudicationIds: string[];

  effectiveFromIntegrationVersion: string | null;

  blockingReasonCodes: string[];
  notes: string[];
}

export interface MajorFortuneProductionManifest {
  schemaVersion: "0.5.0";
  knowledgeVersion: string;
  modelId: string;

  status:
    | "production-shadow"
    | "internal-canary"
    | "external-canary"
    | "production";

  files: string[];

  canonicalHashes: Record<string, string>;
}

export interface MajorFortuneProductionAdmissionRegistry {
  schemaVersion: "0.5.0";
  catalogId: string;
  families: MajorFortuneProductionFamilyAdmission[];
}
