/** 80**************************************************************************
 * @module lib/color/ColranQ
 * @license BSD-3-Clause
 ******************************************************************************/

import { z } from "@zod";
import type { id_t, int, uint } from "../alias.ts";
import { Boor, Runr } from "../Moo.ts";
import {
  Colran,
  type ColranRaw,
  createColranRaw,
  zColranRaw,
} from "./Colran.ts";
/*80--------------------------------------------------------------------------*/

export type ColranQRaw = ColranRaw[];
export const zColranQRaw = z.array(zColranRaw).nonempty();

export function createColranQRaw(dim_x: uint): ColranQRaw {
  return new Array(dim_x).fill(createColranRaw());
}
/*64----------------------------------------------------------*/

/**
 * Color range cuboid
 * @final
 */
export class ColranQ extends Runr<unknown, ColranQ> {
  static #ID = 0 as id_t;
  readonly id = ++ColranQ.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // readonly dim: uint;
  readonly #colran_a: Colran[];
  axis(_x: uint): Colran {
    return this.#colran_a[_x];
  }

  readonly modified_br_ColranQ = new Boor({
    val: false,
    _name_: `ColranQ_${this.id}.modified_br`,
  });

  /** @const @param raw_x */
  constructor(raw_x: ColranQRaw) {
    super();
    this.info = this;

    // this.dim = raw_x.length;
    this.#colran_a = raw_x.map((_y: ColranRaw) => {
      const ret = new Colran(_y);
      ret.min_c.registHandler(this.#r);
      ret.max_c.registHandler(this.#r);
      ret.modified_br_Colran.onTru(this.#onQModified);
      return ret;
    });
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #r = () => {
    this.run();
  };

  #onQModified = (_x: boolean) => {
    this.modified_br_ColranQ.val = _x;
  };

  /** @const */
  get volume() {
    let ret = 1;
    for (const colran of this.#colran_a) {
      ret *= colran.length;
    }
    return ret;
  }

  addColran() {
    const colran_ = new Colran(createColranRaw());
    colran_.min_c.registHandler(this.#r);
    colran_.max_c.registHandler(this.#r);
    colran_.modified_br_Colran.onTru(this.#onQModified);
    this.#colran_a.push(colran_);
  }

  /** @const @param _x */
  delColran(_x: int) {
    const deleted_a_ = this.#colran_a.splice(_x, 1);
    if (!deleted_a_.length) return;

    // ! deleted_` should not be shared, so no need to dismantle handlers
    // const deleted_ = deleted_a_[0];
    // deleted_.min_c.removeHandler(this.#r);
    // deleted_.max_c.removeHandler(this.#r);
    // deleted_.modified_mo.off(true, this.#onQModified);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON(): ColranQRaw {
    this.modified_br_ColranQ.set_Boor(false); //!
    return this.#colran_a.map((_y) => _y.toJSON());
  }
}
/*80--------------------------------------------------------------------------*/
