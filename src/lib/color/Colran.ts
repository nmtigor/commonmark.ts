/** 80**************************************************************************
 * @module lib/color/Colran
 * @license BSD-3-Clause
 ******************************************************************************/

import { bind, traceOut } from "@fe-lib/util/trace.ts";
import { z } from "@zod";
import { _TRACE, global, THEMESETTING } from "../../global.ts";
import { id_t } from "../alias.ts";
import { Boor } from "../Moo.ts";
import type { alpha_t, chroma_t, hue_t, red_t, tone_t } from "./alias.ts";
import { zAlpha, zChroma, zHue, zRed, zTone } from "./alias.ts";
import type { Colr, ColranTyp } from "./Colr.ts";
import { hct, rgb } from "./Colr.ts";
/*80--------------------------------------------------------------------------*/

type RedRan_ = [min: red_t, max: red_t];
const zRedRan_ = z.tuple([zRed, zRed]);

type RGBRan_ = [r: RedRan_, g: RedRan_, b: RedRan_];
const zRGBRan_ = z.tuple([zRedRan_, zRedRan_, zRedRan_]);

type HueRan_ = [min: hue_t, max: hue_t];
const zHueRan_ = z.tuple([zHue, zHue]);

type ChromaRan_ = [min: chroma_t, max: chroma_t];
const zChromaRan_ = z.tuple([zChroma, zChroma]);

type ToneRan_ = [min: tone_t, max: tone_t];
const zToneRan_ = z.tuple([zTone, zTone]);

type HCTRan_ = [h: HueRan_, c: ChromaRan_, t: ToneRan_];
const zHCTRan_ = z.tuple([zHueRan_, zChromaRan_, zToneRan_]);

type AlphaRan_ = [min: alpha_t, max: alpha_t];
const zAlphaRan_ = z.tuple([zAlpha, zAlpha]);

type RGBARan_ = [r: RedRan_, g: RedRan_, b: RedRan_, a: AlphaRan_];
const zRGBARan_ = z.tuple([zRedRan_, zRedRan_, zRedRan_, zAlphaRan_]);

type HCTARan_ = [h: HueRan_, c: ChromaRan_, t: ToneRan_, a: AlphaRan_];
const zHCTARan_ = z.tuple([zHueRan_, zChromaRan_, zToneRan_, zAlphaRan_]);

export type ColranRaw =
  | ["rgb", RGBRan_]
  | ["rgba", RGBARan_]
  | ["hct", HCTRan_]
  | ["hcta", HCTARan_];
export const zColranRaw = z.union([
  z.tuple([z.literal("rgb"), zRGBRan_]),
  z.tuple([z.literal("rgba"), zRGBARan_]),
  z.tuple([z.literal("hct"), zHCTRan_]),
  z.tuple([z.literal("hcta"), zHCTARan_]),
]);

export function createColranRaw(): ColranRaw {
  return ["rgb", [[0, 255], [0, 255], [0, 255]]];
}

// const enum CRan_ {
//   min = 0,
//   max = 1,
// }
/*64----------------------------------------------------------*/

/**
 * Color range
 * @final
 */
export class Colran {
  static #ID = 0 as id_t;
  readonly id = ++Colran.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #typ: ColranTyp;
  get typ() {
    return this.#typ;
  }

  readonly #redran: RedRan_ = [0, 0];
  readonly #greenran: RedRan_ = [0, 0];
  readonly #blueran: RedRan_ = [0, 0];

  readonly #hueran: HueRan_ = [0, 0];
  readonly #chromaran: ChromaRan_ = [0, 0];
  readonly #toneran: ToneRan_ = [0, 0];

  readonly #alpharan: AlphaRan_ = [0, 0];

  readonly min_c;
  readonly max_c;

  readonly modified_br_Colran = new Boor({
    val: false,
    _name_: `Colran_${this.id}.modified_br`,
  });

  /** @const @param raw_x */
  constructor(raw_x: ColranRaw) {
    this.#typ = raw_x[0];
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      this.#redran[0] = raw_x[1][0][0];
      this.#redran[1] = raw_x[1][0][1];
      this.#greenran[0] = raw_x[1][1][0];
      this.#greenran[1] = raw_x[1][1][1];
      this.#blueran[0] = raw_x[1][2][0];
      this.#blueran[1] = raw_x[1][2][1];
    } else {
      this.#hueran[0] = raw_x[1][0][0];
      this.#hueran[1] = raw_x[1][0][1];
      this.#chromaran[0] = raw_x[1][1][0];
      this.#chromaran[1] = raw_x[1][1][1];
      this.#toneran[0] = raw_x[1][2][0];
      this.#toneran[1] = raw_x[1][2][1];
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      this.#alpharan[0] = raw_x[1][3]![0];
      this.#alpharan[1] = raw_x[1][3]![1];
    }
    this._correctCRan();

    if (this.#typ === "rgb" || this.#typ === "rgba") {
      this.min_c = rgb(
        this.#redran[0],
        this.#greenran[0],
        this.#blueran[0],
      );
      this.max_c = rgb(
        this.#redran[1],
        this.#greenran[1],
        this.#blueran[1],
      );
    } else {
      this.min_c = hct(
        this.#hueran[0],
        this.#chromaran[0],
        this.#toneran[0],
      );
      this.max_c = hct(
        this.#hueran[1],
        this.#chromaran[1],
        this.#toneran[1],
      );
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      this.min_c.setAlpha(this.#alpharan[0]);
      this.max_c.setAlpha(this.#alpharan[1]);
    }

    this.min_c.registHandler(this._onColrMin);
    this.max_c.registHandler(this._onColrMax);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #setCRan(tgt_x: 0 | 1, colr_x: Colr) {
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      this.#redran[tgt_x] = colr_x.red;
      this.#greenran[tgt_x] = colr_x.green;
      this.#blueran[tgt_x] = colr_x.blue;
    } else {
      this.#hueran[tgt_x] = colr_x.hue;
      this.#chromaran[tgt_x] = colr_x.chroma;
      this.#toneran[tgt_x] = colr_x.tone;
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      this.#alpharan[tgt_x] = colr_x.alpha;
    }
  }

  @traceOut(_TRACE && THEMESETTING)
  private _correctCRan(tgt_x: 0 | 1 = 1): boolean {
    /*#static*/ if (_TRACE && THEMESETTING) {
      console.log(
        `${global.indent}>>>>>>> Colran_${this.id}._correctCRan(${tgt_x}) >>>>>>>`,
      );
    }
    let ret = false;
    const src = 1 - tgt_x;
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      if (this.#redran[1] < this.#redran[0]) {
        this.#redran[tgt_x] = this.#redran[src];
        ret = this.modified_br_Colran.val = true;
      }
      if (this.#greenran[1] < this.#greenran[0]) {
        this.#greenran[tgt_x] = this.#greenran[src];
        ret = this.modified_br_Colran.val = true;
      }
      if (this.#blueran[1] < this.#blueran[0]) {
        this.#blueran[tgt_x] = this.#blueran[src];
        ret = this.modified_br_Colran.val = true;
      }
    } else {
      if (Number.apxS(this.#hueran[1], this.#hueran[0])) {
        this.#hueran[tgt_x] = this.#hueran[src];
        ret = this.modified_br_Colran.val = true;
      }
      if (Number.apxS(this.#chromaran[1], this.#chromaran[0])) {
        this.#chromaran[tgt_x] = this.#chromaran[src];
        ret = this.modified_br_Colran.val = true;
      }
      if (Number.apxS(this.#toneran[1], this.#toneran[0])) {
        this.#toneran[tgt_x] = this.#toneran[src];
        ret = this.modified_br_Colran.val = true;
      }
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      if (Number.apxS(this.#alpharan[1], this.#alpharan[0])) {
        this.#alpharan[tgt_x] = this.#alpharan[src];
        ret = this.modified_br_Colran.val = true;
      }
    }
    /*#static*/ if (_TRACE && THEMESETTING) {
      console.log(`${global.dent}ret = ${ret}`);
    }
    return ret;
  }

  /** No invokes of callbacks of `min_c` or `max_c` */
  #setColr(src_x: 0 | 1) {
    const colr_ = src_x === 0 ? this.min_c : this.max_c;
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      colr_
        .setRed(this.#redran[src_x])
        .setGreen(this.#greenran[src_x])
        .setBlue(this.#blueran[src_x]);
    } else {
      colr_.setHCT(
        this.#hueran[src_x],
        this.#chromaran[src_x],
        this.#toneran[src_x],
      );
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      colr_.setAlpha(this.#alpharan[src_x]);
    }
  }

  @bind
  @traceOut(_TRACE && THEMESETTING)
  private _onColrMin(n_y: Colr) {
    /*#static*/ if (_TRACE && THEMESETTING) {
      console.log(
        `${global.indent}>>>>>>> Colran_${this.id}._onColrMin() >>>>>>>`,
      );
    }
    this.#setCRan(0, n_y);

    this.#setCRan(1, this.max_c); //! `#typ` could change
    if (this._correctCRan(1)) {
      this.#setColr(1);
      this.max_c.removeHandler(this._onColrMax); // prevent loop
      this.max_c.refreshColr();
      this.max_c.registHandler(this._onColrMax);
    }
  }
  @bind
  @traceOut(_TRACE && THEMESETTING)
  private _onColrMax(n_y: Colr) {
    /*#static*/ if (_TRACE && THEMESETTING) {
      console.log(
        `${global.indent}>>>>>>> Colran_${this.id}._onColrMax() >>>>>>>`,
      );
    }
    this.#setCRan(1, n_y);

    this.#setCRan(0, this.min_c); //! `#typ` could change
    if (this._correctCRan(0)) {
      this.#setColr(0);
      this.min_c.removeHandler(this._onColrMin); // prevent loop
      this.min_c.refreshColr();
      this.min_c.registHandler(this._onColrMin);
    }
  }

  setColr(colr_x: Colr, src_x: 0 | 1) {
    if (src_x === 0) this.min_c.setByColrMo(colr_x);
    else this.max_c.setByColrMo(colr_x);
    this.modified_br_Colran.val = true;
  }

  setTyp(typ_x: "rgb" | "hct", src_x: 0 | 1) {
    if (this.#typ.startsWith(typ_x)) return;

    this.#typ = `${typ_x}${this.#typ[3] ?? ""}` as ColranTyp;
    if (src_x === 0) this.min_c.refreshColr();
    else this.max_c.refreshColr();
    this.modified_br_Colran.val = true;
  }

  /** @const */
  get length() {
    let b_, c_, d_, a_;
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      b_ = (this.#redran[1] - this.#redran[0]) / 256;
      c_ = (this.#greenran[1] - this.#greenran[0]) / 256;
      d_ = (this.#blueran[1] - this.#blueran[0]) / 256;
    } else {
      b_ = (this.#hueran[1] - this.#hueran[0]) / 360;
      c_ = (this.#chromaran[1] - this.#chromaran[0]) / 100;
      d_ = (this.#toneran[1] - this.#toneran[0]) / 100;
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      a_ = this.#alpharan[1] - this.#alpharan[0];
    } else {
      a_ = 0;
    }
    return b_ + c_ + d_ + a_;
  }

  /** @out @param c_x  */
  sample(c_x: Colr) {
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      c_x
        .setRed(Math.round((this.#redran[0] + this.#redran[1]) / 2))
        .setGreen(Math.round((this.#greenran[0] + this.#greenran[1]) / 2))
        .setBlue(Math.round((this.#blueran[0] + this.#blueran[1]) / 2));
    } else {
      c_x
        .setHue((this.#hueran[0] + this.#hueran[1]) / 2)
        .setChroma((this.#chromaran[0] + this.#chromaran[1]) / 2)
        .setTone((this.#toneran[0] + this.#toneran[1]) / 2);
    }
    if (this.#typ === "rgba" || this.#typ === "hcta") {
      c_x.setAlpha((this.#alpharan[0] + this.#alpharan[1]) / 2);
    }
  }

  contain(colr_x: Colr): boolean {
    let ret = true;
    if (this.#typ === "rgb" || this.#typ === "rgba") {
      if (
        colr_x.red < this.#redran[0] || this.#redran[1] < colr_x.red ||
        colr_x.green < this.#greenran[0] ||
        this.#greenran[1] < colr_x.green ||
        colr_x.blue < this.#blueran[0] || this.#blueran[1] < colr_x.blue
      ) {
        ret = false;
      }
    } else {
      if (
        Number.apxS(colr_x.hue, this.#hueran[0]) ||
        Number.apxS(this.#hueran[1], colr_x.hue) ||
        Number.apxS(colr_x.chroma, this.#chromaran[0]) ||
        Number.apxS(this.#chromaran[1], colr_x.chroma) ||
        Number.apxS(colr_x.tone, this.#toneran[0]) ||
        Number.apxS(this.#toneran[1], colr_x.tone)
      ) {
        ret = false;
      }
    }
    if (ret && (this.#typ === "rgba" || this.#typ === "hcta")) {
      if (
        Number.apxS(colr_x.alpha, this.#alpharan[0]) ||
        Number.apxS(this.#alpharan[1], colr_x.alpha)
      ) {
        ret = false;
      }
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON(): ColranRaw {
    this.modified_br_Colran.set_Boor(false); //!
    return ({
      rgb: [this.#typ, [this.#redran, this.#greenran, this.#blueran]],
      rgba: [this.#typ, [
        this.#redran,
        this.#greenran,
        this.#blueran,
        this.#alpharan,
      ]],
      hct: [this.#typ, [this.#hueran, this.#chromaran, this.#toneran]],
      hcta: [this.#typ, [
        this.#hueran,
        this.#chromaran,
        this.#toneran,
        this.#alpharan,
      ]],
    } as Record<ColranTyp, ColranRaw>)[this.#typ];
  }
}
/*80--------------------------------------------------------------------------*/
