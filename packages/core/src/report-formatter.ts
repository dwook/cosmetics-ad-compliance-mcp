import type {
  Finding,
  PublicReviewStatus,
  ReviewProductProfile,
  ReviewUncertaintySignal,
  ReviewVerdict,
  SelectedReference,
  UserReport,
} from "../../shared-types/src/index.js";

const DISCLAIMER =
  "이 결과는 5개 근거 문서를 기준으로 한 seed review이며 최종 법률 자문을 대체하지 않습니다.";

function toReportItem(finding: Finding) {
  return {
    code: finding.code,
    title: finding.title,
    taxonomy: finding.taxonomy,
    reason: finding.reason,
    spanText: finding.span.text,
    evidence: finding.evidence,
    citedReferenceIds: finding.citedReferenceIds,
    citations: finding.citations,
    sourceBindings: finding.sourceBindings,
    suggestedFix: finding.suggestedFix,
  };
}

function buildSummary(
  verdict: ReviewVerdict,
  surfacedFindings: Finding[],
): string {
  if (verdict === "BLOCK") {
    return `5개 근거 문서를 기준으로 즉시 수정이 필요한 고위험 표현 ${surfacedFindings.length}건이 감지되었습니다.`;
  }

  if (verdict === "WARNING") {
    return `5개 근거 문서를 기준으로 검토 또는 보완이 필요한 표현 ${surfacedFindings.length}건이 감지되었습니다.`;
  }

  if (verdict === "UNCLEAR") {
    if (surfacedFindings.length > 0) {
      return "리스크 신호는 감지되었지만 근거 강도나 해석 폭이 충분히 고정되지 않아 추가 검토가 필요합니다.";
    }

    return "근거 수준이 충분히 고정되지 않아 추가 검토가 필요합니다.";
  }

  return "현재 seed rules 기준 즉시 수정이 필요한 금지표현은 감지되지 않았습니다.";
}

export function buildUserReport(params: {
  verdict: ReviewVerdict;
  publicStatus: PublicReviewStatus;
  productProfile: ReviewProductProfile;
  surfacedFindings: Finding[];
  selectedReferences: SelectedReference[];
  uncertaintySignals: ReviewUncertaintySignal[];
}): UserReport {
  const {
    verdict,
    publicStatus,
    productProfile,
    surfacedFindings,
    selectedReferences,
    uncertaintySignals,
  } = params;

  const mustFix = surfacedFindings
    .filter((finding) => finding.verdict === "BLOCK" || finding.severity === "high")
    .map(toReportItem);
  const caution = surfacedFindings
    .filter((finding) => !mustFix.some((item) => item.code === finding.code))
    .map(toReportItem);
  const additionalChecks = [
    ...new Set(
      surfacedFindings
        .flatMap((finding) => finding.requiredChecks)
        .concat(productProfile.additionalChecks),
    ),
  ];
  const sourceGrounding = [
    ...new Set(
      selectedReferences.map(
        (reference) => `${reference.title} (${reference.authority}, 기준일 ${reference.asOfDate})`,
      ),
    ),
  ];
  const taxonomySummary = [
    ...new Map(
      surfacedFindings.map((finding) => [
        finding.taxonomy.family,
        {
          label: finding.taxonomy.familyLabel,
          count: surfacedFindings.filter(
            (candidate) => candidate.taxonomy.family === finding.taxonomy.family,
          ).length,
        },
      ]),
    ).values(),
  ].map((entry) => `${entry.label}: ${entry.count}건`);
  const productQualificationNotes = [
    `입력 제품 구분: ${productProfile.declaredProductKind}`,
    productProfile.declaredFunctionalCategoryLabels.length > 0
      ? `입력 기능성 범주: ${productProfile.declaredFunctionalCategoryLabels.join(", ")}`
      : "입력 기능성 범주: 없음",
  ];

  if (productProfile.inferredFunctionalCategoryLabels.length > 0) {
    productQualificationNotes.push(
      `문안에서 감지된 기능성 범주: ${productProfile.inferredFunctionalCategoryLabels.join(", ")}`,
    );
  }

  if (productProfile.lawBasis.length > 0) {
    productQualificationNotes.push(
      `법령 cross-check 기준: ${productProfile.lawBasis.join(", ")}`,
    );
  }

  for (const note of productProfile.mismatchNotes) {
    productQualificationNotes.push(`주의: ${note}`);
  }

  return {
    summaryLine: buildSummary(verdict, surfacedFindings),
    publicStatus,
    productQualificationNotes,
    productQualificationChecklist: productProfile.categoryChecklists,
    taxonomySummary,
    mustFix,
    caution,
    ok:
      surfacedFindings.length === 0
        ? ["현재 seed rules 기준 즉시 수정이 필요한 금지표현은 감지되지 않았습니다."]
        : [],
    sourceGrounding,
    uncertaintyNotes: uncertaintySignals.map((signal) => signal.message),
    additionalChecks,
    disclaimer: DISCLAIMER,
  };
}
