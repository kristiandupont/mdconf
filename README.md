# mdconf

Markdown driven configuration!

This is a fork of [mdconf](https://github.com/tj/mdconf) by TJ Holowaychuk.
The original project seems abandoned, so this version has updated dependencies and the possibility to specify how key names should be normalized.

## Installation

```
$ npm install @kristiandupont/mdconf
```

## API

```js
import parse from "mdconf";
import { z } from "zod";

parse("string of markdown");
// => Object

const schema = z.object({
  configuration: z.array(z.string()),
});

//..or, pass options as the second parameter
parse("string of markdown", {
  keyNormalizationFunction: (s) => s.toLowercase(),
  validator: schema,
});
```

## Example

Markdown headings act as keys, list items with `:` act as maps,
otherwise regular lists behave as.. lists.

```markdown
# Defaults

Since this is markdown you can still have regular text
to explain what the hell is going on.

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

- max: 1gb
- dir: /data/uploads

## Sites

| hostname     |  build  | coverage |
| :----------- | :-----: | -------: |
| google.com   | passing |      94% |
| facebook.com | passing |      97% |
| twitter.com  | failed  |      81% |
| myspace.com  | unkown  |       0% |
```

output json:

```json
{
  "defaults": {
    "upload": {
      "max": "200mb",
      "dir": "/tmp",
      "thumbnail sizes": ["50x50", "300x300", "600x600", "900x900"]
    },
    "s3": {
      "api key": "111111",
      "secret": "222222",
      "buckets": {
        "avatars": "myapp-avatars",
        "assets": "myapp-assets",
        "files": "myapp-files"
      }
    }
  },
  "production": {
    "upload": {
      "max": "1gb",
      "dir": "/data/uploads"
    },
    "sites": [
      {
        "hostname": "google.com",
        "build": "passing",
        "coverage": "94%"
      },
      {
        "hostname": "facebook.com",
        "build": "passing",
        "coverage": "97%"
      },
      {
        "hostname": "twitter.com",
        "build": "failed",
        "coverage": "81%"
      },
      {
        "hostname": "myspace.com",
        "build": "unkown",
        "coverage": "0%"
      }
    ]
  }
}
```

## License

(The MIT License)

Copyright (c) 2013 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Copyright (c) 2023 Kristian Dupont &lt;kristian@kristiandupont.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
