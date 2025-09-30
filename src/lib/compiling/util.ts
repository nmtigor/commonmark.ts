/** 80**************************************************************************
 * @module lib/compiling/util
 * @license BSD-3-Clause
 ******************************************************************************/

import * as Is from "@fe-lib/util/is.ts";
import { INOUT } from "@fe-src/preNs.ts";
import type { loff_t, uint16 } from "../alias.ts";
import { assert } from "../util.ts";
import type { Line } from "./Line.ts";
/*80--------------------------------------------------------------------------*/

/**
 * @const @param ucod_x
 * @const @param ln_x
 * @const @param strt_x
 * @const @param stop_x
 */
export const frstNon = (
  ucod_x: uint16 | uint16[] | ((_: uint16) => boolean),
  ln_x: Line,
  strt_x: loff_t = 0,
  stop_x: loff_t = ln_x.uchrLen,
): loff_t => {
  /*#static*/ if (INOUT) {
    assert(strt_x <= stop_x);
  }
  let i_ = strt_x;
  if (Is.func(ucod_x)) {
    for (; i_ < stop_x; ++i_) {
      if (!ucod_x(ln_x.ucodAt(i_))) break;
    }
  } else if (Is.array(ucod_x)) {
    for (; i_ < stop_x; ++i_) {
      if (!ucod_x.includes(ln_x.ucodAt(i_))) break;
    }
  } else {
    for (; i_ < stop_x; ++i_) {
      if (ln_x.ucodAt(i_) !== ucod_x) break;
    }
  }
  return i_;
};
/*64----------------------------------------------------------*/

/**
 * @const @param ucod_x
 * @const @param ln_x
 * @const @param strt_x
 * @const @param stop_x
 */
export const lastNon = (
  ucod_x: uint16 | uint16[] | ((_: uint16) => boolean),
  ln_x: Line,
  strt_x: loff_t = 0,
  stop_x: loff_t = ln_x.uchrLen,
): loff_t | -1 => {
  /*#static*/ if (INOUT) {
    assert(strt_x <= stop_x);
  }
  let i_ = stop_x - 1;
  if (Is.func(ucod_x)) {
    for (; i_ >= strt_x; --i_) {
      if (!ucod_x(ln_x.ucodAt(i_))) break;
    }
  } else if (Is.array(ucod_x)) {
    for (; i_ >= strt_x; --i_) {
      if (!ucod_x.includes(ln_x.ucodAt(i_))) break;
    }
  } else {
    for (; i_ >= strt_x; --i_) {
      if (ln_x.ucodAt(i_) !== ucod_x) break;
    }
  }
  return i_;
};
/*80--------------------------------------------------------------------------*/
