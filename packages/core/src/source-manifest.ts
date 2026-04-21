import type {
  SourceCorpusEntry,
  SourceCorpusStatus,
  SourceStorageKind,
  SourceSyncPolicy,
} from "../../shared-types/src/index.js";
import {
  getLawSnapshotManifestPath,
  getLawSnapshotState,
  hasSyncedCurrentLawSnapshot,
} from "./law-snapshot-store.js";

interface SourceManifestRecord {
  storageKind: SourceStorageKind;
  syncPolicy: SourceSyncPolicy;
  corpusStatus: SourceCorpusStatus;
  pageCount?: number;
  sourceFileAvailable: boolean;
  fullTextAvailable: boolean;
  citationIndexAvailable: boolean;
  runtimeFetchAllowed: false;
  officialSourceTracked: boolean;
  localArtifactPath?: string;
  snapshotManifestPath?: string;
  extractedTextPath?: string;
  citationIndexPath?: string;
  semanticIndexPath?: string;
  note: string;
}

export const SOURCE_MANIFEST: Record<string, SourceManifestRecord> = {
  "cosmetics-act": {
    storageKind: "external_manifest",
    syncPolicy: "tracked_external_sync",
    corpusStatus: "reference_card_only",
    sourceFileAvailable: false,
    fullTextAvailable: false,
    citationIndexAvailable: false,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    snapshotManifestPath: "policies/law_snapshots/cosmetics-act/manifest.json",
    note:
      "국가법령정보센터 최신본을 추적하는 source이며, 검수 런타임에서는 외부 fetch를 하지 않습니다. 이후 동기화 시 로컬 snapshot과 조문 anchor를 생성해야 합니다.",
  },
  "enforcement-decree": {
    storageKind: "external_manifest",
    syncPolicy: "tracked_external_sync",
    corpusStatus: "reference_card_only",
    sourceFileAvailable: false,
    fullTextAvailable: false,
    citationIndexAvailable: false,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    snapshotManifestPath: "policies/law_snapshots/enforcement-decree/manifest.json",
    note:
      "국가법령정보센터 최신본을 추적하는 source이며, 검수 런타임에서는 외부 fetch를 하지 않습니다. 시행령 전문과 위임 규정 snapshot 동기화가 필요합니다.",
  },
  "enforcement-rule": {
    storageKind: "external_manifest",
    syncPolicy: "tracked_external_sync",
    corpusStatus: "reference_card_only",
    sourceFileAvailable: false,
    fullTextAvailable: false,
    citationIndexAvailable: false,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    snapshotManifestPath: "policies/law_snapshots/enforcement-rule/manifest.json",
    note:
      "국가법령정보센터 최신본을 추적하는 source이며, 검수 런타임에서는 외부 fetch를 하지 않습니다. 시행규칙 본문과 별표 snapshot 동기화가 필요합니다.",
  },
  "mfds-guideline": {
    storageKind: "local_pdf",
    syncPolicy: "bundled_local_asset",
    corpusStatus: "full_text_ready",
    pageCount: 17,
    sourceFileAvailable: true,
    fullTextAvailable: true,
    citationIndexAvailable: true,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    localArtifactPath: "policies/source_pdfs/mfds-cosmetics-ad-guideline-20250814.pdf",
    extractedTextPath: "policies/extracted_text/mfds-guideline.txt",
    citationIndexPath: "policies/anchor_indexes/mfds-guideline.page-block.json",
    semanticIndexPath: "policies/anchor_indexes/mfds-guideline.semantic.json",
    note:
      "식약처 guideline PDF, 추출 텍스트, page/block citation index와 section-level semantic anchor가 로컬에 있습니다. 표 내부 row-level anchor는 아직 생성되지 않았습니다.",
  },
  "kcia-guide": {
    storageKind: "local_pdf",
    syncPolicy: "bundled_local_asset",
    corpusStatus: "full_text_ready",
    pageCount: 35,
    sourceFileAvailable: true,
    fullTextAvailable: true,
    citationIndexAvailable: true,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    localArtifactPath: "policies/source_pdfs/kcia-advisory-guide-2025.pdf",
    extractedTextPath: "policies/extracted_text/kcia-guide.txt",
    citationIndexPath: "policies/anchor_indexes/kcia-guide.page-block.json",
    semanticIndexPath: "policies/anchor_indexes/kcia-guide.semantic.json",
    note:
      "KCIA 해설서 PDF, 추출 텍스트, page/block citation index와 heading hierarchy semantic anchor가 로컬에 있습니다.",
  },
};

function getLawSnapshotBackedEntry(referenceId: string): SourceManifestRecord | null {
  const manifestPath = getLawSnapshotManifestPath(referenceId);

  if (!manifestPath) {
    return null;
  }

  const synced = hasSyncedCurrentLawSnapshot(referenceId);
  const state = getLawSnapshotState(referenceId);

  if (!synced || !state?.version) {
    return {
      storageKind: "external_manifest",
      syncPolicy: "tracked_external_sync",
      corpusStatus: "reference_card_only",
      sourceFileAvailable: false,
      fullTextAvailable: false,
      citationIndexAvailable: false,
      runtimeFetchAllowed: false,
      officialSourceTracked: true,
      snapshotManifestPath: manifestPath,
      note:
        "국가법령정보센터 최신본을 추적하는 source이며, 검수 런타임에서는 외부 fetch를 하지 않습니다. 로컬 snapshot이 준비되면 runtime은 그 snapshot만 읽습니다.",
    };
  }

  return {
    storageKind: "local_snapshot",
    syncPolicy: "tracked_external_sync",
    corpusStatus: "full_text_ready",
    sourceFileAvailable: true,
    fullTextAvailable: true,
    citationIndexAvailable: true,
    runtimeFetchAllowed: false,
    officialSourceTracked: true,
    localArtifactPath: state.version.bodyPath,
    snapshotManifestPath: manifestPath,
    extractedTextPath: state.version.bodyPath,
    citationIndexPath: state.version.anchorsPath,
    note:
      "국가법령정보센터 공식 원본 payload를 로컬 snapshot으로 동기화한 상태입니다. review 런타임은 현재 version의 body/anchors만 읽습니다.",
  };
}

export function getSourceManifestEntry(referenceId: string): SourceManifestRecord {
  const lawSnapshotEntry = getLawSnapshotBackedEntry(referenceId);

  if (lawSnapshotEntry) {
    return lawSnapshotEntry;
  }

  return (
    SOURCE_MANIFEST[referenceId] ?? {
      storageKind: "external_manifest",
      syncPolicy: "tracked_external_sync",
      corpusStatus: "reference_card_only",
      sourceFileAvailable: false,
      fullTextAvailable: false,
      citationIndexAvailable: false,
      runtimeFetchAllowed: false,
      officialSourceTracked: true,
      note:
        "source manifest가 아직 정의되지 않았습니다. 기본값은 external tracking + local sync pending으로 처리됩니다.",
    }
  );
}

export function summarizePackCorpusStatus(
  entries: SourceCorpusEntry[],
): SourceCorpusStatus {
  const priority: Record<SourceCorpusStatus, number> = {
    reference_card_only: 0,
    source_file_staged: 1,
    full_text_ingested: 2,
    full_text_ready: 3,
  };

  return entries.reduce<SourceCorpusStatus>((lowest, entry) => {
    return priority[entry.corpusStatus] < priority[lowest]
      ? entry.corpusStatus
      : lowest;
  }, "full_text_ready");
}
