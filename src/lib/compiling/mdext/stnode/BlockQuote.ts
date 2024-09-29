/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/BlockQuote
 * @license BSD-3-Clause
 ******************************************************************************/

import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
import { _toHTML } from "../util.ts";
import { Block } from "./Block.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
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

  /** @implement */
  get frstToken() {
    return this.#mrkrTk_a[0];
  }
  /** @implement */
  get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    const mrkrTk = this.#mrkrTk_a.at(-1)!;
    const tk_ = this.block_a$.at(-1)?.lastToken;
    return this.lastToken$ = !tk_ || tk_.posSE(mrkrTk) ? mrkrTk : tk_;
  }

  constructor(mrkrTk_x: MdextTk) {
    super();
    this.#mrkrTk_a = [mrkrTk_x];
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_ = _toHTML(lexr_x, this.block_a$);
    return `<blockquote>\n${s_}${s_ ? "\n" : ""}</blockquote>`;
  }
}
