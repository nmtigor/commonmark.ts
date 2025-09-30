/** 80**************************************************************************
 * @module lib/color/ColrStep
 * @license BSD-3-Clause
 ******************************************************************************/

import * as v from "@valibot/valibot";
import type { Runr } from "../alias.ts";
import "../jslang.ts";
import type { alpha_t, chroma_t, hue_t, red_t, tone_t } from "./alias.ts";
import type { Colr } from "./Colr.ts";
import { createColr } from "./Colr.ts";
/*80--------------------------------------------------------------------------*/

export type ColrStepRaw = {
  channel: "r" | "g" | "b" | "h" | "c" | "t" | "a";
  value: number;
  flag?: "+" | "+%" | "-" | "-%" | "/";
  min?: number;
  max?: number;
};
export const vColrStepRaw = v.object({
  channel: v.picklist(["r", "g", "b", "h", "c", "t", "a"]),
  value: v.number(),
  flag: v.exactOptional(v.picklist(["+", "+%", "-", "-%", "/"])),
  min: v.exactOptional(v.number()),
  max: v.exactOptional(v.number()),
});

// export type ColrStep_old =
//   | ["r", red_t]
//   | ["g", red_t]
//   | ["b", red_t]
//   | ["h", hue_t]
//   | ["c", chroma_t]
//   | ["c+", Ratio]
//   | ["c-", Ratio]
//   | ["t", tone_t]
//   | ["t+", Ratio]
//   | ["t-", Ratio]
//   | ["a", alpha_t];
// const zColrStep_old = z.union([
//   z.tuple([z.literal("r"), vRed]),
//   z.tuple([z.literal("g"), vRed]),
//   z.tuple([z.literal("b"), vRed]),
//   z.tuple([z.literal("h"), vHue]),
//   z.tuple([z.literal("c"), vChroma]),
//   z.tuple([z.literal("c+"), vRatio]),
//   z.tuple([z.literal("c-"), vRatio]),
//   z.tuple([z.literal("t"), vTone]),
//   z.tuple([z.literal("t+"), vRatio]),
//   z.tuple([z.literal("t-"), vRatio]),
//   z.tuple([z.literal("a"), vAlpha]),
// ]);
/*64----------------------------------------------------------*/

/** @final */
export class ColrStep implements Runr {
  #rvn = false;
  get rvn() {
    return this.#rvn;
  }

  /** Assign through `assignDep()`. Do not assign directly! */
  readonly dep_c = createColr();
  /** @const @param colr_x */
  assignDep(colr_x: Colr): this {
    this.dep_c.setByColr(colr_x);
    this.#rvn = false;
    return this;
  }
  readonly out_c = createColr();

  /* #channel */
  #channel;
  get channel() {
    return this.#channel;
  }
  set channel(_x: ColrStepRaw["channel"]) {
    this.#channel = _x;
    this.#rvn = false;
  }

  get isRGB() {
    return this.#channel === "r" ||
      this.#channel === "g" ||
      this.#channel === "b";
  }
  get isCT() {
    return this.#channel === "c" || this.#channel === "t";
  }
  /* ~ */

  #value;
  get value() {
    return this.#value;
  }
  set value(_x: ColrStepRaw["value"]) {
    this.#value = _x;
    this.#rvn = false;
  }

  /* #flag */
  #flag;
  get flag() {
    return this.#flag;
  }
  set flag(_x: ColrStepRaw["flag"]) {
    this.#flag = _x;
    this.#rvn = false;
  }

  isPerc() {
    return this.#flag === "+%" || this.#flag === "-%";
  }
  /* ~ */

  #min;
  get min() {
    return this.#min;
  }
  set min(_x: ColrStepRaw["min"]) {
    this.#min = _x;
    this.#rvn = false;
  }

  #max;
  get max() {
    return this.#max;
  }
  set max(_x: ColrStepRaw["max"]) {
    this.#max = _x;
    this.#rvn = false;
  }

  static readonly sample = new ColrStep({ channel: "r", value: 0 });

  /** @const @param _x */
  constructor(_x: ColrStepRaw) {
    this.#channel = _x.channel;
    this.#value = _x.value;
    this.#flag = _x.flag;
    this.#min = _x.min;
    this.#max = _x.max;
  }

  dup_ColrStep() {
    const ret = new ColrStep(this.toJSON());
    ret.assignDep(this.dep_c);
    ret.out_c.setByColr(this.out_c);
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const
   * @const @param old_x
   * @const @param max_x
   */
  #calc(old_x: number, max_x: number): number {
    if (this.#min !== undefined && this.#max !== undefined) {
      if (Number.apxG(this.#min, this.#max)) return old_x;
      if (Number.apxE(this.#min, this.#max)) return (this.#min + this.#max) / 2;
    }

    let nue: number;
    if (this.#flag === undefined) nue = this.#value;
    else {
      nue = /* final switch */ ({
        ["+"]: () => old_x + this.#value,
        ["-"]: () => old_x - this.#value,
        ["/"]: () => old_x / this.#value,
        ["+%"]: () => old_x + (max_x - old_x) * (this.#value / 100),
        ["-%"]: () => old_x - old_x * (this.#value / 100),
      }[this.#flag])();
    }
    if (this.#min !== undefined && nue < this.#min) nue = this.#min;
    if (this.#max !== undefined && nue > this.#max) nue = this.#max;

    nue = Number.moduloize(nue, 0, max_x, "inclusive");
    return isNaN(nue) ? old_x : nue;
  }

  /**
   * Base on `dep_c` which won't be modified. Assign `out_c`.
   * @implement
   */
  run(): void {
    if (this.#rvn) return;

    this.out_c.setByColr(this.dep_c);
    /* final switch */ ({
      r: () => {
        this.out_c.setRed(
          Math.round(this.#calc(this.out_c.red, 0xff)),
        );
      },
      g: () => {
        this.out_c.setGreen(
          Math.round(this.#calc(this.out_c.green, 0xff)),
        );
      },
      b: () => {
        this.out_c.setBlue(
          Math.round(this.#calc(this.out_c.blue, 0xff)),
        );
      },
      h: () => {
        let val = this.#calc(this.out_c.hue, 360);
        if (Number.apxE(val, 360)) val = 0;
        this.out_c.setHue(val);
      },
      c: () => {
        this.out_c.setChroma(
          this.#calc(this.out_c.chroma, 100),
        );
      },
      t: () => {
        this.out_c.setTone(
          this.#calc(this.out_c.tone, 100),
        );
      },
      a: () => {
        this.out_c.setAlpha(
          this.#calc(this.out_c.alpha, 1),
        );
      },
    }[this.#channel])();
    this.#rvn = true;
  }

  /**
   * Except `value`, `flag`, if `this` "eql" `_x`?\
   * Used in `FuncPicker_` to determine if its `track$` needs to be redrawn.
   * @const @param _x
   */
  othrEql(_x: ColrStep): boolean {
    return this.#channel === _x.#channel &&
      (this.#min === _x.#min ||
        this.#min !== undefined && _x.#min !== undefined &&
          Number.apxE(this.#min, _x.#min)) &&
      (this.#max === _x.#max ||
        this.#max !== undefined && _x.#max !== undefined &&
          Number.apxE(this.#max, _x.#max));
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Stringify `cs_x.value` only.\
   * Ignore influences of `cs_x.#min`, `cs_x.#max`.
   * @const @param cs_x
   */
  #valueToString(cs_x: ColrStep | ColrStepRaw = this): string {
    if (cs_x.flag?.endsWith("%")) return cs_x.value.reprRatio();
    if (cs_x.flag === "/") return cs_x.value.fixTo(1).toString();

    return /* final switch */ ({
      "r": (_x: red_t) => Math.round(_x).toString(),
      "g": (_x: red_t) => Math.round(_x).toString(),
      "b": (_x: red_t) => Math.round(_x).toString(),
      "h": (_x: hue_t) => _x.fixTo(1).toString(),
      "c": (_x: chroma_t) => _x.fixTo(1).toString(),
      "t": (_x: tone_t) => _x.fixTo(1).toString(),
      "a": (_x: alpha_t) => _x.reprRatio(),
    }[cs_x.channel])(cs_x.value);
  }

  // /** Will `run()` first */
  nochannelToString(): string {
    // this.run();
    // if (this.#value === this.#min) {
    //   const cs_: ColrStepRaw = { channel: this.#channel, value: this.#min };
    //   return this.#valueToString(cs_);
    // } else if (this.#value === this.#max) {
    //   const cs_: ColrStepRaw = { channel: this.#channel, value: this.#max };
    //   return this.#valueToString(cs_);
    // }

    const min = this.#min === undefined ? "" : `[${this.#min.fixTo(1)},`;
    const max = this.#max === undefined ? "" : `,${this.#max.fixTo(1)}]`;
    const pre = this.#flag?.[0] ?? "";
    const suf = this.#flag?.endsWith("%") ? "%" : "";
    return `${min}${pre}${this.#valueToString()}${suf}${max}`;
  }

  toString() {
    return `${this.#channel}${this.nochannelToString()}`;
  }

  toJSON(): ColrStepRaw {
    const ret: ColrStepRaw = { channel: this.#channel, value: this.#value };
    if (this.#flag !== undefined) ret.flag = this.#flag;
    if (this.#min !== undefined) ret.min = this.#min;
    if (this.#max !== undefined) ret.max = this.#max;
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
