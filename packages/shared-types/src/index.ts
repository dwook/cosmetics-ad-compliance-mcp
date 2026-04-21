export type ReviewVerdict = "BLOCK" | "WARNING" | "PASS" | "UNCLEAR";
export type FindingSeverity = "high" | "medium" | "low";
export type CosmeticProductKind = "general" | "functional" | "unknown";
export type FunctionalCosmeticCategoryCode =
  | "brightening_prevention"
  | "brightening_lightening"
  | "wrinkle_improvement"
  | "tanning"
  | "uv_protection"
  | "hair_color_change"
  | "hair_removal"
  | "hair_loss_relief"
  | "acne_relief"
  | "skin_barrier_relief"
  | "stretch_mark_redness_relief";

export interface FunctionalCosmeticCategoryDefinition {
  code: FunctionalCosmeticCategoryCode;
  label: string;
  lawLocator: string;
  lawLabel: string;
  lawSummary: string;
  signalPatterns: string[];
  requiredChecks: string[];
  reviewChecklist: ProductQualificationCheckItem[];
}

export type ProductQualificationCheckKind =
  | "scope"
  | "document"
  | "evidence"
  | "expression_boundary";

export interface ProductQualificationCheckItem {
  kind: ProductQualificationCheckKind;
  message: string;
  sourceLabels: string[];
}

export interface ReviewRequest {
  requestId?: string;
  productCategory: string;
  productKind?: CosmeticProductKind;
  functionalCategories?: FunctionalCosmeticCategoryCode[];
  productSubcategory?: string;
  audience?: string;
  adCopy: string;
  metadata?: Record<string, unknown>;
}

export type ConceptSignalId =
  | "medical_treatment"
  | "medical_regeneration"
  | "functional_brightening"
  | "functional_wrinkle"
  | "functional_uv"
  | "functional_hair_loss"
  | "functional_acne"
  | "side_effect_denial"
  | "temporary_worsening_reference"
  | "procedure_like_reference"
  | "skin_age_reference"
  | "natural_organic_marketing"
  | "vegan_marketing"
  | "iso_index_reference"
  | "iso_index_disclaimer"
  | "stem_cell_marketing"
  | "exosome_marketing"
  | "human_origin_reference"
  | "nonhuman_biologic_qualifier"
  | "restricted_human_derived_marketing"
  | "ingredient_absence_pattern"
  | "banned_ingredient_reference"
  | "patent_reference"
  | "patent_effect_reference"
  | "named_active_ingredient"
  | "benefit_change"
  | "absolute_guarantee"
  | "testimonial_format"
  | "ranking_superiority"
  | "expert_endorsement"
  | "authority_reference"
  | "certification_reference"
  | "clinical_test_reference"
  | "numeric_improvement"
  | "comparison_reference"
  | "general_hype";

export interface SignalRequirement {
  mode: "any" | "all";
  signalIds: ConceptSignalId[];
}

export type RuleConditionScope = "claim" | "document" | "combined";

export type RuleContextPredicateId =
  | "functional_claim_requires_scope_review"
  | "functional_claim_matches_declared_scope"
  | "functional_category_mismatch_detected";

export interface RuleConditionSet {
  scope?: RuleConditionScope;
  signalRequirements?: SignalRequirement[];
  contextPredicates?: RuleContextPredicateId[];
}

export interface RuleAllowanceDefinition {
  id: string;
  title: string;
  rationale: string;
  when: RuleConditionSet;
}

export type RuleDecisionLayer = "prohibit" | "evidence";

export interface ClassificationResult {
  normalizedProductCategory: string;
  conceptSignals: ConceptSignalId[];
  issueTags: string[];
  confidence: "high" | "medium" | "low";
}

export interface ReferenceDocument {
  id: string;
  title: string;
  path: string;
  authority: string;
  sourceType: "law" | "decree" | "rule" | "guideline" | "industry_guide";
  officialUrl: string;
  asOfDate: string;
  description: string;
  productCategories: string[];
  issueTags: string[];
  priority: number;
}

export interface SelectedReference extends ReferenceDocument {
  selectionReasons: string[];
}

export type SourceStorageKind =
  | "external_manifest"
  | "local_pdf"
  | "local_snapshot";

export type SourceSyncPolicy =
  | "tracked_external_sync"
  | "bundled_local_asset";

export type SourceCorpusStatus =
  | "reference_card_only"
  | "source_file_staged"
  | "full_text_ingested"
  | "full_text_ready";

export interface SourceCorpusEntry {
  id: string;
  title: string;
  authority: string;
  sourceType: ReferenceDocument["sourceType"];
  referencePath: string;
  storageKind: SourceStorageKind;
  syncPolicy: SourceSyncPolicy;
  corpusStatus: SourceCorpusStatus;
  pageCount?: number;
  sourceFileAvailable: boolean;
  fullTextAvailable: boolean;
  citationIndexAvailable: boolean;
  runtimeFetchAllowed: boolean;
  officialSourceTracked: boolean;
  localArtifactPath?: string;
  snapshotManifestPath?: string;
  extractedTextPath?: string;
  citationIndexPath?: string;
  semanticIndexPath?: string;
  note: string;
}

export interface SourcePackState {
  mode: "five_source_core";
  reviewRuntimeMode: "local_corpus_only";
  liveFetchAtReviewTime: false;
  corpusStatus: SourceCorpusStatus;
  entries: SourceCorpusEntry[];
  stagedFileCount: number;
  fullTextReadyCount: number;
  citationReadyCount: number;
  missingCapabilities: string[];
}

export interface ClaimSpan {
  id: string;
  text: string;
  start: number;
  end: number;
  conceptSignals: ConceptSignalId[];
  tags: string[];
}

export interface RuleDefinition {
  id: string;
  code: string;
  title: string;
  referenceIds: string[];
  taxonomy: FindingTaxonomy;
  sourceBindings: RuleSourceBinding[];
  issueTag: string;
  decisionLayer: RuleDecisionLayer;
  severity: FindingSeverity;
  verdict: Extract<ReviewVerdict, "BLOCK" | "WARNING">;
  description: string;
  productCategories: string[];
  activateWhen: RuleConditionSet;
  allowWhen?: RuleAllowanceDefinition[];
  precedence: number;
  suppresses?: string[];
  requiredChecks?: string[];
  suggestedFix?: string;
}

export interface FindingSpan {
  start: number;
  end: number;
  text: string;
}

export interface CitationAnchor {
  sourceId: string;
  anchorId: string;
  locator: string;
  label: string;
  excerpt: string;
}

export type FindingTaxonomyFamily =
  | "medicalization"
  | "functional_substantiation"
  | "comparative_superiority"
  | "testimonial_endorsement"
  | "general_misleading";

export interface FindingTaxonomy {
  family: FindingTaxonomyFamily;
  familyLabel: string;
  ruleLabel: string;
}

export type SourceBindingRole =
  | "statutory_basis"
  | "implementing_rule"
  | "administrative_context"
  | "agency_guidance"
  | "industry_interpretation";

export interface RuleSourceBinding {
  sourceId: string;
  role: SourceBindingRole;
  rationale: string;
}

export interface FindingSourceBinding extends RuleSourceBinding {
  sourceTitle: string;
  sourcePath: string;
  authority: string;
  directlyCited: boolean;
}

export type LawAnchorKind =
  | "article"
  | "paragraph"
  | "item"
  | "subitem"
  | "appendix"
  | "appendix_item"
  | "supplementary_provision";

export interface LawAnchorRecord {
  anchorId: string;
  kind: LawAnchorKind;
  locator: string;
  label: string;
  excerpt: string;
  parentAnchorId?: string;
}

export interface LawSnapshotVersionMetadata {
  sourceId: string;
  title: string;
  authority: string;
  officialUrl: string;
  asOfDate: string;
  effectiveDate?: string;
  syncedAt?: string;
  lawId?: string;
  lsiSeq?: string;
  promulgationNo?: string;
  checksum?: string;
}

export interface LawSnapshotManifestVersion {
  versionTag: string;
  metadataPath: string;
  bodyPath: string;
  anchorsPath: string;
  status: "planned" | "synced";
}

export interface LawSnapshotManifest {
  sourceId: string;
  title: string;
  currentVersionTag?: string;
  syncPolicy: "tracked_external_sync";
  officialUrl: string;
  versions: LawSnapshotManifestVersion[];
}

export interface CuratedLawCitationTarget {
  sourceId: string;
  anchorId: string;
  locator: string;
  label: string;
  status: "pending_snapshot" | "verified";
  discoverySourceUrl?: string;
  note?: string;
}

export interface LawCitationReadiness {
  ruleId: string;
  sourceId: string;
  anchorId: string;
  targetStatus: CuratedLawCitationTarget["status"];
  canPromote: boolean;
  checks: {
    manifestVersionExists: boolean;
    versionSynced: boolean;
    anchorExists: boolean;
    locatorMatches: boolean;
    labelMatches: boolean;
    excerptPresent: boolean;
    discoveryTracked: boolean;
  };
}

export interface Finding {
  id: string;
  displayOrder?: number;
  claimId: string;
  ruleId: string;
  code: string;
  title: string;
  taxonomy: FindingTaxonomy;
  issueTag: string;
  decisionLayer: RuleDecisionLayer;
  severity: FindingSeverity;
  verdict: Extract<ReviewVerdict, "BLOCK" | "WARNING">;
  span: FindingSpan;
  reason: string;
  evidence: string[];
  matchedSignals: ConceptSignalId[];
  citedReferenceIds: string[];
  citations: CitationAnchor[];
  sourceBindings: FindingSourceBinding[];
  requiredChecks: string[];
  suggestedFix?: string;
  surfaced: boolean;
  suppressedBy?: string;
}

export interface ReportItem {
  code: string;
  title: string;
  taxonomy: FindingTaxonomy;
  reason: string;
  spanText: string;
  evidence: string[];
  citedReferenceIds: string[];
  citations: CitationAnchor[];
  sourceBindings: FindingSourceBinding[];
  suggestedFix?: string;
}

export type ReviewUncertaintyCode =
  | "low_classifier_confidence"
  | "weak_evidence_only";

export interface ReviewUncertaintySignal {
  code: ReviewUncertaintyCode;
  message: string;
  affectsVerdict: boolean;
}

export interface ReviewProductProfile {
  declaredProductKind: CosmeticProductKind;
  declaredFunctionalCategories: FunctionalCosmeticCategoryCode[];
  declaredFunctionalCategoryLabels: string[];
  inferredFunctionalCategories: FunctionalCosmeticCategoryCode[];
  inferredFunctionalCategoryLabels: string[];
  lawBasis: string[];
  additionalChecks: string[];
  mismatchNotes: string[];
  categoryChecklists: ProductQualificationCategoryChecklist[];
}

export interface ProductQualificationCategoryChecklist {
  categoryCode: FunctionalCosmeticCategoryCode;
  categoryLabel: string;
  lawLabel: string;
  lawSummary: string;
  declaredInInput: boolean;
  inferredFromCopy: boolean;
  checks: ProductQualificationCheckItem[];
}

export interface RevisionPhraseReplacement {
  from: string;
  to: string;
}

export interface RevisionChange {
  claimId: string;
  findingIds: string[];
  codes: string[];
  primaryTaxonomy: FindingTaxonomy;
  originalText: string;
  revisedText: string;
  appliedPhrases: RevisionPhraseReplacement[];
  rationale: string[];
  sourceLabels: string[];
}

export interface RevisionSuggestion {
  original: string;
  revised: string;
  verdict: ReviewVerdict;
  changeCount: number;
  changes: RevisionChange[];
  sourceGroundingNote: string;
  uncertaintyNotes: string[];
  disclaimer: string;
}

export type PublicReviewStatusCode =
  | "PROHIBITED_CLAIM"
  | "NEEDS_VERIFICATION"
  | "NEEDS_HUMAN_REVIEW"
  | "NO_ISSUE_DETECTED";

export type VerificationReasonCode =
  | "NEEDS_EVIDENCE"
  | "NEEDS_SCOPE_REVIEW"
  | "NEEDS_OBJECTIVE_SUPPORT";

export interface VerificationReason {
  code: VerificationReasonCode;
  label: string;
  description: string;
  relatedFindingCodes: string[];
}

export interface PublicReviewStatus {
  code: PublicReviewStatusCode;
  label: string;
  internalVerdict: ReviewVerdict;
  verificationReasons: VerificationReason[];
}

export interface UserReport {
  summaryLine: string;
  publicStatus: PublicReviewStatus;
  productQualificationNotes: string[];
  productQualificationChecklist: ProductQualificationCategoryChecklist[];
  taxonomySummary: string[];
  mustFix: ReportItem[];
  caution: ReportItem[];
  ok: string[];
  sourceGrounding: string[];
  uncertaintyNotes: string[];
  additionalChecks: string[];
  disclaimer: string;
}

export interface ReviewResult {
  request: ReviewRequest;
  productProfile: ReviewProductProfile;
  classification: ClassificationResult;
  selectedReferences: SelectedReference[];
  sourcePack: SourcePackState;
  claims: ClaimSpan[];
  findings: Finding[];
  surfacedFindings: Finding[];
  suppressedFindings: Finding[];
  uncertaintySignals: ReviewUncertaintySignal[];
  verdict: ReviewVerdict;
  publicStatus: PublicReviewStatus;
  summary: string;
  report: UserReport;
}

export interface ToolDefinition<Input, Output> {
  name: string;
  title: string;
  description: string;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  execute: (input: Input) => Output;
}

export interface FindingExplanation {
  code: string;
  title: string;
  taxonomy: FindingTaxonomy;
  reason: string;
  referencePaths: string[];
  sourceTitles: string[];
  citations: CitationAnchor[];
  sourceBindings: FindingSourceBinding[];
  nextAction: string;
}
