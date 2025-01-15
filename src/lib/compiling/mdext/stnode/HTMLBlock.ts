/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/HTMLBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t, uint } from "@fe-lib/alias.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import { gathrUnrelTk } from "@fe-src/lib/compiling/mdext/util.ts";
import { Loc } from "../../Loc.ts";
import { SortedSnt_id } from "../../Snt.ts";
import { type MdextTk } from "../../Token.ts";
import { type MdextLexr, RawHTML_LI } from "../MdextLexr.ts";
import type { BlockCont } from "../alias.ts";
import { Block } from "./Block.ts";
/*80--------------------------------------------------------------------------*/

export const enum HTMLMode {
  /** CommonMark HTML blocks start, end condition 1 */
  cm_1 = 1,
  cm_2,
  cm_3,
  cm_4,
  cm_5,
  cm_6,
  cm_7,
}

/* For `HTMLBlock.Open_re[HTMLMode.cm_7]`*/
const TAGNAME_ = "[A-Za-z][0-9A-Za-z-]*";
const ATTRIBUTENAME_ = "[A-Za-z_:][\\w:.-]*";
const ATTRIBUTEVALUE_ = `(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*")`;
const ATTRIBUTEVALUESPEC_ = `(?:[ \t]*=[ \t]*${ATTRIBUTEVALUE_})`;
const ATTRIBUTE_ = `(?:[ \t]+${ATTRIBUTENAME_}${ATTRIBUTEVALUESPEC_}?)`;
const OPENTAG_ = `<${TAGNAME_}${ATTRIBUTE_}*[ \t]*/?>`;
const CLOZTAG_ = `</${TAGNAME_}[ \t]*>`;
/* ~ */

/** @final */
export class HTMLBlock extends Block {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueHTMLBlock_$(this);
  }

  override readonly acceptsLines = true;
  override appendLine(_x: [MdextTk]): void {
    const tk_ = _x[0];
    ((tk_.lexdInfo ??= new RawHTML_LI(tk_)) as RawHTML_LI)
      .hasHead = this.#chunkTk_a.length ? false : true;

    this.#chunkTk_a.push(tk_);

    this.invalidateBdry();
  }

  /** reHtmlBlockOpen */
  static readonly Open_re = Object.freeze({
    [HTMLMode.cm_1]: /^<(?:script|pre|textarea|style)(?:[ \t>]|$)/i,
    [HTMLMode.cm_2]: /^<!--/,
    [HTMLMode.cm_3]: /^<[?]/,
    [HTMLMode.cm_4]: /^<![A-Za-z]/,
    [HTMLMode.cm_5]: /^<!\[CDATA\[/,
    [HTMLMode.cm_6]:
      /^<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[123456]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|search|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:[ \t]|\/?>|$)/i,
    [HTMLMode.cm_7]: new RegExp(`^(?:${OPENTAG_}|${CLOZTAG_})[ \t]*$`),
  });

  /** reHtmlBlockClose */
  static readonly Cloz_re = Object.freeze({
    [HTMLMode.cm_1]: /<\/(?:script|pre|textarea|style)>/i,
    [HTMLMode.cm_2]: /-->/,
    [HTMLMode.cm_3]: /\?>/,
    [HTMLMode.cm_4]: />/,
    [HTMLMode.cm_5]: /\]\]>/,
  });
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #mode;
  get mode() {
    return this.#mode;
  }

  //jjjj TOCLEANUP
  // #l1stText;
  // get l1stText() {
  //   return this.#l1stText;
  // }

  /** chunk tokens, one line one token, may contain `empty` tokens */
  #chunkTk_a: MdextTk[] = [];

  override get children() {
    return undefined;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#chunkTk_a[0];
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#chunkTk_a.at(-1)!;
  }

  /** @const @param mode_x */
  constructor(mode_x: HTMLMode) {
    super();
    this.#mode = mode_x;
    //jjjj TOCLEANUP
    // this.#l1stText = l1stText_x;
  }

  override resetBlock(): this {
    super.resetBlock();
    this.#chunkTk_a.length = 0;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    let ret = 0;
    for (const tk of this.#chunkTk_a) {
      ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }
    return ret;
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    const i_ = this.#chunkTk_a.findIndex((tk) =>
      loc_x.line_$ === (tk.sntFrstLine)
    );
    return i_ >= 0 ? this.#chunkTk_a[i_].sntFrstLidx_1 : -1;
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: MdextTk[]) {
    for (const tk of this.#chunkTk_a) {
      const lidx = tk.sntFrstLidx_1;
      if (lidx > lidx_x) break;
      if (lidx === lidx_x) snt_a_x.push(tk);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    /*#static*/ if (INOUT) {
      assert(this.#chunkTk_a.length);
    }
    const s_a: string[] = [];
    for (const tk of this.#chunkTk_a) {
      s_a.push(tk.getText());
    }
    return s_a.join("\n");
  }
}
/*80--------------------------------------------------------------------------*/
