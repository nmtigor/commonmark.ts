/** 80**************************************************************************
 * @module lib/compiling/mdext/util
 * @license BSD-3-Clause
 ******************************************************************************/

import type { loff_t, uint, uint16 } from "../../alias.ts";
import { domParser } from "../../util/dom.ts";
import {
  isASCIILetter,
  isDecimalDigit,
  isHexDigit,
} from "../../util/string.ts";
import { BaseTok } from "../BaseTok.ts";
import type { Line } from "../Line.ts";
import type { Loc } from "../Loc.ts";
import { SortedSnt_id } from "../Snt.ts";
import { Token } from "../Token.ts";
import type { MdextTk } from "../Token.ts";
import { frstNon, lastNon } from "../util.ts";
import type { MdextLexr } from "./MdextLexr.ts";
import { Block } from "./stnode/Block.ts";
import type { Inline } from "./stnode/Inline.ts";
/*80--------------------------------------------------------------------------*/

const ws_a_ = [/* "\t" */ 9, /* " " */ 0x20] as uint16[];

/**
 * @const @param ln_x
 * @const @param strt_x
 * @const @param stop_x
 */
export const frstNonblankIn = (
  ln_x: Line,
  strt_x: loff_t = 0,
  stop_x: loff_t = ln_x.uchrLen,
): loff_t => {
  return frstNon(ws_a_, ln_x, strt_x, stop_x);
};

/** @const @param loc_x */
export const blankEnd = (loc_x: Loc): boolean => {
  const ln_ = loc_x.line_$;
  return frstNonblankIn(ln_, loc_x.loff_$) === ln_.uchrLen;
};

/** @see {@linkcode frstNonblankIn()} */
export const lastNonblankIn = (
  ln_x: Line,
  strt_x: loff_t = 0,
  stop_x: loff_t = ln_x.uchrLen,
): loff_t | -1 => {
  return lastNon(ws_a_, ln_x, strt_x, stop_x);
};

/** @see {@linkcode frstNonblankIn()} */
export const lastNonhashIn = (
  ln_x: Line,
  strt_x: loff_t = 0,
  stop_x: loff_t = ln_x.uchrLen,
): loff_t => {
  return lastNon(/* "#" */ 0x23 as uint16, ln_x, strt_x, stop_x);
};

/**
 * reEntityHere
 * @const @param loc_x
 */
export const entitySizeAt = (loc_x: Loc): loff_t => {
  const ln_ = loc_x.line_$;
  let i_ = loc_x.loff_$;
  if (ln_.ucodAt(i_) !== /* "&" */ 0x26) return 0;

  const iI = ln_.uchrLen;
  let uc_ = ln_.ucodAt(++i_);
  if (uc_ === /* "#" */ 0x23) {
    uc_ = ln_.ucodAt(++i_);
    if (uc_ === /* "X" */ 0x58 || uc_ === /* "x" */ 0x78) {
      const i_0 = ++i_;
      for (; i_ < iI; ++i_) {
        uc_ = ln_.ucodAt(i_);
        if (uc_ === /* ";" */ 0x3B || !isHexDigit(uc_)) break;
      }
      if (uc_ !== /* ";" */ 0x3B || i_ - i_0 > 6) i_ = loc_x.loff_$;
      else ++i_;
    } else {
      const i_0 = i_;
      for (; i_ < iI; ++i_) {
        uc_ = ln_.ucodAt(i_);
        if (uc_ === /* ";" */ 0x3B || !isDecimalDigit(uc_)) break;
      }
      if (uc_ !== /* ";" */ 0x3B || i_ - i_0 > 7) i_ = loc_x.loff_$;
      else ++i_;
    }
  } else {
    const i_0 = i_;
    for (; i_ < iI; ++i_) {
      uc_ = ln_.ucodAt(i_);
      if (i_ === i_0) {
        if (!isASCIILetter(uc_)) break;
      } else {
        if (
          uc_ === /* ";" */ 0x3B ||
          !isASCIILetter(uc_) && !isDecimalDigit(uc_)
        ) break;
      }
    }
    if (uc_ !== /* ";" */ 0x3B || i_ - i_0 > 31) i_ = loc_x.loff_$;
    else ++i_;
  }
  return i_ - loc_x.loff_$;
};
/*64----------------------------------------------------------*/

const reXmlSpecial = /[&<>"]/g;
export const _escapeXml = (s_x: string) =>
  reXmlSpecial.test(s_x)
    ? s_x.replace(reXmlSpecial, (s_y) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[s_y]!
    ))
    : s_x;

export const _toHTML = (
  lexr_x: MdextLexr,
  snt_a?: (MdextTk | Inline | Block)[],
): string => {
  if (!snt_a || snt_a.length === 0) return "";

  const s_a: string[] = [];
  let curLn = snt_a[0].sntFrstLine;
  let s_;
  /** sum of `snt` Lengths in the front of a line */
  let sntL = 0;
  for (let i = 0, iI = snt_a.length; i < iI; ++i) {
    const snt_i = snt_a[i];
    const ln_ = snt_i.sntFrstLine;
    if (ln_ === curLn) {
      let prevStop;
      if (i > 0 && (prevStop = snt_a[i - 1].sntStopLoff) < snt_i.sntStrtLoff) {
        sntL += snt_i.sntStrtLoff - prevStop;
        s_a.push(ln_.text.slice(prevStop, snt_i.sntStrtLoff));
      }
    } else {
      // if (!(snt_i instanceof Block) && sntL) s_a.push("\n");
      if (sntL) s_a.push("\n");
      sntL = 0;
    }
    s_ = snt_i instanceof Token
      ? _escapeXml(snt_i.getText())
      : snt_i._toHTML(lexr_x);
    if (s_) {
      sntL += s_.length;
      s_a.push(s_);
      // if (snt_i instanceof Block && i !== iI - 1) s_a.push("\n");
    }
    curLn = snt_i.sntLastLine;
  }
  if (s_a.at(-1) === "\n") s_a.pop();
  return s_a.join("");
};

const reBackslashOrAmp = /[\\&]/;
const reEntityOrEscapedChar =
  /\\[!"#$%&'()*+,.\/:;<=>?@\[\\\]^_`{|}~-]|&(?:#x[a-f0-9]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/gi;
//jjjj TOCLEANUP
// const textArea_ = html("textarea");
export const _unescapeString = (s_x: string) =>
  reBackslashOrAmp.test(s_x)
    ? s_x.replace(
      reEntityOrEscapedChar,
      (s_y) =>
        s_y.charCodeAt(0) === /* "\\" */ 0x5C
          ? s_y.charAt(1)
          : domParser.parseFromString(s_y, "text/html").textContent ?? "",
    )
    : s_x;

const reUnsafeProtocol = /^javascript:|vbscript:|file:|data:/i;
const reSafeDataProtocol = /^data:image\/(?:png|gif|jpeg|webp)/i;
//kkkk
export const _isSafeURL = (url: string): boolean => {
  return !reUnsafeProtocol.test(url) || reSafeDataProtocol.test(url);
};

/** Helper function to produce an HTML tag. */
export const _tag = (
  name: string,
  attrs?: [k: string, v: string | number][],
  selfclosing = false,
): string => {
  const s_a = [`<${name}`];
  if (attrs?.length) {
    for (let i = 0, iI = attrs.length; i < iI; ++i) {
      s_a.push(` ${attrs[i][0]}="${attrs[i][1]}"`);
    }
  }
  s_a.push(selfclosing ? " />" : ">");
  return s_a.join("");
};
/*64----------------------------------------------------------*/

/**
 * @borrow @primaryconst @param tk_x
 * @borrow @primaryconst @param drtStrtLoc_x
 * @borrow @primaryconst @param drtStopLoc_x
 * @out @param unrelSnt_sa_x
 * @return count of what's gathered
 */
export const gathrUnrelTk_$ = (
  tk_x: MdextTk,
  drtStrtLoc_x: Loc,
  drtStopLoc_x: Loc,
  unrelSnt_sa_x: SortedSnt_id,
): uint => {
  let ret = 0;
  if (
    tk_x.value !== BaseTok.unknown &&
    (tk_x.sntStopLoc.posSE(drtStrtLoc_x) ||
      tk_x.sntStrtLoc.posGE(drtStopLoc_x))
  ) {
    unrelSnt_sa_x.add(tk_x);
    ret = 1;
  }
  return ret;
};
/*80--------------------------------------------------------------------------*/
