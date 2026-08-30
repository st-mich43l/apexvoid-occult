/**
 * Data-only routing: School → static school policy tables.
 * No calculation / placement / decoration functions.
 */
import type { School } from "@/types/chart";
import { NAM_PHAI_KHOI_VIET, NAM_PHAI_TU_HOA } from "./nam-phai-policy";
import type { ZiweiStaticSchoolPolicy } from "./policy-types";
import { TRUNG_CHAU_KHOI_VIET, TRUNG_CHAU_TU_HOA } from "./trung-chau-policy";

const ZIWEI_SCHOOL_POLICIES = {
  "nam-phai": {
    tuHoa: NAM_PHAI_TU_HOA,
    khoiViet: NAM_PHAI_KHOI_VIET,
  },
  "trung-chau": {
    tuHoa: TRUNG_CHAU_TU_HOA,
    khoiViet: TRUNG_CHAU_KHOI_VIET,
  },
} as const satisfies Record<School, ZiweiStaticSchoolPolicy>;

export function getZiweiStaticSchoolPolicy(
  school: School,
): ZiweiStaticSchoolPolicy {
  return ZIWEI_SCHOOL_POLICIES[school];
}
