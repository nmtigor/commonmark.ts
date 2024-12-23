/** 80**************************************************************************
 * @module lib/compiling/Snt
 * @license BSD-3-Clause
 ******************************************************************************/

import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import type { Line } from "./Line.ts";
import type { Loc } from "./Loc.ts";
/*80--------------------------------------------------------------------------*/

export class SortedSnt_id extends SortedIdo<Snt> {
  _repr(): string[] {
    const ret: string[] = [];
    for (const v of this) ret.push(v._oldInfo);
    return ret;
  }
}

export abstract class Snt {
  static #ID = 0 as id_t;
  readonly id = ++Snt.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

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
    return this._type_id;
  }

  get _oldInfo(): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
