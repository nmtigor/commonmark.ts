/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextLexr_test
 * @license BSD-3-Clause
 ******************************************************************************/

import {
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
} from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import type { id_t, uint } from "../../alias.ts";
import type { TestO } from "../_test.ts";
import { ran, repl, rv, test_o, undo } from "../_test.ts";
import { MdextBufr } from "./MdextBufr.ts";
import { MdextLexr } from "./MdextLexr.ts";
import type { List } from "./stnode/List.ts";
/*80--------------------------------------------------------------------------*/

const bufr = new MdextBufr();
const lexr = MdextLexr.create(bufr);
const pazr = lexr.pazr_$;
Object.assign(test_o, { bufr, lexr, pazr } as Partial<TestO>);

function init(text_x?: string[] | string) {
  lexr.resetMdextLexr();
  bufr.repl_actr.init(lexr);
  bufr.repl_mo.registHandler((n_y) => bufr.repl_actr.to(n_y));

  if (text_x) repl(rv(0, 0), text_x);
}

afterEach(() => {
  bufr.resetBufr();
});

type Example_ = {
  markdown: string;
  html: string;
  sec_1: string;
  sec_2: string | undefined;
  number: uint;
};

// let hr_ = 0, hr_1;
const sectionTest_m = (p_testfile_x: string) => {
  const example_a: Example_[] = (() => {
    const data = Deno.readTextFileSync(p_testfile_x);
    const examples: Example_[] = [];
    let sec_1 = "(anonym)",
      sec_2: string | undefined;
    let example_number: uint = 0;
    const tests = data
      .replace(/\r\n?/g, "\n") // Normalize newlines for platform independence
      .replace(/^<!-- END TESTS -->(.|[\n])*/m, "");

    tests.replace(
      /^`{32} example\n([\s\S]*?)\n^\.\n([\s\S]*?)\n?^`{32}$|^(#{1,2}) *(.*)$/gm,
      (_, markdownSubmatch, htmlSubmatch, levelSubmatch, sectionSubmatch) => {
        if (sectionSubmatch) {
          if (levelSubmatch.length === 1) {
            sec_1 = `# ${sectionSubmatch}`;
            sec_2 = undefined;
          } else {
            sec_2 = `## ${sectionSubmatch}`;
          }
        } else {
          example_number++;
          examples.push({
            markdown: markdownSubmatch,
            html: htmlSubmatch,
            sec_1,
            sec_2,
            number: example_number,
          });
        }
        return "";
      },
    );
    return examples;
  })();
  // console.log("🚀 ~ example_a:", example_a)

  type it_t = [it: string, fn: () => void];
  const ret = new Map<string, (it_t | Map<string, it_t[]>)[]>();
  for (let i = 0, iI = example_a.length; i < iI; ++i) {
    const exp_i = example_a[i];
    const sec_1 = exp_i.sec_1;
    const sec_2 = exp_i.sec_2;

    if (!ret.has(sec_1)) ret.set(sec_1, []);
    const sectionTest = (() => {
      let test_a = ret.get(sec_1)!;
      if (sec_2) {
        if (!(test_a.at(-1) instanceof Map)) test_a.push(new Map());
        const its_m = test_a.at(-1) as Map<string, it_t[]>;
        if (!its_m.has(sec_2)) its_m.set(sec_2, []);
        test_a = its_m.get(sec_2)!;
      }
      return test_a;
    })();

    const markdown = exp_i.markdown.replace(/→/g, "\t");
    const expected = exp_i.html.replace(/→/g, "\t");
    sectionTest.push([`Example ${exp_i.number}`, () => {
      // hr_1 = performance.now();
      init(markdown);
      // hr_ += performance.now() - hr_1;
      assertEquals(pazr._root?._toHTML(lexr), expected);
    }]);
  }
  return ret;
};

for (
  const testfile of [
    // "test.txt",
    "spec.txt",
    "spec_more.txt",
    "regression.txt",
  ]
) {
  describe(testfile, () => {
    // after(() => {
    //   console.log(`Elapsed time: ${hr_.toFixed()}ms`);
    // });

    sectionTest_m(`${import.meta.dirname}/${testfile}`).forEach((_a, desc) =>
      describe(
        desc,
        () =>
          _a.forEach((_x) =>
            _x instanceof Map
              ? _x.forEach((_y, desc_y) =>
                describe(desc_y, () => _y.forEach((_z) => it(..._z)))
              )
              : it(..._x)
          ),
      )
    );
  });
}

describe("Compiling Paragraph", () => {
  it("edits in one Paragraph without line feed", () => {
    init(["p", "", "abc", "123", "xyz", "", "n"]);
    let tkId_a: id_t[], tkId_a_1: id_t[];

    // tkId_a = lexr._tkId_a;
    // console.log("🚀 ~ it ~ tkId_a:", tkId_a)
    repl(ran(3)._rv, "4");
    /*
    p
    ⏎
    abc
    1234
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-4)",
        "text[4-0,4-3)",
      ],
      "text[6-0,6-1)",
      ["stopBdry[6-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    // tkId_a_1 = lexr._tkId_a;
    // console.log("🚀 ~ it ~ tkId_a_1:", tkId_a_1)
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>abc", "1234", "xyz</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[3-0,3-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(2, 1, 2, 2), "");
    /*
    p
    ⏎
    ac
    1234
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-2)",
        "text[3-0,3-4)",
        "text[4-0,4-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>ac", "1234", "xyz</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[4-0,4-3)",
      "text[3-0,3-4)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one Paragraph without line feed", () => {
    init(["p", "", "abc", "123", "xyz", "", "n"]);
    let tkId_a: id_t[], tkId_a_1: id_t[];

    // tkId_a = lexr._tkId_a;
    // console.log("🚀 ~ it ~ tkId_a:", tkId_a)
    repl(ran(4)._rv, "4");
    /*
    p
    ⏎
    abc
    123
    xyz4
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-3)",
        "text[4-0,4-4)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    // tkId_a_1 = lexr._tkId_a;
    // console.log("🚀 ~ it ~ tkId_a_1:", tkId_a_1)
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>abc", "123", "xyz4</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[2-0,2-3), text[4-0,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[4-0,4-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[3-0,3-3)",
      "text[6-0,6-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    ⏎
    abc
    123
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-3)",
        "text[4-0,4-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[3-0,3-3)",
      "text[6-0,6-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(2, 0), "4"); // 3144
    /*
    p
    ⏎
    4abc
    123
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-4)",
        "text[3-0,3-3)",
        "text[4-0,4-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>4abc", "123", "xyz</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[2-0,2-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[3-0,3-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    ⏎
    abc
    123
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-3)",
        "text[4-0,4-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[3-0,3-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {
    init(["p", "n"]);

    repl(rv(0, 0), "\n");
    /*
    ⏎
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[1-0,1-1)", "text[2-0,2-1)"],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-0,1-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[2-0,2-1)"],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(lexr._relexd, true);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1), text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(1)._rv, "\n");
    /*
    p
    n
    ⏎
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[2-0)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), [
      "Document,0 [ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), [
      "Document,0 [ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling BlockQuote", () => {
  describe("Paragraph in BlockQuote", () => {
    it("edits in one Paragraph without line feed", () => {
      init(["> p", ">", "> abc", "> 123", "> xyz", ">", "> n"]);
      let tkId_a: id_t[], tkId_a_1: id_t[];

      tkId_a = lexr._tkId_a;
      repl(ran(3)._rv, "4");
      /*
      > p
      >
      > abc
      > 1234
      > xyz
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-6)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
        ],
        "block_quote_marker[5-0,5-1)",
        ["block_quote_marker[6-0,6-1)", "text[6-2,6-3)", "stopBdry[6-3)"],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(tkId_a_1[4], tkId_a[4]);
      assertEquals(tkId_a_1[6], tkId_a[6]);
      assertEquals(tkId_a_1[8], tkId_a[8]);
      assertEquals(tkId_a_1[10], tkId_a[10]);
      assertEquals(tkId_a_1[11], tkId_a[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "1234", "xyz</p>", "<p>n</p>",
          "</blockquote>", 
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0)?._c(1));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[3-2,3-5)"]);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[2-2,2-5)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      repl(rv(2, 3, 2, 4), "");
      /*
      > p
      >
      > ac
      > 1234
      > xyz
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-4)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-6)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
          "block_quote_marker[5-0,5-1)",
          "block_quote_marker[6-0,6-1)", "text[6-2,6-3)",
        ],
        "stopBdry[6-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(tkId_a_1[4], tkId_a[4]);
      assertEquals(tkId_a_1[6], tkId_a[6]);
      assertEquals(tkId_a_1[8], tkId_a[8]);
      assertEquals(tkId_a_1[10], tkId_a[10]);
      assertEquals(tkId_a_1[11], tkId_a[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>ac", "1234", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2,iS [ text[0-2,0-3) ]",
        "Paragraph,2,iS [ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[4-2,4-5)",
        "text[3-2,3-6)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
    });

    it("edits at boundaries of one Paragraph without line feed", () => {
      init(["> p", ">", "> abc", "> 123", "> xyz", ">", "> n"]);
      let tkId_a: id_t[], tkId_a_1: id_t[];

      tkId_a = lexr._tkId_a;
      repl(ran(4)._rv, "4");
      /*
      > p
      >
      > abc
      > 123
      > xyz4
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-6)",
          "block_quote_marker[5-0,5-1)",
          "block_quote_marker[6-0,6-1)", "text[6-2,6-3)",
        ],
        "stopBdry[6-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(tkId_a_1[4], tkId_a[4]);
      assertEquals(tkId_a_1[6], tkId_a[6]);
      assertEquals(tkId_a_1[8], tkId_a[8]);
      assertEquals(tkId_a_1[10], tkId_a[10]);
      assertEquals(tkId_a_1[11], tkId_a[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz4</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2,iS [ text[0-2,0-3) ]",
        "Paragraph,2 [ text[2-2,2-5), text[4-2,4-5) ]",
        "Paragraph,2,iS [ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(1));
      assertStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[4-2,4-5)"]);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[2-2,2-5)",
        "text[3-2,3-5)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      tkId_a = lexr._tkId_a;
      undo();
      /*
      > p
      >
      > abc
      > 123
      > xyz
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
          "block_quote_marker[5-0,5-1)",
          "block_quote_marker[6-0,6-1)", "text[6-2,6-3)",
        ],
        "stopBdry[6-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(tkId_a_1[4], tkId_a[4]);
      assertEquals(tkId_a_1[6], tkId_a[6]);
      assertEquals(tkId_a_1[8], tkId_a[8]);
      assertEquals(tkId_a_1[10], tkId_a[10]);
      assertEquals(tkId_a_1[11], tkId_a[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2,iS [ text[0-2,0-3) ]",
        "Paragraph,2,iS [ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[2-2,2-5)",
        "text[3-2,3-5)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      // tkId_a = lexr._tkId_a;
      repl(rv(2, 2), "4");
      /*
      > p
      >
      > 4abc
      > 123
      > xyz
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-6)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
          "block_quote_marker[5-0,5-1)",
          "block_quote_marker[6-0,6-1)", "text[6-2,6-3)",
        ],
        "stopBdry[6-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      // tkId_a_1 = lexr._tkId_a;
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>4abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2,iS [ text[0-2,0-3) ]",
        "Paragraph,2,iS [ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[2-2,2-5)"]);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[3-2,3-5)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      // tkId_a = lexr._tkId_a;
      undo();
      /*
      > p
      >
      > abc
      > 123
      > xyz
      >
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
          "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
          "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
          "block_quote_marker[5-0,5-1)",
          "block_quote_marker[6-0,6-1)", "text[6-2,6-3)",
        ],
        "stopBdry[6-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      // tkId_a_1 = lexr._tkId_a;
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2,iS [ text[0-2,0-3) ]",
        "Paragraph,2,iS [ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[3-2,3-5)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
    });

    it("feeds lines", () => {
      init(["> p", "> n"]);
      let tkId_a: id_t[], tkId_a_1: id_t[];

      repl(rv(0, 0), ">\n");
      /*
      >
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)",
          "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-3)",
        ],
        "stopBdry[2-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p", "n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root);
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2 [ text[0-2,0-3), text[1-2,1-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[0-2,0-3)",
        "text[1-2,1-3)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
        ],
        "stopBdry[1-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p", "n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root);
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2 [ text[1-2,1-3), text[2-2,2-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[1-2,1-3)",
        "text[2-2,2-3)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      tkId_a = lexr._tkId_a;
      repl(rv(1, 2), "\n> "); // 👍
      /*
      > p
      >·
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)",
          "block_quote_marker[2-0,2-1)", "text[2-2,2-3)",
        ],
        "stopBdry[2-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p</p>", "<p>n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, true);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[0-2,0-3)",
        "text[1-2,1-3)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      tkId_a = lexr._tkId_a;
      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
        ],
        "stopBdry[1-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(tkId_a_1[3], tkId_a[3]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p", "n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,2 [ text[0-2,0-3), text[2-2,2-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[0-2,0-3)",
        "text[2-2,2-3)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      repl(ran(1)._rv, "\n>");
      /*
      > p
      > n
      >
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
          "block_quote_marker[2-0,2-1)",
        ],
        "stopBdry[2-1)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p", "n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root);
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), [
        "Document,0 [ block_quote_marker[0-0,0-1), block_quote_marker*[2-0,2-1) ]",
        "Paragraph,2,iS [ text[0-2,0-3), text[1-2,1-3) ]",
      ]);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "BlockQuote,1 [ block_quote_marker[0-0,0-1), block_quote_marker*[2-0,2-1) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "text[0-2,0-3)",
        "block_quote_marker[1-0,1-1)",
        "text[1-2,1-3)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
          "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
        ],
        "stopBdry[1-3)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      assertEquals(
        pazr._root?._toHTML(lexr),
        ["<blockquote>", "<p>p", "n</p>", "</blockquote>"].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root);
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[0-2,0-3)",
        "text[1-2,1-3)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
    });
  });
});

describe("Compiling IndentedCodeBlock", () => {
  it("edits in one IndentedCodeBlock without line feed", () => {
    init(["p", "", "    abc", "    123", "    xyz", "n"]);

    repl(ran(3)._rv, "4");
    /*
    p
    ⏎
    ····abc
    ····1234
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-7)",
        "chunk[3-4,3-8)",
        "chunk[4-4,4-7)",
      ],
      "text[5-0,5-1)",
      ["stopBdry[5-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>abc", "1234", "xyz", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[2-4,2-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[3-4,3-7)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(2, 5, 2, 6), "");
    /*
    p
    ⏎
    ····ac
    ····1234
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-6)",
        "chunk[3-4,3-8)",
        "chunk[4-4,4-7)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>ac", "1234", "xyz", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[4-4,4-7)",
      "chunk[3-4,3-8)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one IndentedCodeBlock without line feed", () => {
    init(["p", "", "    abc", "    123", "    xyz", "n"]);

    repl(ran(4)._rv, "4");
    /*
    p
    ⏎
    ····abc
    ····123
    ····xyz4
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-7)",
        "chunk[3-4,3-7)",
        "chunk[4-4,4-8)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>abc", "123", "xyz4", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "IndentedCodeBlock,1 [ chunk[2-4,2-7), chunk[4-4,4-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[2-4,2-7)",
      "chunk[3-4,3-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[4-4,4-7)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[5-0,5-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    ⏎
    ····abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-7)",
        "chunk[3-4,3-7)",
        "chunk[4-4,4-7)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>abc", "123", "xyz", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[2-4,2-7)",
      "chunk[3-4,3-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[5-0,5-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(2, 4), "4");
    /*
    p
    ⏎
    ····4abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-8)",
        "chunk[3-4,3-7)",
        "chunk[4-4,4-7)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>4abc", "123", "xyz", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[3-4,3-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[2-4,2-7)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    ⏎
    ····abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-4,2-7)",
        "chunk[3-4,3-7)",
        "chunk[4-4,4-7)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>abc", "123", "xyz", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[3-4,3-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling FencedCodeBlock", () => {
  it("edits in one FencedCodeBlock without line feed", () => {
    init(["p", "```", "```", "n"]);

    repl(ran(1)._rv, "\n");
    /*
    p
    ```
    ⏎
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[1-0,1-3)",
        "chunk[2-0)",
        "code_fence[3-0,3-3)",
      ],
      "text[4-0,4-1)",
      ["stopBdry[4-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code>", "</code></pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "code_fence[1-0,1-3)",
      "code_fence[2-0,2-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(3, 0), "abc\n");
    /*
    p
    ```
    ⏎
    abc
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[1-0,1-3)",
        "chunk[2-0)",
        "chunk[3-0,3-3)",
        "code_fence[4-0,4-3)",
      ],
      "text[5-0,5-1)",
      ["stopBdry[5-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<pre><code>", "abc", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "code_fence[1-0,1-3)",
      "code_fence[3-0,3-3)",
      "chunk[2-0)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(1)._rv, "xyz");
    /*
    p
    ```xyz
    ⏎
    abc
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[1-0,1-3)", "chunk[1-3,1-6)",
        "chunk[2-0)",
        "chunk[3-0,3-3)",
        "code_fence[4-0,4-3)",
      ],
      "text[5-0,5-1)",
      ["stopBdry[5-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", '<pre><code class="language-xyz">', "abc", "</code></pre>", "<p>n</p>"
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "code_fence[1-0,1-3)",
      "code_fence[4-0,4-3)",
      "chunk[2-0)",
      "chunk[3-0,3-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one FencedCodeBlock without line feed", () => {
    init(["p", "```", "```", "n"]);

    repl(rv(1, 0), "`");
    /*
    p
    ````
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[1-0,1-4)",
        "chunk[2-0,2-3)",
        "chunk[3-0,3-1)",
      ],
      "stopBdry[3-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code>```", "n", "</code></pre>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), [
      "code_fence[1-0,1-3)",
      "text[3-0,3-1)",
    ]);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["code_fence[2-0,2-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[0-0,0-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    ````
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[2-0,2-4)",
        "chunk[3-0,3-3)",
        "chunk[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code>```", "n", "</code></pre>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), ["Paragraph,1 [ text[0-0,0-1) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "code_fence[1-0,1-4)",
      "chunk[2-0,2-3)",
      "chunk[3-0,3-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[0-0,0-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(3)._rv, "`");
    /*
    p
    ⏎
    ````
    ````
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[2-0,2-4)",
        "code_fence[3-0,3-4)",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code></code></pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, true);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), ["chunk[3-0,3-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["code_fence[2-0,2-4)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), ["text[4-0,4-1)"]);

    repl(ran(3)._rv, "`");
    /*
    p
    ⏎
    ````
    `````
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[2-0,2-4)",
        "code_fence[3-0,3-5)",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code></code></pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "FencedCodeBlock,1 [ code_fence[2-0,2-4), code_fence[3-0,3-4) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["code_fence[2-0,2-4)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["code_fence[3-0,3-4)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[4-0,4-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(3)._rv, "\n");
    /*
    p
    ⏎
    ````
    `````
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[2-0,2-4)",
        "code_fence[3-0,3-5)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre><code></code></pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "FencedCodeBlock,1 [ code_fence[2-0,2-4), code_fence[3-0,3-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "code_fence[2-0,2-4)",
      "code_fence[3-0,3-5)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[4-0,4-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {});
});

describe("Compiling ListItem", () => {
  describe("Paragraph in ListItem", () => {
    it("edits in one Paragraph without line feed", () => {
      init(["  * p", "", "    abc", " 123", "    xyz", "", "    n"]);
      let tkId_a: id_t[], tkId_a_1: id_t[];
      let list_: List;

      tkId_a = lexr._tkId_a;
      repl(ran(3)._rv, "4");
      /*
      ··* p
      ⏎
      ····abc
      ·1234
      ····xyz
      ⏎
      ····n
       */
      assertEquals(lexr.strtLexTk_$._Repr_(), [
        /* deno-fmt-ignore */ [
          "strtBdry[0-0)", "bullet_list_marker[0-2,0-3)", "text[0-4,0-5)",
          "text[2-4,2-7)",
          "text[3-1,3-5)",
          "text[4-4,4-7)",
          "text[6-4,6-5)",
        ],
        "stopBdry[6-5)",
        [],
      ]);
      assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
      tkId_a_1 = lexr._tkId_a;
      assertEquals(tkId_a_1[1], tkId_a[1]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<ul>", "<li>", "<p>p</p>", "<p>abc", "1234", "xyz</p>", "<p>n</p>",
          "</li>", "</ul>",
        ].join("\n"),
      );
      list_ = pazr._root?._c(0) as List;
      assertStrictEquals(pazr.drtSn_$, list_._c(0));
      assertEquals(lexr._relexd, false);
      assertEquals(pazr.unrelSn_sa_$._repr_(), []);
      assertEquals(pazr.takldSn_sa_$._repr_(), [
        "Paragraph,3,iS [ text[0-4,0-5) ]",
        "Paragraph,3,iS [ text[6-4,6-5) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr_(), [
        "bullet_list_marker[0-2,0-3)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[3-1,3-4)"]);
      assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
        "text[2-4,2-7)",
        "text[4-4,4-7)",
      ]);
      assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
    });
  });

  it("edits in one ListItem without line feed", () => {
    init([" * p", "  * abc", " 123", "    xyz", "* n"]);
    let tkId_a: id_t[], tkId_a_1: id_t[];
    let list_: List;

    tkId_a = lexr._tkId_a;
    repl(ran(2)._rv, "4");
    /*
    ·* p
    ··* abc
    ·1234
    ····xyz
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bullet_list_marker[0-1,0-2)", "text[0-3,0-4)",
        "bullet_list_marker[1-2,1-3)", "text[1-4,1-7)",
        "text[2-1,2-5)",
        "text[3-4,3-7)",
      ],
      "bullet_list_marker[4-0,4-1)",
      ["text[4-2,4-3)", "stopBdry[4-3)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    tkId_a_1 = lexr._tkId_a;
    assertEquals(tkId_a_1[3], tkId_a[3]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<ul>", "<li>p</li>", "<li>abc", "1234", "xyz</li>", "<li>n</li>",
        "</ul>",
      ].join("\n"),
    );
    list_ = pazr._root?._c(0) as List;
    assertStrictEquals(pazr.drtSn_$, list_._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["bullet_list_marker[1-2,1-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[2-1,2-4)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-4,1-7)",
      "text[3-4,3-7)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one ListItem without line feed", () => {
    init([" * p", "  * abc", " 123", "    xyz", "* n"]);
    let tkId_a: id_t[], tkId_a_1: id_t[];
    let list_: List;

    tkId_a = lexr._tkId_a;
    repl(ran(3)._rv, "4"); // 👍
    /*
    ·* p
    ··* abc
    ·123
    ····xyz4
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bullet_list_marker[0-1,0-2)", "text[0-3,0-4)",
        "bullet_list_marker[1-2,1-3)", "text[1-4,1-7)",
        "text[2-1,2-4)",
        "text[3-4,3-8)",
        "bullet_list_marker[4-0,4-1)", "text[4-2,4-3)",
      ],
      "stopBdry[4-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    tkId_a_1 = lexr._tkId_a;
    assertEquals(tkId_a_1[1], tkId_a[1]);
    assertEquals(tkId_a_1[3], tkId_a[3]);
    assertEquals(tkId_a_1[7], tkId_a[7]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<ul>", "<li>p</li>", "<li>abc", "123", "xyz4</li>", "<li>n</li>",
        "</ul>",
      ].join("\n"),
    );
    list_ = pazr._root?._c(0) as List;
    assertStrictEquals(pazr.drtSn_$, list_);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "BulletListItem,2,iS [ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "BulletListItem,2 [ bullet_list_marker[1-2,1-3), text[3-4,3-7) ]",
      "Paragraph,3 [ text[1-4,1-7), text[3-4,3-7) ]",
      "Paragraph,3 [ text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(1));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(2), list_._c(1)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(3), list_._c(2)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "bullet_list_marker[1-2,1-3)",
      "bullet_list_marker[4-0,4-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[3-4,3-7)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-4,1-7)",
      "text[2-1,2-4)",
      "text[4-2,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    tkId_a = lexr._tkId_a;
    undo();
    /*
    ·* p
    ··* abc
    ·123
    ····xyz
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bullet_list_marker[0-1,0-2)", "text[0-3,0-4)",
        "bullet_list_marker[1-2,1-3)", "text[1-4,1-7)",
        "text[2-1,2-4)",
        "text[3-4,3-7)",
        "bullet_list_marker[4-0,4-1)", "text[4-2,4-3)",
      ],
      "stopBdry[4-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    tkId_a_1 = lexr._tkId_a;
    assertEquals(tkId_a_1[1], tkId_a[1]);
    assertEquals(tkId_a_1[3], tkId_a[3]);
    assertEquals(tkId_a_1[7], tkId_a[7]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<ul>", "<li>p</li>", "<li>abc", "123", "xyz</li>", "<li>n</li>",
        "</ul>",
      ].join("\n"),
    );
    list_ = pazr._root?._c(0) as List;
    assertStrictEquals(pazr.drtSn_$, list_);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "BulletListItem,2,iS [ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "Paragraph,3 [ text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(2)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "bullet_list_marker[1-2,1-3)",
      "bullet_list_marker[4-0,4-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-4,1-7)",
      "text[2-1,2-4)",
      "text[4-2,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    tkId_a = lexr._tkId_a;
    repl(rv(1, 1, 1, 2), "");
    /*
    ·* p
    ·* abc
    ·123
    ····xyz
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bullet_list_marker[0-1,0-2)", "text[0-3,0-4)",
        "bullet_list_marker[1-1,1-2)", "text[1-3,1-6)",
        "text[2-1,2-4)",
        "text[3-4,3-7)",
        "bullet_list_marker[4-0,4-1)", "text[4-2,4-3)",
      ],
      "stopBdry[4-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    tkId_a_1 = lexr._tkId_a;
    assertEquals(tkId_a_1[1], tkId_a[1]);
    assertEquals(tkId_a_1[3], tkId_a[3]);
    assertEquals(tkId_a_1[7], tkId_a[7]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<ul>", "<li>p</li>", "<li>abc", "123", "xyz</li>", "<li>n</li>",
        "</ul>",
      ].join("\n"),
    );
    list_ = pazr._root?._c(0) as List;
    assertStrictEquals(pazr.drtSn_$, list_);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), ["Paragraph,3 [ text[0-3,0-4) ]"]);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "BulletListItem,2,iS [ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "Paragraph,3 [ text[1-4,1-7), text[3-4,3-7) ]",
      "BulletListItem,2,iS [ bullet_list_marker[4-0,4-1), text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(1)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(2), list_._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["bullet_list_marker[1-2,1-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-4,1-7)",
      "text[2-1,2-4)",
      "text[3-4,3-7)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling ThematicBreak", () => {
  it("edits ThematicBreak", () => {
    init(["p", "  ***", "n"]);

    repl(ran(1)._rv, " ");
    /*
    p
    ··***·
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "thematic_break[1-2,1-5)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<hr />", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "ThematicBreak,1 [ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["thematic_break[1-2,1-5)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(1)._rv, "*");
    /*
    p
    ··*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "thematic_break[1-2,1-7)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<hr />", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "ThematicBreak,1 [ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["thematic_break[1-2,1-5)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), " ");
    /*
    p
    ···*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "thematic_break[1-3,1-8)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<hr />", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["thematic_break[1-2,1-7)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[0-0,0-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), " ");
    /*
    p
    ····*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "emphasis_delimiter[1-4,1-7)", "thematic_break[1-7,1-9)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p", "*** *", "n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1), text[2-0,2-1) ]",
      "Paragraph,1,iS [ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
      "thematic_break[1-3,1-8)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {
    init(["p", "  ***", "n"]);

    repl(ran(1)._rv, "\n");
    /*
    p
    ··***
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "thematic_break[1-2,1-5)",
        "text[3-0,3-1)",
      ],
      "stopBdry[3-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<hr />", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "ThematicBreak,1 [ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["thematic_break[1-2,1-5)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling SetextHeading", () => {
  it("edits in one SetextHeading without line feed", () => {
    init(["p", "", "abc", "123", "xyz", "---", "n"]);

    repl(ran(3)._rv, "4");
    /*
    p
    ⏎
    abc
    1234
    xyz
    ---
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-4)",
        "text[4-0,4-3)",
        "setext_heading[5-0,5-3)",
      ],
      "text[6-0,6-1)",
      ["stopBdry[6-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc", "1234", "xyz</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["setext_heading[5-0,5-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[3-0,3-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(5, 0), "-");
    /*
    p
    ⏎
    abc
    1234
    xyz
    ----
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-4)",
        "text[4-0,4-3)",
        "setext_heading[5-0,5-4)",
      ],
      "text[6-0,6-1)",
      ["stopBdry[6-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc", "1234", "xyz</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), ["setext_heading[5-0,5-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
      "text[3-0,3-4)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    // repl(ran(4)._rv, "5");
    repl(ran(3, undefined, 4)._rv, "");
    /*
    p
    ⏎
    abc
    1234
    ----
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "text[3-0,3-4)",
        "setext_heading[4-0,4-4)",
      ],
      "text[5-0,5-1)",
      ["stopBdry[5-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc", "1234</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["setext_heading[5-0,5-4)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[3-0,3-4)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one SetextHeading without line feed", () => {
    init(["p", "", "abc", "---", "n"]);

    repl(ran(3)._rv, "-");
    /*
    p
    ⏎
    abc
    ----
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-3)",
        "setext_heading[3-0,3-4)",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "SetextHeading,1 [ text[2-0,2-3), setext_heading[3-0,3-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["setext_heading[3-0,3-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[2-0,2-3)",
      "text[4-0,4-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(2, 0), "4");
    /*
    p
    ⏎
    4abc
    ----
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[2-0,2-4)",
        "setext_heading[3-0,3-4)",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>4abc</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[4-0,4-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["setext_heading[3-0,3-4)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[2-0,2-3)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[4-0,4-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {
    init(["p", "", "abc", "---", "n"]);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    ⏎
    abc
    ---
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[3-0,3-3)",
        "setext_heading[4-0,4-3)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[4-0,4-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["setext_heading[3-0,3-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[2-0,2-3)",
      "text[4-0,4-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(4, 0), "\n");
    /*
    p
    ⏎
    ⏎
    abc
    ⏎
    ---
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[3-0,3-3)",
        "thematic_break[5-0,5-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<p>abc</p>", "<hr />", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, true);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(3));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), ["setext_heading[4-0,4-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[3-0,3-3)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    p
    ⏎
    ⏎
    abc
    ---
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[3-0,3-3)",
        "setext_heading[4-0,4-3)",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[6-0,6-1) ]",
      "Paragraph,1 [ text[3-0,3-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), ["thematic_break[5-0,5-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[3-0,3-3)",
      "text[6-0,6-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(4)._rv, "\n");
    /*
    p
    ⏎
    ⏎
    abc
    ---
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[3-0,3-3)",
        "setext_heading[4-0,4-3)",
        "text[6-0,6-1)",
      ],
      "stopBdry[6-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h2>abc</h2>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "SetextHeading,1 [ text[3-0,3-3), setext_heading[4-0,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["setext_heading[4-0,4-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[3-0,3-3)",
      "text[5-0,5-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling ATXHeading", () => {
  it("edits in one ATXHeading without line feed", () => {
    init(["p", "# abc #", "n"]);

    repl(rv(1, 5), "4");
    /*
    p
    # abc4 #
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-0,1-1)", "text[1-2,1-6)", "atx_heading[1-7,1-8)",
      ],
      "text[2-0,2-1)",
      ["stopBdry[2-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc4</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-6,1-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[1-2,1-5)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 6), " ");
    /*
    p
    # abc4··#
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-0,1-1)", "text[1-2,1-6)", "atx_heading[1-8,1-9)",
      ],
      "text[2-0,2-1)",
      ["stopBdry[2-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc4</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-7,1-8)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[1-2,1-6)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 2), "5");
    /*
    p
    # 5abc4··#
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-0,1-1)", "text[1-2,1-7)", "atx_heading[1-9,1-10)",
      ],
      "text[2-0,2-1)",
      ["stopBdry[2-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>5abc4</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-8,1-9)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[1-2,1-6)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one ATXHeading without line feed", () => {
    init(["p", "# abc #", "n"]);

    repl(ran(1)._rv, "#");
    /*
    p
    # abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-0,1-1)", "text[1-2,1-5)", "atx_heading[1-6,1-8)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "ATXHeading,1 [ atx_heading[1-0,1-1), atx_heading[1-6,1-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["atx_heading[1-0,1-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["atx_heading[1-6,1-7)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-2,1-5)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), "\t");
    /*
    p
    →→→→# abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-1,1-2)", "text[1-3,1-6)", "atx_heading[1-7,1-9)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p", "# abc ##", "n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1), text[2-0,2-1) ]",
      "Paragraph,1 [ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "atx_heading[1-0,1-1)",
      "text[1-2,1-5)",
      "text[2-0,2-1)",
      "atx_heading[1-6,1-8)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo(); // 👍
    /*
    p
    # abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[1-0,1-1)", "text[1-2,1-5)", "atx_heading[1-6,1-8)",
        "text[2-0,2-1)",
      ],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, true);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "ATXHeading,1 [ atx_heading[1-1,1-2) ]",
    ]);
    assertNotStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "atx_heading[1-1,1-2)",
      "atx_heading[1-7,1-9)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-3,1-6)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {
    init(["p", "# abc #", "n"]);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    # abc #
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[2-0,2-1)", "text[2-2,2-5)", "atx_heading[2-6,2-7)",
        "text[3-0,3-1)",
      ],
      "stopBdry[3-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1 [ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-6,1-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-0,0-1)",
      "text[1-2,1-5)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    // repl(rv(2, 5), "\n");
    // /*
    // p
    // ⏎
    // # abc
    // ·#
    // n
    //  */

    // repl(rv(2, 2), "\n");
    // /*
    // p
    // ⏎
    // #·
    // abc
    // ·#
    // n
    //  */

    // undo();
    // /*
    // p
    // ⏎
    // # abc
    // ·#
    // n
    //  */

    // undo();
    // /*
    // p
    // ⏎
    // # abc #
    // n
    //  */

    repl(ran(2)._rv, "\n");
    /*
    p
    ⏎
    # abc #
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "atx_heading[2-0,2-1)", "text[2-2,2-5)", "atx_heading[2-6,2-7)",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<h1>abc</h1>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "ATXHeading,1,iS [ atx_heading[2-0,2-1), atx_heading[2-6,2-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[3-0,3-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling HTMLBlock", () => {
  it("edits in one HTMLBlock without line feed", () => {
    init(["p", "<pre>", "</pre>", "n"]);

    repl(ran(1)._rv, "\n");
    /*
    p
    <pre>
    ⏎
    </pre>
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[1-0,1-5)hasHead",
        "chunk[2-0)",
        "chunk[3-0,3-6)hasTail",
      ],
      "text[4-0,4-1)",
      ["stopBdry[4-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre>", "", "</pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[1-0,1-5)",
      "chunk[2-0,2-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(1)._rv, "xyz");
    /*
    p
    <pre>xyz
    ⏎
    </pre>
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[1-0,1-8)hasHead",
        "chunk[2-0)",
        "chunk[3-0,3-6)hasTail",
      ],
      "text[4-0,4-1)",
      ["stopBdry[4-1)"],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre>xyz", "", "</pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[3-0,3-6)",
      "chunk[2-0)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[1-0,1-5)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), []);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one HTMLBlock without line feed", () => {
    init(["p", "<pre>", "</pre>", "n"]);

    repl(ran(2)._rv, "-->");
    /*
    p
    <pre>
    </pre>-->
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[1-0,1-5)hasHead",
        "chunk[2-0,2-9)hasTail",
        "text[3-0,3-1)",
      ],
      "stopBdry[3-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre>", "</pre>-->", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "HTMLBlock,1 [ chunk[1-0,1-5), chunk[2-0,2-6) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["chunk[1-0,1-5)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[2-0,2-6)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[3-0,3-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), "<!--");
    /*
    p
    <!--<pre>
    </pre>-->
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[1-0,1-9)hasHead",
        "chunk[2-0,2-9)hasTail",
        "text[3-0,3-1)",
      ],
      "stopBdry[3-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<!--<pre>", "</pre>-->", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["chunk[2-0,2-9)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[1-0,1-5)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[0-0,0-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("feeds lines", () => {
    init(["p", "<pre>", "</pre>", "n"]);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    <pre>
    </pre>
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-0,2-5)hasHead",
        "chunk[3-0,3-6)hasTail",
        "text[4-0,4-1)",
      ],
      "stopBdry[4-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre>", "</pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1 [ text[0-0,0-1) ]",
      "Paragraph,1,iS [ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[1-0,1-5)",
      "chunk[2-0,2-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[0-0,0-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(ran(3)._rv, "\n");
    /*
    p
    ⏎
    <pre>
    </pre>
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "chunk[2-0,2-5)hasHead",
        "chunk[3-0,3-6)hasTail",
        "text[5-0,5-1)",
      ],
      "stopBdry[5-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>p</p>", "<pre>", "</pre>", "<p>n</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Paragraph,1,iS [ text[0-0,0-1) ]",
      "HTMLBlock,1 [ chunk[2-0,2-5), chunk[3-0,3-6) ]",
    ]);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), [
      "chunk[2-0,2-5)",
      "chunk[3-0,3-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), ["text[4-0,4-1)"]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling Linkdef", () => {
  it("edits destination, title in one Linkdef", () => {
    init(["[bar]:abc", "[foo]: /uri (xyz)", "[foo] [bar]"]);

    repl(rv(1, 11, 1, 12), "");
    /*
    [bar]:abc
    [foo]: /uri(xyz)
    [foo] [bar]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-6,0-9)",
        "bracket_open[1-0,1-1)", "text[1-1,1-4)", "bracket_colon[1-4,1-6)", "chunk[1-7,1-16)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)", "text[2-5,2-6)", "bracket_open[2-6,2-7)", "text[2-7,2-10)", "bracket_cloz[2-10,2-11)",
      ],
      "stopBdry[2-11)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/uri(xyz)">foo</a> <a href="abc">bar</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "Link,2 [ bracket_open[2-6,2-7), bracket_cloz[2-10,2-11) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "chunk[1-7,1-11)",
      "text[1-12,1-17)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "bracket_open[1-0,1-1)",
      "text[1-1,1-4)",
      "bracket_colon[1-4,1-6)",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "text[2-5,2-6)",
      "Link,2 [ bracket_open[2-6,2-7), bracket_cloz[2-10,2-11) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits label in one Linkdef", () => {
    init(["[foo]: /uri (xyz)", "[foo]"]);

    repl(rv(0, 3), "\n");
    /*
    [fo
    o]: /uri (xyz)
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-3)",
        "text[1-0,1-1)", "bracket_colon[1-1,1-3)", "chunk[1-4,1-8)", "text[1-9,1-14)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)",
      ],
      "stopBdry[2-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Link,2 [ bracket_open[1-0,1-1), bracket_cloz[1-4,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "bracket_colon[0-4,0-6)",
      "chunk[0-7,0-11)",
      "text[0-12,0-17)",
      "Link,2 [ bracket_open[1-0,1-1), bracket_cloz[1-4,1-5) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    [foo]: /uri (xyz)
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-7,0-11)", "text[0-12,0-17)",
        "bracket_open[1-0,1-1)", "text[1-1,1-4)", "bracket_cloz[1-4,1-5)",
      ],
      "stopBdry[1-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "text[0-1,0-3)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "bracket_colon[1-1,1-3)",
      "chunk[1-4,1-8)",
      "text[1-9,1-14)",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one Linkdef", () => {
    init(["[bar]:abc", "[foo]: /uri (xyz)", "[foo]"]);

    repl(ran(1)._rv, " ");
    /*
    [bar]:abc
    [foo]: /uri (xyz)·
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-6,0-9)",
        "bracket_open[1-0,1-1)", "text[1-1,1-4)", "bracket_colon[1-4,1-6)", "chunk[1-7,1-11)", "text[1-12,1-17)", "text[1-17,1-18)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)",
      ],
      "stopBdry[2-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Linkdef,2 [ bracket_open[1-0,1-1), text[1-12,1-17) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Linkdef,2 [ bracket_open[1-0,1-1), text[1-12,1-17) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 0), " ");
    /*
    [bar]:abc
    ·[foo]: /uri (xyz)·
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-6,0-9)",
        "bracket_open[1-1,1-2)", "text[1-2,1-5)", "bracket_colon[1-5,1-7)", "chunk[1-8,1-12)", "text[1-13,1-18)", "text[1-18,1-19)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)",
      ],
      "stopBdry[2-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "SoftBr,2 [ text[1-17,1-18) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(3));
    assertStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(0)?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Linkdef,2 [ bracket_open[1-0,1-1), text[1-12,1-17) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "SoftBr,2 [ text[1-17,1-18) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 6), " ");
    /*
    [bar]:abc
    ·[foo] : /uri (xyz)·
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-6,0-9)",
        "bracket_open[1-1,1-2)", "text[1-2,1-5)", "bracket_cloz[1-5,1-6)", "text[1-6,1-19)", "text[1-19,1-20)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)",
      ],
      "stopBdry[2-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>[foo] : /uri (xyz)", '<a href="">foo</a></p>'].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "SoftBr,2 [ text[1-18,1-19) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
    assertStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "text[1-2,1-5)",
      "chunk[1-8,1-12)",
      "text[1-13,1-18)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "bracket_open[1-1,1-2)",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "SoftBr,2 [ text[1-18,1-19) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    [bar]:abc
    ·[foo]: /uri (xyz)·
    [foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-6,0-9)",
        "bracket_open[1-1,1-2)", "text[1-2,1-5)", "bracket_colon[1-5,1-7)", "chunk[1-8,1-12)", "text[1-13,1-18)", "text[1-18,1-19)",
        "bracket_open[2-0,2-1)", "text[2-1,2-4)", "bracket_cloz[2-4,2-5)",
      ],
      "stopBdry[2-5)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(3));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["bracket_cloz[1-5,1-6)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), chunk[0-6,0-9) ]",
      "bracket_open[1-1,1-2)",
      "Link,2 [ bracket_open[2-0,2-1), bracket_cloz[2-4,2-5) ]",
      "SoftBr,2 [ text[1-19,1-20) ]",
      "text[1-2,1-5)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling Link", () => {
  it("edits destination, title in one Link", () => {
    init(["abc[foo](/uri (xyz))"]);

    repl(rv(0, 13, 0, 14), "");
    /*
    abc[foo](/uri(xyz))
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-3)", "bracket_open[0-3,0-4)", "text[0-4,0-7)", "bracket_paren[0-7,0-9)", "chunk[0-9,0-18)", "paren_cloz[0-18,0-19)",
      ],
      "stopBdry[0-19)",
      [],
    ]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>abc<a href="/uri(xyz)">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "chunk[0-9,0-13)",
      "text[0-14,0-19)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "paren_cloz[0-19,0-20)",
      "text[0-0,0-3)",
      "bracket_open[0-3,0-4)",
      "text[0-4,0-7)",
      "bracket_paren[0-7,0-9)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    abc[foo](/uri (xyz))
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-3)", "bracket_open[0-3,0-4)", "text[0-4,0-7)", "bracket_paren[0-7,0-9)", "chunk[0-9,0-13)", "text[0-14,0-19)", "paren_cloz[0-19,0-20)",
      ],
      "stopBdry[0-20)",
      [],
    ]);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>abc<a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "paren_cloz[0-18,0-19)",
      "text[0-0,0-3)",
      "bracket_open[0-3,0-4)",
      "text[0-4,0-7)",
      "bracket_paren[0-7,0-9)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits label in one Link", () => {
    init(["[foo]: /uri (xyz)", "abc[foo][foo]"]);

    repl(rv(1, 9), " ");
    /*
    [foo]: /uri (xyz)
    abc[foo][ foo]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-7,0-11)", "text[0-12,0-17)",
        "text[1-0,1-3)", "bracket_open[1-3,1-4)", "text[1-4,1-7)", "bracket_cloz[1-7,1-8)", "bracket_open[1-8,1-9)", "text[1-9,1-13)", "bracket_cloz[1-13,1-14)",
      ],
      "stopBdry[1-14)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>abc<a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[1-9,1-12)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_cloz[1-12,1-13)",
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
      "text[1-0,1-3)",
      "bracket_open[1-3,1-4)",
      "text[1-4,1-7)",
      "bracket_cloz[1-7,1-8)",
      "bracket_open[1-8,1-9)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 12), " ");
    /*
    [foo]: /uri (xyz)
    abc[foo][ fo o]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-7,0-11)", "text[0-12,0-17)",
        "text[1-0,1-3)", "bracket_open[1-3,1-4)", "text[1-4,1-7)", "bracket_cloz[1-7,1-8)", "bracket_open[1-8,1-9)", "text[1-9,1-14)", "bracket_cloz[1-14,1-15)",
      ],
      "stopBdry[1-15)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      "<p>abc[foo][ fo o]</p>",
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_cloz[1-13,1-14)",
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
      "text[1-0,1-3)",
      "bracket_open[1-3,1-4)",
      "text[1-4,1-7)",
      "bracket_cloz[1-7,1-8)",
      "bracket_open[1-8,1-9)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(1, 9, 1, 14), "");
    /*
    [foo]: /uri (xyz)
    abc[foo][]
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "bracket_colon[0-4,0-6)", "chunk[0-7,0-11)", "text[0-12,0-17)",
        "text[1-0,1-3)", "bracket_open[1-3,1-4)", "text[1-4,1-7)", "bracket_cloz[1-7,1-8)", "bracket_open[1-8,1-9)", "bracket_cloz[1-9,1-10)",
      ],
      "stopBdry[1-10)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>abc<a href="/uri" title="xyz">foo</a></p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_cloz[1-14,1-15)",
      "Linkdef,2 [ bracket_open[0-0,0-1), text[0-12,0-17) ]",
      "text[1-0,1-3)",
      "bracket_open[1-3,1-4)",
      "text[1-4,1-7)",
      "bracket_cloz[1-7,1-8)",
      "bracket_open[1-8,1-9)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one Link", () => {
    init(["abc[foo](/uri (xyz))", "123"]);

    repl(ran(0)._rv, " ");
    /*
    abc[foo](/uri (xyz))·
    123
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-3)", "bracket_open[0-3,0-4)", "text[0-4,0-7)", "bracket_paren[0-7,0-9)", "chunk[0-9,0-13)", "text[0-14,0-19)", "paren_cloz[0-19,0-20)", "text[0-20,0-21)",
        "text[1-0,1-3)",
      ],
      "stopBdry[1-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ['<p>abc<a href="/uri" title="xyz">foo</a>', "123</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Link,2 [ bracket_open[0-3,0-4), paren_cloz[0-19,0-20) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-0,1-3)",
      "text[0-0,0-3)",
      "Link,2 [ bracket_open[0-3,0-4), paren_cloz[0-19,0-20) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(0, 3), " ");
    /*
    abc [foo](/uri (xyz))·
    123
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-4)", "bracket_open[0-4,0-5)", "text[0-5,0-8)", "bracket_paren[0-8,0-10)", "chunk[0-10,0-14)", "text[0-15,0-20)", "paren_cloz[0-20,0-21)", "text[0-21,0-22)",
        "text[1-0,1-3)",
      ],
      "stopBdry[1-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ['<p>abc <a href="/uri" title="xyz">foo</a>', "123</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), ["SoftBr,2 [ text[0-20,0-21) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[1-0,1-3)",
      "Link,2 [ bracket_open[0-3,0-4), paren_cloz[0-19,0-20) ]",
      "SoftBr,2 [ text[0-20,0-21) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(0, 9), " ");
    /*
    abc [foo] (/uri (xyz))·
    123
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-4)", "bracket_open[0-4,0-5)", "text[0-5,0-8)", "bracket_cloz[0-8,0-9)", "text[0-9,0-21)", "paren_cloz[0-21,0-22)", "text[0-22,0-23)",
        "text[1-0,1-3)",
      ],
      "stopBdry[1-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ["<p>abc [foo] (/uri (xyz))", "123</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), ["SoftBr,2 [ text[0-21,0-22) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "text[0-5,0-8)",
      "chunk[0-10,0-14)",
      "text[0-15,0-20)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "paren_cloz[0-20,0-21)",
      "text[1-0,1-3)",
      "bracket_open[0-4,0-5)",
      "SoftBr,2 [ text[0-21,0-22) ]",
      "text[0-0,0-4)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    abc [foo](/uri (xyz))·
    123
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-4)", "bracket_open[0-4,0-5)", "text[0-5,0-8)", "bracket_paren[0-8,0-10)", "chunk[0-10,0-14)", "text[0-15,0-20)", "paren_cloz[0-20,0-21)", "text[0-21,0-22)",
        "text[1-0,1-3)",
      ],
      "stopBdry[1-3)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      ['<p>abc <a href="/uri" title="xyz">foo</a>', "123</p>"].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), ["SoftBr,2 [ text[0-22,0-23) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), ["bracket_cloz[0-8,0-9)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), []);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "paren_cloz[0-21,0-22)",
      "text[1-0,1-3)",
      "bracket_open[0-4,0-5)",
      "SoftBr,2 [ text[0-22,0-23) ]",
      "text[0-0,0-4)",
      "text[0-5,0-8)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});

describe("Compiling Autolink", () => {
  it("edits in one Autolink", () => {
    init("[abc<http://uri>xyz");

    repl(rv(0, 15), "]");
    /*
    [abc<http://uri]>xyz
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "link_dest_head[0-4,0-5)", "chunk[0-5,0-15)", "chunk[0-15,0-16)", "link_dest_tail[0-16,0-17)", "text[0-17,0-20)",
      ],
      "stopBdry[0-20)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>[abc<a href="http://uri%5D">http://uri]</a>xyz</p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[0-5,0-15)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-16,0-19)",
      "bracket_open[0-0,0-1)",
      "text[0-1,0-4)",
      "link_dest_head[0-4,0-5)",
      "link_dest_tail[0-15,0-16)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "link_dest_head[0-4,0-5)", "chunk[0-5,0-15)", "link_dest_tail[0-15,0-16)", "text[0-16,0-19)",
      ],
      "stopBdry[0-19)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    /*
    [abc<http://uri>xyz
     */
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>[abc<a href="http://uri">http://uri</a>xyz</p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["chunk[0-5,0-15)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "text[0-17,0-20)",
      "bracket_open[0-0,0-1)",
      "text[0-1,0-4)",
      "link_dest_head[0-4,0-5)",
      "link_dest_tail[0-16,0-17)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });

  it("edits at boundaries of one Autolink", () => {
    init("[abc<http://uri]>xyz");

    repl(rv(0, 17), " ");
    /*
    [abc<http://uri> xyz
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-4)", "link_dest_head[0-4,0-5)", "chunk[0-5,0-15)", "chunk[0-15,0-16)", "link_dest_tail[0-16,0-17)", "text[0-17,0-21)",
      ],
      "stopBdry[0-21)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>[abc<a href="http://uri%5D">http://uri]</a> xyz</p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), [
      "Autolink,2 [ link_dest_head[0-4,0-5), link_dest_tail[0-16,0-17) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[0-17,0-20)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "text[0-1,0-4)",
      "Autolink,2 [ link_dest_head[0-4,0-5), link_dest_tail[0-16,0-17) ]",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(0, 4), " ");
    /*
    [abc <http://uri]> xyz
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-5)", "link_dest_head[0-5,0-6)", "chunk[0-6,0-16)", "chunk[0-16,0-17)", "link_dest_tail[0-17,0-18)", "text[0-18,0-22)",
      ],
      "stopBdry[0-22)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>[abc <a href="http://uri%5D">http://uri]</a> xyz</p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), ["text[0-1,0-4)"]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "Autolink,2 [ link_dest_head[0-4,0-5), link_dest_tail[0-16,0-17) ]",
      "text[0-17,0-21)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    repl(rv(0, 17, 0, 18), ":");
    /*
    [abc <http://uri]: xyz
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-5)", "link_dest_head[0-5,0-6)", "text[0-6,0-16)", "bracket_colon[0-16,0-18)", "chunk[0-19,0-22)",
      ],
      "stopBdry[0-22)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), "");
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "chunk[0-6,0-16)",
      "chunk[0-16,0-17)",
      "text[0-18,0-22)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "link_dest_head[0-5,0-6)",
      "text[0-1,0-5)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);

    undo();
    /*
    [abc <http://uri]> xyz
     */
    assertEquals(lexr.strtLexTk_$._Repr_(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "bracket_open[0-0,0-1)", "text[0-1,0-5)", "link_dest_head[0-5,0-6)", "chunk[0-6,0-16)", "chunk[0-16,0-17)", "link_dest_tail[0-17,0-18)", "text[0-18,0-22)",
      ],
      "stopBdry[0-22)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p>[abc <a href="http://uri%5D">http://uri]</a> xyz</p>',
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
    assertEquals(lexr._relexd, false);
    assertEquals(pazr.unrelSn_sa_$._repr_(), []);
    assertEquals(pazr.takldSn_sa_$._repr_(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr_(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr_(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr_(), [
      "text[0-6,0-16)",
      "chunk[0-19,0-22)",
    ]);
    assertEquals(lexr._reusdSnt_2_sa_._repr_(), [
      "bracket_open[0-0,0-1)",
      "link_dest_head[0-5,0-6)",
      "text[0-1,0-5)",
    ]);
    assertEquals(lexr._abadnSnt_2_sa_._repr_(), []);
  });
});
/*80--------------------------------------------------------------------------*/
