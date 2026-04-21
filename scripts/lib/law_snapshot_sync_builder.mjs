import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const PARAGRAPH_MARKERS = new Map([
  ["①", 1],
  ["②", 2],
  ["③", 3],
  ["④", 4],
  ["⑤", 5],
  ["⑥", 6],
  ["⑦", 7],
  ["⑧", 8],
  ["⑨", 9],
  ["⑩", 10],
]);

const SUBITEM_MARKERS = new Map([
  ["가", "ga"],
  ["나", "na"],
  ["다", "da"],
  ["라", "ra"],
  ["마", "ma"],
  ["바", "ba"],
  ["사", "sa"],
  ["아", "a"],
  ["자", "ja"],
  ["차", "cha"],
  ["카", "ka"],
  ["타", "ta"],
  ["파", "pa"],
  ["하", "ha"],
]);

export const LAW_SNAPSHOT_SYNC_SOURCES = [
  {
    sourceId: "cosmetics-act",
    title: "화장품법",
    versionTag: "2026-04-02",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsId=002015",
    manifestPath: "policies/law_snapshots/cosmetics-act/manifest.json",
    metadataPath:
      "policies/law_snapshots/cosmetics-act/versions/2026-04-02/metadata.json",
    bodyPath:
      "policies/law_snapshots/cosmetics-act/versions/2026-04-02/body.txt",
    anchorsPath:
      "policies/law_snapshots/cosmetics-act/versions/2026-04-02/anchors.json",
    rawHtmlPath:
      "policies/law_snapshots/cosmetics-act/versions/2026-04-02/body.source.html",
    appendices: [],
  },
  {
    sourceId: "enforcement-decree",
    title: "화장품법 시행령",
    versionTag: "2026-03-10",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=283963",
    manifestPath: "policies/law_snapshots/enforcement-decree/manifest.json",
    metadataPath:
      "policies/law_snapshots/enforcement-decree/versions/2026-03-10/metadata.json",
    bodyPath:
      "policies/law_snapshots/enforcement-decree/versions/2026-03-10/body.txt",
    anchorsPath:
      "policies/law_snapshots/enforcement-decree/versions/2026-03-10/anchors.json",
    rawHtmlPath:
      "policies/law_snapshots/enforcement-decree/versions/2026-03-10/body.source.html",
    appendices: [],
  },
  {
    sourceId: "enforcement-rule",
    title: "화장품법 시행규칙",
    versionTag: "2025-08-01",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
    manifestPath: "policies/law_snapshots/enforcement-rule/manifest.json",
    metadataPath:
      "policies/law_snapshots/enforcement-rule/versions/2025-08-01/metadata.json",
    bodyPath:
      "policies/law_snapshots/enforcement-rule/versions/2025-08-01/body.txt",
    anchorsPath:
      "policies/law_snapshots/enforcement-rule/versions/2025-08-01/anchors.json",
    rawHtmlPath:
      "policies/law_snapshots/enforcement-rule/versions/2025-08-01/body.source.html",
    appendices: [
      {
        appendixId: "appendix-5",
        title: "[별표 5] 화장품 표시ㆍ광고의 범위 및 준수사항(제22조 관련)",
        pdfPath:
          "policies/law_snapshots/enforcement-rule/versions/2025-08-01/appendix-5.pdf",
        textPath:
          "policies/law_snapshots/enforcement-rule/versions/2025-08-01/appendix-5.txt",
      },
    ],
  },
];

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanHtmlText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "$1")
      .replace(/<input[^>]*>/gi, "")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseDate(text) {
  const match = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function getInputValue(html, id) {
  const match = html.match(
    new RegExp(`<input[^>]+id="${id}"[^>]+value="([^"]*)"`, "i"),
  );

  return match?.[1] ?? null;
}

function getSubtitleText(html) {
  const match = html.match(/<div class="ct_sub">\s*<span>([\s\S]*?)<\/span>\s*<\/div>/i);
  return match ? cleanHtmlText(match[1]) : "";
}

function toArticleBase(articleLocator) {
  const match = articleLocator.match(/^제(\d+)조(?:의(\d+))?$/);

  if (!match) {
    return null;
  }

  return match[2] ? `article-${match[1]}-${match[2]}` : `article-${match[1]}`;
}

function normalizeItemToken(token) {
  return token.replace(/의/g, "-");
}

function extractStructuredParagraphs(html) {
  const matches = html.matchAll(/<p class="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g);
  const lines = [];

  for (const [, className, content] of matches) {
    if (!(className === "gtit" || className.startsWith("pty"))) {
      continue;
    }

    const text = cleanHtmlText(content);

    if (!text) {
      continue;
    }

    lines.push({ className, text });
  }

  return lines;
}

function appendBodyLine(target, text) {
  if (text) {
    target.push(text);
  }
}

function pushAnchor(target, anchor) {
  if (!target.some((candidate) => candidate.anchorId === anchor.anchorId)) {
    target.push(anchor);
  }
}

function maybeCreateParagraphAnchor({
  text,
  sourceTitle,
  currentArticleId,
  currentArticleLocator,
  anchors,
}) {
  const match = text.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/);

  if (!match || !currentArticleId || !currentArticleLocator) {
    return null;
  }

  const paragraphNumber = PARAGRAPH_MARKERS.get(match[1]);

  if (!paragraphNumber) {
    return null;
  }

  const anchorId = `${currentArticleId}-paragraph-${paragraphNumber}`;
  const locator = `${currentArticleLocator}제${paragraphNumber}항`;

  pushAnchor(anchors, {
    anchorId,
    kind: "paragraph",
    locator,
    label: `${sourceTitle} ${locator}`,
    excerpt: text,
    parentAnchorId: currentArticleId,
  });

  return {
    paragraphId: anchorId,
    paragraphNumber,
  };
}

function buildMainLawSnapshot(html, sourceTitle) {
  const lines = extractStructuredParagraphs(html);
  const bodyLines = [];
  const anchors = [];

  let currentArticleId = null;
  let currentArticleLocator = null;
  let currentParagraphId = null;
  let currentParagraphNumber = null;
  let currentItemId = null;

  for (const line of lines) {
    appendBodyLine(bodyLines, line.text);

    if (line.className === "gtit") {
      currentItemId = null;
      continue;
    }

    if (line.className === "pty1_p4") {
      const articleMatch = line.text.match(
        /^(제\d+조(?:의\d+)?)(?:\(([^)]+)\))?\s*(.*)$/,
      );

      if (!articleMatch) {
        currentItemId = null;
        continue;
      }

      currentArticleLocator = articleMatch[1];
      currentArticleId = toArticleBase(currentArticleLocator);
      currentParagraphId = null;
      currentParagraphNumber = null;
      currentItemId = null;

      if (currentArticleId) {
        pushAnchor(anchors, {
          anchorId: currentArticleId,
          kind: "article",
          locator: currentArticleLocator,
          label: `${sourceTitle} ${currentArticleLocator}`,
          excerpt: line.text,
        });
      }

      const remainder = articleMatch[3]?.trim() ?? "";
      const paragraph = maybeCreateParagraphAnchor({
        text: remainder,
        sourceTitle,
        currentArticleId,
        currentArticleLocator,
        anchors,
      });

      if (paragraph) {
        currentParagraphId = paragraph.paragraphId;
        currentParagraphNumber = paragraph.paragraphNumber;
      }

      continue;
    }

    if (line.className === "pty1_de2_1") {
      const paragraph = maybeCreateParagraphAnchor({
        text: line.text,
        sourceTitle,
        currentArticleId,
        currentArticleLocator,
        anchors,
      });

      if (paragraph) {
        currentParagraphId = paragraph.paragraphId;
        currentParagraphNumber = paragraph.paragraphNumber;
        currentItemId = null;
      }

      continue;
    }

    if (line.className === "pty1_de2h") {
      const itemMatch = line.text.match(/^(\d+(?:의\d+)?)\.\s*(.+)$/);

      if (!itemMatch || !currentArticleId || !currentArticleLocator) {
        currentItemId = null;
        continue;
      }

      const normalizedItem = normalizeItemToken(itemMatch[1]);
      const parentAnchorId = currentParagraphId ?? currentArticleId;
      const locator =
        currentParagraphNumber != null
          ? `${currentArticleLocator}제${currentParagraphNumber}항제${itemMatch[1]}호`
          : `${currentArticleLocator}제${itemMatch[1]}호`;
      const anchorId =
        currentParagraphNumber != null
          ? `${currentArticleId}-paragraph-${currentParagraphNumber}-item-${normalizedItem}`
          : `${currentArticleId}-item-${normalizedItem}`;

      pushAnchor(anchors, {
        anchorId,
        kind: "item",
        locator,
        label: `${sourceTitle} ${locator}`,
        excerpt: line.text,
        parentAnchorId,
      });

      currentItemId = anchorId;
      continue;
    }

    if (line.className === "pty1_de3") {
      const subitemMatch = line.text.match(/^([가나다라마바사아자차카타파하])\.\s*(.+)$/);

      if (!subitemMatch || !currentItemId) {
        continue;
      }

      const suffix = SUBITEM_MARKERS.get(subitemMatch[1]);

      if (!suffix) {
        continue;
      }

      const parent = anchors.find((anchor) => anchor.anchorId === currentItemId);

      if (!parent) {
        continue;
      }

      pushAnchor(anchors, {
        anchorId: `${currentItemId}-subitem-${suffix}`,
        kind: "subitem",
        locator: `${parent.locator} ${subitemMatch[1]}목`,
        label: `${sourceTitle} ${parent.locator} ${subitemMatch[1]}목`,
        excerpt: line.text,
        parentAnchorId: currentItemId,
      });
    }
  }

  return {
    bodyText: `${bodyLines.join("\n")}\n`,
    anchors,
  };
}

function buildAppendixAnchors(sourceTitle, appendixId, text) {
  const anchors = [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\f/g, "").replace(/\s+$/g, ""));

  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const titleLine = nonEmptyLines[1]?.trim() ?? "";

  pushAnchor(anchors, {
    anchorId: appendixId,
    kind: "appendix",
    locator: "[별표 5]",
    label: `${sourceTitle} [별표 5]`,
    excerpt: `${nonEmptyLines[0]?.trim() ?? ""}\n${titleLine}`.trim(),
  });

  let currentItem = null;
  let currentSubitem = null;

  for (const rawLine of lines) {
    const line = rawLine.trimStart();

    if (!line) {
      continue;
    }

    const itemMatch = line.match(/^(\d+)\.\s*(.+)$/);

    if (itemMatch) {
      currentSubitem = null;
      currentItem = {
        anchorId: `${appendixId}-item-${itemMatch[1]}`,
        kind: "appendix_item",
        locator: `[별표 5] 제${itemMatch[1]}호`,
        label: `${sourceTitle} [별표 5] 제${itemMatch[1]}호`,
        excerpt: line,
        parentAnchorId: appendixId,
      };
      pushAnchor(anchors, currentItem);
      continue;
    }

    const subitemMatch = line.match(/^([가나다라마바사아자차카타파하])\.\s*(.+)$/);

    if (subitemMatch && currentItem) {
      const suffix = SUBITEM_MARKERS.get(subitemMatch[1]);

      if (!suffix) {
        continue;
      }

      currentSubitem = {
        anchorId: `${currentItem.anchorId}-subitem-${suffix}`,
        kind: "subitem",
        locator: `${currentItem.locator} ${subitemMatch[1]}목`,
        label: `${sourceTitle} ${currentItem.locator} ${subitemMatch[1]}목`,
        excerpt: line,
        parentAnchorId: currentItem.anchorId,
      };
      pushAnchor(anchors, currentSubitem);
      continue;
    }

    if (currentSubitem) {
      currentSubitem.excerpt += `\n${line}`;
      continue;
    }

    if (currentItem) {
      currentItem.excerpt += `\n${line}`;
    }
  }

  return anchors;
}

async function buildMetadata(source, rawHtml, rawBuffers) {
  const subtitle = getSubtitleText(rawHtml);
  const effectiveDate = parseDate(subtitle) ?? source.versionTag;
  const promulgationMatch = subtitle.match(/제(\d+)호/);

  return {
    sourceId: source.sourceId,
    title: getInputValue(rawHtml, "lsNm") ?? source.title,
    authority: "국가법령정보센터",
    officialUrl: source.officialUrl,
    asOfDate: source.versionTag,
    effectiveDate,
    syncedAt: "2026-04-18",
    lawId: getInputValue(rawHtml, "lsId"),
    lsiSeq: getInputValue(rawHtml, "lsiSeq"),
    promulgationNo: promulgationMatch?.[1] ?? null,
    checksum: createHash("sha256")
      .update(Buffer.concat(rawBuffers))
      .digest("hex"),
  };
}

export async function buildSyncedLawSnapshotOutput(source) {
  const rawHtml = await readFile(source.rawHtmlPath, "utf8");
  const rawBuffers = [await readFile(source.rawHtmlPath)];
  const main = buildMainLawSnapshot(rawHtml, source.title);
  const bodyParts = [main.bodyText.trimEnd()];
  const anchors = [...main.anchors];

  for (const appendix of source.appendices) {
    const appendixText = await readFile(appendix.textPath, "utf8");
    bodyParts.push(appendixText.trimEnd());
    rawBuffers.push(await readFile(appendix.pdfPath));
    rawBuffers.push(Buffer.from(appendixText, "utf8"));
    anchors.push(
      ...buildAppendixAnchors(source.title, appendix.appendixId, appendixText),
    );
  }

  const metadata = await buildMetadata(source, rawHtml, rawBuffers);
  const manifest = JSON.parse(await readFile(source.manifestPath, "utf8"));

  manifest.currentVersionTag = source.versionTag;
  manifest.versions = (manifest.versions ?? []).map((version) =>
    version.versionTag === source.versionTag
      ? { ...version, status: "synced" }
      : version,
  );

  return {
    sourceId: source.sourceId,
    versionTag: source.versionTag,
    metadata,
    bodyText: `${bodyParts.join("\n\n").trimEnd()}\n`,
    anchorsDoc: {
      sourceId: source.sourceId,
      versionTag: source.versionTag,
      anchors,
    },
    manifest,
  };
}

export async function buildAllSyncedLawSnapshotOutputs() {
  const outputs = [];

  for (const source of LAW_SNAPSHOT_SYNC_SOURCES) {
    outputs.push({
      source,
      generated: await buildSyncedLawSnapshotOutput(source),
    });
  }

  return outputs;
}
