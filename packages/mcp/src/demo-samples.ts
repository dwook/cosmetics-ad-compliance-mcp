import type { ReviewRequest } from "../../shared-types/src/index.js";

interface DemoSampleDefinition {
  sampleNumber: number;
  sampleId: string;
  sourceCaseId: string;
  title: string;
  request: ReviewRequest;
}

function buildRequest(params: {
  sampleId: string;
  sourceCaseId: string;
  title: string;
  adCopy: string;
  productKind: ReviewRequest["productKind"];
  functionalCategories?: ReviewRequest["functionalCategories"];
}): ReviewRequest {
  return {
    requestId: params.sampleId,
    productCategory: "cosmetics",
    productKind: params.productKind,
    functionalCategories: params.functionalCategories,
    adCopy: params.adCopy,
    metadata: {
      demoSampleId: params.sampleId,
      demoSourceCaseId: params.sourceCaseId,
      demoTitle: params.title,
      demoSourceRepo: "ad-guard-v3",
    },
  };
}

export const DEMO_SAMPLE_CASES: DemoSampleDefinition[] = [
  {
    sampleNumber: 1,
    sampleId: "TC-001",
    sourceCaseId: "ingredient-paper-bypass-01",
    title: "원료 + 논문 + 효능 연결 우회",
    request: buildRequest({
      sampleId: "TC-001",
      sourceCaseId: "ingredient-paper-bypass-01",
      title: "원료 + 논문 + 효능 연결 우회",
      productKind: "functional",
      functionalCategories: ["hair_loss_relief"],
      adCopy:
        "매일 빠지는 모발이 신경 쓰인다면, 비오틴 5000mcg 고함량 포뮬러로 두피와 모발에 힘을 더해보세요. 비오틴은 모발 성장에 필수적인 영양소로 알려져 있습니다 (출처: Journal of Dermatology 2019). 탈모 증상 완화에 도움을 주는 기능성화장품.",
    }),
  },
  {
    sampleNumber: 2,
    sampleId: "TC-002",
    sourceCaseId: "authority-cert-01",
    title: "식약처 인증 오인",
    request: buildRequest({
      sampleId: "TC-002",
      sourceCaseId: "authority-cert-01",
      title: "식약처 인증 오인",
      productKind: "functional",
      functionalCategories: ["hair_loss_relief"],
      adCopy:
        "식약처 인증을 내세운 프리미엄 탈모 샴푸, 공식 허가를 받은 전문 탈모 개선 포뮬러로 매일의 두피 케어를 완성하세요.",
    }),
  },
  {
    sampleNumber: 3,
    sampleId: "TC-003",
    sourceCaseId: "general-whitening-01",
    title: "일반화장품의 미백 표방",
    request: buildRequest({
      sampleId: "TC-003",
      sourceCaseId: "general-whitening-01",
      title: "일반화장품의 미백 표방",
      productKind: "general",
      adCopy:
        "칙칙한 피부 톤이 고민이라면, 기미와 주근깨를 흐리게 해주는 브라이트닝 세럼으로 맑은 인상을 완성하세요.",
    }),
  },
  {
    sampleNumber: 4,
    sampleId: "TC-004",
    sourceCaseId: "medical-effect-01",
    title: "상처 치유와 재생",
    request: buildRequest({
      sampleId: "TC-004",
      sourceCaseId: "medical-effect-01",
      title: "상처 치유와 재생",
      productKind: "general",
      adCopy:
        "예민해진 피부를 편안하게 감싸주고, 상처 치유와 피부 재생에 도움을 주는 집중 케어 크림.",
    }),
  },
  {
    sampleNumber: 5,
    sampleId: "TC-005",
    sourceCaseId: "evidence-overlay-01",
    title: "수치와 인체적용시험",
    request: buildRequest({
      sampleId: "TC-005",
      sourceCaseId: "evidence-overlay-01",
      title: "수치와 인체적용시험",
      productKind: "general",
      adCopy:
        "단 2주 만에 수분감 30% 개선. 인체적용시험 완료로 확인된 촉촉한 광채를 경험해보세요.",
    }),
  },
  {
    sampleNumber: 6,
    sampleId: "TC-006",
    sourceCaseId: "comparison-01",
    title: "타제품 대비 5배",
    request: buildRequest({
      sampleId: "TC-006",
      sourceCaseId: "comparison-01",
      title: "타제품 대비 5배",
      productKind: "general",
      adCopy:
        "자사제품 대비 지속력 5배 업그레이드. 타제품 비교 테스트까지 완료한 롱래스팅 포뮬러.",
    }),
  },
  {
    sampleNumber: 7,
    sampleId: "TC-007",
    sourceCaseId: "doctor-endorsement-01",
    title: "피부과 전문의 추천",
    request: buildRequest({
      sampleId: "TC-007",
      sourceCaseId: "doctor-endorsement-01",
      title: "피부과 전문의 추천",
      productKind: "general",
      adCopy:
        "피부과 전문의 추천으로 완성된 공식 인증 더마 세럼으로 민감한 피부도 자신 있게 케어하세요.",
    }),
  },
  {
    sampleNumber: 8,
    sampleId: "TC-008",
    sourceCaseId: "acne-general-01",
    title: "일반화장품의 여드름성 피부 표방",
    request: buildRequest({
      sampleId: "TC-008",
      sourceCaseId: "acne-general-01",
      title: "일반화장품의 여드름성 피부 표방",
      productKind: "general",
      adCopy:
        "번들거림과 트러블이 고민인 피부를 위해, 여드름성 피부에 사용에 적합한 진정 토너.",
    }),
  },
  {
    sampleNumber: 9,
    sampleId: "TC-009",
    sourceCaseId: "functional-allowed-01",
    title: "선택한 기능성 범위 안의 보수적 카피",
    request: buildRequest({
      sampleId: "TC-009",
      sourceCaseId: "functional-allowed-01",
      title: "선택한 기능성 범위 안의 보수적 카피",
      productKind: "functional",
      functionalCategories: ["wrinkle_improvement"],
      adCopy:
        "매일의 탄력 루틴을 더 탄탄하게. 주름개선 기능성화장품으로 피부를 탄탄하게 가꾸는 데 도움을 줍니다.",
    }),
  },
  {
    sampleNumber: 10,
    sampleId: "TC-010",
    sourceCaseId: "hair-loss-scope-mismatch-01",
    title: "선택하지 않은 탈모 기능 주장",
    request: buildRequest({
      sampleId: "TC-010",
      sourceCaseId: "hair-loss-scope-mismatch-01",
      title: "선택하지 않은 탈모 기능 주장",
      productKind: "functional",
      functionalCategories: ["wrinkle_improvement"],
      adCopy:
        "힘없이 빠지는 모발이 고민이라면, 빠지는 모발을 감소시키고 탈모 증상 완화에 도움을 주는 집중 케어 포뮬러.",
    }),
  },
];

export function resolveDemoSample(selector?: string): DemoSampleDefinition {
  if (!selector || selector.trim().length === 0) {
    return DEMO_SAMPLE_CASES[0]!;
  }

  const normalized = selector.trim().toLowerCase();
  const numberCandidate =
    normalized.match(/^sample[-_]?(\d+)$/)?.[1] ??
    normalized.match(/^case[-_]?(\d+)$/)?.[1] ??
    normalized.match(/^tc[-_]?0*(\d+)$/)?.[1] ??
    normalized.match(/^0*(\d+)$/)?.[1] ??
    null;

  if (!numberCandidate) {
    throw new Error(
      `unknown demo selector: ${selector}. use 1-10, sample3, case3, or tc003`,
    );
  }

  const sampleNumber = Number(numberCandidate);
  const sample = DEMO_SAMPLE_CASES.find(
    (candidate) => candidate.sampleNumber === sampleNumber,
  );

  if (!sample) {
    throw new Error(`demo sample ${sampleNumber} is not available. use 1-10.`);
  }

  return sample;
}

export function formatDemoSampleList(): string {
  return DEMO_SAMPLE_CASES.map(
    (sample) =>
      `${sample.sampleNumber}. ${sample.sampleId} | ${sample.title} | ${sample.sourceCaseId}`,
  ).join("\n");
}
