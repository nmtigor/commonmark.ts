/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Emphasis
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
import { _toHTML } from "../util.ts";
import { Inline } from "./Inline.ts";
import type { Loc } from "../../Loc.ts";
import { INOUT } from "@fe-src/global.ts";
import type { MdextLexr } from "../MdextLexr.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Emphasis extends Inline {
  #strong;

  #frstTk;
  #lastTk;
  #textSnt_a;

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
   * @headconst @param textSnt_a_x
   */
  constructor(
    frstTk_x: MdextTk,
    lastTk_x: MdextTk,
    textSnt_a_x: (MdextTk | Inline)[],
  ) {
    super();
    this.#frstTk = frstTk_x;
    this.#lastTk = lastTk_x;
    this.#strong = frstTk_x.length_1 > 1;
    this.#textSnt_a = textSnt_a_x;

    this.frstBdryTk;
    this.lastBdryTk;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  tokenAt(loc_x: Loc): MdextTk {
    if (this.lastToken.touch(loc_x)) return this.lastToken;

    for (let i = this.#textSnt_a.length; i--;) {
      const snt = this.#textSnt_a[i];
      if (snt.touch(loc_x)) {
        return snt instanceof Inline ? snt.tokenAt(loc_x) : snt;
      }
    }

    if (this.frstToken.touch(loc_x)) return this.frstToken;

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    return lexr_x._enableTags
      ? [
        this.#strong ? "<strong>" : "<em>",
        _toHTML(lexr_x, this.#textSnt_a),
        this.#strong ? "</strong>" : "</em>",
      ].join("")
      : _toHTML(lexr_x, this.#textSnt_a);
  }
}
/*80--------------------------------------------------------------------------*/
