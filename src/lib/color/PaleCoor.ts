/** 80**************************************************************************
 * @module lib/color/PaleCoor
 * @license BSD-3-Clause
 ******************************************************************************/

import { z } from "@zod";
import { INOUT } from "../../global.ts";
import { Moo } from "../Moo.ts";
import type { id_t, int, uint } from "../alias.ts";
import { type Less, SortedArray } from "../util/SortedArray.ts";
import { assert, warn } from "../util/trace.ts";
import { createColr, csscLess, csscname } from "./Colr.ts";
import { ColrFn, type ColrStep, isColrFn, zColrFn } from "./ColrFn.ts";
import { Colran } from "./Colran.ts";
import type { ColranQRaw } from "./ColranQ.ts";
import { ColranQ, createColranQRaw, zColranQRaw } from "./ColranQ.ts";
import { Pale } from "./Pale.ts";
import { type Cssc, zCssc } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/** valid pale name */
export type PaleName = string;
export const zPaleName = z.string();

export type PaleCoorRaw = {
  axes?: PaleName[] | undefined;
  /** Array of ColranQRaw Map */
  qm_a: [ColranQRaw | null, Cssc | ColrStep[]][];
};
export const zPaleCoorRaw = z.object({
  axes: z.union([z.array(zPaleName), z.undefined()]),
  qm_a: z.array(z.tuple([
    z.union([zColranQRaw, z.null()]),
    z.union([zCssc, zColrFn]),
  ])).nonempty(),
});

export function createPaleCoorRaw(): PaleCoorRaw {
  return { qm_a: [[null, "#0000"]] };
}
/*64----------------------------------------------------------*/

type QM_ = [ColranQ | undefined, Cssc | ColrFn];

/**
 * Pale coordinate
 * @final
 */
export class PaleCoor extends Moo<PaleCoor> {
  static #ID = 0 as id_t;
  override readonly id = ++PaleCoor.#ID as id_t;

  /**
   * The same as `PaleCoorRaw.raw` if it's not `undefined`
   * Can be empty
   */
  readonly axes: PaleName[];
  get dim() {
    return this.axes.length;
  }
  // axis(_x: uint): PaleName {
  //   return this.#axes[_x];
  // }

  /**
   * Array of ColranQ Map
   * Nonempty
   */
  // readonly qm_a: [ColranQ | undefined, Cssc | ColrFn][] = [];
  readonly qm_sa = new SortedQM();
  get nQM() {
    return this.qm_sa.length;
  }

  readonly modified_mo = new Moo({
    val: false,
    _name_: `PaleCoor_${this.id}.modified_mo`,
  });
  // /** For `qm_a` and `Cssc | ColrFn` part. Not for `ColranQ` part. */
  // #modified = false;
  // get modified() {
  //   return this.#modified || this.qm_sa.qModified;
  // }

  /* #iQM, #iAx */
  // readonly iQM_mo = new Moo<uint>({ val: 0 });
  #iQM = 0;
  get iQM() {
    return this.#iQM;
  }
  set iQM(_x: uint) {
    this.#iQM = Math.clamp(0, _x, this.nQM - 1);
  }
  // readonly iAx_mo = new Moo<uint>({ val: 0 });
  #iAx: uint | -1 = -1;
  get iAx() {
    return this.#iAx;
  }
  set iAx(_x: uint | -1) {
    this.#iAx = Math.clamp(-1, _x, this.dim - 1);
  }
  getDepname(): PaleName {
    return this.axes[this.#iAx];
  }
  getColran(): Colran | undefined {
    const q_ = this.qm_sa[this.#iQM][0];
    return q_?.axis(this.#iAx);
  }
  /* ~ */

  readonly sample_c = csscname("red");
  readonly #sampleMapped_c = csscname("red");

  /** Helper */
  readonly #colr = createColr();
  /** Helper */
  #iQM_1 = -1;
  readonly mapped_c = csscname("red");

  /**
   * @const @param raw_x
   */
  constructor(raw_x: PaleCoorRaw) {
    super({ val: null as any });

    this.axes = raw_x.axes ?? [];
    if (this.dim > 0) this.#iAx = 0;
    for (const palename of this.axes) {
      const p_ = Pale.get(palename);
      p_.registCsscHandler(this.#upR);
    }
    for (const qm of raw_x.qm_a) {
      const qraw = qm[0] ?? undefined;
      if (qraw === undefined || this.dim === qraw.length) {
        const q_ = qraw ? new ColranQ(qraw) : undefined;
        this.qm_sa.add([q_, Array.isArray(qm[1]) ? new ColrFn(qm[1]) : qm[1]]);
        q_?.on(q_, this.#upR);
        q_?.modified_mo.on(true, this.#onQModified);
      } else {
        this.modified_mo.val = true;
      }
    }

    this.sample().update().setMoo(this);
  }

  #upR = () => {
    this.update().refreshMoo();
  };

  #onQModified = (_x: boolean) => {
    this.modified_mo.val = _x;
  };

  /**
   * No business with `#iAx`
   */
  getMapped(iQM_x = this.#iQM): Cssc | ColrFn {
    return this.qm_sa[iQM_x][1];
  }
  setMapped(_x: Cssc | ColrFn) {
    if (isColrFn(_x) && this.dim !== 1) {
      this.sample_c.setByCssc("red");
      this.#sampleMapped_c.setByCssc("red");
      warn(
        `Ignore setting ColrFn "${_x.repr()}" to PaleCoor_${this.id} with dim ${this.dim}`,
      );
      return;
    }

    this.qm_sa[this.#iQM][1] = _x;
    // if (this.#iQM === this.#iQM) {
    //   this.mapped_c.setByCssc(_x);
    //   this.refresh();
    // }
    this.#upR();
    this.modified_mo.val = true;
  }

  #validateQM(qm_x: QM_) {
    qm_x[1] = "red";
    this.modified_mo.val = true;
  }

  /**
   * Assign `sample_c`, `#sampleMapped_c`
   * ! No business with `#iAx`
   */
  sample(): this {
    const sampleMapped_ = this.getMapped();
    if (isColrFn(sampleMapped_)) {
      if (this.dim === 1) {
        const colran_ = this.getColran();
        if (colran_) {
          colran_.sample(this.sample_c);
          this.#sampleMapped_c.setByColr(this.sample_c);
          sampleMapped_.get(this.#sampleMapped_c);
        } else {
          this.#validateQM(this.qm_sa[this.#iQM]);
        }
      } else {
        this.#validateQM(this.qm_sa[this.#iQM]);
      }
    } else {
      this.#sampleMapped_c.setByCssc(sampleMapped_);
    }
    return this;
  }

  /**
   * Assign `mapped_c`
   * No business with `#iQM`, `#iAx`
   */
  update(): this {
    let contain_0 = false;
    if (this.dim === 0) {
      contain_0 = true;
      this.#iQM_1 = 0;
      const qm_ = this.qm_sa[0];
      if (isColrFn(qm_[1])) this.#validateQM(qm_);
      this.mapped_c.setByCssc(qm_[1] as Cssc);
    } else if (this.dim === 1) {
      this.#colr.setByCssc(Pale.get(this.axes[0]).cssc);
      for (let i = 0; i < this.nQM; ++i) {
        const qm = this.qm_sa[i];
        if (qm[0] === undefined || qm[0].axis(0).contain(this.#colr)) {
          contain_0 = true;
          this.#iQM_1 = i;
          if (isColrFn(qm[1])) {
            this.mapped_c.setByColr(this.#colr);
            qm[1].get(this.mapped_c);
          } else {
            this.mapped_c.setByCssc(qm[1]);
          }
          break;
        }
      }
    } else {
      for (let i = 0; i < this.nQM; ++i) {
        const qm_ = this.qm_sa[i];
        if (qm_[0] === undefined) {
          contain_0 = true;
          this.#iQM_1 = i;
          if (isColrFn(qm_[1])) this.#validateQM(qm_);
          this.mapped_c.setByCssc(qm_[1] as Cssc);
          break;
        }

        let contain_1 = true;
        for (let d = this.dim; d--;) {
          this.#colr.setByCssc(Pale.get(this.axes[d]).cssc);
          if (!qm_[0].axis(d).contain(this.#colr)) {
            contain_1 = false;
            break;
          }
        }
        if (contain_1) {
          contain_0 = true;
          this.#iQM_1 = i;
          if (isColrFn(qm_[1])) this.#validateQM(qm_);
          this.mapped_c.setByCssc(qm_[1] as Cssc);
          break;
        }
      }
    }
    if (!contain_0) this.mapped_c.setByCssc("red");
    return this;
  }
  /*49-----------------------------------------*/

  /**
   * @const @param iQM_x
   */
  toggleQM(iQM_x: uint): boolean {
    /*#static*/ if (INOUT) {
      assert(0 <= iQM_x && iQM_x < this.nQM);
    }
    let resample_ = false;
    const qm_ = this.qm_sa[iQM_x];
    if (qm_[0]) {
      // ! qm_[0]` should not be shared, so no need to dismantle handlers
      qm_[0] = undefined;
    } else {
      const q_ = new ColranQ(createColranQRaw(this.dim));
      q_.on(q_, this.#upR);
      q_.modified_mo.on(true, this.#onQModified);
      qm_[0] = q_;
    }

    if (iQM_x === this.#iQM) {
      // no need to re-`sample()` here
      // this.sample();
      resample_ = true;
    }
    this.#upR();
    this.modified_mo.val = true;

    return resample_;
  }

  /**
   * @headconst @param qraw_x
   * @const @param cssc_x
   */
  addQM(qraw_x: ColranQRaw | undefined, cssc_x: Cssc) {
    const q_ = qraw_x ? new ColranQ(qraw_x) : undefined;
    const i_ = this.qm_sa.add([q_, cssc_x]);
    /*#static*/ if (INOUT) {
      assert(i_ >= 0);
    }
    q_?.on(q_, this.#upR);
    q_?.modified_mo.on(true, this.#onQModified);

    if (i_ <= this.#iQM) {
      this.#iQM += 1;
    }
    this.#upR();
    this.modified_mo.val = true;
  }

  /**
   * @const @param iQM_x
   */
  deleteQM(iQM_x: uint): boolean {
    /*#static*/ if (INOUT) {
      assert(2 <= this.nQM);
      assert(0 <= iQM_x && iQM_x < this.nQM);
    }
    let resample_ = false;
    // ! q_` should not be shared, so no need to dismantle handlers
    // const q_ = this.qm_sa.get(iQM_x)[0];
    // q_?.off(q_, this.#upR);
    // q_?.modified_mo.off(true, this.#onQModified);
    this.qm_sa.deleteByIndex(iQM_x);

    if (iQM_x < this.#iQM) {
      this.#iQM -= 1;
    } else if (iQM_x === this.#iQM) {
      if (iQM_x >= this.nQM) this.#iQM = this.nQM - 1;
      // no need to re-`sample()` here
      // this.sample();
      resample_ = true;
    }
    this.#upR();
    this.modified_mo.val = true;

    return resample_;
  }

  /**
   * @const @param iAx_x
   * @const @param palename_x
   */
  changeAx(iAx_x: uint, palename_x: PaleName) {
    /*#static*/ if (INOUT) {
      assert(0 <= iAx_x && iAx_x < this.dim);
    }
    let p_ = Pale.get(this.axes[iAx_x]);
    p_.removeCsscHandler(this.#upR);
    p_ = Pale.get(palename_x);
    p_.registCsscHandler(this.#upR);
    this.axes[iAx_x] = palename_x;

    this.#upR();
    this.modified_mo.val = true;
  }

  /**
   * Always append to the end of `axes`
   * @const @param palename_x
   */
  addAx(palename_x: PaleName): boolean {
    /*#static*/ if (INOUT) {
      assert(!this.axes.includes(palename_x));
    }
    let resample_ = false;
    this.axes.push(palename_x);
    Pale.get(palename_x).registCsscHandler(this.#upR);
    for (const qm of this.qm_sa) {
      qm[0]?.add();
    }

    if (this.dim === 1) {
      this.#iAx = 0;
    }
    if (this.dim === 2 && isColrFn(this.getMapped())) {
      // no need to re-`sample()` here
      // this.sample();
      resample_ = true;
    }
    this.#upR();
    this.modified_mo.val = true;

    return resample_;
  }

  /**
   * @const @param iAx_x
   */
  deleteAx(iAx_x: uint): boolean {
    /*#static*/ if (INOUT) {
      assert(0 <= iAx_x && iAx_x < this.dim);
    }
    let resample_ = false;
    if (this.dim === 1) {
      for (const qm of this.qm_sa) qm[0] = undefined;
    } else {
      for (const qm of this.qm_sa) qm[0]?.delete(iAx_x);
    }
    Pale.get(this.axes[iAx_x]).removeCsscHandler(this.#upR);
    this.axes.splice(iAx_x, 1);

    if (iAx_x < this.#iAx) {
      this.#iAx -= 1;
    } else if (iAx_x === this.#iAx) {
      // This includes the case `dim` changes from 1 to 0, which could
      // invalidate the current "qm"
      if (iAx_x >= this.dim) this.#iAx = this.dim - 1;
      // no need to re-`sample()` here
      // this.sample();
      resample_ = true;
    }
    this.#upR();
    this.modified_mo.val = true;

    return resample_;
  }
  /*49-----------------------------------------*/

  toJSON(): PaleCoorRaw {
    this.modified_mo.setMoo(false); //!
    return {
      axes: this.axes.length ? this.axes : undefined,
      qm_a: this.qm_sa as any,
    };
  }
}

/** @final */
class SortedQM extends SortedArray<QM_> {
  /**
   * Regard `undefined` as volume `Infinity`, i.e., last element
   */
  static #less: Less<QM_> = (a_x, b_x) => {
    let vol_a_: number | undefined,
      vol_b_: number | undefined;
    if (
      a_x[0] === undefined && b_x[0] === undefined ||
      a_x[0] !== undefined && b_x[0] !== undefined &&
        Number.apxE(vol_a_ = a_x[0].volume, vol_b_ = b_x[0].volume)
    ) {
      if (isColrFn(a_x[1]) && isColrFn(b_x[1])) {
        return a_x[1].id < b_x[1].id;
      } else if (!isColrFn(a_x[1]) && !isColrFn(b_x[1])) {
        return csscLess(a_x[1], b_x[1]);
      } else {
        return isColrFn(b_x[1]);
      }
    } else {
      return b_x[0] === undefined || Number.apxS(vol_a_!, vol_b_!);
    }
  };

  constructor() {
    super(SortedQM.#less);
  }

  // /**
  //  * @return return the index of the deleted;
  //  *    if not exist, return `-1`
  //  */
  // delQ(_x: ColranQ) {
  //   const ret = this.val_a$.findIndex((_y) => _y[0] === _x);
  //   return ret >= 0 ? this.deleteByIndex(ret) : ret;
  // }

  // override toJSON() {
  //   return this.val_a$.map((qm) => [qm[0], qm[1]]);
  // }
}
/*80--------------------------------------------------------------------------*/
