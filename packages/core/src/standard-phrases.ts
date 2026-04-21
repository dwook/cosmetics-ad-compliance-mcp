export const STANDARD_PHRASES = {
  disclaimer:
    "이 결과는 5개 근거 문서를 기준으로 한 seed review이며 최종 법률 자문을 대체하지 않습니다.",
  passSummary: "현재 seed rules 기준 즉시 수정이 필요한 금지표현은 감지되지 않았습니다.",
  unclearSummary: "근거 수준이나 해석 폭이 충분히 고정되지 않아 추가 검토가 필요합니다.",
  sourcePackNote:
    "본 검토는 화장품법, 시행령, 시행규칙, 식약처 지침, 대한화장품협회 해설서를 기준으로 수행합니다.",
  rewriteFallbacks: {
    medical_claim:
      "피부 컨디션 케어에 도움을 줄 수 있는 화장품 사용감 중심으로 설명합니다.",
    functional_scope:
      "기능성 범위를 단정하지 않고 제품 사용감과 관리 범위 중심으로 설명합니다.",
    ingredient_transfer:
      "성분 설명은 유지하되 제품 효능을 단정하지 않는 사용감 중심 표현으로 정리합니다.",
    absolute_claim:
      "보장형 표현 대신 사용감과 제형처럼 확인 가능한 사실 중심으로 설명합니다.",
    testimonial_claim:
      "후기나 전후 비교 표현 대신 일반적인 제품 특성과 사용감 중심으로 설명합니다.",
    ranking_claim:
      "순위나 유일성 표현 대신 제품 특성과 사용감 중심으로 설명합니다.",
    expert_endorsement:
      "전문가 추천처럼 읽히는 표현 대신 제품 특성과 사용감 중심으로 설명합니다.",
    general_misleading:
      "과장 표현 대신 제형, 사용감, 보습감 등 확인 가능한 사실 중심으로 설명합니다.",
  },
} as const;
