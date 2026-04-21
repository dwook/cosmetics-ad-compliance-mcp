import type {
  Finding,
  PublicReviewStatus,
  ReviewVerdict,
  VerificationReason,
  VerificationReasonCode,
} from "../../shared-types/src/index.js";

const STATUS_LABELS: Record<
  ReviewVerdict,
  Pick<PublicReviewStatus, "code" | "label">
> = {
  BLOCK: {
    code: "PROHIBITED_CLAIM",
    label: "금지표현 해당",
  },
  WARNING: {
    code: "NEEDS_VERIFICATION",
    label: "추가 확인 필요",
  },
  UNCLEAR: {
    code: "NEEDS_HUMAN_REVIEW",
    label: "사람 검토 필요",
  },
  PASS: {
    code: "NO_ISSUE_DETECTED",
    label: "문제 표현 미감지",
  },
};

const VERIFICATION_REASON_METADATA: Record<
  VerificationReasonCode,
  Pick<VerificationReason, "label" | "description">
> = {
  NEEDS_EVIDENCE: {
    label: "실증자료 확인 필요",
    description: "실증자료, 시험자료, 심사(보고) 자료 등 입증 근거를 확인해야 합니다.",
  },
  NEEDS_SCOPE_REVIEW: {
    label: "기능성 범위 확인 필요",
    description: "기능성화장품 신고·심사 범위와 현재 문안 표현이 일치하는지 확인해야 합니다.",
  },
  NEEDS_OBJECTIVE_SUPPORT: {
    label: "객관적 근거 확인 필요",
    description: "인증, 특허, 비교, 수치, 객관적 사실 표현의 근거를 확인해야 합니다.",
  },
};

function classificationReasonCodesForFinding(
  finding: Finding,
): VerificationReasonCode[] {
  switch (finding.issueTag) {
    case "functional_scope":
    case "functional_category_mismatch":
      return ["NEEDS_SCOPE_REVIEW"];
    case "evidence_overlay":
    case "natural_organic_claim":
    case "vegan_claim":
    case "iso_index_claim":
      return ["NEEDS_EVIDENCE"];
    case "specific_ingredient_free_claim":
      return ["NEEDS_EVIDENCE", "NEEDS_OBJECTIVE_SUPPORT"];
    case "authority_certification":
    case "comparison_claim":
    case "ranking_claim":
    case "patent_claim":
    case "patent_overclaim":
    case "testimonial_claim":
    case "expert_endorsement":
    case "absolute_claim":
      return ["NEEDS_OBJECTIVE_SUPPORT"];
    default:
      return [];
  }
}

export function buildPublicReviewStatus(params: {
  verdict: ReviewVerdict;
  surfacedFindings: Finding[];
}): PublicReviewStatus {
  const { verdict, surfacedFindings } = params;
  const status = STATUS_LABELS[verdict];
  const verificationReasonMap = new Map<VerificationReasonCode, Set<string>>();

  if (verdict === "WARNING") {
    for (const finding of surfacedFindings) {
      for (const reasonCode of classificationReasonCodesForFinding(finding)) {
        if (!verificationReasonMap.has(reasonCode)) {
          verificationReasonMap.set(reasonCode, new Set());
        }

        verificationReasonMap.get(reasonCode)?.add(finding.code);
      }
    }
  }

  const verificationReasons: VerificationReason[] = [
    ...verificationReasonMap.entries(),
  ].map(([code, relatedFindingCodes]) => ({
    code,
    label: VERIFICATION_REASON_METADATA[code].label,
    description: VERIFICATION_REASON_METADATA[code].description,
    relatedFindingCodes: [...relatedFindingCodes],
  }));

  return {
    code: status.code,
    label: status.label,
    internalVerdict: verdict,
    verificationReasons,
  };
}
