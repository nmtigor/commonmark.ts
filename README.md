This is a TS-implementation of [CommonMark], developed from the JS-implementation [commonmark.js].

This uses a compiling mechanism, i.e., compile while editing. It finds the
smallest dirty node, and recompiles that node only, reusing unrelated nodes
within the dirty node. So it is very efficient for editing.

### unittest

```bash
cd /path_to/commonmark.ts/src/test
deno test --allow-read --allow-net
```

### Known issue

Using Deno 2.1.3 causes "segmentation fault" in one-line error message! ([#25192](https://github.com/denoland/deno/issues/25192))

Downgrading to 1.45.5 (`deno upgrade --version 1.45.5`) works fine.

[CommonMark]: https://spec.commonmark.org/0.31.2/
[commonmark.js]: https://github.com/commonmark/commonmark.js
