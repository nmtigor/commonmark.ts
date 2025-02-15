/** 80**************************************************************************
 * @module lib/compiling/Snt
 * @license BSD-3-Clause
 ******************************************************************************/

import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import type { Locval } from "./alias.ts";
import type { Line } from "./Line.ts";
import type { Loc } from "./Loc.ts";
/*80--------------------------------------------------------------------------*/

export type _OldInfo_ = {
  sort: Locval;
  info: string;
};

export class SortedSnt_id<T extends Snt = Snt> extends SortedIdo<T> {
  _repr_(): string[] {
    const ret: _OldInfo_[] = [];
    for (const v of this) ret.push(v._oldInfo_);
    return ret.sort((a_y, b_y) => {
      const lv_a = a_y.sort;
      const lv_b = b_y.sort;
      return lv_a[0] < lv_b[0]
        ? -1
        : lv_a[0] === lv_b[0] && lv_a[1] < lv_b[1]
        ? -1
        : lv_a[1] === lv_b[1]
        ? 0
        : 1;
    }).map((_y) => _y.info);
  }
}
/*64----------------------------------------------------------*/

export abstract class Snt {
  static #ID = 0 as id_t;
  readonly id = ++Snt.#ID as id_t;
  /** @final */
  get _type_id_() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  abstract get sntStrtLoc(): Loc;
  abstract get sntStopLoc(): Loc;

  abstract get sntFrstLine(): Line;
  abstract get sntLastLine(): Line;

  abstract get sntFrstLidx_1(): lnum_t;
  abstract get sntLastLidx_1(): lnum_t;

  abstract get sntStrtLoff(): loff_t;
  abstract get sntStopLoff(): loff_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  toString() {
    return this._type_id_;
  }

  get _oldInfo_(): _OldInfo_ {
    return { sort: [0 as lnum_t, 0], info: "" };
  }
}
/*80--------------------------------------------------------------------------*/
