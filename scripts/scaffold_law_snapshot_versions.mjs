import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const LAW_SNAPSHOTS_ROOT = "policies/law_snapshots";

function createMetadataTemplate(manifest, version) {
  const url = manifest.officialUrl;
  const isLawIdSource = url.includes("lsId=");
  const lawId = isLawIdSource ? url.split("lsId=")[1] ?? null : null;
  const lsiSeq = url.includes("lsiSeq=") ? url.split("lsiSeq=")[1] ?? null : null;

  return {
    sourceId: manifest.sourceId,
    title: manifest.title,
    authority: "국가법령정보센터",
    officialUrl: manifest.officialUrl,
    asOfDate: version.versionTag,
    effectiveDate: null,
    syncedAt: null,
    lawId,
    lsiSeq,
    promulgationNo: null,
    checksum: null,
  };
}

async function ensureFile(path, content) {
  try {
    await readFile(path, "utf8");
  } catch {
    await writeFile(path, content, "utf8");
  }
}

async function main() {
  const entries = await readdir(LAW_SNAPSHOTS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = `${LAW_SNAPSHOTS_ROOT}/${entry.name}/manifest.json`;
    const manifestText = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestText);

    for (const version of manifest.versions ?? []) {
      const metadataPath = version.metadataPath;
      const bodyPath = version.bodyPath;
      const anchorsPath = version.anchorsPath;

      await mkdir(bodyPath.split("/").slice(0, -1).join("/"), { recursive: true });

      await ensureFile(
        metadataPath,
        `${JSON.stringify(createMetadataTemplate(manifest, version), null, 2)}\n`,
      );
      await ensureFile(
        bodyPath,
        "PLANNED SNAPSHOT PLACEHOLDER.\nLaw body has not been synced yet.\n",
      );
      await ensureFile(
        anchorsPath,
        `${JSON.stringify({ sourceId: manifest.sourceId, anchors: [] }, null, 2)}\n`,
      );
    }
  }
}

await main();
