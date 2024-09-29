/** 80**************************************************************************
 * @module lib/compiling/TLayr
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../global.ts";
import type { Chr, Dulstr } from "../alias.ts";
import { assert } from "../util/trace.ts";
import type { Dulmap } from "./Dgdata.ts";
/*80--------------------------------------------------------------------------*/

abstract class TLayr {
  /**
   * @const @param chr_x
   */
  treat(chr_x: Chr): boolean {
    return true;
  }

  /**
   * @out @param out_x
   */
  abstract dull(src_x: (Chr | Dulstr)[], out_x: (Chr | Dulstr)[]): Dulstr[];
}

/** @fianl */
export class TLVert extends TLayr {
  #tlayr_a;

  /** Helper */
  #out: (Chr | Dulstr)[] = [];
  // #out_inuse = false;
  /* ~ */

  constructor(tlayr_a_x: TLayr[] = []) {
    super();
    this.#tlayr_a = tlayr_a_x;
  }

  has(tlayr_x: TLayr) {
    return this.#tlayr_a.some((tlayr) => tlayr === tlayr_x);
  }
  add(tlayr_x: TLayr) {
    /*#static*/ if (INOUT) {
      assert(!this.has(tlayr_x));
    }
    this.#tlayr_a.push(tlayr_x);
  }
  del(tlayr_x: TLayr) {
    const i = this.#tlayr_a.indexOf(tlayr_x);
    if (i >= 0) this.#tlayr_a.splice(i, 1);
  }

  /**
   * @const @param chr_x
   */
  override treat(chr_x: Chr) {
    return !!this.#tlayr_a.at(0)?.treat(chr_x);
  }

  /** @implement */
  dull(src_x: (Chr | Dulstr)[], out_x: (Chr | Dulstr)[]): Dulstr[] {
    const ret: Dulstr[] = [];
    for (const tlayr of this.#tlayr_a) {
      src_x = tlayr.dull(src_x, out_x);
      ret.push(...src_x);
    }
    out_x.push(...ret);
    return ret;
  }
}

// /** @fianl */
// export class TLHorz extends TLayr {
//   #tlayr_a: TLayr[] = [];

//   constructor(tlayr_a_x: TLayr[] = []) {
//     super();
//     this.#tlayr_a = tlayr_a_x;
//   }

//   override treat(chr_x: Chr) {
//     let ret = false;
//     for (let i = this.#tlayr_a.length; i-- && !ret;) {
//       ret ||= this.#tlayr_a[i].treat(chr_x);
//     }
//     return ret;
//   }

//   /** @implement */
//   dull(chr_x: Chr, out_x: string[]) {
//     this.#tlayr_a.forEach((_y) => _y.dull(chr_x, out_x));
//   }
// }
/*80--------------------------------------------------------------------------*/

/** @final */
export class DgmapTL extends TLayr {
  #dgmap;

  constructor(dgmap_x: Dulmap) {
    super();
    this.#dgmap = dgmap_x;
  }

  override treat(chr_x: Chr) {
    return this.#dgmap.has(chr_x);
  }

  /** @implement */
  dull(src_x: (Chr | Dulstr)[], out_x: (Chr | Dulstr)[]): Dulstr[] {
    const ret: Dulstr[] = [];
    for (const cd of src_x) {
      const ds_ = this.#dgmap.get(cd);
      if (ds_) ret.push(ds_);
    }
    out_x.push(...ret);
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
