/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Autolink
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { assert, fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { _escapeXml, _isSafeURL, _tag, gathrUnrelTk } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Autolink extends Inline {
  #frstTk;
  readonly #destTk_a;
  #lastTk;

  #isEmail;

  override get children() {
    return undefined;
  }

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
   * @const @param isEmail_x
   */
  constructor(
    frstTk_x: MdextTk,
    destTk_a_x: MdextTk[],
    lastTk_x: MdextTk,
    isEmail_x: boolean,
  ) {
    super();
    this.#frstTk = frstTk_x;
    this.#destTk_a = destTk_a_x;
    this.#lastTk = lastTk_x;
    this.#isEmail = isEmail_x;

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

    ret += gathrUnrelTk(
      this.#frstTk,
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
    );

    for (const tk of this.#destTk_a) {
      ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }

    ret += gathrUnrelTk(
      this.#lastTk,
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
    );
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const text_s = this.#destTk_a
      .map((tk) => tk.getText())
      .join("");
    if (!lexr_x._enableTags) return _escapeXml(text_s);

    const attrs: [k: string, v: string][] = [];

    let dest_s = `${this.#isEmail ? "mailto:" : ""}${text_s}`;
    dest_s = encodeURI(decodeURI(dest_s));
    attrs.push(["href", _isSafeURL(dest_s) ? _escapeXml(dest_s) : ""]);

    return `${_tag("a", attrs)}${_escapeXml(text_s)}</a>`;
  }
}
/*80--------------------------------------------------------------------------*/
