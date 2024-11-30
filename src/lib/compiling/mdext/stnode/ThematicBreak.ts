/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/ThematicBreak
 * @license BSD-3-Clause
 ******************************************************************************/

import { Block } from "./Block.ts";
import type { MdextTk } from "../../Token.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { SortedStnod_id } from "../../Stnode.ts";
import type { lnum_t } from "@fe-lib/alias.ts";
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
    _unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    const tk_ = this.#tk;
    if (
      tk_.sntStopLoc.posSE(drtStrtLoc_x) ||
      tk_.sntStrtLoc.posGE(drtStopLoc_x)
    ) unrelSnt_sa_x.add(tk_);
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    return loc_x.line_$ === this.#tk.sntFrstLine ? this.#tk.sntFrstLidx_1 : -1;
  }

  override reuseLine(_lidx_x: lnum_t): MdextTk[] {
    return [this.#tk];
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    return `<hr />`;
  }
}
/*80--------------------------------------------------------------------------*/
