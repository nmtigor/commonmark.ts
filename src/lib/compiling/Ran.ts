/** 80**************************************************************************
 * @module lib/compiling/TokRan
 * @license BSD-3-Clause
 ******************************************************************************/

import { type Less, SortedArray } from "../util/SortedArray.ts";
import { DEV, INOUT, PRF } from "../../global.ts";
import type { id_t, lnum_t, loff_t, uint } from "../alias.ts";
import { space } from "../util/global.ts";
import { assert, out } from "../util/trace.ts";
import type { Bufr } from "./Bufr.ts";
import type { Line } from "./Line.ts";
import { Loc } from "./Loc.ts";
import { Ranval } from "./Ranval.ts";
import { Factory } from "../util/Factory.ts";
import { LOG_cssc } from "../../alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * @see {@linkcode Ran.calcRanP()}
 */
export const enum RanP {
  unknown = 1,
  /** ( ... ) */
  inOldRan,
  /** [ ... ] */
  frstLineBefor,
  /** [ ... */
  lastLineAfter,
  ranLinesBefor,
  ranLinesAfter,
}

type RanPData_ =
  | [RanP.unknown, 0]
  | [RanP.inOldRan, -1]
  | [RanP.frstLineBefor | RanP.lastLineAfter, loff_t]
  | [RanP.ranLinesBefor | RanP.ranLinesAfter, lnum_t];

/** */
export class Ran {
  static #ID = 0 as id_t;
  readonly id = ++Ran.#ID as id_t;

  /* #ranval */
  #ranval = new Ranval(0 as lnum_t, 0);
  get ranval() {
    return this.#ranval;
  }
  syncRanvalAnchr_$() {
    this.#ranval.anchrLidx = this.frstLine.lidx_1;
    this.#ranval.anchrLoff = this.strtLoff;
  }
  syncRanvalFocus_$() {
    this.#ranval.focusLidx = this.lastLine.lidx_1;
    this.#ranval.focusLoff = this.stopLoff;
  }
  syncRanval_$() {
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

  /**
   * @headconst @param loc_x [COPIED]
   * @param loc_1_x [COPIED]
   */
  constructor(loc_x: Loc, loc_1_x?: Loc) {
    this.set(loc_x, loc_1_x);
  }
  /**
   * @headconst @param bufr_x
   * @const @param rv_x
   */
  static create(bufr_x: Bufr, rv_x: Ranval) {
    return new Ran(
      Loc.create(bufr_x, rv_x.anchrLidx, rv_x.anchrLoff),
      Loc.create(bufr_x, rv_x.focusLidx, rv_x.focusLoff),
    );
  }

  /** @const */
  dup() {
    return new Ran(this.strtLoc.dup(), this.stopLoc.dup());
  }

  reset(bufr_x?: Bufr): this {
    bufr_x ??= this.bufr;
    /*#static*/ if (INOUT) {
      assert(bufr_x);
    }
    this.strtLoc$.set(bufr_x!.frstLine_$, 0);
    this.stopLoc$.set(bufr_x!.frstLine_$, 0);
    return this;
  }

  /**
   * @primaryconst @param loc_x [COPIED]
   * @param loc_1_x [COPIED]
   */
  @out((_, self: Ran) => {
    assert(
      self.strtLoc$ && self.stopLoc$ &&
        self.strtLoc$ !== self.stopLoc$ &&
        self.strtLoc$.posSE(self.stopLoc$),
    );
  })
  set(loc_x: Loc, loc_1_x?: Loc): this {
    loc_1_x ??= loc_x.dup();
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

  /**
   * @final
   * @headconst @param bufr_x
   * @const @param rv_x
   */
  setByRanval(bufr_x: Bufr, rv_x: Ranval): this {
    return this.set(
      Loc.create(bufr_x, rv_x.anchrLidx, rv_x.anchrLoff),
      Loc.create(bufr_x, rv_x.focusLidx, rv_x.focusLoff),
    );
  }

  /**
   * @final
   * @const @param ran_x
   */
  become(ran_x: Ran): this {
    this.strtLoc$.become(ran_x.strtLoc$);
    this.stopLoc$.become(ran_x.stopLoc$);

    // this.syncRanval_$();

    return this;
  }

  [Symbol.dispose]() {
    g_ran_fac.revoke(this);
  }

  /**
   * `in( this.bufr )`
   * @final
   * @const
   */
  using() {
    return g_ran_fac.setBufr(this.bufr!).oneMore().become(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  get collapsed(): boolean {
    return this.strtLoc$.posE(this.stopLoc$);
  }

  /**
   * Change `strtLoc$`, keep `stopLoc$`
   */
  collapse() {
    this.strtLoc$.become(this.stopLoc$);

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
   * @const @param lidx_x
   * @const @param loff_x
   */
  calcRanP(lidx_x: lnum_t, loff_x: loff_t): RanPData_ {
    let ranp = RanP.unknown;
    let offs: loff_t | lnum_t = 0;
    if (this.lastLine.lidx_1 === lidx_x && this.stopLoff <= loff_x) {
      ranp = RanP.lastLineAfter;
      offs = loff_x - this.stopLoff;
    } else if (this.frstLine.lidx_1 === lidx_x && loff_x <= this.strtLoff) {
      ranp = RanP.frstLineBefor;
      offs = loff_x;
    } else if (lidx_x < this.frstLine.lidx_1) {
      ranp = RanP.ranLinesBefor;
      offs = lidx_x;
    } else if (this.lastLine.lidx_1 < lidx_x) {
      ranp = RanP.ranLinesAfter;
      offs = lidx_x - this.lastLine.lidx_1;
    } else {
      ranp = RanP.inOldRan;
      offs = -1;
    }
    return [ranp, offs] as RanPData_;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @out @param ret_x
   */
  toRanval(ret_x?: Ranval): Ranval {
    ret_x = this.strtLoc$.toRanval(ret_x, 2);
    this.stopLoc$.toRanval(ret_x, 0);
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
/*64----------------------------------------------------------*/

class RanFac_ extends Factory<Ran> {
  #bufr!: Bufr;
  setBufr(_x: Bufr): this {
    this.#bufr = _x;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  protected createVal$() {
    /*#static*/ if (PRF) {
      console.log(
        `%c# of cached Ran instances: ${this.val_a$.length + 1}`,
        `color:${LOG_cssc.performance}`,
      );
    }
    return new Ran(new Loc(this.#bufr.frstLine_$, 0));
  }

  protected override reuseVal$(i_x: uint) {
    return this.get(i_x).reset(this.#bufr);
  }
}
export const g_ran_fac = new RanFac_();
/*80--------------------------------------------------------------------------*/
