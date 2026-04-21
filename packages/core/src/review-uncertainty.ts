import type {
  ClassificationResult,
  Finding,
  ReviewUncertaintySignal,
} from "../../shared-types/src/index.js";

function pushSignal(
  signals: ReviewUncertaintySignal[],
  signal: ReviewUncertaintySignal,
): void {
  if (signals.some((candidate) => candidate.code === signal.code)) {
    return;
  }

  signals.push(signal);
}

export function evaluateReviewUncertainty(params: {
  classification: ClassificationResult;
  surfacedFindings: Finding[];
}): ReviewUncertaintySignal[] {
  const { classification, surfacedFindings } = params;
  const signals: ReviewUncertaintySignal[] = [];
  const hasOnlyNonBlockFindings = surfacedFindings.every(
    (finding) => finding.verdict !== "BLOCK",
  );

  if (
    classification.confidence === "low" &&
    surfacedFindings.length > 0 &&
    hasOnlyNonBlockFindings &&
    surfacedFindings.every(
      (finding) =>
        finding.issueTag === "general_misleading" ||
        finding.evidence.every((evidence) => evidence === "contextual-overclaim"),
    )
  ) {
    pushSignal(signals, {
      code: "low_classifier_confidence",
      message: "탐지 신호가 제한적이어서 현재 finding은 보수적으로 해석해야 합니다.",
      affectsVerdict: true,
    });
  }

  if (
    surfacedFindings.length > 0 &&
    hasOnlyNonBlockFindings &&
    surfacedFindings.every(
      (finding) =>
        finding.issueTag === "general_misleading" ||
        finding.evidence.every((evidence) => evidence === "contextual-overclaim"),
    )
  ) {
    pushSignal(signals, {
      code: "weak_evidence_only",
      message: "현재는 맥락 의존성이 큰 일반 오인 신호만 있어 확정 위반 판단을 보류합니다.",
      affectsVerdict: true,
    });
  }

  return signals;
}
