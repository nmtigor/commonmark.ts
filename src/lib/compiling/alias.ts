/** 80**************************************************************************
 * @module lib/compiling/alias
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Bidi } from "../Bidi.ts";
import type { uint32 } from "../alias.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { JSLangTok } from "./jslang/JSLangTok.ts";
import type { LaTeXTok } from "./latex/LaTeXTok.ts";
import type { MdextTok } from "./mdext/MdextTok.ts";
import type { PDFTok } from "./pdf/PDFTok.ts";
import type { PlainTok } from "./plain/PlainTok.ts";
import type { RMLTok } from "./rml/RMLTok.ts";
import type { SetTok } from "./set/SetTok.ts";
import type { URITok } from "./uri/URITok.ts";
/*80--------------------------------------------------------------------------*/

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
  | BaseTok
  | PlainTok
  | SetTok
  | URITok
  | MdextTok
  | PDFTok
  | LaTeXTok
  | RMLTok
  | JSLangTok;

export type Bidir = {
  readonly bidi: Bidi;
};
/*80--------------------------------------------------------------------------*/

export const enum Err {
  double_quoted_string = "Double quoted string does not closed.",
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* Set */
  unexpected_token_for_set = "Unexpected token for Set",
  lack_of_closing_paren = "Lack of closing parentheses",
  lack_of_opening_paren = "Lack of opening parentheses",
  /* BinaryOp */
  lack_of_subtract_rhs = "Lack of Subtract rhs",
  lack_of_intersect_rhs = "Lack of Intersect rhs",
  lack_of_union_rhs = "Lack of Union rhs",
  lack_of_err_rhs = "Lack of BinaryErr rhs",
  invalid_binary_op = "Invalid binary op",
  /* Rel */
  unexpected_token_for_rel = "Unexpected token for Rel",
  lack_of_rel_src = "Lack of Rel src",
  lack_of_rel_rel = "Lack of Rel rel",
  lack_of_rel_tgt = "Lack of Rel tgt",
  lack_of_rel_2nd = 'Lack of Rel 2nd joiner ">"',
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* SetextHeading */
  unexpected_close = "Unexpected close",
  /* Link */
  unrecognizable_linkdest = "The link destination is unrecognizable.",
}
/*80--------------------------------------------------------------------------*/
