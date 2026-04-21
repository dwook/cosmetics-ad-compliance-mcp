#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { reviewAdCopy } from "../dist/packages/core/src/index.js";

const FIXTURE_PATHS = {
  dev: new URL("../examples/eval/dev-set.json", import.meta.url),
  holdout: new URL("../examples/eval/holdout-set.json", import.meta.url),
};
const REGRESSION_FIXTURE_DIR = new URL(
  "../examples/eval/regression/",
  import.meta.url,
);

function parseArgs(argv) {
  let set = "all";
  let bucket = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--set") {
      const value = argv[index + 1];

      if (
        value === "dev" ||
        value === "holdout" ||
        value === "regression" ||
        value === "all"
      ) {
        set = value;
        index += 1;
        continue;
      }

      throw new Error("--set must be dev, holdout, regression, or all");
    }

    if (token === "--bucket") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("--bucket requires a regression bucket name");
      }

      bucket = value;
      index += 1;
      continue;
    }

    throw new Error(`unexpected eval argument: ${token}`);
  }

  if (bucket !== null && set !== "regression" && set !== "all") {
    throw new Error("--bucket can only be used with --set regression or --set all");
  }

  return { set, bucket };
}

function collectCodes(result) {
  return result.surfacedFindings.map((finding) => finding.code);
}

function collectCitationLabels(result) {
  return result.surfacedFindings.flatMap((finding) =>
    finding.citations.map((citation) => citation.label),
  );
}

function collectUncertaintyCodes(result) {
  return result.uncertaintySignals.map((signal) => signal.code);
}

function runCase(sampleCase) {
  const result = reviewAdCopy(sampleCase.request);
  const surfacedCodes = collectCodes(result);
  const citationLabels = collectCitationLabels(result);
  const uncertaintyCodes = collectUncertaintyCodes(result);
  const failures = [];

  if (result.verdict !== sampleCase.expected.verdict) {
    failures.push(
      `verdict expected ${sampleCase.expected.verdict} but got ${result.verdict}`,
    );
  }

  for (const code of sampleCase.expected.mustIncludeCodes) {
    if (!surfacedCodes.includes(code)) {
      failures.push(`missing surfaced finding code ${code}`);
    }
  }

  for (const code of sampleCase.expected.mustExcludeCodes) {
    if (surfacedCodes.includes(code)) {
      failures.push(`unexpected surfaced finding code ${code}`);
    }
  }

  for (const label of sampleCase.expected.mustIncludeCitationLabels) {
    if (!citationLabels.some((citationLabel) => citationLabel.includes(label))) {
      failures.push(`missing citation label containing ${label}`);
    }
  }

  for (const code of sampleCase.expected.mustIncludeUncertaintyCodes) {
    if (!uncertaintyCodes.includes(code)) {
      failures.push(`missing uncertainty code ${code}`);
    }
  }

  return {
    id: sampleCase.id,
    description: sampleCase.description,
    failures,
    result,
    surfacedCodes,
    uncertaintyCodes,
  };
}

function getRegressionFixtureSources(bucket = null) {
  const fileNames = readdirSync(REGRESSION_FIXTURE_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  const selectedNames =
    bucket === null
      ? fileNames
      : fileNames.filter((fileName) => path.basename(fileName, ".json") === bucket);

  if (selectedNames.length === 0) {
    throw new Error(`unknown regression bucket: ${bucket}`);
  }

  return selectedNames.map((fileName) => ({
    label: `regression:${path.basename(fileName, ".json")}`,
    path: new URL(fileName, REGRESSION_FIXTURE_DIR),
  }));
}

function loadFixtureSources(setName, bucket = null) {
  if (setName === "regression") {
    return getRegressionFixtureSources(bucket);
  }

  return [
    {
      label: setName,
      path: FIXTURE_PATHS[setName],
    },
  ];
}

function runFixtureSource(source) {
  const fixtures = JSON.parse(readFileSync(source.path, "utf8"));
  const evaluations = fixtures.map(runCase);
  const failed = evaluations.filter((evaluation) => evaluation.failures.length > 0);

  console.log(`\n[${source.label}]`);

  for (const evaluation of evaluations) {
    if (evaluation.failures.length === 0) {
      console.log(
        `PASS ${evaluation.id} | ${evaluation.result.verdict} | ${evaluation.surfacedCodes.join(", ") || "none"}`,
      );
      continue;
    }

    console.log(`FAIL ${evaluation.id}`);
    console.log(`  ${evaluation.description}`);
    for (const failure of evaluation.failures) {
      console.log(`  - ${failure}`);
    }
    console.log(
      `  actual surfaced codes: ${evaluation.surfacedCodes.join(", ") || "none"}`,
    );
    console.log(
      `  actual uncertainty codes: ${evaluation.uncertaintyCodes.join(", ") || "none"}`,
    );
  }

  console.log(
    `Summary ${source.label}: ${evaluations.length - failed.length}/${evaluations.length} passed`,
  );

  return {
    setName: source.label,
    failedCount: failed.length,
  };
}

const parsed = parseArgs(process.argv.slice(2));
const selectedSets =
  parsed.set === "all" ? ["dev", "holdout", "regression"] : [parsed.set];
const selectedSources = selectedSets.flatMap((setName) =>
  loadFixtureSources(setName, parsed.bucket),
);
const summaries = selectedSources.map(runFixtureSource);
const failedCount = summaries.reduce(
  (count, summary) => count + summary.failedCount,
  0,
);

if (failedCount > 0) {
  process.exitCode = 1;
}
