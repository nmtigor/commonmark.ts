/** 80**************************************************************************
 * @module lib/color/ColrFn
 * @license BSD-3-Clause
 ******************************************************************************/

import * as v from "@valibot/valibot";
import type { id_t, uint } from "../alias.ts";
import "../jslang.ts";
import { fail } from "../util.ts";
import * as Is from "../util/is.ts";
import type { SortedArray } from "../util/SortedArray.ts";
import type { Cssc } from "./alias.ts";
import type { Colr } from "./Colr.ts";
import type { ColrStep, ColrStepRaw } from "./ColrStep.ts";
import { vColrStepRaw } from "./ColrStep.ts";
/*80--------------------------------------------------------------------------*/

// export type ColrStep = {
//   channel: "r" | "g" | "b" | "h" | "c" | "t" | "a";
//   value: number;
//   flag?: "+" | "+%" | "-" | "-%" | "/" | undefined;
//   min?: number | undefined;
//   max?: number | undefined;
// };

export type ColrFnRaw = ColrStepRaw[];
export const vColrFnRaw = v.array(vColrStepRaw);
/*64----------------------------------------------------------*/

//jjjj TOCLEANUP
// const FnFunc_a_ = [
//   ["r", "setRed"],
//   ["g", "setGreen"],
//   ["b", "setBlue"],
//   ["h", "setHue"],
//   ["c", "setChroma"],
//   ["c+", "enchroma"],
//   ["c-", "unchroma"],
//   ["t", "setTone"],
//   ["t+", "entone"],
//   ["t-", "untone"],
//   ["a", "setAlpha"],
// ] as const;

//jjjj TOCLEANUP
// export type CSChannel = ColrStep["channel"];
// export type CSValue = ColrStep["value"];
// export type CSFlag = ColrStep["flag"];
// export type CSMin = ColrStep["min"];
// export type CSMax = ColrStep["max"];
// type Func_ = ArrEl<typeof FnFunc_a_>[1];

//jjjj TOCLEANUP
// export function getColrFunc(_x: CSChannel): Func_ {
//   return FnFunc_a_.find((_y) => _y[0] === _x)![1];
// }
// // function getFn_(_x: Func_): CSChannel {
// //   return FnFunc_a_.find((_y) => _y[1] === _x)![0];
// // }

//jjjj TOCLEANUP
// /** @const @param cs_x */
// function reprCSValue_(cs_x: ColrStep): string {
//   if (cs_x.flag?.endsWith("%")) return cs_x.value.reprRatio();
//   if (cs_x.flag === "/") return cs_x.value.fixTo(1).toString();

//   return /* final switch */ ({
//     "r": (_x: red_t) => Math.round(_x).toString(),
//     "g": (_x: red_t) => Math.round(_x).toString(),
//     "b": (_x: red_t) => Math.round(_x).toString(),
//     "h": (_x: hue_t) => _x.fixTo(1).toString(),
//     "c": (_x: chroma_t) => _x.fixTo(1).toString(),
//     //jjjj TOCLEANUP
//     // "c+": (_x: Ratio) => _x.reprRatio(),
//     // "c-": (_x: Ratio) => _x.reprRatio(),
//     "t": (_x: tone_t) => _x.fixTo(1).toString(),
//     //jjjj TOCLEANUP
//     // "t+": (_x: Ratio) => _x.reprRatio(),
//     // "t-": (_x: Ratio) => _x.reprRatio(),
//     "a": (_x: alpha_t) => _x.reprRatio(),
//   }[cs_x.channel])(cs_x.value);
// }

export class ColrFn extends Array<ColrStep> {
  static #ID = 0 as id_t;
  readonly id = ++ColrFn.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // readonly modified_mo = new Moo({
  //   val: false,
  //   name: `ColrFn_${this.id}.modified_mo`,
  // });

  static readonly identity = new ColrFn();

  /** @const @param raw_x */
  constructor(raw_x?: ColrStep[]) {
    super();

    //jjjj TOCLEANUP
    // //! Just `if (raw_x) {...}` will `this.splice()` cause a problem
    // if (Is.array(raw_x)) {
    //   for (const step of raw_x) {
    //     this.push([...step] as ColrStep);
    //   }
    // }
    if (raw_x) this.push(...raw_x);
  }

  // /**
  //  * @const @param colrfn_x
  //  */
  // setBy(colrfn_x: ColrFn): this {
  //   this.length = colrfn_x.length;
  //   for (let i = this.length; i--;) {
  //     this[i][0] = colrfn_x[i][0];
  //     this[i][1] = colrfn_x[i][1];
  //   }
  //   this.#modified = colrfn_x.#modified;
  //   return this;
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @see {@linkcode SortedArray.splice()} */
  override splice(..._x: unknown[]): ColrStep[] {
    fail("Disabled");
  }

  /**
   * @const
   * @out @param ret_x
   */
  get(ret_x: Colr): Colr {
    if (this.length === 0) return ret_x;

    for (let i = 0; i < this.length; ++i) {
      this[i]
        .assignDep(i === 0 ? ret_x : this[i - 1].out_c)
        .run();
    }
    return ret_x.setByColr(this.at(-1)!.out_c);
  }

  /** @const @param i_x */
  del(i_x: uint): void {
    let j = i_x + 1;
    for (; j < this.length; ++j) this[j - 1] = this[j];
    if (j === this.length) this.length -= 1;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    const ret: string[] = [];
    for (const cs of this) ret.push(cs.toString());
    return `${ret.join(" ")}`;
  }

  toJSON(): ColrStep[] {
    // this.modified_mo.set(false); //!
    return [...this];
  }
}
/*64----------------------------------------------------------*/

export const isColrFn = (_x: ColrFn | Colr | Cssc): _x is ColrFn => {
  return Is.array(_x);
};

//jjjj TOCLEANUP
// /**
//  * @const @param cs_x
//  * @const @param old_x
//  * @const @param max_x
//  */
// const calcRaw_ = (
//   cs_x: ColrStep,
//   old_x: number,
//   max_x: number,
// ): number => {
//   if (cs_x.min !== undefined && cs_x.max !== undefined) {
//     if (Number.apxG(cs_x.min, cs_x.max)) return old_x;
//     if (Number.apxE(cs_x.min, cs_x.max)) return (cs_x.min + cs_x.max) / 2;
//   }

//   let nue: number;
//   if (cs_x.flag === undefined) nue = cs_x.value;
//   else {
//     nue = /* final switch */ ({
//       ["+"]: () => old_x + cs_x.value,
//       ["-"]: () => old_x - cs_x.value,
//       ["/"]: () => old_x / cs_x.value,
//       ["+%"]: () => old_x + (max_x - old_x) * (cs_x.value / 100),
//       ["-%"]: () => old_x - old_x * (cs_x.value / 100),
//     }[cs_x.flag])();
//   }
//   if (cs_x.min !== undefined && nue < cs_x.min) nue = cs_x.min;
//   if (cs_x.max !== undefined && nue > cs_x.max) nue = cs_x.max;

//   if (nue < 0 || nue > max_x) {
//     nue %= max_x;
//     if (nue < 0) nue += max_x;
//   }

//   return isNaN(nue) ? old_x : nue;
// };

//jjjj TOCLEANUP
// /**
//  * @const @param cs_x
//  * @headconst @param ret_x
//  */
// export const calcColrStep = (cs_x: ColrStep, ret_x: Colr): Colr => {
//   /* final switch */ ({
//     r: () => {
//       ret_x.setRed(
//         Math.round(calcRaw_(cs_x, ret_x.red, 0xff)),
//       );
//     },
//     g: () => {
//       ret_x.setGreen(
//         Math.round(calcRaw_(cs_x, ret_x.green, 0xff)),
//       );
//     },
//     b: () => {
//       ret_x.setBlue(
//         Math.round(calcRaw_(cs_x, ret_x.blue, 0xff)),
//       );
//     },
//     h: () => {
//       let val = calcRaw_(cs_x, ret_x.hue, 360);
//       if (Number.apxE(val, 360)) val = 0;
//       ret_x.setHue(val);
//     },
//     c: () => {
//       ret_x.setChroma(
//         calcRaw_(cs_x, ret_x.chroma, 100),
//       );
//     },
//     t: () => {
//       ret_x.setTone(
//         calcRaw_(cs_x, ret_x.tone, 100),
//       );
//     },
//     a: () => {
//       ret_x.setAlpha(
//         calcRaw_(cs_x, ret_x.alpha, 1),
//       );
//     },
//   }[cs_x.channel])();
//   return ret_x;
// };
/*80--------------------------------------------------------------------------*/
