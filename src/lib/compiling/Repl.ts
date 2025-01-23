/** 80**************************************************************************
 * @module lib/compiling/Repl
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, lnum_t } from "../alias.ts";
import { linesOf } from "../util/general.ts";
import { assert, fail, traceOut } from "../util/trace.ts";
import { BufrReplState } from "./alias.ts";
import type { Bufr } from "./Bufr.ts";
import { Line } from "./Line.ts";
import { Ran } from "./Ran.ts";
import { g_ranval_fac, Ranval } from "./Ranval.ts";
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

  /** array of ran */
  readonly aoa;

  readonly #ranval_a: Ranval[] | undefined;
  get _ranval_a(): Ranval[] {
    return this.#ranval_a!;
  }
  readonly #ranval: Ranval | undefined;
  get _ranval() {
    return this.#ranval!;
  }

  readonly #ranval_rev_a: Ranval[] | undefined;
  get _ranval_rev_a(): Ranval[] {
    return this.#ranval_rev_a!;
  }
  readonly #ranval_rev: Ranval | undefined;
  get _ranval_rev(): Ranval {
    return this.#ranval_rev!;
  }

  #text_a2: string[][] | undefined;
  get _text_a2(): string[][] {
    return this.#text_a2!;
  }
  #text_a: string[] | undefined;
  get _text_a(): string[] {
    return this.#text_a!;
  }

  readonly #replText_a2: string[][] | undefined;
  get _replText_a2_(): string[][] {
    return this.#replText_a2!;
  }
  readonly #replText_a: string[] | undefined;
  get _replText_a_(): string[] {
    return this.#replText_a!;
  }

  /** for composition */
  #replText_a2_0: string[][] | undefined;
  /** for composition */
  #replText_a_0: string[] | undefined;

  /** Helper */
  readonly #tmpRan;

  /**
   * Use `Ranval` not `Ran` directly because `Ran` can be invalid
   * after `undo()` / `redo()`
   * @headconst @param bufr_x
   * @const @param rv_x [COPIED] if `Ranval`
   * @const @param text_x
   */
  constructor(
    bufr_x: Bufr,
    rv_x: Ranval | Ranval[],
    text_x: (string[] | string) | (string[] | string)[],
  ) {
    /*#static*/ if (INOUT) {
      assert((rv_x instanceof Ranval) || rv_x.length === text_x.length);
    }
    this.#bufr = bufr_x;
    if (rv_x instanceof Ranval) {
      this.aoa = false;
      this.#ranval = rv_x;
      this.#text_a = Array.isArray(text_x)
        ? text_x as string[]
        : linesOf(text_x);
      this.#ranval_rev = new Ranval(0 as lnum_t, 0);
      this.#replText_a = [];
    } else {
      this.aoa = true;
      this.#ranval_a = rv_x;
      this.#text_a2 = (text_x as (string[] | string)[]).map((_y) =>
        Array.isArray(_y) ? _y : linesOf(_y)
      );
      this.#ranval_rev_a = Array.from(
        { length: rv_x.length },
        () => new Ranval(0 as lnum_t, 0),
      );
      this.#replText_a2 = Array.from({ length: rv_x.length }, () => []);
    }
    using rv_u = g_ranval_fac.oneMore().setRanval(0 as lnum_t, 0);
    this.#tmpRan = Ran.create(this.#bufr, rv_u);
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
      assert(valve, `Loop ${VALVE}±1 times`);
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
      outRan_x.stopLoc.setLoc(lnSrc_1, lnSrc_1.prevLine!.uchrLen);
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
        outRan_x.stopLoc.setLoc(lnSrc_1, loffSrc_0 + inTxt_a_x[0].length);
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

        outRan_x.stopLoc.setLoc(lnSrc_1, inTxt_a_x[i_].length);
      }
    } else {
      /*#static*/ if (INOUT) {
        fail("Should not run here!");
      }
    }
    outRan_x.strtLoc.setLoc(lnSrc_0, loffSrc_0);

    /*#static*/ if (INOUT) {
      assert(lnSrc_1 === outRan_x.lastLine);
    }
  }

  /** @const @param inRv_x */
  #pre(inRv_x: Ranval | Ranval[]): Ran[] {
    // console.log(`inRv_x = ${inRv_x.toString()}`);
    // console.log(inTxt_a_x);

    const inRan_a = this.#bufr.oldRan_a_$;
    for (const ran of inRan_a) ran[Symbol.dispose]();

    if (this.aoa) {
      inRan_a.length = (inRv_x as Ranval[]).length;

      for (let i = (inRv_x as Ranval[]).length; i--;) {
        inRan_a[i] = this.#tmpRan.usingDup().setByRanval(
          (inRv_x as Ranval[])[i],
        );
        inRan_a[i].syncRanval_$(); //!
        /*#static*/ if (INOUT) {
          if (inRan_a.at(i + 1)) inRan_a[i].posS(inRan_a[i + 1]);
        }
      }
    } else {
      inRan_a.length = 1;

      inRan_a[0] = this.#tmpRan.usingDup().setByRanval(inRv_x as Ranval);
      inRan_a[0].syncRanval_$(); //!
      // const lnN_inRan = inRan.lineN_1;
    }
    return inRan_a;
  }

  /**
   * @headconst @param inRan_a
   * @const @param inTxt_a_x
   * @out @param outRv_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRv_x
   */
  #suf(
    inRan_a: Ran[],
    inTxt_a_x: string[] | string[][],
    outRv_x: Ranval | Ranval[],
    outTxt_a_x: string[] | string[][],
  ): void {
    const outRan_a = this.#bufr.newRan_a_$;
    for (const ran of outRan_a) ran[Symbol.dispose]();
    outRan_a.length = inRan_a.length;

    if (this.aoa) {
      let tailToNext = false;
      for (let i = inRan_a.length; i--;) {
        const prevToHead = i > 0 &&
          inRan_a[i - 1].lastLine === inRan_a[i].frstLine;
        this.#repl_impl(
          inRan_a[i],
          (inTxt_a_x as string[][])[i],
          this.#tmpRan,
          (outTxt_a_x as string[][])[i],
        );
        if (tailToNext) {
          const next = outRan_a[i + 1];
          const dt_ = this.#tmpRan.stopLoff - inRan_a[i].stopLoff;
          next.strtLoc.loff += dt_;
          if (next.frstLine === next.lastLine) {
            next.stopLoc.loff += dt_;
          }
          tailToNext = false;
        }
        if (prevToHead) {
          const prev = inRan_a[i - 1];
          if (prev.frstLine === prev.lastLine) {
            prev.stopLoc.line_$ = prev.strtLoc.line_$ = this.#tmpRan.frstLine;
          } else {
            prev.stopLoc.line_$ = this.#tmpRan.frstLine;
          }
          tailToNext = prevToHead;
        }
        outRan_a[i] = this.#tmpRan.usingDup();
      }
    } else {
      this.#repl_impl(
        inRan_a[0],
        inTxt_a_x as string[],
        this.#tmpRan,
        outTxt_a_x as string[],
      );
      // // #if _TRACE
      //   console.log( `outRv_x=${outRv_x.toString()}` );
      //   console.log( outTxt_a_x );
      // // #endif
      outRan_a[0] = this.#tmpRan.usingDup();
      // this.#bufr.dtLineN_$ = this.#bufr.newRan_$.lineN_1 - lnN_inRan;
    }

    if (this.aoa) {
      for (let i = outRan_a.length; i--;) {
        outRan_a[i].toRanval((outRv_x as Ranval[])[i]);
        outRan_a[i].syncRanval_$(); //!
      }
    } else {
      outRan_a[0].toRanval(outRv_x as Ranval);
      outRan_a[0].syncRanval_$(); //!
    }
  }

  /**
   * @const @param inRv_x
   * @const @param inTxt_a_x
   * @out @param outRv_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRv_x
   */
  _test_(
    inRv_x: Ranval | Ranval[],
    inTxt_a_x: string[] | string[][],
    outRv_x: Ranval | Ranval[],
    outTxt_a_x: string[] | string[][],
  ) {
    const inRan_a = this.#pre(inRv_x);
    this.#suf(inRan_a, inTxt_a_x, outRv_x, outTxt_a_x);
  }

  /**
   * Trigger `repl_mo` callbacks, besides invoking `#repl_impl()`\
   * Assign `#bufr.oldRan_$`, `#bufr.newRan_$`.
   * @const @param inRv_x
   * @const @param inTxt_a_x
   * @out @param outRv_x range of inTxt_a_x
   * @out @param outTxt_a_x texts of inRv_x
   */
  @traceOut(_TRACE)
  private _impl(
    inRv_x: Ranval | Ranval[],
    inTxt_a_x: string[] | string[][],
    outRv_x: Ranval | Ranval[],
    outTxt_a_x: string[] | string[][],
  ) {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}._impl() >>>>>>>`);
    }
    const inRan_a = this.#pre(inRv_x);

    this.#bufr.repl_mo.val = BufrReplState.prerepl;

    this.#suf(inRan_a, inTxt_a_x, outRv_x, outTxt_a_x);

    this.#bufr.repl_mo.val = BufrReplState.sufrepl;
    this.#bufr.repl_mo.val = BufrReplState.sufrepl_edtr;

    this.#bufr.repl_mo.val = BufrReplState.idle;
    // console.log(`outRv_x = ${outRv_x.toString()}`);
    // console.log(outTxt_a_x);
  }

  #replFRan = false;
  /**
   * If `aoa`, assign `#ranval_rev_a`, `#replText_a2`,
   * else, assign `#ranval_rev`, `#replText_a`.
   *
   * A `Repl` is a step stored in `Bufr.#doq`, and `replFRun()` is called with
   * one `#text_a`.\
   * But there are cases (e.g. involving IME) that `replFRun()` is called with
   * different data other than `#text_a`, so the replacing texts need to be
   * given explicitly.\
   * Calling with data other than `#text_a` only makes sense in the first time,
   * i.e., through `Bufr.Do()` rather than `Bufr.redo()`
   *
   * @const @param txt_x
   */
  replFRun(txt_x?: string[] | string | (string[] | string)[]) {
    /*#static*/ if (INOUT) {
      assert(txt_x === undefined || !this.#replFRan);
    }
    // let replText_a_save: string[] | undefined;
    if (txt_x !== undefined) {
      if (this.aoa) {
        /*#static*/ if (INOUT) {
          assert(this.#ranval_a!.length === txt_x.length);
        }
        this.#text_a2 = (txt_x as (string[] | string)[]).map((_y) =>
          Array.isArray(_y) ? _y : linesOf(_y)
        );
        this.#text_a = this.#text_a2[0];
      } else {
        this.#text_a = Array.isArray(txt_x)
          ? txt_x as string[]
          : linesOf(txt_x);
        // this.#ranval = this.#ranval_rev.dup(); //!
        // replText_a_save = [...this.#replText_a]; //!
      }
    }

    if (this.aoa) {
      this._impl(
        this.#ranval_a!,
        this.#text_a2!,
        this.#ranval_rev_a!,
        this.#replText_a2!,
      );
    } else {
      this._impl(
        this.#ranval!,
        this.#text_a!,
        this.#ranval_rev!,
        this.#replText_a!,
      );
    }

    if (txt_x === undefined) {
      this.#replFRan = true;
    } else {
      if (this.aoa) {
        this.#replText_a2_0 ??= this.#replText_a2!.slice();

        for (let i = this.#ranval_rev_a!.length; i--;) {
          this.#ranval_a![i].becomeArray(this.#ranval_rev_a![i]);
        }
      } else {
        this.#replText_a_0 ??= this.#replText_a!.slice();

        this.#ranval!.becomeArray(this.#ranval_rev!);
      }
      /* ..., then could continue to `this.replFRun(txt_x)` */

      // this.#replText_a = replText_a_save!; // For keeping `replBRun()` correct
      // console.log(this.#replText_a);
    }
  }

  /** Assign `#ranval`, `#text_a` */
  replBRun() {
    if (this.aoa) {
      this._impl(
        this.#ranval_rev_a!,
        this.#replText_a2_0 ?? this.#replText_a2!,
        this.#ranval_a!,
        this.#text_a2!,
      );
    } else {
      this._impl(
        this.#ranval_rev!,
        this.#replText_a_0 ?? this.#replText_a!,
        this.#ranval!,
        this.#text_a!,
      );
    }
  }
}
/*80--------------------------------------------------------------------------*/
