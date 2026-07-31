interface HuyenKhiCalendarEntry {
  hourBranch: string;
  yinYangSexLabel: string;
  displayedMenhScore: number | null;
  displayedWholeChartTotal: number | null;
  detailLinks: {
    popular?: string;
    namPhai?: string;
    bacPhai?: string;
    phiTinh?: string;
    combined?: string;
  };
  sourceLid: string | null;
}

export interface HuyenKhiCalendarDayRecord {
  calendarPageUrl: string;
  solarDate: string;
  lunarDate: {
    year: number;
    /** null when text-label extraction was unreliable this session — see
     * `research/huyen-khi/v0.2/source-access-review.md`'s "lunar-date edge
     * case" finding. The numeric month/day fields remain the load-bearing
     * evidence for recovery, not this label. */
    yearStemBranch: string | null;
    month: number;
    day: number;
    isLeapMonth: boolean | null;
  };
  sexShown: "male" | "female";
  entries: HuyenKhiCalendarEntry[];
  capturedAt: string;
  /** Which of the two independent extraction passes agreed on the key
   * numeric fields (Mệnh score, whole-chart total, lunar month/day) for
   * at least one entry — see `verification`. */
  verification: ManualVerification;
}

export interface ManualVerification {
  firstEntryBy: string;
  firstEntryAt: string;
  secondEntryBy: string | null;
  secondEntryAt: string | null;
  /** `"exact"` here means two *independent WebFetch passes* agreed
   * exactly — not two independent humans. This tier is `"machine-diff-
   * verified"` in `HuyenKhiPublicOutputRecordV02.verificationTier`, never
   * labeled `"gold"` under the spec's stricter human-verified definition. */
  agreement: "pending" | "exact" | "disputed";
  disputeNotes: string[];
}
