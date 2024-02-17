"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const recase_1 = require("@kristiandupont/recase");
const vitest_1 = require("vitest");
const zod_1 = require("zod");
const parse_1 = __importDefault(require("./parse"));
const keyNormalizationFunction = (0, recase_1.recase)("mixed", "camel");
// Typescript type assertion:
function assertSameType(a, b) {
    return b; // This function doesn't need to do anything at runtime
}
(0, vitest_1.describe)("parse", () => {
    // These tests are from the original mdconf repo.
    // You can find the raw markdown in the examples folder.
    (0, vitest_1.describe)("Original tests", () => {
        (0, vitest_1.test)("empty", () => {
            const source = "";
            const expected = {};
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
        (0, vitest_1.test)("simple", () => {
            const source = `
## Uploads

- max: 200mb

- min: 1kb

- dir: /tmp/uploads
`;
            const expected = {
                uploads: {
                    max: "200mb",
                    min: "1kb",
                    dir: "/tmp/uploads",
                },
            };
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
        (0, vitest_1.test)("blocks", () => {
            const source = `
# Styles

Just some example styles:

    body {
      padding: 50px;
    }

And some styles for buttons:

    button {
      padding: 5px 10px;
    }
`;
            const expected = {
                styles: [
                    "body {\n  padding: 50px;\n}",
                    "button {\n  padding: 5px 10px;\n}",
                ],
            };
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
        (0, vitest_1.test)("blocks-gh", () => {
            const source = [
                "# Scripts",
                "",
                "```js",
                "document.write('<h1>mdconf</h1>');",
                "document.write('<p>Markdown configuration is pretty cool</p>');",
                "```",
                "",
                "# Styles",
                "",
                "Main structural styling:",
                "",
                "```css",
                "body {",
                "  padding: 50px;",
                "  font: 14px Helvetica;",
                "}",
                "```",
                "",
                "Some other stuff:",
                "",
                "```css",
                "button {",
                "  padding: 15px;",
                "}",
                "```",
            ].join("\n");
            const expected = {
                scripts: [
                    "document.write('<h1>mdconf</h1>');\ndocument.write('<p>Markdown configuration is pretty cool</p>');",
                ],
                styles: [
                    "body {\n  padding: 50px;\n  font: 14px Helvetica;\n}",
                    "button {\n  padding: 15px;\n}",
                ],
            };
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
        (0, vitest_1.test)("table", () => {
            const source = `
## Sites

| Host         |  Build  | Coverage |
| :----------- | :-----: | -------: |
| google.com   | passing |      94% |
| facebook.com | passing |      97% |
| twitter.com  | failed  |      81% |
| myspace.com  | unkown  |       0% |
`;
            const expected = {
                sites: [
                    {
                        host: "google.com",
                        build: "passing",
                        coverage: "94%",
                    },
                    {
                        host: "facebook.com",
                        build: "passing",
                        coverage: "97%",
                    },
                    {
                        host: "twitter.com",
                        build: "failed",
                        coverage: "81%",
                    },
                    {
                        host: "myspace.com",
                        build: "unkown",
                        coverage: "0%",
                    },
                ],
            };
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
        (0, vitest_1.test)("complex", () => {
            const source = `
# Defaults

## Upload

- max: 200mb
- dir: /tmp

### Thumbnail sizes

- 50x50
- 300x300
- 600x600
- 900x900

## S3

- api key: 111111
- secret: 222222

### Buckets

- avatars: myapp-avatars
- assets: myapp-assets
- files: myapp-files

# Production

## Upload

- max: 200mb

## Sites

| hostname     |  build  | coverage |
| :----------- | :-----: | -------: |
| google.com   | passing |      94% |
| facebook.com | passing |      97% |
| twitter.com  | failed  |      81% |
| myspace.com  | unkown  |       0% |
`;
            const expected = {
                defaults: {
                    upload: {
                        max: "200mb",
                        dir: "/tmp",
                        "thumbnail sizes": ["50x50", "300x300", "600x600", "900x900"],
                    },
                    s3: {
                        "api key": "111111",
                        secret: "222222",
                        buckets: {
                            avatars: "myapp-avatars",
                            assets: "myapp-assets",
                            files: "myapp-files",
                        },
                    },
                },
                production: {
                    upload: {
                        max: "200mb",
                    },
                    sites: [
                        {
                            hostname: "google.com",
                            build: "passing",
                            coverage: "94%",
                        },
                        {
                            hostname: "facebook.com",
                            build: "passing",
                            coverage: "97%",
                        },
                        {
                            hostname: "twitter.com",
                            build: "failed",
                            coverage: "81%",
                        },
                        {
                            hostname: "myspace.com",
                            build: "unkown",
                            coverage: "0%",
                        },
                    ],
                },
            };
            const actual = (0, parse_1.default)(source, { keyNormalizationFunction });
            (0, vitest_1.expect)(actual).toEqual(expected);
        });
    });
    (0, vitest_1.describe)("Validation", () => {
        (0, vitest_1.test)("Generic validator", () => {
            const expected = {
                config: {
                    filename: "config.json",
                    port: "3000",
                },
                resolutions: ["100", "200", "300"],
            };
            function validator(obj) {
                (0, vitest_1.expect)(obj).toEqual(expected);
                return obj;
            }
            const validSource = `
# Config
- filename: config.json
- port: 3000

# Resolutions
- 100
- 200
- 300
`;
            const actual = (0, parse_1.default)(validSource, {
                keyNormalizationFunction,
                validator,
            });
            (0, vitest_1.expect)(actual).toEqual(expected);
            assertSameType(actual, expected);
            const invalidSource = `
# Configuration
- filename: config.json
`;
            (0, vitest_1.expect)(() => (0, parse_1.default)(invalidSource, { keyNormalizationFunction, validator })).toThrow();
        });
        (0, vitest_1.test)("Zod validator", () => {
            const schema = zod_1.z.object({
                config: zod_1.z.object({
                    filename: zod_1.z.string(),
                    port: zod_1.z.string(),
                }),
                resolutions: zod_1.z.array(zod_1.z.string()),
            });
            const expected = {
                config: {
                    filename: "config.json",
                    port: "3000",
                },
                resolutions: ["100", "200", "300"],
            };
            const validSource = `
# Config
- filename: config.json
- port: 3000

# Resolutions
- 100
- 200
- 300
`;
            const actual = (0, parse_1.default)(validSource, {
                keyNormalizationFunction,
                validator: schema,
            });
            (0, vitest_1.expect)(actual).toEqual(expected);
            assertSameType(actual, expected);
            const invalidSource = `
# Configuration
- filename: config.json
`;
            (0, vitest_1.expect)(() => (0, parse_1.default)(invalidSource, {
                keyNormalizationFunction,
                validator: schema,
            })).toThrow();
        });
    });
});
