import type {
  ClassificationResult,
  ReviewRequest,
  SelectedReference,
} from "../../shared-types/src/index.js";
import { REFERENCE_CATALOG } from "./reference-catalog.js";

export function listApplicableReferences(
  request: ReviewRequest,
  classification: ClassificationResult,
): SelectedReference[] {
  return REFERENCE_CATALOG.map((reference) => {
    const reasons = [
      "five-source-core-review",
      `product_category=${classification.normalizedProductCategory}`,
      `classification_confidence=${classification.confidence}`,
    ];

    if (request.productKind) {
      reasons.push(`product_kind=${request.productKind}`);
    }

    for (const category of request.functionalCategories ?? []) {
      reasons.push(`functional_category=${category}`);
    }

    for (const tag of classification.issueTags) {
      reasons.push(`issue_tag=${tag}`);
    }

    return {
      ...reference,
      selectionReasons: [...new Set(reasons)],
    };
  }).sort((left, right) => left.priority - right.priority);
}
