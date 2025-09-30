/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Autolink
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { assert, fail } from "@fe-lib/util.ts";
import { INOUT } from "@fe-src/preNs.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr, URI_LI } from "../MdextLexr.ts";
import { _escapeXml_, _isSafeURL_, _tag_, gathrUnrelTk_$ } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Autolink extends Inline {
  #frstTk;
  readonly #destTk_a;
  #lastTk;

  //jjjj TOCLEANUP
  // #isEmail;

  override get frstToken() {
    return this.frstToken$ ??= this.#frstTk;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#lastTk;
  }

  /**
   * @headconst @param frstTk_x
   * @headconst @param destTk_a_x
   * @headconst @param lastTk_x
   */
  constructor(frstTk_x: MdextTk, destTk_a_x: MdextTk[], lastTk_x: MdextTk) {
    super();
    this.#frstTk = frstTk_x;
    this.#destTk_a = destTk_a_x;
    this.#lastTk = lastTk_x;
    //jjjj TOCLEANUP
    // this.#isEmail = isEmail_x;

    this.ensureBdry();
    /*#static*/ if (INOUT) {
      assert(this.#destTk_a.length);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  tokenAt(loc_x: Loc): MdextTk {
    if (this.#lastTk.touch(loc_x)) return this.#lastTk;

    for (let i = this.#destTk_a.length; i--;) {
      const tk_ = this.#destTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }

    if (this.#frstTk.touch(loc_x)) return this.#frstTk;

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    let ret = super.gathrUnrelSnt(drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    if (ret) return ret;

    ret += gathrUnrelTk_$(
      this.#frstTk,
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
    );

    for (const tk of this.#destTk_a) {
      ret += gathrUnrelTk_$(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }

    ret += gathrUnrelTk_$(
      this.#lastTk,
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
    );
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML_(lexr_x: MdextLexr): string {
    const text_s = this.#destTk_a
      .map((tk) => tk.getText())
      .join("");
    if (!lexr_x._enableTags) return _escapeXml_(text_s);

    const attrs: [k: string, v: string][] = [];

    const li_ = this.#destTk_a[0].lexdInfo as URI_LI;
    let dest_s = `${li_?.isEmail_1 ? "mailto:" : ""}${text_s}`;
    dest_s = encodeURI(decodeURI(dest_s));
    attrs.push(["href", _isSafeURL_(dest_s) ? _escapeXml_(dest_s) : ""]);

    return `${_tag_("a", attrs)}${_escapeXml_(text_s)}</a>`;
  }
}
/*80--------------------------------------------------------------------------*/
