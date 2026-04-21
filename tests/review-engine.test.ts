import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  explainFinding,
  reviewAdCopy,
} from "../packages/core/src/index.js";
import { getCuratedLawCitationTargets } from "../packages/core/src/law-citations.js";
import {
  applyMinuteRateLimit,
  createEmptyMinuteRateLimitState,
} from "../packages/mcp/src/remote-rate-limit.js";
import { suggestRevision } from "../packages/core/src/orchestrator.js";
import { executeTool } from "../packages/mcp/src/index.js";
import type { ReviewRequest } from "../packages/shared-types/src/index.js";

interface SampleEvalCase {
  id: string;
  description: string;
  request: ReviewRequest;
  expected: {
    verdict: string;
    mustIncludeCodes: string[];
    mustExcludeCodes: string[];
    mustIncludeCitationLabels: string[];
    mustIncludeUncertaintyCodes: string[];
  };
}

const REGRESSION_FIXTURE_DIR = path.join(
  process.cwd(),
  "examples/eval/regression",
);

function assertFixtureSetStable(
  fixturePath: string,
  minimumLength: number,
): void {
  const fixtures = JSON.parse(
    readFileSync(fixturePath, "utf8"),
  ) as SampleEvalCase[];

  assert.ok(fixtures.length >= minimumLength);

  for (const sampleCase of fixtures) {
    const result = reviewAdCopy(sampleCase.request);
    const surfacedCodes = result.surfacedFindings.map((finding) => finding.code);
    const citationLabels = result.surfacedFindings.flatMap((finding) =>
      finding.citations.map((citation) => citation.label),
    );
    const uncertaintyCodes = result.uncertaintySignals.map(
      (signal) => signal.code,
    );

    assert.equal(
      result.verdict,
      sampleCase.expected.verdict,
      `${sampleCase.id}: verdict mismatch`,
    );
    for (const code of sampleCase.expected.mustIncludeCodes) {
      assert.ok(
        surfacedCodes.includes(code),
        `${sampleCase.id}: missing surfaced code ${code}`,
      );
    }

    for (const code of sampleCase.expected.mustExcludeCodes) {
      assert.ok(
        !surfacedCodes.includes(code),
        `${sampleCase.id}: unexpected surfaced code ${code}`,
      );
    }

    for (const label of sampleCase.expected.mustIncludeCitationLabels) {
      assert.ok(
        citationLabels.some((citationLabel) => citationLabel.includes(label)),
        `${sampleCase.id}: missing citation label containing ${label}`,
      );
    }

    for (const code of sampleCase.expected.mustIncludeUncertaintyCodes) {
      const expectedCode = code as (typeof uncertaintyCodes)[number];
      assert.ok(
        uncertaintyCodes.includes(expectedCode),
        `${sampleCase.id}: missing uncertainty code ${code}`,
      );
    }
  }
}

test("high-risk copy is blocked and citations stay grounded", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  });

  assert.equal(result.verdict, "BLOCK");
  assert.equal(result.publicStatus.code, "PROHIBITED_CLAIM");
  assert.equal(result.publicStatus.label, "금지표현 해당");
  assert.ok(
    result.surfacedFindings.some(
      (finding) => finding.code === "COSMETICS_MEDICAL_CLAIM",
    ),
  );
  assert.ok(
    result.surfacedFindings.every(
      (finding) => finding.citedReferenceIds.length >= 1,
    ),
  );
  assert.ok(
    result.surfacedFindings.every((finding) =>
      finding.citations.every((citation) =>
        finding.citedReferenceIds.includes(citation.sourceId),
      ),
    ),
  );
  assert.ok(
    result.surfacedFindings.every(
      (finding) => finding.sourceBindings.length === finding.citedReferenceIds.length,
    ),
  );
  assert.equal(result.sourcePack.entries.length, 5);
  assert.equal(result.sourcePack.reviewRuntimeMode, "local_corpus_only");
  assert.equal(result.sourcePack.liveFetchAtReviewTime, false);
  assert.equal(result.sourcePack.corpusStatus, "full_text_ready");
  assert.equal(result.sourcePack.stagedFileCount, 5);
  assert.equal(result.sourcePack.fullTextReadyCount, 5);
  assert.equal(result.sourcePack.citationReadyCount, 5);
  assert.deepEqual(result.sourcePack.missingCapabilities, []);

  const lawEntry = result.sourcePack.entries.find(
    (entry) => entry.id === "cosmetics-act",
  );
  const policyEntry = result.sourcePack.entries.find(
    (entry) => entry.id === "mfds-guideline",
  );
  const kciaEntry = result.sourcePack.entries.find(
    (entry) => entry.id === "kcia-guide",
  );

  assert.equal(lawEntry?.storageKind, "local_snapshot");
  assert.equal(lawEntry?.runtimeFetchAllowed, false);
  assert.equal(
    lawEntry?.snapshotManifestPath,
    "policies/law_snapshots/cosmetics-act/manifest.json",
  );
  assert.equal(
    lawEntry?.localArtifactPath,
    "policies/law_snapshots/cosmetics-act/versions/2026-04-02/body.txt",
  );
  assert.equal(
    lawEntry?.citationIndexPath,
    "policies/law_snapshots/cosmetics-act/versions/2026-04-02/anchors.json",
  );
  assert.equal(policyEntry?.storageKind, "local_pdf");
  assert.equal(policyEntry?.corpusStatus, "full_text_ready");
  assert.equal(policyEntry?.fullTextAvailable, true);
  assert.equal(policyEntry?.pageCount, 17);
  assert.equal(
    policyEntry?.localArtifactPath,
    "policies/source_pdfs/mfds-cosmetics-ad-guideline-20250814.pdf",
  );
  assert.equal(
    policyEntry?.extractedTextPath,
    "policies/extracted_text/mfds-guideline.txt",
  );
  assert.equal(
    policyEntry?.citationIndexPath,
    "policies/anchor_indexes/mfds-guideline.page-block.json",
  );
  assert.equal(
    policyEntry?.semanticIndexPath,
    "policies/anchor_indexes/mfds-guideline.semantic.json",
  );
  assert.equal(
    kciaEntry?.semanticIndexPath,
    "policies/anchor_indexes/kcia-guide.semantic.json",
  );
  assert.ok(
    result.surfacedFindings.some((finding) =>
      finding.citations.some((citation) => citation.sourceId === "mfds-guideline"),
    ),
  );
  assert.ok(
    result.surfacedFindings.some((finding) =>
      finding.citations.some((citation) => citation.sourceId === "cosmetics-act"),
    ),
  );
  assert.ok(
    result.surfacedFindings.some((finding) =>
      finding.citations.some(
        (citation) => citation.sourceId === "enforcement-rule",
      ),
    ),
  );
  assert.ok(result.report.taxonomySummary.includes("의약품 오인: 1건"));
});

test("informational usage-tip copy passes without findings", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "세안 후 보습 크림을 바르는 순서와 사용 팁을 정리했습니다.",
  });

  assert.equal(result.verdict, "PASS");
  assert.equal(result.surfacedFindings.length, 0);
});

test("weak-evidence general overclaim stays UNCLEAR", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "혁신적인 피부 케어 경험을 선사합니다.",
  });

  assert.equal(result.verdict, "UNCLEAR");
  assert.ok(result.surfacedFindings.length >= 1);
  assert.ok(
    result.uncertaintySignals.some(
      (signal) => signal.code === "low_classifier_confidence" && signal.affectsVerdict,
    ),
  );
  assert.ok(
    result.report.uncertaintyNotes.some((note) =>
      note.includes("보수적으로 해석"),
    ),
  );
});

test("tool wrapper exposes selected references", () => {
  const reviewed = reviewAdCopy({
    productCategory: "cosmetics",
    productKind: "functional",
    functionalCategories: ["brightening_lightening"],
    adCopy: "미백 케어 포인트를 소개합니다.",
  });

  assert.ok(reviewed.classification.issueTags.includes("functional_scope"));

  const result = executeTool("list_applicable_references", {
    productCategory: "cosmetics",
    productKind: "functional",
    functionalCategories: ["brightening_lightening"],
    adCopy: "미백 케어 포인트를 소개합니다.",
  }) as Array<{ id: string }>;

  assert.equal(result.length, 5);
  assert.ok(result.some((reference) => reference.id === "mfds-guideline"));
  assert.ok(result.some((reference) => reference.id === "kcia-guide"));
});

test("suggest revision returns finding-aware safer rewrite with source notes", () => {
  const suggestion = suggestRevision({
    productCategory: "cosmetics",
    adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  });

  assert.equal(suggestion.verdict, "BLOCK");
  assert.ok(suggestion.changeCount >= 1);
  assert.ok(suggestion.revised !== suggestion.original);
  assert.ok(!suggestion.revised.includes("치료"));
  assert.ok(
    suggestion.changes.some((change) =>
      change.appliedPhrases.some((pair) => pair.from === "치료"),
    ),
  );
  assert.ok(
    suggestion.changes.some((change) => change.sourceLabels.includes("화장품법")),
  );
  assert.ok(
    suggestion.sourceGroundingNote.includes("화장품법"),
  );
});

test("suggest revision carries uncertainty notes for weak-evidence risky copy", () => {
  const suggestion = suggestRevision({
    productCategory: "cosmetics",
    adCopy: "혁신적인 피부 케어 경험을 선사합니다.",
  });

  assert.equal(suggestion.verdict, "UNCLEAR");
  assert.ok(suggestion.changeCount >= 1);
  assert.ok(suggestion.uncertaintyNotes.length >= 1);
  assert.ok(
    suggestion.uncertaintyNotes.some((note) => note.includes("보수적으로 해석")),
  );
});

test("demo defaults to human-readable text and still supports json", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["dist/packages/mcp/src/demo.js"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["dist/packages/mcp/src/demo.js", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Review Result"));
  assert.ok(textStdout.includes("Demo Sample: TC-001"));
  assert.ok(textStdout.includes("Input Copy"));
  assert.ok(textStdout.includes("비오틴 5000mcg"));
  assert.ok(textStdout.includes("Findings:"));
  assert.ok(jsonStdout.includes('"verdict"'));
  assert.ok(jsonStdout.includes('"report"'));
});

test("demo supports selecting ad-guard-v3 sample cases by number-like selector", () => {
  const stdout = execFileSync(
    process.execPath,
    ["dist/packages/mcp/src/demo.js", "sample3"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const listStdout = execFileSync(
    process.execPath,
    ["dist/packages/mcp/src/demo.js", "--list"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(stdout.includes("Demo Sample: TC-003"));
  assert.ok(stdout.includes("일반화장품의 미백 표방"));
  assert.ok(stdout.includes("칙칙한 피부 톤이 고민이라면"));
  assert.ok(listStdout.includes("1. TC-001"));
  assert.ok(listStdout.includes("10. TC-010"));
});

test("stdio MCP server exposes the review-first tool surface", async () => {
  const stdout = execFileSync(
    process.execPath,
    ["scripts/run_mcp_smoke.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const smokeResult = JSON.parse(stdout) as {
    toolNames: string[];
    reviewResult: {
      표시용검수보고서: string;
      요청: {
        productCategory: string;
      };
      검수결과: {
        광고카피원문: string;
        총괄상태: {
          상태: string;
          code?: string;
        };
        입력보완안내?: {
          상태: string;
          이유: string[];
          다시확인질문: string[];
          추천기능성범주: Array<{
            입력값: string;
            항목명: string;
            법령기준: string;
          }>;
          재검토용입력예시: {
            productCategory: string;
            productKind: string;
            functionalCategories: string[];
            adCopy: string;
          };
        };
        법령근거문서: Array<{ 문서명: string }>;
        "지침·해설근거문서": Array<{ 문서명: string }>;
        검토항목: Array<{
          순번: number;
          상태: string;
          위험도: string;
          항목코드: string;
          verdict?: string;
          severity?: string;
          법령근거: Array<{ 문서: string }>;
          "지침·해설근거": Array<{ 문서: string }>;
        }>;
      };
    };
  };

  assert.deepEqual(smokeResult.toolNames.sort(), [
    "explain_finding",
    "list_applicable_references",
    "review_ad_copy",
  ]);
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("광고카피 검수 결과"),
  );
  assert.ok(smokeResult.reviewResult.표시용검수보고서.includes("원문:"));
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("총괄 판정: 금지표현 해당"),
  );
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("입력 보완 안내"),
  );
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("재검토용 입력 예시"),
  );
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("검토 항목 1"),
  );
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("법령 근거:"),
  );
  assert.ok(
    smokeResult.reviewResult.표시용검수보고서.includes("지침·해설 근거:"),
  );
  assert.equal(
    smokeResult.reviewResult.표시용검수보고서.includes("Verdict:"),
    false,
  );
  assert.equal(
    smokeResult.reviewResult.표시용검수보고서.includes("Finding"),
    false,
  );
  assert.equal(
    smokeResult.reviewResult.표시용검수보고서.includes("Citations"),
    false,
  );
  assert.equal(smokeResult.reviewResult.검수결과.총괄상태.상태, "금지표현 해당");
  assert.equal(smokeResult.reviewResult.요청.productCategory, "cosmetics");
  assert.equal(
    smokeResult.reviewResult.검수결과.광고카피원문,
    "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  );
  assert.equal(
    smokeResult.reviewResult.검수결과.입력보완안내?.상태,
    "추가 기입 필요",
  );
  assert.ok(
    smokeResult.reviewResult.검수결과.입력보완안내?.다시확인질문.some(
      (question) => question.includes("productKind"),
    ) ?? false,
  );
  assert.ok(
    (smokeResult.reviewResult.검수결과.입력보완안내?.추천기능성범주.length ?? 0) >= 1,
  );
  assert.equal(
    smokeResult.reviewResult.검수결과.입력보완안내?.재검토용입력예시.productKind,
    "functional",
  );
  assert.ok(smokeResult.reviewResult.검수결과.검토항목.length >= 1);
  assert.ok(smokeResult.reviewResult.검수결과.법령근거문서.length >= 3);
  assert.ok(smokeResult.reviewResult.검수결과["지침·해설근거문서"].length >= 2);
  assert.equal(
    "code" in smokeResult.reviewResult.검수결과.총괄상태,
    false,
  );
  assert.equal(
    smokeResult.reviewResult.검수결과.검토항목.some(
      (finding) => "verdict" in finding,
    ),
    false,
  );
  assert.ok(
    smokeResult.reviewResult.검수결과.검토항목.every(
      (finding) => finding.상태 === "금지표현 해당" || finding.상태 === "추가 확인 필요",
    ),
  );
  assert.equal(
    smokeResult.reviewResult.검수결과.검토항목.some(
      (finding) => "severity" in finding,
    ),
    false,
  );
  assert.ok(
    smokeResult.reviewResult.검수결과.검토항목.every(
      (finding) =>
        finding.위험도 === "높음" ||
        finding.위험도 === "보통" ||
        finding.위험도 === "낮음",
    ),
  );
  assert.ok(
    smokeResult.reviewResult.검수결과.검토항목.every(
      (finding) => finding.법령근거.length >= 1,
    ),
  );
  assert.ok(
    smokeResult.reviewResult.검수결과.검토항목.some(
      (finding) => finding["지침·해설근거"].length >= 1,
    ),
  );
});

test("stdio MCP server surfaces branch review when general vs functional outcomes diverge", async () => {
  const stdout = execFileSync(
    process.execPath,
    [
      "scripts/run_mcp_smoke.mjs",
      "--input",
      "examples/requests/branch-functional-review.json",
      "--format",
      "json",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const smokeResult = JSON.parse(stdout) as {
    reviewResult: {
      표시용검수보고서: string;
      검수결과: {
        분기검토: {
          안내: string;
          일반화장품기준: {
            총괄상태: string;
          };
          기능성화장품기준: {
            총괄상태: string;
          };
        } | null;
      };
    };
  };

  assert.ok(smokeResult.reviewResult.표시용검수보고서.includes("분기 검토"));
  assert.ok(smokeResult.reviewResult.표시용검수보고서.includes("일반화장품으로 검토"));
  assert.ok(smokeResult.reviewResult.표시용검수보고서.includes("기능성화장품으로 검토"));
  assert.ok(smokeResult.reviewResult.검수결과.분기검토);
  assert.equal(
    smokeResult.reviewResult.검수결과.분기검토?.일반화장품기준.총괄상태,
    "추가 확인 필요",
  );
  assert.equal(
    smokeResult.reviewResult.검수결과.분기검토?.기능성화장품기준.총괄상태,
    "문제 표현 미감지",
  );
});

test("functional product declaration is surfaced as law-aligned cross-check context", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    productKind: "functional",
    functionalCategories: ["brightening_lightening", "wrinkle_improvement"],
    adCopy: "미백과 주름 개선을 돕는 크림입니다.",
  });

  assert.equal(result.productProfile.declaredProductKind, "functional");
  assert.deepEqual(result.productProfile.declaredFunctionalCategories, [
    "brightening_lightening",
    "wrinkle_improvement",
  ]);
  assert.ok(
    result.productProfile.lawBasis.includes("화장품법 시행규칙 제2조제2호"),
  );
  assert.ok(
    result.productProfile.lawBasis.includes("화장품법 시행규칙 제2조제3호"),
  );
  assert.ok(
    result.report.productQualificationNotes.some((note) =>
      note.includes("법령 cross-check 기준"),
    ),
  );
  assert.ok(
    result.report.additionalChecks.some((check) =>
      check.includes("화장품법 시행규칙 제2조제2호"),
    ),
  );
  assert.equal(result.productProfile.categoryChecklists.length, 2);

  const brighteningChecklist = result.productProfile.categoryChecklists.find(
    (checklist) => checklist.categoryCode === "brightening_lightening",
  );
  const wrinkleChecklist = result.report.productQualificationChecklist.find(
    (checklist) => checklist.categoryCode === "wrinkle_improvement",
  );

  assert.ok(brighteningChecklist);
  assert.ok(brighteningChecklist?.declaredInInput);
  assert.ok(brighteningChecklist?.inferredFromCopy);
  assert.ok(
    brighteningChecklist?.checks.some(
      (item) =>
        item.kind === "evidence" &&
        item.sourceLabels.includes(
          "화장품 표시·광고 관리 지침 [별표 2] 화장품 표시․ 광고 주요 실증대상",
        ),
    ),
  );
  assert.ok(wrinkleChecklist);
  assert.ok(
    wrinkleChecklist?.checks.some(
      (item) =>
        item.kind === "evidence" &&
        item.sourceLabels.includes(
          "화장품 광고자문 기준 및 해설서 ∙ 주름개선 기능성화장품으로 안티에이징 케어",
        ),
    ),
  );
});

test("warning-level review surfaces public verification reasons", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    productKind: "general",
    adCopy: "미백과 주름 개선을 돕는 크림입니다.",
  });

  assert.equal(result.verdict, "WARNING");
  assert.equal(result.publicStatus.code, "NEEDS_VERIFICATION");
  assert.equal(result.publicStatus.label, "추가 확인 필요");
  assert.ok(
    result.publicStatus.verificationReasons.some(
      (reason) => reason.code === "NEEDS_SCOPE_REVIEW",
    ),
  );
  assert.ok(
    result.report.publicStatus.verificationReasons.some(
      (reason) => reason.label === "기능성 범위 확인 필요",
    ),
  );
});

test("finding explanation exposes both law and policy citations", () => {
  const explanation = explainFinding(
    {
      productCategory: "cosmetics",
      adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
    },
    "finding-1",
  );

  assert.ok(explanation);
  assert.equal(explanation?.taxonomy.family, "medicalization");
  assert.ok(explanation?.citations.length);
  assert.ok(
    explanation?.citations.some((citation) =>
      citation.label.includes("화장품법 제13조제1항제1호"),
    ),
  );
  assert.ok(
    explanation?.citations.some((citation) =>
      citation.label.includes("화장품 표시·광고 관리 지침"),
    ),
  );
  assert.ok(
    explanation?.citations.some((citation) =>
      [
        "화장품 광고자문 기준 및 해설서 ① 질병을 진단·치료·경감·처치·예방하는 표현",
        "화장품 광고자문 기준 및 해설서 ∙ 피부의 상처나 질병으로 인한 손상을 치료하거나 회복 또는 복구한다.",
      ].some((expectedLabel) => citation.label.includes(expectedLabel)),
    ),
  );
  assert.ok(
    explanation?.sourceBindings.some(
      (binding) =>
        binding.sourceId === "cosmetics-act" &&
        binding.role === "statutory_basis" &&
        binding.directlyCited,
    ),
  );
});

test("policy citations prefer semantic anchors when section headings are available", () => {
  const medicalResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  });
  const medicalFinding = medicalResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_MEDICAL_CLAIM",
  );

  assert.ok(medicalFinding);
  assert.ok(
    medicalFinding?.citations.some(
      (citation) =>
        citation.sourceId === "mfds-guideline" &&
        citation.label.includes("화장품 표시·광고 관리 지침 □ 화장품법 제13조 제1항 제1호 관련"),
    ),
  );

  const ingredientResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "레티놀 원료가 피부 재생을 도와줍니다.",
  });
  const ingredientFinding = ingredientResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_INGREDIENT_TRANSFER",
  );

  assert.ok(ingredientFinding);
  assert.ok(
    ingredientFinding?.citations.some(
      (citation) =>
        citation.sourceId === "mfds-guideline" &&
        citation.label.includes("화장품 표시·광고 관리 지침 □ 화장품법 제13조 제1항 제4호 관련"),
    ),
  );

  const expertResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "전문의 추천 크림으로 소개합니다.",
  });
  const expertFinding = expertResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_EXPERT_ENDORSEMENT",
  );

  assert.ok(expertFinding);
  assert.ok(
    expertFinding?.citations.some((citation) =>
      citation.label.includes("화장품 표시·광고 관리 지침"),
    ),
  );
  assert.ok(
    expertFinding?.citations.some((citation) =>
      [
        "화장품 광고자문 기준 및 해설서 ② 의료인 등의 추천·보증 등으로 제품의 신뢰와 연관 짓는 표현을 하지 말아야 한다.",
        "화장품 광고자문 기준 및 해설서 - 의사·치과의사·한의사·약사·의료기관 또는 그 밖의 의·약 분야의 전문가가",
      ].some((expectedLabel) => citation.label.includes(expectedLabel)),
    ),
  );

  const testimonialResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "사용자 후기와 before after 사진으로 확인하세요.",
  });
  const testimonialFinding = testimonialResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_TESTIMONIAL_CLAIM",
  );

  assert.ok(testimonialFinding);
  assert.equal(
    testimonialFinding?.citations.some(
      (citation) => citation.sourceId === "mfds-guideline",
    ),
    false,
  );
  assert.ok(
    testimonialFinding?.citations.some((citation) =>
      citation.label.includes("화장품 광고자문 기준 및 해설서 ⑤ 사용 전·후 사진, 사용 후기 인용 시 사실과 다르게 소비자를 오인시키는 광고를 하지 말아야 한다."),
    ),
  );

  const absoluteResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  });
  const absoluteFinding = absoluteResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_ABSOLUTE_CLAIM",
  );

  assert.ok(absoluteFinding);
  assert.equal(
    absoluteFinding?.citations.some(
      (citation) => citation.sourceId === "mfds-guideline",
    ),
    false,
  );
});

test("law snapshot manifests point to synced version files", () => {
  const manifestPaths = [
    "policies/law_snapshots/cosmetics-act/manifest.json",
    "policies/law_snapshots/enforcement-decree/manifest.json",
    "policies/law_snapshots/enforcement-rule/manifest.json",
  ];

  for (const manifestPath of manifestPaths) {
    assert.ok(existsSync(manifestPath));

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      currentVersionTag: string | null;
      versions: Array<{
        versionTag: string;
        metadataPath: string;
        bodyPath: string;
        anchorsPath: string;
        status: "planned" | "synced";
      }>;
    };

    assert.ok(manifest.versions.length >= 1);
    assert.ok(manifest.currentVersionTag);

    for (const version of manifest.versions) {
      assert.ok(existsSync(version.metadataPath));
      assert.ok(existsSync(version.bodyPath));
      assert.ok(existsSync(version.anchorsPath));
      assert.equal(version.status, "synced");
    }
  }
});

test("verified law citation map surfaces exact law anchors", () => {
  const targets = getCuratedLawCitationTargets("cosmetics.medical_claim");

  assert.ok(targets.length >= 2);
  assert.ok(targets.every((target) => target.status === "verified"));
  assert.ok(
    targets.some(
      (target) => target.anchorId === "article-13-paragraph-1-item-1",
    ),
  );

  const result = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "단 7일 만에 기미 치료, 100% 피부 재생을 약속합니다.",
  });

  const medicalFinding = result.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_MEDICAL_CLAIM",
  );

  assert.ok(medicalFinding);
  assert.ok(
    medicalFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제1호",
    ),
  );
  assert.ok(
    medicalFinding?.citations.some(
      (citation) => citation.label === "화장품법 시행규칙 제22조",
    ),
  );
  assert.ok(
    medicalFinding?.citations.some(
      (citation) =>
        citation.label === "화장품법 시행규칙 [별표 5] 제2호 가목",
    ),
  );
  assert.ok(
    medicalFinding?.citations.some((citation) =>
      citation.excerpt.includes("의약품으로 잘못 인식할 우려"),
    ),
  );
  assert.ok(
    medicalFinding?.sourceBindings.some(
      (binding) =>
        binding.sourceId === "mfds-guideline" &&
        binding.role === "agency_guidance" &&
        binding.directlyCited,
    ),
  );
});

test("concept-signal rules surface verified law citations for authority, evidence, comparison, and mismatch", () => {
  const authorityResult = reviewAdCopy({
    productCategory: "cosmetics",
    productKind: "functional",
    functionalCategories: ["hair_loss_relief"],
    adCopy:
      "식약처 인증을 내세운 프리미엄 탈모 샴푸, 공식 허가를 받은 전문 탈모 개선 포뮬러로 매일의 두피 케어를 완성하세요.",
  });
  const authorityFinding = authorityResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_AUTHORITY_CERTIFICATION",
  );

  assert.ok(authorityFinding);
  assert.ok(
    authorityFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    authorityFinding?.citations.some(
      (citation) => citation.label === "화장품법 시행규칙 [별표 5] 제2호 사목",
    ),
  );
  assert.ok(
    authorityFinding?.sourceBindings.some(
      (binding) =>
        binding.sourceId === "cosmetics-act" &&
        binding.role === "statutory_basis" &&
        binding.directlyCited,
    ),
  );

  const evidenceResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "단 2주 만에 수분감 30% 개선. 인체적용시험 완료로 확인된 촉촉한 광채를 경험해보세요.",
  });
  const evidenceFinding = evidenceResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_EVIDENCE_OVERLAY",
  );

  assert.ok(evidenceFinding);
  assert.ok(
    evidenceFinding?.citations.some(
      (citation) => citation.label === "화장품법 제14조제1항",
    ),
  );
  assert.ok(
    evidenceFinding?.citations.some(
      (citation) => citation.label === "화장품법 시행규칙 제23조제2항",
    ),
  );

  const comparisonResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "자사제품 대비 지속력 5배 업그레이드. 타제품 비교 테스트까지 완료한 롱래스팅 포뮬러.",
  });
  const comparisonFinding = comparisonResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_COMPARISON_CLAIM",
  );

  assert.ok(comparisonFinding);
  assert.ok(
    comparisonFinding?.citations.some(
      (citation) => citation.label === "화장품법 제14조제1항",
    ),
  );
  assert.ok(
    comparisonFinding?.citations.some(
      (citation) =>
        citation.label === "화장품법 시행규칙 [별표 5] 제2호 바목",
    ),
  );

  const mismatchResult = reviewAdCopy({
    productCategory: "cosmetics",
    productKind: "functional",
    functionalCategories: ["wrinkle_improvement"],
    adCopy:
      "힘없이 빠지는 모발이 고민이라면, 빠지는 모발을 감소시키고 탈모 증상 완화에 도움을 주는 집중 케어 포뮬러.",
  });
  const mismatchFinding = mismatchResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_FUNCTIONAL_CATEGORY_MISMATCH",
  );

  assert.ok(mismatchFinding);
  assert.ok(
    mismatchFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제2호",
    ),
  );
  assert.ok(
    mismatchFinding?.citations.some(
      (citation) =>
        citation.label === "화장품법 시행규칙 [별표 5] 제2호 나목",
    ),
  );
});

test("surfaced findings keep stable ids while exposing user-facing display order", () => {
  const result = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "매일 빠지는 모발이 신경 쓰인다면, 비오틴 5000mcg 고함량 포뮬러로 두피와 모발에 힘을 더해보세요. 비오틴은 모발 성장에 필수적인 영양소입니다(출처: Journal of Dermatology 2019). 탈모 증상 완화에 도움을 주는 기능성화장품.",
  });

  assert.equal(result.surfacedFindings.length, 3);
  assert.deepEqual(
    result.surfacedFindings.map((finding) => finding.displayOrder),
    [1, 2, 3],
  );
  assert.equal(result.surfacedFindings[0]?.code, "COSMETICS_INGREDIENT_TRANSFER");
  assert.equal(result.surfacedFindings[0]?.id, "finding-2");
  assert.equal(result.surfacedFindings[0]?.displayOrder, 1);
  assert.equal(result.surfacedFindings[1]?.id, "finding-1");
  assert.equal(result.surfacedFindings[1]?.displayOrder, 2);

  const ingredientTransferInAllFindings = result.findings.find(
    (finding) => finding.id === "finding-2",
  );
  const functionalScopeInAllFindings = result.findings.find(
    (finding) => finding.id === "finding-1",
  );

  assert.equal(ingredientTransferInAllFindings?.displayOrder, 1);
  assert.equal(functionalScopeInAllFindings?.displayOrder, 2);
});

test("coverage expansion rules surface grounded citations for side-effect, procedure-like, and skin-age claims", () => {
  const sideEffectResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "부작용이 전혀 없고 사용 초기에 명현현상이 있을 수 있는 집중 진정 크림.",
  });
  const sideEffectFinding = sideEffectResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_SIDE_EFFECT_MISLEADING",
  );

  assert.ok(sideEffectFinding);
  assert.ok(
    sideEffectFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    sideEffectFinding?.citations.some((citation) =>
      ["부작용이 전혀 없다.", "일시적 악화(명현현상)가 있을 수 있다."].some(
        (expectedLabel) => citation.label.includes(expectedLabel),
      ),
    ),
  );

  const procedureResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "바늘처럼 침투하는 마이크로니들 세럼으로 집에서도 MTS 케어를 경험하세요.",
  });
  const procedureFinding = procedureResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_PROCEDURE_LIKE_CLAIM",
  );

  assert.ok(procedureFinding);
  assert.ok(
    procedureFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    procedureFinding?.citations.some((citation) =>
      citation.label.includes("제품 사용방법을 사실과 다르거나 오인할 수 있는 표현"),
    ),
  );

  const skinAgeResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy:
      "피부나이 5세 어려짐을 내세운 탄력 앰플로 더 어려 보이는 인상을 완성하세요.",
  });
  const skinAgeFinding = skinAgeResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_SKIN_AGE_CLAIM",
  );

  assert.ok(skinAgeFinding);
  assert.ok(
    skinAgeFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    skinAgeFinding?.citations.some((citation) =>
      citation.label.includes("피부 나이 n세"),
    ),
  );
});

test("natural, organic, vegan, and ISO index claims surface evidence-oriented grounded findings", () => {
  const naturalOrganicResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "천연화장품으로 소개하는 유기농화장품 크림입니다.",
  });
  const naturalOrganicFinding = naturalOrganicResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_NATURAL_ORGANIC_CLAIM",
  );

  assert.ok(naturalOrganicFinding);
  assert.ok(
    naturalOrganicFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    naturalOrganicFinding?.citations.some((citation) =>
      citation.label.includes("천연화장품 및 유기농화장품 표시"),
    ),
  );

  const veganResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "비건 포뮬러로 완성한 데일리 크림입니다.",
  });
  const veganFinding = veganResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_VEGAN_CLAIM",
  );

  assert.ok(veganFinding);
  assert.ok(
    veganFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    veganFinding?.citations.some((citation) =>
      citation.label.includes("비건 관련 표현"),
    ),
  );

  const isoIndexResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "천연지수 95%(ISO 16128 계산 적용)로 안내하는 보습 크림입니다.",
  });
  const isoIndexFinding = isoIndexResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_ISO_INDEX_CLAIM",
  );

  assert.ok(isoIndexFinding);
  assert.ok(
    isoIndexFinding?.citations.some(
      (citation) => citation.label === "화장품법 제14조제1항",
    ),
  );
  assert.ok(
    isoIndexFinding?.citations.some((citation) =>
      citation.label.includes("ISO 천연ㆍ유기농 지수 표시ㆍ광고"),
    ),
  );
});

test("human-derived biologic claims are flagged while nonhuman-qualified variants pass", () => {
  const stemCellResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "줄기세포 화장품으로 소개하는 집중 보습 크림입니다.",
  });
  const stemCellFinding = stemCellResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_HUMAN_DERIVED_CLAIM",
  );

  assert.ok(stemCellFinding);
  assert.ok(
    stemCellFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    stemCellFinding?.citations.some((citation) =>
      citation.label.includes("인체에서 유래한 줄기세포가 들어 있는 것으로 오인할 수 있는 표현"),
    ),
  );

  const exosomeResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "엑소좀 화장품으로 설명하는 보습 크림입니다.",
  });
  const exosomeFinding = exosomeResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_HUMAN_DERIVED_CLAIM",
  );

  assert.ok(exosomeFinding);
  assert.ok(
    exosomeFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    exosomeFinding?.citations.some((citation) =>
      citation.label.includes("인체에서 유래한 특정성분(엑소좀, 리포좀 등)이 들어 있는 것으로 오인할 수 있 는 표현"),
    ),
  );

  const plantStemCellResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "식물줄기세포 함유 원료를 사용한 보습 크림입니다.",
  });
  assert.ok(
    !plantStemCellResult.surfacedFindings.some(
      (finding) => finding.code === "COSMETICS_HUMAN_DERIVED_CLAIM",
    ),
  );
  assert.equal(plantStemCellResult.verdict, "PASS");

  const milkExosomeResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "우유 엑소좀 원료를 사용한 보습 크림입니다.",
  });
  assert.ok(
    !milkExosomeResult.surfacedFindings.some(
      (finding) => finding.code === "COSMETICS_HUMAN_DERIVED_CLAIM",
    ),
  );
  assert.equal(milkExosomeResult.verdict, "PASS");
});

test("banned-ingredient free claims are prohibited while generic ingredient-free claims stay evidence-oriented", () => {
  const bannedIngredientResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "스테로이드 무첨가 크림으로 소개합니다.",
  });
  const bannedIngredientFinding = bannedIngredientResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_BANNED_INGREDIENT_FREE_CLAIM",
  );

  assert.ok(bannedIngredientFinding);
  assert.ok(
    bannedIngredientFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    bannedIngredientFinding?.citations.some((citation) =>
      citation.label.includes("배합금지 원료를 사용하지 않았다는 표현"),
    ),
  );
  assert.ok(
    !bannedIngredientResult.surfacedFindings.some(
      (finding) => finding.code === "COSMETICS_SPECIFIC_INGREDIENT_FREE_CLAIM",
    ),
  );

  const ingredientFreeResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "무(無) 파라벤 포뮬러로 안내하는 보습 크림입니다.",
  });
  const ingredientFreeFinding = ingredientFreeResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_SPECIFIC_INGREDIENT_FREE_CLAIM",
  );

  assert.ok(ingredientFreeFinding);
  assert.ok(
    ingredientFreeFinding?.citations.some(
      (citation) => citation.label === "화장품법 제14조제1항",
    ),
  );
  assert.ok(
    ingredientFreeFinding?.citations.some((citation) =>
      citation.label.includes("제품에 특정성분이 들어 있지 않다"),
    ),
  );
});

test("patent claims split objective-fact review from efficacy overclaim", () => {
  const patentFactResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "특허 등록 조성물을 적용한 보습 크림입니다.",
  });
  const patentFactFinding = patentFactResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_PATENT_CLAIM",
  );

  assert.ok(patentFactFinding);
  assert.ok(
    patentFactFinding?.citations.some(
      (citation) => citation.label === "화장품법 제14조제1항",
    ),
  );
  assert.ok(
    patentFactFinding?.citations.some((citation) =>
      citation.label.includes("특허 관련 표현 시 객관적 사실에 근거하여 표현하여야 한다"),
    ),
  );

  const patentOverclaimResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "발모 조성물 특허성분을 담은 샴푸입니다.",
  });
  const patentOverclaimFinding = patentOverclaimResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_PATENT_OVERCLAIM",
  );

  assert.ok(patentOverclaimFinding);
  assert.ok(
    patentOverclaimFinding?.citations.some(
      (citation) => citation.label === "화장품법 제13조제1항제4호",
    ),
  );
  assert.ok(
    patentOverclaimFinding?.citations.some((citation) =>
      citation.label.includes("발모 조성물 특허성분"),
    ),
  );
  assert.ok(
    !patentOverclaimResult.surfacedFindings.some(
      (finding) => finding.code === "COSMETICS_PATENT_CLAIM",
    ),
  );
});

test("verified law targets are backed by synced snapshot anchors", () => {
  const manifestBySource = new Map(
    [
      "policies/law_snapshots/cosmetics-act/manifest.json",
      "policies/law_snapshots/enforcement-decree/manifest.json",
      "policies/law_snapshots/enforcement-rule/manifest.json",
    ].map((path) => {
      const manifest = JSON.parse(readFileSync(path, "utf8")) as {
        sourceId: string;
        currentVersionTag: string | null;
        versions: Array<{
          versionTag: string;
          anchorsPath: string;
          status: "planned" | "synced";
        }>;
      };

      return [manifest.sourceId, manifest];
    }),
  );

  for (const ruleId of [
    "cosmetics.medical_claim",
    "cosmetics.functional_scope",
    "cosmetics.functional_category_mismatch",
    "cosmetics.ingredient_transfer",
    "cosmetics.side_effect_misleading",
    "cosmetics.procedure_like_claim",
    "cosmetics.skin_age_claim",
    "cosmetics.natural_organic_claim",
    "cosmetics.vegan_claim",
    "cosmetics.iso_index_claim",
    "cosmetics.human_derived_claim",
    "cosmetics.banned_ingredient_free_claim",
    "cosmetics.specific_ingredient_free_claim",
    "cosmetics.patent_claim",
    "cosmetics.patent_overclaim",
    "cosmetics.authority_certification",
    "cosmetics.absolute_claim",
    "cosmetics.evidence_overlay",
    "cosmetics.comparison_claim",
    "cosmetics.ranking_claim",
    "cosmetics.expert_endorsement",
    "cosmetics.general_misleading",
  ]) {
    for (const target of getCuratedLawCitationTargets(ruleId)) {
      const manifest = manifestBySource.get(target.sourceId);

      assert.ok(manifest);

      const version =
        manifest?.versions.find(
          (candidate) => candidate.versionTag === manifest.currentVersionTag,
        ) ?? manifest?.versions[0];

      assert.ok(version);
      assert.equal(version?.status, "synced");

      const anchorsDoc = JSON.parse(readFileSync(version!.anchorsPath, "utf8")) as {
        anchors: Array<{
          anchorId: string;
          locator: string;
          label: string;
          excerpt: string;
        }>;
      };

      const anchor = anchorsDoc.anchors.find(
        (candidate) => candidate.anchorId === target.anchorId,
      );

      assert.ok(anchor);
      assert.equal(anchor?.locator, target.locator);
      assert.equal(anchor?.label, target.label);
      assert.ok(anchor?.excerpt);
      assert.equal(target.status, "verified");
    }
  }
});

test("ranking and expert rules keep reference ids aligned with surfaced citation sources", () => {
  const rankingResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "국내 1위 베스트 크림입니다.",
  });
  const rankingFinding = rankingResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_RANKING_CLAIM",
  );

  assert.ok(rankingFinding);
  assert.equal(rankingResult.verdict, "WARNING");
  assert.ok(rankingFinding?.citedReferenceIds.includes("enforcement-rule"));
  assert.ok(
    rankingFinding?.sourceBindings.some(
      (binding) =>
        binding.sourceId === "enforcement-rule" &&
        binding.role === "implementing_rule",
    ),
  );

  const expertResult = reviewAdCopy({
    productCategory: "cosmetics",
    adCopy: "전문의 추천 크림으로 소개합니다.",
  });
  const expertFinding = expertResult.surfacedFindings.find(
    (finding) => finding.code === "COSMETICS_EXPERT_ENDORSEMENT",
  );

  assert.ok(expertFinding);
  assert.ok(expertFinding?.citedReferenceIds.includes("cosmetics-act"));
  assert.ok(
    expertFinding?.sourceBindings.some(
      (binding) =>
        binding.sourceId === "cosmetics-act" &&
        binding.role === "statutory_basis",
    ),
  );

  const explanation = explainFinding(
    {
      productCategory: "cosmetics",
      adCopy: "전문의 추천 크림으로 소개합니다.",
    },
    expertFinding?.id ?? "",
  );

  assert.ok(explanation?.sourceTitles.includes("화장품법"));
});

test("dev eval fixtures stay stable across ad-guard-v3 regression samples", () => {
  assertFixtureSetStable("examples/eval/dev-set.json", 10);
});

test("holdout eval fixtures stay stable across representative review cases", () => {
  assertFixtureSetStable("examples/eval/holdout-set.json", 6);
});

test("regression bucket fixtures stay stable across error-oriented review cases", () => {
  const regressionFixtureFiles = readdirSync(REGRESSION_FIXTURE_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  assert.ok(regressionFixtureFiles.length >= 4);

  for (const fileName of regressionFixtureFiles) {
    assertFixtureSetStable(path.join(REGRESSION_FIXTURE_DIR, fileName), 2);
  }
});

test("eval runner supports aggregated regression buckets and bucket selection", () => {
  const regressionStdout = execFileSync(
    process.execPath,
    ["scripts/run_sample_eval.mjs", "--set", "regression"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const bucketStdout = execFileSync(
    process.execPath,
    [
      "scripts/run_sample_eval.mjs",
      "--set",
      "regression",
      "--bucket",
      "evidence-required",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(regressionStdout.includes("[regression:false-negative-guard]"));
  assert.ok(regressionStdout.includes("[regression:false-positive-guard]"));
  assert.ok(regressionStdout.includes("[regression:allowed-functional-copy]"));
  assert.ok(regressionStdout.includes("[regression:evidence-required]"));
  assert.ok(bucketStdout.includes("[regression:evidence-required]"));
  assert.ok(!bucketStdout.includes("[regression:false-negative-guard]"));
});

test("source maintenance audit reports all five grounded sources as ready", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_maintenance.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_maintenance.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Source Maintenance Audit"));
  assert.ok(textStdout.includes("Ready 5/5"));
  assert.ok(textStdout.includes("OK cosmetics-act"));
  assert.ok(textStdout.includes("OK mfds-guideline"));
  assert.ok(jsonStdout.includes('"readySources": 5'));
  assert.ok(jsonStdout.includes('"attentionSources": 0'));
});

test("policy index consistency check validates json indexes against generated runtime module", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_policy_index_consistency.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_policy_index_consistency.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Policy Index Consistency"));
  assert.ok(textStdout.includes("Ready 2/2"));
  assert.ok(textStdout.includes("OK mfds-guideline"));
  assert.ok(textStdout.includes("pageBlockConsistent:"));
  assert.ok(textStdout.includes("semanticConsistent:"));
  assert.ok(jsonStdout.includes('"sourceId": "mfds-guideline"'));
  assert.ok(jsonStdout.includes('"pageBlockConsistent"'));
  assert.ok(jsonStdout.includes('"semanticConsistent"'));
});

test("policy anchor regen diff stays clean when regenerated indexes match committed outputs", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_policy_anchor_regen_diff.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_policy_anchor_regen_diff.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Policy Anchor Regen Diff"));
  assert.ok(textStdout.includes("Ready 2/2"));
  assert.ok(textStdout.includes("Changed source artifacts 0"));
  assert.ok(textStdout.includes("OK mfds-guideline"));
  assert.ok(textStdout.includes("OK kcia-guide"));
  assert.ok(textStdout.includes("OK generated-policy-index-module"));
  assert.ok(textStdout.includes("no regen diff"));
  assert.ok(jsonStdout.includes('"changedSourceArtifacts": 0'));
  assert.ok(jsonStdout.includes('"generatedModuleChanged": false'));
});

test("source integrity drift check validates baseline checksums for grounded assets", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_integrity_drift.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_integrity_drift.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Source Integrity Drift"));
  assert.ok(textStdout.includes("Ready 5/5"));
  assert.ok(textStdout.includes("OK mfds-guideline"));
  assert.ok(textStdout.includes("Artifacts "));
  assert.ok(textStdout.includes("artifact summary: unchanged"));
  assert.ok(textStdout.includes("generated-policy-index-module"));
  assert.ok(jsonStdout.includes('"manifestPath": "policies/source_integrity_manifest.json"'));
  assert.ok(jsonStdout.includes('"readySources": 5'));
  assert.ok(jsonStdout.includes('"attentionSources": 0'));
  assert.ok(jsonStdout.includes('"changedArtifacts": 0'));
  assert.ok(jsonStdout.includes('"missingArtifacts": 0'));
});

test("law snapshot regen diff stays clean when raw-source sync output matches committed files", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_law_snapshot_regen_diff.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_law_snapshot_regen_diff.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Law Snapshot Regen Diff"));
  assert.ok(textStdout.includes("Ready 3/3"));
  assert.ok(textStdout.includes("Changed source artifacts 0"));
  assert.ok(textStdout.includes("OK cosmetics-act"));
  assert.ok(textStdout.includes("OK enforcement-decree"));
  assert.ok(textStdout.includes("OK enforcement-rule"));
  assert.ok(textStdout.includes("no regen diff"));
  assert.ok(jsonStdout.includes('"changedSourceArtifacts": 0'));
  assert.ok(jsonStdout.includes('"sourceId": "cosmetics-act"'));
});

test("source integrity manifest diff stays clean when regenerated baseline matches committed manifest", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_integrity_manifest_diff.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_source_integrity_manifest_diff.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Source Integrity Manifest Diff"));
  assert.ok(textStdout.includes("Ready 5/5"));
  assert.ok(textStdout.includes("Changed sources 0"));
  assert.ok(textStdout.includes("OK cosmetics-act"));
  assert.ok(textStdout.includes("no manifest diff"));
  assert.ok(jsonStdout.includes('"changedSources": 0'));
  assert.ok(jsonStdout.includes('"changedArtifacts": 0'));
  assert.ok(jsonStdout.includes('"addedArtifacts": 0'));
  assert.ok(jsonStdout.includes('"removedArtifacts": 0'));
});

test("grounding maintenance suite aggregates all maintenance checks into one gate", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_grounding_maintenance_suite.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_grounding_maintenance_suite.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Grounding Maintenance Suite"));
  assert.ok(textStdout.includes("Ready 7/7"));
  assert.ok(textStdout.includes("Change summary: policy artifacts 0"));
  assert.ok(textStdout.includes("OK source-maintenance"));
  assert.ok(textStdout.includes("OK policy-index-consistency"));
  assert.ok(textStdout.includes("OK policy-anchor-regen-diff"));
  assert.ok(textStdout.includes("OK law-snapshot-consistency"));
  assert.ok(textStdout.includes("OK law-snapshot-regen-diff"));
  assert.ok(textStdout.includes("OK source-integrity-drift"));
  assert.ok(textStdout.includes("OK source-integrity-manifest-diff"));
  assert.ok(textStdout.includes("summary: Ready 5/5 | Attention 0"));
  assert.ok(textStdout.includes("summary: Ready 2/2 | Attention 0"));
  assert.ok(textStdout.includes("summary: Ready 3/3 | Attention 0"));
  assert.ok(textStdout.includes("diff: Changed source artifacts 0 | Generated module changed 0"));
  assert.ok(textStdout.includes("diff: Changed source artifacts 0"));
  assert.ok(textStdout.includes("diff: Changed artifacts 0 | Missing artifacts 0 | Unchanged artifacts 26"));
  assert.ok(textStdout.includes("diff: Changed sources 0 | Changed artifacts 0 | Added 0 | Removed 0"));
  assert.ok(jsonStdout.includes('"totalChecks": 7'));
  assert.ok(jsonStdout.includes('"readyChecks": 7'));
  assert.ok(jsonStdout.includes('"attentionChecks": 0'));
  assert.ok(jsonStdout.includes('"changeSummary"'));
  assert.ok(jsonStdout.includes('"changedPolicyArtifacts": 0'));
  assert.ok(jsonStdout.includes('"changedLawArtifacts": 0'));
  assert.ok(jsonStdout.includes('"changedRuntimeArtifacts": 0'));
  assert.ok(jsonStdout.includes('"changedManifestSources": 0'));
});

test("law snapshot consistency check validates manifest, metadata, and raw checksum alignment", () => {
  const textStdout = execFileSync(
    process.execPath,
    ["scripts/check_law_snapshot_consistency.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const jsonStdout = execFileSync(
    process.execPath,
    ["scripts/check_law_snapshot_consistency.mjs", "--format", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  assert.ok(textStdout.includes("Law Snapshot Consistency"));
  assert.ok(textStdout.includes("Ready 3/3"));
  assert.ok(textStdout.includes("OK cosmetics-act"));
  assert.ok(textStdout.includes("metadataChecksumMatchesRawArtifacts: ok"));
  assert.ok(jsonStdout.includes('"readySources": 3'));
  assert.ok(jsonStdout.includes('"metadataChecksumMatchesRawArtifacts": true'));
});

test("remote MCP minute rate limit enforces client and global caps", () => {
  const baseState = createEmptyMinuteRateLimitState(1_710_000_000_000);

  const first = applyMinuteRateLimit(baseState, {
    clientKey: "client-a",
    nowMs: 1_710_000_000_000,
    perMinuteLimit: 2,
    globalPerMinuteLimit: 3,
  });
  assert.equal(first.allowed, true);
  assert.equal(first.clientCount, 1);
  assert.equal(first.globalCount, 1);

  const second = applyMinuteRateLimit(first.state, {
    clientKey: "client-a",
    nowMs: 1_710_000_005_000,
    perMinuteLimit: 2,
    globalPerMinuteLimit: 3,
  });
  assert.equal(second.allowed, true);
  assert.equal(second.clientCount, 2);
  assert.equal(second.globalCount, 2);

  const blockedByClient = applyMinuteRateLimit(second.state, {
    clientKey: "client-a",
    nowMs: 1_710_000_010_000,
    perMinuteLimit: 2,
    globalPerMinuteLimit: 3,
  });
  assert.equal(blockedByClient.allowed, false);
  assert.equal(blockedByClient.scope, "client");
  assert.equal(blockedByClient.clientCount, 2);
  assert.equal(blockedByClient.globalCount, 2);

  const third = applyMinuteRateLimit(second.state, {
    clientKey: "client-b",
    nowMs: 1_710_000_015_000,
    perMinuteLimit: 2,
    globalPerMinuteLimit: 3,
  });
  assert.equal(third.allowed, true);
  assert.equal(third.clientCount, 1);
  assert.equal(third.globalCount, 3);

  const blockedByGlobal = applyMinuteRateLimit(third.state, {
    clientKey: "client-c",
    nowMs: 1_710_000_020_000,
    perMinuteLimit: 2,
    globalPerMinuteLimit: 3,
  });
  assert.equal(blockedByGlobal.allowed, false);
  assert.equal(blockedByGlobal.scope, "global");
  assert.equal(blockedByGlobal.globalCount, 3);
});
