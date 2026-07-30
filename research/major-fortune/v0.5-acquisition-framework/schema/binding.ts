export interface ObligationClaimBinding {
  bindingId: string;
  obligationId: string;
  canonicalClaimId: string;
  localClaimIds: string[];
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";
  dimension: string;
  bindingStatus: "bound" | "unbound" | "ambiguous";
  rationale: string;
}

export interface ObligationClaimBindingRegistry {
  schemaVersion: "0.5.0";
  packId: string;
  bindings: ObligationClaimBinding[];
}
