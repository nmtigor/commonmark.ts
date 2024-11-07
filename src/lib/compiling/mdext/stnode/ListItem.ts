/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/ListItem
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
import type { ListMrkr_LI, MdextLexr } from "../MdextLexr.ts";
import type { BlockCont } from "../alias.ts";
import { Block } from "./Block.ts";
import type { lcol_t } from "@fe-lib/alias.ts";
import { _toHTML } from "../util.ts";
import type { List } from "./List.ts";
import { Paragraph } from "./Paragraph.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import type { Loc } from "../../Loc.ts";
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
    fail("Not implemented");
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  lcolCntStrt(_loc_x: Loc): MdextTk | undefined {
    fail("Not implemented");
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
