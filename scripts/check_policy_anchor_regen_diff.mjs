#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  POLICY_SOURCES,
  TS_OUTPUT_PATH,
  buildPolicyAnchorIndexes,
} from "./lib/policy_anchor_index_builder.mjs";

const ROOT = process.cwd();

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function readText(relativePath) {
  return readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function evaluateSource(source, generatedBySource) {
  const committedPageBlock = readJson(source.pageBlockJsonOutputPath);
  const committedSemantic = readJson(source.semanticJsonOutputPath);
  const generated = generatedBySource.get(source.sourceId);

  const changes = [];

  if (
    committedPageBlock.sourceId !== source.sourceId ||
    JSON.stringify(committedPageBlock.anchors ?? []) !==
      JSON.stringify(generated.pageBlocks)
  ) {
    changes.push({
      kind: "changed",
      artifact: "page-block-index",
      path: source.pageBlockJsonOutputPath,
      committedCount: (committedPageBlock.anchors ?? []).length,
      generatedCount: generated.pageBlocks.length,
    });
  }

  if (
    committedSemantic.sourceId !== source.sourceId ||
    JSON.stringify(committedSemantic.anchors ?? []) !==
      JSON.stringify(generated.semanticAnchors)
  ) {
    changes.push({
      kind: "changed",
      artifact: "semantic-index",
      path: source.semanticJsonOutputPath,
      committedCount: (committedSemantic.anchors ?? []).length,
      generatedCount: generated.semanticAnchors.length,
    });
  }

  return {
    sourceId: source.sourceId,
    status: changes.length === 0 ? "ready" : "attention",
    changes,
  };
}

function formatText(report) {
  const lines = [
    "Policy Anchor Regen Diff",
    "========================",
    "",
    `Ready ${report.summary.readySources}/${report.summary.totalSources} | Attention ${report.summary.attentionSources}`,
    `Changed source artifacts ${report.summary.changedSourceArtifacts} | Generated module changed ${report.summary.generatedModuleChanged ? 1 : 0}`,
  ];

  for (const source of report.sources) {
    lines.push("");
    lines.push(`${source.status === "ready" ? "OK" : "ATTN"} ${source.sourceId}`);

    if (source.changes.length === 0) {
      lines.push("  - no regen diff");
      continue;
    }

    for (const change of source.changes) {
      lines.push(
        `  - changed ${change.artifact}: ${change.path} (${change.committedCount} -> ${change.generatedCount})`,
      );
    }
  }

  lines.push("");
  lines.push(
    `${report.generatedModule.status === "ready" ? "OK" : "ATTN"} generated-policy-index-module`,
  );
  lines.push(
    report.generatedModule.status === "ready"
      ? "  - no regen diff"
      : `  - changed module: ${report.generatedModule.path}`,
  );

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const generated = await buildPolicyAnchorIndexes();
const generatedBySource = new Map(
  generated.sourceOutputs.map((source) => [source.sourceId, source]),
);
const sources = POLICY_SOURCES.map((source) =>
  evaluateSource(source, generatedBySource),
);
const committedModuleSource = readText(TS_OUTPUT_PATH);
const generatedModuleChanged = committedModuleSource !== generated.moduleSource;
const summary = {
  totalSources: sources.length,
  readySources: sources.filter((source) => source.status === "ready").length,
  attentionSources: sources.filter((source) => source.status === "attention").length,
  changedSourceArtifacts: sources.reduce(
    (sum, source) => sum + source.changes.length,
    0,
  ),
  generatedModuleChanged,
};
const report = {
  summary,
  sources,
  generatedModule: {
    status: generatedModuleChanged ? "attention" : "ready",
    path: TS_OUTPUT_PATH,
  },
};

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatText(report));
}

if (summary.attentionSources > 0 || generatedModuleChanged) {
  process.exitCode = 1;
}
