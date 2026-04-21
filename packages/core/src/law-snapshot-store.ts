import type {
  LawAnchorRecord,
  LawSnapshotManifest,
  LawSnapshotManifestVersion,
} from "../../shared-types/src/index.js";

import { LAW_SNAPSHOT_ANCHORS } from "./law-snapshot-anchors.generated.js";
import { getLawSnapshotManifest } from "./law-snapshot-manifest.js";

const MANIFEST_PATH_BY_SOURCE_ID: Record<string, string> = {
  "cosmetics-act": "policies/law_snapshots/cosmetics-act/manifest.json",
  "enforcement-decree": "policies/law_snapshots/enforcement-decree/manifest.json",
  "enforcement-rule": "policies/law_snapshots/enforcement-rule/manifest.json",
};

interface LawSnapshotState {
  manifestPath: string;
  manifest: LawSnapshotManifest;
  version: LawSnapshotManifestVersion | null;
  anchors: Map<string, LawAnchorRecord>;
}

const snapshotCache = new Map<string, LawSnapshotState>();

function loadLawSnapshotState(sourceId: string): LawSnapshotState | null {
  const cached = snapshotCache.get(sourceId);

  if (cached) {
    return cached;
  }

  const manifestPath = MANIFEST_PATH_BY_SOURCE_ID[sourceId];
  const manifest = getLawSnapshotManifest(sourceId);

  if (!manifestPath || !manifest) {
    return null;
  }

  const version =
    manifest.versions.find(
      (candidate) => candidate.versionTag === manifest.currentVersionTag,
    ) ?? manifest.versions[0] ?? null;
  const anchors = new Map<string, LawAnchorRecord>(
    (LAW_SNAPSHOT_ANCHORS[sourceId] ?? []).map((anchor) => [anchor.anchorId, anchor]),
  );

  const state = {
    manifestPath,
    manifest,
    version,
    anchors,
  };

  snapshotCache.set(sourceId, state);
  return state;
}

export function getLawSnapshotState(sourceId: string): LawSnapshotState | null {
  return loadLawSnapshotState(sourceId);
}

export function getLawAnchorRecord(
  sourceId: string,
  anchorId: string,
): LawAnchorRecord | null {
  const state = loadLawSnapshotState(sourceId);
  return state?.anchors.get(anchorId) ?? null;
}

export function hasSyncedCurrentLawSnapshot(sourceId: string): boolean {
  const state = loadLawSnapshotState(sourceId);

  if (!state?.version) {
    return false;
  }

  return state.version.status === "synced";
}

export function getLawSnapshotManifestPath(sourceId: string): string | undefined {
  return MANIFEST_PATH_BY_SOURCE_ID[sourceId];
}
