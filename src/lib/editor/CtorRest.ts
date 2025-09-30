/** 80**************************************************************************
 * @module lib/editor/CtorRest
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../preNs.ts";
import type { loff_t } from "../alias.ts";
import { eql } from "../jslang.ts";
import { $vuu } from "../symbols.ts";
import { assert } from "../util.ts";
import { StnodeV } from "./StnodeV.ts";
/*80--------------------------------------------------------------------------*/

export type ReplRest = [...Node[], undefined | ReplRest];
export type ReplRestRepr = [...string[], ReplRestRepr | undefined];

/** @final */
export class CtorRest {
  /* #inuse */
  #inuse = false;
  get inuse() {
    return this.#inuse;
  }

  use() {
    this.#inuse = true;
  }
  put() {
    this.#inuse = false;
  }
  /* ~ */

  /* #rest */
  #rest: ReplRest | undefined;
  get replRest_$() {
    return this.#rest;
  }

  get empty(): boolean {
    return !this.#rest || this.#rest[0] === undefined;
  }

  /** Act also as the real flag whether to use `this` or not. */
  get strtLoff(): loff_t | undefined {
    return this.#inuse ? strtLoffOf_(this.#rest) : undefined;
  }
  /* ~ */

  resetCtorRest(): this {
    // this.#rest.length = 1;
    // this.#rest[0] = undefined;
    this.#rest = undefined;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  dnenRest(rest_x: ReplRest): void {
    if (!this.#rest) return;

    rest_x.become_Array(this.#rest);
    if (this.#rest.at(-1)) {
      this.#rest = this.#rest.at(-1) as ReplRest;
    } else {
      this.resetCtorRest();
    }
  }
  upenRest(rest_x: ReplRest): void {
    /*#static*/ if (INOUT) {
      assert(!rest_x.at(-1) || eql(rest_x.at(-1), this.#rest));
    }
    this.#rest = rest_x;
  }

  /**
   * `rest_x` becomes `#rest` and `rest_x.at(-1)` becomes the original `#rest`.
   * @param rest_x
   */
  unshift(rest_x: ReplRest) {
    const r_ = this.#rest;
    this.#rest = rest_x;
    this.#rest[this.#rest.length - 1] = (!r_ || r_[0] === undefined)
      ? undefined
      : r_;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #_reprReplRest_(rest_x?: ReplRest): ReplRestRepr {
    const ret = [];
    if (rest_x) {
      for (let i = 0, iI = rest_x.length - 1; i < iI; ++i) {
        const nd_ = rest_x[i] as Node;
        if (nd_.isText) {
          ret.push(
            `[${(nd_ as Text).strtLoff})${(nd_ as Text).stopLoff} ` +
              `"${nd_.textContent}"`,
          );
        } else {
          ret.push((nd_.vuu as StnodeV)._info_);
        }
      }
    }
    const last = rest_x?.at(-1) as ReplRest | undefined;
    if (last) ret.push(this.#_reprReplRest_(last));
    else ret.push(undefined);
    return ret as ReplRestRepr;
  }
  /** @final */
  _repr_(): ReplRestRepr {
    return this.#_reprReplRest_(this.#rest);
  }
}

const strtLoffOf_ = (rest_x?: ReplRest): loff_t | undefined => {
  const r0_ = rest_x?.[0];
  if (r0_ === undefined) return undefined;

  if (r0_ instanceof Node) {
    if (r0_.isText) {
      return (r0_ as Text).strtLoff;
    } else {
      /*#static*/ if (INOUT) {
        assert(r0_.vuu instanceof StnodeV);
      }
      return (r0_.vuu as StnodeV).strtLoff_$;
    }
  } else {
    return strtLoffOf_(r0_);
  }
};
/*80--------------------------------------------------------------------------*/
