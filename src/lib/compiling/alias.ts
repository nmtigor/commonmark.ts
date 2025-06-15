/** 80**************************************************************************
 * @module lib/compiling/alias
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Chr, Dulstr, lnum_t, loff_t, uint32 } from "../alias.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { JSLangTok } from "./jslang/JSLangTok.ts";
import type { MdextTok } from "./mdext/MdextTok.ts";
import type { PDFTok } from "./pdf/PDFTok.ts";
import type { PlainTok } from "./plain/PlainTok.ts";
import type { RMLTok } from "./rml/RMLTok.ts";
import type { SetTok } from "./set/SetTok.ts";
import type { URITok } from "./uri/URITok.ts";
import type { HTMLTok } from "./html/HTMLTok.ts";
/*80--------------------------------------------------------------------------*/

export type Locval = [lnum_t, loff_t];

/**
 * ! If change `BufrReplState` names, check "ReplActr.ts" first where names are
 * literally used (in order to show xstate graph correctly).
 */
export enum BufrReplState {
  idle = 1,
  prerepl,
  sufrepl,
  sufrepl_edtr,
}

export const enum BufrDoState {
  idle = 1,
  doing,
  undoing,
  redoing,
}

export type sig_t = uint32;

/**
 * BaseTok: [0,100) \
 * PlainTok:  BaseTok ∪ [100,200) \
 * SetTok:    BaseTok ∪ [200,300) \
 * MdextTok:  BaseTok ∪ [300,400) \
 * JSLangTok: BaseTok ∪ [400,600)
 */
export type Tok =
  | BaseTok // <= 100
  | PlainTok // <= 200
  | SetTok // <= 300
  | URITok // <= 400
  | MdextTok // <= 500
  | PDFTok // <= 600
  | RMLTok // <= 800
  | JSLangTok // <= 1000
  | HTMLTok; // <= 1100

/** Dulling map */
export type Dulmap = Map<Chr, Dulstr | Dulstr[]>;
/*80--------------------------------------------------------------------------*/

export const enum Err {
  double_quoted_string_open = "Double quoted string does not closed.",
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* Set */
  set_unexpected_token = "Unexpected token for Set",
  set_no_cloz_paren = "In Set, no closing parentheses.",
  set_no_open_paren = "In Set, no opening parentheses.",

  /* BinaryOp */
  set_subtract_no_rhs = "In Subtract, no rhs.",
  set_intersect_no_rhs = "In Intersect, no rhs.",
  set_union_no_rhs = "In Union, no rhs.",
  set_binaryerr_no_rhs = "In BinaryErr, no rhs.",
  set_invalid_binary_op = "In BinaryOp, binary op is invalid.",

  /* Rel */
  set_rel_unexpected_token = "Unexpected token for Rel",
  set_rel_no_srt = "In Rel of set, no src or rel or tgt.",
  set_rel_no_2nd = 'In Rel of set, no 2nd joiner ">".',
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
  /* mdext */

  mdext_unexpected_close = "Unexpected close for Block of mdext",

  /* Link */
  //jjjj TOCLEANUP
  // unrecognizable_linkdest = "The link destination is unrecognizable.",
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  ipv4_leading_0 = "Redundant leading 0 in one dec-octet field for IPv4",
  ipv4_exceed_255 = "In IPv4, exceed 255 in one dec-octet field.",
  ipv6_no_2nd_colon = 'In IPv6, expect 2nd colon of "::".',
  ipv6_no_enough_h16 = "In IPv6, there are no enough h16.",
  ipv6_no_h16 = "In IPv6, no h16.",
  ip_no_open_bracket = "In IPv6 or IPv7, no opening bracket.",
  ip_no_cloz_bracket = "In IPv6 or IPv7, no closing bracket.",

  uri_invalid_tail = "Invalid tail for URI",

  uri_pathpart_conflict = "In PathPart of uri, path parts conflict.",
  uri_no_authority = "In PathPart of uri, no authority before path-abempty.",
  uri_no_scheme = "In URI, no scheme.",
  uri_unexpected_scheme = "Unexpected token for URI",
}
/*80--------------------------------------------------------------------------*/
