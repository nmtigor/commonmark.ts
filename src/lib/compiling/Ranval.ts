/** 80**************************************************************************
 * @module lib/compiling/Ranval
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { PRF } from "../../global.ts";
import { Moo, type MooEq } from "../Moo.ts";
import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { Factory } from "../util/Factory.ts";
import type { Bufr } from "./Bufr.ts";
import type { Loc } from "./Loc.ts";
import { g_ran_fac, type Ran } from "./Ran.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Ranval extends Array<lnum_t | loff_t> {
  /* Adding `id` needs to change comparisons in "Repl_test.ts" correspondingly. */
  // static #ID = 0 as id_t;
  // readonly id = ++Ranval.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // override readonly length = 4; // TypeError: Cannot redefine property: length

  get focusLidx() {
    return this[0] as lnum_t;
  }
  set focusLidx(_x: lnum_t) {
    this[0] = _x;
  }
  get focusLoff() {
    return this[1];
  }
  set focusLoff(_x: loff_t) {
    this[1] = _x;
  }
  get anchrLidx() {
    return this[2] as lnum_t;
  }
  set anchrLidx(_x: lnum_t) {
    this[2] = _x;
  }
  get anchrLoff() {
    return this[3];
  }
  set anchrLoff(_x: loff_t) {
    this[3] = _x;
  }

  constructor(_2: lnum_t, _3: loff_t, _0?: lnum_t, _1?: loff_t) {
    super(4);

    this.setRanval(_2, _3, _0, _1);
  }

  setRanval(_2: lnum_t, _3: loff_t, _0?: lnum_t, _1?: loff_t): this {
    this[2] = _2;
    this[3] = _3;
    this[0] = _0 === undefined ? _2 : _0;
    this[1] = _1 === undefined ? _3 : _1;
    return this;
  }
  /** @primaryconst @param ran_x */
  setByRan(ran_x: Ran): this {
    return this.setRanval(
      ran_x.frstLine.lidx_1,
      ran_x.strtLoff,
      ran_x.lastLine.lidx_1,
      ran_x.stopLoff,
    );
  }
  /** @primaryconst @param loc_x */
  setFocus(loc_x: Loc, collapse_x?: "collapse"): this {
    this[0] = loc_x.line_$.lidx_1;
    this[1] = loc_x.loff_$;
    if (collapse_x) this.collapseToFocus();
    return this;
  }
  /** @primaryconst @param loc_x */
  setAnchr(loc_x: Loc, collapse_x?: "collapse"): this {
    this[2] = loc_x.line_$.lidx_1;
    this[3] = loc_x.loff_$;
    if (collapse_x) this.collapseToAnchr();
    return this;
  }

  /** @const */
  dup() {
    return new Ranval(this[2] as lnum_t, this[3], this[0] as lnum_t, this[1]);
  }

  [Symbol.dispose]() {
    g_ranval_fac.revoke(this);
  }

  /**
   * @final
   * @const
   */
  usingDup() {
    return g_ranval_fac.oneMore().becomeArray(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  get order(): -1 | 0 | 1 {
    if (this[0] > this[2]) return 1;
    if (this[0] < this[2]) return -1;
    if (this[1] > this[3]) return 1;
    if (this[1] < this[3]) return -1;
    return 0;
  }
  /** @const */
  get collapsed() {
    return this.order === 0;
  }

  collapseToFocus(): this {
    this[2] = this[0];
    this[3] = this[1];
    return this;
  }
  collapseToAnchr(): this {
    this[0] = this[2];
    this[1] = this[3];
    return this;
  }
  collapseToHead(): this {
    return this.order > 0 ? this.collapseToFocus() : this.collapseToAnchr();
  }
  collapseToTail(): this {
    return this.order < 0 ? this.collapseToFocus() : this.collapseToAnchr();
  }

  override reverse(): this {
    let t_ = this[0];
    this[0] = this[2];
    this[2] = t_;
    t_ = this[1];
    this[1] = this[3];
    this[3] = t_;
    return this;
  }

  /** @headconst @param bufr_x  */
  getTextFrom(bufr_x: Bufr) {
    using ran_u = g_ran_fac.setBufr(bufr_x).oneMore().setByRanval(this);
    return ran_u.getText();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    return this.collapsed
      ? `[${this[2]}-${this[3]})`
      : `[${this[2]}-${this[3]},${this[0]}-${this[1]})`;
  }
}
/*64----------------------------------------------------------*/

const ranvalEq_: MooEq<Ranval> = (a, b) =>
  a === b || a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

export class RanvalMo extends Moo<Ranval> {
  constructor(ranval_x?: Ranval) {
    super({ val: ranval_x ?? new Ranval(0 as lnum_t, 0), eq_: ranvalEq_ });
  }
}
/*64----------------------------------------------------------*/

// export class SortedRanval extends SortedArray<Ranval> {
//   static #less: Less<Ranval> = (a_x, b_x) => {
//     if (a_x.nonnegativ) {
//       if (b_x.nonnegativ) {
//         return a_x[0] < b_x[2] || a_x[0] === b_x[2] && a_x[1] < b_x[3];
//       } else {
//         return a_x[0] < b_x[0] || a_x[0] === b_x[0] && a_x[1] < b_x[1];
//       }
//     } else {
//       if (b_x.nonnegativ) {
//         return a_x[2] < b_x[2] || a_x[2] === b_x[2] && a_x[3] < b_x[3];
//       } else {
//         return a_x[2] < b_x[0] || a_x[2] === b_x[0] && a_x[3] < b_x[1];
//       }
//     }
//   };

//   constructor(val_a_x?: Ranval[]) {
//     super(SortedRanval.#less, val_a_x);
//   }
// }
/*64----------------------------------------------------------*/

class RanvalFac_ extends Factory<Ranval> {
  /** @implement */
  protected createVal$() {
    /*#static*/ if (PRF) {
      console.log(
        `%c# of cached Ranval instances: ${this.val_a$.length + 1}`,
        `color:${LOG_cssc.performance}`,
      );
    }
    return new Ranval(0 as lnum_t, 0);
  }
}
export const g_ranval_fac = new RanvalFac_();
/*80--------------------------------------------------------------------------*/
