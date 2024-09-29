/** 80**************************************************************************
 * Dullingrup data
 *
 * @module lib/compiling/Dgdata
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Chr, Dulstr } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/** Dullingrup map */
export type Dulmap = Map<Chr | Dulstr, Dulstr>;

export const Dgdata: Record<Dulstr, Dulmap> = {
  // deno-fmt-ignore
  lowercase: new Map([
    ["A", "a"], ["B", "b"], ["C", "c"], ["D", "d"], ["E", "e"], ["F", "f"], 
    ["G", "g"], ["H", "h"], ["I", "i"], ["J", "j"], ["K", "k"], ["L", "l"], 
    ["M", "m"], ["N", "n"], ["O", "o"], ["P", "p"], ["Q", "q"], ["R", "r"], 
    ["S", "s"], ["T", "t"], ["U", "u"], ["V", "v"], ["W", "w"], ["X", "x"], 
    ["Y", "y"], ["Z", "z"],
  ]),
};
/*80--------------------------------------------------------------------------*/

type Dgmap_rev_ = Record<Dulstr, Dulstr[] | string>;

const Dgdata_rev_: Record<Dulstr, Dgmap_rev_> = {
  // deno-fmt-ignore
  pinyin_with_tone: {
    //kkkk
  },

  /**
   * Ref. [最全汉语拼音拼读表完整版](https://new.qq.com/rain/a/20210421A0FIUQ00)
   */
  // deno-fmt-ignore
  pinyin: {
    //kkkk
  },

  // deno-fmt-ignore
  pinyin_initial: {
    //kkkk
  },

  // deno-fmt-ignore
  pinyin_initial_abbr: {
    a: ["ai", "ao", "an", "ang"], o: ["ou"], e: ["ei", "er", "en", "eng"],
    z: ["zh"], c: ["ch"], s: ["sh"],
  },
};

(() => {
  const genDgmap_pinyin_with_tone = () => {
    //kkkk
    return new Map();
  };

  const genDgmap_pinyin = () => {
    //kkkk
    return new Map();
  };

  const genDgmap_pinyin_initial = () => {
    //kkkk
    return new Map();
  };

  const genDgmap_initial_abbr = () => {
    //kkkk
    return new Map();
  };

  Dgdata["pinyin_with_tone"] = genDgmap_pinyin_with_tone();
  Dgdata["pinyin"] = genDgmap_pinyin();
  Dgdata["pinyin_initial"] = genDgmap_pinyin_initial();
  Dgdata["initial_abbr"] = genDgmap_initial_abbr();
})();
/*80--------------------------------------------------------------------------*/
