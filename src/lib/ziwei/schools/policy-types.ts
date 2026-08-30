/**
 * Compile-time contracts for Zi Wei static school policy tables.
 *
 * HeavenlyStem is shared calendar authority. ZiweiBranch keeps released
 * chart spelling "Tỵ" (not calendar/Bát Tự "Tị").
 */
import { isHeavenlyStem } from "@/lib/calendar/domain-tokens";
import type { HeavenlyStem } from "@/lib/calendar/domain-tokens";

export type ZiweiMutagen = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

/** Palace / chart branch vocabulary used by Calculation Core engines. */
export type ZiweiBranch =
  | "Dần"
  | "Mão"
  | "Thìn"
  | "Tỵ"
  | "Ngọ"
  | "Mùi"
  | "Thân"
  | "Dậu"
  | "Tuất"
  | "Hợi"
  | "Tý"
  | "Sửu";

export type TuHoaTable = Readonly<
  Record<HeavenlyStem, Readonly<Record<ZiweiMutagen, string>>>
>;

export type KhoiVietTable = Readonly<
  Record<HeavenlyStem, readonly [ZiweiBranch, ZiweiBranch]>
>;

export interface ZiweiStaticSchoolPolicy {
  readonly tuHoa: TuHoaTable;
  readonly khoiViet: KhoiVietTable;
}

/** Safe string-stem boundary into a typed Tứ Hóa table (empty → undefined). */
export function tuHoaRow(
  table: TuHoaTable,
  stem: string,
): Readonly<Record<ZiweiMutagen, string>> | undefined {
  return isHeavenlyStem(stem) ? table[stem] : undefined;
}

/** Safe string-stem boundary into a typed Khôi/Việt table. */
export function khoiVietPair(
  table: KhoiVietTable,
  stem: string,
): readonly [ZiweiBranch, ZiweiBranch] | undefined {
  return isHeavenlyStem(stem) ? table[stem] : undefined;
}
