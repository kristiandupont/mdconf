"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const marked_1 = require("marked");
function parse(source, options) {
  var _a;
  const tokens = marked_1.marked.lexer(source);
  const result = {};
  const keys = [];
  let depth = 0;
  const normalize =
    (_a =
      options === null || options === void 0
        ? void 0
        : options.keyNormalizationFunction) !== null && _a !== void 0
      ? _a
      : (s) => s.trim();
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
        putTable(normalize, result, keys, token);
        break;
      }
      case "list": {
        putList(normalize, result, keys, token.items);
        break;
      }
    }
  }
  return result;
}
function drillDown(obj, keys) {
  let target = obj;
  let last;
  let key = "(root)";
  for (const key_ of keys) {
    key = key_;
    last = target;
    target[key] = target[key] || {};
    target = target[key];
  }
  return { last, key, target };
}
function putList(normalize, result, keys, list) {
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
function putCode(normalize, result, keys, str) {
  const { last, key } = drillDown(result, keys);
  if (!Array.isArray(last[key])) last[key] = [];
  last[key].push(str);
}
function putTable(normalize, result, keys, table) {
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
function putText(normalize, result, keys, str) {
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
exports.default = parse;
