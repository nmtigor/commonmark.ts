/** 80**************************************************************************
 * @module lib/compiling/Ranval
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import type { lnum_t, loff_t } from "../alias.ts";
import { Moo, type MooEq } from "../Moo.ts";
import { Factory } from "../util/Factory.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Ranval extends Array<lnum_t | loff_t> {
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

    this.reset(_2, _3, _0, _1);
  }

  reset(_2: lnum_t, _3: loff_t, _0?: lnum_t, _1?: loff_t) {
    this[2] = _2;
    this[3] = _3;
    this[0] = _0 === undefined ? _2 : _0;
    this[1] = _1 === undefined ? _3 : _1;
    return this;
  }

  /** @const */
  dup() {
    return new Ranval(this[2] as lnum_t, this[3], this[0] as lnum_t, this[1]);
  }

  [Symbol.dispose]() {
    ranval_fac.revoke(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  get collapsed() {
    return this[0] === this[2] && this[1] === this[3];
  }

  collapseToFocus() {
    this[2] = this[0];
    this[3] = this[1];
  }
  collapseToAnchr() {
    this[0] = this[2];
    this[1] = this[3];
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
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    return this.collapsed
      ? `[${this[0]}-${this[1]})`
      : `[${this[2]}-${this[3]},${this[0]}-${this[1]})`;
  }
}

const ranvalEq_: MooEq<Ranval> = (a, b) =>
  a === b || a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
export class RanvalMo extends Moo<Ranval> {
  constructor(ranval_x?: Ranval) {
    super({ val: ranval_x ?? new Ranval(0 as lnum_t, 0), eq_: ranvalEq_ });
  }
}
/*64----------------------------------------------------------*/

class RanvalFac_ extends Factory<Ranval> {
  /** @implement */
  protected createVal$() {
    console.log(
      `%c# of cached Ranval instances: ${this.val_a$.length + 1}`,
      `color:${LOG_cssc.performance}`,
    );
    return new Ranval(0 as lnum_t, 0);
  }
}
export const ranval_fac = new RanvalFac_();
/*80--------------------------------------------------------------------------*/
