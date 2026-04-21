import type {
  CosmeticProductKind,
  FunctionalCosmeticCategoryCode,
  FunctionalCosmeticCategoryDefinition,
  ProductQualificationCategoryChecklist,
  ProductQualificationCheckItem,
  ProductQualificationCheckKind,
  ReviewProductProfile,
  ReviewRequest,
} from "../../shared-types/src/index.js";

const MFDS_FUNCTIONAL_SCOPE_LABEL =
  "화장품 표시·광고 관리 지침 □ 화장품법 제13조 제1항 제2호 관련";
const MFDS_SUBSTANTIATION_LABEL =
  "화장품 표시·광고 관리 지침 [별표 2] 화장품 표시․ 광고 주요 실증대상";
const KCIA_FUNCTIONAL_DOCUMENT_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 기능성화장품 여부 선택";
const KCIA_BRIGHTENING_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 피부에 멜라닌색소가 침착하는 것을 방지하여 기미·주근깨 등의 생성을 억제";
const KCIA_BRIGHTENING_DETAIL_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 기미, 주근깨 완화에 도움을 준다. 기미와 주근깨 같은 다크 스팟을 케어한다.";
const KCIA_WRINKLE_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 피부에 탄력을 주어 피부의 주름을 완화 또는 개선하는 기능을 가진다.";
const KCIA_WRINKLE_ANTIAGING_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 주름개선 기능성화장품으로 안티에이징 케어";
const KCIA_WRINKLE_COLLAGEN_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 콜라겐 증가, 감소 또는 활성화";
const KCIA_TANNING_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 강한 햇볕을 방지하여 피부를 곱게 태워주는 기능을 가진다.(자외선 차단이 아닌, 태닝제품도 자외선차단 기능성화장품임)";
const KCIA_UV_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 자외선을 차단 또는 산란시켜 자외선으로부터 피부를 보호하는 기능을 가진다.";
const KCIA_UV_WATERPROOF_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 물과 땀에 강하다, 워터프루프, 워터레지스턴스 자외선차단제";
const KCIA_UV_PHOTOAGING_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 자외선차단으로 인한 광노화에 도움을 주는 제품";
const KCIA_HAIR_COLOR_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 모발의 색상을 변화시킨다, 탈염(脫染)·탈색(脫色)의 기능을 가진다.";
const KCIA_HAIR_COLOR_TEMPORARY_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 헤어 틴트, 헤어 컬러스프레이 등 일시적으로 모발의 색상을 변화시키는 제품의";
const KCIA_HAIR_REMOVAL_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 체모를 제거한다.";
const KCIA_HAIR_LOSS_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 탈모 증상의 완화에 도움을 준다.";
const KCIA_HAIR_LOSS_FAST_LOSS_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 빠지는 모발을 감소시킨다.";
const KCIA_ACNE_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 여드름성 피부를 완화하는 데 도움을 준다.";
const KCIA_ACNE_SUITABILITY_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 여드름성 피부에 사용에 적합";
const KCIA_SKIN_BARRIER_SCOPE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 피부장벽의 기능을 회복하여 가려움 등의 개선에 도움을 준다, 피부장벽의 기능을 회복하여 가려움 등을 완화한다.";
const KCIA_SKIN_BARRIER_TEMP_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 보습을 통해 피부건조에 기인한 가려움의 일시적 완화에 도움";
const KCIA_SKIN_BARRIER_DAMAGE_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 피부장벽 손상의 개선에 도움";
const KCIA_STRETCH_MARK_REVIEW_LABEL =
  "화장품 광고자문 기준 및 해설서 - 튼살로 인한 붉은 선을 엷게 하는 데 도움을 주는 기능성화장품의 경우에는";
const KCIA_STRETCH_MARK_BOUNDARY_LABEL =
  "화장품 광고자문 기준 및 해설서 ∙ 튼살로 인한 붉은 선을 감소시키는 데 도움을 준다, 붉은 튼살을 완화한다.";

function createCheck(
  kind: ProductQualificationCheckKind,
  message: string,
  sourceLabels: string[],
): ProductQualificationCheckItem {
  return {
    kind,
    message,
    sourceLabels: [...new Set(sourceLabels)],
  };
}

function buildCommonFunctionalChecklist(
  lawLabel: string,
): ProductQualificationCheckItem[] {
  return [
    createCheck(
      "scope",
      `${lawLabel}의 기능 범위와 광고 문구가 일치하는지 확인합니다.`,
      [lawLabel, MFDS_FUNCTIONAL_SCOPE_LABEL],
    ),
    createCheck(
      "document",
      "기능성화장품 심사 결과통지서 또는 심사 제외 품목 보고서를 확인합니다.",
      [KCIA_FUNCTIONAL_DOCUMENT_LABEL],
    ),
    createCheck(
      "expression_boundary",
      "기능성화장품 심사(보고) 또는 보고 제외 범위를 벗어나거나 심사 결과와 다른 표현이 없는지 확인합니다.",
      [MFDS_FUNCTIONAL_SCOPE_LABEL, KCIA_FUNCTIONAL_DOCUMENT_LABEL],
    ),
  ];
}

function withChecklist(
  lawLabel: string,
  extraChecks: ProductQualificationCheckItem[],
): ProductQualificationCheckItem[] {
  return buildCommonFunctionalChecklist(lawLabel).concat(extraChecks);
}

export const FUNCTIONAL_COSMETIC_CATEGORY_CATALOG: FunctionalCosmeticCategoryDefinition[] = [
  {
    code: "brightening_prevention",
    label: "미백 도움(멜라닌 침착 방지)",
    lawLocator: "제2조제1호",
    lawLabel: "화장품법 시행규칙 제2조제1호",
    lawSummary:
      "피부에 멜라닌색소가 침착하는 것을 방지하여 기미·주근깨 등의 생성을 억제함으로써 피부의 미백에 도움을 주는 기능",
    signalPatterns: ["멜라닌 침착 방지", "기미 생성 억제", "주근깨 생성 억제"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제1호 범위에 해당하는지 cross-check합니다.",
      "미백 도움 표현이 심사(보고) 또는 보고 제외 범위와 일치하는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제1호", [
      createCheck(
        "evidence",
        "기미·주근깨 생성 억제 또는 미백 도움 표현이 미백 기능성화장품 심사(보고) 자료와 연결되는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_BRIGHTENING_SCOPE_LABEL,
          KCIA_BRIGHTENING_DETAIL_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "기미·주근깨 범위를 넘어 검버섯 완화 등 병변 표현으로 확장되지 않는지 확인합니다.",
        [KCIA_BRIGHTENING_DETAIL_LABEL],
      ),
    ]),
  },
  {
    code: "brightening_lightening",
    label: "미백 도움(침착 멜라닌 엷게 함)",
    lawLocator: "제2조제2호",
    lawLabel: "화장품법 시행규칙 제2조제2호",
    lawSummary:
      "피부에 침착된 멜라닌색소의 색을 엷게 하여 피부의 미백에 도움을 주는 기능",
    signalPatterns: [
      "미백",
      "화이트닝",
      "브라이트닝",
      "기미",
      "주근깨",
      "기미 완화",
      "주근깨 완화",
      "색을 엷게",
    ],
    requiredChecks: [
      "화장품법 시행규칙 제2조제2호 범위에 해당하는지 cross-check합니다.",
      "침착 멜라닌 완화형 미백 표현이 심사(보고) 범위를 벗어나지 않는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제2호", [
      createCheck(
        "evidence",
        "기미·주근깨 완화, 다크 스팟 케어, 화이트닝 표현이 미백 기능성화장품 심사(보고) 자료와 연결되는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_BRIGHTENING_DETAIL_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "기미·주근깨 범위를 넘어 검버섯 완화 등 병변 표현으로 확장되지 않는지 확인합니다.",
        [KCIA_BRIGHTENING_DETAIL_LABEL],
      ),
    ]),
  },
  {
    code: "wrinkle_improvement",
    label: "주름 완화·개선",
    lawLocator: "제2조제3호",
    lawLabel: "화장품법 시행규칙 제2조제3호",
    lawSummary: "피부에 탄력을 주어 피부의 주름을 완화 또는 개선하는 기능",
    signalPatterns: ["주름 개선", "주름개선", "주름 완화", "링클", "탄력"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제3호 범위에 해당하는지 cross-check합니다.",
      "주름·탄력 표현이 심사(보고) 결과통지서 문구와 일치하는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제3호", [
      createCheck(
        "evidence",
        "안티에이징, 피부노화 완화, 콜라겐 관련 표현은 인체적용시험·인체외시험 또는 기능성 심사(보고) 자료로 입증되는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_WRINKLE_SCOPE_LABEL,
          KCIA_WRINKLE_ANTIAGING_LABEL,
          KCIA_WRINKLE_COLLAGEN_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "피부노화지수는 n(세) 같은 기간 단위로 표기하지 않는지 확인합니다.",
        [MFDS_SUBSTANTIATION_LABEL],
      ),
    ]),
  },
  {
    code: "tanning",
    label: "피부를 곱게 태워줌",
    lawLocator: "제2조제4호",
    lawLabel: "화장품법 시행규칙 제2조제4호",
    lawSummary: "강한 햇볕을 방지하여 피부를 곱게 태워주는 기능",
    signalPatterns: ["태닝", "곱게 태워", "선탠"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제4호 범위에 해당하는지 cross-check합니다.",
      "태닝 표현이 자외선 차단 표현과 혼동되지 않도록 심사(보고) 범위를 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제4호", [
      createCheck(
        "scope",
        "태닝 제품도 자외선차단 기능성화장품 범주에서 심사(보고)되는지 확인합니다.",
        [KCIA_TANNING_SCOPE_LABEL],
      ),
      createCheck(
        "expression_boundary",
        "강한 햇볕을 방지하여 피부를 곱게 태워주는 범위를 넘어 시술·영구 변화 표현으로 읽히지 않는지 확인합니다.",
        [KCIA_TANNING_SCOPE_LABEL],
      ),
    ]),
  },
  {
    code: "uv_protection",
    label: "자외선 차단·산란",
    lawLocator: "제2조제5호",
    lawLabel: "화장품법 시행규칙 제2조제5호",
    lawSummary: "자외선을 차단 또는 산란시켜 자외선으로부터 피부를 보호하는 기능",
    signalPatterns: ["자외선 차단", "uv 차단", "spf", "pa+", "자외선으로부터 피부를 보호"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제5호 범위에 해당하는지 cross-check합니다.",
      "SPF/PA 등 자외선 차단 지표 표현이 실제 심사(보고) 결과와 일치하는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제5호", [
      createCheck(
        "evidence",
        "SPF·PA·UVA·UVB·워터프루프·광노화 관련 표현은 심사(보고) 자료 또는 실증자료로 입증되는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_UV_SCOPE_LABEL,
          KCIA_UV_WATERPROOF_LABEL,
          KCIA_UV_PHOTOAGING_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "피부노화지수는 n(세) 같은 기간 단위로 표기하지 않는지 확인합니다.",
        [MFDS_SUBSTANTIATION_LABEL],
      ),
    ]),
  },
  {
    code: "hair_color_change",
    label: "모발 색상 변화",
    lawLocator: "제2조제6호",
    lawLabel: "화장품법 시행규칙 제2조제6호",
    lawSummary: "모발의 색상을 변화시키는 기능. 다만, 일시적 변화 제품은 제외",
    signalPatterns: ["염색", "탈염", "탈색", "모발 색상 변화"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제6호 범위에 해당하는지 cross-check합니다.",
      "일시적 착색 제품인지, 기능성화장품 범위인지 구분하여 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제6호", [
      createCheck(
        "scope",
        "염모·탈염·탈색 표현이 기능성화장품 심사(보고) 범위와 일치하는지 확인합니다.",
        [KCIA_HAIR_COLOR_SCOPE_LABEL],
      ),
      createCheck(
        "expression_boundary",
        "일시적으로 모발의 색상을 변화시키는 제품은 일반화장품 표현 가능 범주와 구분되는지 확인합니다.",
        [
          "화장품법 시행규칙 제2조제6호",
          KCIA_HAIR_COLOR_TEMPORARY_LABEL,
        ],
      ),
    ]),
  },
  {
    code: "hair_removal",
    label: "체모 제거",
    lawLocator: "제2조제7호",
    lawLabel: "화장품법 시행규칙 제2조제7호",
    lawSummary: "체모를 제거하는 기능. 다만, 물리적으로 체모를 제거하는 제품은 제외",
    signalPatterns: ["제모", "체모 제거", "hair removal"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제7호 범위에 해당하는지 cross-check합니다.",
      "물리적 제거 제품이 아닌지, 기능성 범주 해당 여부를 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제7호", [
      createCheck(
        "scope",
        "물리적으로 체모를 제거하는 제품이 아닌지 먼저 구분합니다.",
        ["화장품법 시행규칙 제2조제7호"],
      ),
      createCheck(
        "expression_boundary",
        "체모의 영구 제거 또는 영구적 성장 억제처럼 기능성 범위를 넘어서는 표현이 없는지 확인합니다.",
        [KCIA_HAIR_REMOVAL_LABEL],
      ),
    ]),
  },
  {
    code: "hair_loss_relief",
    label: "탈모 증상 완화 도움",
    lawLocator: "제2조제8호",
    lawLabel: "화장품법 시행규칙 제2조제8호",
    lawSummary:
      "탈모 증상의 완화에 도움을 주는 기능. 다만, 코팅 등 물리적으로 굵게 보이게 하는 제품은 제외",
    signalPatterns: ["탈모", "탈모 증상 완화", "빠지는 모발", "빠지는 모발 감소", "탈모 완화"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제8호 범위에 해당하는지 cross-check합니다.",
      "물리적 코팅 효과인지, 탈모 증상 완화 기능성 범주인지 구분하여 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제8호", [
      createCheck(
        "evidence",
        "빠지는 모발 감소 표현은 탈모 심사자료에 근거가 포함되거나 별도 실증자료가 있는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_HAIR_LOSS_FAST_LOSS_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "탈모 치료·예방·발모·육모·양모 표현으로 확장되지 않는지 확인합니다.",
        [KCIA_HAIR_LOSS_FAST_LOSS_LABEL, KCIA_HAIR_LOSS_SCOPE_LABEL],
      ),
    ]),
  },
  {
    code: "acne_relief",
    label: "여드름성 피부 완화 도움",
    lawLocator: "제2조제9호",
    lawLabel: "화장품법 시행규칙 제2조제9호",
    lawSummary: "여드름성 피부를 완화하는 데 도움을 주는 기능. 다만, 인체세정용 제품류로 한정",
    signalPatterns: ["여드름성 피부", "여드름성 피부에 사용에 적합", "여드름성 피부 완화", "여드름 완화", "acne"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제9호 범위에 해당하는지 cross-check합니다.",
      "인체세정용 제품류인지와 심사(보고) 범위를 함께 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제9호", [
      createCheck(
        "scope",
        "인체세정용 제품류로 한정되는 범주인지 확인합니다.",
        ["화장품법 시행규칙 제2조제9호"],
      ),
      createCheck(
        "evidence",
        "여드름성 피부 사용 적합 또는 관련 효능 표현은 논코메도제닉 테스트 등 인체적용시험자료가 있는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_ACNE_SCOPE_LABEL,
          KCIA_ACNE_SUITABILITY_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "여드름 치료·예방·여드름균 사멸 표현으로 확장되지 않는지 확인합니다.",
        [KCIA_ACNE_SCOPE_LABEL],
      ),
    ]),
  },
  {
    code: "skin_barrier_relief",
    label: "피부장벽 기능 회복으로 가려움 개선 도움",
    lawLocator: "제2조제10호",
    lawLabel: "화장품법 시행규칙 제2조제10호",
    lawSummary:
      "피부장벽의 기능을 회복하여 가려움 등의 개선에 도움을 주는 기능",
    signalPatterns: ["피부장벽", "가려움 개선", "가려움 완화", "피부장벽 회복"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제10호 범위에 해당하는지 cross-check합니다.",
      "가려움 개선 표현이 피부장벽 기능 회복 도움 범위를 넘어 질환 치료 표현으로 번지지 않는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제10호", [
      createCheck(
        "evidence",
        "피부장벽 손상 개선 또는 가려움 개선 표현은 심사자료나 인체적용시험자료로 뒷받침되는지 확인합니다.",
        [
          MFDS_SUBSTANTIATION_LABEL,
          KCIA_SKIN_BARRIER_SCOPE_LABEL,
          KCIA_SKIN_BARRIER_DAMAGE_LABEL,
        ],
      ),
      createCheck(
        "expression_boundary",
        "아토피·질환 치료·예방 표현으로 번지지 않고, 보습을 통한 일시적 완화 표현과 구분되는지 확인합니다.",
        [KCIA_SKIN_BARRIER_SCOPE_LABEL, KCIA_SKIN_BARRIER_TEMP_LABEL],
      ),
    ]),
  },
  {
    code: "stretch_mark_redness_relief",
    label: "튼살 붉은 선 완화 도움",
    lawLocator: "제2조제11호",
    lawLabel: "화장품법 시행규칙 제2조제11호",
    lawSummary: "튼살로 인한 붉은 선을 엷게 하는 데 도움을 주는 기능",
    signalPatterns: ["튼살", "붉은 선 완화", "stretch mark"],
    requiredChecks: [
      "화장품법 시행규칙 제2조제11호 범위에 해당하는지 cross-check합니다.",
      "튼살 관련 표현이 흉터 치료 표현으로 확대되지 않는지 확인합니다.",
    ],
    reviewChecklist: withChecklist("화장품법 시행규칙 제2조제11호", [
      createCheck(
        "document",
        "안전성·유효성 등 관련 자료를 제출하여 기능성화장품 심사를 받은 범주인지 확인합니다.",
        [KCIA_STRETCH_MARK_REVIEW_LABEL],
      ),
      createCheck(
        "expression_boundary",
        "붉은 선 완화 범위를 넘어 튼살 제거·흉터 제거·방지 표현으로 확장되지 않는지 확인합니다.",
        [KCIA_STRETCH_MARK_BOUNDARY_LABEL],
      ),
    ]),
  },
];

const CATEGORY_BY_CODE = new Map(
  FUNCTIONAL_COSMETIC_CATEGORY_CATALOG.map((category) => [category.code, category]),
);

const CATEGORY_ALIASES = new Map<string, FunctionalCosmeticCategoryCode>(
  ([
    ["brightening_prevention", "brightening_prevention"],
    ["멜라닌 침착 방지", "brightening_prevention"],
    ["미백 도움(멜라닌 침착 방지)", "brightening_prevention"],
    ["brightening_lightening", "brightening_lightening"],
    ["미백", "brightening_lightening"],
    ["미백 도움(침착 멜라닌 엷게 함)", "brightening_lightening"],
    ["wrinkle_improvement", "wrinkle_improvement"],
    ["주름개선", "wrinkle_improvement"],
    ["주름 개선", "wrinkle_improvement"],
    ["tanning", "tanning"],
    ["태닝", "tanning"],
    ["uv_protection", "uv_protection"],
    ["자외선차단", "uv_protection"],
    ["자외선 차단", "uv_protection"],
    ["hair_color_change", "hair_color_change"],
    ["모발 색상 변화", "hair_color_change"],
    ["염색", "hair_color_change"],
    ["hair_removal", "hair_removal"],
    ["제모", "hair_removal"],
    ["체모 제거", "hair_removal"],
    ["hair_loss_relief", "hair_loss_relief"],
    ["탈모 증상 완화", "hair_loss_relief"],
    ["acne_relief", "acne_relief"],
    ["여드름성 피부 완화", "acne_relief"],
    ["여드름 완화", "acne_relief"],
    ["skin_barrier_relief", "skin_barrier_relief"],
    ["피부장벽", "skin_barrier_relief"],
    ["피부장벽 기능 회복", "skin_barrier_relief"],
    ["stretch_mark_redness_relief", "stretch_mark_redness_relief"],
    ["튼살", "stretch_mark_redness_relief"],
    ["튼살 붉은 선 완화", "stretch_mark_redness_relief"],
  ] as Array<[string, FunctionalCosmeticCategoryCode]>).map(([alias, code]) => [
    alias.toLowerCase(),
    code,
  ]),
);

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function cloneChecklist(
  checklist: ProductQualificationCheckItem[],
): ProductQualificationCheckItem[] {
  return checklist.map((item) => ({
    kind: item.kind,
    message: item.message,
    sourceLabels: [...item.sourceLabels],
  }));
}

export function normalizeProductKind(
  productKind?: string,
  functionalCategories?: FunctionalCosmeticCategoryCode[],
): CosmeticProductKind {
  if (!productKind || productKind.trim().length === 0) {
    return functionalCategories && functionalCategories.length > 0
      ? "functional"
      : "unknown";
  }

  const normalized = productKind.trim().toLowerCase();

  if (["general", "일반", "일반화장품"].includes(normalized)) {
    return "general";
  }

  if (["functional", "기능성", "기능성화장품"].includes(normalized)) {
    return "functional";
  }

  return "unknown";
}

export function normalizeFunctionalCategories(
  functionalCategories?: string[],
): FunctionalCosmeticCategoryCode[] {
  if (!functionalCategories || functionalCategories.length === 0) {
    return [];
  }

  return unique(
    functionalCategories
      .map((category) => CATEGORY_ALIASES.get(category.trim().toLowerCase()) ?? null)
      .filter(
        (category): category is FunctionalCosmeticCategoryCode => category !== null,
      ),
  );
}

export function inferFunctionalCategoriesFromText(
  text: string,
): FunctionalCosmeticCategoryCode[] {
  const lowered = text.toLowerCase();

  return FUNCTIONAL_COSMETIC_CATEGORY_CATALOG.filter((category) =>
    category.signalPatterns.some((pattern) => lowered.includes(pattern.toLowerCase())),
  ).map((category) => category.code);
}

function categoryLabels(
  categories: FunctionalCosmeticCategoryCode[],
): string[] {
  return categories.map((category) => CATEGORY_BY_CODE.get(category)?.label ?? category);
}

function categoryLawBasis(
  categories: FunctionalCosmeticCategoryCode[],
): string[] {
  return categories.map(
    (category) => CATEGORY_BY_CODE.get(category)?.lawLabel ?? category,
  );
}

function buildCategoryChecklist(
  category: FunctionalCosmeticCategoryCode,
  declaredFunctionalCategories: FunctionalCosmeticCategoryCode[],
  inferredFunctionalCategories: FunctionalCosmeticCategoryCode[],
): ProductQualificationCategoryChecklist | null {
  const definition = CATEGORY_BY_CODE.get(category);

  if (!definition) {
    return null;
  }

  return {
    categoryCode: definition.code,
    categoryLabel: definition.label,
    lawLabel: definition.lawLabel,
    lawSummary: definition.lawSummary,
    declaredInInput: declaredFunctionalCategories.includes(category),
    inferredFromCopy: inferredFunctionalCategories.includes(category),
    checks: cloneChecklist(definition.reviewChecklist),
  };
}

export function buildReviewProductProfile(
  request: ReviewRequest,
): ReviewProductProfile {
  const declaredFunctionalCategories = normalizeFunctionalCategories(
    request.functionalCategories,
  );
  const declaredProductKind = normalizeProductKind(
    request.productKind,
    declaredFunctionalCategories,
  );
  const inferredFunctionalCategories = inferFunctionalCategoriesFromText(request.adCopy);
  const additionalChecks: string[] = [];
  const mismatchNotes: string[] = [];

  if (declaredProductKind === "functional" && declaredFunctionalCategories.length === 0) {
    additionalChecks.push(
      "기능성화장품으로 입력되었으므로 화장품법 시행규칙 제2조 각 호 중 해당 기능성 범주를 먼저 특정해 cross-check해야 합니다.",
    );
  }

  for (const category of declaredFunctionalCategories) {
    const definition = CATEGORY_BY_CODE.get(category);

    if (!definition) {
      continue;
    }

    additionalChecks.push(...definition.requiredChecks);
  }

  if (declaredProductKind === "general" && inferredFunctionalCategories.length > 0) {
    mismatchNotes.push(
      "일반화장품으로 입력되었지만 문안에서 기능성화장품 범주 표현이 감지되었습니다.",
    );
    additionalChecks.push(
      "일반화장품인지, 기능성화장품인지 및 화장품법 시행규칙 제2조 해당 호와의 관계를 cross-check해야 합니다.",
    );
  }

  if (declaredProductKind === "functional" && inferredFunctionalCategories.length > 0) {
    const undeclaredCategories = inferredFunctionalCategories.filter(
      (category) => !declaredFunctionalCategories.includes(category),
    );

    if (undeclaredCategories.length > 0) {
      mismatchNotes.push(
        `문안에서 감지된 기능성 범주(${categoryLabels(undeclaredCategories).join(", ")})가 입력한 기능성 범주와 다릅니다.`,
      );
      additionalChecks.push(
        "기능성화장품 심사(보고) 결과통지서 또는 심사 제외 품목 보고서의 범위와 광고 표현이 일치하는지 cross-check해야 합니다.",
      );
    }
  }

  if (declaredProductKind === "unknown" && inferredFunctionalCategories.length > 0) {
    additionalChecks.push(
      "문안상 기능성화장품 범주 표현이 감지되므로 일반화장품인지 기능성화장품인지부터 법령 기준으로 cross-check해야 합니다.",
    );
  }

  const categoryChecklists = unique(
    declaredFunctionalCategories.concat(inferredFunctionalCategories),
  )
    .map((category) =>
      buildCategoryChecklist(
        category,
        declaredFunctionalCategories,
        inferredFunctionalCategories,
      ),
    )
    .filter(
      (checklist): checklist is ProductQualificationCategoryChecklist =>
        checklist !== null,
    );

  return {
    declaredProductKind,
    declaredFunctionalCategories,
    declaredFunctionalCategoryLabels: categoryLabels(declaredFunctionalCategories),
    inferredFunctionalCategories,
    inferredFunctionalCategoryLabels: categoryLabels(inferredFunctionalCategories),
    lawBasis: unique(
      categoryLawBasis(
        declaredFunctionalCategories.length > 0
          ? declaredFunctionalCategories
          : inferredFunctionalCategories,
      ),
    ),
    additionalChecks: unique(additionalChecks),
    mismatchNotes: unique(mismatchNotes),
    categoryChecklists,
  };
}
