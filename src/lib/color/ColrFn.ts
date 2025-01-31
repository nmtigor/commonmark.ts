/** 80**************************************************************************
 * @module lib/color/ColrFn
 * @license BSD-3-Clause
 ******************************************************************************/

import { z } from "@zod";
import type { ArrEl, id_t, Ratio } from "../alias.ts";
import { zRatio } from "../alias.ts";
import type { alpha_t, chroma_t, Cssc, hue_t, red_t, tone_t } from "./alias.ts";
import { zAlpha, zChroma, zHue, zRed, zTone } from "./alias.ts";
import type { Colr } from "./Colr.ts";
/*80--------------------------------------------------------------------------*/

export type ColrStep =
  | ["r", red_t]
  | ["g", red_t]
  | ["b", red_t]
  | ["h", hue_t]
  | ["c", chroma_t]
  | ["c+", Ratio]
  | ["c-", Ratio]
  | ["t", tone_t]
  | ["t+", Ratio]
  | ["t-", Ratio]
  | ["a", alpha_t];
const zStep_ = z.union([
  z.tuple([z.literal("r"), zRed]),
  z.tuple([z.literal("g"), zRed]),
  z.tuple([z.literal("b"), zRed]),
  z.tuple([z.literal("h"), zHue]),
  z.tuple([z.literal("c"), zChroma]),
  z.tuple([z.literal("c+"), zRatio]),
  z.tuple([z.literal("c-"), zRatio]),
  z.tuple([z.literal("t"), zTone]),
  z.tuple([z.literal("t+"), zRatio]),
  z.tuple([z.literal("t-"), zRatio]),
  z.tuple([z.literal("a"), zAlpha]),
]);

export const zColrFn = z.array(zStep_);
/*64----------------------------------------------------------*/

const FnFunc_a_ = [
  ["r", "setRed"],
  ["g", "setGreen"],
  ["b", "setBlue"],
  ["h", "setHue"],
  ["c", "setChroma"],
  ["c+", "enchroma"],
  ["c-", "unchroma"],
  ["t", "setTone"],
  ["t+", "entone"],
  ["t-", "untone"],
  ["a", "setAlpha"],
] as const;

export type cs0_t = ColrStep[0];
export type cs1_t = ColrStep[1];
type Func_ = ArrEl<typeof FnFunc_a_>[1];

export function getColrFunc(_x: cs0_t): Func_ {
  return FnFunc_a_.find((_y) => _y[0] === _x)![1];
}
function getFn_(_x: Func_): cs0_t {
  return FnFunc_a_.find((_y) => _y[1] === _x)![0];
}

function repr_(step_x: ColrStep): string {
  return /* final switch */ ({
    "r": (_x: red_t) => Math.round(_x).toString(),
    "g": (_x: red_t) => Math.round(_x).toString(),
    "b": (_x: red_t) => Math.round(_x).toString(),
    "h": (_x: hue_t) => _x.fixTo(1).toString(),
    "c": (_x: chroma_t) => _x.fixTo(1).toString(),
    "c+": (_x: Ratio) => _x.reprRatio(),
    "c-": (_x: Ratio) => _x.reprRatio(),
    "t": (_x: tone_t) => _x.fixTo(1).toString(),
    "t+": (_x: Ratio) => _x.reprRatio(),
    "t-": (_x: Ratio) => _x.reprRatio(),
    "a": (_x: alpha_t) => _x.reprRatio(),
  }[step_x[0]])(step_x[1]);
}

export class ColrFn extends Array<ColrStep> {
  static #ID = 0 as id_t;
  readonly id = ++ColrFn.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // readonly modified_mo = new Moo({
  //   val: false,
  //   name: `ColrFn_${this.id}.modified_mo`,
  // });

  /** @const @param raw_x */
  constructor(raw_x?: ColrStep[]) {
    super();

    //! Just `if (raw_x) {...}` will `this.splice()` cause a problem
    if (Array.isArray(raw_x)) {
      for (const step of raw_x) {
        this.push([...step] as ColrStep);
      }
    }
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

  get(ret_x: Colr): Colr {
    for (const step of this) {
      ret_x[getColrFunc(step[0])](step[1]);
    }
    return ret_x;
  }

  toJSON(): ColrStep[] {
    // this.modified_mo.set(false); //!
    return [...this];
  }

  repr(): string {
    const ret: string[] = [];
    for (const step of this) {
      ret.push(`${step[0]}${repr_(step)}`);
    }
    return ret.join(" ");
  }
}

export function isColrFn(_x: ColrFn | Colr | Cssc): _x is ColrFn {
  return Array.isArray(_x);
}

// export class ColrFnMo extends Moo<ColrFn | null> {
//   constructor() {
//     super(null, undefined, "force");
//   }
// }
/*80--------------------------------------------------------------------------*/
