/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/ThematicBreak
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t, uint } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import { gathrUnrelTk } from "../util.ts";
import { Block } from "./Block.ts";
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

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    return gathrUnrelTk(this.#tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    return loc_x.line_$ === this.#tk.sntFrstLine ? this.#tk.sntFrstLidx_1 : -1;
  }

  override reuseLine(_lidx_x: lnum_t, snt_a_x: MdextTk[]) {
    snt_a_x.push(this.#tk);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    return `<hr />`;
  }
}
/*80--------------------------------------------------------------------------*/
