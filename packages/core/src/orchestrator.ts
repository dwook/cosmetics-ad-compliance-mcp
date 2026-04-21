import type {
  FindingExplanation,
  ReviewRequest,
  ReviewResult,
  RevisionSuggestion,
  ReviewUncertaintySignal,
  ReviewVerdict,
} from "../../shared-types/src/index.js";
import { extractClaims } from "./claim-extractor.js";
import { classifyAdCopy } from "./classifier.js";
import { buildUserReport } from "./report-formatter.js";
import { buildPublicReviewStatus } from "./public-review-status.js";
import {
  normalizeRequest,
  REFERENCE_CATALOG,
  RULE_CATALOG,
} from "./reference-catalog.js";
import { buildReviewProductProfile } from "./product-qualification.js";
import { listApplicableReferences } from "./reference-selector.js";
import { buildRevisionSuggestion } from "./revision-suggester.js";
import { evaluateReviewUncertainty } from "./review-uncertainty.js";
import { reviewClaims } from "./reviewer.js";
import { loadSourcePack } from "./source-pack.js";

function computeVerdict(
  surfacedFindingsCount: number,
  hasBlock: boolean,
  uncertaintySignals: ReviewUncertaintySignal[],
): ReviewVerdict {
  if (hasBlock) {
    return "BLOCK";
  }

  if (
    surfacedFindingsCount > 0 &&
    uncertaintySignals.some((signal) => signal.affectsVerdict)
  ) {
    return "UNCLEAR";
  }

  if (surfacedFindingsCount > 0) {
    return "WARNING";
  }

  return "PASS";
}

export function reviewAdCopy(request: ReviewRequest): ReviewResult {
  const normalized = normalizeRequest(request);
  const productProfile = buildReviewProductProfile(normalized);
  const classification = classifyAdCopy(normalized);
  const selectedReferences = listApplicableReferences(normalized, classification);
  const sourcePack = loadSourcePack(selectedReferences);
  const claims = extractClaims(normalized.adCopy);
  const reviewed = reviewClaims(
    normalized,
    claims,
    selectedReferences,
    classification,
    productProfile,
  );
  const uncertaintySignals = evaluateReviewUncertainty({
    classification,
    surfacedFindings: reviewed.surfacedFindings,
  });
  const verdict = computeVerdict(
    reviewed.surfacedFindings.length,
    reviewed.surfacedFindings.some((finding) => finding.verdict === "BLOCK"),
    uncertaintySignals,
  );
  const publicStatus = buildPublicReviewStatus({
    verdict,
    surfacedFindings: reviewed.surfacedFindings,
  });
  const report = buildUserReport({
    verdict,
    publicStatus,
    productProfile,
    surfacedFindings: reviewed.surfacedFindings,
    selectedReferences,
    uncertaintySignals,
  });

  return {
    request: normalized,
    productProfile,
    classification,
    selectedReferences,
    sourcePack,
    claims,
    findings: reviewed.findings,
    surfacedFindings: reviewed.surfacedFindings,
    suppressedFindings: reviewed.suppressedFindings,
    uncertaintySignals,
    verdict,
    publicStatus,
    summary: report.summaryLine,
    report,
  };
}

export function explainFinding(
  request: ReviewRequest,
  findingId: string,
): FindingExplanation | null {
  const review = reviewAdCopy(request);
  const finding = review.findings.find((candidate) => candidate.id === findingId);

  if (!finding) {
    return null;
  }

  const rule = RULE_CATALOG.find((candidate) => candidate.id === finding.ruleId);
  const references = REFERENCE_CATALOG.filter((candidate) =>
    finding.citedReferenceIds.includes(candidate.id),
  );

  return {
    code: finding.code,
    title: finding.title,
    taxonomy: finding.taxonomy,
    reason: finding.reason,
    referencePaths: references.map((reference) => reference.path),
    sourceTitles: references.map((reference) => reference.title),
    citations: finding.citations,
    sourceBindings: finding.sourceBindings,
    nextAction:
      finding.suggestedFix ??
      "표현을 좁히고 근거자료 또는 고지사항을 함께 확인합니다.",
  };
}

export function suggestRevision(request: ReviewRequest): RevisionSuggestion {
  const review = reviewAdCopy(request);

  return buildRevisionSuggestion(review);
}
