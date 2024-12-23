/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Link
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/global.ts";
import type { uint } from "@fe-lib/alias.ts";
import { assert, fail } from "@fe-lib/util/trace.ts";
import type { Loc } from "../../Loc.ts";
import { SortedSnt_id } from "../../Snt.ts";
import { MdextTk } from "../../Token.ts";
import type { BrktOpen_LI, MdextLexr } from "../MdextLexr.ts";
import {
  _escapeXml,
  _isSafeURL,
  _tag,
  _toHTML,
  _unescapeString,
  gathrUnrelTk,
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
  #textSnt_a;
  #lastTk;

  #destTk_a;
  #titlTk_a;

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
   * @headconst @param titlTk_a_x
   */
  constructor(
    mode_x: LinkMode,
    normdLabel_x: string | undefined,
    frstTk_x: MdextTk,
    textSnt_a_x: (MdextTk | Inline)[],
    lastTk_x: MdextTk,
    destTk_a_x?: MdextTk[],
    titlTk_a_x?: MdextTk[],
  ) {
    /*#static*/ if (INOUT) {
      if (mode_x === LinkMode.inline) {
        assert(!normdLabel_x && destTk_a_x);
      } else {
        assert(normdLabel_x && !destTk_a_x && !titlTk_a_x);
      }
    }
    super();
    this.#mode = mode_x;
    this.#normdLabel = normdLabel_x;
    this.#frstTk = frstTk_x;
    this.#textSnt_a = textSnt_a_x;
    this.#lastTk = lastTk_x;
    this.#destTk_a = destTk_a_x;
    this.#titlTk_a = titlTk_a_x;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(loc_x: Loc): MdextTk {
    if (this.lastToken.touch(loc_x)) return this.lastToken;

    if (this.#titlTk_a?.length) {
      for (let i = this.#titlTk_a.length; i--;) {
        const tk_ = this.#titlTk_a[i];
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

    for (const snt of this.#textSnt_a) {
      if (snt instanceof MdextTk) {
        ret += gathrUnrelTk(snt, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      } else {
        ret += snt.gathrUnrelSnt(drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }

    ret += gathrUnrelTk(
      this.#lastTk,
      drtStrtLoc_x,
      drtStopLoc_x,
      unrelSnt_sa_x,
    );

    if (this.#destTk_a) {
      for (const tk of this.#destTk_a) {
        ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }

    if (this.#titlTk_a) {
      for (const tk of this.#titlTk_a) {
        ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }
    return ret;
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
      //jjjj TOCLEANUP
      // this.setErr(Err.unrecognizable_linkdest);
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

    const titlTk_a = this.#titlTk_a ?? linkdef?.titlTk_a;
    if (titlTk_a?.length) {
      const title_s = _unescapeString(
        titlTk_a
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
