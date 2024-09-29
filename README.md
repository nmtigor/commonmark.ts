This is a TS-implementation of [CommonMark], developed from the JS-implementation [commonmark.js].

This adds the feature that, when editing, it finds the smallest dirty node, and recompiles that node only, reusing unrelated nodes within the dirty node. So it is very efficient for editing.

### unittest

- ```bash
  cd /path_to/commonmark.ts/src/test
  deno test --allow-read --allow-net ../lib
  ```


[CommonMark]: https://spec.commonmark.org/0.31.2/
[commonmark.js]: https://github.com/commonmark/commonmark.js