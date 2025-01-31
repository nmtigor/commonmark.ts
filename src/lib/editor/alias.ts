/** 80**************************************************************************
 * @module lib/editor/alias
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Keybinding } from "../../alias.ts";
import { Key } from "../../alias.ts";
import type { ts_t } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

export const enum EdtrType {
  unknown = 1,
  plain,
  set_code,
  mdext_code,
  mdext_rich,
}

export type FSRec = {
  fat: DOMRect;
  sin: DOMRect;
  uts: ts_t;
};
/*80--------------------------------------------------------------------------*/
/* zIndex */

/* Stacking context: EdtrBaseScrolr */
export const Imevu_z = 20; //jjjj TOCHECK
export const Ovlap_proactive_z = 14; //jjjj TOCHECK
export const Ovlap_passive_z = 13; //jjjj TOCHECK
export const EdtrMain_z = 30;
export const Caret_proactive_z = 25;
export const Caret_passive_z = 24;
export const Selec_proactive_z = 23;
export const Selec_passive_z = 22;

//jjjj uses?
export const REP = Object.freeze({
  none: 1,
  insert: 2,
  remove_left: 3,
  remove_rigt: 4,
  replace: 5,
});
/*80--------------------------------------------------------------------------*/

// deno-fmt-ignore
export type EdtrFuncName =
  | "moveCaretLeft" | "moveCaretRigt" | "moveCaretUp" | "moveCaretDown"
  | "moveFocusLeft" | "moveFocusRigt" | "moveFocusUp" | "moveFocusDown"

  | "moveCaretLeftMost" | "moveCaretRigtMost" 
  | "moveCaretUpMost" | "moveCaretDownMost" 
  | "moveFocusLeftMost" | "moveFocusRigtMost" 
  | "moveFocusUpMost" | "moveFocusDownMost"

  /* "Sol": Start of line */
  | "moveCaretSol" | "moveCaretEol" 
  | "moveFocusSol" | "moveFocusEol"

  /* "Sob": Start of buffer */
  | "moveCaretSob" | "moveCaretEob" 
  | "moveFocusSob" | "moveFocusEob"

  | "selectLine" | "selectAll"

  | "undo" | "redo"

  | "cut" | "copy" | "paste"
;

export const enum EdtrState {}

export type EdtrShortcut<N extends string = string> = Map<
  Keybinding,
  N | Record<EdtrState, N>
>;
export const EdtrShortcut_a = [
  [`${Key.ArrowLeft}`, "moveCaretLeft"],
  [`${Key.ArrowRight}`, "moveCaretRigt"],
  [`${Key.ArrowUp}`, "moveCaretUp"],
  [`${Key.ArrowDown}`, "moveCaretDown"],
  [`${Key.Shift}+${Key.ArrowLeft}`, "moveFocusLeft"],
  [`${Key.Shift}+${Key.ArrowRight}`, "moveFocusRigt"],
  [`${Key.Shift}+${Key.ArrowUp}`, "moveFocusUp"],
  [`${Key.Shift}+${Key.ArrowDown}`, "moveFocusDown"],

  [`${Key.Control}+${Key.ArrowLeft}`, "moveCaretLeftMost"],
  [`${Key.Control}+${Key.ArrowRight}`, "moveCaretRigtMost"],
  [`${Key.Control}+${Key.ArrowUp}`, "moveCaretUpMost"],
  [`${Key.Control}+${Key.ArrowDown}`, "moveCaretDownMost"],
  [`${Key.Control}+${Key.Shift}+${Key.ArrowLeft}`, "moveFocusLeftMost"],
  [`${Key.Control}+${Key.Shift}+${Key.ArrowRight}`, "moveFocusRigtMost"],
  [`${Key.Control}+${Key.Shift}+${Key.ArrowUp}`, "moveFocusUpMost"],
  [`${Key.Control}+${Key.Shift}+${Key.ArrowDown}`, "moveFocusDownMost"],

  [`${Key.Home}`, "moveCaretSol"],
  [`${Key.End}`, "moveCaretEol"],
  [`${Key.Shift}+${Key.Home}`, "moveFocusSol"],
  [`${Key.Shift}+${Key.End}`, "moveFocusEol"],

  [`${Key.Control}+${Key.Home}`, "moveCaretSob"],
  [`${Key.Control}+${Key.End}`, "moveCaretEob"],
  [`${Key.Control}+${Key.Shift}+${Key.Home}`, "moveFocusSob"],
  [`${Key.Control}+${Key.Shift}+${Key.End}`, "moveFocusEob"],

  [`${Key.Control}+l`, "selectLine"],
  [`${Key.Control}+a`, "selectAll"],

  [`${Key.Control}+z`, "undo"],
  [`${Key.Control}+Z`, "redo"],

  [`${Key.Control}+x`, "cut"],
  [`${Key.Control}+c`, "copy"],
  [`${Key.Control}+v`, "paste"],
] as const;
export const EdtrShortcut_m: EdtrShortcut<EdtrFuncName> = new Map(
  EdtrShortcut_a,
);
/*80--------------------------------------------------------------------------*/
