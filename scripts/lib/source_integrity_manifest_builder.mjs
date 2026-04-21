import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const { getSourceManifestEntry } = await import(
  "../../dist/packages/core/src/source-manifest.js"
);
const { LAW_SNAPSHOT_MANIFESTS } = await import(
  "../../dist/packages/core/src/law-snapshot-manifest.js"
);

export const SOURCE_IDS = [
  "cosmetics-act",
  "enforcement-decree",
  "enforcement-rule",
  "mfds-guideline",
  "kcia-guide",
];

export function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function buildArtifact(label, relativePath) {
  const absolutePath = path.resolve(ROOT, relativePath);

  return {
    label,
    path: normalizePath(relativePath),
    sha256: sha256(absolutePath),
  };
}

function buildLawSourceEntry(sourceId) {
  const manifestRecord = LAW_SNAPSHOT_MANIFESTS.find(
    (manifest) => manifest.sourceId === sourceId,
  );

  if (!manifestRecord) {
    throw new Error(`missing law snapshot manifest record for ${sourceId}`);
  }

  const currentVersion =
    manifestRecord.versions.find(
      (version) => version.versionTag === manifestRecord.currentVersionTag,
    ) ?? manifestRecord.versions[0];

  if (!currentVersion) {
    throw new Error(`missing current version for ${sourceId}`);
  }

  const versionDir = path.dirname(currentVersion.bodyPath);
  const artifacts = [
    buildArtifact("snapshot-manifest", `policies/law_snapshots/${sourceId}/manifest.json`),
    buildArtifact("metadata", currentVersion.metadataPath),
    buildArtifact("body", currentVersion.bodyPath),
    buildArtifact("anchors", currentVersion.anchorsPath),
    buildArtifact("raw-body", path.join(versionDir, "body.source.html")),
  ];

  if (sourceId === "enforcement-rule") {
    artifacts.push(
      buildArtifact("appendix-5-pdf", path.join(versionDir, "appendix-5.pdf")),
      buildArtifact("appendix-5-text", path.join(versionDir, "appendix-5.txt")),
    );
  }

  return {
    sourceId,
    kind: "law_snapshot",
    versionTag: manifestRecord.currentVersionTag,
    artifacts,
  };
}

function buildPolicySourceEntry(sourceId) {
  const entry = getSourceManifestEntry(sourceId);
  const artifacts = [
    buildArtifact("local-asset", entry.localArtifactPath),
    buildArtifact("extracted-text", entry.extractedTextPath),
    buildArtifact("page-block-index", entry.citationIndexPath),
    buildArtifact("semantic-index", entry.semanticIndexPath),
  ];

  if (sourceId === "mfds-guideline") {
    artifacts.push(
      buildArtifact(
        "generated-policy-index-module",
        "packages/core/src/policy-anchor-index.generated.ts",
      ),
    );
  }

  return {
    sourceId,
    kind: "policy_asset",
    artifacts,
  };
}

function buildSourceEntry(sourceId) {
  if (
    sourceId === "cosmetics-act" ||
    sourceId === "enforcement-decree" ||
    sourceId === "enforcement-rule"
  ) {
    return buildLawSourceEntry(sourceId);
  }

  return buildPolicySourceEntry(sourceId);
}

export function buildSourceIntegrityManifest() {
  return {
    manifestVersion: 1,
    sources: SOURCE_IDS.map(buildSourceEntry),
  };
}
