import type {
  CitationAnchor,
  Finding,
  ProductQualificationCategoryChecklist,
  ReviewResult,
} from "../../shared-types/src/index.js";

const DEFAULT_TEXT_WIDTH = 100;
const MIN_TEXT_WIDTH = 72;
const MAX_TEXT_WIDTH = 120;

function normalizeInline(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function getTextWidth(): number {
  const processWithStdout = process as unknown as {
    stdout?: { isTTY?: boolean; columns?: number };
  };
  const columns = processWithStdout.stdout?.isTTY
    ? processWithStdout.stdout.columns
    : undefined;
  const width = columns ?? DEFAULT_TEXT_WIDTH;

  return Math.max(MIN_TEXT_WIDTH, Math.min(MAX_TEXT_WIDTH, width));
}

function wrapText(
  text: string,
  prefix: string,
  continuationPrefix = " ".repeat(prefix.length),
): string[] {
  const width = getTextWidth();
  const normalized = normalizeInline(text);

  if (normalized.length === 0) {
    return [prefix.trimEnd()];
  }

  const tokens = normalized.split(" ");
  const lines: string[] = [];
  let current = prefix;

  for (const token of tokens) {
    const candidate = current.trimEnd().length === prefix.trimEnd().length
      ? `${current}${token}`
      : `${current} ${token}`;

    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current.trimEnd().length > prefix.trimEnd().length) {
      lines.push(current);
      current = `${continuationPrefix}${token}`;
      continue;
    }

    let remaining = token;

    while (remaining.length > 0) {
      const available = Math.max(8, width - current.length);
      const chunk = remaining.slice(0, available);
      remaining = remaining.slice(chunk.length);
      current += chunk;

      if (remaining.length > 0) {
        lines.push(current);
        current = continuationPrefix;
      }
    }
  }

  if (current.trim().length > 0) {
    lines.push(current);
  }

  return lines;
}

function renderSection(title: string, body: string[]): string[] {
  const lines = [title, "-".repeat(title.length)];

  if (body.length > 0) {
    lines.push(...body);
  }

  return lines;
}

function renderBullet(text: string, indent = ""): string[] {
  return wrapText(text, `${indent}- `, `${indent}  `);
}

function renderLabeledBlock(label: string, value: string, indent = ""): string[] {
  const lines = [`${indent}${label}`];
  lines.push(...wrapText(value, `${indent}  `, `${indent}  `));
  return lines;
}

function truncateExcerpt(excerpt: string): string {
  const normalized = normalizeInline(excerpt);
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function formatCitation(citation: CitationAnchor): string[] {
  return [
    ...renderBullet(citation.label, "    "),
    ...wrapText(truncateExcerpt(citation.excerpt), "      ", "      "),
  ];
}

function formatFinding(finding: Finding, index: number): string {
  const findingStatusLabel =
    finding.verdict === "BLOCK" ? "금지표현 해당" : "추가 확인 필요";
  const displayOrder = finding.displayOrder ?? index + 1;
  const lines = [
    `${displayOrder}. [${findingStatusLabel}] ${finding.title}`,
    ...renderBullet(
      `Taxonomy: ${finding.taxonomy.familyLabel} / ${finding.taxonomy.ruleLabel}`,
      "   ",
    ),
    ...renderLabeledBlock("   Span:", finding.span.text),
    ...renderLabeledBlock("   Reason:", finding.reason),
  ];

  if (finding.evidence.length > 0) {
    lines.push(...renderBullet(`Evidence: ${finding.evidence.join(", ")}`, "   "));
  }

  if (finding.citations.length > 0) {
    lines.push("   Citations:");
    for (const citation of finding.citations) {
      lines.push(...formatCitation(citation));
    }
  }

  if (finding.sourceBindings.length > 0) {
    lines.push("   Source Roles:");
    for (const binding of finding.sourceBindings) {
      lines.push(
        ...renderBullet(
          `${binding.sourceTitle} (${binding.role})${binding.directlyCited ? " [direct]" : ""}`,
          "   ",
        ),
      );
    }
  }

  if (finding.suggestedFix) {
    lines.push(...renderLabeledBlock("   Suggested Fix:", finding.suggestedFix));
  }

  return lines.join("\n");
}

function formatProductQualificationChecklist(
  checklist: ProductQualificationCategoryChecklist,
): string[] {
  const flags: string[] = [];

  if (checklist.declaredInInput) {
    flags.push("declared");
  }

  if (checklist.inferredFromCopy) {
    flags.push("inferred");
  }

  const lines = [
    ...renderBullet(
      `${checklist.categoryLabel} [${checklist.lawLabel}]${flags.length > 0 ? ` (${flags.join(", ")})` : ""}`,
    ),
    ...renderLabeledBlock("  Summary:", checklist.lawSummary),
  ];

  for (const item of checklist.checks) {
    lines.push(...wrapText(item.message, `  [${item.kind}] `, "    "));
  }

  return lines;
}

export function formatReviewText(result: ReviewResult): string {
  const lines = ["Review Result", "============="];
  const sections: string[][] = [];

  sections.push(
    renderSection(
      "Input Copy",
      renderLabeledBlock("Original:", result.request.adCopy),
    ),
  );

  sections.push(
    renderSection("Overview", [
      ...renderBullet(
        `판정: ${result.publicStatus.label} (${result.publicStatus.code})`,
      ),
      ...renderLabeledBlock("Summary:", result.summary),
      ...renderBullet(
        `Source Pack: ${result.sourcePack.fullTextReadyCount}/${result.sourcePack.entries.length} full-text ready, ${result.sourcePack.citationReadyCount}/${result.sourcePack.entries.length} citation-ready`,
      ),
      ...(result.report.taxonomySummary.length > 0
        ? renderBullet(`Taxonomy: ${result.report.taxonomySummary.join(" | ")}`)
        : []),
    ]),
  );

  if (result.publicStatus.verificationReasons.length > 0) {
    sections.push(
      renderSection(
        "Verification Needs:",
        result.publicStatus.verificationReasons.flatMap((reason) => [
          ...renderBullet(`${reason.label} (${reason.code})`),
          ...wrapText(reason.description, "  ", "  "),
        ]),
      ),
    );
  }

  if (result.report.productQualificationNotes.length > 0) {
    sections.push(
      renderSection(
        "Product Qualification:",
        result.report.productQualificationNotes.flatMap((note) => renderBullet(note)),
      ),
    );
  }

  if (result.report.productQualificationChecklist.length > 0) {
    sections.push(
      renderSection(
        "Functional Category Checks:",
        result.report.productQualificationChecklist.flatMap((checklist, index) => {
          const checklistLines = formatProductQualificationChecklist(checklist);
          return index === 0 ? checklistLines : ["", ...checklistLines];
        }),
      ),
    );
  }

  if (result.uncertaintySignals.length > 0) {
    sections.push(
      renderSection(
        "Uncertainty:",
        result.uncertaintySignals.flatMap((signal) => renderBullet(signal.message)),
      ),
    );
  }

  if (result.surfacedFindings.length > 0) {
    sections.push(
      renderSection(
        "Findings:",
        result.surfacedFindings.flatMap((finding, index) =>
          index === 0 ? [formatFinding(finding, index)] : ["", formatFinding(finding, index)],
        ),
      ),
    );
  } else {
    sections.push(renderSection("Findings:", ["none"]));
  }

  if (result.report.additionalChecks.length > 0) {
    sections.push(
      renderSection(
        "Additional Checks:",
        result.report.additionalChecks.flatMap((item) => renderBullet(item)),
      ),
    );
  }

  sections.push(
    renderSection(
      "Sources:",
      result.report.sourceGrounding.flatMap((item) => renderBullet(item)),
    ),
  );
  sections.push(
    renderSection("Disclaimer", wrapText(result.report.disclaimer, "", "")),
  );

  for (const [index, section] of sections.entries()) {
    lines.push("");
    lines.push(...section);

    if (index < sections.length - 1) {
      lines.push("");
    }
  }

  return lines.join("\n");
}
