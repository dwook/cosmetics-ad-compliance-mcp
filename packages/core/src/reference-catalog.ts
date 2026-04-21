import type {
  ReferenceDocument,
  ReviewRequest,
  RuleDefinition,
} from "../../shared-types/src/index.js";
import {
  normalizeFunctionalCategories,
  normalizeProductKind,
} from "./product-qualification.js";

export const REFERENCE_CATALOG: ReferenceDocument[] = [
  {
    id: "cosmetics-act",
    title: "화장품법",
    path: "references/01_cosmetics_act.md",
    authority: "국가법령정보센터",
    sourceType: "law",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsId=002015",
    asOfDate: "2026-04-02",
    description: "화장품 광고 검수의 최상위 법률 source.",
    productCategories: ["cosmetics"],
    issueTags: ["all"],
    priority: 10,
  },
  {
    id: "enforcement-decree",
    title: "화장품법 시행령",
    path: "references/02_enforcement_decree.md",
    authority: "국가법령정보센터",
    sourceType: "decree",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=283963",
    asOfDate: "2026-03-10",
    description: "법률 위임사항과 행정 적용 맥락을 잇는 하위 source.",
    productCategories: ["cosmetics"],
    issueTags: ["all"],
    priority: 20,
  },
  {
    id: "enforcement-rule",
    title: "화장품법 시행규칙",
    path: "references/03_enforcement_rule.md",
    authority: "국가법령정보센터",
    sourceType: "rule",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
    asOfDate: "2025-08-01",
    description: "표시·광고 범위와 준수사항을 구체화하는 실무 핵심 source.",
    productCategories: ["cosmetics"],
    issueTags: ["all"],
    priority: 30,
  },
  {
    id: "mfds-guideline",
    title: "화장품 표시·광고 관리 지침",
    path: "references/04_mfds_guideline.md",
    authority: "식품의약품안전처",
    sourceType: "guideline",
    officialUrl:
      "https://mfds.go.kr/brd/m_1060/view.do?Data_stts_gubun=C9999&company_cd=&company_nm=&itm_seq_1=0&itm_seq_2=0&multi_itm_seq=0&page=1&seq=15700&srchFr=&srchTo=&srchTp=0&srchWord=%EC%8B%9D%ED%92%88%EC%B2%A8%EA%B0%80%EB%AC%BC",
    asOfDate: "2025-08-14",
    description: "금지표현 범위와 실증자료 판단을 보강하는 식약처 실무 지침.",
    productCategories: ["cosmetics"],
    issueTags: ["all"],
    priority: 40,
  },
  {
    id: "kcia-guide",
    title: "화장품 광고자문 기준 및 해설서",
    path: "references/05_kcia_guide.md",
    authority: "대한화장품협회",
    sourceType: "industry_guide",
    officialUrl:
      "https://kcia.or.kr/ad/cs/notice.php?no=17039&ss=page%3D2%26skind%3D%26sword%3D%26ob%3D&type=view",
    asOfDate: "2025-11-10",
    description: "광고자문 실무와 사례형 판단 기준을 담은 업계 해설서.",
    productCategories: ["cosmetics"],
    issueTags: ["all"],
    priority: 50,
  },
];

export const RULE_CATALOG: RuleDefinition[] = [
  {
    id: "cosmetics.medical_claim",
    code: "COSMETICS_MEDICAL_CLAIM",
    title: "의약품 오인 또는 치료 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "medicalization",
      familyLabel: "의약품 오인",
      ruleLabel: "치료·처방·재생 등 의약품 수준 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "의약품으로 잘못 인식할 우려가 있는 표시·광고를 금지하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 준수사항과 별표 5 연결 조문을 제공하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "식약처 실무 지침 차원에서 의약품 오인 표현 해석을 보강하는 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고 자문 실무 사례와 해설을 보강하는 업계 해설 source.",
      },
    ],
    issueTag: "medical_claim",
    decisionLayer: "prohibit",
    severity: "high",
    verdict: "BLOCK",
    description: "화장품 문안이 치료, 완치, 처방 수준의 효과를 직접 약속하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["medical_treatment", "medical_regeneration"],
        },
      ],
    },
    precedence: 90,
    suppresses: ["functional_scope", "functional_category_mismatch", "general_misleading"],
    requiredChecks: ["의약품 오인 표현 삭제 여부 확인"],
    suggestedFix: "효능 보장형 표현 대신 일반적인 사용 경험 또는 관리 중심 표현으로 완화합니다.",
  },
  {
    id: "cosmetics.functional_scope",
    code: "COSMETICS_FUNCTIONAL_SCOPE",
    title: "기능성 범위 초과 또는 입증 필요 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "functional_substantiation",
      familyLabel: "기능성·실증",
      ruleLabel: "기능성 범위 초과 또는 입증 필요 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "기능성화장품 오인 및 심사결과와 다른 광고를 금지하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 범위와 준수사항을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "기능성 범위와 입증자료 해석을 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 기능성 오인 사례를 정리한 해설 source.",
      },
    ],
    issueTag: "functional_scope",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "문안에서 기능성화장품 범주가 감지되지만 입력 제품 구분 또는 신고 범위와의 관계를 추가 cross-check해야 하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "claim",
      signalRequirements: [
        {
          mode: "any",
          signalIds: [
            "functional_brightening",
            "functional_wrinkle",
            "functional_uv",
            "functional_hair_loss",
            "functional_acne",
          ],
        },
      ],
      contextPredicates: ["functional_claim_requires_scope_review"],
    },
    allowWhen: [
      {
        id: "declared-functional-scope-match",
        title: "신고된 기능성 범위와 문안이 일치함",
        rationale: "입력한 기능성 범주와 문안에서 감지된 기능성 범주가 일치하면 즉시 warning으로 surface하지 않는다.",
        when: {
          contextPredicates: ["functional_claim_matches_declared_scope"],
        },
      },
    ],
    precedence: 80,
    suppresses: ["general_misleading"],
    requiredChecks: ["기능성 범주 해당 여부 및 근거자료 보유 여부 확인"],
    suggestedFix: "기능성 효능으로 읽힐 수 있는 표현은 범위를 좁히고 근거가 없으면 삭제합니다.",
  },
  {
    id: "cosmetics.functional_category_mismatch",
    code: "COSMETICS_FUNCTIONAL_CATEGORY_MISMATCH",
    title: "신고 범위와 다른 기능성 범주 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "functional_substantiation",
      familyLabel: "기능성·실증",
      ruleLabel: "신고 범위와 다른 기능성 범주 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "기능성화장품 오인 및 심사결과와 다른 광고를 금지하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 범위와 준수사항을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "기능성 범위와 입증자료 해석을 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 기능성 범주 mismatch 사례를 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "functional_category_mismatch",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "입력한 기능성 범주와 광고 문안에서 감지된 기능성 범주가 다른 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "claim",
      signalRequirements: [
        {
          mode: "any",
          signalIds: [
            "functional_brightening",
            "functional_wrinkle",
            "functional_uv",
            "functional_hair_loss",
            "functional_acne",
          ],
        },
      ],
      contextPredicates: ["functional_category_mismatch_detected"],
    },
    precedence: 88,
    suppresses: ["functional_scope", "general_misleading"],
    requiredChecks: ["기능성화장품 심사(보고) 결과통지서 또는 심사 제외 품목 보고서의 범위와 광고 표현이 일치하는지 확인"],
    suggestedFix: "신고 범위를 벗어난 기능성 범주 표현은 삭제하거나 실제 신고 범위에 맞는 표현으로 좁힙니다.",
  },
  {
    id: "cosmetics.ingredient_transfer",
    code: "COSMETICS_INGREDIENT_TRANSFER",
    title: "원료 효능의 제품 효능 전이",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "functional_substantiation",
      familyLabel: "기능성·실증",
      ruleLabel: "원료 효능의 제품 효능 전이",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인 우려가 있는 광고 금지와 실증 의무의 상위 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5 준수사항으로 원료 효능 전이형 표현을 구체적으로 다루는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "원료 설명과 제품 효능 주장 구분 기준을 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "성분 설명이 제품 효능으로 오인되는 사례를 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "ingredient_transfer",
    decisionLayer: "prohibit",
    severity: "high",
    verdict: "WARNING",
    description: "성분 고유 특성을 제품의 확정 효능처럼 전이하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "claim",
      signalRequirements: [
        {
          mode: "all",
          signalIds: ["named_active_ingredient", "benefit_change"],
        },
      ],
    },
    precedence: 95,
    suppresses: ["medical_claim", "general_misleading"],
    requiredChecks: ["성분 설명과 제품 효능 주장을 분리했는지 확인"],
    suggestedFix: "성분 설명은 일반 정보로 제한하고 제품 효능 확정 표현은 제거합니다.",
  },
  {
    id: "cosmetics.side_effect_misleading",
    code: "COSMETICS_SIDE_EFFECT_MISLEADING",
    title: "부작용 부인 또는 명현현상 주장 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "부작용 부인 또는 명현현상 주장 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인을 일으키는 안전성 관련 광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 소비자 오인 우려가 있는 금지표현을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "부작용 부인과 명현현상 표현을 금지표현 예시로 제시하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 부작용 부인과 명현현상 표현을 직접 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "side_effect_misleading",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "부작용이 전혀 없다고 단정하거나 명현현상처럼 치료 과정으로 오인될 수 있는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["side_effect_denial", "temporary_worsening_reference"],
        },
      ],
    },
    precedence: 79,
    suppresses: ["general_misleading"],
    requiredChecks: ["부작용 부인 또는 명현현상처럼 읽히는 표현을 삭제했는지 확인"],
    suggestedFix: "안전성 단정이나 명현현상 설명 대신 개인차가 있을 수 있다는 범위에서 사용감만 설명합니다.",
  },
  {
    id: "cosmetics.procedure_like_claim",
    code: "COSMETICS_PROCEDURE_LIKE_CLAIM",
    title: "시술 유사 사용방법 또는 도구 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "medicalization",
      familyLabel: "의약품 오인",
      ruleLabel: "시술 유사 사용방법 또는 도구 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "화장품 범위를 벗어나거나 의약품·시술로 오인될 우려가 있는 광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 사실과 다르거나 소비자가 오인할 수 있는 사용방법 표현을 금지하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "바늘·니들·MTS 등 시술 유사 표현을 금지 예시로 제시하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 의료시술 유사 사용방법 표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "procedure_like_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "바늘, 니들, 마이크로니들, MTS 등 의료시술과 유사한 사용방법으로 읽히는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["procedure_like_reference"],
        },
      ],
    },
    precedence: 78,
    suppresses: ["general_misleading"],
    requiredChecks: ["의료시술이나 침습적 사용방법으로 오인될 표현이 없는지 확인"],
    suggestedFix: "화장품의 일반적인 사용 범위를 벗어나는 도구·시술 표현은 삭제하고 사용감 설명으로 제한합니다.",
  },
  {
    id: "cosmetics.skin_age_claim",
    code: "COSMETICS_SKIN_AGE_CLAIM",
    title: "피부나이 감소 또는 어려짐 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "피부나이 감소 또는 어려짐 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "소비자가 사실과 다르게 이해할 우려가 있는 과장·오인 표현을 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 소비자가 사실로 오인할 수 있는 표현을 금지하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "피부나이 n세 감소 또는 어려짐 표현을 금지 예시로 제시하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 피부나이 표현을 금지하고 대체 표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "skin_age_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "피부나이가 몇 년 또는 몇 살 감소하거나 어려진다고 단정하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["skin_age_reference"],
        },
      ],
    },
    precedence: 77,
    suppresses: ["general_misleading"],
    requiredChecks: ["피부나이 n세 감소·어려짐 같은 표현을 삭제했는지 확인"],
    suggestedFix: "피부나이 표현 대신 피부 노화 지수 또는 일반적인 피부 컨디션 설명으로 바꿉니다.",
  },
  {
    id: "cosmetics.natural_organic_claim",
    code: "COSMETICS_NATURAL_ORGANIC_CLAIM",
    title: "천연·유기농 관련 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "천연·유기농 관련 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "소비자가 사실과 다르게 이해할 우려가 있는 환경·원료 관련 광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "소비자가 사실로 오인할 수 있는 표현과 실증 필요 광고를 연결하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "ISO 천연·유기농 지수 광고 시 고지 문구와 소비자 오인 방지 기준을 설명하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "천연·유기농 표시·광고 안내서 적합 여부와 증빙자료를 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "natural_organic_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "천연화장품 또는 유기농화장품으로 읽히는 표현은 관련 안내서 적합성과 증빙자료를 추가로 확인해야 한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["natural_organic_marketing"],
        },
      ],
    },
    precedence: 69,
    suppresses: ["general_misleading"],
    requiredChecks: [
      "「천연화장품 및 유기농화장품 표시ㆍ광고 안내서(대한화장품협회)」 적합 여부 확인",
      "천연·유기농 관련 증빙자료 또는 인증서 보유 여부 확인",
    ],
    suggestedFix: "천연·유기농 단정 표현 대신 원료 구성이나 제품 특성을 사실 범위에서만 설명합니다.",
  },
  {
    id: "cosmetics.vegan_claim",
    code: "COSMETICS_VEGAN_CLAIM",
    title: "비건 관련 표현",
    referenceIds: ["cosmetics-act", "enforcement-rule", "kcia-guide"],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "비건 관련 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "소비자가 사실과 다르게 이해할 우려가 있는 인증·표시 관련 광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "사실과 다르거나 소비자가 오인할 우려가 있는 표시·광고를 금지하는 시행규칙 근거.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "비건 표시·광고 안내서 적합 여부와 관련 인증서 확인 포인트를 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "vegan_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "비건으로 읽히는 표현은 관련 안내서 적합성과 인증서 또는 증빙자료를 확인해야 한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["vegan_marketing"],
        },
      ],
    },
    precedence: 69,
    suppresses: ["general_misleading"],
    requiredChecks: [
      "「화장품 비건(VEGAN) 표시ㆍ광고 안내서(대한화장품협회)」 적합 여부 확인",
      "비건 관련 인증서 또는 적합 자료와 유효기간 확인",
    ],
    suggestedFix: "비건 단정 표현 대신 원료 구성이나 제품 특성을 사실 범위에서만 설명합니다.",
  },
  {
    id: "cosmetics.iso_index_claim",
    code: "COSMETICS_ISO_INDEX_CLAIM",
    title: "ISO 천연·유기농 지수 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "ISO 천연·유기농 지수 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실 관련 광고는 실증할 수 있어야 하고 소비자 오인을 일으키지 않아야 한다는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "실증자료 판단과 소비자 오인 방지 기준을 연결하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "ISO 천연·유기농 지수 광고 시 필수 고지 문구와 소비자 오인 방지 방식을 설명하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "ISO 천연·유기농 지수 광고의 실증자료와 보조 설명 방식을 정리한 업계 해설 source.",
      },
    ],
    issueTag: "iso_index_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "ISO 16128 기반 천연·유기농 지수 표현은 관련 실증자료와 소비자 오인 방지 문구를 함께 확인해야 한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["iso_index_reference"],
        },
      ],
    },
    precedence: 71,
    suppresses: ["natural_organic_claim", "general_misleading"],
    requiredChecks: [
      "ISO 16128 계산 근거와 해당 완제품 관련 실증자료 보유 여부 확인",
      "소비자 오인 방지 문구 포함 여부 확인",
    ],
    suggestedFix: "ISO 지수 표현은 계산 기준과 오인 방지 문구를 함께 명시하고, 없으면 일반 원료 설명으로 좁힙니다.",
  },
  {
    id: "cosmetics.human_derived_claim",
    code: "COSMETICS_HUMAN_DERIVED_CLAIM",
    title: "인체 유래 성분 오인 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "줄기세포·엑소좀·인체 유래 성분 오인 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "인체 유래 성분이 포함된 것처럼 읽히는 표현은 사실과 다르거나 소비자를 오인시킬 우려가 있으므로 상위 법률 기준으로 제어된다.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지를 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "인체 세포·조직 배양액, 줄기세포, 엑소좀 표현을 금지 예시로 제시하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "줄기세포·엑소좀 표현의 금지 범위와 식물·우유 등 비인체 유래 예외를 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "human_derived_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description:
      "줄기세포, 엑소좀, 인체 세포·조직 배양액 등 인체 유래 성분이 포함된 것으로 오인될 수 있는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["restricted_human_derived_marketing"],
        },
        {
          mode: "any",
          signalIds: [
            "stem_cell_marketing",
            "exosome_marketing",
            "human_origin_reference",
          ],
        },
      ],
    },
    precedence: 73,
    suppresses: ["general_misleading"],
    requiredChecks: [
      "인체 유래 성분이 포함된 것으로 읽히는 표현이 없는지 확인",
      "식물·우유 등 비인체 유래 예외 표현인지, 실제 원료 출처가 명확히 드러나는지 확인",
    ],
    suggestedFix:
      "인체 유래로 오인될 표현 대신 실제 원료 출처와 제품 특성을 사실 범위에서만 설명합니다.",
  },
  {
    id: "cosmetics.banned_ingredient_free_claim",
    code: "COSMETICS_BANNED_INGREDIENT_FREE_CLAIM",
    title: "배합금지 원료 무첨가·free 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "배합금지 원료 무첨가·free 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "배합금지 원료를 사용하지 않았다는 표현은 소비자를 기만하거나 사실과 다르게 이해하게 할 우려가 있으므로 상위 법률 기준으로 제어된다.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지를 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "배합금지 원료 무첨가 표현을 금지 예시로 직접 제시하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "배합금지 원료 무첨가·free 표현은 소비자 기만에 해당한다고 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "banned_ingredient_free_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description:
      "배합금지 원료를 사용하지 않았다고 읽히는 무첨가·free 표현은 금지 예시에 해당한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "all",
          signalIds: ["ingredient_absence_pattern", "banned_ingredient_reference"],
        },
      ],
    },
    precedence: 74,
    suppresses: ["specific_ingredient_free_claim", "general_misleading"],
    requiredChecks: [
      "배합금지 원료를 사용하지 않았다고 읽히는 무첨가·free 표현이 없는지 확인",
      "배합금지 원료 예시를 차별 요소처럼 제시하지 않았는지 확인",
    ],
    suggestedFix:
      "배합금지 원료 무첨가·free 표현은 삭제하고, 제품 특성은 다른 사실 범위 설명으로 대체합니다.",
  },
  {
    id: "cosmetics.specific_ingredient_free_claim",
    code: "COSMETICS_SPECIFIC_INGREDIENT_FREE_CLAIM",
    title: "특정 성분 무첨가·free 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "특정 성분 무첨가·free 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "특정 성분이 들어 있지 않다는 사실 관련 광고는 실증할 수 있어야 한다는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "실증이 필요한 표시·광고와 자료 요건을 연결하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "특정 성분 무(無) 표현은 시험분석자료 등으로 입증해야 한다고 설명하는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "배합금지 원료 표현과 구분해, 특정 성분 absence claim은 실증자료 확인이 필요하다고 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "specific_ingredient_free_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description:
      "특정 성분이 들어 있지 않다는 무(無)·무첨가·free 표현은 시험분석자료 등 실증자료를 확인해야 한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["ingredient_absence_pattern"],
        },
      ],
    },
    precedence: 67,
    suppresses: ["general_misleading"],
    requiredChecks: [
      "특정 성분 무(無)·무첨가·free 표현의 시험분석자료 보유 여부 확인",
      "시험으로 입증이 어려운 특별한 사정이 있는 경우 제조관리기록서 또는 원료시험성적서 등 대체 자료 확인",
    ],
    suggestedFix:
      "무첨가·free 표현은 실증자료가 확인되는 범위에서만 제한적으로 사용하고, 없으면 일반 원료 설명으로 좁힙니다.",
  },
  {
    id: "cosmetics.patent_claim",
    code: "COSMETICS_PATENT_CLAIM",
    title: "특허 관련 표현",
    referenceIds: ["cosmetics-act", "enforcement-rule", "kcia-guide"],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "특허 관련 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "특허 관련 사실 표시·광고는 객관적 사실에 근거해 실증할 수 있어야 한다는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "실증이 필요한 표시·광고와 자료 요건을 연결하는 시행규칙 근거.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "특허 관련 표현은 객관적 사실에 근거해야 하며, 특허 등록 자료를 함께 확인해야 한다고 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "patent_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description:
      "특허 관련 표현은 객관적 사실과 특허 등록·명칭·범위가 광고 문구와 일치하는지 확인해야 한다.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["patent_reference"],
        },
      ],
    },
    precedence: 66,
    suppresses: ["general_misleading"],
    requiredChecks: [
      "특허 등록 여부와 특허 명칭·내용이 광고 문구와 일치하는지 확인",
      "제품 또는 원료(성분)의 제조방법·조성물과 특허의 관련성 확인",
    ],
    suggestedFix:
      "특허 표현은 객관적 사실과 등록 정보가 확인되는 범위에서만 제한적으로 설명합니다.",
  },
  {
    id: "cosmetics.patent_overclaim",
    code: "COSMETICS_PATENT_OVERCLAIM",
    title: "특허를 이용한 효능·치료 암시 표현",
    referenceIds: ["cosmetics-act", "enforcement-rule", "kcia-guide"],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "특허를 이용한 효능·치료 암시 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "특허 명칭이나 내용을 이용해 의약품 오인 또는 효능·효과 과장을 만드는 표현은 소비자를 오인시킬 우려가 있으므로 상위 법률 기준으로 제어된다.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지를 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "특허 내용이 사실이더라도 의약품 오인 또는 화장품 효능·효과를 벗어나는 인용은 할 수 없다고 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "patent_overclaim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description:
      "특허를 근거로 질병·치료·발모·주름 제거 등 화장품 효능 범위를 벗어난 내용을 암시하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["patent_reference"],
        },
        {
          mode: "any",
          signalIds: [
            "patent_effect_reference",
            "medical_treatment",
            "medical_regeneration",
            "functional_brightening",
            "functional_wrinkle",
            "functional_hair_loss",
            "functional_acne",
          ],
        },
      ],
    },
    precedence: 75,
    suppresses: ["patent_claim", "general_misleading"],
    requiredChecks: [
      "특허 명칭·내용을 이용해 질병·치료·발모·주름 제거 등 효능을 암시하지 않았는지 확인",
      "특허 사실을 광고하더라도 화장품의 효능·효과 범위를 벗어나지 않는지 확인",
    ],
    suggestedFix:
      "특허를 효능 보증처럼 쓰는 표현은 삭제하고, 객관적 등록 사실이 확인되는 범위의 설명만 남깁니다.",
  },
  {
    id: "cosmetics.authority_certification",
    code: "COSMETICS_AUTHORITY_CERTIFICATION",
    title: "허가·인증·공인 오인 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "허가·인증·공인 오인 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인을 일으키는 표시·광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 준수사항과 별표 5 관련 금지표현을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "식약처 허가·인증 오인 표현의 실무 해석을 보강하는 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 사례에서 허가·인증 표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "authority_certification",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "식약처 또는 공적 기관의 허가·인증·공인을 받은 제품처럼 읽히는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "all",
          signalIds: ["authority_reference", "certification_reference"],
        },
      ],
    },
    precedence: 76,
    suppresses: ["general_misleading"],
    requiredChecks: ["허가·인증·공인으로 읽히는 표현이 없는지 확인"],
    suggestedFix: "허가·인증·공인으로 읽히는 표현은 삭제하고, 기능성화장품은 심사·보고 여부만 정확히 설명합니다.",
  },
  {
    id: "cosmetics.absolute_claim",
    code: "COSMETICS_ABSOLUTE_CLAIM",
    title: "절대적 또는 보장형 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "comparative_superiority",
      familyLabel: "비교우위·보장",
      ruleLabel: "절대적 또는 보장형 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 오인 우려가 있는 절대 표현을 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 최고·최상 등 배타적 표현을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "절대·보장 표현의 해석과 완화 방향을 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 실무에서 절대 표현을 다루는 업계 해설 source.",
      },
    ],
    issueTag: "absolute_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "100%, 즉시, 영구 등 보장형 표현.",
    productCategories: ["all"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["absolute_guarantee"],
        },
      ],
    },
    precedence: 60,
    requiredChecks: ["절대 표현을 객관적 표현으로 대체했는지 확인"],
    suggestedFix: "절대적 표현을 완화하고, 조건이 있으면 함께 명시합니다.",
  },
  {
    id: "cosmetics.evidence_overlay",
    code: "COSMETICS_EVIDENCE_OVERLAY",
    title: "수치·시험 근거 제시형 실증 필요 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "functional_substantiation",
      familyLabel: "기능성·실증",
      ruleLabel: "수치·시험 근거 제시형 실증 필요 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "광고 중 사실 관련 사항에 대한 실증 책임을 두는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 준수사항과 실증자료 판단 근거를 잇는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "수치·시험 근거 제시형 광고 표현의 실증자료 요구를 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 사례에서 인체적용시험·수치표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "evidence_overlay",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "수치 개선 표현과 시험 근거 표현이 결합되어 추가 실증자료를 요구하는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "all",
          signalIds: ["numeric_improvement", "clinical_test_reference"],
        },
      ],
    },
    precedence: 74,
    suppresses: ["general_misleading"],
    requiredChecks: ["수치 표현과 인체적용시험 표현을 뒷받침하는 실증자료가 있는지 확인"],
    suggestedFix: "수치·시험 표현은 근거자료가 있을 때만 제한적으로 사용하고, 없으면 일반 사용감 설명으로 바꿉니다.",
  },
  {
    id: "cosmetics.testimonial_claim",
    code: "COSMETICS_TESTIMONIAL_CLAIM",
    title: "후기, 전후 비교, 사용자 체험형 표현",
    referenceIds: [
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "testimonial_endorsement",
      familyLabel: "후기·추천",
      ruleLabel: "후기, 전후 비교, 사용자 체험형 표현",
    },
    sourceBindings: [
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "후기·전후 표현의 허용 범위와 준수사항을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "실무 지침 차원에서 후기·체험담 사용 기준을 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 사례에서 체험형 표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "testimonial_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "후기, 리뷰, 전후 사진 등 오인을 유발할 수 있는 표현.",
    productCategories: ["all"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["testimonial_format"],
        },
      ],
    },
    precedence: 75,
    suppresses: ["general_misleading"],
    requiredChecks: ["후기/전후 표현 사용 근거 및 허용 범위 확인"],
    suggestedFix: "체험담 대신 일반적인 제품 설명으로 전환합니다.",
  },
  {
    id: "cosmetics.comparison_claim",
    code: "COSMETICS_COMPARISON_CLAIM",
    title: "비교·수치 우위 실증 필요 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "comparative_superiority",
      familyLabel: "비교우위·보장",
      ruleLabel: "비교·수치 우위 실증 필요 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인을 일으키는 비교우위 표현을 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "비교광고 및 실증자료 요구와 연결되는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "비교 대상과 기준을 밝히고 객관적으로 실증해야 한다는 식약처 지침 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "타제품 비교와 수치 우위 표현의 실무 기준을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "comparison_claim",
    decisionLayer: "evidence",
    severity: "medium",
    verdict: "WARNING",
    description: "비교 대상 또는 기준을 전제로 한 수치 우위 표현.",
    productCategories: ["all"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "all",
          signalIds: ["comparison_reference", "numeric_improvement"],
        },
      ],
    },
    precedence: 72,
    suppresses: ["general_misleading"],
    requiredChecks: ["비교 대상·기준 공개와 객관적 실증자료가 있는지 확인"],
    suggestedFix: "비교 대상과 기준을 밝힐 수 없으면 우위 수치 표현을 제거합니다.",
  },
  {
    id: "cosmetics.ranking_claim",
    code: "COSMETICS_RANKING_CLAIM",
    title: "비교 우위, 순위, 유일성 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "comparative_superiority",
      familyLabel: "비교우위·보장",
      ruleLabel: "비교 우위, 순위, 유일성 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인을 일으키는 비교우위 표현을 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 최고·최상 등 배타적 표현을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "비교광고·순위 표현의 기준 공개와 실증자료 요구를 보강하는 식약처 지침.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 사례에서 순위·유일성 표현을 해설하는 업계 source.",
      },
    ],
    issueTag: "ranking_claim",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "1위, 최고, 유일 등 비교/우위 표현.",
    productCategories: ["all"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["ranking_superiority"],
        },
      ],
    },
    precedence: 70,
    suppresses: ["general_misleading"],
    requiredChecks: ["비교 근거 자료와 기준 공개 여부 확인"],
    suggestedFix: "객관적 비교 근거가 없으면 순위/유일성 표현을 제거합니다.",
  },
  {
    id: "cosmetics.expert_endorsement",
    code: "COSMETICS_EXPERT_ENDORSEMENT",
    title: "전문가 지정·공인·추천 암시 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "testimonial_endorsement",
      familyLabel: "후기·추천",
      ruleLabel: "전문가 지정·공인·추천 암시 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 오인 우려가 있는 전문가 추천 암시를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "별표 5에서 전문가 지정·공인·추천 암시 광고를 구체적으로 금지하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "식약처 실무 지침에서 추천·보증 표현을 해석하는 보강 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고자문 사례에서 전문가 추천 암시 표현을 설명하는 업계 해설 source.",
      },
    ],
    issueTag: "expert_endorsement",
    decisionLayer: "prohibit",
    severity: "medium",
    verdict: "WARNING",
    description: "의사, 약사, 전문가 추천 또는 공인처럼 읽히는 표현.",
    productCategories: ["cosmetics"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["expert_endorsement"],
        },
      ],
    },
    precedence: 68,
    suppresses: ["authority_certification", "general_misleading"],
    requiredChecks: ["전문가 추천 또는 공인으로 읽힐 표현 삭제 여부 확인"],
    suggestedFix: "전문가 추천처럼 읽히는 표현은 삭제하고 객관 자료 중심 설명으로 바꿉니다.",
  },
  {
    id: "cosmetics.general_misleading",
    code: "COSMETICS_GENERAL_MISLEADING",
    title: "일반적 오인 우려 표현",
    referenceIds: [
      "cosmetics-act",
      "enforcement-decree",
      "enforcement-rule",
      "mfds-guideline",
      "kcia-guide",
    ],
    taxonomy: {
      family: "general_misleading",
      familyLabel: "일반 오인",
      ruleLabel: "일반적 오인 우려 표현",
    },
    sourceBindings: [
      {
        sourceId: "cosmetics-act",
        role: "statutory_basis",
        rationale: "사실과 다르거나 소비자 오인 우려가 있는 광고를 제어하는 상위 법률 근거.",
      },
      {
        sourceId: "enforcement-decree",
        role: "administrative_context",
        rationale: "행정 적용 맥락과 하위 규정 체계를 잇는 보조 행정 source.",
      },
      {
        sourceId: "enforcement-rule",
        role: "implementing_rule",
        rationale: "표시·광고 준수사항을 구체화하는 시행규칙 근거.",
      },
      {
        sourceId: "mfds-guideline",
        role: "agency_guidance",
        rationale: "일반적 과장·오인 우려 표현에 대한 식약처 실무 해석 source.",
      },
      {
        sourceId: "kcia-guide",
        role: "industry_interpretation",
        rationale: "광고 자문 실무에서 일반 오인 우려 사례를 설명하는 해설 source.",
      },
    ],
    issueTag: "general_misleading",
    decisionLayer: "evidence",
    severity: "low",
    verdict: "WARNING",
    description: "구체적 위반으로 특정되지 않았지만 과장 또는 오인 우려가 있는 표현.",
    productCategories: ["all"],
    activateWhen: {
      scope: "combined",
      signalRequirements: [
        {
          mode: "any",
          signalIds: ["general_hype"],
        },
      ],
    },
    precedence: 20,
    requiredChecks: ["표현을 구체적 사실 중심으로 정리했는지 확인"],
    suggestedFix: "추상적 과장 표현을 삭제하고 사실 기반 설명으로 치환합니다.",
  },
];

export function normalizeRequest(request: ReviewRequest): ReviewRequest {
  const functionalCategories = normalizeFunctionalCategories(
    request.functionalCategories,
  );

  return {
    ...request,
    productCategory: request.productCategory.trim().toLowerCase(),
    productKind: normalizeProductKind(request.productKind, functionalCategories),
    functionalCategories,
    productSubcategory: request.productSubcategory?.trim().toLowerCase(),
    audience: request.audience?.trim().toLowerCase(),
    adCopy: request.adCopy.trim(),
  };
}
