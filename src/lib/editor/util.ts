/** 80**************************************************************************
 * @module lib/editor/util
 * @license BSD-3-Clause
 ******************************************************************************/

import { WritingDir, type WritingMode } from "../alias.ts";
import "../jslang.ts";
/*80--------------------------------------------------------------------------*/

export const samerow_top = (
  rec_x: DOMRect,
  top_0_x: number,
  strict_x?: "strict",
) => {
  return Number.apxG(rec_x.bottom, top_0_x) &&
    (!strict_x || Number.apxSE(rec_x.top, top_0_x));
};

export const samerow_bot = (
  rec_x: DOMRect,
  bot_0_x: number,
  strict_x?: "strict",
) => {
  return Number.apxS(rec_x.top, bot_0_x) &&
    (!strict_x || Number.apxGE(rec_x.bottom, bot_0_x));
};

export const samerow_left = (
  rec_x: DOMRect,
  left_0_x: number,
  strict_x?: "strict",
) => {
  return Number.apxG(rec_x.right, left_0_x) &&
    (!strict_x || Number.apxSE(rec_x.left, left_0_x));
};

export const samerow_rigt = (
  rec_x: DOMRect,
  rigt_0_x: number,
  strict_x?: "strict",
) => {
  return Number.apxS(rec_x.left, rigt_0_x) &&
    (!strict_x || Number.apxGE(rec_x.right, rigt_0_x));
};

export type InlineOf = (rec_x: DOMRect) => number;
export type BlockOf = (rec_x: DOMRect) => number;
export type SameRow = (
  rec_x: DOMRect,
  _0_x: number,
  strict_x?: "strict",
) => boolean;

export const genInlineMidOf = (wm_x: WritingMode) => {
  return wm_x & WritingDir.h
    ? (rec_y: DOMRect) => (rec_y.left + rec_y.right) / 2
    : (rec_y: DOMRect) => (rec_y.top + rec_y.bottom) / 2;
};
/*80--------------------------------------------------------------------------*/
