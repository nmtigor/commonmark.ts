/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Link
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
import {
  _escapeXml,
  _isSafeURL,
  _tag,
  _toHTML,
  _unescapeString,
} from "../util.ts";
import { Inline } from "./Inline.ts";
import type { Loc } from "../../Loc.ts";
import { INOUT } from "@fe-src/global.ts";
import type { BrktOpen_LI, MdextLexr } from "../MdextLexr.ts";
/*80--------------------------------------------------------------------------*/

export const enum LinkMode {
  /** `[foo](/uri "title")` */
  inline = 1,
  /** `[foo][bar]` */
  ref_full,
  /** `[foo][]` */
  ref_collapsed,
  /** `[foo]` */
  ref_shortcut,
}

/** @final */
export class Link extends Inline {
  #mode;

  #frstTk;
  get isImg() {
    return (this.#frstTk.lexdInfo as BrktOpen_LI).is_image;
  }
  #destTk_a;
  #lastTk;

  #textSnt_a;
  #titleTk_a;

  /** @implement */
  get frstToken() {
    return this.frstToken$ ??= this.#frstTk;
  }
  /** @implement */
  get lastToken() {
    return this.lastToken$ ??= this.#lastTk;
  }

  /**
   * @const @param mode_x
   * @headconst @param frstTk_x
   * @headconst @param textSnt_a_x
   * @headconst @param lastTk_x
   * @headconst @param destTk_a_x
   * @headconst @param titleTk_a_x
   */
  constructor(
    mode_x: LinkMode,
    frstTk_x: MdextTk,
    textSnt_a_x: (MdextTk | Inline)[],
    lastTk_x: MdextTk,
    destTk_a_x?: MdextTk[],
    titleTk_a_x?: MdextTk[],
  ) {
    super();
    this.#mode = mode_x;
    this.#frstTk = frstTk_x;
    this.#lastTk = lastTk_x;
    this.#textSnt_a = textSnt_a_x;
    if (destTk_a_x?.length) this.#destTk_a = destTk_a_x;
    if (titleTk_a_x?.length) this.#titleTk_a = titleTk_a_x;

    this.frstBdryTk;
    this.lastBdryTk;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(loc_x: Loc): MdextTk {
    if (this.lastToken.touch(loc_x)) return this.lastToken;

    if (this.#mode === LinkMode.inline) {
      if (this.#titleTk_a?.length) {
        for (let i = this.#titleTk_a.length; i--;) {
          const tk_ = this.#titleTk_a[i];
          if (tk_.touch(loc_x)) return tk_;
        }
      }
      if (this.#destTk_a?.length) {
        for (let i = this.#destTk_a.length; i--;) {
          const tk_ = this.#destTk_a[i];
          if (tk_.touch(loc_x)) return tk_;
        }
      }
    }

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
    const isImg = this.isImg;
    if (!lexr_x._enableTags) return _toHTML(lexr_x, this.#textSnt_a);

    const attrs: [k: string, v: string][] = [];

    let dest_s;
    if (this.#destTk_a?.length === 1 || this.#destTk_a?.length === 3) {
      dest_s =
        (this.#destTk_a.length === 3 ? this.#destTk_a[1] : this.#destTk_a[0])
          .getText();
      dest_s = _unescapeString(dest_s);
      // console.log("🚀 ~ Link ~ override_toHTML ~ dest_s:", dest_s)
      dest_s = encodeURI(decodeURI(dest_s));
    }
    if (dest_s && _isSafeURL(dest_s)) {
      if (isImg) {
        attrs.push(["src", _escapeXml(dest_s)]);
      } else {
        attrs.push(["href", _escapeXml(dest_s)]);
      }
    } else {
      if (isImg) {
        attrs.push(["src", ""]);
      } else {
        attrs.push(["href", ""]);
      }
    }

    if (isImg) {
      lexr_x._enableTags = false;
      attrs.push(["alt", _toHTML(lexr_x, this.#textSnt_a)]);
      lexr_x._enableTags = true;
    }

    if (this.#titleTk_a?.length) {
      const title_s = _unescapeString(
        this.#titleTk_a
          .map((tk) => tk.getText())
          .join("\n")
          .slice(1, -1),
      );
      attrs.push(["title", _escapeXml(title_s)]);
    }

    return isImg
      ? _tag("img", attrs, true)
      : `${_tag("a", attrs)}${_toHTML(lexr_x, this.#textSnt_a)}</a>`;
  }
}
/*80--------------------------------------------------------------------------*/
