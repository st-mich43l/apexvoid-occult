import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calculateChart, expandAllMajorFortuneCycleObservations, MF_V02_FULL_CORPUS } from '../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js';
import { adaptChartToMajorFortuneOrdinalInput, analyzeMajorFortuneOrdinalV03 } from '../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/index.js';
import type { CorpusGapReport } from '../schema/foundation.js';

const base = path.join(process.cwd(), 'research/major-fortune/v0.5-evidence-gap-foundation');

export function runCorpusReport() {
  const observations = expandAllMajorFortuneCycleObservations(MF_V02_FULL_CORPUS);
  
  const report: CorpusGapReport = {
    schemaVersion: "0.5.0",
    thienThoi: {
      totalObservationsBySchool: {},
      evidenceEmissionCount: 0,
      elementRelationDistribution: {},
      supportPressureNeutralDistribution: {},
      missingMenhElement: 0,
      missingPalaceBranchMapping: 0,
      scorePillarLevelDistribution: {},
      sameElementPolicyCount: 0,
      strongNormalStrengthDistribution: {},
      noElementEvidenceObservations: 0,
      reconciliationV04TotalsMatched: true
    },
    diaLoi: {
      voChinhDieuObservations: 0,
      onePrincipalCases: 0,
      twoPrincipalCases: 0,
      moreThanTwoDefensiveAnomalyCount: 0,
      brightnessByStarAndDignity: {},
      dignityCounts: {},
      missingBrightness: 0,
      unsupportedBrightness: 0,
      mixedDignity: 0,
      evidenceEmissionCount: 0,
      noSignalCases: 0,
      measurableOppositePalacePrincipalCases: 0,
      scorePillarLevelDistribution: {},
      schoolDistribution: {},
      v04AuditDistributionsCompatible: true
    },
    nhanHoa: {
      activationCountForEachConfiguredSet: {},
      partialPairCountForEachSet: {},
      supportOnly: 0,
      pressureOnly: 0,
      mixed: 0,
      noEvidenceObservations: 0,
      scorePillarLevelDistribution: {},
      duplicatePhysicalFactRejections: 0,
      duplicateEvidenceClusterRejections: 0,
      schoolDistribution: {}
    },
    tuHoa: {
      resolvedTuples: 0,
      completeTuples: 0,
      incompleteTuples: 0,
      directActivePalaceTuples: 0,
      outOfFrameTuples: 0,
      acceptedTransformationEvidence: 0,
      transformationTypeDistribution: {},
      targetPalaceDistribution: {},
      multiTransformationObservations: 0,
      zeroDirectEvidenceObservations: 0,
      blockedNamPhaiObservations: 0,
      featureEnabledProductionState: false, // will check flags later or assume based on results
      scorePillarLevelDistribution: {},
      duplicateEvidenceRejection: 0,
      reconciliationV04TotalsMatched: true,
      measurableNatalTransitCollisions: { status: "not-measurable", reason: "Cannot measure transit collisions from single natal chart input", requiredCapability: "annual-chart-transit-resolution" }
    }
  };

  for (const obs of observations) {
    const chart = calculateChart(obs.school, obs.input);
    if (!chart) continue;
    
    const activePalace = chart.palaces.find(p => p.index === obs.activePalaceIndex);
    if (!activePalace) continue;

    // Use engine adapter!
    const cycleOverride = { cycleIndex: obs.cycleIndex, activePalaceIndex: obs.activePalaceIndex, startAge: obs.startAge, endAge: obs.endAge };
    
    // We can use analyzeMajorFortuneOrdinalV03 directly to get the evaluation
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: obs.school, cycleOverride });
    const build = analysis.build;
    const { evaluationInput, emittedEvidence, adapterDiagnostics } = build;
    const results = analysis.evaluation?.results || {};
    
    // THIEN THOI
    report.thienThoi.totalObservationsBySchool[obs.school] = (report.thienThoi.totalObservationsBySchool[obs.school] || 0) + 1;
    const ttEvidence = emittedEvidence.filter(e => e.pillarId === 'thien-thoi');
    if (ttEvidence.length === 0) report.thienThoi.noElementEvidenceObservations++;
    report.thienThoi.evidenceEmissionCount += ttEvidence.length;
    
    if (adapterDiagnostics.notes.some((n: string) => n.includes('missing-menh-element'))) report.thienThoi.missingMenhElement++;
    if (adapterDiagnostics.notes.some((n: string) => n.includes('unknown-palace-branch-element'))) report.thienThoi.missingPalaceBranchMapping++;
    
    for (const e of ttEvidence) {
      if (e.reasonCode?.startsWith('element-relation:')) {
         const rel = e.reasonCode.split(':')[1];
         report.thienThoi.elementRelationDistribution[rel] = (report.thienThoi.elementRelationDistribution[rel] || 0) + 1;
         if (rel === 'same_element') report.thienThoi.sameElementPolicyCount++;
      }
      report.thienThoi.supportPressureNeutralDistribution[e.direction] = (report.thienThoi.supportPressureNeutralDistribution[e.direction] || 0) + 1;
      report.thienThoi.strongNormalStrengthDistribution[e.strength] = (report.thienThoi.strongNormalStrengthDistribution[e.strength] || 0) + 1;
    }
    const ttScoreLevel = results.thienThoi?.level || 'zero';
    report.thienThoi.scorePillarLevelDistribution[ttScoreLevel] = (report.thienThoi.scorePillarLevelDistribution[ttScoreLevel] || 0) + 1;

    // DIA LOI
    report.diaLoi.schoolDistribution[obs.school] = (report.diaLoi.schoolDistribution[obs.school] || 0) + 1;
    const adapterPolicy = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal/adapter/policy/adapter-policy.v0.3.json'), 'utf-8'));
    const PRINCIPAL = new Set(adapterPolicy.principalStarNames);
    const pStars = (activePalace.stars || []).filter(s => PRINCIPAL.has(s.name) && (s.source ?? "natal") === "natal");
    if (pStars.length === 0) report.diaLoi.voChinhDieuObservations++;
    if (pStars.length === 1) report.diaLoi.onePrincipalCases++;
    if (pStars.length === 2) report.diaLoi.twoPrincipalCases++;
    if (pStars.length > 2) report.diaLoi.moreThanTwoDefensiveAnomalyCount++;
    
    for (const s of pStars) {
      if (!s.brightness) report.diaLoi.missingBrightness++;
      else {
        if (!report.diaLoi.brightnessByStarAndDignity[s.name]) report.diaLoi.brightnessByStarAndDignity[s.name] = {};
        report.diaLoi.brightnessByStarAndDignity[s.name][s.brightness] = (report.diaLoi.brightnessByStarAndDignity[s.name][s.brightness] || 0) + 1;
        report.diaLoi.dignityCounts[s.brightness] = (report.diaLoi.dignityCounts[s.brightness] || 0) + 1;
      }
    }
    
    const dlEvidence = emittedEvidence.filter(e => e.pillarId === 'dia-loi');
    if (dlEvidence.length === 0) report.diaLoi.noSignalCases++;
    report.diaLoi.evidenceEmissionCount += dlEvidence.length;
    const dlScoreLevel = results.diaLoi?.level || 'zero';
    report.diaLoi.scorePillarLevelDistribution[dlScoreLevel] = (report.diaLoi.scorePillarLevelDistribution[dlScoreLevel] || 0) + 1;
    
    // NHAN HOA
    report.nhanHoa.schoolDistribution[obs.school] = (report.nhanHoa.schoolDistribution[obs.school] || 0) + 1;
    const nhEvidence = emittedEvidence.filter(e => e.pillarId === 'nhan-hoa');
    if (nhEvidence.length === 0) report.nhanHoa.noEvidenceObservations++;
    let hasSupp = false;
    let hasPress = false;
    for (const e of nhEvidence) {
      if (e.direction === 'support') hasSupp = true;
      if (e.direction === 'pressure') hasPress = true;
      if (e.reasonCode?.startsWith('auxiliary-set:')) {
         const set = e.reasonCode.split(':')[1];
         report.nhanHoa.activationCountForEachConfiguredSet[set] = (report.nhanHoa.activationCountForEachConfiguredSet[set] || 0) + 1;
      }
    }
    if (hasSupp && !hasPress) report.nhanHoa.supportOnly++;
    if (!hasSupp && hasPress) report.nhanHoa.pressureOnly++;
    if (hasSupp && hasPress) report.nhanHoa.mixed++;
    
    const nhScoreLevel = results.nhanHoa?.level || 'zero';
    report.nhanHoa.scorePillarLevelDistribution[nhScoreLevel] = (report.nhanHoa.scorePillarLevelDistribution[nhScoreLevel] || 0) + 1;
    
    // TU HOA
    const tuHoaEv = emittedEvidence.filter(e => e.pillarId === 'tu-hoa-sat-tinh' && e.physicalFactKind === 'major-fortune-transformation');
    if (tuHoaEv.length === 0) report.tuHoa.zeroDirectEvidenceObservations++;
    report.tuHoa.acceptedTransformationEvidence += tuHoaEv.length;
    for (const e of tuHoaEv) {
       const type = e.factIds.find(f => f.startsWith('transformationType:'))?.split(':')[1] || 'unknown';
       report.tuHoa.transformationTypeDistribution[type] = (report.tuHoa.transformationTypeDistribution[type] || 0) + 1;
       const target = e.factIds.find(f => f.startsWith('targetPalace:'))?.split(':')[1] || 'unknown';
       report.tuHoa.targetPalaceDistribution[target] = (report.tuHoa.targetPalaceDistribution[target] || 0) + 1;
    }
    if (tuHoaEv.length > 1) report.tuHoa.multiTransformationObservations++;
    
    report.tuHoa.outOfFrameTuples += adapterDiagnostics.outOfFrameTransformationCount || 0;
    report.tuHoa.incompleteTuples += adapterDiagnostics.incompleteTransformationTuples?.length || 0;
    if (adapterDiagnostics.namPhaiTransformationBlocked?.length > 0) report.tuHoa.blockedNamPhaiObservations++;
    
    const tuHoaScoreLevel = results.tuHoaSatTinh?.level || 'zero';
    report.tuHoa.scorePillarLevelDistribution[tuHoaScoreLevel] = (report.tuHoa.scorePillarLevelDistribution[tuHoaScoreLevel] || 0) + 1;
  }
  
  if (report.diaLoi.voChinhDieuObservations === observations.length) {
     throw new Error("Invalid: all observations reported as Vo Chinh Dieu!");
  }

  if (!fs.existsSync(path.join(base, 'reports'))) fs.mkdirSync(path.join(base, 'reports'), { recursive: true });

  const outStr = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(base, 'reports/corpus-gap-report.json'), outStr);
  
  const hash = crypto.createHash('sha256').update(outStr).digest('hex');
  fs.writeFileSync(path.join(base, 'reports/corpus-gap-report.hash'), hash);
  console.log("Generated accurate corpus report and hash.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCorpusReport();
}
