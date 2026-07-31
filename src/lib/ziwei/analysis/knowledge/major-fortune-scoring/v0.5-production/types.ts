interface AdmittedFamily {
  signalFamilyId: string;
  admissionStatus: "legacy-engineering-admitted" | "production-admitted";
  notes?: string;
}

export interface AdmittedFamilyRegistry {
  schemaVersion: "0.5.0";
  catalogId: string;
  families: AdmittedFamily[];
}
