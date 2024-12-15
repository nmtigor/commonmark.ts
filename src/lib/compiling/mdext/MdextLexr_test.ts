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
  lexr.reset();
  bufr.repl_actr.init(lexr);
  bufr.repl_mo.registHandler((n_y) => bufr.repl_actr.to(n_y));

  if (text_x) repl(rv(0, 0), text_x);
}

afterEach(() => {
  bufr.reset();
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[3-0,3-3)"]);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[4-0,4-3)",
      "text[3-0,3-4)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[2-0,2-3), text[4-0,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[3-0,3-3)",
      "text[6-0,6-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[4-0,4-3)"]);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[3-0,3-3)",
      "text[6-0,6-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(2, 0), "4");
    /*
    p
    ⏎
    4abc
    123
    xyz
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[3-0,3-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[2-0,2-3)"]);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[3-0,3-3)",
      "text[4-0,4-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
  });

  it("feeds lines", () => {
    init(["p", "n"]);

    repl(rv(0, 0), "\n");
    /*
    ⏎
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      ["strtBdry[0-0)", "text[1-0,1-1)", "text[2-0,2-1)"],
      "stopBdry[2-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[1-0,1-1)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[0-0,0-1)",
      "text[1-0,1-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, true);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[2-0,2-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(1)._rv, "\n");
    /*
    p
    n
    ⏎
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[2-0)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), [
      "Document(0)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    undo();
    /*
    p
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      ["strtBdry[0-0)", "text[0-0,0-1)", "text[1-0,1-1)"],
      "stopBdry[1-1)",
      [],
    ]);
    assertStrictEquals(lexr.stopLexTk_$, lexr.strtLexTk_$);
    assertEquals(pazr._root?._toHTML(lexr), ["<p>p", "n</p>"].join("\n"));
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), [
      "Document(0)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "text[2-2,2-5)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[3-2,3-5)"]);
      assertEquals(lexr._relexd, false);

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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)",
        "block_quote_marker[4-0,4-1)", "text[4-2,4-5)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
        "text[3-2,3-6)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);
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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[2-2,2-5), text[4-2,4-5) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(1));
      assertStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
        "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[4-2,4-5)"]);
      assertEquals(lexr._relexd, false);

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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)", "text[2-2,2-5)",
        "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
        "block_quote_marker[4-0,4-1)",
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);

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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
        "block_quote_marker[4-0,4-1)", 
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[2-2,2-5)"]);
      assertEquals(lexr._relexd, false);

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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
        "block_quote_marker[3-0,3-1)", "text[3-2,3-5)",
        "block_quote_marker[4-0,4-1)", 
        "block_quote_marker[5-0,5-1)",
        "block_quote_marker[6-0,6-1)",
        "text[4-2,4-5)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);
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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3), text[1-2,1-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);

      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[1-2,1-3), text[2-2,2-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "block_quote_marker[1-0,1-1)",
        "block_quote_marker[2-0,2-1)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);

      tkId_a = lexr._tkId_a;
      repl(rv(1, 2), "\n> "); // 👍
      /*
      > p
      >·
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "block_quote_marker[0-0,0-1)",
        "text[0-2,0-3)",
        "block_quote_marker[1-0,1-1)",
        "text[1-2,1-3)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, true);

      tkId_a = lexr._tkId_a;
      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3), text[2-2,2-3) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0)?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "block_quote_marker[0-0,0-1)",
        "block_quote_marker[1-0,1-1)",
        "text[2-2,2-3)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);

      repl(ran(1)._rv, "\n>");
      /*
      > p
      > n
      >
       */
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), [
        "Document(0)[ block_quote_marker[0-0,0-1), block_quote_marker*[2-0,2-1) ]",
        "Paragraph(2)[ text[0-2,0-3), text[1-2,1-3) ]",
      ]);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "BlockQuote(1)[ block_quote_marker[0-0,0-1), block_quote_marker*[2-0,2-1) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), []);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);

      undo();
      /*
      > p
      > n
       */
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), []);
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
        "block_quote_marker[0-0,0-1)", "text[0-2,0-3)",
        "block_quote_marker[1-0,1-1)", "text[1-2,1-3)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), []);
      assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[2-4,2-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[3-4,3-7)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(2, 5, 2, 6), "");
    /*
    p
    ⏎
    ····ac
    ····1234
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[4-4,4-7)",
      "chunk[3-4,3-8)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "IndentedCodeBlock(1)[ chunk[2-4,2-7), chunk[4-4,4-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[2-4,2-7)",
      "chunk[3-4,3-7)",
      "text[5-0,5-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[4-4,4-7)"]);
    assertEquals(lexr._relexd, false);

    undo();
    /*
    p
    ⏎
    ····abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[2-4,2-7)",
      "chunk[3-4,3-7)",
      "text[5-0,5-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(2, 4), "4");
    /*
    p
    ⏎
    ····4abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[3-4,3-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[2-4,2-7)"]);
    assertEquals(lexr._relexd, false);

    undo();
    /*
    p
    ⏎
    ····abc
    ····123
    ····xyz
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[3-4,3-7)",
      "chunk[4-4,4-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "code_fence[1-0,1-3)",
      "code_fence[2-0,2-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(3, 0), "abc\n");
    /*
    p
    ```
    ⏎
    abc
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "code_fence[1-0,1-3)",
      "code_fence[3-0,3-3)",
      "chunk[2-0)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(1)._rv, "xyz");
    /*
    p
    ```xyz
    ⏎
    abc
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "code_fence[1-0,1-3)",
      "code_fence[4-0,4-3)",
      "chunk[2-0)",
      "chunk[3-0,3-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[1-0,1-4)",
        "chunk[2-0,2-3)",
        "text[3-0,3-1)",
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["code_fence[1-0,1-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[3-0,3-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["code_fence[2-0,2-3)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), "\n");
    /*
    p
    ⏎
    ````
    ```
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "code_fence[2-0,2-4)",
        "chunk[3-0,3-3)",
        "text[4-0,4-1)",
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), ["Paragraph(1)[ text[0-0,0-1) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[3-0,3-1)",
      "code_fence[1-0,1-4)",
      "chunk[2-0,2-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(3)._rv, "`");
    /*
    p
    ⏎
    ````
    ````
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), ["Paragraph(1)[ text[0-0,0-1) ]"]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["chunk[3-0,3-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[4-0,4-1)",
      "code_fence[2-0,2-4)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, true);

    repl(ran(3)._rv, "`");
    /*
    p
    ⏎
    ````
    `````
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "FencedCodeBlock(1)[ code_fence[2-0,2-4), code_fence[3-0,3-4) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[4-0,4-1)",
      "code_fence[2-0,2-4)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["code_fence[3-0,3-4)"]);
    assertEquals(lexr._relexd, false);

    repl(ran(3)._rv, "\n");
    /*
    p
    ⏎
    ````
    `````
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "FencedCodeBlock(1)[ code_fence[2-0,2-4), code_fence[3-0,3-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[4-0,4-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
      assertEquals(lexr.strtLexTk_$._Repr(), [
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
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.takldSn_sa_$._repr(), [
        "Paragraph(3)[ text[0-4,0-5) ]",
        "Paragraph(3)[ text[6-4,6-5) ]",
      ]);
      assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0)?._c(0));
      assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(0)?._c(2));
      assertEquals(lexr.unrelSnt_sa_$._repr(), []);
      assertEquals(lexr.reusdSnt_sa_$._repr(), [
        "bullet_list_marker[0-2,0-3)",
        "text[2-4,2-7)",
        "text[4-4,4-7)",
      ]);
      assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[3-1,3-4)"]);
      assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "bullet_list_marker[1-2,1-3)",
      "text[1-4,1-7)",
      "text[3-4,3-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[2-1,2-4)"]);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "BulletListItem(2)[ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "BulletListItem(2)[ bullet_list_marker[1-2,1-3), text[3-4,3-7) ]",
      "Paragraph(3)[ text[1-4,1-7), text[3-4,3-7) ]",
      "Paragraph(3)[ text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(1));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(2), list_._c(1)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(3), list_._c(2)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
      "bullet_list_marker[1-2,1-3)", "text[1-4,1-7)",
      "text[2-1,2-4)",
      "bullet_list_marker[4-0,4-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[3-4,3-7)"]);
    assertEquals(lexr._relexd, false);

    tkId_a = lexr._tkId_a;
    undo();
    /*
    ·* p
    ··* abc
    ·123
    ····xyz
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "BulletListItem(2)[ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "Paragraph(3)[ text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(2)?._c(0));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), /* deno-fmt-ignore */ [
      "bullet_list_marker[1-2,1-3)", "text[1-4,1-7)",
      "text[2-1,2-4)",
      "bullet_list_marker[4-0,4-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    tkId_a = lexr._tkId_a;
    repl(rv(1, 1, 1, 2), "");
    /*
    ·* p
    ·* abc
    ·123
    ····xyz
    * n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), ["Paragraph(3)[ text[0-3,0-4) ]"]);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "BulletListItem(2)[ bullet_list_marker[0-1,0-2), text[0-3,0-4) ]",
      "Paragraph(3)[ text[1-4,1-7), text[3-4,3-7) ]",
      "BulletListItem(2)[ bullet_list_marker[4-0,4-1), text[4-2,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), list_._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), list_._c(1)?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(2), list_._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["bullet_list_marker[1-2,1-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "ThematicBreak(1)[ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "thematic_break[1-2,1-5)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(1)._rv, "*");
    /*
    p
    ··*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "ThematicBreak(1)[ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[2-0,2-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["thematic_break[1-2,1-5)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), " ");
    /*
    p
    ···*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["thematic_break[1-2,1-7)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), " ");
    /*
    p
    ····*** *
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[2-0,2-1) ]",
      "Paragraph(1)[ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-1)",
      "thematic_break[1-3,1-8)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "ThematicBreak(1)[ thematic_break[1-2,1-5) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[2-0,2-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
      "setext_heading[5-0,5-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[3-0,3-3)"]);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["setext_heading[5-0,5-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[4-0,4-3)",
      "text[3-0,3-4)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[3-0,3-4)",
      "setext_heading[5-0,5-4)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "SetextHeading(1)[ text[2-0,2-3), setext_heading[3-0,3-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "text[4-0,4-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["setext_heading[3-0,3-3)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(2, 0), "4");
    /*
    p
    ⏎
    4abc
    ----
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[4-0,4-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["setext_heading[3-0,3-4)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[2-0,2-3)"]);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[4-0,4-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[2-0,2-3)",
      "setext_heading[3-0,3-3)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[5-0,5-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(3));
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["setext_heading[4-0,4-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[3-0,3-3)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, true);

    undo();
    /*
    p
    ⏎
    ⏎
    abc
    ---
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
      "Paragraph(1)[ text[3-0,3-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(2), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["thematic_break[5-0,5-3)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), []);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "SetextHeading(1)[ text[3-0,3-3), setext_heading[4-0,4-3) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[5-0,5-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-6,1-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[1-2,1-5)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 6), " ");
    /*
    p
    # abc4··#
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-7,1-8)",
      "text[1-2,1-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 2), "5");
    /*
    p
    # 5abc4··#
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "atx_heading[1-8,1-9)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["text[1-2,1-6)"]);
    assertEquals(lexr._relexd, false);
  });

  it("edits at boundaries of one ATXHeading without line feed", () => {
    init(["p", "# abc #", "n"]);

    repl(ran(1)._rv, "#");
    /*
    p
    # abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "ATXHeading(1)[ atx_heading[1-0,1-1), atx_heading[1-6,1-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "text[1-2,1-5)",
      "text[2-0,2-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["atx_heading[1-6,1-7)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), "\t");
    /*
    p
    →→→→# abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
      /* deno-fmt-ignore */ [
        "strtBdry[0-0)", "text[0-0,0-1)",
        "text[1-1,1-9)",
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[2-0,2-1) ]",
      "Paragraph(1)[ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[2-0,2-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "text[1-2,1-5)",
      "atx_heading[1-6,1-8)",
    ]);
    assertEquals(lexr._relexd, false);

    undo(); // 👍
    /*
    p
    # abc ##
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "ATXHeading(1)[ atx_heading*[1-0,1-1) ]",
    ]);
    assertNotStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), ["text[1-1,1-9)"]);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "text[0-0,0-1)",
      "text[2-0,2-1)",
      "atx_heading*[1-0,1-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, true);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "atx_heading[1-0,1-1)",
      "text[1-2,1-5)",
      "atx_heading[1-6,1-7)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "ATXHeading(1)[ atx_heading[2-0,2-1), atx_heading[2-6,2-7) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[3-0,3-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[1-0,1-5)",
      "chunk[2-0,2-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(1)._rv, "xyz");
    /*
    p
    <pre>xyz
    ⏎
    </pre>
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), []);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[3-0,3-6)",
      "chunk[2-0)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[1-0,1-5)"]);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "HTMLBlock(1)[ chunk[1-0,1-5), chunk[2-0,2-6) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertNotStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(1));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[1-0,1-5)",
      "text[3-0,3-1)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[2-0,2-6)"]);
    assertEquals(lexr._relexd, false);

    repl(rv(1, 0), "<!--");
    /*
    p
    <!--<pre>
    </pre>-->
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["chunk[2-0,2-9)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), ["chunk[1-0,1-5)"]);
    assertEquals(lexr._relexd, false);
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
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[3-0,3-1) ]",
    ]);
    assertStrictEquals(pazr.takldSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.takldSn_sa_$.at(1), pazr._root?._c(2));
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), [
      "chunk[1-0,1-5)",
      "chunk[2-0,2-6)",
    ]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);

    repl(ran(3)._rv, "\n");
    /*
    p
    ⏎
    <pre>
    </pre>
    ⏎
    n
     */
    assertEquals(lexr.strtLexTk_$._Repr(), [
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
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.takldSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "HTMLBlock(1)[ chunk[2-0,2-5), chunk[3-0,3-6) ]",
    ]);
    assertEquals(lexr.unrelSnt_sa_$._repr(), []);
    assertEquals(lexr.reusdSnt_sa_$._repr(), ["text[4-0,4-1)"]);
    assertEquals(lexr.abadnSnt_sa_$._repr(), []);
    assertEquals(lexr._relexd, false);
  });
});

describe("Compiling Linkdef", () => {
  it.skip("edits in one Linkdef", () => {
    init(["[lab]: /uri (abc)", "[lab]"]);

    repl(rv(0, 8, 0, 9), "i");
    /*
    [lab]: /iri (abc)
    [lab]
     */
    assertEquals(
      pazr._root?._toHTML(lexr),
      '<p><a href="/iri" title="abc">lab</a></p>',
    );
  });
});
/*80--------------------------------------------------------------------------*/
