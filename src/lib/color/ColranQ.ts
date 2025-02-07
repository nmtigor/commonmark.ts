/** 80**************************************************************************
 * @module lib/color/ColranQ
 * @license BSD-3-Clause
 ******************************************************************************/

import { z } from "@zod";
import type { id_t, int, uint } from "../alias.ts";
import { Moo } from "../Moo.ts";
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
export class ColranQ extends Moo<ColranQ> {
  static #ID = 0 as id_t;
  override readonly id = ++ColranQ.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // readonly dim: uint;
  readonly #colran_a: Colran[];
  axis(_x: uint): Colran {
    return this.#colran_a[_x];
  }

  readonly modified_mo = new Moo({
    val: false,
    _name_: `ColranQ_${this.id}.modified_mo`,
  });

  /** @const @param raw_x */
  constructor(raw_x: ColranQRaw) {
    super({ val: null as any });

    // this.dim = raw_x.length;
    this.#colran_a = raw_x.map((_y: ColranRaw) => {
      const ret = new Colran(_y);
      ret.colr_0.registHandler(this.#r);
      ret.colr_1.registHandler(this.#r);
      ret.modified_mo.on(true, this.#onQModified);
      return ret;
    });

    this.set_Moo(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #r = () => {
    this.refreshMoo();
  };

  #onQModified = (_x: boolean) => {
    this.modified_mo.val = _x;
  };

  /** @const */
  get volume() {
    let ret = 1;
    for (const colran of this.#colran_a) {
      ret *= colran.length;
    }
    return ret;
  }

  add() {
    const colran_ = new Colran(createColranRaw());
    colran_.colr_0.registHandler(this.#r);
    colran_.colr_1.registHandler(this.#r);
    colran_.modified_mo.on(true, this.#onQModified);
    this.#colran_a.push(colran_);
  }

  /** @const @param _x */
  delete(_x: int) {
    const deleted_a_ = this.#colran_a.splice(_x, 1);
    if (!deleted_a_.length) return;

    // ! deleted_` should not be shared, so no need to dismantle handlers
    // const deleted_ = deleted_a_[0];
    // deleted_.colr_0.removeHandler(this.#r);
    // deleted_.colr_1.removeHandler(this.#r);
    // deleted_.modified_mo.off(true, this.#onQModified);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON(): ColranQRaw {
    this.modified_mo.set_Moo(false); //!
    return this.#colran_a.map((_y) => _y.toJSON());
  }
}
/*80--------------------------------------------------------------------------*/
