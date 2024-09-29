/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/CodeInline
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { _escapeXml } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class CodeInline extends Inline {
  #frstTk;
  #lastTk;
  #chunkTk_a;

  /** @implement */
  get frstToken() {
    return this.frstToken$ ??= this.#frstTk;
  }
  /** @implement */
  get lastToken() {
    return this.lastToken$ ??= this.#lastTk;
  }

  /**
   * @headconst @param frstTk_x
   * @headconst @param lastTk_x
   * @headconst @param chunkSnt_a_x
   */
  constructor(frstTk_x: MdextTk, lastTk_x: MdextTk, chunkSnt_a_x: MdextTk[]) {
    super();
    this.#frstTk = frstTk_x;
    this.#lastTk = lastTk_x;
    this.#chunkTk_a = chunkSnt_a_x;

    this.frstBdryTk;
    this.lastBdryTk;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  tokenAt(loc_x: Loc): MdextTk {
    if (this.lastToken.touch(loc_x)) return this.lastToken;

    for (let i = this.#chunkTk_a.length; i--;) {
      const tk_ = this.#chunkTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }

    if (this.frstToken.touch(loc_x)) return this.frstToken;

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_a: string[] = [];
    let curLn = this.#chunkTk_a[0].frstLine;
    for (const tk of this.#chunkTk_a) {
      const ln_ = tk.frstLine;
      if (ln_ !== curLn) {
        curLn = ln_;
        s_a.push(" ");
      }
      s_a.push(tk.getText());
    }

    let s_ = s_a.join("");
    if (
      s_.length > 2 &&
      s_.charCodeAt(0) === /* " " */ 0x20 &&
      s_.charCodeAt(s_.length - 1) === /* " " */ 0x20 &&
      !/^ *$/.test(s_)
    ) {
      s_ = s_.slice(1, -1);
    }
    return lexr_x._enableTags
      ? `<code>${_escapeXml(s_)}</code>`
      : _escapeXml(s_);
  }
}
/*80--------------------------------------------------------------------------*/
