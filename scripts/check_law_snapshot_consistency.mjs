#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const { LAW_SNAPSHOT_MANIFESTS } = await import(
  "../dist/packages/core/src/law-snapshot-manifest.js"
);
const { getSourceManifestEntry } = await import(
  "../dist/packages/core/src/source-manifest.js"
);

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

    throw new Error(`unexpected law snapshot consistency argument: ${token}`);
  }

  return { format };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function listRawArtifactPaths(sourceId, version) {
  const versionDir = path.dirname(version.bodyPath);
  const rawPaths = [path.join(versionDir, "body.source.html")];

  if (sourceId === "enforcement-rule") {
    rawPaths.push(
      path.join(versionDir, "appendix-5.pdf"),
      path.join(versionDir, "appendix-5.txt"),
    );
  }

  return rawPaths;
}

function computeChecksum(filePaths) {
  const buffers = filePaths.map((filePath) => readFileSync(filePath));
  return createHash("sha256").update(Buffer.concat(buffers)).digest("hex");
}

function evaluateManifest(manifestRecord) {
  const sourceEntry = getSourceManifestEntry(manifestRecord.sourceId);
  const manifestPath = sourceEntry.snapshotManifestPath;
  const report = {
    sourceId: manifestRecord.sourceId,
    title: manifestRecord.title,
    ready: true,
    currentVersionTag: null,
    rawArtifactPaths: [],
    checks: {
      manifestExists: Boolean(manifestPath && existsSync(manifestPath)),
      exportedCurrentVersionMatches: false,
      currentVersionExists: false,
      currentVersionSynced: false,
      metadataExists: false,
      bodyExists: false,
      anchorsExists: false,
      rawArtifactsExist: false,
      metadataMatchesManifest: false,
      metadataChecksumMatchesRawArtifacts: false,
      anchorsMatchCurrentVersion: false,
      bodyHasContent: false,
      anchorsHaveContent: false,
    },
    missing: [],
  };

  if (!report.checks.manifestExists) {
    report.missing.push({
      checkName: "manifestExists",
      path: manifestPath ?? `(missing manifest path for ${manifestRecord.sourceId})`,
    });
    report.ready = false;
    return report;
  }

  const manifest = readJson(manifestPath);
  report.checks.exportedCurrentVersionMatches =
    manifest.currentVersionTag === manifestRecord.currentVersionTag;

  const currentVersion =
    manifest.versions?.find(
      (version) => version.versionTag === manifest.currentVersionTag,
    ) ?? null;

  report.currentVersionTag = manifest.currentVersionTag ?? null;
  report.checks.currentVersionExists = Boolean(currentVersion);
  report.checks.currentVersionSynced = currentVersion?.status === "synced";

  if (!currentVersion) {
    report.missing.push({
      checkName: "currentVersionExists",
      path: `${manifestPath}#${manifest.currentVersionTag ?? "missing"}`,
    });
    report.ready = false;
    return report;
  }

  report.checks.metadataExists = existsSync(currentVersion.metadataPath);
  report.checks.bodyExists = existsSync(currentVersion.bodyPath);
  report.checks.anchorsExists = existsSync(currentVersion.anchorsPath);

  const rawArtifactPaths = listRawArtifactPaths(
    manifestRecord.sourceId,
    currentVersion,
  );
  report.rawArtifactPaths = rawArtifactPaths;
  report.checks.rawArtifactsExist = rawArtifactPaths.every((filePath) =>
    existsSync(filePath),
  );

  if (!report.checks.metadataExists) {
    report.missing.push({
      checkName: "metadataExists",
      path: currentVersion.metadataPath,
    });
  }

  if (!report.checks.bodyExists) {
    report.missing.push({
      checkName: "bodyExists",
      path: currentVersion.bodyPath,
    });
  }

  if (!report.checks.anchorsExists) {
    report.missing.push({
      checkName: "anchorsExists",
      path: currentVersion.anchorsPath,
    });
  }

  if (!report.checks.rawArtifactsExist) {
    for (const filePath of rawArtifactPaths) {
      if (!existsSync(filePath)) {
        report.missing.push({
          checkName: "rawArtifactsExist",
          path: filePath,
        });
      }
    }
  }

  if (
    report.checks.metadataExists &&
    report.checks.bodyExists &&
    report.checks.anchorsExists
  ) {
    const metadata = readJson(currentVersion.metadataPath);
    const anchorsDoc = readJson(currentVersion.anchorsPath);
    const bodyText = readFileSync(currentVersion.bodyPath, "utf8");

    report.checks.metadataMatchesManifest =
      metadata.sourceId === manifestRecord.sourceId &&
      metadata.title === manifestRecord.title &&
      metadata.officialUrl === manifestRecord.officialUrl &&
      metadata.asOfDate === currentVersion.versionTag;

    report.checks.anchorsMatchCurrentVersion =
      anchorsDoc.sourceId === manifestRecord.sourceId &&
      anchorsDoc.versionTag === currentVersion.versionTag;

    report.checks.bodyHasContent = bodyText.trim().length > 0;
    report.checks.anchorsHaveContent =
      Array.isArray(anchorsDoc.anchors) && anchorsDoc.anchors.length > 0;

    if (report.checks.rawArtifactsExist) {
      report.checks.metadataChecksumMatchesRawArtifacts =
        metadata.checksum === computeChecksum(rawArtifactPaths);
    }
  }

  report.ready = Object.values(report.checks).every(Boolean);
  return report;
}

function summarize(reports) {
  const readyCount = reports.filter((report) => report.ready).length;

  return {
    totalSources: reports.length,
    readySources: readyCount,
    attentionSources: reports.length - readyCount,
  };
}

function printText(summary, reports) {
  console.log("Law Snapshot Consistency");
  console.log("========================");
  console.log(
    `Ready ${summary.readySources}/${summary.totalSources} | Attention ${summary.attentionSources}`,
  );

  for (const report of reports) {
    console.log("");
    console.log(`${report.ready ? "OK" : "ATTN"} ${report.sourceId}`);

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
const reports = LAW_SNAPSHOT_MANIFESTS.map(evaluateManifest);
const summary = summarize(reports);
const payload = { summary, reports };

if (parsed.format === "json") {
  console.log(JSON.stringify(payload, null, 2));
} else {
  printText(summary, reports);
}

if (summary.attentionSources > 0) {
  process.exitCode = 1;
}
