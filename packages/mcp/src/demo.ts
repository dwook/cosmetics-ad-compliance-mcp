import type { ReviewResult } from "../../shared-types/src/index.js";
import { executeTool } from "./toolset.js";
import { formatReviewText } from "../../core/src/review-text-formatter.js";
import {
  formatDemoSampleList,
  resolveDemoSample,
} from "./demo-samples.js";

function parseDemoArgs(argv: string[]): {
  format: "json" | "text";
  selector?: string;
  list: boolean;
} {
  let format: "json" | "text" = "text";
  let selector: string | undefined;
  let list = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--format") {
      const value = argv[index + 1];

      if (value === "json" || value === "text") {
        format = value;
        index += 1;
        continue;
      }

      throw new Error("--format must be json or text");
    }

    if (token === "--list") {
      list = true;
      continue;
    }

    if (!selector) {
      selector = token;
      continue;
    }

    throw new Error(`unexpected demo argument: ${token}`);
  }

  return {
    format,
    selector,
    list,
  };
}

function main(): void {
  const parsed = parseDemoArgs(process.argv.slice(2));

  if (parsed.list) {
    console.log(formatDemoSampleList());
    return;
  }

  const sample = resolveDemoSample(parsed.selector);
  const result = executeTool("review_ad_copy", sample.request) as ReviewResult;

  if (parsed.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Demo Sample: ${sample.sampleId} · ${sample.title}`);
  console.log(`Source Case: ${sample.sourceCaseId}`);
  console.log("");
  console.log(formatReviewText(result));
}

main();
