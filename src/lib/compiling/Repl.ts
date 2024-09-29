/** 80**************************************************************************
 * @module lib/compiling/Repl
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, lnum_t } from "../alias.ts";
import { linesOf } from "../util/general.ts";
import { assert, traceOut } from "../util/trace.ts";
import { BufrReplState } from "./alias.ts";
import type { Bufr } from "./Bufr.ts";
import { Line } from "./Line.ts";
import { Ran } from "./Ran.ts";
import { Ranval } from "./Ranval.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Repl {
  static #ID = 0 as id_t;
  readonly id = ++Repl.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

  readonly #bufr: Bufr;

  readonly #ranval: Ranval;
  get _ranval() {
    return this.#ranval;
  }
  readonly #ranval_rev = new Ranval(0 as lnum_t, 0);
  get _ranval_rev() {
    return this.#ranval_rev;
  }

  #text_a: string[];
  get _text_a() {
    return this.#text_a;
  }
  readonly replText_a: string[] = [];
  get _replText_a() {
    return this.replText_a;
  }

  /** Helper */
  readonly #tmpRan: Ran;

  /**
   * Use `Ranval` not `Ran` directly because `Ran` can be invalid
   * after `undo()` / `redo()`
   * @headconst @param bufr_x
   * @const @param rv_x [COPIED]
   * @const @param text_x
   */
  constructor(bufr_x: Bufr, rv_x: Ranval, text_x: string[] | string) {
    this.#bufr = bufr_x;
    this.#ranval = rv_x;
    // this.#text_a = text_x ? linesOf(text_x) : [];
    this.#text_a = Array.isArray(text_x) ? text_x : linesOf(text_x);
    this.#tmpRan = Ran.create(bufr_x, rv_x);
  }

  /**
   * `inRan_x`(src) -> `outTxt_a_x`
   * `inTxt_a_x`(tgt) -> `outRan_x`
   * @headconst @param inRan_x
   * @const @param inTxt_a_x
   * @out @param outRan_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRan_x
   */
  #repl_impl(
    inRan_x: Ran,
    inTxt_a_x: string[],
    outRan_x: Ran,
    outTxt_a_x: string[],
  ) {
    let lnSrc: Line | undefined = inRan_x.frstLine;
    const lnSrc_1 = inRan_x.lastLine;
    /*#static*/ if (INOUT) {
      assert(!lnSrc_1.removed);
    }
    const loffSrc_0 = inRan_x.strtLoff;
    const loffSrc_1 = inRan_x.stopLoff;
    let i_ = 0;
    if (inTxt_a_x.length === 0) inTxt_a_x.push("");
    const tgtN = inTxt_a_x.length;
    outTxt_a_x.length = inRan_x.lineN_1;
    const oneLnSrc = outTxt_a_x.length === 1;

    const VALVE = 1_000;
    let valve = VALVE;
    while (lnSrc && lnSrc !== lnSrc_1 && --valve) {
      if (i_ === 0) {
        outTxt_a_x[0] = lnSrc.text.slice(loffSrc_0);
        lnSrc.splice_$(loffSrc_0, lnSrc.uchrLen, inTxt_a_x[0]);
      } else if (i_ < tgtN) {
        outTxt_a_x[i_] = lnSrc.text;
        lnSrc.resetText_$(inTxt_a_x[i_]);
      } else break;

      lnSrc = lnSrc.nextLine;
      ++i_;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    /*#static*/ if (INOUT) {
      assert(lnSrc);
    }

    const txtSrc_1 = lnSrc_1.text;
    let lnSrc_0 = inRan_x.frstLine;
    if (i_ === tgtN) {
      while (lnSrc && lnSrc !== lnSrc_1 && --valve) {
        outTxt_a_x[i_++] = lnSrc.text;

        const ln = lnSrc.nextLine;
        lnSrc.removeSelf_$();
        lnSrc = ln;
      }
      assert(valve);
      /*#static*/ if (INOUT) {
        assert(lnSrc);
      }

      /*#static*/ if (INOUT) {
        assert(i_ === outTxt_a_x.length - 1);
      }
      outTxt_a_x[i_] = txtSrc_1.slice(0, loffSrc_1);

      /*#static*/ if (INOUT) {
        assert(lnSrc_1.prevLine);
      }
      // outRan_x.stopLoc.set( lnSrc_1.prevLine, lnSrc_1.prevLine.uchrLen );
      // lnSrc_1.prevLine.append_$( txtSrc_1.slice(loffSrc_1) );
      // lnSrc_1.removeSelf_$();
      lnSrc_1.splice_$(0, loffSrc_1, lnSrc_1.prevLine!.text);
      outRan_x.stopLoc.reset(lnSrc_1, lnSrc_1.prevLine!.uchrLen);
      if (lnSrc_1.prevLine === lnSrc_0) lnSrc_0 = lnSrc_1; //!
      lnSrc_1.prevLine!.removeSelf_$();
    } else if (lnSrc === lnSrc_1) {
      /*#static*/ if (INOUT) {
        assert(i_ === outTxt_a_x.length - 1);
      }
      outTxt_a_x[i_] = txtSrc_1.slice(oneLnSrc ? loffSrc_0 : 0, loffSrc_1);

      if (tgtN === 1) {
        /*#static*/ if (INOUT) {
          assert(oneLnSrc && i_ === 0);
        }
        lnSrc_1.splice_$(loffSrc_0, loffSrc_1, inTxt_a_x[0]);

        // lnSrc_0 = lnSrc_1;
        outRan_x.stopLoc.reset(lnSrc_1, loffSrc_0 + inTxt_a_x[0].length);
      } else {
        if (i_ < tgtN - 1) {
          const bufr = this.#bufr;
          if (oneLnSrc) {
            lnSrc_0 = lnSrc_1.insertPrev_$(
              Line.create(
                bufr,
                `${txtSrc_1.slice(0, loffSrc_0)}${inTxt_a_x[i_]}`,
              ),
            );
          } else {
            lnSrc_1.insertPrev_$(Line.create(bufr, inTxt_a_x[i_]));
          }
          i_++;
          for (; i_ < tgtN - 1; i_++) {
            lnSrc_1.insertPrev_$(Line.create(bufr, inTxt_a_x[i_]));
          }
        }
        /*#static*/ if (INOUT) {
          assert(i_ === tgtN - 1);
        }
        lnSrc_1.splice_$(0, loffSrc_1, inTxt_a_x[i_]);

        outRan_x.stopLoc.reset(lnSrc_1, inTxt_a_x[i_].length);
      }
    } else {
      /*#static*/ if (INOUT) {
        assert(0);
      }
    }
    outRan_x.strtLoc.reset(lnSrc_0, loffSrc_0);

    /*#static*/ if (INOUT) {
      assert(lnSrc_1 === outRan_x.lastLine);
    }
  }

  /**
   * @const @param inRv_x
   * @const @param inTxt_a_x
   * @out @param outRv_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRv_x
   */
  _test(
    inRv_x: Ranval,
    inTxt_a_x: string[],
    outRv_x: Ranval,
    outTxt_a_x: string[],
  ) {
    const inRan = Ran.create(this.#bufr, inRv_x);
    this.#repl_impl(inRan, inTxt_a_x, this.#tmpRan, outTxt_a_x);
    this.#tmpRan.toRanval(outRv_x);
  }

  /**
   * Trigger `repl_mo` callbacks, besides invoking `#repl_impl()`
   * @const @param inRv_x
   * @const @param inTxt_a_x
   * @out @param outRv_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRv_x
   */
  @traceOut(_TRACE)
  private _impl(
    inRv_x: Ranval,
    inTxt_a_x: string[],
    outRv_x: Ranval,
    outTxt_a_x: string[],
  ) {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}._impl() >>>>>>>`);
    }
    // console.log(`inRv_x = ${inRv_x.toString()}`);
    // console.log(inTxt_a_x);

    const inRan = this.#bufr.oldRan_$ = Ran.create(this.#bufr, inRv_x);
    inRan.resetRanval_$(); //!
    const lnN_inRan = inRan.lineN_1;
    this.#bufr.repl_mo.val = BufrReplState.prerepl;

    this.#repl_impl(inRan, inTxt_a_x, this.#tmpRan, outTxt_a_x);
    this.#tmpRan.toRanval(outRv_x);
    // // #if _TRACE
    //   console.log( `outRv_x=${outRv_x.toString()}` );
    //   console.log( outTxt_a_x );
    // // #endif

    this.#bufr.newRan_$ = this.#tmpRan.dup();
    this.#bufr.newRan_$.resetRanval_$(); //!
    // this.#bufr.dtLineN_$ = this.#bufr.newRan_$.lineN_1 - lnN_inRan;
    this.#bufr.repl_mo.val = BufrReplState.sufrepl;
    this.#bufr.repl_mo.val = BufrReplState.sufrepl_edtr;

    this.#bufr.repl_mo.val = BufrReplState.idle;
    // console.log(`outRv_x = ${outRv_x.toString()}`);
    // console.log(outTxt_a_x);
  }

  #replFRan = false;
  /**
   * A `Repl` is a step stored in `Bufr.#doq`, and `replFRun()` is called with
   * one `#text_a`.\
   * But there are cases (e.g. involving IME) that `replFRun()` is called with
   * different data other than `#text_a`, so the replacing texts need to be
   * given explicitly.\
   * Calling with data other than `#text_a` only makes sense in the first time,
   * i.e., through `Bufr.Do()` rather than `Bufr.redo()`
   * @const @param txt_x
   */
  replFRun(txt_x?: string[] | string) {
    /*#static*/ if (INOUT) {
      assert(txt_x === undefined || !this.#replFRan);
    }
    // let replText_a_save: string[] | undefined;
    if (txt_x !== undefined) {
      this.#text_a = Array.isArray(txt_x) ? txt_x : linesOf(txt_x);
      // this.#ranval = this.#ranval_rev.dup(); //!
      // replText_a_save = [...this.replText_a]; //!
    }

    this._impl(this.#ranval, this.#text_a, this.#ranval_rev, this.replText_a);

    if (txt_x === undefined) {
      this.#replFRan = true;
    } else {
      this.#ranval.become(this.#ranval_rev);
      // this.replText_a = replText_a_save!; // For keeping `replBRun()` correct
      // console.log(this.replText_a);
    }
  }

  replBRun() {
    this._impl(this.#ranval_rev, this.replText_a, this.#ranval, this.#text_a);
  }
}
/*80--------------------------------------------------------------------------*/
