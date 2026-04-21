import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIST_MODULE_PATH = path.resolve(
  ROOT,
  "dist/packages/core/src/policy-anchor-index.generated.js",
);

const { POLICY_PAGE_BLOCK_INDEX, POLICY_SEMANTIC_INDEX } = await import(
  `file://${DIST_MODULE_PATH}`
);

const SOURCE_IDS = ["mfds-guideline", "kcia-guide"];

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function readJson(relativePath) {
  const absolutePath = path.resolve(ROOT, relativePath);

  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function buildSourceReport(sourceId) {
  const pageBlockPath = `policies/anchor_indexes/${sourceId}.page-block.json`;
  const semanticPath = `policies/anchor_indexes/${sourceId}.semantic.json`;
  const pageBlockFile = readJson(pageBlockPath);
  const semanticFile = readJson(semanticPath);
  const pageBlockAnchors = pageBlockFile.anchors ?? [];
  const semanticAnchors = semanticFile.anchors ?? [];
  const generatedPageBlocks = POLICY_PAGE_BLOCK_INDEX[sourceId] ?? [];
  const generatedSemantic = POLICY_SEMANTIC_INDEX[sourceId] ?? [];

  const pageBlockConsistent =
    pageBlockFile.sourceId === sourceId &&
    JSON.stringify(pageBlockAnchors) === JSON.stringify(generatedPageBlocks);
  const semanticConsistent =
    semanticFile.sourceId === sourceId &&
    JSON.stringify(semanticAnchors) === JSON.stringify(generatedSemantic);

  const checks = [
    {
      key: "pageBlockConsistent",
      ok: pageBlockConsistent,
      detail: `${pageBlockAnchors.length} page-block anchors match generated module`,
    },
    {
      key: "semanticConsistent",
      ok: semanticConsistent,
      detail: `${semanticAnchors.length} semantic anchors match generated module`,
    },
  ];

  return {
    sourceId,
    status: checks.every((check) => check.ok) ? "ready" : "attention",
    pageBlockPath,
    semanticPath,
    checks,
  };
}

function formatText(report) {
  const readyCount = report.sources.filter((source) => source.status === "ready").length;
  const attentionCount = report.sources.length - readyCount;
  const lines = [
    "Policy Index Consistency",
    "========================",
    "",
    `Ready ${readyCount}/${report.sources.length} | Attention ${attentionCount}`,
  ];

  for (const source of report.sources) {
    lines.push("");
    lines.push(
      `${source.status === "ready" ? "OK" : "ATTN"} ${source.sourceId}`,
    );

    for (const check of source.checks) {
      lines.push(
        `  - ${check.ok ? "pass" : "fail"} ${check.key}: ${check.detail}`,
      );
    }
  }

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const sources = SOURCE_IDS.map(buildSourceReport);
const report = {
  generatedModulePath: DIST_MODULE_PATH,
  sources,
};

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatText(report));
}
