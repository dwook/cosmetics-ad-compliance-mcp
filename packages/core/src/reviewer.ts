import type {
  ClaimSpan,
  ClassificationResult,
  ConceptSignalId,
  Finding,
  FindingSourceBinding,
  ReviewRequest,
  ReviewProductProfile,
  RuleDefinition,
  RuleConditionSet,
  RuleContextPredicateId,
  SelectedReference,
} from "../../shared-types/src/index.js";
import {
  collectSignalEvidence,
  satisfiesSignalRequirement,
  selectMatchedSignals,
} from "./concept-signals.js";
import { resolveLawCitations } from "./law-citations.js";
import { resolvePolicyCitations } from "./policy-citations.js";
import { REFERENCE_CATALOG, RULE_CATALOG } from "./reference-catalog.js";

interface ReviewCandidates {
  findings: Finding[];
  surfacedFindings: Finding[];
  suppressedFindings: Finding[];
}

const REFERENCE_BY_ID = new Map(
  REFERENCE_CATALOG.map((reference) => [reference.id, reference]),
);

function ruleIsInScope(
  rule: RuleDefinition,
  request: ReviewRequest,
  selectedReferences: SelectedReference[],
): boolean {
  const referenceIds = new Set(selectedReferences.map((reference) => reference.id));
  const productMatches =
    rule.productCategories.includes("all") ||
    rule.productCategories.includes(request.productCategory);

  return (
    productMatches &&
    rule.referenceIds.every((referenceId) => referenceIds.has(referenceId))
  );
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function evaluateContextPredicate(
  predicateId: RuleContextPredicateId,
  productProfile: ReviewProductProfile,
): boolean {
  switch (predicateId) {
    case "functional_claim_requires_scope_review":
      return (
        (productProfile.declaredProductKind === "general" &&
          productProfile.inferredFunctionalCategories.length > 0) ||
        (productProfile.declaredProductKind === "unknown" &&
          productProfile.inferredFunctionalCategories.length > 0) ||
        (productProfile.declaredProductKind === "functional" &&
          productProfile.declaredFunctionalCategories.length === 0 &&
          productProfile.inferredFunctionalCategories.length > 0)
      );
    case "functional_claim_matches_declared_scope":
      return (
        productProfile.declaredProductKind === "functional" &&
        productProfile.inferredFunctionalCategories.length > 0 &&
        productProfile.inferredFunctionalCategories.every((category) =>
          productProfile.declaredFunctionalCategories.includes(category),
        )
      );
    case "functional_category_mismatch_detected":
      return (
        productProfile.declaredProductKind === "functional" &&
        productProfile.inferredFunctionalCategories.some(
          (category) => !productProfile.declaredFunctionalCategories.includes(category),
        )
      );
    default:
      return false;
  }
}

function signalSetForScope(
  scope: RuleConditionSet["scope"],
  claim: ClaimSpan,
  classification: ClassificationResult,
): Set<ConceptSignalId> {
  const claimSignals = claim.conceptSignals;
  const documentSignals = classification.conceptSignals;

  switch (scope) {
    case "claim":
      return new Set(claimSignals);
    case "document":
      return new Set(documentSignals);
    default:
      return new Set([...claimSignals, ...documentSignals]);
  }
}

function conditionSetPasses(params: {
  conditionSet: RuleConditionSet;
  claim: ClaimSpan;
  classification: ClassificationResult;
  productProfile: ReviewProductProfile;
}): boolean {
  const {
    conditionSet,
    claim,
    classification,
    productProfile,
  } = params;
  const availableSignals = signalSetForScope(
    conditionSet.scope,
    claim,
    classification,
  );

  const signalsPass =
    (conditionSet.signalRequirements ?? []).every((requirement) =>
      satisfiesSignalRequirement(availableSignals, requirement),
    );
  const contextPass =
    (conditionSet.contextPredicates ?? []).every((predicateId) =>
      evaluateContextPredicate(predicateId, productProfile),
    );

  return signalsPass && contextPass;
}

function matchesRule(params: {
  rule: RuleDefinition;
  claim: ClaimSpan;
  request: ReviewRequest;
  classification: ClassificationResult;
  productProfile: ReviewProductProfile;
}): {
  evidence: string[];
  matchedSignals: ConceptSignalId[];
} | null {
  const {
    rule,
    claim,
    request,
    classification,
    productProfile,
  } = params;

  if (
    rule.allowWhen?.some((allowance) =>
      conditionSetPasses({
        conditionSet: allowance.when,
        claim,
        classification,
        productProfile,
      }),
    )
  ) {
    return null;
  }

  if (
    !conditionSetPasses({
      conditionSet: rule.activateWhen,
      claim,
      classification,
      productProfile,
    })
  ) {
    return null;
  }

  const availableSignals = signalSetForScope(
    rule.activateWhen.scope,
    claim,
    classification,
  );
  const matchedSignals = selectMatchedSignals(
    availableSignals,
    rule.activateWhen.signalRequirements ?? [],
  );
  const evidence = unique(
    collectSignalEvidence(claim.text, matchedSignals).concat(
      collectSignalEvidence(request.adCopy, matchedSignals),
    ),
  );

  return {
    evidence: evidence.length > 0 ? evidence : ["contextual-cross-check"],
    matchedSignals,
  };
}

function createFinding(
  rule: RuleDefinition,
  claim: ClaimSpan,
  evidence: string[],
  matchedSignals: ConceptSignalId[],
  index: number,
): Finding {
  const citations = [
    ...resolveLawCitations(rule),
    ...resolvePolicyCitations(rule, claim, evidence),
  ];
  const citedReferenceIds = [
    ...new Set([...rule.referenceIds, ...citations.map((citation) => citation.sourceId)]),
  ];
  const citationSourceIds = new Set(citations.map((citation) => citation.sourceId));
  const sourceBindings = rule.sourceBindings
    .map((binding) => {
      const reference = REFERENCE_BY_ID.get(binding.sourceId);

      if (!reference) {
        return null;
      }

      const sourceBinding: FindingSourceBinding = {
        ...binding,
        sourceTitle: reference.title,
        sourcePath: reference.path,
        authority: reference.authority,
        directlyCited: citationSourceIds.has(binding.sourceId),
      };

      return sourceBinding;
    })
    .filter((binding): binding is FindingSourceBinding => binding !== null);

  return {
    id: `finding-${index + 1}`,
    claimId: claim.id,
    ruleId: rule.id,
    code: rule.code,
    title: rule.title,
    taxonomy: rule.taxonomy,
    issueTag: rule.issueTag,
    decisionLayer: rule.decisionLayer,
    severity: rule.severity,
    verdict: rule.verdict,
    span: {
      start: claim.start,
      end: claim.end,
      text: claim.text,
    },
    reason: rule.description,
    evidence,
    matchedSignals,
    citedReferenceIds,
    citations,
    sourceBindings,
    requiredChecks: rule.requiredChecks ?? [],
    suggestedFix: rule.suggestedFix,
    surfaced: true,
  };
}

function applyPrecedence(findings: Finding[]): ReviewCandidates {
  const sorted = [...findings].sort((left, right) => {
    const leftRule = RULE_CATALOG.find((rule) => rule.id === left.ruleId);
    const rightRule = RULE_CATALOG.find((rule) => rule.id === right.ruleId);

    return (rightRule?.precedence ?? 0) - (leftRule?.precedence ?? 0);
  });

  for (const finding of sorted) {
    if (finding.suppressedBy) {
      continue;
    }

    const currentRule = RULE_CATALOG.find((rule) => rule.id === finding.ruleId);

    if (!currentRule?.suppresses || currentRule.suppresses.length === 0) {
      continue;
    }

    for (const candidate of sorted) {
      if (candidate.id === finding.id || candidate.claimId !== finding.claimId) {
        continue;
      }

      if (currentRule.suppresses.includes(candidate.issueTag)) {
        candidate.surfaced = false;
        candidate.suppressedBy = finding.id;
      }
    }
  }

  const unique = new Map<string, Finding>();

  for (const finding of sorted) {
    const key = `${finding.claimId}:${finding.code}`;

    if (!unique.has(key)) {
      unique.set(key, finding);
    }
  }

  const collapsed = [...unique.values()];
  const surfacedFindings = collapsed
    .filter((finding) => finding.surfaced)
    .map((finding, index) => ({
      ...finding,
      displayOrder: index + 1,
    }));
  const surfacedDisplayOrderById = new Map(
    surfacedFindings.map((finding) => [finding.id, finding.displayOrder]),
  );
  const allFindings = collapsed.map((finding) => {
    const displayOrder = surfacedDisplayOrderById.get(finding.id);

    return displayOrder === undefined
      ? finding
      : {
          ...finding,
          displayOrder,
        };
  });
  const suppressedFindings = allFindings.filter((finding) => !finding.surfaced);

  return {
    findings: allFindings,
    surfacedFindings,
    suppressedFindings,
  };
}

export function reviewClaims(
  request: ReviewRequest,
  claims: ClaimSpan[],
  selectedReferences: SelectedReference[],
  classification: ClassificationResult,
  productProfile: ReviewProductProfile,
): ReviewCandidates {
  const candidates: Finding[] = [];

  for (const claim of claims) {
    for (const rule of RULE_CATALOG) {
      if (!ruleIsInScope(rule, request, selectedReferences)) {
        continue;
      }

      const matched = matchesRule({
        rule,
        claim,
        request,
        classification,
        productProfile,
      });

      if (!matched) {
        continue;
      }

      candidates.push(
        createFinding(
          rule,
          claim,
          matched.evidence,
          matched.matchedSignals,
          candidates.length,
        ),
      );
    }
  }

  return applyPrecedence(candidates);
}
