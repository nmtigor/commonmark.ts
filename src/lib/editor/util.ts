/** 80**************************************************************************
 * @module lib/editor/util
 * @license BSD-3-Clause
 ******************************************************************************/

import "../jslang.ts";
/*80--------------------------------------------------------------------------*/

export function sameline_top(rec_x: DOMRect, top_0_x: number) {
  return Number.apxG(rec_x.bottom, top_0_x);
}

export function sameline_bot(rec_x: DOMRect, bot_0_x: number) {
  return Number.apxS(rec_x.top, bot_0_x);
}

export function sameline_left(rec_x: DOMRect, left_0_x: number) {
  return Number.apxG(rec_x.right, left_0_x);
}

export function sameline_rigt(rec_x: DOMRect, rigt_0_x: number) {
  return Number.apxS(rec_x.left, rigt_0_x);
}

export type InlineOf = (rec_x: DOMRect) => number;
export type BlockOf = (rec_x: DOMRect) => number;
export type Sameline = (rec_x: DOMRect, _0_x: number) => boolean;
/*80--------------------------------------------------------------------------*/
