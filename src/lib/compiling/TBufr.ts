/** 80**************************************************************************
 * @module lib/compiling/TBufr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t } from "../alias.ts";
import { assert } from "../util/trace.ts";
import { Bufr } from "./Bufr.ts";
import { TLVert } from "./TLayr.ts";
import { TLine } from "./TLine.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TBufr extends Bufr {
  override get frstLine() {
    return this.frstLine_$ as TLine;
  }
  override get lastLine() {
    return this.lastLine_$ as TLine;
  }

  readonly tlvert = new TLVert();
  // readonly tlvert = new TLVert([
  //   new TLHorz([
  //     new DulmapTL( dgmap_1 )
  //   ])
  // ]);

  readonly bufr;

  constructor(bufr_x: Bufr) {
    super("", bufr_x.dir);
    this.bufr = bufr_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override createLine() {
    return new TLine(this);
  }

  override line(lidx_x: lnum_t) {
    return super.line(lidx_x) as TLine;
  }

  get _cnt_() {
    const ret: { text: string; text_a_$: any[] }[] = [];
    let tln: TLine | undefined = this.frstLine;
    const VALVE = 1_000;
    let valve = VALVE;
    do {
      ret.push({
        text: tln.text,
        text_a_$: tln.text_a_$,
      });
      tln = tln.nextLine;
    } while (tln && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret;
  }
  /**
   * @deprecated
   * @const @param txt_x
   */
  _cntE_(txt_x: ((string | string[])[])[]) {
    const n = txt_x.length;

    let line: TLine | undefined = this.frstLine;
    let i = 0;

    const VALVE = 1_000;
    let valve = VALVE;
    do {
      if (i >= n || !line.text_a_$.eq(txt_x[i])) return false;

      line = line.nextLine;
      i++;
    } while (line && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    return i === n;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // /**
  //  * `in( strt_x <= stop_x )`
  //  */
  // #tmap(lidx_x: lnum_t, strt_x: loff_t, stop_x: loff_t) {
  //   const tline = this.line(lidx_x);
  //   let line: Line | undefined = this.bufr.line(lidx_x);
  //   const VALVE = 1_000;
  //   let valve = VALVE;
  //   while (line && --valve) {
  //     if (line.frstTSeg_$?.tline === tline) {
  //       return line.tmap_$(strt_x, stop_x);
  //     }

  //     line = line.nextLine;
  //   }
  //   assert(valve, `Loop ${VALVE}±1 times`);

  //   return [];
  // }

  // search(key_x: string): Ranval[] | undefined {
  //   /*#static*/ if (_TRACE) {
  //     console.log(
  //       `${global.indent}>>>>>>> ${this._type_id_}.search("${key_x}") >>>>>>>`,
  //     );
  //   }
  //   key_x = key_x.split(/\r\n|\r|\n/g)[0]; // Only search first line.
  //   if (!key_x.length) {
  //     /*#static*/ if (_TRACE) global.outdent;
  //     return;
  //   }

  //   const key_a: (string | string[])[] = [];
  //   for (let i = 0, LEN = key_x.length; i < LEN; ++i) {
  //     const uchr = key_x[i];
  //     if (this.tlvert.treat(uchr)) {
  //       const out: string[] = [];
  //       this.tlvert.dull(uchr, out);
  //       key_a.push(out);
  //     } else {
  //       key_a.push(uchr);
  //     }
  //   }
  //   // console.log(key_a);

  //   const tout: Ranval[] = [];
  //   for (let i = 0, LEN = this.lineN; i < LEN; ++i) {
  //     this.#search_line(i, key_a, tout);
  //   }

  //   const ret: Ranval[] = [];
  //   tout.forEach((rv) => ret.push(...this.#tmap(rv[0], rv[1], rv[3])));
  //   /*#static*/ if (_TRACE) global.outdent;
  //   return ret;
  // }

  // #match(key_x: string | string[], uchr_x: string | string[]) {
  //   if (Array.isArray(uchr_x)) {
  //     if (Array.isArray(key_x)) {
  //       return uchr_x.some((s) => key_x.some((k) => s.startsWith(k)));
  //     } else {
  //       return uchr_x.some((s) => s.startsWith(key_x));
  //     }
  //   } else {
  //     if (Array.isArray(key_x)) {
  //       return key_x.some((k) => uchr_x.startsWith(k));
  //     } else {
  //       return uchr_x.startsWith(key_x);
  //     }
  //   }
  // }

  // /**
  //  * `in( key_a_x.length )`
  //  * @const @param lidx_x
  //  * @headconst @param key_a_x
  //  * @headconst @param out_x
  //  */
  // #search_line(
  //   lidx_x: lnum_t,
  //   key_a_x: (string | string[])[],
  //   out_x: Ranval[],
  // ) {
  //   const text_a = this.line(lidx_x).text_a_$;
  //   const LENj = key_a_x.length;
  //   for (let i = 0, LENi = text_a.length - LENj + 1; i < LENi; ++i) {
  //     let match = true;
  //     for (let j = 0; j < LENj && match; ++j) {
  //       match = this.#match(text_a[i + j], key_a_x[j]);
  //     }
  //     if (match) {
  //       out_x.push(new Ranval(lidx_x, i, lidx_x, i + LENj));
  //     }
  //   }
  // }
}
/*80--------------------------------------------------------------------------*/
