import { marked, type Tokens } from "marked";

import type { StandardSchemaV1 } from "./standard-schema";

export type Validator<T> =
  | StandardSchemaV1<unknown, T>
  | ((obj: unknown) => T)
  | { parse: (obj: unknown) => T };

/** Thrown when a Standard Schema validator reports issues. */
export class ValidationError extends Error {
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>;

  constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    super(
      "Validation failed:\n" +
        issues.map((issue) => `  ${formatIssue(issue)}`).join("\n"),
    );
    this.name = "ValidationError";
    this.issues = issues;
  }
}

function formatIssue(issue: StandardSchemaV1.Issue): string {
  if (!issue.path || issue.path.length === 0) return issue.message;
  const path = issue.path
    .map((segment) =>
      String(typeof segment === "object" ? segment.key : segment),
    )
    .join(".");
  return `${path}: ${issue.message}`;
}

function validate<T>(validator: Validator<T>, obj: unknown): T {
  // Check for Standard Schema first: some libraries (e.g. ArkType) produce
  // schemas that are also callable, and zod schemas also have `.parse`.
  if ("~standard" in validator) {
    const result = validator["~standard"].validate(obj);
    if ("then" in result && typeof result.then === "function") {
      throw new TypeError(
        "mdconf does not support asynchronous validators; use a schema without async refinements or transforms.",
      );
    }
    const syncResult = result as StandardSchemaV1.Result<T>;
    if (syncResult.issues) throw new ValidationError(syncResult.issues);
    return syncResult.value;
  }
  if (typeof validator === "function") return validator(obj);
  return validator.parse(obj);
}

/**
 * The type a validator returns. Standard Schema is checked first so that
 * schemas which are also callable (e.g. ArkType) use the schema's output type.
 */
export type ValidatorOutput<V> =
  V extends StandardSchemaV1<any, infer O>
    ? O
    : V extends (obj: unknown) => infer O
      ? O
      : V extends { parse: (obj: unknown) => infer O }
        ? O
        : never;

type ParseOptions = {
  keyNormalizationFunction?: (s: string) => string;
};

function parse<V extends Validator<unknown>>(
  source: string,
  options: ParseOptions & { validator: V },
): ValidatorOutput<V>;
function parse<T = unknown>(
  source: string,
  options?: ParseOptions & { validator?: Validator<T> },
): T;
function parse<T>(
  source: string,
  options?: ParseOptions & { validator?: Validator<T> },
): T {
  const tokens = marked.lexer(source);
  const result = {};
  const keys: string[] = [];
  let depth = 0;

  const normalize: (s: string) => string =
    options?.keyNormalizationFunction ?? ((s: string) => s.trim());

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        while (depth-- >= token.depth) keys.pop();
        keys.push(normalize(token.text));
        depth = token.depth;
        break;
      }
      case "text": {
        putText(normalize, result, keys, token.text);
        break;
      }
      case "code": {
        putCode(normalize, result, keys, token.text);
        break;
      }
      case "table": {
        putTable(normalize, result, keys, token as Tokens.Table);
        break;
      }
      case "list": {
        putList(normalize, result, keys, token.items);
        break;
      }
    }
  }

  if (options?.validator) return validate(options.validator, result);

  return result as T;
}

function drillDown(obj: any, keys: string[]) {
  let target = obj;
  let last: any;
  let key: string = "(root)";

  for (const key_ of keys) {
    key = key_;
    last = target;
    target[key] = target[key] || {};
    target = target[key];
  }
  return { last, key, target };
}

function putList(
  normalize: (s: string) => string,
  result: unknown,
  keys: string[],
  list: Tokens.ListItem[],
) {
  const { last, key, target } = drillDown(result, keys);

  for (const item of list) {
    const str = item.text;
    const i = str.indexOf(":");

    // list
    if (i === -1) {
      if (!Array.isArray(last[key])) last[key] = [];
      last[key].push(str.trim());
      continue;
    }

    // map
    const keyMap = normalize(str.slice(0, i));
    const val = str.slice(i + 1).trim();
    target[keyMap] = val;
  }
}

function putCode(
  normalize: (s: string) => string,
  result: unknown,
  keys: string[],
  str: string,
) {
  const { last, key } = drillDown(result, keys);

  if (!Array.isArray(last[key])) last[key] = [];
  last[key].push(str);
}

function putTable(
  normalize: (s: string) => string,
  result: unknown,
  keys: string[],
  table: Tokens.Table,
) {
  const { last, key } = drillDown(result, keys);

  if (!Array.isArray(last[key])) last[key] = [];
  for (let ri = 0; ri < table.rows.length; ri++) {
    const arrItem: Record<string, string> = {};
    for (let hi = 0; hi < table.header.length; hi++) {
      arrItem[normalize(table.header[hi].text)] = table.rows[ri][hi].text;
    }
    last[key].push(arrItem);
  }
}

function putText(
  normalize: (s: string) => string,
  result: unknown,
  keys: string[],
  str: string,
) {
  const { last, key, target } = drillDown(result, keys);

  const i = str.indexOf(":");

  // list
  if (-1 == i) {
    if (!Array.isArray(last[key])) last[key] = [];
    last[key].push(str.trim());
    return;
  }

  // map
  const keyMap = normalize(str.slice(0, i));
  const val = str.slice(i + 1).trim();
  target[keyMap] = val;
}

export default parse;
