/** 80**************************************************************************
 * @module lib/compiling/Ran
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT, PRF } from "../../preNs.ts";
import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { Endpt } from "../alias.ts";
import { assert, out, space } from "../util.ts";
import { g_count } from "../util/performance.ts";
import type { Bufr } from "./Bufr.ts";
import type { Line } from "./Line.ts";
import { Loc } from "./Loc.ts";
import { g_ran_fac } from "./RanFac.ts";
import { g_ranval_fac, Ranval } from "./Ranval.ts";
/*80--------------------------------------------------------------------------*/

/** @see {@linkcode Ran.calcRanp()} */
export const enum Ranp {
  unknown = 0b0_000_0001,

  /** ( ... ) */
  inOldRan = 0b0_000_0010,
  /** [ ... ] */
  frstLineBefor = 0b0_000_0100,
  /** [ ... */
  lastLineAfter = 0b0_000_1000,
  ranLinesBefor = 0b0_001_0000,
  ranLinesAfter = 0b0_010_0000,

  known = 0b0_100_0000,
}
//jjjj TOCLEANUP
// export const RanP_unstable = Ranp.inOldRan | Ranp.lastLineAfter |
//   Ranp.ranLinesAfter;

type RanpData_ =
  | [Ranp.unknown | Ranp.known, 0]
  | [Ranp.inOldRan, -1]
  | [Ranp.frstLineBefor | Ranp.lastLineAfter, loff_t]
  | [Ranp.ranLinesBefor | Ranp.ranLinesAfter, lnum_t];

export type Ranpo = { anchr: RanpData_; focus: RanpData_ };
/*64----------------------------------------------------------*/

/** */
export class Ran {
  static #ID = 0 as id_t;
  readonly id = ++Ran.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* #ranval */
  #ranval = new Ranval(0 as lnum_t, 0);
  get ranval() {
    return this.#ranval;
  }
  syncRanvalAnchr_$(): void {
    this.#ranval.anchrLidx = this.frstLine.lidx_1;
    this.#ranval.anchrLoff = this.strtLoff;
  }
  syncRanvalFocus_$(): void {
    this.#ranval.focusLidx = this.lastLine.lidx_1;
    this.#ranval.focusLoff = this.stopLoff;
  }
  syncRanval_$(): void {
    this.syncRanvalAnchr_$();
    this.syncRanvalFocus_$();
  }
  /* ~ */

  /* strtLoc$ */
  protected strtLoc$!: Loc;
  get strtLoc() {
    return this.strtLoc$;
  }
  get frstLine() {
    return this.strtLoc$.line;
  }
  get strtLoff() {
    return this.strtLoc$.loff_$;
  }
  /* ~ */

  /* stopLoc$ */
  protected stopLoc$!: Loc;
  get stopLoc() {
    return this.stopLoc$;
  }
  get lastLine() {
    return this.stopLoc$.line;
  }
  get stopLoff() {
    return this.stopLoc$.loff_$;
  }
  /* ~ */

  get bufr() {
    return this.strtLoc$.bufr;
  }

  //jjjj TOCLEANUP
  // /* #ranpo */
  // /** ranp and offs */
  // #ranpo?: { anchr: RanpData_; focus: RanpData_ };
  // private get _ranpo() {
  //   return this.#ranpo ??= {
  //     anchr: [Ranp.unknown, 0],
  //     focus: [Ranp.unknown, 0],
  //   };
  // }

  // get ranpoAnchr(): RanpData_ {
  //   return this._ranpo.anchr;
  // }
  // // setRanpoAnchr(ranpA_x: Ranp, offsA_x: loff_t | lnum_t): void {
  // //   this._ranpo.anchr[0] = ranpA_x;
  // //   this._ranpo.anchr[1] = offsA_x;
  // // }

  // get ranpoFocus(): RanpData_ {
  //   return this._ranpo.focus;
  // }
  // // setRanpoFocus(ranpF_x: Ranp, offsF_x: loff_t | lnum_t): void {
  // //   this._ranpo.focus[0] = ranpF_x;
  // //   this._ranpo.focus[1] = offsF_x;
  // // }

  // setRanpo(
  //   ranpA_x: Ranp,
  //   offsA_x: loff_t | lnum_t,
  //   ranpF_x?: Ranp,
  //   offsF_x?: loff_t | lnum_t,
  // ): void {
  //   this._ranpo.anchr[0] = ranpA_x;
  //   this._ranpo.anchr[1] = offsA_x;
  //   if (ranpF_x === undefined || offsF_x === undefined) {
  //     this._ranpo.focus[0] = ranpA_x;
  //     this._ranpo.focus[1] = offsA_x;
  //   } else {
  //     this._ranpo.focus[0] = ranpF_x;
  //     this._ranpo.focus[1] = offsF_x;
  //   }
  // }
  // /* ~ */

  /**
   * @headmove @primaryconst @param loc_x
   * @headmove @param loc_1_x
   */
  constructor(loc_x: Loc, loc_1_x?: Loc) {
    this.set_Ran(loc_x, loc_1_x);

    /*#static*/ if (PRF) {
      g_count.newRan += 1;
    }
  }
  /**
   * @headconst @param bufr_x
   * @const @param rv_x
   */
  static create(bufr_x: Bufr, rv_x?: Ranval) {
    if (rv_x) {
      return new Ran(
        Loc.create(bufr_x, rv_x.anchrLidx, rv_x.anchrLoff),
        Loc.create(bufr_x, rv_x.focusLidx, rv_x.focusLoff),
      );
    } else {
      using rv_u = g_ranval_fac.oneMore().setRanval(0 as lnum_t, 0);
      return new Ran(
        Loc.create(bufr_x, rv_u.anchrLidx, rv_u.anchrLoff),
        Loc.create(bufr_x, rv_u.focusLidx, rv_u.focusLoff),
      );
    }
  }

  /** @const */
  dup_Ran() {
    return new Ran(this.strtLoc.dup_Loc(), this.stopLoc.dup_Loc());
  }

  reset_Ran(bufr_x?: Bufr): this {
    bufr_x ??= this.bufr;
    /*#static*/ if (INOUT) {
      assert(bufr_x);
    }
    this.strtLoc$.set_Loc(bufr_x!.frstLine_$, 0);
    this.stopLoc$.set_Loc(bufr_x!.frstLine_$, 0);
    return this;
  }

  /**
   * @headmove @primaryconst @param loc_x
   * @headmove @param loc_1_x
   */
  @out((self: Ran) => {
    assert(
      self.strtLoc$ && self.stopLoc$ &&
        self.strtLoc$ !== self.stopLoc$ &&
        self.strtLoc$.posSE(self.stopLoc$),
    );
  })
  set_Ran(loc_x: Loc, loc_1_x?: Loc): this {
    loc_1_x ??= loc_x.dup_Loc();
    if (loc_x.posSE(loc_1_x)) {
      this.strtLoc$ = loc_x;
      this.stopLoc$ = loc_1_x;
    } else {
      this.strtLoc$ = loc_1_x;
      this.stopLoc$ = loc_x;
    }
    // this.syncRanval_$();
    return this;
  }
  ord(): this {
    return this.set_Ran(this.strtLoc$, this.stopLoc$);
  }

  /**
   * @final
   * @const @param rv_x
   */
  setByRanval(rv_x: Ranval): this {
    this.strtLoc$.set_Loc_O(rv_x.anchrLidx, rv_x.anchrLoff);
    this.stopLoc$.set_Loc_O(rv_x.focusLidx, rv_x.focusLoff);
    return this.ord();
  }

  /**
   * @final
   * @const @param ran_x
   */
  become_Ran(ran_x: Ran): this {
    this.strtLoc$.become_Loc(ran_x.strtLoc$);
    this.stopLoc$.become_Loc(ran_x.stopLoc$);

    // this.syncRanval_$();

    return this;
  }

  [Symbol.dispose]() {
    g_ran_fac.revoke(this);
  }

  /**
   * `in( this.bufr)`
   * @final
   * @const
   */
  usingDup() {
    return g_ran_fac.setBufr(this.bufr!).oneMore().become_Ran(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  get collapsed(): boolean {
    return this.strtLoc$.posE(this.stopLoc$);
  }

  /** Change `strtLoc$`, keep `stopLoc$` */
  collapse(): this {
    this.strtLoc$.become_Loc(this.stopLoc$);

    // this.syncRanval_$();

    return this;
  }

  /**
   * ! Do not `strtLoc$.correct()` or `stopLoc$.correct()`
   */
  get length_1(): loff_t {
    let ln = this.frstLine;
    const ln_1 = this.lastLine;
    if (ln === ln_1) return this.stopLoff - this.strtLoff;

    let ret = ln.uchrLen - this.strtLoff;
    const VALVE = 1_000;
    let valve = VALVE;
    while (ln.nextLine !== ln_1 && --valve) {
      ln = ln.nextLine!;
      ret += ln.uchrLen;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    ret += this.stopLoff;
    return ret;
  }

  get lineN_1(): lnum_t {
    return (this.lastLine.lidx_1 - this.frstLine.lidx_1 + 1) as lnum_t;
  }

  /**
   * @primaryconst
   * @primaryconst @param rhs_x
   */
  posS(rhs_x: Ran): boolean {
    return this !== rhs_x && this.stopLoc$.posSE(rhs_x.strtLoc$);
  }
  /**
   * @const
   * @const @param rhs_x
   */
  posE(rhs_x: Ran): boolean {
    return this === rhs_x ||
      this.strtLoc$.posE(rhs_x.strtLoc$) && this.stopLoc$.posE(rhs_x.stopLoc$);
  }

  /**
   * @primaryconst
   * @primaryconst @param loc_x
   */
  contain(loc_x: Loc): boolean {
    return this.strtLoc$.posSE(loc_x) && loc_x.posS(this.stopLoc$);
  }
  /** @see {@linkcode contain()} */
  touch(loc_x: Loc): boolean {
    return this.contain(loc_x) || this.stopLoc$.posE(loc_x);
  }

  /**
   * @const
   *  ! Notice, if `text` get non-const-wise overloaded (e.g. TLine.text),
   *  then this is not no more const. \
   *  If `text` is non-const-wise overloaded, should also overload this without
   *  "@const".
   */
  getTexta(): string[] {
    const ret: string[] = [];

    let ln_: Line | undefined = this.frstLine;
    const ln_1 = this.lastLine;
    let loff_0 = this.strtLoff;
    const loff_1 = this.stopLoff;
    let tabtail = "", tabhead = "";
    if (this.strtLoc$.part) {
      tabtail = space(this.strtLoc$.tabtail);
      ++loff_0;
    }
    if (this.stopLoc$.part) {
      tabhead = space(this.stopLoc$.tabhead);
    }
    if (ln_ === ln_1) {
      ret.push(tabtail + ln_.text.slice(loff_0, loff_1) + tabhead);
    } else {
      ret.push(tabtail + ln_.text.slice(loff_0));
      ln_ = ln_.nextLine;
      const VALVE = 1_000;
      let valve = VALVE;
      while (ln_ && ln_ !== ln_1 && --valve) {
        ret.push(ln_.text);
        ln_ = ln_.nextLine;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
      /*#static*/ if (INOUT) {
        assert(ln_);
      }
      ret.push(ln_!.text.slice(0, loff_1) + tabhead);
    }

    return ret;
  }
  /** @const */
  getText() {
    return this.getTexta().join("\n");
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @primaryconst
   * @const @param lidx_x
   * @const @param loff_x
   * @out @param out_x
   */
  calcRanp(lidx_x: lnum_t, loff_x: loff_t, out_x: RanpData_): void {
    let ranp = Ranp.unknown;
    let offs: loff_t | lnum_t = 0;
    if (this.lastLine.lidx_1 === lidx_x && this.stopLoff <= loff_x) {
      ranp = Ranp.lastLineAfter;
      offs = loff_x - this.stopLoff;
    } else if (this.frstLine.lidx_1 === lidx_x && loff_x <= this.strtLoff) {
      ranp = Ranp.frstLineBefor;
      offs = loff_x;
    } else if (lidx_x < this.frstLine.lidx_1) {
      ranp = Ranp.ranLinesBefor;
      offs = lidx_x;
    } else if (this.lastLine.lidx_1 < lidx_x) {
      ranp = Ranp.ranLinesAfter;
      offs = lidx_x - this.lastLine.lidx_1;
    } else {
      ranp = Ranp.inOldRan;
      offs = -1;
    }
    out_x[0] = ranp;
    out_x[1] = offs;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @out @param ret_x */
  toRanval(ret_x?: Ranval): Ranval {
    ret_x = this.strtLoc$.toRanval(ret_x, Endpt.anchr);
    this.stopLoc$.toRanval(ret_x, Endpt.focus);
    return ret_x;
  }
  get _rv() {
    return this.toRanval();
  }

  /** For testing only */
  toString() {
    return this.collapsed
      ? `[${this.strtLoc$.toString()})`
      : `[${this.strtLoc$.toString()},${this.stopLoc$.toString()})`;
  }
}
/*64----------------------------------------------------------*/

// export class SortedRan extends SortedArray<Ran> {
//   static #less: Less<Ran> = (a, b) => a.stopLoc.posS(b.strtLoc);

//   constructor(val_a_x?: Ran[]) {
//     super(SortedRan.#less, val_a_x);
//   }
// }
/*80--------------------------------------------------------------------------*/
