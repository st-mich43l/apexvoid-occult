/**
 * Nam Phái structure quality for Palace Overview.
 * Sources (read-only KB):
 *   cung_vi_va_tam_hop.md — bản cung (1) + tam hợp/xung nhỏ hơn, không đè cung đang tính
 *   Cách cục / tổ hợp: nhân mean geometry chỗ ngồi sao (tọa 1, hội tam hợp nhỏ).
 *   trang_thai_va_tuong_tac_sao.md — độ sáng quyết định tốt/xấu
 *   cach_cuc_kinh_dien.md + structural-rules.json — bộ sao
 *   vong_thai_tue_tinh_cach.md — 4 tam hợp vòng Thái Tuế
 *   tai_loc / tu_hoa_tam_phap — Lộc Tồn vs Hao / Không Kiếp
 *   formula.v2.json — layer gates; minor-star-families.json for phụ tinh
 * Numeric magnitudes are heuristic seeds. Cần thầy duyệt.
 */
import type { PalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2/schema";
import type { ZiweiBrightness } from "../../../facts";
import type { PalaceEvidence } from "../types";

function namesIn(evidence: PalaceEvidence[]): Set<string> {
  const names = new Set<string>();
  for (const ev of evidence) {
    if (ev.starName) names.add(ev.starName);
    if (ev.transformation === "Lộc") names.add("Hóa Lộc");
    if (ev.transformation === "Quyền") names.add("Hóa Quyền");
    if (ev.transformation === "Khoa") names.add("Hóa Khoa");
    if (ev.transformation === "Kỵ") names.add("Hóa Kỵ");
  }
  return names;
}

function hasAll(names: Set<string>, stars: string[]): boolean {
  return stars.every((s) => names.has(s));
}

function hasAny(names: Set<string>, stars: string[]): boolean {
  return stars.some((s) => names.has(s));
}

function geometryWeight(
  role: PalaceEvidence["palaceRole"],
  geo: PalaceOverviewKnowledgeV1["profile"]["geometry"],
): number {
  if (role === "focus") return geo.focus;
  if (role === "opposite") return geo.opposite;
  return geo.trine;
}

/**
 * Mix on an opposite net that is ALREADY × geometry.opposite.
 * Do not pass unweighted đối-cung brightness — that dumped Di onto Mệnh.
 */
export function xungChieuNet(
  focusNet: number,
  oppositeRawNet: number,
  factors: PalaceOverviewKnowledgeV1["profile"]["xungChieu"],
): number {
  if (oppositeRawNet === 0) return 0;
  if (focusNet >= 0 && oppositeRawNet < 0) {
    return oppositeRawNet * factors.phaCachFactor;
  }
  if (focusNet < 0 && oppositeRawNet > 0) {
    return oppositeRawNet * factors.cuuGiaiFactor;
  }
  if (focusNet >= 0 && oppositeRawNet >= 0) {
    return oppositeRawNet * factors.bothCatFactor;
  }
  return oppositeRawNet * factors.bothHungFactor;
}

function starRoles(
  evidence: PalaceEvidence[],
  name: string,
): PalaceEvidence["palaceRole"][] {
  const roles: PalaceEvidence["palaceRole"][] = [];
  for (const ev of evidence) {
    if (ev.starName === name) roles.push(ev.palaceRole);
    if (name === "Hóa Lộc" && ev.transformation === "Lộc") roles.push(ev.palaceRole);
    if (name === "Hóa Quyền" && ev.transformation === "Quyền") roles.push(ev.palaceRole);
    if (name === "Hóa Khoa" && ev.transformation === "Khoa") roles.push(ev.palaceRole);
    if (name === "Hóa Kỵ" && ev.transformation === "Kỵ") roles.push(ev.palaceRole);
  }
  return roles;
}

function bestRoleWeight(
  roles: PalaceEvidence["palaceRole"][],
  geo: PalaceOverviewKnowledgeV1["profile"]["geometry"],
): number {
  let w = 0;
  for (const role of roles) {
    w = Math.max(w, geometryWeight(role, geo));
  }
  return w;
}

/** Mean geometry of named participants. All-focus = 1. Chart 格局 hội tam hợp ≠ full dump. */
function meanParticipantWeight(
  evidence: PalaceEvidence[],
  names: string[],
  geo: PalaceOverviewKnowledgeV1["profile"]["geometry"],
): number {
  const weights = names
    .map((n) => bestRoleWeight(starRoles(evidence, n), geo))
    .filter((w) => w > 0);
  if (weights.length === 0) return 0;
  return weights.reduce((a, b) => a + b, 0) / names.length;
}

const TRINE_MAJOR_DIMINISH = [1, 0.55, 0.3, 0.15];

function diminishParts(parts: number[], curve: number[]): number {
  const sorted = [...parts].sort((a, b) => Math.abs(b) - Math.abs(a));
  let net = 0;
  const last = curve[curve.length - 1] ?? 0.05;
  for (const [i, q] of sorted.entries()) {
    net += q * (curve[i] ?? last);
  }
  return net;
}

/** Same-sign 用 only fills toward one Miếu. Extra 用 on a Miếu palace must not climb the rim. */
function mixYong(body: number, yong: number, cap: number, mieu: number): number {
  const y = Math.max(-cap, Math.min(cap, yong));
  if (y === 0) return body;
  if (body > 0 && y > 0) return body + Math.min(y, Math.max(0, mieu - body));
  if (body < 0 && y < 0) return body - Math.min(-y, Math.max(0, mieu + body));
  return body + y;
}

/** Brightness + Tứ Hóa on majors, mixed by TP4C role. */
function majorBrightnessNet(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): { focus: number; trine: number; opposite: number } {
  const bq = knowledge.profile.brightnessQuality;
  const tq = knowledge.profile.tuHoaQuality;
  const geo = knowledge.profile.geometry;
  const borrow = knowledge.profile.voidMajorBorrowFactor;
  const focusParts: number[] = [];
  const trineParts: number[] = [];
  let oppositeWeighted = 0;
  for (const ev of evidence) {
    if (ev.category !== "major-star") continue;
    const bright = (ev.starBrightness ?? "Bình") as ZiweiBrightness;
    let q = bq[bright] ?? 0;
    const hoa = ev.transformation;
    if (hoa === "Lộc" || hoa === "Quyền" || hoa === "Khoa") {
      q += tq[hoa];
    } else if (hoa === "Kỵ") {
      // Natal Kỵ on 辰戌丑未: 入庫 / đắc tứ mộ — 凶 giảm, không phạt như Kỵ thường.
      // Sources: TuviGLOBAL (Kỵ đắc địa Thìn Tuất Sửu Mùi);
      // 東派 入库忌 (生年忌入四墓). Not KB Tuần/Triệt phản vi. Cần thầy duyệt.
      const tuMo = new Set(knowledge.profile.tuMoBranches);
      q += tuMo.has(ev.palaceBranch) ? tq.kyInTuMo : tq.Kỵ;
    }
    if (ev.borrowedFromOpposite) q *= borrow;
    if (ev.palaceRole === "focus") focusParts.push(q * geo.focus);
    else if (ev.palaceRole === "trine") trineParts.push(q);
    else if (ev.palaceRole === "opposite" && !ev.borrowedFromOpposite) {
      oppositeWeighted += q * geo.opposite;
    }
  }
  const focus = diminishParts(focusParts, knowledge.profile.focusMajorDiminishing);
  const trine = diminishParts(
    trineParts.map((q) => q * geo.trine),
    TRINE_MAJOR_DIMINISH,
  );
  return { focus, trine, opposite: oppositeWeighted };
}

function formationNet(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const geo = knowledge.profile.geometry;
  let net = 0;
  for (const ev of evidence) {
    if (ev.category !== "structural-rule") continue;
    const rule = knowledge.structuralRules.rules.find(
      (r) => r.id === ev.ruleId || r.id === ev.starName || r.label === ev.label,
    );
    const raw = Math.max(0, ev.axes.support) - Math.max(0, ev.axes.pressure);
    if (!rule) {
      net += raw;
      continue;
    }
    net += raw * meanParticipantWeight(evidence, rule.participants, geo);
  }
  return net;
}

function voidEnvironmentNet(evidence: PalaceEvidence[]): number {
  let net = 0;
  for (const ev of evidence) {
    if (ev.category !== "void-environment") continue;
    net += Math.max(0, ev.axes.support) - Math.max(0, ev.axes.pressure);
  }
  return net;
}

function thaiTueNet(
  evidence: PalaceEvidence[],
  names: Set<string>,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const geo = knowledge.profile.geometry;
  for (const group of knowledge.starSystems.thaiTueTamHop) {
    if (hasAll(names, group.stars)) {
      return (
        (group.support - group.pressure) *
        meanParticipantWeight(evidence, group.stars, geo)
      );
    }
  }
  return 0;
}

function locTonCycleNet(
  evidence: PalaceEvidence[],
  names: Set<string>,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const loc = knowledge.starSystems.locTonCycle;
  const locEv = evidence.filter((e) => e.starName === "Lộc Tồn");
  if (locEv.length === 0) return 0;
  let q = 0;
  for (const ev of locEv) {
    if (ev.palaceRole === "focus") q += loc.focus;
    else if (ev.palaceRole === "trine") q += loc.trine;
    else if (ev.palaceRole === "opposite") q += loc.opposite;
  }
  if (names.has("Đại Hao") || names.has("Tiểu Hao")) q -= loc.haoPressure;
  if (names.has("Địa Không") || names.has("Địa Kiếp")) q -= loc.khongKiepPressure;
  return q;
}

function matchedComboNames(
  names: Set<string>,
  combo: PalaceOverviewKnowledgeV1["starSystems"]["combinations"][number],
  evidence: PalaceEvidence[],
): string[] | null {
  if (combo.match.mode === "require-and-any") {
    if (!hasAll(names, combo.match.require) || !hasAny(names, combo.match.anyOf)) {
      return null;
    }
    const hit = combo.match.anyOf.find((s) => names.has(s));
    return hit ? [...combo.match.require, hit] : null;
  }
  if (combo.match.mode === "ham-plus-any") {
    const ham = evidence.some(
      (e) => e.category === "major-star" && e.starBrightness === "Hãm",
    );
    if (!ham || !hasAny(names, combo.match.anyOf)) return null;
    const hit = combo.match.anyOf.filter((s) => names.has(s));
    return hit.length ? hit : null;
  }
  if (!hasAll(names, combo.participants)) return null;
  return combo.participants;
}

function starBranch(
  evidence: PalaceEvidence[],
  name: string,
): string | undefined {
  for (const ev of evidence) {
    if (ev.starName === name) return ev.palaceBranch;
    if (name === "Hóa Lộc" && ev.transformation === "Lộc") return ev.palaceBranch;
    if (name === "Hóa Quyền" && ev.transformation === "Quyền") return ev.palaceBranch;
    if (name === "Hóa Khoa" && ev.transformation === "Khoa") return ev.palaceBranch;
    if (name === "Hóa Kỵ" && ev.transformation === "Kỵ") return ev.palaceBranch;
  }
  return undefined;
}

function comboPolarity(
  combo: PalaceOverviewKnowledgeV1["starSystems"]["combinations"][number],
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): { support: number; pressure: number } | null {
  const tuMo = new Set(knowledge.profile.tuMoBranches);
  if (combo.requiresTuMo?.length) {
    const ok = combo.requiresTuMo.every((n) => {
      const b = starBranch(evidence, n);
      return b != null && tuMo.has(b);
    });
    if (!ok) return null;
  }
  let support = combo.support;
  let pressure = combo.pressure;
  if (combo.invertWhenAnyTuMo?.some((n) => {
    const b = starBranch(evidence, n);
    return b != null && tuMo.has(b);
  })) {
    const s = support;
    support = pressure;
    pressure = s;
  }
  const hung = combo.hungIfBrightness;
  if (hung) {
    const ev = evidence.find((e) => e.starName === hung.star);
    if (ev?.starBrightness && hung.levels.includes(ev.starBrightness)) {
      const s = support;
      support = pressure;
      pressure = s;
    }
  }
  return { support, pressure };
}

function pairNet(
  evidence: PalaceEvidence[],
  names: Set<string>,
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const geo = knowledge.profile.geometry;
  const tamMinh = hasAll(names, ["Đào Hoa", "Hồng Loan", "Thiên Hỷ"]);
  let q = 0;
  for (const combo of knowledge.starSystems.combinations) {
    if (combo.scoring !== "numeric") continue;
    if (combo.id === "tohop-dao-hoa-sat" && tamMinh) continue;
    const matched = matchedComboNames(names, combo, evidence);
    if (!matched) continue;
    const pol = comboPolarity(combo, evidence, knowledge);
    if (!pol) continue;
    q +=
      (pol.support - pol.pressure) *
      meanParticipantWeight(evidence, matched, geo);
  }
  return q;
}

export function computeStructureQuality(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const p = computeStructureParts(evidence, knowledge);
  return p.body + p.yong;
}

export function computeStructureParts(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): { body: number; yong: number } {
  const majors = majorBrightnessNet(evidence, knowledge);
  const xung = xungChieuNet(
    majors.focus,
    majors.opposite,
    knowledge.profile.xungChieu,
  );
  const names = namesIn(evidence);
  const g = (id: PalaceOverviewKnowledgeV1["formula"]["layers"][number]["id"]) =>
    knowledge.formula.layers.find((l) => l.id === id)?.gain ?? 1;
  const body =
    (majors.focus + majors.trine) * g("major-brightness-tu-hoa") +
    xung * g("geometry-tp4c");
  const yong =
    (layerOn(knowledge, "structural-formations")
      ? formationNet(evidence, knowledge) * g("structural-formations")
      : 0) +
    (layerOn(knowledge, "thai-tue-loc-ton-void")
      ? (thaiTueNet(evidence, names, knowledge) +
          locTonCycleNet(evidence, names, knowledge) +
          voidEnvironmentNet(evidence)) *
        g("thai-tue-loc-ton-void")
      : 0) +
    (layerOn(knowledge, "combinations")
      ? pairNet(evidence, names, knowledge) * g("combinations")
      : 0) +
    minorFamilyNet(evidence, knowledge) * g("minor-family");
  const bodyWithPalace =
    body +
    (layerOn(knowledge, "palace-role")
      ? palaceDignityNet(evidence, knowledge) * g("palace-role")
      : 0);
  const cap = knowledge.formula.display.yongCapMieu;
  const mieu = knowledge.formula.display.mieuRef;
  return { body: bodyWithPalace, yong: mixYong(bodyWithPalace, yong, cap, mieu) - bodyWithPalace };
}

function palaceDignityNet(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  const focus = evidence.find((ev) => ev.palaceRole === "focus");
  if (!focus) return 0;
  const hit = knowledge.palaceBranchDignity.entries.find(
    (row) => row.palace === focus.palaceName && row.branch === focus.palaceBranch,
  );
  if (!hit) return 0;
  return knowledge.profile.brightnessQuality[hit.label] ?? 0;
}

function layerOn(
  knowledge: PalaceOverviewKnowledgeV1,
  id: PalaceOverviewKnowledgeV1["formula"]["layers"][number]["id"],
): boolean {
  return knowledge.formula.layers.find((l) => l.id === id)?.enabled === true;
}

/**
 * Shared Nam Phái phụ tinh via family axes already collected (geometry + diminishing).
 * Skip Lộc Tồn (locTonCycle) and Trung Châu-only. Magnitudes: minor-star-families.json.
 * Cần thầy duyệt.
 */
function minorFamilyNet(
  evidence: PalaceEvidence[],
  knowledge: PalaceOverviewKnowledgeV1,
): number {
  if (!layerOn(knowledge, "minor-family")) return 0;
  const layer = knowledge.formula.layers.find((l) => l.id === "minor-family");
  const skip = new Set(layer?.skipCanonicalNames ?? ["Lộc Tồn"]);
  const tcOnly = new Set(
    layer?.skipTrungChauOnly === false
      ? []
      : knowledge.schoolCoverage.staticMinorStars.trungChauOnly,
  );
  let q = 0;
  for (const ev of evidence) {
    if (ev.category !== "minor-star-family") continue;
    const name = ev.starName;
    if (!name || skip.has(name) || tcOnly.has(name)) continue;
    q += Math.max(0, ev.axes.support) - Math.max(0, ev.axes.pressure);
  }
  return q;
}
