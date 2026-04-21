declare module "node:test" {
  type TestFn = () => void | Promise<void>;

  export default function test(name: string, fn: TestFn): void;
}

declare module "node:assert/strict" {
  interface AssertModule {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
  }

  const assert: AssertModule;
  export default assert;
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readdirSync(path: string): string[];
  export function readFileSync(
    path: string,
    options?: { encoding?: "utf8" } | "utf8",
  ): string;
  export function writeFileSync(
    path: string,
    data: string,
    options?: { encoding?: "utf8" } | "utf8",
  ): void;
}

declare module "node:path" {
  function resolve(...paths: string[]): string;
  function join(...paths: string[]): string;

  const path: {
    resolve: typeof resolve;
    join: typeof join;
  };

  export { resolve, join };
  export default path;
}

declare module "node:child_process" {
  export function execFileSync(
    file: string,
    args?: string[],
    options?: {
      cwd?: string;
      encoding?: "utf8";
    },
  ): string;
}

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

declare const process: {
  argv: string[];
  cwd: () => string;
  execPath: string;
  exitCode?: number;
};
