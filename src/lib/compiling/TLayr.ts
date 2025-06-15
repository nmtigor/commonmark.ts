/** 80**************************************************************************
 * @module lib/compiling/TLayr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Chr, Dulstr } from "../alias.ts";
import * as Is from "../util/is.ts";
import type { Dulmap } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

abstract class TLayr {
  /** @const @param chr_x */
  treat(_chr_x: Chr): boolean {
    return false;
  }

  /**
   * @out @param acc_x Accumulator\
   * Use `Set` because outputs may be duplicate
   *  (e.g. `["de0", "di4"] -> ["de"]`).
   * @out @param ret_x An empty `Set` for one-step outputs
   */
  abstract dull(src_x: Chr[], acc_x: Set<Dulstr>, ret_x?: Set<Dulstr>): void;
}

/** @final */
export class TLVert extends TLayr {
  /** Record intermediate `dull()` results */
  readonly #rir;

  #tlayr_a;

  /**
   * @headconst @param tlayr_a_x
   * @const @param rir_x
   */
  constructor(tlayr_a_x: TLayr[] = [], rir_x = true) {
    super();
    this.#rir = rir_x;
    this.#tlayr_a = tlayr_a_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // has(tlayr_x: TLayr) {
  //   return this.#tlayr_a.some((tlayr) => tlayr === tlayr_x);
  // }
  // add(tlayr_x: TLayr) {
  //   /*#static*/ if (INOUT) {
  //     assert(!this.has(tlayr_x));
  //   }
  //   this.#tlayr_a.push(tlayr_x);
  // }
  // del(tlayr_x: TLayr) {
  //   const i = this.#tlayr_a.indexOf(tlayr_x);
  //   if (i >= 0) this.#tlayr_a.splice(i, 1);
  // }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @const @param chr_x */
  override treat(chr_x: Chr) {
    return !!this.#tlayr_a.at(0)?.treat(chr_x);
  }

  /** @implement */
  dull(src_x: Chr[], acc_x: Set<Dulstr>, ret_x?: Set<Dulstr>): void {
    const ret = new Set<Dulstr>();
    if (this.#rir) {
      for (const tlayr of this.#tlayr_a) {
        ret.clear(); //!
        tlayr.dull(src_x, acc_x, ret);
        if (ret.size) src_x = [...ret] as Chr[];
        if (ret_x) ret.forEach(ret_x.add, ret_x);
      }
    } else {
      for (const tlayr of this.#tlayr_a) {
        ret.clear(); //!
        tlayr.dull(src_x, ret);
        if (ret.size) src_x = [...ret] as Chr[];
      }
      ret.forEach(acc_x.add, acc_x);
      if (ret_x) ret.forEach(ret_x.add, ret_x);
    }
  }
}

/** @final */
export class TLHorz extends TLayr {
  #tlayr_a;

  constructor(tlayr_a_x: TLayr[] = []) {
    super();
    this.#tlayr_a = tlayr_a_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const @param chr_x */
  override treat(chr_x: Chr) {
    return this.#tlayr_a.some((_y) => _y.treat(chr_x));
  }

  /** @implement */
  dull(src_x: Chr[], acc_x: Set<Dulstr>, ret_x?: Set<Dulstr>): void {
    const ret = ret_x ? new Set<Dulstr>() : undefined;
    for (const tlayr of this.#tlayr_a) {
      ret?.clear(); //!
      tlayr.dull(src_x, acc_x, ret);
      if (ret_x) ret!.forEach(ret_x.add, ret_x);
    }
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class DulmapTL extends TLayr {
  #dulmap;

  constructor(dulmap_x: Dulmap) {
    super();
    this.#dulmap = dulmap_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override treat(chr_x: Chr) {
    return this.#dulmap.has(chr_x);
  }

  /**
   * @example
   *  src_x: ["地"]
   *  acc_x: [..., "de0", "di4"]
   *  ret_x: ["de0", "di4"]
   *
   * @example
   *  src_x: ["de0", "di4"]
   *  acc_x: [..., "de"]
   *  ret_x: ["de"]
   *
   * @implement
   */
  dull(src_x: Chr[], acc_x: Set<Dulstr>, ret_x?: Set<Dulstr>): void {
    for (const chr of src_x) {
      /** Dulstr */
      const ds_ = this.#dulmap.get(chr);
      if (Is.array(ds_)) {
        ds_.forEach(acc_x.add, acc_x);
        if (ret_x) ds_.forEach(ret_x.add, ret_x);
      } else if (ds_) {
        acc_x.add(ds_);
        if (ret_x) ret_x.add(ds_);
      } else if (src_x.length > 1) {
        /* Oterwise, this `chr` will be lost during `TLVert.dull()`.
        Notice in `TLHorz.dull()`, there is no such fall-through. */
        acc_x.add(chr);
        if (ret_x) ret_x.add(chr);
      }
    }
  }
}
/*80--------------------------------------------------------------------------*/
