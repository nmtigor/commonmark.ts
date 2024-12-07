/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/ListItem
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
import type { ListMrkr_LI, MdextLexr } from "../MdextLexr.ts";
import type { BlockCont } from "../alias.ts";
import { Block } from "./Block.ts";
import type { lcol_t, lnum_t } from "@fe-lib/alias.ts";
import { _toHTML } from "../util.ts";
import type { List } from "./List.ts";
import { Paragraph } from "./Paragraph.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import type { Loc } from "../../Loc.ts";
import { Inline } from "./Inline.ts";
import { SortedSnt_id } from "../../Snt.ts";
import { SortedStnod_id } from "../../Stnode.ts";
import { BaseTok } from "../../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

export abstract class ListItem extends CtnrBlock {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueListItem_$(this);
  }

  override canContain(_x: Block): boolean {
    return !(_x instanceof ListItem);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override get parent(): List {
    return this.parent_$ as List;
  }

  #mrkrTk;
  get indent(): lcol_t {
    const li_ = this.#mrkrTk.lexdInfo as ListMrkr_LI;
    return li_.indent + li_.padding;
  }

  get tight_1(): boolean {
    let ret = true;
    const c_a = this.children;
    if (c_a.length) {
      for (let i = 0, iI = c_a.length - 1; i < iI; ++i) {
        const b_i = c_a[i];
        const b_j = c_a[i + 1];
        if (b_i.sntLastLine.nextLine !== b_j.sntFrstLine) {
          ret = false;
          break;
        }
      }
    }
    return ret;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#mrkrTk;
  }
  override get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    const tk_ = this.children.at(-1)?.lastToken;
    return this.lastToken$ = tk_ ?? this.#mrkrTk;
  }

  /**
   * @headconst @param mrkrTk_x
   */
  constructor(mrkrTk_x: MdextTk) {
    super();
    this.#mrkrTk = mrkrTk_x;
  }

  override reset(): this {
    super.reset();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    super.gathrUnrelSnt(
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSn_sa_x,
      unrelSnt_sa_x,
    );
    const tk_ = this.#mrkrTk;
    if (
      tk_.value !== BaseTok.unknown &&
      (tk_.sntStopLoc.posSE(drtStrtLoc_x) ||
        tk_.sntStrtLoc.posGE(drtStopLoc_x))
    ) unrelSnt_sa_x.add(tk_);
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: (MdextTk | Inline)[]) {
    if (this.sntFrstLidx_1 === lidx_x) snt_a_x.push(this.#mrkrTk);
    super.reuseLine(lidx_x, snt_a_x);
  }

  /** @implement */
  lcolCntStrt(loc_x: Loc): MdextTk | null | undefined {
    let ret: MdextTk | null | undefined;
    if (this.#mrkrTk.sntFrstLine === loc_x.line_$) {
      loc_x.become(this.#mrkrTk.sntStrtLoc)
        .forwnCol((this.#mrkrTk.lexdInfo as ListMrkr_LI).padding);
      ret = this.#mrkrTk;
    } else if (
      this.sntFrstLidx_1 <= loc_x.lidx_1 && loc_x.lidx_1 <= this.sntLastLidx_1
    ) {
      ret = null;
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_ = _toHTML(lexr_x, this.children);
    if (!s_) return "<li></li>";

    const lf_0 = this.frstChild instanceof Paragraph && this.parent._tight
      ? ""
      : "\n";
    const lf_1 = this.lastChild instanceof Paragraph && this.parent._tight
      ? ""
      : "\n";
    return `<li>${lf_0}${s_}${lf_1}</li>`;
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class BulletListItem extends ListItem {
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class OrderdListItem extends ListItem {
}
/*80--------------------------------------------------------------------------*/
