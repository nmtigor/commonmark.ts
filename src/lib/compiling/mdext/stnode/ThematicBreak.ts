/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/ThematicBreak
 * @license BSD-3-Clause
 ******************************************************************************/

import { Block } from "./Block.ts";
import type { MdextTk } from "../../Token.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class ThematicBreak extends Block {
  #tk;

  override get children() {
    return undefined;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#tk;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#tk;
  }

  constructor(tk_x: MdextTk) {
    super();
    this.#tk = tk_x;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    return `<hr />`;
  }
}
/*80--------------------------------------------------------------------------*/
