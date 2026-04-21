import type {
  FindingExplanation,
  ReviewRequest,
  ReviewResult,
  SelectedReference,
  ToolDefinition,
} from "../../shared-types/src/index.js";
import {
  explainFinding,
  listApplicableReferences,
  reviewAdCopy,
} from "../../core/src/index.js";

interface ExplainFindingInput {
  request: ReviewRequest;
  findingId: string;
}

function assertReviewRequest(input: unknown): ReviewRequest {
  if (!input || typeof input !== "object") {
    throw new Error("review request object is required");
  }

  const candidate = input as Record<string, unknown>;

  if (typeof candidate.productCategory !== "string") {
    throw new Error("productCategory is required");
  }

  if (typeof candidate.adCopy !== "string") {
    throw new Error("adCopy is required");
  }

  return {
    requestId: typeof candidate.requestId === "string" ? candidate.requestId : undefined,
    productCategory: candidate.productCategory,
    productKind:
      typeof candidate.productKind === "string"
        ? (candidate.productKind as ReviewRequest["productKind"])
        : undefined,
    functionalCategories: Array.isArray(candidate.functionalCategories)
      ? candidate.functionalCategories.filter(
          (category): category is string => typeof category === "string",
        ) as ReviewRequest["functionalCategories"]
      : undefined,
    productSubcategory:
      typeof candidate.productSubcategory === "string"
        ? candidate.productSubcategory
        : undefined,
    audience: typeof candidate.audience === "string" ? candidate.audience : undefined,
    adCopy: candidate.adCopy,
    metadata:
      candidate.metadata && typeof candidate.metadata === "object"
        ? (candidate.metadata as Record<string, unknown>)
        : undefined,
  };
}

function assertExplainFindingInput(input: unknown): ExplainFindingInput {
  if (!input || typeof input !== "object") {
    throw new Error("request and findingId are required");
  }

  const candidate = input as Record<string, unknown>;

  if (typeof candidate.findingId !== "string") {
    throw new Error("findingId is required");
  }

  return {
    request: assertReviewRequest(candidate.request),
    findingId: candidate.findingId,
  };
}

export const TOOLSET: Array<
  ToolDefinition<ReviewRequest, ReviewResult> |
    ToolDefinition<ReviewRequest, SelectedReference[]> |
    ToolDefinition<ExplainFindingInput, FindingExplanation | null>
> = [
  {
    name: "review_ad_copy",
    title: "Review Ad Copy",
    description:
      "화장품 광고 문구를 검수할 때 가장 먼저 쓰는 메인 도구입니다. 5개 근거 문서를 기준으로 총괄 판정, 문제 표현, 근거를 함께 반환합니다. 이 도구는 검수 전용이며, 명시 요청이 없으면 대안 문구, 카피 수정안, 실행 플랜을 생성하지 말고 검수 결과만 요약해야 합니다. 사용자에게 보여줄 때는 응답의 `표시용검수보고서`를 우선 그대로 사용하고, 제목이나 레이아웃을 새로 영어식으로 다시 쓰지 마십시오.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: (input: ReviewRequest) => reviewAdCopy(assertReviewRequest(input)),
  },
  {
    name: "list_applicable_references",
    title: "List Applicable References",
    description:
      "현재 문안 검수에 5개 근거 문서 중 어떤 source가 실제로 연결됐는지와 선택 이유를 보여줍니다. 전체 검수 전에 grounding 범위를 확인할 때 씁니다.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: (input: ReviewRequest) => {
      const request = assertReviewRequest(input);
      const reviewed = reviewAdCopy(request);
      return listApplicableReferences(request, reviewed.classification);
    },
  },
  {
    name: "explain_finding",
    title: "Explain Finding",
    description:
      "review_ad_copy에서 나온 특정 finding id 하나를 더 자세히 설명합니다. 왜 문제인지와 어떤 근거 문서가 연결되는지를 좁혀서 확인할 때 씁니다.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: (input: ExplainFindingInput) => {
      const validated = assertExplainFindingInput(input);
      return explainFinding(validated.request, validated.findingId);
    },
  },
];

export function executeTool(name: string, input: unknown): unknown {
  const tool = TOOLSET.find((candidate) => candidate.name === name);

  if (!tool) {
    throw new Error(`unknown tool: ${name}`);
  }

  return tool.execute(input as never);
}
