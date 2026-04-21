import type {
  Finding,
  RevisionChange,
  RevisionPhraseReplacement,
  RevisionSuggestion,
  ReviewResult,
} from "../../shared-types/src/index.js";
import { STANDARD_PHRASES } from "./standard-phrases.js";

interface PhraseRule {
  from: string;
  to: string;
}

const ISSUE_TAG_REPLACEMENTS: Record<string, PhraseRule[]> = {
  medical_claim: [
    { from: "단 7일 만에", to: "꾸준한 사용 시" },
    { from: "치료", to: "집중 케어" },
    { from: "완치", to: "집중 관리" },
    { from: "처방", to: "맞춤 케어" },
    { from: "재생", to: "피부 컨디션 케어" },
    { from: "염증 완화", to: "민감 피부 진정 케어" },
    { from: "흉터 개선", to: "피부 결 케어" },
    { from: "약속합니다", to: "사용감을 설명합니다" },
    { from: "보장합니다", to: "도움을 줄 수 있는 범위로 안내합니다" },
  ],
  functional_scope: [
    { from: "미백", to: "브라이트닝 케어" },
    { from: "주름", to: "탄력 케어" },
    { from: "탈모 증상 완화", to: "두피 컨디션 케어" },
  ],
  functional_category_mismatch: [
    { from: "탈모 증상 완화", to: "두피 컨디션 케어" },
    { from: "빠지는 모발", to: "모발 컨디션" },
    { from: "미백", to: "브라이트닝 케어" },
    { from: "주름", to: "탄력 케어" },
  ],
  ingredient_transfer: [
    { from: "개선", to: "케어에 도움" },
    { from: "강화", to: "관리" },
    { from: "회복", to: "컨디션 관리" },
    { from: "재생", to: "피부 컨디션 케어" },
  ],
  side_effect_misleading: [
    { from: "부작용이 전혀 없다", to: "사용감은 개인차가 있을 수 있다" },
    { from: "부작용 없음", to: "사용감은 개인차가 있을 수 있음" },
    { from: "부작용 없는", to: "사용감에는 개인차가 있는" },
    { from: "명현현상", to: "사용 초기 반응" },
    { from: "일시적 악화", to: "사용 초기 변화" },
  ],
  procedure_like_claim: [
    { from: "바늘", to: "세밀한 사용감" },
    { from: "니들", to: "세밀한 사용감" },
    { from: "마이크로니들", to: "세밀한 사용감" },
    { from: "미세침", to: "세밀한 사용감" },
    { from: "MTS", to: "집중 케어" },
  ],
  skin_age_claim: [
    { from: "피부나이", to: "피부 컨디션" },
    { from: "어려짐", to: "개선된 인상" },
  ],
  natural_organic_claim: [
    { from: "천연화장품", to: "원료 구성을 설명하는 화장품" },
    { from: "유기농화장품", to: "원료 구성을 설명하는 화장품" },
    { from: "천연(Natural)", to: "원료 특성을 설명한" },
    { from: "유기농(Organic)", to: "원료 특성을 설명한" },
  ],
  vegan_claim: [
    { from: "비건", to: "원료 구성을 설명한" },
    { from: "VEGAN", to: "원료 구성을 설명한" },
  ],
  iso_index_claim: [
    { from: "천연지수", to: "ISO 16128 계산값" },
    { from: "천연유래지수", to: "ISO 16128 계산값" },
    { from: "유기농지수", to: "ISO 16128 계산값" },
    { from: "유기농유래지수", to: "ISO 16128 계산값" },
  ],
  human_derived_claim: [
    { from: "줄기세포화장품", to: "원료 출처를 설명한 화장품" },
    { from: "줄기세포", to: "원료" },
    { from: "stem cell", to: "ingredient" },
    { from: "엑소좀 화장품", to: "원료 특성을 설명한 화장품" },
    { from: "엑소좀", to: "원료" },
    { from: "인체 유래", to: "유래 정보를 확인한" },
    { from: "세포·조직 배양액", to: "원료 정보" },
  ],
  banned_ingredient_free_claim: [
    { from: "무첨가", to: "원료 구성을 설명한" },
    { from: "free", to: "composition-based" },
    { from: "프리", to: "원료 구성을 설명한" },
    { from: "스테로이드", to: "특정 성분" },
    { from: "벤조피렌", to: "특정 성분" },
  ],
  specific_ingredient_free_claim: [
    { from: "무첨가", to: "함유 여부를 확인한" },
    { from: "free", to: "absence-checked" },
    { from: "프리", to: "함유 여부를 확인한" },
    { from: "무(無)", to: "함유 여부 확인" },
  ],
  patent_claim: [
    { from: "특허받은", to: "등록 정보를 확인한" },
    { from: "특허 받은", to: "등록 정보를 확인한" },
    { from: "특허성분", to: "등록 정보가 확인된 원료" },
    { from: "특허", to: "등록 정보" },
  ],
  patent_overclaim: [
    { from: "특허성분", to: "등록 정보가 확인된 원료" },
    { from: "특허", to: "등록 정보" },
    { from: "발모 조성물", to: "원료 조성" },
    { from: "주름살 제거", to: "피부 컨디션 케어" },
    { from: "아토피성 피부염", to: "민감 피부 고민" },
    { from: "치료용 조성물", to: "원료 조성" },
  ],
  authority_certification: [
    { from: "식약처", to: "관련 기준을 검토한" },
    { from: "공식", to: "기준을 검토한" },
    { from: "허가", to: "검토" },
    { from: "인증", to: "기준 확인" },
    { from: "공인", to: "기준 확인" },
  ],
  absolute_claim: [
    { from: "100%", to: "도움을 줄 수 있는" },
    { from: "즉시", to: "빠르게 느껴질 수 있는" },
    { from: "영구", to: "꾸준한 사용 시" },
    { from: "완벽", to: "균형 잡힌" },
    { from: "확실히", to: "보다" },
    { from: "단번에", to: "한 번의 사용감으로" },
    { from: "약속합니다", to: "사용감을 설명합니다" },
    { from: "보장합니다", to: "도움을 줄 수 있는 범위로 안내합니다" },
  ],
  testimonial_claim: [
    { from: "후기", to: "사용 경험" },
    { from: "리뷰", to: "사용 의견" },
    { from: "전후", to: "사용감 비교로 오인될 수 있는 표현" },
    { from: "before", to: "사용 전" },
    { from: "after", to: "사용 후" },
  ],
  evidence_overlay: [
    { from: "인체적용시험", to: "시험 자료" },
    { from: "테스트 완료", to: "자료 확인" },
    { from: "시험 완료", to: "자료 확인" },
  ],
  comparison_claim: [
    { from: "대비", to: "비교 기준" },
    { from: "비교", to: "비교 기준" },
    { from: "타제품", to: "비교 대상" },
    { from: "자사제품", to: "비교 대상" },
    { from: "5배", to: "차이가 있는 것으로 안내된" },
  ],
  ranking_claim: [
    { from: "1위", to: "많이 찾는" },
    { from: "최고", to: "주목받는" },
    { from: "유일", to: "대표적인" },
    { from: "베스트", to: "인기" },
    { from: "No.1", to: "인기" },
  ],
  expert_endorsement: [
    { from: "전문의 추천", to: "사용감을 고려한" },
    { from: "의사 추천", to: "사용감을 고려한" },
    { from: "약사 추천", to: "사용감을 고려한" },
    { from: "전문가 추천", to: "사용감을 고려한" },
    { from: "공인", to: "기준을 검토한" },
  ],
  general_misleading: [
    { from: "혁신", to: "새롭게 제안하는" },
    { from: "기적", to: "눈에 띄는" },
    { from: "압도적", to: "차별화된 사용감의" },
    { from: "드라마틱", to: "눈에 띄는 사용감의" },
    { from: "놀라운", to: "부드러운 사용감의" },
  ],
};

const CONTEXT_TERMS = ["기미", "주름", "탄력", "흉터", "두피", "피부", "보습", "진정"];
const INGREDIENT_TERMS = [
  "레티놀",
  "비오틴",
  "나이아신아마이드",
  "펩타이드",
  "세라마이드",
];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function byLongestMatch(left: PhraseRule, right: PhraseRule): number {
  return right.from.length - left.from.length;
}

function extractConcern(text: string): string | null {
  return CONTEXT_TERMS.find((term) => text.includes(term)) ?? null;
}

function extractIngredient(text: string): string | null {
  return INGREDIENT_TERMS.find((term) => text.includes(term)) ?? null;
}

function trailingPunctuation(text: string): string {
  const match = text.match(/[.!?]$/);
  return match?.[0] ?? "";
}

function buildFallbackSentence(findings: Finding[], originalText: string): string {
  const primary = findings[0];
  const issueTag = primary.issueTag;
  const concern = extractConcern(originalText);
  const ingredient = extractIngredient(originalText);
  const punctuation = trailingPunctuation(originalText);

  switch (issueTag) {
    case "medical_claim":
      if (concern) {
        return `${concern} 고민이 있는 피부의 컨디션 케어에 도움을 줄 수 있는 화장품으로 설명합니다${punctuation}`;
      }

      return `${STANDARD_PHRASES.rewriteFallbacks.medical_claim}${punctuation}`;
    case "functional_scope":
    case "functional_category_mismatch":
      if (concern) {
        return `${concern} 관련 표현은 기능성으로 단정하지 않고 제품 사용감 중심으로 설명합니다${punctuation}`;
      }

      return `${STANDARD_PHRASES.rewriteFallbacks.functional_scope}${punctuation}`;
    case "ingredient_transfer":
      if (ingredient) {
        return `${ingredient} 성분을 함유한 제품으로, 피부 컨디션 케어에 도움을 줄 수 있는 사용감 중심으로 설명합니다${punctuation}`;
      }

      return `${STANDARD_PHRASES.rewriteFallbacks.ingredient_transfer}${punctuation}`;
    case "side_effect_misleading":
      return `안전성이나 사용 반응은 개인차가 있을 수 있으므로 단정하지 않고 사용감 중심으로 설명합니다${punctuation}`;
    case "procedure_like_claim":
      return `의료시술이나 침습적 사용방법으로 오인되지 않도록 화장품의 일반적인 사용감 중심으로 설명합니다${punctuation}`;
    case "skin_age_claim":
      return `피부나이 표현 대신 피부 노화 지수 또는 피부 컨디션 중심 표현으로 설명합니다${punctuation}`;
    case "natural_organic_claim":
      return `천연·유기농 단정 표현 대신 원료 구성과 제품 특성을 사실 범위에서만 설명합니다${punctuation}`;
    case "vegan_claim":
      return `비건 단정 표현 대신 관련 안내서 적합성과 자료가 확인되는 범위에서만 설명합니다${punctuation}`;
    case "iso_index_claim":
      return `ISO 지수 표현은 계산 기준과 소비자 오인 방지 문구를 함께 안내할 수 있을 때만 제한적으로 설명합니다${punctuation}`;
    case "human_derived_claim":
      return `인체 유래로 오인될 표현 대신 실제 원료 출처와 제품 특성을 사실 범위에서만 설명합니다${punctuation}`;
    case "banned_ingredient_free_claim":
      return `배합금지 원료 무첨가·free 표현은 삭제하고, 제품 특성은 다른 사실 범위 설명으로 대체합니다${punctuation}`;
    case "specific_ingredient_free_claim":
      return `특정 성분 무첨가·free 표현은 시험분석자료 등 실증자료가 확인되는 범위에서만 제한적으로 설명합니다${punctuation}`;
    case "patent_claim":
      return `특허 표현은 등록 사실과 명칭·범위가 객관적으로 확인되는 범위에서만 제한적으로 설명합니다${punctuation}`;
    case "patent_overclaim":
      return `특허를 효능 보증처럼 쓰는 표현은 삭제하고, 등록 사실이 확인되는 범위의 설명만 남깁니다${punctuation}`;
    case "authority_certification":
      return `허가나 인증으로 오인되지 않도록 제품 특성과 사용감 중심으로 설명합니다${punctuation}`;
    case "absolute_claim":
      return `${STANDARD_PHRASES.rewriteFallbacks.absolute_claim}${punctuation}`;
    case "testimonial_claim":
      return `${STANDARD_PHRASES.rewriteFallbacks.testimonial_claim}${punctuation}`;
    case "evidence_overlay":
      return `수치나 시험 표현은 근거자료가 확인되는 범위에서만 제한적으로 설명합니다${punctuation}`;
    case "comparison_claim":
      return `비교 대상과 기준을 밝힐 수 있는 범위에서만 객관적으로 설명합니다${punctuation}`;
    case "ranking_claim":
      return `${STANDARD_PHRASES.rewriteFallbacks.ranking_claim}${punctuation}`;
    case "expert_endorsement":
      return `${STANDARD_PHRASES.rewriteFallbacks.expert_endorsement}${punctuation}`;
    default:
      return `${STANDARD_PHRASES.rewriteFallbacks.general_misleading}${punctuation}`;
  }
}

function applyPhraseRules(
  text: string,
  rules: PhraseRule[],
): { text: string; applied: RevisionPhraseReplacement[] } {
  let rewritten = text;
  const applied: RevisionPhraseReplacement[] = [];

  for (const rule of [...rules].sort(byLongestMatch)) {
    if (!rewritten.includes(rule.from)) {
      continue;
    }

    rewritten = rewritten.replaceAll(rule.from, rule.to);
    applied.push({ from: rule.from, to: rule.to });
  }

  return { text: rewritten, applied };
}

function hasRemainingRiskTokens(text: string, findings: Finding[]): boolean {
  return findings.some((finding) =>
    finding.evidence.some((evidence) => evidence !== "contextual-overclaim" && text.includes(evidence)),
  );
}

function buildChange(findings: Finding[]): RevisionChange {
  const primary = findings[0];
  const originalText = primary.span.text;
  const appliedPhrases: RevisionPhraseReplacement[] = [];
  let revisedText = originalText;

  for (const finding of findings) {
    const rules = ISSUE_TAG_REPLACEMENTS[finding.issueTag] ?? [];
    const result = applyPhraseRules(revisedText, rules);
    revisedText = result.text;
    appliedPhrases.push(...result.applied);
  }

  if (
    appliedPhrases.length === 0 ||
    revisedText === originalText ||
    hasRemainingRiskTokens(revisedText, findings)
  ) {
    revisedText = buildFallbackSentence(findings, originalText);
  }

  return {
    claimId: primary.claimId,
    findingIds: findings.map((finding) => finding.id),
    codes: findings.map((finding) => finding.code),
    primaryTaxonomy: primary.taxonomy,
    originalText,
    revisedText,
    appliedPhrases: unique(appliedPhrases.map((pair) => JSON.stringify(pair))).map(
      (pair) => JSON.parse(pair) as RevisionPhraseReplacement,
    ),
    rationale: unique(
      findings.map(
        (finding) =>
          finding.suggestedFix ??
          `${finding.title} 관련 표현을 더 좁고 사실 중심인 설명으로 조정합니다.`,
      ),
    ),
    sourceLabels: unique(
      findings.flatMap((finding) =>
        finding.sourceBindings.map((binding) => binding.sourceTitle),
      ),
    ),
  };
}

function replaceClaims(original: string, changes: RevisionChange[], findings: Finding[]): string {
  const spanByClaim = new Map(
    findings.map((finding) => [finding.claimId, finding.span]),
  );

  let revised = original;

  for (const change of [...changes].sort((left, right) => {
    const leftSpan = spanByClaim.get(left.claimId);
    const rightSpan = spanByClaim.get(right.claimId);

    return (rightSpan?.start ?? 0) - (leftSpan?.start ?? 0);
  })) {
    const span = spanByClaim.get(change.claimId);

    if (!span) {
      continue;
    }

    revised =
      revised.slice(0, span.start) + change.revisedText + revised.slice(span.end);
  }

  return revised;
}

export function buildRevisionSuggestion(review: ReviewResult): RevisionSuggestion {
  if (review.surfacedFindings.length === 0) {
    return {
      original: review.request.adCopy,
      revised: review.request.adCopy,
      verdict: review.verdict,
      changeCount: 0,
      changes: [],
      sourceGroundingNote: STANDARD_PHRASES.sourcePackNote,
      uncertaintyNotes: review.report.uncertaintyNotes,
      disclaimer: STANDARD_PHRASES.disclaimer,
    };
  }

  const findingsByClaim = new Map<string, Finding[]>();

  for (const finding of review.surfacedFindings) {
    const group = findingsByClaim.get(finding.claimId) ?? [];
    group.push(finding);
    findingsByClaim.set(finding.claimId, group);
  }

  const changes = [...findingsByClaim.values()].map((group) => buildChange(group));
  const revised = replaceClaims(
    review.request.adCopy,
    changes,
    review.surfacedFindings,
  );

  return {
    original: review.request.adCopy,
    revised,
    verdict: review.verdict,
    changeCount: changes.length,
    changes,
    sourceGroundingNote: STANDARD_PHRASES.sourcePackNote,
    uncertaintyNotes: review.report.uncertaintyNotes,
    disclaimer: STANDARD_PHRASES.disclaimer,
  };
}
