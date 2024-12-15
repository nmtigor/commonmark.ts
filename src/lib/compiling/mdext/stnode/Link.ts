/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Link
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextTk } from "../../Token.ts";
import { Err } from "../../alias.ts";
import type { BrktOpen_LI, MdextLexr } from "../MdextLexr.ts";
import {
  _escapeXml,
  _isSafeURL,
  _tag,
  _toHTML,
  _unescapeString,
} from "../util.ts";
import { Inline } from "./Inline.ts";
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
  #normdLabel;

  #frstTk;
  get isImg() {
    return (this.#frstTk.lexdInfo as BrktOpen_LI).is_image;
  }
  #destTk_a;
  #lastTk;

  #textSnt_a;
  #titleTk_a;

  override get children(): Inline[] {
    if (this.children$) return this.children$ as Inline[];

    const ret: Inline[] = [];
    for (const snt of this.#textSnt_a) {
      if (snt instanceof Inline) ret.push(snt);
    }
    return this.children$ = ret;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#frstTk;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#lastTk;
  }

  /**
   * @const @param mode_x
   * @const @param normdLabel_x
   * @headconst @param frstTk_x
   * @headconst @param textSnt_a_x
   * @headconst @param lastTk_x
   * @headconst @param destTk_a_x
   * @headconst @param titleTk_a_x
   */
  constructor(
    mode_x: LinkMode,
    normdLabel_x: string | undefined,
    frstTk_x: MdextTk,
    textSnt_a_x: (MdextTk | Inline)[],
    lastTk_x: MdextTk,
    destTk_a_x?: MdextTk[],
    titleTk_a_x?: MdextTk[],
  ) {
    /*#static*/ if (INOUT) {
      if (mode_x === LinkMode.inline) {
        assert(!normdLabel_x && destTk_a_x);
      } else {
        assert(normdLabel_x && !destTk_a_x && !titleTk_a_x);
      }
    }
    super();
    this.#mode = mode_x;
    this.#normdLabel = normdLabel_x;
    this.#frstTk = frstTk_x;
    this.#lastTk = lastTk_x;
    this.#textSnt_a = textSnt_a_x;
    this.#destTk_a = destTk_a_x;
    this.#titleTk_a = titleTk_a_x;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(loc_x: Loc): MdextTk {
    if (this.lastToken.touch(loc_x)) return this.lastToken;

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
    const linkdef = this.#mode === LinkMode.inline
      ? undefined
      : lexr_x.linkdef_m_$.get(this.#normdLabel!);

    let dest_s;
    const destTk_a = this.#destTk_a ?? linkdef?.destTk_a;
    if (destTk_a?.length === 1 || destTk_a?.length === 3) {
      dest_s = (destTk_a.length === 3 ? destTk_a[1] : destTk_a[0]).getText();
      dest_s = _unescapeString(dest_s);
      // console.log("🚀 ~ Link ~ override_toHTML ~ dest_s:", dest_s)
      dest_s = encodeURI(decodeURI(dest_s));
    }
    /*kkkk Instead of `_isSafeURL()`, use a uri parser to validate the link
    destination more precisely. */
    if (dest_s && _isSafeURL(dest_s)) {
      if (isImg) {
        attrs.push(["src", _escapeXml(dest_s)]);
      } else {
        attrs.push(["href", _escapeXml(dest_s)]);
      }
    } else {
      this.setErr(Err.unrecognizable_linkdest);
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

    const titleTk_a = this.#titleTk_a ?? linkdef?.titleTk_a;
    if (titleTk_a?.length) {
      const title_s = _unescapeString(
        titleTk_a
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
