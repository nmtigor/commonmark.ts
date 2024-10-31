/** 80**************************************************************************
 * @module lib/util/general
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint, uint16 } from "../alias.ts";
import { scrollO } from "../alias.ts";
import "../dom.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x: BlobPart) => new Blob([_x]).size;

/* Not sure if js impls use regexp interning like string. So. */
// const lt_re_ = /[\n\r\u001C-\u001E\u0085\u2029]/g;
/**
 * [Line terminator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#line_terminators)
 */
const lt_re_ = /\r\n|\n|\r|\u2028|\u2029/g;
/**
 * @const @param text_x
 */
export const linesOf = (text_x: string) => text_x.split(lt_re_);
// console.log(linesOf("abc\n\n123\n"));
/*80--------------------------------------------------------------------------*/

/**
 * @const @param _x the UTF-16 code unit value returned by `String.charCodeAt()`
 */
export const isSpaceOrTab = (_x: uint16): boolean =>
  _x === /* " " */ 0x20 || _x === /* "\t" */ 9;

/** @see {@linkcode isSpaceOrTab()} */
export const isLFOr0 = (_x: uint16): boolean =>
  _x === /* "\n" */ 0xA || _x === 0;

/** @see {@linkcode isSpaceOrTab()} */
export const isDecimalDigit = (_x: uint16): boolean => 0x30 <= _x && _x <= 0x39;
/** @see {@linkcode isSpaceOrTab()} */
export const isHexDigit = (_x: uint16): boolean =>
  (0x30 <= _x && _x <= 0x39) || // 0..9
  (0x41 <= _x && _x <= 0x46) || // A..F
  (0x61 <= _x && _x <= 0x66); // a..f
/** @see {@linkcode isSpaceOrTab()} */
export const isOctalDigit = (_x: uint16): boolean => (0x30 <= _x && _x <= 0x37); // 0..7

/** @see {@linkcode isSpaceOrTab()} */
export const isASCIIUpLetter = (
  _x: uint16,
): boolean => (0x41 <= _x && _x <= 0x5A); // A..Z
/** @see {@linkcode isSpaceOrTab()} */
export const isASCIILoLetter = (
  _x: uint16,
): boolean => (0x61 <= _x && _x <= 0x7A); // a..z
/** @see {@linkcode isSpaceOrTab()} */
export const isASCIILetter = (_x: uint16): boolean =>
  isASCIIUpLetter(_x) || isASCIILoLetter(_x);

/** @see {@linkcode isSpaceOrTab()} */
export const isWordLetter = (_x: uint16): boolean =>
  isDecimalDigit(_x) || isASCIILetter(_x) || _x === /* "_" */ 0x5F;

/** @see {@linkcode isSpaceOrTab()} */
export const isASCIIControl = (_x: uint16): boolean =>
  0 <= _x && _x <= 0x1F || _x === 0x7F;

// deno-fmt-ignore
/**
 * [White space](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#white_space)
 */
const ws_a_ = [
  0x9, 0xB, 0xC, 0x20, 0xA0,
  0x0_1680,
  0x0_2000, 0x0_2001, 0x0_2002, 0x0_2003, 0x0_2004, 0x0_2005, 
  0x0_2006, 0x0_2007, 0x0_2008, 0x0_2009, 0x0_200A,
  0x0_202F, 0x0_205F,
  0x0_3000,
  0x0_FEFF,
] as uint16[];
/** @see {@linkcode isSpaceOrTab()} */
export const isWhitespaceUCod = (_x: uint16) => ws_a_.indexOf(_x) >= 0;

// /* Not sure if js impls use regexp interning like string. So. */
// const ws_re_ = /^\s+$/;
// /** */
// export const isWhitespace = (_x: string) => ws_re_.test(_x);
/*80--------------------------------------------------------------------------*/

export const stopPropagation = (evt_x: Event) => {
  evt_x.stopPropagation();
};

/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export const noContextMenu = (evt_x: MouseEvent) => {
  evt_x.preventDefault();
};

export const onWheel = (el_x: Element) => {
  return (evt_x: WheelEvent) => {
    scrollO.top = evt_x.deltaY >= 0 ? 50 : -50;
    scrollO.left = 0;
    el_x.scrollBy(scrollO);
  };
};
/*80--------------------------------------------------------------------------*/

export const domParser = new DOMParser();
//jjjj TOCLEANUP
// const backslashOrAmp_re_ = /[\\&]/;
// export const unescapeStr = (s_x: string) =>
//   backslashOrAmp_re_.test(s_x)
//     ? domParser.parseFromString(s_x, "text/html").textContent ?? ""
//     : s_x;

const textEncoder_ = new TextEncoder();
export const encodeStr = textEncoder_.encode.bind(textEncoder_);

const textDecoder_ = new TextDecoder();
export const decodeABV = textDecoder_.decode.bind(textDecoder_);
/*80--------------------------------------------------------------------------*/

/**
 * Ref. [What is the JavaScript version of sleep()?](https://stackoverflow.com/a/39914235)
 *
 * @param ms time in milliseconds
 */
export const wait = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export const g_abortr = new AbortController();
/*80--------------------------------------------------------------------------*/
