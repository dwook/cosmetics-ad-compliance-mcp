import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { reviewAdCopy } from "../../core/src/index.js";
import { FUNCTIONAL_COSMETIC_CATEGORY_CATALOG } from "../../core/src/product-qualification.js";
import { TOOLSET } from "./toolset.js";

const reviewRequestSchema = {
  requestId: z.string().optional().describe("Optional request identifier."),
  productCategory: z
    .string()
    .describe("Product category. Use `cosmetics` for this server."),
  productKind: z
    .enum(["general", "functional", "unknown"])
    .optional()
    .describe("Declared product kind aligned to cosmetics review."),
  functionalCategories: z
    .array(z.string())
    .optional()
    .describe("Declared functional cosmetic categories."),
  productSubcategory: z
    .string()
    .optional()
    .describe("Optional product subcategory for extra context."),
  audience: z.string().optional().describe("Optional audience context."),
  adCopy: z
    .string()
    .min(1)
    .describe("Cosmetics ad copy to review against the five grounded sources."),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Optional metadata object passed through to the review engine."),
};

const explainFindingSchema = {
  request: z
    .object(reviewRequestSchema)
    .describe("Original review request used to derive the finding."),
  findingId: z.string().min(1).describe("Finding identifier to explain."),
};

const INPUT_SCHEMAS = {
  review_ad_copy: reviewRequestSchema,
  list_applicable_references: reviewRequestSchema,
  explain_finding: explainFindingSchema,
};

function toJsonText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function toIndentedJsonLines(value: unknown, indent = "  ") {
  return JSON.stringify(value, null, 2)
    .split("\n")
    .map((line) => `${indent}${line}`);
}

function isLawLikeSourceId(sourceId: string) {
  return (
    sourceId === "cosmetics-act" ||
    sourceId === "enforcement-decree" ||
    sourceId === "enforcement-rule"
  );
}

function splitCitations(
  citations: Array<{
    sourceId: string;
    label: string;
    locator: string;
    excerpt: string;
  }> = [],
) {
  const 법령근거 = [];
  const 지침해설근거 = [];

  for (const citation of citations) {
    const normalized = {
      문서: citation.label,
      위치: citation.locator,
      발췌: citation.excerpt,
    };

    if (isLawLikeSourceId(citation.sourceId)) {
      법령근거.push(normalized);
      continue;
    }

    지침해설근거.push(normalized);
  }

  return { 법령근거, "지침·해설근거": 지침해설근거 };
}

function splitSelectedReferences(
  selectedReferences: Array<{
    id: string;
    title: string;
    authority: string;
    asOfDate: string;
  }> = [],
) {
  const 법령근거문서 = [];
  const 지침해설근거문서 = [];

  for (const reference of selectedReferences) {
    const normalized = {
      문서명: reference.title,
      기관: reference.authority,
      기준일: reference.asOfDate,
    };

    if (isLawLikeSourceId(reference.id)) {
      법령근거문서.push(normalized);
      continue;
    }

    지침해설근거문서.push(normalized);
  }

  return { 법령근거문서, "지침·해설근거문서": 지침해설근거문서 };
}

function sanitizePublicStatus(
  status:
    | {
        label: string;
        verificationReasons?: Array<{ label: string; description: string }>;
      }
    | null
    | undefined,
) {
  if (!status) {
    return status;
  }

  return {
    상태: status.label,
    세부확인사유: (status.verificationReasons ?? []).map((reason) => ({
      상태: reason.label,
      설명: reason.description,
    })),
  };
}

function sanitizeFinding(finding: any) {
  if (!finding) {
    return finding;
  }

  const { suggestedFix, verdict, severity, ...rest } = finding;
  const severityLabel =
    severity === "high" ? "높음" : severity === "medium" ? "보통" : "낮음";

  return {
    순번: rest.displayOrder,
    참조ID: rest.id,
    상태: verdict === "BLOCK" ? "금지표현 해당" : "추가 확인 필요",
    위험도: severityLabel,
    항목코드: rest.code,
    항목명: rest.title,
    분류: {
      대분류: rest.taxonomy.familyLabel,
      세부유형: rest.taxonomy.ruleLabel,
    },
    설명: rest.reason,
    문제표현: rest.span.text,
    근거표현: rest.evidence,
    ...splitCitations(rest.citations),
    근거문서역할: rest.sourceBindings.map((binding: any) => ({
      문서: binding.sourceTitle,
      역할: binding.role,
      직접인용: binding.directlyCited,
    })),
    추가확인사항: rest.requiredChecks,
  };
}

function sanitizeReportItem(item: any) {
  if (!item) {
    return item;
  }

  return {
    항목코드: item.code,
    항목명: item.title,
    설명: item.reason,
    문제표현: item.spanText,
    근거표현: item.evidence,
    ...splitCitations(item.citations),
  };
}

function buildInputCompletionGuide(result: any) {
  const profile = result.productProfile;
  const needsProductKind = profile.declaredProductKind === "unknown";
  const needsFunctionalCategories =
    profile.declaredProductKind === "functional" &&
    profile.declaredFunctionalCategories.length === 0;
  const hasMismatch = profile.mismatchNotes.length > 0;

  if (!needsProductKind && !needsFunctionalCategories && !hasMismatch) {
    return null;
  }

  const recommendedCategoryCodes =
    profile.inferredFunctionalCategories.length > 0
      ? profile.inferredFunctionalCategories
      : profile.declaredFunctionalCategories;

  const recommendedCategories = FUNCTIONAL_COSMETIC_CATEGORY_CATALOG.filter((category) =>
    recommendedCategoryCodes.includes(category.code),
  ).map((category) => ({
    입력값: category.code,
    항목명: category.label,
    법령기준: category.lawLabel,
  }));

  const reasons = [];
  const questions = [];

  if (needsProductKind) {
    reasons.push(
      "광고카피만 입력되어 제품 구분이 비어 있습니다. 일반화장품인지 기능성화장품인지 확인해야 기능성 범위 cross-check가 정확해집니다.",
    );
    questions.push(
      "이 제품은 일반화장품인가요, 기능성화장품인가요? 다시 검토할 때 productKind에 general 또는 functional을 넣어 주세요.",
    );
  }

  if (needsFunctionalCategories) {
    reasons.push(
      "기능성화장품으로 입력되었지만, 화장품법 시행규칙 제2조 기준 11개 기능성 범주 중 해당 항목이 특정되지 않았습니다.",
    );
  }

  if (recommendedCategories.length > 0) {
    questions.push(
      "기능성화장품이라면 아래 추천 기능성 범주 중 해당 항목을 functionalCategories에 넣어 다시 검토해 주세요.",
    );
  }

  if (hasMismatch) {
    reasons.push(...profile.mismatchNotes);
    questions.push(
      "현재 입력한 제품 구분 또는 기능성 범주가 광고카피에서 감지된 범위와 일치하는지 다시 확인해 주세요.",
    );
  }

  const exampleProductKind =
    recommendedCategories.length > 0 ? "functional" : "general";

  return {
    상태: recommendedCategories.length > 0 ? "추가 기입 필요" : "추가 기입 권장",
    이유: [...new Set(reasons)],
    다시확인질문: [...new Set(questions)],
    제품구분입력값: [
      { 입력값: "general", 표시명: "일반화장품" },
      { 입력값: "functional", 표시명: "기능성화장품" },
      { 입력값: "unknown", 표시명: "아직 모름" },
    ],
    추천기능성범주: recommendedCategories,
    재검토용입력예시: {
      productCategory: result.request.productCategory,
      productKind: exampleProductKind,
      functionalCategories:
        exampleProductKind === "functional" ? recommendedCategoryCodes : [],
      adCopy: result.request.adCopy,
    },
  };
}

function buildScenarioReview(request: any, productKind: string, functionalCategories: string[]) {
  return reviewAdCopy({
    ...request,
    productKind,
    functionalCategories,
  });
}

function scenarioDiffers(left: any, right: any) {
  const leftCodes = left.surfacedFindings.map((finding: any) => finding.code).sort();
  const rightCodes = right.surfacedFindings.map((finding: any) => finding.code).sort();

  return (
    left.publicStatus.label !== right.publicStatus.label ||
    left.summary !== right.summary ||
    leftCodes.join("|") !== rightCodes.join("|")
  );
}

function summarizeScenarioResult(label: string, review: any) {
  return {
    시나리오: label,
    총괄상태: review.publicStatus.label,
    요약: review.summary,
    검토항목: review.surfacedFindings.map((finding: any) => ({
      상태: finding.verdict === "BLOCK" ? "금지표현 해당" : "추가 확인 필요",
      항목명: finding.title,
      문제표현: finding.span.text,
    })),
    추가확인사항: review.report.additionalChecks,
  };
}

function buildScenarioComparison(result: any) {
  const profile = result.productProfile;

  if (
    profile.declaredProductKind !== "unknown" ||
    profile.inferredFunctionalCategories.length === 0
  ) {
    return null;
  }

  const generalReview = buildScenarioReview(result.request, "general", []);
  const functionalReview = buildScenarioReview(
    result.request,
    "functional",
    profile.inferredFunctionalCategories,
  );

  if (!scenarioDiffers(generalReview, functionalReview)) {
    return null;
  }

  return {
    안내:
      "현재 입력에는 제품 구분이 없어서, 일반화장품으로 볼 때와 기능성화장품으로 볼 때 결과가 달라질 수 있습니다. 아래 두 시나리오를 함께 확인해 주세요.",
    일반화장품기준: summarizeScenarioResult("일반화장품으로 검토", generalReview),
    기능성화장품기준: summarizeScenarioResult(
      "기능성화장품으로 검토",
      functionalReview,
    ),
  };
}

function renderCitationLine(citation: { 문서: string; 위치: string }) {
  return `  - ${citation.문서} — ${citation.위치}`;
}

function renderDocumentLine(reference: {
  문서명: string;
  기관: string;
  기준일: string;
}) {
  return `  - ${reference.문서명} (${reference.기관}, 기준일 ${reference.기준일})`;
}

export function renderDisplayReviewReport(sanitized: any) {
  const lines = [];
  const summary = sanitized.검수결과;
  const status = summary.총괄상태;

  lines.push("광고카피 검수 결과");
  lines.push("");
  lines.push(`원문: "${summary.광고카피원문}"`);
  lines.push("");
  lines.push(`총괄 판정: ${status.상태}`);

  if (status.세부확인사유.length > 0) {
    lines.push(
      `세부 확인 사유: ${status.세부확인사유.map((reason: any) => reason.상태).join(", ")}`,
    );
  }

  if (summary.기능성검토맥락.감지된기능성범주.length > 0) {
    lines.push(
      `감지된 기능성 범주: ${summary.기능성검토맥락.감지된기능성범주.join(", ")}`,
    );
  }

  if (summary.검토항목.length === 0) {
    lines.push("");
    lines.push("검토 항목이 없습니다.");
  }

  if (summary.입력보완안내) {
    lines.push("");
    lines.push("입력 보완 안내");
    lines.push(`- 상태: ${summary.입력보완안내.상태}`);

    for (const reason of summary.입력보완안내.이유) {
      lines.push(`- 이유: ${reason}`);
    }

    for (const question of summary.입력보완안내.다시확인질문) {
      lines.push(`- 다시 확인할 내용: ${question}`);
    }

    if (summary.입력보완안내.추천기능성범주.length > 0) {
      lines.push("- 추천 기능성 범주:");
      for (const category of summary.입력보완안내.추천기능성범주) {
        lines.push(`  - ${category.항목명} (${category.입력값}, ${category.법령기준})`);
      }
    }

    lines.push("- 재검토용 입력 예시:");
    lines.push(...toIndentedJsonLines(summary.입력보완안내.재검토용입력예시, "  "));
  }

  if (summary.분기검토) {
    lines.push("");
    lines.push("분기 검토");
    lines.push(`- 안내: ${summary.분기검토.안내}`);

    for (const scenario of [
      summary.분기검토.일반화장품기준,
      summary.분기검토.기능성화장품기준,
    ]) {
      lines.push(`- ${scenario.시나리오}`);
      lines.push(`  - 총괄 상태: ${scenario.총괄상태}`);
      lines.push(`  - 요약: ${scenario.요약}`);

      if (scenario.검토항목.length > 0) {
        lines.push("  - 검토 항목:");
        for (const item of scenario.검토항목) {
          lines.push(`    - ${item.항목명} / ${item.상태} / "${item.문제표현}"`);
        }
      }

      if (scenario.추가확인사항.length > 0) {
        lines.push(`  - 추가 확인 사항: ${scenario.추가확인사항.join(", ")}`);
      }
    }
  }

  for (const item of summary.검토항목) {
    lines.push("");
    lines.push(`검토 항목 ${item.순번} — ${item.항목명}`);
    lines.push(`- 상태: ${item.상태}`);
    lines.push(`- 위험도: ${item.위험도}`);
    lines.push(`- 문제 표현: "${item.문제표현}"`);

    if (item.근거표현.length > 0) {
      lines.push(`- 근거 표현: ${item.근거표현.join(", ")}`);
    }

    lines.push("- 법령 근거:");
    if (item.법령근거.length > 0) {
      lines.push(...item.법령근거.map(renderCitationLine));
    } else {
      lines.push("  - 없음");
    }

    lines.push("- 지침·해설 근거:");
    if (item["지침·해설근거"].length > 0) {
      lines.push(...item["지침·해설근거"].map(renderCitationLine));
    } else {
      lines.push("  - 없음");
    }

    if (item.추가확인사항.length > 0) {
      lines.push(`- 추가 확인 사항: ${item.추가확인사항.join(", ")}`);
    }
  }

  if (summary.추가확인사항.length > 0) {
    lines.push("");
    lines.push("추가 확인 사항");
    for (const check of summary.추가확인사항) {
      lines.push(`- ${check}`);
    }
  }

  lines.push("");
  lines.push("핵심 근거 문서");
  lines.push("- 법령 근거 문서:");
  lines.push(...summary.법령근거문서.map(renderDocumentLine));
  lines.push("- 지침·해설 근거 문서:");
  lines.push(...summary["지침·해설근거문서"].map(renderDocumentLine));

  return lines.join("\n");
}

export function sanitizeReviewResultForMcp(result: any) {
  if (!result) {
    return result;
  }

  const sanitized = {
    요청: {
      productCategory: result.request.productCategory,
      productKind: result.request.productKind,
      functionalCategories: result.request.functionalCategories,
    },
    검수결과: {
      광고카피원문: result.request.adCopy,
      총괄상태: sanitizePublicStatus(result.publicStatus),
      요약: result.summary,
      검토항목: result.surfacedFindings.map(sanitizeFinding),
      추가확인사항: result.report.additionalChecks,
      입력보완안내: buildInputCompletionGuide(result),
      분기검토: buildScenarioComparison(result),
      기능성검토맥락: {
        입력제품구분: result.productProfile.declaredProductKind,
        입력기능성범주: result.productProfile.declaredFunctionalCategoryLabels,
        감지된기능성범주: result.productProfile.inferredFunctionalCategoryLabels,
        법령기준: result.productProfile.lawBasis,
      },
      ...splitSelectedReferences(result.selectedReferences),
      보고서요약: {
        즉시수정필요: result.report.mustFix.map(sanitizeReportItem),
        추가확인필요: result.report.caution.map(sanitizeReportItem),
      },
    },
  };

  return {
    표시용검수보고서: renderDisplayReviewReport(sanitized),
    ...sanitized,
  };
}

export function sanitizeToolResult(toolName: string, result: unknown) {
  if (toolName === "review_ad_copy") {
    return sanitizeReviewResultForMcp(result);
  }

  return result;
}

export function createReviewMcpServer() {
  const server = new McpServer({
    name: "cosmetics-ad-compliance",
    version: "0.1.0",
  });

  for (const tool of TOOLSET) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: INPUT_SCHEMAS[tool.name as keyof typeof INPUT_SCHEMAS],
        annotations: tool.annotations,
      },
      async (input: any) => {
        const result = sanitizeToolResult(tool.name, tool.execute(input));

        return {
          content: [
            {
              type: "text" as const,
              text: toJsonText(result),
            },
          ],
        };
      },
    );
  }

  return server;
}
