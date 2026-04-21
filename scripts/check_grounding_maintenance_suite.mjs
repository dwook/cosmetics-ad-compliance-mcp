#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";

const CHECKS = [
  {
    key: "source-maintenance",
    label: "Source Maintenance Audit",
    scriptPath: "scripts/check_source_maintenance.mjs",
  },
  {
    key: "policy-index-consistency",
    label: "Policy Index Consistency",
    scriptPath: "scripts/check_policy_index_consistency.mjs",
  },
  {
    key: "policy-anchor-regen-diff",
    label: "Policy Anchor Regen Diff",
    scriptPath: "scripts/check_policy_anchor_regen_diff.mjs",
  },
  {
    key: "law-snapshot-consistency",
    label: "Law Snapshot Consistency",
    scriptPath: "scripts/check_law_snapshot_consistency.mjs",
  },
  {
    key: "law-snapshot-regen-diff",
    label: "Law Snapshot Regen Diff",
    scriptPath: "scripts/check_law_snapshot_regen_diff.mjs",
  },
  {
    key: "source-integrity-drift",
    label: "Source Integrity Drift",
    scriptPath: "scripts/check_source_integrity_drift.mjs",
  },
  {
    key: "source-integrity-manifest-diff",
    label: "Source Integrity Manifest Diff",
    scriptPath: "scripts/check_source_integrity_manifest_diff.mjs",
  },
];

function parseArgs(argv) {
  const formatIndex = argv.indexOf("--format");
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { format };
}

function tryParseJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function buildCounts(report) {
  if (report?.summary) {
    if (
      typeof report.summary.totalChecks === "number" &&
      typeof report.summary.readyChecks === "number" &&
      typeof report.summary.attentionChecks === "number"
    ) {
      return {
        totalUnits: report.summary.totalChecks,
        readyUnits: report.summary.readyChecks,
        attentionUnits: report.summary.attentionChecks,
      };
    }

    if (
      typeof report.summary.totalSources === "number" &&
      typeof report.summary.readySources === "number" &&
      typeof report.summary.attentionSources === "number"
    ) {
      return {
        totalUnits: report.summary.totalSources,
        readyUnits: report.summary.readySources,
        attentionUnits: report.summary.attentionSources,
      };
    }
  }

  if (Array.isArray(report?.sources)) {
    const readyUnits = report.sources.filter(
      (source) => source.status === "ready" || source.ready === true,
    ).length;

    return {
      totalUnits: report.sources.length,
      readyUnits,
      attentionUnits: report.sources.length - readyUnits,
    };
  }

  return null;
}

function formatUnitSummary(counts) {
  if (!counts) {
    return "Summary unavailable";
  }

  return `Ready ${counts.readyUnits}/${counts.totalUnits} | Attention ${counts.attentionUnits}`;
}

function buildDiffSummary(check) {
  const summary = check.report?.summary;

  switch (check.key) {
    case "policy-anchor-regen-diff":
      if (!summary) {
        return null;
      }
      return `Changed source artifacts ${summary.changedSourceArtifacts} | Generated module changed ${summary.generatedModuleChanged ? 1 : 0}`;
    case "law-snapshot-regen-diff":
      if (!summary) {
        return null;
      }
      return `Changed source artifacts ${summary.changedSourceArtifacts}`;
    case "source-integrity-drift":
      if (!summary) {
        return null;
      }
      return `Changed artifacts ${summary.changedArtifacts} | Missing artifacts ${summary.missingArtifacts} | Unchanged artifacts ${summary.unchangedArtifacts}`;
    case "source-integrity-manifest-diff":
      if (!summary) {
        return null;
      }
      return `Changed sources ${summary.changedSources} | Changed artifacts ${summary.changedArtifacts} | Added ${summary.addedArtifacts} | Removed ${summary.removedArtifacts}`;
    default:
      return null;
  }
}

function buildOverallChangeSummary(checks) {
  const byKey = new Map(checks.map((check) => [check.key, check]));
  const policyRegen = byKey.get("policy-anchor-regen-diff")?.report?.summary;
  const lawRegen = byKey.get("law-snapshot-regen-diff")?.report?.summary;
  const runtimeDrift = byKey.get("source-integrity-drift")?.report?.summary;
  const manifestDiff =
    byKey.get("source-integrity-manifest-diff")?.report?.summary;

  return {
    changedPolicyArtifacts: policyRegen?.changedSourceArtifacts ?? null,
    generatedPolicyModuleChanged:
      typeof policyRegen?.generatedModuleChanged === "boolean"
        ? policyRegen.generatedModuleChanged
        : null,
    changedLawArtifacts: lawRegen?.changedSourceArtifacts ?? null,
    changedRuntimeArtifacts: runtimeDrift?.changedArtifacts ?? null,
    missingRuntimeArtifacts: runtimeDrift?.missingArtifacts ?? null,
    changedManifestSources: manifestDiff?.changedSources ?? null,
    changedManifestArtifacts: manifestDiff?.changedArtifacts ?? null,
    addedManifestArtifacts: manifestDiff?.addedArtifacts ?? null,
    removedManifestArtifacts: manifestDiff?.removedArtifacts ?? null,
  };
}

function runCheck(check) {
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    stdout = execFileSync(
      process.execPath,
      [check.scriptPath, "--format", "json"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
  } catch (error) {
    stdout = typeof error.stdout === "string" ? error.stdout : "";
    stderr = typeof error.stderr === "string" ? error.stderr : "";
    exitCode = typeof error.status === "number" ? error.status : 1;
  }

  const report = tryParseJson(stdout);
  const counts = buildCounts(report);
  const status =
    report && counts && counts.attentionUnits === 0 && exitCode === 0
      ? "ready"
      : "attention";

  return {
    key: check.key,
    label: check.label,
    scriptPath: check.scriptPath,
    status,
    exitCode,
    summaryLine: formatUnitSummary(counts),
    counts,
    diffSummary: null,
    report,
    parseOk: Boolean(report),
    stderr,
  };
}

function formatText(payload) {
  const lines = [
    "Grounding Maintenance Suite",
    "===========================",
    "",
    `Ready ${payload.summary.readyChecks}/${payload.summary.totalChecks} | Attention ${payload.summary.attentionChecks}`,
    `Change summary: policy artifacts ${payload.changeSummary.changedPolicyArtifacts ?? "n/a"}, law artifacts ${payload.changeSummary.changedLawArtifacts ?? "n/a"}, runtime drift ${payload.changeSummary.changedRuntimeArtifacts ?? "n/a"}, runtime missing ${payload.changeSummary.missingRuntimeArtifacts ?? "n/a"}, manifest changed sources ${payload.changeSummary.changedManifestSources ?? "n/a"}`,
  ];

  for (const check of payload.checks) {
    lines.push("");
    lines.push(`${check.status === "ready" ? "OK" : "ATTN"} ${check.key}`);
    lines.push(`  label: ${check.label}`);
    lines.push(`  script: ${check.scriptPath}`);
    lines.push(`  summary: ${check.summaryLine}`);

    if (check.diffSummary) {
      lines.push(`  diff: ${check.diffSummary}`);
    }

    if (!check.parseOk) {
      lines.push("  - parse: fail");
    }

    if (check.exitCode !== 0) {
      lines.push(`  - exitCode: ${check.exitCode}`);
    }
  }

  return lines.join("\n");
}

const { format } = parseArgs(process.argv.slice(2));
const checks = CHECKS.map(runCheck);
for (const check of checks) {
  check.diffSummary = buildDiffSummary(check);
}
const summary = {
  totalChecks: checks.length,
  readyChecks: checks.filter((check) => check.status === "ready").length,
  attentionChecks: checks.filter((check) => check.status === "attention").length,
};
const changeSummary = buildOverallChangeSummary(checks);
const payload = { summary, changeSummary, checks };

if (format === "json") {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(formatText(payload));
}

if (summary.attentionChecks > 0) {
  process.exitCode = 1;
}
