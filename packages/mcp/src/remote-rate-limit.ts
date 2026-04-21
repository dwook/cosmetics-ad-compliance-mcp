export interface MinuteRateLimitState {
  minuteBucket: number;
  globalCount: number;
  clientCounts: Record<string, number>;
}

export interface MinuteRateLimitInput {
  clientKey: string;
  nowMs: number;
  perMinuteLimit: number;
  globalPerMinuteLimit: number;
}

export interface MinuteRateLimitDecision {
  allowed: boolean;
  scope: "client" | "global" | null;
  clientCount: number;
  globalCount: number;
  retryAfterSeconds: number;
  state: MinuteRateLimitState;
}

const ONE_MINUTE_MS = 60_000;

export function createEmptyMinuteRateLimitState(
  nowMs = Date.now(),
): MinuteRateLimitState {
  return {
    minuteBucket: Math.floor(nowMs / ONE_MINUTE_MS),
    globalCount: 0,
    clientCounts: {},
  };
}

export function applyMinuteRateLimit(
  previousState: MinuteRateLimitState | null | undefined,
  input: MinuteRateLimitInput,
): MinuteRateLimitDecision {
  const currentMinuteBucket = Math.floor(input.nowMs / ONE_MINUTE_MS);
  const state =
    previousState && previousState.minuteBucket === currentMinuteBucket
      ? {
          minuteBucket: previousState.minuteBucket,
          globalCount: previousState.globalCount,
          clientCounts: { ...previousState.clientCounts },
        }
      : createEmptyMinuteRateLimitState(input.nowMs);

  const currentClientCount = state.clientCounts[input.clientKey] ?? 0;
  const nextClientCount = currentClientCount + 1;
  const nextGlobalCount = state.globalCount + 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((((state.minuteBucket + 1) * ONE_MINUTE_MS) - input.nowMs) / 1000),
  );

  if (currentClientCount >= input.perMinuteLimit) {
    return {
      allowed: false,
      scope: "client",
      clientCount: currentClientCount,
      globalCount: state.globalCount,
      retryAfterSeconds,
      state,
    };
  }

  if (state.globalCount >= input.globalPerMinuteLimit) {
    return {
      allowed: false,
      scope: "global",
      clientCount: currentClientCount,
      globalCount: state.globalCount,
      retryAfterSeconds,
      state,
    };
  }

  state.clientCounts[input.clientKey] = nextClientCount;
  state.globalCount = nextGlobalCount;

  return {
    allowed: true,
    scope: null,
    clientCount: nextClientCount,
    globalCount: nextGlobalCount,
    retryAfterSeconds,
    state,
  };
}
