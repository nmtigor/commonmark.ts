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

export abstract class Tfmr {
  static #ID = 0 as id_t;
  /** @final */
  readonly id = ++Tfmr.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

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
  get _curTSeg() {
    return this.curTSeg$;
  }
  get _stopTSeg() {
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
  #adjustStrtTSeg = false;
  #adjustStopTSeg = false;

  /** @headconst @param bufr_x */
  constructor(bufr_x: Bufr) {
    this.resetTfmr(bufr_x);
  }

  /**
   * ! if( tbufr_x ), it must already be correctly `tfm()`ed.
   * @final
   * @headconst @param bufr_x
   */
  resetTfmr(bufr_x?: Bufr, tbufr_x?: TBufr) {
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
    this.curTSeg$ = undefined;
    this.stopTSeg$ = this.curTSeg$;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @headconst @param oldRan_x
   */
  @traceOut(_TRACE)
  @out((_, self: Tfmr) => {
    assert(
      !self.curTSeg$ || !self.stopTSeg$ || self.curTSeg$.posS(self.stopTSeg$),
    );
  })
  markTfmRegion_$(oldRan_x: Ran) {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.markTfmRegion_$(${oldRan_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(oldRan_x.bufr === this.bufr$);
    }
    if (!this.curTSeg$ && !this.stopTSeg$) return;
    this.#oldStopLoff = oldRan_x.stopLoff;

    const regressed = this.curTSeg$ === this.stopTSeg$;

    const strtLoc_1 = oldRan_x.strtLoc;
    if (
      regressed || this.curTSeg$ && strtLoc_1.posS(this.curTSeg$.stopLoc)
    ) {
      /* reset `curTSeg$` */
      let ln_ = oldRan_x.frstLine;
      let tseg = ln_.strtTSeg_$(this);
      while (!tseg || strtLoc_1.posS(tseg.stopLoc)) {
        if (ln_.isFrstLine) {
          tseg = undefined;
          break;
        }

        ln_ = ln_.prevLine!;
        tseg = ln_.strtTSeg_$(this);
      }
      if (tseg) {
        /*#static*/ if (INOUT) {
          assert(tseg.stopLoc.posSE(strtLoc_1));
        }
        while (tseg.nextTSeg_$?.stopLoc.posSE(strtLoc_1)) {
          tseg = tseg.nextTSeg_$;
        }
      }

      this.curTSeg$ = tseg;
    }

    const stopLoc_0 = oldRan_x.stopLoc;
    if (regressed || this.stopTSeg$ && stopLoc_0.posG(this.stopTSeg$.strtLoc)) {
      /* reset `stopTSeg$` */
      let ln_ = oldRan_x.lastLine;
      let tseg = ln_.stopTSeg_$(this);
      while (!tseg || stopLoc_0.posG(tseg.strtLoc)) {
        if (ln_.isLastLine) {
          tseg = undefined;
          break;
        }

        ln_ = ln_.nextLine!;
        tseg = ln_.stopTSeg_$(this);
      }
      if (tseg) {
        /*#static*/ if (INOUT) {
          assert(stopLoc_0.posSE(tseg.strtLoc));
        }
        while (tseg.prevTSeg_$?.strtLoc.posGE(stopLoc_0)) {
          tseg = tseg.prevTSeg_$;
        }
      }

      this.stopTSeg$ = tseg;
    }

    this.#adjustStrtTSeg = oldRan_x.frstLine === this.curTSeg$?.line;
    this.#adjustStopTSeg = oldRan_x.lastLine === this.stopTSeg$?.line;
  }

  /**
   * @final
   * @headconst @param newRan_x is the `outran` of `Repl.#repl_impl()`
   */
  @traceOut(_TRACE)
  adjust_$(newRan_x: Ran): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.adjust_$(${newRan_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(newRan_x.bufr === this.bufr$);
    }
    if (!this.curTSeg$ && !this.stopTSeg$) return this;

    if (this.#adjustStrtTSeg) {
      const strtLn_src = this.curTSeg$!.line;
      const strtLn_tgt = newRan_x.frstLine;
      if (strtLn_src !== strtLn_tgt) {
        let tseg: TSeg | undefined = this.curTSeg$!;
        do {
          tseg.line_$ = strtLn_tgt;

          if (strtLn_src.isStrtByTSeg_$(tseg)) {
            strtLn_tgt.strtByTSeg_$(tseg);
            strtLn_src.delStrtTSeg_$(this);
          }
          if (strtLn_src.isStopByTSeg_$(tseg)) {
            strtLn_tgt.stopByTSeg_$(tseg);
            strtLn_src.delStopTSeg_$(this);
          }

          tseg = tseg.prevTSeg_$;
        } while (tseg?.line === strtLn_src);
      }
    }

    if (this.#adjustStopTSeg) {
      const stopLn_src = this.stopTSeg$!.line;
      const stopLn_tgt = newRan_x.lastLine;
      const dtLoff = (newRan_x.stopLoff - this.#oldStopLoff) as ldt_t;
      if (stopLn_src !== stopLn_tgt || dtLoff !== 0) {
        let tseg: TSeg | undefined = this.stopTSeg$!;
        do {
          tseg.strtLoc.setLoc(stopLn_tgt, tseg.strtLoff + dtLoff);
          tseg.stopLoc.setLoc(stopLn_tgt, tseg.stopLoff + dtLoff);

          if (stopLn_src !== stopLn_tgt) {
            if (stopLn_src.isStrtByTSeg_$(tseg)) {
              stopLn_tgt.strtByTSeg_$(tseg);
              stopLn_src.delStrtTSeg_$(this);
            }
            if (stopLn_src.isStopByTSeg_$(tseg)) {
              stopLn_tgt.stopByTSeg_$(tseg);
              stopLn_src.delStopTSeg_$(this);
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
  reachRigtBdry(): boolean {
    return this.curTSeg$!.posGE(this.stopTSeg$!);
  }

  /** @final */
  @traceOut(_TRACE)
  @out((_, self: Tfmr) => {
    assert(self.curTSeg$ === self.stopTSeg$);
  })
  tfm() {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.tfm() >>>>>>>`);
    }
    if (!this.curTSeg$ || !this.stopTSeg$ || !this.reachRigtBdry()) {
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
