#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = process.cwd();

function parseArgs(argv) {
  const inputIndex = argv.indexOf("--input");
  const formatIndex = argv.indexOf("--format");
  const inputPath =
    inputIndex >= 0 && argv[inputIndex + 1]
      ? argv[inputIndex + 1]
      : "examples/requests/high-risk-review.json";
  const format =
    formatIndex >= 0 && argv[formatIndex + 1] === "json" ? "json" : "text";

  return { inputPath, format };
}

function readRequest(relativePath) {
  return JSON.parse(readFileSync(path.resolve(ROOT, relativePath), "utf8"));
}

function extractText(result) {
  const firstText = result.content.find((item) => item.type === "text");
  return firstText?.text ?? "";
}

function formatText(payload) {
  return [
    "MCP Smoke Result",
    "================",
    "",
    `Tool count: ${payload.toolCount}`,
    `Called tool: ${payload.calledTool}`,
    `Input: ${payload.inputPath}`,
    `상태: ${payload.reviewResult.검수결과.총괄상태.상태}`,
    `요약: ${payload.reviewResult.검수결과.요약}`,
  ].join("\n");
}

const { inputPath, format } = parseArgs(process.argv.slice(2));
const request = readRequest(inputPath);
const client = new Client(
  {
    name: "cosmetics-ad-compliance-smoke",
    version: "0.1.0",
  },
  {
    capabilities: {},
  },
);

try {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["scripts/run_mcp_server.mjs"],
    cwd: ROOT,
    stderr: "inherit",
  });

  await client.connect(transport);

  const tools = await client.listTools();
  const callResult = await client.callTool({
    name: "review_ad_copy",
    arguments: request,
  });
  const reviewResult = JSON.parse(extractText(callResult));
  const payload = {
    inputPath,
    calledTool: "review_ad_copy",
    toolCount: tools.tools.length,
    toolNames: tools.tools.map((tool) => tool.name),
    reviewResult,
  };

  if (format === "json") {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(formatText(payload));
  }
} finally {
  await client.close();
}
