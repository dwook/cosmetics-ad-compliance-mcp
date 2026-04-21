import type {
  ConceptSignalId,
  SignalRequirement,
} from "../../shared-types/src/index.js";

interface SignalLexiconEntry {
  terms?: string[];
  regexes?: RegExp[];
}

const NONHUMAN_BIOLOGIC_ALLOW_REGEXES = [
  /식물\s*줄기세포/gi,
  /식물\s*엑소좀/gi,
  /우유\s*엑소좀/gi,
];

const SIGNAL_LEXICON: Record<ConceptSignalId, SignalLexiconEntry> = {
  medical_treatment: {
    terms: ["치료", "치유", "완치", "처방", "예방", "흉터 개선"],
  },
  medical_regeneration: {
    terms: ["재생", "회복", "복구"],
  },
  functional_brightening: {
    terms: ["미백", "화이트닝", "브라이트닝", "기미", "주근깨"],
  },
  functional_wrinkle: {
    terms: ["주름", "주름개선", "링클", "탄력"],
  },
  functional_uv: {
    terms: ["자외선", "uv", "spf", "pa+", "선크림"],
  },
  functional_hair_loss: {
    terms: ["탈모", "탈모 증상 완화", "빠지는 모발", "모발 감소"],
  },
  functional_acne: {
    terms: ["여드름성 피부", "여드름", "트러블", "논코메도제닉", "acne"],
  },
  side_effect_denial: {
    terms: [
      "부작용이 전혀 없다",
      "부작용이 전혀 없고",
      "부작용이 전혀 없는",
      "부작용 없음",
      "부작용 없는",
    ],
  },
  temporary_worsening_reference: {
    terms: ["명현현상", "일시적 악화"],
  },
  procedure_like_reference: {
    terms: [
      "바늘",
      "니들",
      "마이크로니들",
      "미세침",
      "mts",
      "microneedle therapy system",
    ],
  },
  skin_age_reference: {
    regexes: [
      /피부\s*나이\s*[-–]?\s*\d+\s*(?:년|세|살)(?:\s*(?:감소|어려짐|젊어짐|낮아짐))?/,
    ],
  },
  natural_organic_marketing: {
    regexes: [
      /천연화장품(?![^.\n]{0,30}(?:아님|의미가 아님))/,
      /유기농화장품(?![^.\n]{0,30}(?:아님|의미가 아님))/,
      /천연\s*\(\s*natural\s*\)(?![^.\n]{0,30}(?:아님|의미가 아님))/i,
      /유기농\s*\(\s*organic\s*\)(?![^.\n]{0,30}(?:아님|의미가 아님))/i,
    ],
  },
  vegan_marketing: {
    terms: ["비건", "vegan"],
  },
  iso_index_reference: {
    terms: [
      "ISO 16128",
      "천연지수",
      "천연유래지수",
      "유기농지수",
      "유기농유래지수",
    ],
  },
  iso_index_disclaimer: {
    terms: [
      "천연화장품(유기농화장품) 아님",
      "의미가 아님",
      "단순 계산 결과",
      "가이드라인에 따라 계산한 지수임",
    ],
  },
  stem_cell_marketing: {
    terms: [
      "줄기세포",
      "줄기세포화장품",
      "줄기세포 배양액",
      "줄기세포배양액",
      "stem cell",
      "stemcell",
      "0억 세포",
    ],
  },
  exosome_marketing: {
    terms: ["엑소좀", "엑소좀 화장품", "exosome"],
  },
  human_origin_reference: {
    terms: [
      "인체 유래",
      "인체에서 유래",
      "인체 세포",
      "인체세포",
      "세포·조직 배양액",
      "세포 조직 배양액",
      "세포배양액",
      "조직 배양액",
      "human-derived",
    ],
  },
  nonhuman_biologic_qualifier: {
    terms: [
      "식물줄기세포",
      "식물 줄기세포",
      "식물 엑소좀",
      "식물엑소좀",
      "우유 엑소좀",
      "우유엑소좀",
      "인체에서 유래하지 않은",
      "비인체 유래",
    ],
  },
  restricted_human_derived_marketing: {},
  ingredient_absence_pattern: {
    regexes: [
      /무\s*\(\s*無\s*\)\s*[A-Za-z0-9가-힣-]{2,}/i,
      /[A-Za-z0-9가-힣-]{2,}\s*무첨가/,
      /\b[A-Za-z0-9-]{2,}\s*free\b/i,
      /\bfree\s*from\s*[A-Za-z0-9가-힣-]{2,}/i,
    ],
  },
  banned_ingredient_reference: {
    terms: ["배합금지 원료", "금지 원료", "스테로이드", "벤조피렌"],
  },
  patent_reference: {
    terms: [
      "특허",
      "특허등록",
      "특허 등록",
      "특허받은",
      "특허 받은",
      "특허성분",
      "patent",
    ],
  },
  patent_effect_reference: {
    terms: [
      "지방축적 억제",
      "알러지",
      "알레르지",
      "아토피방지",
      "주름살 제거",
      "습진",
      "아토피성 피부염",
      "발모 조성물",
      "치료용 조성물",
    ],
  },
  named_active_ingredient: {
    terms: ["비오틴", "레티놀", "나이아신아마이드", "펩타이드", "세라마이드"],
  },
  benefit_change: {
    terms: ["개선", "완화", "도움", "감소", "강화", "재생", "회복", "성장"],
  },
  absolute_guarantee: {
    terms: ["100%", "즉시", "영구", "완벽", "확실히", "단번에", "보장"],
  },
  testimonial_format: {
    terms: ["후기", "리뷰", "전후", "before", "after", "체험", "사용자 만족도"],
  },
  ranking_superiority: {
    terms: ["1위", "최고", "유일", "베스트", "no.1"],
  },
  expert_endorsement: {
    terms: ["전문의 추천", "의사 추천", "약사 추천", "전문가 추천", "피부과 전문의 추천"],
  },
  authority_reference: {
    terms: ["식약처", "식품의약품안전처", "공식", "정부"],
  },
  certification_reference: {
    terms: ["인증", "허가", "승인", "공인"],
  },
  clinical_test_reference: {
    terms: ["인체적용시험", "시험 완료", "테스트 완료", "효과 입증", "시험검사기관"],
  },
  numeric_improvement: {
    regexes: [/\d+\s*%/, /\d+\s*배/, /\d+\s*주/],
  },
  comparison_reference: {
    terms: ["비교", "대비", "타제품", "자사제품"],
  },
  general_hype: {
    terms: ["혁신", "기적", "압도적", "드라마틱", "놀라운"],
  },
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function matchesSignalEntry(
  entry: SignalLexiconEntry,
  loweredText: string,
  rawText: string,
): boolean {
  const termMatched =
    entry.terms?.some((term) => loweredText.includes(term.toLowerCase())) ?? false;
  const regexMatched = entry.regexes?.some((regex) => regex.test(rawText)) ?? false;

  return termMatched || regexMatched;
}

function hasAllSignals(signalIds: ConceptSignalId[], required: ConceptSignalId[]): boolean {
  const available = new Set(signalIds);
  return required.every((signalId) => available.has(signalId));
}

export function detectConceptSignals(text: string): ConceptSignalId[] {
  const lowered = text.toLowerCase();
  const detected: ConceptSignalId[] = [];

  for (const [signalId, entry] of Object.entries(SIGNAL_LEXICON) as Array<
    [ConceptSignalId, SignalLexiconEntry]
  >) {
    if (matchesSignalEntry(entry, lowered, text)) {
      detected.push(signalId);
    }
  }

  const maskedNonhumanText = NONHUMAN_BIOLOGIC_ALLOW_REGEXES.reduce(
    (current, regex) => current.replace(regex, " "),
    lowered,
  );
  const restrictedBiologicDetected =
    matchesSignalEntry(
      SIGNAL_LEXICON.human_origin_reference,
      maskedNonhumanText,
      maskedNonhumanText,
    ) ||
    matchesSignalEntry(
      SIGNAL_LEXICON.stem_cell_marketing,
      maskedNonhumanText,
      maskedNonhumanText,
    ) ||
    matchesSignalEntry(
      SIGNAL_LEXICON.exosome_marketing,
      maskedNonhumanText,
      maskedNonhumanText,
    );

  if (restrictedBiologicDetected) {
    detected.push("restricted_human_derived_marketing");
  }

  return unique(detected);
}

export function collectSignalEvidence(
  text: string,
  signalIds: ConceptSignalId[],
): string[] {
  const lowered = text.toLowerCase();
  const evidence: string[] = [];

  for (const signalId of signalIds) {
    const entry = SIGNAL_LEXICON[signalId];

    for (const term of entry.terms ?? []) {
      if (lowered.includes(term.toLowerCase())) {
        evidence.push(term);
      }
    }

    for (const regex of entry.regexes ?? []) {
      const matches = text.match(regex) ?? [];
      evidence.push(...matches);
    }
  }

  return unique(evidence);
}

export function satisfiesSignalRequirement(
  availableSignals: Set<ConceptSignalId>,
  requirement: SignalRequirement,
): boolean {
  if (requirement.signalIds.length === 0) {
    return true;
  }

  if (requirement.mode === "all") {
    return requirement.signalIds.every((signalId) => availableSignals.has(signalId));
  }

  return requirement.signalIds.some((signalId) => availableSignals.has(signalId));
}

export function selectMatchedSignals(
  availableSignals: Set<ConceptSignalId>,
  requirements: SignalRequirement[],
): ConceptSignalId[] {
  return unique(
    requirements.flatMap((requirement) =>
      requirement.signalIds.filter((signalId) => availableSignals.has(signalId)),
    ),
  );
}

export function detectIssueTags(text: string): string[] {
  const signals = detectConceptSignals(text);
  const tags = new Set<string>();

  if (hasAllSignals(signals, ["medical_treatment"])) {
    tags.add("medical_claim");
  }

  if (signals.includes("medical_regeneration")) {
    tags.add("medical_claim");
  }

  if (
    signals.some((signal) =>
      [
        "functional_brightening",
        "functional_wrinkle",
        "functional_uv",
        "functional_hair_loss",
        "functional_acne",
      ].includes(signal),
    )
  ) {
    tags.add("functional_scope");
  }

  if (signals.includes("named_active_ingredient")) {
    tags.add("ingredient_transfer");
  }

  if (signals.includes("absolute_guarantee")) {
    tags.add("absolute_claim");
  }

  if (signals.includes("testimonial_format")) {
    tags.add("testimonial_claim");
  }

  if (signals.includes("ranking_superiority")) {
    tags.add("ranking_claim");
  }

  if (signals.includes("expert_endorsement")) {
    tags.add("expert_endorsement");
  }

  if (hasAllSignals(signals, ["authority_reference", "certification_reference"])) {
    tags.add("authority_certification");
  }

  if (hasAllSignals(signals, ["numeric_improvement", "clinical_test_reference"])) {
    tags.add("evidence_overlay");
  }

  if (hasAllSignals(signals, ["numeric_improvement", "comparison_reference"])) {
    tags.add("comparison_claim");
  }

  if (
    signals.includes("side_effect_denial") ||
    signals.includes("temporary_worsening_reference")
  ) {
    tags.add("side_effect_misleading");
  }

  if (signals.includes("procedure_like_reference")) {
    tags.add("procedure_like_claim");
  }

  if (signals.includes("skin_age_reference")) {
    tags.add("skin_age_claim");
  }

  if (signals.includes("natural_organic_marketing")) {
    tags.add("natural_organic_claim");
  }

  if (signals.includes("vegan_marketing")) {
    tags.add("vegan_claim");
  }

  if (signals.includes("iso_index_reference")) {
    tags.add("iso_index_claim");
  }

  if (signals.includes("restricted_human_derived_marketing")) {
    tags.add("human_derived_claim");
  }

  if (hasAllSignals(signals, ["ingredient_absence_pattern", "banned_ingredient_reference"])) {
    tags.add("banned_ingredient_free_claim");
  }

  if (signals.includes("ingredient_absence_pattern")) {
    tags.add("specific_ingredient_free_claim");
  }

  if (signals.includes("patent_reference")) {
    tags.add("patent_claim");
  }

  if (
    signals.includes("patent_reference") &&
    signals.some((signal) =>
      [
        "patent_effect_reference",
        "medical_treatment",
        "medical_regeneration",
        "functional_brightening",
        "functional_wrinkle",
        "functional_hair_loss",
        "functional_acne",
      ].includes(signal),
    )
  ) {
    tags.add("patent_overclaim");
  }

  if (signals.includes("general_hype")) {
    tags.add("general_misleading");
  }

  return [...tags];
}
