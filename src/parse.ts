import { marked } from 'marked';

type ParseOptions = {
  keyNormalizationFunction?: (s: string) => string;
};

function parse(source: string, options?: ParseOptions): unknown {
  const tokens = marked.lexer(source);
  const result = {};
  const keys: string[] = [];
  let depth = 0;

  const normalize: (s: string) => string =
    options?.keyNormalizationFunction ?? ((s: string) => s.trim());

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        while (depth-- >= token.depth) keys.pop();
        keys.push(normalize(token.text));
        depth = token.depth;
        break;
      }
      case 'text': {
        putText(normalize, result, keys, token.text);
        break;
      }
      case 'code': {
        putCode(normalize, result, keys, token.text);
        break;
      }
      case 'table': {
        putTable(normalize, result, keys, token);
        break;
      }
      case 'list': {
        putList(normalize, result, keys, token.items);
        break;
      }
    }
  }

  return result;
}

function drillDown(obj: any, keys: string[]) {
  let target = obj;
  let last;
  let key;

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
  list: marked.Tokens.ListItem[],
) {
  const { last, key, target } = drillDown(result, keys);

  for (const item of list) {
    const str = item.text;
    const i = str.indexOf(':');

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
  table: marked.Tokens.Table,
) {
  const { last, key } = drillDown(result, keys);

  if (!Array.isArray(last[key])) last[key] = [];
  for (let ri = 0; ri < table.rows.length; ri++) {
    const arrItem = {};
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

  const i = str.indexOf(':');

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
