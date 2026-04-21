import type {
  ReferenceDocument,
  SelectedReference,
  SourceCorpusEntry,
  SourcePackState,
} from "../../shared-types/src/index.js";

import { REFERENCE_CATALOG } from "./reference-catalog.js";
import {
  getSourceManifestEntry,
  summarizePackCorpusStatus,
} from "./source-manifest.js";

function toCorpusEntry(reference: ReferenceDocument): SourceCorpusEntry {
  const manifest = getSourceManifestEntry(reference.id);

  return {
    id: reference.id,
    title: reference.title,
    authority: reference.authority,
    sourceType: reference.sourceType,
    referencePath: reference.path,
    storageKind: manifest.storageKind,
    syncPolicy: manifest.syncPolicy,
    corpusStatus: manifest.corpusStatus,
    pageCount: manifest.pageCount,
    sourceFileAvailable: manifest.sourceFileAvailable,
    fullTextAvailable: manifest.fullTextAvailable,
    citationIndexAvailable: manifest.citationIndexAvailable,
    runtimeFetchAllowed: manifest.runtimeFetchAllowed,
    officialSourceTracked: manifest.officialSourceTracked,
    localArtifactPath: manifest.localArtifactPath,
    snapshotManifestPath: manifest.snapshotManifestPath,
    extractedTextPath: manifest.extractedTextPath,
    citationIndexPath: manifest.citationIndexPath,
    semanticIndexPath: manifest.semanticIndexPath,
    note: manifest.note,
  };
}

export function loadSourcePack(
  selectedReferences: SelectedReference[] = REFERENCE_CATALOG.map((reference) => ({
    ...reference,
    selectionReasons: ["five-source-core-review"],
  })),
): SourcePackState {
  const entries = selectedReferences.map(toCorpusEntry);
  const stagedFileCount = entries.filter((entry) => entry.sourceFileAvailable).length;
  const fullTextReadyCount = entries.filter((entry) => entry.fullTextAvailable).length;
  const citationReadyCount = entries.filter(
    (entry) => entry.citationIndexAvailable,
  ).length;
  const missingCapabilities = [
    stagedFileCount < entries.length ? "law_snapshot_sync" : null,
    fullTextReadyCount < entries.length ? "full_text_corpus" : null,
    citationReadyCount < entries.length ? "citation_index" : null,
    citationReadyCount < entries.length ? "citation_anchor_resolution" : null,
  ].filter((capability): capability is string => capability !== null);

  return {
    mode: "five_source_core",
    reviewRuntimeMode: "local_corpus_only",
    liveFetchAtReviewTime: false,
    corpusStatus: summarizePackCorpusStatus(entries),
    entries,
    stagedFileCount,
    fullTextReadyCount,
    citationReadyCount,
    missingCapabilities,
  };
}
