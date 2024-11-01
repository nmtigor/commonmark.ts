/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextLexr_test
 * @license BSD-3-Clause
 ******************************************************************************/

import { assertEquals, assertStrictEquals } from "@std/assert";
import { after, afterEach, describe, it } from "@std/testing/bdd";
import type { id_t, uint } from "../../alias.ts";
import { MdextBufr } from "./MdextBufr.ts";
import type { TestO } from "../_test.ts";
import { ran, repl, rv, test_o, undo } from "../_test.ts";
import { MdextLexr } from "./MdextLexr.ts";
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

    repl(ran(3)._rv, "4");
    /*
    p

    abc
    1234
    xyz

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
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<p>abc", "1234", "xyz</p>", "<p>n</p>",
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root?._c(1));
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.reusdSn_sa_$._repr(), []);
  });

  it("edits at boundaries of one Paragraph without line feed", () => {
    init(["p", "", "abc", "123", "xyz", "", "n"]);

    repl(ran(4)._rv, "4");
    /*
    p

    abc
    123
    xyz4

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
    assertEquals(
      pazr._root?._toHTML(lexr),
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<p>abc", "123", "xyz4</p>", "<p>n</p>",
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), [
      "Paragraph(1)[ text[2-0,2-3), text[4-0,4-3) ]",
    ]);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.reusdSn_sa_$.at(1), pazr._root?._c(2));

    undo();
    /*
    p

    abc
    123
    xyz

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
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.reusdSn_sa_$.at(1), pazr._root?._c(2));

    repl(rv(2, 0), "4");
    /*
    p

    4abc
    123
    xyz

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
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<p>4abc", "123", "xyz</p>", "<p>n</p>",
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), [
      "Paragraph(1)[ text[2-0,2-3), text[4-0,4-3) ]",
    ]);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.reusdSn_sa_$.at(1), pazr._root?._c(2));

    undo();
    /*
    p

    abc
    123
    xyz

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
      /* deno-fmt-ignore */ [
        "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
      ].join("\n"),
    );
    assertStrictEquals(pazr.drtSn_$, pazr._root);
    assertEquals(pazr.unrelSn_sa_$._repr(), []);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1) ]",
      "Paragraph(1)[ text[6-0,6-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));
    assertStrictEquals(pazr.reusdSn_sa_$.at(1), pazr._root?._c(2));
  });

  it("feeds lines", () => {
    init(["p", "n"]);

    repl(rv(0, 0), "\n");
    /*

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
    assertEquals(pazr.unrelSn_sa_$._repr(), [
      "Document(0)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));

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
      "Document(0)[ text[1-0,1-1), text[2-0,2-1) ]",
    ]);
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[1-0,1-1), text[2-0,2-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));

    //kkkk
    // repl(rv(1, 0), "\n");
    // /*
    // p

    // n
    //  */
    // assertEquals(
    //   pazr._root?._toHTML(lexr),
    //   ["<p>p</p>", "<p>n</p>"].join("\n"),
    // );

    repl(ran(1)._rv, "\n");
    /*
    p
    n

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
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));

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
    assertEquals(pazr.reusdSn_sa_$._repr(), [
      "Paragraph(1)[ text[0-0,0-1), text[1-0,1-1) ]",
    ]);
    assertStrictEquals(pazr.reusdSn_sa_$.at(0), pazr._root?._c(0));
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
      assertEquals(tkId_a[1], tkId_a_1[1]);
      assertEquals(tkId_a[3], tkId_a_1[3]);
      assertEquals(tkId_a[4], tkId_a_1[4]);
      assertEquals(tkId_a[6], tkId_a_1[6]);
      assertEquals(tkId_a[8], tkId_a_1[8]);
      assertEquals(tkId_a[10], tkId_a_1[10]);
      assertEquals(tkId_a[11], tkId_a_1[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "1234", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0)?._c(1));
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.reusdSn_sa_$._repr(), []);
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
      assertEquals(tkId_a[1], tkId_a_1[1]);
      assertEquals(tkId_a[3], tkId_a_1[3]);
      assertEquals(tkId_a[4], tkId_a_1[4]);
      assertEquals(tkId_a[6], tkId_a_1[6]);
      assertEquals(tkId_a[8], tkId_a_1[8]);
      assertEquals(tkId_a[10], tkId_a_1[10]);
      assertEquals(tkId_a[11], tkId_a_1[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz4</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(pazr.unrelSn_sa_$._repr(), [
        "Paragraph(2)[ text[2-2,2-5), text[4-2,4-5) ]",
      ]);
      assertEquals(pazr.reusdSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr._root?._c(0)?._c(0), pazr.reusdSn_sa_$.at(0));
      assertStrictEquals(pazr._root?._c(0)?._c(2), pazr.reusdSn_sa_$.at(1));

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
      assertEquals(tkId_a[1], tkId_a_1[1]);
      assertEquals(tkId_a[3], tkId_a_1[3]);
      assertEquals(tkId_a[4], tkId_a_1[4]);
      assertEquals(tkId_a[6], tkId_a_1[6]);
      assertEquals(tkId_a[8], tkId_a_1[8]);
      assertEquals(tkId_a[10], tkId_a_1[10]);
      assertEquals(tkId_a[11], tkId_a_1[11]);
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.reusdSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr._root?._c(0)?._c(0), pazr.reusdSn_sa_$.at(0));
      assertStrictEquals(pazr._root?._c(0)?._c(2), pazr.reusdSn_sa_$.at(1));

      tkId_a = lexr._tkId_a;
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
      tkId_a_1 = lexr._tkId_a;
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>4abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(pazr.unrelSn_sa_$._repr(), [
        "Paragraph(2)[ text[2-2,2-5), text[4-2,4-5) ]",
      ]);
      assertEquals(pazr.reusdSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr._root?._c(0)?._c(0), pazr.reusdSn_sa_$.at(0));
      assertStrictEquals(pazr._root?._c(0)?._c(2), pazr.reusdSn_sa_$.at(1));

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
      assertEquals(
        pazr._root?._toHTML(lexr),
        /* deno-fmt-ignore */ [
          "<blockquote>", "<p>p</p>", "<p>abc", "123", "xyz</p>", "<p>n</p>",
          "</blockquote>",
        ].join("\n"),
      );
      assertStrictEquals(pazr.drtSn_$, pazr._root?._c(0));
      assertEquals(pazr.unrelSn_sa_$._repr(), []);
      assertEquals(pazr.reusdSn_sa_$._repr(), [
        "Paragraph(2)[ text[0-2,0-3) ]",
        "Paragraph(2)[ text[6-2,6-3) ]",
      ]);
      assertStrictEquals(pazr._root?._c(0)?._c(0), pazr.reusdSn_sa_$.at(0));
      assertStrictEquals(pazr._root?._c(0)?._c(2), pazr.reusdSn_sa_$.at(1));
    });
  });
});
/*80--------------------------------------------------------------------------*/
