#!/usr/bin/env node

import { createReviewMcpServer } from "../dist/packages/mcp/src/server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const server = createReviewMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("cosmetics-ad-compliance MCP server running on stdio");
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exitCode = 1;
});
