import type {
  ClassificationResult,
  ReviewRequest,
} from "../../shared-types/src/index.js";
import { normalizeRequest } from "./reference-catalog.js";
import { detectConceptSignals, detectIssueTags } from "./concept-signals.js";

export function classifyAdCopy(request: ReviewRequest): ClassificationResult {
  const normalized = normalizeRequest(request);
  const conceptSignals = detectConceptSignals(normalized.adCopy);
  const issueTags = detectIssueTags(normalized.adCopy);
  const signalCount = conceptSignals.length;
  const confidence =
    signalCount >= 4 ? "high" : signalCount >= 2 ? "medium" : "low";

  return {
    normalizedProductCategory: normalized.productCategory,
    conceptSignals,
    issueTags,
    confidence,
  };
}
