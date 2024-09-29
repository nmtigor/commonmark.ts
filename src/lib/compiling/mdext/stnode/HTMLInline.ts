/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/HTMLInline
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextTk } from "../../Token.ts";
import { _escapeXml } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

const TAGNAME_ = "[A-Za-z][0-9A-Za-z-]*";
const ATTRIBUTENAME_ = "[A-Za-z_:][\\w:.-]*";
const ATTRIBUTEVALUE_ = `(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*")`;
const ATTRIBUTEVALUESPEC_ = `(?:[ \t\n]*=[ \t\n]*${ATTRIBUTEVALUE_})`;
const ATTRIBUTE_ = `(?:[ \t\n]+${ATTRIBUTENAME_}${ATTRIBUTEVALUESPEC_}?)`;
const OPENTAG_ = `<${TAGNAME_}${ATTRIBUTE_}*[ \t\n]*/?>`;
const CLOZTAG_ = `</${TAGNAME_}[ \t\n]*>`;
const COMMENT_ = "<!-->|<!--->|<!--[\\s\\S]*?-->";
/** Processing Instruction */
const PI_ = "<[?][\\s\\S]*?[?]>";
const DECL_ = `<![A-Za-z]+[^>]*>`;
const CDATA_ = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";

/** @final */
export class HTMLInline extends Inline {
  /** reHtmlTag */
  static readonly HTMLTag_re = new RegExp(
    `^(?:${OPENTAG_}|${CLOZTAG_}|${COMMENT_}|${PI_}|${DECL_}|${CDATA_})`,
  );

  #frstTk;
  #chunkTk_a;
  #lastTk;

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
   * @headconst @param chunkTk_a_x
   * @headconst @param lastTk_x
   */
  constructor(frstTk_x: MdextTk, chunkTk_a_x: MdextTk[], lastTk_x: MdextTk) {
    super();
    this.#frstTk = frstTk_x;
    this.#chunkTk_a = chunkTk_a_x;
    this.#lastTk = lastTk_x;

    this.frstBdryTk;
    this.lastBdryTk;
    /*#static*/ if (INOUT) {
      assert(this.#chunkTk_a.length);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  tokenAt(loc_x: Loc): MdextTk {
    if (this.#lastTk.touch(loc_x)) return this.#lastTk;

    for (let i = this.#chunkTk_a.length; i--;) {
      const tk_ = this.#chunkTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }

    if (this.#frstTk.touch(loc_x)) return this.#frstTk;

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    const s_a = ["<"];
    let curLn = this.#chunkTk_a[0].frstLine;
    for (const tk of this.#chunkTk_a) {
      const ln_ = tk.frstLine;
      if (ln_ !== curLn) {
        curLn = ln_;
        s_a.push("\n");
      }
      s_a.push(tk.getText());
    }
    s_a.push(">");
    return s_a.join("");
  }
}
/*80--------------------------------------------------------------------------*/
