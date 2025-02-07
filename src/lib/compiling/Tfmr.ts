/** 80**************************************************************************
 * Typically for searching
 *
 * @module lib/compiling/Tfmr
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, ldt_t, loff_t } from "../alias.ts";
import { assert, out, traceOut } from "../util/trace.ts";
import { Bufr } from "./Bufr.ts";
import { Ran } from "./Ran.ts";
import { TBufr } from "./TBufr.ts";
import { TSeg, TSegFac } from "./TSeg.ts";
/*80--------------------------------------------------------------------------*/

//kkkk lazy to optimize loading speed
export abstract class Tfmr {
  static #ID = 0 as id_t;
  /** @final */
  readonly id = ++Tfmr.#ID as id_t;
  /** @final */
  get _type_id_() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected bufr$!: Bufr;
  get bufr() {
    return this.bufr$;
  }

  protected tbufr$!: TBufr;
  get tbufr() {
    return this.tbufr$;
  }

  protected tseg_fac$!: TSegFac;
  get tseg_fac() {
    return this.tseg_fac$;
  }

  protected curTSeg$: TSeg | undefined;
  protected stopTSeg$: TSeg | undefined;
  get _curTSeg_() {
    return this.curTSeg$;
  }
  get _stopTSeg_() {
    return this.stopTSeg$;
  }
  /** @deprecated */
  _noStrtTSeg() {
    console.assert(this.curTSeg$ === undefined);
  }
  /** @deprecated */
  _noStopTSeg() {
    console.assert(this.stopTSeg$ === undefined);
  }

  #oldStopLoff: loff_t = 0;
  #adjStrtTSeg = false;
  #adjStopTSeg = false;

  /** @headconst @param bufr_x */
  constructor(bufr_x: Bufr) {
    this.reset_Tfmr(bufr_x);
  }

  /**
   * ! if( tbufr_x ), it must already be correctly `tfm()`ed.
   * @final
   * @headconst @param bufr_x
   */
  reset_Tfmr(bufr_x?: Bufr, tbufr_x?: TBufr) {
    if (bufr_x) this.bufr$ = bufr_x;
    this.tbufr$ = tbufr_x ?? new TBufr(this.bufr$);

    if (this.tseg_fac$) {
      this.tseg_fac$.setTSegFac(this, "hard");
    } else {
      this.tseg_fac$ = new TSegFac(this);
    }

    // const ln_ = bufr_x.frstNonemptyLine();
    // if (ln_) {
    //   this.curTSeg$ = this.tseg_fac$.oneMore()
    //     .map(ln_.lidx_1, 0, 0, 0, ln_.uchrLen);
    // } else {
    //   this.curTSeg$ = undefined;
    // }
    this.stopTSeg$ = this.curTSeg$ = undefined;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Mark tfm region
   *
   * @final
   * @headconst @param oldRan_a_x
   */
  @traceOut(_TRACE)
  @out((self: Tfmr) => {
    assert(
      !self.curTSeg$ || !self.stopTSeg$ || self.curTSeg$.posS(self.stopTSeg$),
    );
  })
  tfmmrk_$(oldRan_a_x: Ran[]): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id_}.tfmmrk_$(${oldRan_a_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(oldRan_a_x.length && oldRan_a_x[0].bufr === this.bufr$);
    }
    if (!this.curTSeg$ && !this.stopTSeg$) return this;

    const oldRan_0 = oldRan_a_x[0];
    const oldRan_1 = oldRan_a_x.at(-1)!;

    this.#oldStopLoff = oldRan_1.stopLoff;

    const regressed = this.curTSeg$ === this.stopTSeg$;

    const strtLoc_ = oldRan_0.strtLoc;
    if (regressed || this.curTSeg$ && strtLoc_.posS(this.curTSeg$.stopLoc)) {
      /* reset `curTSeg$` */
      let ln_ = oldRan_0.frstLine;
      let tseg = ln_.frstTSeg_$(this);
      while (!tseg || strtLoc_.posS(tseg.stopLoc)) {
        if (ln_.isFrstLine) {
          tseg = undefined;
          break;
        }

        ln_ = ln_.prevLine!;
        tseg = ln_.frstTSeg_$(this);
      }
      if (tseg) {
        /*#static*/ if (INOUT) {
          assert(tseg.stopLoc.posSE(strtLoc_));
        }
        while (tseg.nextTSeg_$?.stopLoc.posSE(strtLoc_)) {
          tseg = tseg.nextTSeg_$;
        }
      }

      this.curTSeg$ = tseg;
    }

    const stopLoc_ = oldRan_1.stopLoc;
    if (regressed || this.stopTSeg$ && stopLoc_.posG(this.stopTSeg$.strtLoc)) {
      /* reset `stopTSeg$` */
      let ln_ = oldRan_1.lastLine;
      let tseg = ln_.lastTSeg_$(this);
      while (!tseg || stopLoc_.posG(tseg.strtLoc)) {
        if (ln_.isLastLine) {
          tseg = undefined;
          break;
        }

        ln_ = ln_.nextLine!;
        tseg = ln_.lastTSeg_$(this);
      }
      if (tseg) {
        /*#static*/ if (INOUT) {
          assert(stopLoc_.posSE(tseg.strtLoc));
        }
        while (tseg.prevTSeg_$?.strtLoc.posGE(stopLoc_)) {
          tseg = tseg.prevTSeg_$;
        }
      }

      this.stopTSeg$ = tseg;
    }

    this.#adjStrtTSeg = this.curTSeg$?.line === oldRan_0.frstLine;
    this.#adjStopTSeg = oldRan_1.lastLine === this.stopTSeg$?.line;

    return this;
  }

  /**
   * Adjust tfm region
   *
   * @final
   * @headconst @param newRan_a_x
   */
  @traceOut(_TRACE)
  tfmadj_$(newRan_a_x: Ran[]): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id_}.tfmadj_$(${newRan_a_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(newRan_a_x.length && newRan_a_x[0].bufr === this.bufr$);
    }
    if (!this.curTSeg$ && !this.stopTSeg$) return this;

    const newRan_0 = newRan_a_x[0];
    const newRan_1 = newRan_a_x.at(-1)!;
    const strtLn_tgt = newRan_0.frstLine;
    const stopLn_tgt = newRan_1.lastLine;
    if (this.#adjStrtTSeg) {
      const strtLn_src = this.curTSeg$!.line;
      if (strtLn_src !== strtLn_tgt) {
        let tseg: TSeg | undefined = this.curTSeg$!;
        do {
          tseg.line_$ = strtLn_tgt;

          if (strtLn_src.isFrstByTSeg_$(tseg)) {
            strtLn_tgt.frstByTSeg_$(tseg);
            strtLn_src.delFrstTSeg_$(this);
          }
          if (strtLn_src.isLastByTSeg_$(tseg)) {
            strtLn_tgt.lastByTSeg_$(tseg);
            strtLn_src.delLastTSeg_$(this);
          }

          tseg = tseg.prevTSeg_$;
        } while (tseg?.line === strtLn_src);
      }
    }

    if (this.#adjStopTSeg) {
      const stopLn_src = this.stopTSeg$!.line;
      const dtLoff = (newRan_1.stopLoff - this.#oldStopLoff) as ldt_t;
      if (stopLn_src !== stopLn_tgt || dtLoff !== 0) {
        let tseg: TSeg | undefined = this.stopTSeg$!;
        do {
          tseg.strtLoc.set_Loc(stopLn_tgt, tseg.strtLoff + dtLoff);
          tseg.stopLoc.set_Loc(stopLn_tgt, tseg.stopLoff + dtLoff);

          if (stopLn_src !== stopLn_tgt) {
            if (stopLn_src.isFrstByTSeg_$(tseg)) {
              stopLn_tgt.frstByTSeg_$(tseg);
              stopLn_src.delFrstTSeg_$(this);
            }
            if (stopLn_src.isLastByTSeg_$(tseg)) {
              stopLn_tgt.lastByTSeg_$(tseg);
              stopLn_src.delLastTSeg_$(this);
            }
          }

          tseg = tseg.nextTSeg_$;
        } while (tseg?.line === stopLn_src);
      }
    }

    return this;
  }

  /**
   * `in( this.curTSeg$ && this.stopTSeg$ )`
   * @final
   */
  protected reachTfmBdry$(): boolean {
    return this.curTSeg$!.posGE(this.stopTSeg$!);
  }

  /** @final */
  @traceOut(_TRACE)
  @out((self: Tfmr) => {
    assert(self.curTSeg$ === self.stopTSeg$);
  })
  tfm(): void {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id_}.tfm() >>>>>>>`);
    }
    /* llll review similarly as `Lexr.lex()`  */
    if (!this.curTSeg$ || !this.stopTSeg$ || !this.reachTfmBdry$()) {
      this.tfm_impl$();
    }
    this.tseg_fac$.gcWith((tseg_y) => !tseg_y.valid);
  }

  /**
   * `in( !this.curTSeg$ || !this.stopTSeg$ ||
   *    this.curTSeg$.posSE(this.stopTSeg$) )`
   */
  protected abstract tfm_impl$(): void;

  /**
   * jjjj useful?
   * @final
   */
  retfm() {
    this.curTSeg$ = this.stopTSeg$ = undefined; // Will suppress optimize in `TLine.splice_$()`.
    this.tfm();
  }
}
/*80--------------------------------------------------------------------------*/
