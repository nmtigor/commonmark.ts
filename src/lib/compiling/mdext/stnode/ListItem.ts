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
/*80--------------------------------------------------------------------------*/

export abstract class ListItem extends CtnrBlock {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueListItem_$(this);
  }

  override canContain(_x: Block): boolean {
    return !(_x instanceof ListItem);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #mrkrTk;
  get indent(): lcol_t {
    const li_ = this.#mrkrTk.lexdInfo as ListMrkr_LI;
    return li_.indent + li_.padding;
  }

  get tight_1(): boolean {
    let ret = true;
    if (this.block_a$.length) {
      for (let i = 0, iI = this.block_a$.length - 1; i < iI; ++i) {
        const b_i = this.block_a$[i];
        const b_j = this.block_a$[i + 1];
        if (b_i.lastLine.nextLine !== b_j.frstLine) {
          ret = false;
          break;
        }
      }
    }
    return ret;
  }

  /** @implement */
  get frstToken() {
    return this.frstToken$ ??= this.#mrkrTk;
  }
  /** @implement */
  get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    const tk_ = this.block_a$.at(-1)?.lastToken;
    return this.lastToken$ = tk_ ?? this.#mrkrTk;
  }

  get _list() {
    return this.parent_$ as List;
  }

  constructor(mrkrTk_x: MdextTk) {
    super();
    this.#mrkrTk = mrkrTk_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_ = _toHTML(lexr_x, this.block_a$);
    if (!s_) return "<li></li>";

    const lf_0 = this.frstChild instanceof Paragraph && this._list._tight
      ? ""
      : "\n";
    const lf_1 = this.lastChild instanceof Paragraph && this._list._tight
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