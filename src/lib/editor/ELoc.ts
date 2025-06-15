/** 80**************************************************************************
 * @module lib/editor/ELoc
 * @license BSD-3-Clause
 ******************************************************************************/

import { $loff } from "../symbols.ts";
import type { id_t, loff_t, uint } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class ELoc {
  static #ID = 0 as id_t;
  readonly id = ++ELoc.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  ctnr_$: Node;
  /**
   * ! in logical ordering rather than visual ordering
   */
  offs_$: uint;
  get loff(): loff_t {
    return ((this.ctnr_$ as Text)[$loff] ?? 0) + this.offs_$;
  }

  /**
   * @borrow @const @param ctnr_x
   * @const @param offs_x
   */
  constructor(ctnr_x: Node, offs_x: uint) {
    this.ctnr_$ = ctnr_x;
    this.offs_$ = offs_x;
  }

  dupELoc() {
    return new ELoc(this.ctnr_$, this.offs_$);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  posE_O(ctnr_x: Node, offs_x: uint): boolean {
    return this.ctnr_$ === ctnr_x && this.offs_$ === offs_x;
  }
  /** @const */
  posE(rhs: ELoc): boolean {
    return this === rhs || this.posE_O(rhs.ctnr_$, rhs.offs_$);
  }
}
