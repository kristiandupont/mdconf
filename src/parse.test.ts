import { recase } from "@kristiandupont/recase";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import parse from "./parse";

const keyNormalizationFunction = recase("mixed", "camel");

// Typescript type assertion:
function assertSameType<T>(a: T, b: T): T {
  return b; // This function doesn't need to do anything at runtime
}

describe("parse", () => {
  // These tests are from the original mdconf repo.
  // You can find the raw markdown in the examples folder.
  describe("Original tests", () => {
    test("empty", () => {
      const source = "";
      const expected = {};
      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });

    test("simple", () => {
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

      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });

    test("blocks", () => {
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

      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });

    test("blocks-gh", () => {
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

      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });

    test("table", () => {
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

      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });

    test("complex", () => {
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

      const actual = parse(source, { keyNormalizationFunction });
      expect(actual).toEqual(expected);
    });
  });

  describe("Validation", () => {
    test("Generic validator", () => {
      const expected = {
        config: {
          filename: "config.json",
          port: "3000",
        },
        resolutions: ["100", "200", "300"],
      };

      function validator(obj: unknown): typeof expected {
        expect(obj).toEqual(expected);
        return obj as typeof expected;
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

      const actual = parse(validSource, {
        keyNormalizationFunction,
        validator,
      });
      expect(actual).toEqual(expected);
      assertSameType(actual, expected);

      const invalidSource = `
# Configuration
- filename: config.json
`;

      expect(() =>
        parse(invalidSource, { keyNormalizationFunction, validator }),
      ).toThrow();
    });

    test("Zod validator", () => {
      const schema = z.object({
        config: z.object({
          filename: z.string(),
          port: z.string(),
        }),
        resolutions: z.array(z.string()),
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

      const actual = parse(validSource, {
        keyNormalizationFunction,
        validator: schema,
      });
      expect(actual).toEqual(expected);
      assertSameType(actual, expected);

      const invalidSource = `
# Configuration
- filename: config.json
`;

      expect(() =>
        parse(invalidSource, {
          keyNormalizationFunction,
          validator: schema,
        }),
      ).toThrow();
    });
  });
});
