import { readFile } from "node:fs/promises";

const { getCuratedLawCitationTargets } = await import(
  "../dist/packages/core/src/law-citations.js"
);

const RULE_IDS = [
  "cosmetics.medical_claim",
  "cosmetics.functional_scope",
  "cosmetics.ingredient_transfer",
  "cosmetics.absolute_claim",
  "cosmetics.ranking_claim",
  "cosmetics.expert_endorsement",
  "cosmetics.general_misleading",
];

const LAW_SOURCES = [
  {
    sourceId: "cosmetics-act",
    manifestPath: "policies/law_snapshots/cosmetics-act/manifest.json",
  },
  {
    sourceId: "enforcement-decree",
    manifestPath: "policies/law_snapshots/enforcement-decree/manifest.json",
  },
  {
    sourceId: "enforcement-rule",
    manifestPath: "policies/law_snapshots/enforcement-rule/manifest.json",
  },
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadSnapshotState() {
  const snapshotState = new Map();

  for (const source of LAW_SOURCES) {
    const manifest = await readJson(source.manifestPath);
    const versions = new Map();

    for (const version of manifest.versions ?? []) {
      const anchorsDoc = await readJson(version.anchorsPath);
      const anchors = new Map(
        (anchorsDoc.anchors ?? []).map((anchor) => [anchor.anchorId, anchor]),
      );

      versions.set(version.versionTag, {
        status: version.status,
        anchors,
      });
    }

    snapshotState.set(source.sourceId, {
      manifest,
      currentVersionTag: manifest.currentVersionTag ?? null,
      versions,
    });
  }

  return snapshotState;
}

function pickVersion(state, sourceId) {
  const sourceState = state.get(sourceId);

  if (!sourceState) {
    return null;
  }

  const preferredTag =
    sourceState.currentVersionTag ??
    sourceState.manifest.versions?.[0]?.versionTag ??
    null;

  if (!preferredTag) {
    return null;
  }

  return sourceState.versions.get(preferredTag) ?? null;
}

function evaluateTarget(state, ruleId, target) {
  const version = pickVersion(state, target.sourceId);
  const anchor = version?.anchors.get(target.anchorId);

  return {
    ruleId,
    sourceId: target.sourceId,
    anchorId: target.anchorId,
    targetStatus: target.status,
    canPromote:
      target.status === "pending_snapshot" &&
      Boolean(
        version?.status === "synced" &&
          anchor &&
          anchor.locator === target.locator &&
          anchor.label === target.label &&
          anchor.excerpt &&
          (target.discoverySourceUrl || target.note),
      ),
    checks: {
      manifestVersionExists: Boolean(version),
      versionSynced: version?.status === "synced",
      anchorExists: Boolean(anchor),
      locatorMatches: Boolean(anchor && anchor.locator === target.locator),
      labelMatches: Boolean(anchor && anchor.label === target.label),
      excerptPresent: Boolean(anchor?.excerpt),
      discoveryTracked: Boolean(target.discoverySourceUrl || target.note),
    },
  };
}

async function main() {
  const state = await loadSnapshotState();
  const readiness = [];

  for (const ruleId of RULE_IDS) {
    const targets = getCuratedLawCitationTargets(ruleId);

    for (const target of targets) {
      readiness.push(evaluateTarget(state, ruleId, target));
    }
  }

  console.log(JSON.stringify(readiness, null, 2));
}

await main();
