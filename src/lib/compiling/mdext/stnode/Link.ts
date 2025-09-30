/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Link
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { assert, fail } from "@fe-lib/util.ts";
import { INOUT } from "@fe-src/preNs.ts";
import type { Loc } from "../../Loc.ts";
import { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import { Token } from "../../Token.ts";
import type { BrktOpen_LI, MdextLexr } from "../MdextLexr.ts";
import {
  _escapeXml_,
  _isSafeURL_,
  _tag_,
  _toHTML_,
  _unescapeString_,
  gathrUnrelTk_$,
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

  /** `[...]` or `[...](` */
  #textPart;
  #lastTk;

  readonly #lablTk_a;
  /** `...` or `<...>` */
  readonly #destPart;
  readonly #titlTk_a;

  #children?: Inline[];
  override get children(): Inline[] {
    if (this.#children) return this.#children as Inline[];

    const ret: Inline[] = [];
    for (const snt of this.#textPart) {
      if (snt instanceof Inline) ret.push(snt);
    }
    return this.#children = ret;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#textPart[0] as MdextTk;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#lastTk;
  }

  get isImg() {
    return (this.frstToken.lexdInfo as BrktOpen_LI).is_image;
  }

  /**
   * @const @param mode_x
   * @const @param normdLabel_x
   * @headconst @param textPart_x include brackets, i.e., `[...]` or `[...](`
   * @headconst @param lastTk_x
   * @headconst @param lablTk_a_x
   * @headconst @param destPart_x  `...` or `<...>`
   * @headconst @param titlTk_a_x
   */
  constructor(
    mode_x: LinkMode,
    normdLabel_x: string | undefined,
    textPart_x: (MdextTk | Inline)[],
    lastTk_x: MdextTk,
    lablTk_a_x?: MdextTk[],
    destPart_x?: MdextTk[],
    titlTk_a_x?: MdextTk[],
  ) {
    /*#static*/ if (INOUT) {
      if (mode_x === LinkMode.inline) {
        assert(!normdLabel_x && !lablTk_a_x && destPart_x);
      } else {
        assert(normdLabel_x && !destPart_x && !titlTk_a_x);
      }
    }
    super();
    this.#mode = mode_x;
    this.#normdLabel = normdLabel_x;
    this.#textPart = textPart_x;
    this.#lastTk = lastTk_x;
    this.#lablTk_a = lablTk_a_x;
    this.#destPart = destPart_x;
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
    if (this.#destPart?.length) {
      for (let i = this.#destPart.length; i--;) {
        const tk_ = this.#destPart[i];
        if (tk_.touch(loc_x)) return tk_;
      }
    }

    if (this.#lablTk_a?.length) {
      for (let i = this.#lablTk_a.length; i--;) {
        const tk_ = this.#lablTk_a[i];
        if (tk_.touch(loc_x)) return tk_;
      }
    }

    for (let i = this.#textPart.length; i--;) {
      const snt = this.#textPart[i];
      if (snt.touch(loc_x)) {
        return snt instanceof Inline ? snt.tokenAt(loc_x) : snt;
      }
    }

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

    for (const snt of this.#textPart) {
      if (snt instanceof Token) {
        ret += gathrUnrelTk_$(snt, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      } else {
        ret += snt.gathrUnrelSnt(drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }

    if (this.#lastTk !== this.#textPart.at(-1)) {
      ret += gathrUnrelTk_$(
        this.#lastTk,
        drtStrtLoc_x,
        drtStopLoc_x,
        unrelSnt_sa_x,
      );
    }

    if (this.#lablTk_a) {
      for (const tk of this.#lablTk_a) {
        if (tk !== this.#lastTk) {
          ret += gathrUnrelTk_$(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
        }
      }
    }

    if (this.#destPart) {
      for (const tk of this.#destPart) {
        ret += gathrUnrelTk_$(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }
    if (this.#titlTk_a) {
      for (const tk of this.#titlTk_a) {
        ret += gathrUnrelTk_$(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML_(lexr_x: MdextLexr): string {
    const isImg = this.isImg;
    const textSnt_a = this.#textPart.slice(1, -1);
    if (!lexr_x._enableTags) return _toHTML_(lexr_x, textSnt_a);

    const attrs: [k: string, v: string][] = [];
    const linkdef = this.#mode === LinkMode.inline
      ? undefined
      : lexr_x.linkdef_m_$.get(this.#normdLabel!);

    let dest_s;
    const destPart = this.#destPart ?? linkdef?.destPart;
    if (destPart?.length === 1 || destPart?.length === 3) {
      dest_s = (destPart.length === 3 ? destPart[1] : destPart[0]).getText();
      dest_s = _unescapeString_(dest_s);
      // console.log("🚀 ~ Link ~ override_toHTML ~ dest_s:", dest_s)
      dest_s = encodeURI(decodeURI(dest_s));
    }
    /*kkkk Instead of `_isSafeURL_()`, use a uri parser to validate the link
    destination more precisely. */
    if (dest_s && _isSafeURL_(dest_s)) {
      if (isImg) {
        attrs.push(["src", _escapeXml_(dest_s)]);
      } else {
        attrs.push(["href", _escapeXml_(dest_s)]);
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
      attrs.push(["alt", _toHTML_(lexr_x, textSnt_a)]);
      lexr_x._enableTags = true;
    }

    const titlTk_a = this.#titlTk_a ?? linkdef?.titlTk_a;
    if (titlTk_a?.length) {
      const title_s = _unescapeString_(
        titlTk_a
          .map((tk) => tk.getText())
          .join("\n")
          .slice(1, -1),
      );
      attrs.push(["title", _escapeXml_(title_s)]);
    }

    return isImg
      ? _tag_("img", attrs, true)
      : `${_tag_("a", attrs)}${_toHTML_(lexr_x, textSnt_a)}</a>`;
  }
}
/*80--------------------------------------------------------------------------*/
