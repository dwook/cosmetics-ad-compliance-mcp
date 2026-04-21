import type { LawSnapshotManifest } from "../../shared-types/src/index.js";

export const LAW_SNAPSHOT_MANIFESTS: LawSnapshotManifest[] = [
  {
    sourceId: "cosmetics-act",
    title: "화장품법",
    currentVersionTag: "2026-04-02",
    syncPolicy: "tracked_external_sync",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsId=002015",
    versions: [
      {
        versionTag: "2026-04-02",
        metadataPath:
          "policies/law_snapshots/cosmetics-act/versions/2026-04-02/metadata.json",
        bodyPath:
          "policies/law_snapshots/cosmetics-act/versions/2026-04-02/body.txt",
        anchorsPath:
          "policies/law_snapshots/cosmetics-act/versions/2026-04-02/anchors.json",
        status: "synced",
      },
    ],
  },
  {
    sourceId: "enforcement-decree",
    title: "화장품법 시행령",
    currentVersionTag: "2026-03-10",
    syncPolicy: "tracked_external_sync",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=283963",
    versions: [
      {
        versionTag: "2026-03-10",
        metadataPath:
          "policies/law_snapshots/enforcement-decree/versions/2026-03-10/metadata.json",
        bodyPath:
          "policies/law_snapshots/enforcement-decree/versions/2026-03-10/body.txt",
        anchorsPath:
          "policies/law_snapshots/enforcement-decree/versions/2026-03-10/anchors.json",
        status: "synced",
      },
    ],
  },
  {
    sourceId: "enforcement-rule",
    title: "화장품법 시행규칙",
    currentVersionTag: "2025-08-01",
    syncPolicy: "tracked_external_sync",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
    versions: [
      {
        versionTag: "2025-08-01",
        metadataPath:
          "policies/law_snapshots/enforcement-rule/versions/2025-08-01/metadata.json",
        bodyPath:
          "policies/law_snapshots/enforcement-rule/versions/2025-08-01/body.txt",
        anchorsPath:
          "policies/law_snapshots/enforcement-rule/versions/2025-08-01/anchors.json",
        status: "synced",
      },
    ],
  },
];

export function getLawSnapshotManifest(sourceId: string): LawSnapshotManifest | undefined {
  return LAW_SNAPSHOT_MANIFESTS.find((manifest) => manifest.sourceId === sourceId);
}
