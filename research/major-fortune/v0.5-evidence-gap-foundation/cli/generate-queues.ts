import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

const contradictionLog = [
  {
    priority: 1,
    affectedFamily: "all-production-families",
    affectedPillar: "all",
    affectedSchool: "unscoped",
    blockingDimensions: ["source locator quality", "existence", "polarity", "school scope"],
    requiredSourceType: "classical text or school manual",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "Production scoring is currently based on engineering heuristic.",
    recommendedNextAction: "Acquire and adjudicate authentic sources for production signals.",
    completionCriteria: "Production signals are verified by classical text or marked explicitly as unsupported."
  }
];

const sourceQueue = [
  {
    priority: 2,
    affectedFamily: "principal-star-dignity",
    affectedPillar: "dia-loi",
    affectedSchool: "unscoped",
    blockingDimensions: ["existence", "polarity"],
    requiredSourceType: "school manual",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "Dignity currently relies on V0.3 heuristic.",
    recommendedNextAction: "Acquire Nam Phai and Trung Chau manuals detailing Major Fortune dignity rules.",
    completionCriteria: "Source texts specifying dignity scoring for Major Fortune are acquired and digitized."
  },
  {
    priority: 2,
    affectedFamily: "vcd-opposite-palace-borrowing",
    affectedPillar: "dia-loi",
    affectedSchool: "unscoped",
    blockingDimensions: ["existence", "stacking"],
    requiredSourceType: "school manual",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "VCD borrowing is in backlog.",
    recommendedNextAction: "Find textual evidence on whether VCD borrows principal stars in Major Fortune.",
    completionCriteria: "Textual evidence acquired."
  },
  {
    priority: 3,
    affectedFamily: "support-auxiliary-sets",
    affectedPillar: "nhan-hoa",
    affectedSchool: "unscoped",
    blockingDimensions: ["existence", "stacking"],
    requiredSourceType: "school manual",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "Only complete sets currently score support.",
    recommendedNextAction: "Find textual evidence for partial vs complete set rules.",
    completionCriteria: "Rules for auxiliary set membership in Major Fortune are acquired."
  },
  {
    priority: 4,
    affectedFamily: "nam-phai-major-fortune-transformations",
    affectedPillar: "tu-hoa",
    affectedSchool: "nam-phai",
    blockingDimensions: ["polarity", "stacking"],
    requiredSourceType: "school manual",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "Transformation stacking and polarity are engineering heuristic.",
    recommendedNextAction: "Find Nam Phai texts on transformation polarity and stacking.",
    completionCriteria: "Texts acquired."
  }
];

const claimQueue = [
  {
    priority: 1,
    affectedFamily: "element-relation",
    affectedPillar: "thien-thoi",
    affectedSchool: "unscoped",
    blockingDimensions: ["existence"],
    requiredSourceType: "classical text",
    requiredCalculationCoreCapability: "none",
    candidateImpact: "Element generation = support is an engineering policy.",
    recommendedNextAction: "Adjudicate if element relation applies at the decade level.",
    completionCriteria: "Claim is verified or rejected based on evidence."
  }
];

const calcCoreQueue = [
  {
    priority: 7,
    affectedFamily: "natal-to-van-star-pattern-compatibility",
    affectedPillar: "nhan-hoa",
    affectedSchool: "unscoped",
    blockingDimensions: ["Calculation Core readiness"],
    requiredSourceType: "none",
    requiredCalculationCoreCapability: "Cross-temporal star pattern matcher",
    candidateImpact: "Cannot measure or evaluate natal-to-van patterns.",
    recommendedNextAction: "Implement pattern matcher in Calculation Core.",
    completionCriteria: "Calculation Core can emit natal-to-van interaction tuples."
  }
];

fs.writeFileSync(path.join(outDir, 'contradictions/contradiction-log.json'), JSON.stringify(contradictionLog, null, 2));
fs.writeFileSync(path.join(outDir, 'queue/source-acquisition-queue.json'), JSON.stringify(sourceQueue, null, 2));
fs.writeFileSync(path.join(outDir, 'queue/claim-adjudication-queue.json'), JSON.stringify(claimQueue, null, 2));
fs.writeFileSync(path.join(outDir, 'queue/calculation-core-gap-queue.json'), JSON.stringify(calcCoreQueue, null, 2));
console.log("Generated queues.");
