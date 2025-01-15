/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/BlockQuote
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { isSpaceOrTab } from "@fe-lib/util/general.ts";
import type { lnum_t } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { SortedStnod_id } from "../../Stnode.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
import { _toHTML, gathrUnrelTk } from "../util.ts";
import { Block } from "./Block.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import type { Inline } from "./Inline.ts";
import { ListItem } from "./ListItem.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class BlockQuote extends CtnrBlock {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueBlockQuote_$(this);
  }

  override canContain(_x: Block): boolean {
    return !(_x instanceof ListItem);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #mrkrTk_a;
  addMrkr(tk_x: MdextTk) {
    this.#mrkrTk_a.push(tk_x);
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#mrkrTk_a[0];
  }
  override get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    const mrkrTk = this.#mrkrTk_a.at(-1)!;
    const tk_ = this.children.at(-1)?.lastToken;
    return this.lastToken$ = !tk_ || tk_.posSE(mrkrTk) ? mrkrTk : tk_;
  }

  constructor(mrkrTk_x: MdextTk) {
    super();
    this.#mrkrTk_a = [mrkrTk_x];
  }

  override resetBlock(): this {
    super.resetBlock();
    this.#mrkrTk_a.length = 0;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
    unrelSn_sa_x: SortedStnod_id,
  ): uint {
    let ret = super.gathrUnrelSnt(
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
      unrelSn_sa_x,
    );

    for (const tk of this.#mrkrTk_a) {
      ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }
    return ret;
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    //jjjj TOCLEANUP
    // const i_ = this.#mrkrTk_a.findIndex((tk) => loc_x.posE(tk.sntStrtLoc));
    const i_ = this.#mrkrTk_a.findIndex((tk) =>
      loc_x.line_$ === tk.sntFrstLine
    );
    return i_ >= 0 ? this.#mrkrTk_a[i_].sntFrstLidx_1 : -1;
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: (MdextTk | Inline)[]) {
    snt_a_x.push(this.#mrkrTk_a[lidx_x - this.sntFrstLidx_1]);
    super.reuseLine(lidx_x, snt_a_x);
  }

  /** @implement */
  lcolCntStrt(loc_x: Loc): MdextTk | undefined {
    let ret: MdextTk | undefined;
    const ln_ = loc_x.line_$;
    for (const tk of this.#mrkrTk_a) {
      if (tk.sntFrstLine === ln_) {
        loc_x.becomeLoc(tk.sntStopLoc);
        /* optional following space */
        if (isSpaceOrTab(loc_x.ucod)) loc_x.forwnCol(1);
        ret = tk;
        break;
      }
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_ = _toHTML(lexr_x, this.children);
    return `<blockquote>\n${s_}${s_ ? "\n" : ""}</blockquote>`;
  }
}
