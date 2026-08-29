/**
 * Shared school-neutral Zi Wei chart geometry.
 * No school conditionals; no Tứ Hóa / Khôi-Việt / Hỏa-Linh policy.
 */
import type { ChartVoidMarker, ZiweiStart, ChartStar } from "@/types/chart";
import {
  BRANCHES,
  CHANG_SHENG_CYCLE,
  CHANG_SHENG_START,
  CYCLE_BRANCHES,
  CUC,
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  HOUR_BRANCHES,
  NAP_AM_ELEMENTS,
  STEMS,
  TRIET_BY_STEM,
  addStar,
  addStarAtBranch,
  cycleBranchToIndex,
  fix,
  getPalaceStem,
  type ZiweiWorkingPalace,
} from "./shared-primitives";

export function getNapAmElement(stem: string, branch: string): string {
  for(let i = 0; i < 60; i++){
    if(STEMS[i % 10] === stem && CYCLE_BRANCHES[i % 12] === branch){
      return NAP_AM_ELEMENTS[Math.floor(i / 2)] ?? "Thổ";
    }
  }
  return "Thổ";
}

export function getElementRelation(menhElement: string, cucElement: string): { label: string; detail: string } {
  if(menhElement === cucElement){
    return {label:"Mệnh Cục bình hòa", detail:`Mệnh ${menhElement} đồng hành Cục ${cucElement}`};
  }
  if(ELEMENT_GENERATES[menhElement] === cucElement){
    return {label:"Mệnh sinh Cục", detail:`Mệnh ${menhElement} sinh Cục ${cucElement}`};
  }
  if(ELEMENT_GENERATES[cucElement] === menhElement){
    return {label:"Cục sinh Mệnh", detail:`Cục ${cucElement} sinh Mệnh ${menhElement}`};
  }
  if(ELEMENT_CONTROLS[menhElement] === cucElement){
    return {label:"Mệnh khắc Cục", detail:`Mệnh ${menhElement} khắc Cục ${cucElement}`};
  }
  return {label:"Cục khắc Mệnh", detail:`Cục ${cucElement} khắc Mệnh ${menhElement}`};
}

export function getCuc(yearStem: string, menhBranch: string): { number: number; name: string; element: string; stem: string } {
  const menhIndex = BRANCHES.indexOf(menhBranch);
  const palaceStem = getPalaceStem(yearStem, menhIndex);
  const element = getNapAmElement(palaceStem, menhBranch);
  const base = CUC[element] ?? { number: 2, name: "Thủy Nhị Cục" };
  return {...base, element, stem: palaceStem};
}

export function getSoulBody(month: number, hourBranch: string): { menhIndex: number; thanIndex: number; hourIndex: number } {
  const monthIndex = month - 1;
  const hourIndex = HOUR_BRANCHES.indexOf(hourBranch);
  return {
    menhIndex: fix(monthIndex - hourIndex),
    thanIndex: fix(monthIndex + hourIndex),
    hourIndex
  };
}

export function getZiweiStart(day: number, cucNumber: number): ZiweiStart {
  let borrowed = 0;
  while((day + borrowed) % cucNumber !== 0) borrowed++;
  const quotient = (day + borrowed) / cucNumber;
  let ziweiIndex = fix((quotient % 12) - 1);
  ziweiIndex = fix(ziweiIndex + (borrowed % 2 === 0 ? borrowed : -borrowed));
  // Thiên Phủ index = (12 - ziweiIndex) mod 12 — current released Calculation Core geometry.
  return {ziweiIndex, tianfuIndex: fix(12 - ziweiIndex), borrowed, quotient};
}

export function getTianMaIndex(yearBranch: string): number {
  if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Thân");
  if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Dần");
  if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Hợi");
  return BRANCHES.indexOf("Tỵ");
}

export function getHoaCaiIndex(yearBranch: string): number {
  if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Tuất");
  if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Thìn");
  if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Sửu");
  return BRANCHES.indexOf("Mùi");
}

export function getLongTriIndex(yearBranch: string): number {
  return BRANCHES.indexOf("Thìn") + CYCLE_BRANCHES.indexOf(yearBranch);
}

export function getPhuongCacIndex(yearBranch: string): number {
  return BRANCHES.indexOf("Tuất") - CYCLE_BRANCHES.indexOf(yearBranch);
}

export function getDaoHoaIndex(yearBranch: string): number {
  if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Mão");
  if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Dậu");
  if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Ngọ");
  return BRANCHES.indexOf("Tý");
}

export function getThienKhongIndex(yearBranch: string): number {
  return cycleBranchToIndex(CYCLE_BRANCHES[fix(CYCLE_BRANCHES.indexOf(yearBranch) + 1)] ?? "");
}

export function getKiepSatIndex(yearBranch: string): number {
  if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Hợi");
  if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tỵ");
  if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Dần");
  return BRANCHES.indexOf("Thân");
}

export function getPhaToaiIndex(yearBranch: string): number {
  if(["Tý","Ngọ","Mão","Dậu"].includes(yearBranch)) return BRANCHES.indexOf("Tỵ");
  if(["Dần","Thân","Tỵ","Hợi"].includes(yearBranch)) return BRANCHES.indexOf("Dậu");
  return BRANCHES.indexOf("Sửu");
}

export function getCoQua(yearBranch: string): { co: string; qua: string } {
  if(["Hợi","Tý","Sửu"].includes(yearBranch)) return {co:"Dần", qua:"Tuất"};
  if(["Dần","Mão","Thìn"].includes(yearBranch)) return {co:"Tỵ", qua:"Sửu"};
  if(["Tỵ","Ngọ","Mùi"].includes(yearBranch)) return {co:"Thân", qua:"Thìn"};
  return {co:"Hợi", qua:"Mùi"};
}

function getTuanBranches(yearStem: string, yearBranch: string): [string, string] {
  let cycleIndex = 0;
  for(let i = 0; i < 60; i++){
    if(STEMS[i % 10] === yearStem && CYCLE_BRANCHES[i % 12] === yearBranch){
      cycleIndex = i;
      break;
    }
  }
  const start = Math.floor(cycleIndex / 10) * 10;
  return [CYCLE_BRANCHES[(start + 10) % 12] ?? "", CYCLE_BRANCHES[(start + 11) % 12] ?? ""];
}

export function getVoidMarkers(yearStem: string, yearBranch: string): ChartVoidMarker[] {
  return [
    {type:"Tuần", branches:getTuanBranches(yearStem, yearBranch)},
    {type:"Triệt", branches:TRIET_BY_STEM[yearStem] ?? ["", ""]}
  ];
}

export function addVoidStars(palaces: ZiweiWorkingPalace[], markers: ChartVoidMarker[]): void {
  markers.forEach(marker => {
    marker.branches.forEach(branch => addStarAtBranch(palaces, branch, marker.type, "void"));
  });
}

export function addFixedPalaceStars(palaces: ZiweiWorkingPalace[]): void {
  addStarAtBranch(palaces, "Thìn", "Thiên La", "void");
  addStarAtBranch(palaces, "Tuất", "Địa Võng", "void");
  const illnessPalace = palaces.find(palace => palace.name === "Tật Ách");
  if(illnessPalace) addStar(palaces, illnessPalace.index, "Thiên Sứ", "harm");
  const servantPalace = palaces.find(palace => palace.name === "Nô Bộc");
  if(servantPalace) addStar(palaces, servantPalace.index, "Thiên Thương", "harm");
}

export function addChangSheng(palaces: ZiweiWorkingPalace[], cuc: { element: string }, directionSign: number): void {
  const start = BRANCHES.indexOf(CHANG_SHENG_START[cuc.element] ?? "");
  palaces.forEach(palace => {
    palace.changSheng = CHANG_SHENG_CYCLE[fix((palace.index - start) * directionSign)] ?? "";
  });
}

export function assignMajorFortunes(palaces: ZiweiWorkingPalace[], menhIndex: number, cucNumber: number, directionSign: number, age: number): ZiweiWorkingPalace | null {
  let activePalace: ZiweiWorkingPalace | null = null;
  palaces.forEach(palace => {
    const order = fix((palace.index - menhIndex) * directionSign);
    const start = cucNumber + order * 10;
    const end = start + 9;
    palace.majorFortune = {
      order,
      start,
      end,
      active: age >= start && age <= end
    };
    if(palace.majorFortune.active) activePalace = palace;
  });
  return activePalace;
}

export function findStar(palaces: ZiweiWorkingPalace[], starName: string): { palace: ZiweiWorkingPalace; star: ChartStar } | null {
  for(const palace of palaces){
    const star = palace.stars.find(item => item.name === starName);
    if(star) return {palace, star};
  }
  return null;
}

