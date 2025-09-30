This is a TS-implementation of [CommonMark], developed from the JS-implementation [commonmark.js].

This uses a compiling mechanism, i.e., compile while editing. It finds the
smallest dirty node, and recompiles that node only, reusing unrelated nodes
within the dirty node. So it is very efficient for editing.

### Unittest

```bash
cd /path_to/commonmark.ts
# deno 2.4.3
deno test -RN # 1 passed (782 steps)
```

[CommonMark]: https://spec.commonmark.org/0.31.2/
[commonmark.js]: https://github.com/commonmark/commonmark.js
