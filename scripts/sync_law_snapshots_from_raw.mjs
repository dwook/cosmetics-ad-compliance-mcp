import { writeFile } from "node:fs/promises";
import {
  LAW_SNAPSHOT_SYNC_SOURCES,
  buildAllSyncedLawSnapshotOutputs,
} from "./lib/law_snapshot_sync_builder.mjs";

async function main() {
  const results = [];

  for (const { source, generated } of await buildAllSyncedLawSnapshotOutputs()) {
    await writeFile(
      source.metadataPath,
      `${JSON.stringify(generated.metadata, null, 2)}\n`,
      "utf8",
    );
    await writeFile(source.bodyPath, generated.bodyText, "utf8");
    await writeFile(
      source.anchorsPath,
      `${JSON.stringify(generated.anchorsDoc, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      source.manifestPath,
      `${JSON.stringify(generated.manifest, null, 2)}\n`,
      "utf8",
    );

    results.push({
      sourceId: source.sourceId,
      anchorCount: generated.anchorsDoc.anchors.length,
    });
  }

  for (const result of results) {
    console.log(`${result.sourceId}: ${result.anchorCount} anchors`);
  }
}

await main();
