import { readFile } from "node:fs/promises";

export const POLICY_SOURCES = [
  {
    sourceId: "mfds-guideline",
    title: "화장품 표시·광고 관리 지침",
    inputPath: "policies/extracted_text/mfds-guideline.txt",
    pageBlockJsonOutputPath: "policies/anchor_indexes/mfds-guideline.page-block.json",
    semanticJsonOutputPath: "policies/anchor_indexes/mfds-guideline.semantic.json",
    semanticStrategy: "mfds",
  },
  {
    sourceId: "kcia-guide",
    title: "화장품 광고자문 기준 및 해설서",
    inputPath: "policies/extracted_text/kcia-guide.txt",
    pageBlockJsonOutputPath: "policies/anchor_indexes/kcia-guide.page-block.json",
    semanticJsonOutputPath: "policies/anchor_indexes/kcia-guide.semantic.json",
    semanticStrategy: "kcia",
  },
];

export const TS_OUTPUT_PATH = "packages/core/src/policy-anchor-index.generated.ts";

const NOISE_LINE_PATTERN = /^- \d+ -$/u;
const ROMAN_HEADING_PATTERN = /^(?:[IVX]+|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+)\.\s+/u;
const NUMERIC_HEADING_PATTERN = /^\d+\.\s+/u;
const PAREN_HEADING_PATTERN = /^\(\d+\)\s+/u;
const CIRCLED_HEADING_PATTERN = /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*/u;
const BOX_HEADING_PATTERN = /^□\s+/u;
const APPENDIX_HEADING_PATTERN = /^\[별표\s*\d+\]/u;
const KCIA_CRITERIA_PATTERN = /^\s*/u;
const BULLET_PATTERN = /^[∙-]\s+/u;
const MFDS_BODY_START_PATTERN = /^I\.\s+목적$/u;
const MFDS_LAW_BOX_PATTERN =
  /^□\s+화장품법\s+제\d+조(?:\s+제\d+항)?(?:\s+제\d+호)?\s+관련$/u;

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function collapsePreview(text, limit = 220) {
  const collapsed = text.replace(/\s+/g, " ").trim();

  if (collapsed.length <= limit) {
    return collapsed;
  }

  return `${collapsed.slice(0, limit - 3)}...`;
}

function splitPages(rawText) {
  return rawText
    .replace(/\r/g, "")
    .split("\f")
    .map((pageText, pageIndex) => ({
      pageNumber: pageIndex + 1,
      lines: pageText.split("\n").map(normalizeLine),
    }));
}

function buildPageBlockAnchors(source, pages) {
  return pages.flatMap((page) => {
    const blocks = [];
    let currentBlock = [];

    for (const line of page.lines) {
      if (!line) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join(" ").trim());
          currentBlock = [];
        }
        continue;
      }

      currentBlock.push(line);
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join(" ").trim());
    }

    return blocks
      .filter((blockText) => blockText.length > 0)
      .map((blockText, blockIndex) => {
        const pageToken = String(page.pageNumber).padStart(2, "0");
        const blockNumber = blockIndex + 1;
        const blockToken = String(blockNumber).padStart(2, "0");

        return {
          sourceId: source.sourceId,
          anchorId: `p${pageToken}:block${blockToken}`,
          pageNumber: page.pageNumber,
          blockNumber,
          locator: `p.${page.pageNumber} block ${blockNumber}`,
          label: `${source.title} p.${page.pageNumber} block ${blockNumber}`,
          excerpt: collapsePreview(blockText),
          text: blockText,
        };
      });
  });
}

function formatSectionLocator(headingText, pageStart, pageEnd) {
  if (pageStart === pageEnd) {
    return `section "${headingText}" (p.${pageStart})`;
  }

  return `section "${headingText}" (p.${pageStart}-${pageEnd})`;
}

function buildSemanticAnchorRecord(source, heading, sectionText, pageStart, pageEnd, anchorId) {
  return {
    sourceId: source.sourceId,
    anchorId,
    anchorKind: "semantic",
    heading: heading.headingText,
    headingLevel: heading.level,
    pageNumber: pageStart,
    pageEndNumber: pageEnd,
    locator: formatSectionLocator(heading.headingText, pageStart, pageEnd),
    label: `${source.title} ${heading.headingText}`,
    excerpt: collapsePreview(sectionText),
    text: sectionText,
  };
}

function flattenLineRecords(pages) {
  return pages.flatMap((page) =>
    page.lines.flatMap((line, lineIndex) => {
      if (!line || NOISE_LINE_PATTERN.test(line)) {
        return [];
      }

      return [
        {
          pageNumber: page.pageNumber,
          lineNumber: lineIndex + 1,
          text: line,
        },
      ];
    }),
  );
}

function detectMfdsHeading(line, options = {}) {
  const { allowNumericHeadings = true } = options;

  if (!line || NOISE_LINE_PATTERN.test(line)) {
    return null;
  }

  if (APPENDIX_HEADING_PATTERN.test(line)) {
    return { kind: "appendix", level: 1 };
  }

  if (MFDS_LAW_BOX_PATTERN.test(line)) {
    return { kind: "law_box", level: 3 };
  }

  if (ROMAN_HEADING_PATTERN.test(line) && line.length <= 40) {
    return { kind: "roman", level: 1 };
  }

  if (allowNumericHeadings && NUMERIC_HEADING_PATTERN.test(line) && line.length <= 110) {
    return { kind: "numeric", level: 2 };
  }

  return null;
}

function shouldAppendMfdsHeadingLine(kind, current, next, detector, options) {
  if (!next || detector(next, options)) {
    return false;
  }

  if (kind === "roman" || kind === "law_box") {
    return false;
  }

  if (/^(?:①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|※|<예시>|·|-)\s*/u.test(next)) {
    return false;
  }

  if (kind === "appendix") {
    return !next.includes("구 분") && next.length <= 30;
  }

  if (/[.!?]$/u.test(current)) {
    return false;
  }

  if (current.length >= 110) {
    return false;
  }

  return next.length <= 50;
}

function expandMfdsHeading(lines, startIndex, detected, options) {
  let headingText = lines[startIndex].text;
  let endIndex = startIndex;

  while (endIndex + 1 < lines.length) {
    const nextText = lines[endIndex + 1].text;

    if (
      !shouldAppendMfdsHeadingLine(
        detected.kind,
        headingText,
        nextText,
        detectMfdsHeading,
        options,
      )
    ) {
      break;
    }

    headingText = `${headingText} ${nextText}`.replace(/\s+/g, " ").trim();
    endIndex += 1;
  }

  return {
    headingText,
    endIndex,
  };
}

function buildMfdsSemanticAnchors(source, pages) {
  const allLines = flattenLineRecords(pages);
  const bodyStartIndex = allLines.findIndex((line) => MFDS_BODY_START_PATTERN.test(line.text));
  const lines = bodyStartIndex >= 0 ? allLines.slice(bodyStartIndex) : allLines;
  const headings = [];
  let hasSeenAppendix = false;

  for (let index = 0; index < lines.length; index += 1) {
    const detected = detectMfdsHeading(lines[index].text, {
      allowNumericHeadings: !hasSeenAppendix,
    });

    if (!detected) {
      continue;
    }

    const expanded = expandMfdsHeading(lines, index, detected, {
      allowNumericHeadings: !hasSeenAppendix,
    });
    headings.push({
      startIndex: index,
      endIndex: expanded.endIndex,
      headingText: expanded.headingText,
      kind: detected.kind,
      level: detected.level,
      pageNumber: lines[index].pageNumber,
      lineNumber: lines[index].lineNumber,
    });
    if (detected.kind === "appendix") {
      hasSeenAppendix = true;
    }
    index = expanded.endIndex;
  }

  return headings.map((heading, headingIndex) => {
    const nextBoundary =
      headings
        .slice(headingIndex + 1)
        .find((candidate) => candidate.level <= heading.level)?.startIndex ??
      lines.length;
    const sectionLines = lines.slice(heading.startIndex, nextBoundary);
    const sectionText = sectionLines.map((line) => line.text).join(" ").trim();
    const pageStart = sectionLines[0].pageNumber;
    const pageEnd = sectionLines.at(-1).pageNumber;
    const pageToken = String(pageStart).padStart(2, "0");
    const lineToken = String(heading.lineNumber).padStart(3, "0");

    return buildSemanticAnchorRecord(
      source,
      heading,
      sectionText,
      pageStart,
      pageEnd,
      `p${pageToken}:line${lineToken}:section`,
    );
  });
}

function detectKciaHeading(line) {
  if (!line || NOISE_LINE_PATTERN.test(line)) {
    return null;
  }

  if (ROMAN_HEADING_PATTERN.test(line)) {
    return { level: 1 };
  }

  if (NUMERIC_HEADING_PATTERN.test(line)) {
    return { level: 2 };
  }

  if (KCIA_CRITERIA_PATTERN.test(line)) {
    return { level: 3 };
  }

  if (PAREN_HEADING_PATTERN.test(line)) {
    return { level: 4 };
  }

  if (CIRCLED_HEADING_PATTERN.test(line)) {
    return { level: 5 };
  }

  if (BOX_HEADING_PATTERN.test(line)) {
    return { level: 5 };
  }

  if (line === "<광고 할 수 없는 표현 예시>" || line === "<<예시 설명>>") {
    return { level: 6 };
  }

  if (BULLET_PATTERN.test(line)) {
    return { level: 7 };
  }

  return null;
}

function stripKciaHeadingLabel(line) {
  if (line.includes(" ▸ ")) {
    return line.split(" ▸ ")[0].trim();
  }

  return line.trim();
}

function shouldAppendHeadingLine(current, next, detector) {
  if (!next || detector(next)) {
    return false;
  }

  if (/^(?:∙|☞|※|-)\s*/u.test(next)) {
    return false;
  }

  if (/[.!?]$/u.test(current)) {
    return false;
  }

  if (current.length >= 120) {
    return false;
  }

  return next.length <= 30;
}

function expandKciaHeading(lines, startIndex) {
  let headingText = stripKciaHeadingLabel(lines[startIndex].text);
  let endIndex = startIndex;

  while (endIndex + 1 < lines.length) {
    const nextText = lines[endIndex + 1].text;

    if (!shouldAppendHeadingLine(headingText, nextText, detectKciaHeading)) {
      break;
    }

    headingText = `${headingText} ${nextText}`.replace(/\s+/g, " ").trim();
    endIndex += 1;
  }

  return {
    headingText,
    endIndex,
  };
}

function buildKciaSemanticAnchors(source, pages) {
  const lines = flattenLineRecords(pages);
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const detected = detectKciaHeading(lines[index].text);

    if (!detected) {
      continue;
    }

    const expanded = expandKciaHeading(lines, index);
    headings.push({
      startIndex: index,
      endIndex: expanded.endIndex,
      headingText: expanded.headingText,
      level: detected.level,
      pageNumber: lines[index].pageNumber,
      lineNumber: lines[index].lineNumber,
    });
    index = expanded.endIndex;
  }

  return headings.map((heading, headingIndex) => {
    const nextBoundary =
      headings
        .slice(headingIndex + 1)
        .find((candidate) => candidate.level <= heading.level)?.startIndex ??
      lines.length;
    const sectionLines = lines.slice(heading.startIndex, nextBoundary);
    const sectionText = sectionLines.map((line) => line.text).join(" ").trim();
    const pageStart = sectionLines[0].pageNumber;
    const pageEnd = sectionLines.at(-1).pageNumber;
    const pageToken = String(pageStart).padStart(2, "0");
    const lineToken = String(heading.lineNumber).padStart(3, "0");

    return buildSemanticAnchorRecord(
      source,
      heading,
      sectionText,
      pageStart,
      pageEnd,
      `p${pageToken}:line${lineToken}:section`,
    );
  });
}

function buildSemanticAnchors(source, pages) {
  if (source.semanticStrategy === "mfds") {
    return buildMfdsSemanticAnchors(source, pages);
  }

  return buildKciaSemanticAnchors(source, pages);
}

export function renderPolicyAnchorIndexModule(pageBlockIndex, semanticIndex) {
  return `// This file is generated by scripts/generate_policy_anchor_indexes.mjs.\n// Do not edit manually.\n\nexport const POLICY_PAGE_BLOCK_INDEX = ${JSON.stringify(
    pageBlockIndex,
    null,
    2,
  )} as const;\n\nexport const POLICY_SEMANTIC_INDEX = ${JSON.stringify(
    semanticIndex,
    null,
    2,
  )} as const;\n`;
}

export async function buildPolicyAnchorIndexes() {
  const generatedPageBlockIndex = {};
  const generatedSemanticIndex = {};
  const sourceOutputs = [];

  for (const source of POLICY_SOURCES) {
    const rawText = await readFile(source.inputPath, "utf8");
    const pages = splitPages(rawText);
    const pageBlocks = buildPageBlockAnchors(source, pages);
    const semanticAnchors = buildSemanticAnchors(source, pages);

    generatedPageBlockIndex[source.sourceId] = pageBlocks;
    generatedSemanticIndex[source.sourceId] = semanticAnchors;
    sourceOutputs.push({
      sourceId: source.sourceId,
      pageBlockJsonOutputPath: source.pageBlockJsonOutputPath,
      semanticJsonOutputPath: source.semanticJsonOutputPath,
      pageBlocks,
      semanticAnchors,
    });
  }

  return {
    pageBlockIndex: generatedPageBlockIndex,
    semanticIndex: generatedSemanticIndex,
    sourceOutputs,
    moduleSource: renderPolicyAnchorIndexModule(
      generatedPageBlockIndex,
      generatedSemanticIndex,
    ),
  };
}
