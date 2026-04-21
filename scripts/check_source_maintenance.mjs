#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const { getSourceManifestEntry } = await import(
  "../dist/packages/core/src/source-manifest.js"
);
const { LAW_SNAPSHOT_MANIFESTS } = await import(
  "../dist/packages/core/src/law-snapshot-manifest.js"
);

const REVIEW_SOURCE_IDS = [
  "cosmetics-act",
  "enforcement-decree",
  "enforcement-rule",
  "mfds-guideline",
  "kcia-guide",
];

function parseArgs(argv) {
  let format = "text";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--format") {
      const value = argv[index + 1];

      if (value === "text" || value === "json") {
        format = value;
        index += 1;
        continue;
      }

      throw new Error("--format must be text or json");
    }

    throw new Error(`unexpected maintenance check argument: ${token}`);
  }

  return { format };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pushMissing(report, checkName, path) {
  report.missing.push({ checkName, path });
}

function evaluatePolicySource(sourceId) {
  const entry = getSourceManifestEntry(sourceId);
  const report = {
    sourceId,
    storageKind: entry.storageKind,
    corpusStatus: entry.corpusStatus,
    ready: true,
    checks: {
      localArtifactExists: Boolean(
        entry.localArtifactPath && existsSync(entry.localArtifactPath),
      ),
      extractedTextExists: Boolean(
        entry.extractedTextPath && existsSync(entry.extractedTextPath),
      ),
      citationIndexExists: Boolean(
        entry.citationIndexPath && existsSync(entry.citationIndexPath),
      ),
      semanticIndexExists: Boolean(
        entry.semanticIndexPath && existsSync(entry.semanticIndexPath),
      ),
    },
    missing: [],
  };

  if (!report.checks.localArtifactExists && entry.localArtifactPath) {
    pushMissing(report, "localArtifactExists", entry.localArtifactPath);
  }

  if (!report.checks.extractedTextExists && entry.extractedTextPath) {
    pushMissing(report, "extractedTextExists", entry.extractedTextPath);
  }

  if (!report.checks.citationIndexExists && entry.citationIndexPath) {
    pushMissing(report, "citationIndexExists", entry.citationIndexPath);
  }

  if (!report.checks.semanticIndexExists && entry.semanticIndexPath) {
    pushMissing(report, "semanticIndexExists", entry.semanticIndexPath);
  }

  report.ready = report.missing.length === 0;
  return report;
}

function evaluateLawSource(sourceId) {
  const entry = getSourceManifestEntry(sourceId);
  const manifestRecord = LAW_SNAPSHOT_MANIFESTS.find(
    (manifest) => manifest.sourceId === sourceId,
  );
  const report = {
    sourceId,
    storageKind: entry.storageKind,
    corpusStatus: entry.corpusStatus,
    ready: true,
    checks: {
      snapshotManifestExists: Boolean(
        entry.snapshotManifestPath && existsSync(entry.snapshotManifestPath),
      ),
      currentVersionDefined: false,
      currentVersionSynced: false,
      metadataExists: false,
      bodyExists: false,
      anchorsExists: false,
    },
    currentVersionTag: null,
    missing: [],
  };

  if (!report.checks.snapshotManifestExists && entry.snapshotManifestPath) {
    pushMissing(report, "snapshotManifestExists", entry.snapshotManifestPath);
  }

  const manifestPath = entry.snapshotManifestPath;

  if (manifestPath && existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    const currentVersionTag =
      manifest.currentVersionTag ?? manifestRecord?.currentVersionTag ?? null;
    const currentVersion =
      manifest.versions?.find(
        (version) => version.versionTag === currentVersionTag,
      ) ?? manifest.versions?.[0] ?? null;

    report.currentVersionTag = currentVersion?.versionTag ?? currentVersionTag;
    report.checks.currentVersionDefined = Boolean(currentVersion);
    report.checks.currentVersionSynced = currentVersion?.status === "synced";
    report.checks.metadataExists = Boolean(
      currentVersion?.metadataPath && existsSync(currentVersion.metadataPath),
    );
    report.checks.bodyExists = Boolean(
      currentVersion?.bodyPath && existsSync(currentVersion.bodyPath),
    );
    report.checks.anchorsExists = Boolean(
      currentVersion?.anchorsPath && existsSync(currentVersion.anchorsPath),
    );

    if (!report.checks.currentVersionDefined) {
      pushMissing(report, "currentVersionDefined", manifestPath);
    }

    if (!report.checks.currentVersionSynced && currentVersion) {
      pushMissing(
        report,
        "currentVersionSynced",
        `${manifestPath}#${currentVersion.versionTag}`,
      );
    }

    if (!report.checks.metadataExists && currentVersion?.metadataPath) {
      pushMissing(report, "metadataExists", currentVersion.metadataPath);
    }

    if (!report.checks.bodyExists && currentVersion?.bodyPath) {
      pushMissing(report, "bodyExists", currentVersion.bodyPath);
    }

    if (!report.checks.anchorsExists && currentVersion?.anchorsPath) {
      pushMissing(report, "anchorsExists", currentVersion.anchorsPath);
    }
  }

  report.ready = report.missing.length === 0;
  return report;
}

function evaluateSource(sourceId) {
  if (
    sourceId === "cosmetics-act" ||
    sourceId === "enforcement-decree" ||
    sourceId === "enforcement-rule"
  ) {
    return evaluateLawSource(sourceId);
  }

  return evaluatePolicySource(sourceId);
}

function summarize(reports) {
  const readyCount = reports.filter((report) => report.ready).length;
  const attentionCount = reports.length - readyCount;

  return {
    totalSources: reports.length,
    readySources: readyCount,
    attentionSources: attentionCount,
    lawSources: reports.filter((report) => report.sourceId.includes("rule") || report.sourceId.includes("act") || report.sourceId.includes("decree")).length,
    policySources: reports.filter((report) => report.sourceId.includes("guideline") || report.sourceId.includes("guide")).length,
  };
}

function printTextReport(summary, reports) {
  console.log("Source Maintenance Audit");
  console.log("=======================");
  console.log(
    `Ready ${summary.readySources}/${summary.totalSources} | Attention ${summary.attentionSources}`,
  );

  for (const report of reports) {
    console.log("");
    console.log(`${report.ready ? "OK" : "ATTN"} ${report.sourceId}`);
    console.log(`  storage: ${report.storageKind}`);
    console.log(`  corpus: ${report.corpusStatus}`);

    if (report.currentVersionTag) {
      console.log(`  current version: ${report.currentVersionTag}`);
    }

    for (const [checkName, passed] of Object.entries(report.checks)) {
      console.log(`  - ${checkName}: ${passed ? "ok" : "missing"}`);
    }

    if (report.missing.length > 0) {
      console.log("  missing paths:");
      for (const missing of report.missing) {
        console.log(`    - ${missing.checkName}: ${missing.path}`);
      }
    }
  }
}

const parsed = parseArgs(process.argv.slice(2));
const reports = REVIEW_SOURCE_IDS.map(evaluateSource);
const summary = summarize(reports);
const payload = { summary, reports };

if (parsed.format === "json") {
  console.log(JSON.stringify(payload, null, 2));
} else {
  printTextReport(summary, reports);
}

if (summary.attentionSources > 0) {
  process.exitCode = 1;
}
