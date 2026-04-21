import type { ClaimSpan } from "../../shared-types/src/index.js";
import { detectConceptSignals, detectIssueTags } from "./concept-signals.js";

function trimWithOffsets(segment: string, index: number): ClaimSpan | null {
  const trimmedStart = segment.search(/\S/);
  const trimmed = segment.trim();

  if (trimmedStart === -1 || trimmed.length === 0) {
    return null;
  }

  const start = index + trimmedStart;
  const end = start + trimmed.length;

  return {
    id: "",
    text: trimmed,
    start,
    end,
    conceptSignals: detectConceptSignals(trimmed),
    tags: detectIssueTags(trimmed),
  };
}

export function extractClaims(adCopy: string): ClaimSpan[] {
  const claims: ClaimSpan[] = [];
  const matcher = /[^\n.!?]+[.!?]?/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(adCopy)) !== null) {
    const span = trimWithOffsets(match[0], match.index);

    if (!span) {
      continue;
    }

    claims.push({
      ...span,
      id: `claim-${claims.length + 1}`,
    });
  }

  if (claims.length > 0) {
    return claims;
  }

  const fallback = adCopy.trim();

  return [
    {
      id: "claim-1",
      text: fallback,
      start: 0,
      end: fallback.length,
      conceptSignals: detectConceptSignals(fallback),
      tags: detectIssueTags(fallback),
    },
  ];
}
