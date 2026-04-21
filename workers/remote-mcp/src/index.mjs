import { createMcpHandler } from "agents/mcp";

import { createReviewMcpServer } from "../../../dist/packages/mcp/src/server.js";
import {
  applyMinuteRateLimit,
  createEmptyMinuteRateLimitState,
} from "../../../dist/packages/mcp/src/remote-rate-limit.js";

const DEFAULT_MCP_ROUTE = "/mcp";
const DEFAULT_PER_MINUTE_LIMIT = 30;
const DEFAULT_GLOBAL_PER_MINUTE_LIMIT = 300;
const RATE_LIMIT_STATE_KEY = "minute-rate-limit-state";
const RATE_LIMIT_DO_NAME = "global-rate-limit-controller";

function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers,
  });
}

function readIntegerEnv(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRoute(env) {
  return env.MCP_ROUTE || DEFAULT_MCP_ROUTE;
}

function getPerMinuteLimit(env) {
  return readIntegerEnv(env.RATE_LIMIT_PER_MINUTE, DEFAULT_PER_MINUTE_LIMIT);
}

function getGlobalPerMinuteLimit(env) {
  return readIntegerEnv(
    env.RATE_LIMIT_GLOBAL_PER_MINUTE,
    DEFAULT_GLOBAL_PER_MINUTE_LIMIT,
  );
}

function getClientKey(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return `ip:${cfConnectingIp.trim()}`;
  }

  const xForwardedFor = request.headers.get("x-forwarded-for");

  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    return `ip:${xForwardedFor.split(",")[0].trim()}`;
  }

  const userAgent = request.headers.get("user-agent") ?? "unknown-user-agent";
  return `ua:${userAgent.slice(0, 120)}`;
}

async function enforceRateLimit(request, env) {
  const limiterId = env.REMOTE_MCP_RATE_LIMITER.idFromName(RATE_LIMIT_DO_NAME);
  const limiter = env.REMOTE_MCP_RATE_LIMITER.get(limiterId);
  const body = {
    clientKey: getClientKey(request),
    nowMs: Date.now(),
    perMinuteLimit: getPerMinuteLimit(env),
    globalPerMinuteLimit: getGlobalPerMinuteLimit(env),
  };

  const response = await limiter.fetch("https://rate-limit/check", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  return {
    status: response.status,
    payload,
  };
}

function buildRemoteInfo(env, request) {
  return {
    name: "cosmetics-ad-compliance remote MCP",
    route: getRoute(env),
    transport: "streamable-http",
    limits: {
      perMinute: getPerMinuteLimit(env),
      globalPerMinute: getGlobalPerMinuteLimit(env),
    },
    description:
      "5개 근거 문서를 기준으로 화장품 광고카피를 검수하는 remote MCP 서버입니다.",
    usage: {
      claudeConnectorUrl: new URL(getRoute(env), request.url).toString(),
    },
  };
}

export default {
  async fetch(request, env, ctx) {
    const route = getRoute(env);
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse(buildRemoteInfo(env, request));
    }

    if (url.pathname !== route) {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "OPTIONS") {
      const rateLimitResult = await enforceRateLimit(request, env);

      if (rateLimitResult.status === 429) {
        return jsonResponse(rateLimitResult.payload, {
          status: 429,
          headers: {
            "retry-after": String(rateLimitResult.payload.retryAfterSeconds ?? 60),
          },
        });
      }
    }

    const handler = createMcpHandler(createReviewMcpServer(), {
      route,
      enableJsonResponse: true,
      corsOptions: {
        origin: ["*"],
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowHeaders: ["content-type", "authorization", "accept"],
      },
    });

    return handler(request, env, ctx);
  },
};

export class RemoteMcpRateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse(
        {
          error: "method_not_allowed",
          message: "Rate limiter only accepts POST requests.",
        },
        { status: 405 },
      );
    }

    const payload = await request.json();
    const currentState =
      (await this.state.storage.get(RATE_LIMIT_STATE_KEY)) ??
      createEmptyMinuteRateLimitState(payload.nowMs);
    const decision = applyMinuteRateLimit(currentState, payload);

    if (decision.allowed) {
      await this.state.storage.put(RATE_LIMIT_STATE_KEY, decision.state);
      return jsonResponse({
        allowed: true,
        clientCount: decision.clientCount,
        globalCount: decision.globalCount,
      });
    }

    return jsonResponse(
      {
        allowed: false,
        scope: decision.scope,
        retryAfterSeconds: decision.retryAfterSeconds,
        clientCount: decision.clientCount,
        globalCount: decision.globalCount,
        message:
          decision.scope === "global"
            ? "서버 전체 호출량 제한을 초과했습니다. 잠시 후 다시 시도해 주세요."
            : "분당 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      },
      {
        status: 429,
        headers: {
          "retry-after": String(decision.retryAfterSeconds),
        },
      },
    );
  }
}
