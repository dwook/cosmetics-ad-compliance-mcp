import { mkdir, writeFile } from "node:fs/promises";
import {
  TS_OUTPUT_PATH,
  buildPolicyAnchorIndexes,
} from "./lib/policy_anchor_index_builder.mjs";

async function main() {
  await mkdir("policies/anchor_indexes", { recursive: true });
  const generated = await buildPolicyAnchorIndexes();

  for (const source of generated.sourceOutputs) {
    await writeFile(
      source.pageBlockJsonOutputPath,
      `${JSON.stringify({ sourceId: source.sourceId, anchors: source.pageBlocks }, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      source.semanticJsonOutputPath,
      `${JSON.stringify({ sourceId: source.sourceId, anchors: source.semanticAnchors }, null, 2)}\n`,
      "utf8",
    );
  }

  await writeFile(TS_OUTPUT_PATH, generated.moduleSource, "utf8");
}

await main();
