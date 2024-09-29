/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextLexr_test
 * @license BSD-3-Clause
 ******************************************************************************/

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import type { uint } from "../../alias.ts";
import { MdextBufr } from "./MdextBufr.ts";
import type { TestO } from "../_test.ts";
import { repl, rv, test_o } from "../_test.ts";
import { MdextLexr } from "./MdextLexr.ts";
/*80--------------------------------------------------------------------------*/

let bufr!: MdextBufr;
let lexr!: any;

function init(text_x?: string) {
  bufr = new MdextBufr(text_x);
  lexr = MdextLexr.create(bufr);
  bufr.repl_actr.init(lexr);
  bufr.repl_mo.registHandler((n_y) => bufr.repl_actr.to(n_y));

  Object.assign(test_o, { bufr, lexr } as Partial<TestO>);
}

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
      /^`{32} example\n([\s\S]*?)\n^\.\n([\s\S]*?)^`{32}$|^(#{1,2}) *(.*)$/gm,
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
      init();

      // hr_1 = performance.now();
      repl(rv(0, 0), markdown);
      // hr_ += performance.now() - hr_1;
      assertEquals(lexr._root._toHTML(lexr), expected);
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

/*80--------------------------------------------------------------------------*/
