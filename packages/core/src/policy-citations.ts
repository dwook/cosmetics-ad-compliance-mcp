import type {
  CitationAnchor,
  ClaimSpan,
  RuleDefinition,
} from "../../shared-types/src/index.js";

import {
  POLICY_PAGE_BLOCK_INDEX,
  POLICY_SEMANTIC_INDEX,
} from "./policy-anchor-index.generated.js";

interface PolicyAnchorRecord extends CitationAnchor {
  pageNumber: number;
  blockNumber: number;
  text: string;
}

interface PolicySemanticAnchorRecord extends CitationAnchor {
  anchorKind: "semantic";
  heading: string;
  headingLevel: number;
  pageNumber: number;
  pageEndNumber: number;
  text: string;
}

type PolicyCandidate =
  | { anchor: PolicyAnchorRecord; kind: "page_block" }
  | { anchor: PolicySemanticAnchorRecord; kind: "semantic" };

type PolicySourceId = "mfds-guideline" | "kcia-guide";

const POLICY_SOURCE_IDS = new Set(["mfds-guideline", "kcia-guide"]);
const POLICY_SOURCE_TITLES: Record<PolicySourceId, string> = {
  "mfds-guideline": "화장품 표시·광고 관리 지침",
  "kcia-guide": "화장품 광고자문 기준 및 해설서",
};
const STOP_TOKENS = new Set([
  "표현",
  "광고",
  "화장품",
  "기준",
  "관리",
  "해설서",
  "지침",
  "관련",
  "기능성",
  "오인",
  "특허",
]);

const SEMANTIC_HINTS_BY_ISSUE_TAG: Record<string, string[]> = {
  medical_claim: ["의약품", "질병", "치료", "예방", "회복", "재생"],
  functional_scope: ["기능성", "효능", "효과", "미백", "주름", "자외선"],
  functional_category_mismatch: ["기능성", "심사", "보고", "범위", "탈모", "주름", "미백"],
  ingredient_transfer: ["원료", "추출물", "성분", "간접", "오인"],
  side_effect_misleading: ["부작용", "명현현상", "오인", "개인차"],
  procedure_like_claim: ["바늘", "니들", "마이크로니들", "미세침", "MTS", "시술"],
  skin_age_claim: ["피부나이", "어려짐", "감소", "피부 노화 지수"],
  natural_organic_claim: ["천연", "유기농", "natural", "organic", "안내서", "적합"],
  vegan_claim: ["비건", "vegan", "안내서", "인증서", "유효기간"],
  iso_index_claim: [
    "ISO 16128",
    "천연지수",
    "천연유래지수",
    "유기농지수",
    "유기농유래지수",
    "의미가 아님",
  ],
  human_derived_claim: [
    "인체 유래",
    "줄기세포",
    "stem cell",
    "엑소좀",
    "세포·조직 배양액",
    "식물줄기세포",
    "우유 엑소좀",
  ],
  banned_ingredient_free_claim: [
    "배합금지 원료",
    "무첨가",
    "free",
    "스테로이드",
    "벤조피렌",
  ],
  specific_ingredient_free_claim: [
    "무(無)",
    "무첨가",
    "free",
    "특정성분",
    "시험분석자료",
    "제품에 특정성분이 들어 있지 않다",
  ],
  patent_claim: [
    "⑥ 특허 관련 표현 시 객관적 사실에 근거하여 표현하여야 한다.",
    "객관적 사실에 근거하여 표현하여야 한다",
    "특허 등록한 제품 또는 원료(성분)의 제조방법, 조성물 등에 대한 특허의 명칭",
  ],
  patent_overclaim: [
    "발모 조성물 특허성분",
    "주름살 제거 습진 여드름 세계특허",
    "아토피성 피부염의 예방 또는 치료용 조성물",
    "지방축적 억제용 화장료로 특허 받은 성분들로 구성",
  ],
  authority_certification: ["허가", "인증", "식약처", "공인", "심사", "보고"],
  absolute_claim: ["절대적", "최고", "최상", "보장", "100%"],
  evidence_overlay: ["인체적용시험", "실증", "시험", "개선", "입증", "수치"],
  ranking_claim: ["비교", "순위", "1위", "베스트", "최고", "최상"],
  comparison_claim: ["비교", "대비", "타제품", "자사제품", "5배", "객관적"],
  expert_endorsement: ["추천", "보증", "공인", "의사", "의료기관", "약사"],
  testimonial_claim: ["후기", "전후", "before", "after", "체험", "리뷰", "사진"],
  general_misleading: ["오인", "과장", "실증", "허위"],
};

const PREFERRED_POLICY_TERMS_BY_ISSUE_TAG: Partial<
  Record<string, Partial<Record<PolicySourceId, string[]>>>
> = {
  medical_claim: {
    "mfds-guideline": [
      "피부의 상처나 질병으로 인한",
    ],
    "kcia-guide": [
      "피부의 상처나 질병으로 인한 손상을 치료하거나 회복 또는 복구한다.",
    ],
  },
  authority_certification: {
    "mfds-guideline": [
      "동 제품은 식품의약품안전처 허가, 인증을 받은 제품임",
    ],
    "kcia-guide": [
      "동 제품은 식품의약품안전처 허가, 인증을 받은 제품임",
    ],
  },
  ingredient_transfer: {
    "mfds-guideline": [
      "원료 관련 설명 시 완제품에 대한 효능ㆍ효과로 오인될 수 있는 표현",
      "원료 관련 설명 시 완제품에 대한 효능·효과로 오인될 수 있는 표현",
    ],
    "kcia-guide": ["원료 관련 설명 시 완제품에 대한 효능ㆍ효과로 오인될 수 있는 표현"],
  },
  side_effect_misleading: {
    "mfds-guideline": ["부작용이 전혀 없다.", "일시적 악화(명현현상)가 있을 수 있다."],
    "kcia-guide": ["부작용이 전혀 없다.", "일시적 악화(명현현상)가 있을 수 있다."],
  },
  procedure_like_claim: {
    "mfds-guideline": ["제품 사용방법을 사실과 다르거나 오인할 수 있는 표현"],
    "kcia-guide": ["제품 사용방법을 사실과 다르거나 오인할 수 있는 표현"],
  },
  skin_age_claim: {
    "mfds-guideline": ["피부 나이 n세 등 기간을 의미하는 단위) 감소 또는 어려진다는 표현"],
    "kcia-guide": ["피부 나이 n세 등 기간을 의미하는 단위) 감소 또는 어려진다는 표현"],
  },
  banned_ingredient_free_claim: {
    "mfds-guideline": ["배합금지 원료를 사용하지 않았다는 표현"],
    "kcia-guide": ["배합금지 원료를 사용하지 않았다는 표현"],
  },
  specific_ingredient_free_claim: {
    "mfds-guideline": ["제품에 특정성분이 들어 있지"],
    "kcia-guide": ["제품에 특정성분이 들어 있지 않다"],
  },
  natural_organic_claim: {
    "mfds-guideline": [
      "천연, 유기농 표현을 사용",
      "천연(Natural)",
      "유기농(organic)",
    ],
    "kcia-guide": [
      "천연화장품 및 유기농화장품 표시ㆍ광고 안내서",
      "천연(Natural)",
      "유기농(Organic)",
    ],
  },
  vegan_claim: {
    "kcia-guide": ["비건 관련 표현"],
  },
  absolute_claim: {
    "mfds-guideline": ["절대적 표현"],
    "kcia-guide": ["∙ 절대적 표현"],
  },
  evidence_overlay: {
    "mfds-guideline": ["화장품의 효능·효과에 관한 내용", "시험·검사와 관련된 표현"],
    "kcia-guide": ["화장품의 효능·효과에 관한 내용", "시험·검사와 관련된 표현"],
  },
  ranking_claim: {
    "mfds-guideline": ["절대적 표현", "타제품과 비교하는 내용의 표시·광고"],
    "kcia-guide": ["∙ 절대적 표현", "∙ 타제품과 비교하는 내용의 광고"],
  },
  comparison_claim: {
    "mfds-guideline": ["타제품과 비교하는 내용의 표시·광고"],
    "kcia-guide": ["타제품과 비교하는 내용의 광고"],
  },
  testimonial_claim: {
    "kcia-guide": [
      "사용 전·후 사진, 사용 후기 인용 시 사실과 다르게 소비자를 오인시키는 광고를 하지 말아야 한다.",
      "사용 전․후(Before & After) 광고",
      "사용 후기는 소비자의 제품구매에 지대한 영향을 줄 수 있으므로 사용 후기를",
    ],
  },
  patent_claim: {
    "kcia-guide": ["⑥ 특허 관련 표현 시 객관적 사실에 근거하여 표현하여야 한다."],
  },
  patent_overclaim: {
    "kcia-guide": [],
  },
};

const DISFAVORED_POLICY_TERMS_BY_ISSUE_TAG: Partial<
  Record<string, Partial<Record<PolicySourceId, string[]>>>
> = {
  absolute_claim: {
    "mfds-guideline": [
      "2. 표시· 광고 표현범위 책임판매업자등이 화장품 표시 또는 광고를 할 때 금지표현 등 세부사항의 예시는 별표 1과 같다.",
    ],
  },
};

const SUPPRESSED_POLICY_SOURCES_BY_ISSUE_TAG: Partial<
  Record<string, PolicySourceId[]>
> = {
  absolute_claim: ["mfds-guideline"],
  testimonial_claim: ["mfds-guideline"],
};

const PAGE_BLOCK_FIRST_POLICY_SOURCES_BY_ISSUE_TAG: Partial<
  Record<string, PolicySourceId[]>
> = {
  side_effect_misleading: ["kcia-guide"],
  natural_organic_claim: ["kcia-guide"],
  vegan_claim: ["kcia-guide"],
};

function tokenize(text: string): string[] {
  return text
    .split(/[^0-9A-Za-z가-힣%]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_TOKENS.has(token));
}

function buildQueryTerms(rule: RuleDefinition, claim: ClaimSpan, evidence: string[]) {
  return [
    ...new Set(
      [
        ...evidence,
        ...tokenize(rule.title),
        ...tokenize(claim.text),
        ...(SEMANTIC_HINTS_BY_ISSUE_TAG[rule.issueTag] ?? []),
      ].filter((token) => token.length >= 2),
    ),
  ];
}

function scorePageBlockAnchor(
  anchor: PolicyAnchorRecord,
  queryTerms: string[],
  preferredTerms: string[] = [],
): number {
  let score = 0;

  for (const term of queryTerms) {
    if (!anchor.text.includes(term)) {
      continue;
    }

    score += term.length >= 4 ? 5 : 3;
  }

  for (const term of preferredTerms) {
    if (includesNormalized(anchor.text, term)) {
      score += term.length >= 8 ? 20 : 14;
    }
  }

  return score;
}

function scoreSemanticAnchor(
  anchor: PolicySemanticAnchorRecord,
  queryTerms: string[],
  preferredTerms: string[] = [],
): number {
  let score = 0;
  const heading = anchor.heading;
  let matched = false;

  for (const term of queryTerms) {
    if (heading.includes(term)) {
      matched = true;
      score += term.length >= 4 ? 8 : 5;
      continue;
    }

    if (anchor.text.includes(term)) {
      matched = true;
      score += term.length >= 4 ? 5 : 3;
    }
  }

  for (const term of preferredTerms) {
    if (includesNormalized(heading, term)) {
      matched = true;
      score += term.length >= 8 ? 26 : 18;
      continue;
    }

    if (includesNormalized(anchor.text, term)) {
      matched = true;
      score += term.length >= 8 ? 18 : 12;
    }
  }

  if (!matched) {
    return 0;
  }

  score += Math.max(0, anchor.headingLevel - 1) * 2;

  if (anchor.text.length <= 400) {
    score += 5;
  } else if (anchor.text.length <= 900) {
    score += 2;
  }

  if (anchor.heading.startsWith("[별표")) {
    score -= 4;
  }

  if (anchor.text.length > 1200) {
    score -= 4;
  }

  if (anchor.text.length > 2200) {
    score -= 5;
  }

  if (anchor.text.length > 3600) {
    score -= 6;
  }

  return score;
}

function normalizeInlineText(text: string): string {
  return text
    .replace(/[ㆍ·∙‧․]/g, "·")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNormalized(text: string, term: string): boolean {
  return normalizeInlineText(text).includes(normalizeInlineText(term));
}

function buildSnippetAroundTerm(text: string, term: string): string | null {
  const normalizedText = normalizeInlineText(text);
  const normalizedTerm = normalizeInlineText(term);

  if (!normalizedTerm || !normalizedText.includes(normalizedTerm)) {
    return null;
  }

  const termIndex = normalizedText.indexOf(normalizedTerm);
  const bulletStartCandidates = [
    normalizedText.lastIndexOf("∙", termIndex),
    normalizedText.lastIndexOf("·", termIndex),
    normalizedText.lastIndexOf("-", termIndex),
  ].filter((index) => index >= 0);
  const start =
    bulletStartCandidates.length > 0
      ? Math.max(...bulletStartCandidates)
      : Math.max(0, termIndex - 16);
  const endCandidates = [
    normalizedText.indexOf("☞", termIndex),
    normalizedText.indexOf("∙", termIndex + normalizedTerm.length),
    normalizedText.indexOf("·", termIndex + normalizedTerm.length),
    normalizedText.indexOf("<<", termIndex),
    normalizedText.indexOf("※", termIndex),
  ].filter((index) => index > termIndex);
  const end =
    endCandidates.length > 0
      ? Math.min(...endCandidates)
      : Math.min(normalizedText.length, termIndex + normalizedTerm.length + 72);
  const snippet = normalizedText.slice(start, end).trim();

  return snippet.length > 0 ? snippet : null;
}

function buildPageBlockLabel(
  anchor: PolicyAnchorRecord,
  preferredTerms: string[],
  queryTerms: string[],
): string {
  const sourceTitle = POLICY_SOURCE_TITLES[anchor.sourceId as PolicySourceId];
  const normalizedExcerpt = normalizeInlineText(anchor.text);
  const matchedTerm = preferredTerms
    .filter((term) => includesNormalized(normalizedExcerpt, term))
    .sort((left, right) => right.length - left.length)[0];

  if (matchedTerm) {
    const snippet = buildSnippetAroundTerm(normalizedExcerpt, matchedTerm);

    if (snippet) {
      return `${sourceTitle} ${snippet}`;
    }

    return `${sourceTitle} ${normalizeInlineText(matchedTerm)}`;
  }

  const matchedQueryTerm = queryTerms
    .filter((term) => term.length >= 3 && includesNormalized(normalizedExcerpt, term))
    .sort((left, right) => right.length - left.length)[0];

  if (matchedQueryTerm) {
    const snippet = buildSnippetAroundTerm(normalizedExcerpt, matchedQueryTerm);

    if (snippet) {
      return `${sourceTitle} ${snippet}`;
    }
  }

  return anchor.label;
}

function rankAnchors(
  sourceId: string,
  queryTerms: string[],
  preferredTerms: string[] = [],
  disfavoredTerms: string[] = [],
  preferPageBlock = false,
): CitationAnchor[] {
  const pageBlockAnchors = (POLICY_PAGE_BLOCK_INDEX[
    sourceId as keyof typeof POLICY_PAGE_BLOCK_INDEX
  ] ?? []) as unknown as PolicyAnchorRecord[];
  const semanticAnchors = (POLICY_SEMANTIC_INDEX[
    sourceId as keyof typeof POLICY_SEMANTIC_INDEX
  ] ?? []) as unknown as PolicySemanticAnchorRecord[];
  const preferredSemanticAnchors = preferredTerms.length
    ? semanticAnchors.filter((anchor) =>
        preferredTerms.some(
          (term) =>
            includesNormalized(anchor.heading, term) ||
            includesNormalized(anchor.text, term),
        ),
      )
    : [];
  const preferredPageBlockAnchors = preferredTerms.length
    ? pageBlockAnchors.filter((anchor) =>
        preferredTerms.some((term) => includesNormalized(anchor.text, term)),
      )
    : [];
  const headingMatchedSemanticAnchors = semanticAnchors.filter((anchor) =>
    queryTerms.some((term) => anchor.heading.includes(term)),
  );
  const prioritizedSemanticAnchors =
    headingMatchedSemanticAnchors.length > 0
      ? headingMatchedSemanticAnchors
      : semanticAnchors;
  const candidates: PolicyCandidate[] =
    preferPageBlock && preferredPageBlockAnchors.length > 0
      ? preferredPageBlockAnchors.map((anchor) => ({
          anchor,
          kind: "page_block" as const,
        }))
      : preferredSemanticAnchors.length > 0
      ? preferredSemanticAnchors.map((anchor) => ({
          anchor,
          kind: "semantic" as const,
        }))
      : preferredPageBlockAnchors.length > 0
        ? preferredPageBlockAnchors.map((anchor) => ({
            anchor,
            kind: "page_block" as const,
          }))
        : [
            ...prioritizedSemanticAnchors.map((anchor) => ({
              anchor,
              kind: "semantic" as const,
            })),
            ...pageBlockAnchors.map((anchor) => ({
              anchor,
              kind: "page_block" as const,
            })),
          ];

  return candidates
    .map((anchor) => ({
      anchor,
      score: (() => {
        const baseScore =
          anchor.kind === "semantic"
          ? scoreSemanticAnchor(anchor.anchor, queryTerms, preferredTerms)
          : scorePageBlockAnchor(anchor.anchor, queryTerms, preferredTerms);
        const isDisfavored = disfavoredTerms.some((term) =>
          anchor.kind === "semantic"
            ? includesNormalized(anchor.anchor.heading, term) ||
              includesNormalized(anchor.anchor.text, term)
            : includesNormalized(anchor.anchor.text, term),
        );

        return isDisfavored ? baseScore - 100 : baseScore;
      })(),
    }))
    .filter((candidate) =>
      candidate.anchor.kind === "semantic"
        ? candidate.score >= 5
        : candidate.score > 0,
    )
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.anchor.kind !== right.anchor.kind) {
        return left.anchor.kind === "semantic" ? -1 : 1;
      }

      if (left.anchor.anchor.pageNumber !== right.anchor.anchor.pageNumber) {
        return left.anchor.anchor.pageNumber - right.anchor.anchor.pageNumber;
      }

      if (left.anchor.kind === "page_block" && right.anchor.kind === "page_block") {
        return left.anchor.anchor.blockNumber - right.anchor.anchor.blockNumber;
      }

      return left.anchor.anchor.anchorId.localeCompare(right.anchor.anchor.anchorId);
    })
    .slice(0, 1)
    .map(({ anchor }) => ({
      sourceId: anchor.anchor.sourceId,
      anchorId: anchor.anchor.anchorId,
      locator: anchor.anchor.locator,
      label:
        anchor.kind === "page_block"
          ? buildPageBlockLabel(anchor.anchor, preferredTerms, queryTerms)
          : anchor.anchor.label,
      excerpt: anchor.anchor.excerpt,
    }));
}

function getPreferredPolicyTerms(
  issueTag: string,
  sourceId: PolicySourceId,
  evidence: string[],
): string[] {
  const staticTerms =
    PREFERRED_POLICY_TERMS_BY_ISSUE_TAG[issueTag]?.[sourceId] ?? [];
  const dynamicTerms =
    issueTag === "patent_overclaim"
      ? evidence.filter((term) => term.length >= 4 && term !== "특허")
      : [];

  return [...new Set([...dynamicTerms, ...staticTerms])];
}

function getDisfavoredPolicyTerms(
  issueTag: string,
  sourceId: PolicySourceId,
): string[] {
  return DISFAVORED_POLICY_TERMS_BY_ISSUE_TAG[issueTag]?.[sourceId] ?? [];
}

function shouldPreferPageBlock(
  issueTag: string,
  sourceId: PolicySourceId,
): boolean {
  return PAGE_BLOCK_FIRST_POLICY_SOURCES_BY_ISSUE_TAG[issueTag]?.includes(sourceId) ?? false;
}

export function resolvePolicyCitations(
  rule: RuleDefinition,
  claim: ClaimSpan,
  evidence: string[],
): CitationAnchor[] {
  const queryTerms = buildQueryTerms(rule, claim, evidence);

  if (queryTerms.length === 0) {
    return [];
  }

  return rule.referenceIds.flatMap((sourceId) => {
    if (!POLICY_SOURCE_IDS.has(sourceId)) {
      return [];
    }

    if (
      SUPPRESSED_POLICY_SOURCES_BY_ISSUE_TAG[rule.issueTag]?.includes(
        sourceId as PolicySourceId,
      )
    ) {
      return [];
    }

    const preferredTerms = getPreferredPolicyTerms(
      rule.issueTag,
      sourceId as PolicySourceId,
      evidence,
    );
    const disfavoredTerms = getDisfavoredPolicyTerms(
      rule.issueTag,
      sourceId as PolicySourceId,
    );
    const preferPageBlock = shouldPreferPageBlock(
      rule.issueTag,
      sourceId as PolicySourceId,
    );

    return rankAnchors(
      sourceId,
      queryTerms,
      preferredTerms,
      disfavoredTerms,
      preferPageBlock,
    );
  });
}
