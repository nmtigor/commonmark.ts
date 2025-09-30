/** 80**************************************************************************
 * @module lib/loadBidi
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE } from "../preNs.ts";
import type { Chr, ChrTypName, UChr, uint } from "./alias.ts";
import { ChrTyp } from "./alias.ts";
import { trace } from "./util/trace.ts";
/*80--------------------------------------------------------------------------*/

const chrTyp_m_ = new Map<uint, ChrTyp>();

// export const bidiDataLoaded = () => chrTyp_m_.size;

export const chrTypOf = (uchr_x: UChr): ChrTyp =>
  chrTyp_m_.get(uchr_x.codePointAt(0)!) ?? ChrTyp.L;
/*64----------------------------------------------------------*/

let openToClose_m_: Map<Chr, Chr> | undefined;
let closeToOpen_m_: Map<Chr, Chr> | undefined;
let canonical_m_: Map<Chr, Chr> | undefined;

export const closingOf = (chr_x?: Chr) =>
  chr_x === undefined ? undefined : openToClose_m_?.get(chr_x);
export const openingOf = (chr_x?: Chr) =>
  chr_x === undefined ? undefined : closeToOpen_m_?.get(chr_x);
export const canonicalOf = (chr_x: Chr) => canonical_m_?.get(chr_x);
/*80--------------------------------------------------------------------------*/

/**
 * Ref. https://github.com/lojjic/bidi-js/blob/main/src/util/parseCharacterMap.js
 *
 * Parses an string that holds encoded codepoint mappings, e.g. for bracket
 * pairs or mirroring characters, as encoded by "genBidiData.ts". Returns an
 * object holding the `map`, and optionally a `reverseMap` if
 * `includeReverse_x:true`.
 *
 * @const @param encodedString_x
 * @const @param includeReverse_x true if you want reverseMap in the output
 */
function parseCharacterMap(
  encodedString_x: string,
  includeReverse_x: boolean,
): { map: Map<Chr, Chr>; reverseMap: Map<Chr, Chr> | undefined } {
  const RADIX = 36;
  let lastCode = 0;
  const map = new Map<Chr, Chr>();
  const reverseMap = includeReverse_x ? new Map<Chr, Chr>() : undefined;
  let prevPair: string;
  encodedString_x.split(",").forEach(function visit(entry_y) {
    if (entry_y.indexOf("+") !== -1) {
      for (let i = +entry_y; i--;) {
        visit(prevPair);
      }
    } else {
      prevPair = entry_y;
      let [a, b]: (string | Chr)[] = entry_y.split(">");
      a = String.fromCodePoint(lastCode += parseInt(a, RADIX));
      b = String.fromCodePoint(lastCode += parseInt(b, RADIX));
      map.set(a as Chr, b as Chr);
      reverseMap?.set(b as Chr, a as Chr);
    }
  });
  return { map, reverseMap };
}

/**
 * Assign `chrTyp_m_`, `openToClose_m_`, `closeToOpen_m_`, `canonical_m_`\
 * Ref. https://github.com/lojjic/bidi-js/blob/main/src/charTypes.js \
 * Ref. https://github.com/lojjic/bidi-js/blob/main/src/brackets.js
 * @noreject
 */
export async function loadBidi() {
  /*#static*/ if (_TRACE) {
    console.log(`${trace.indent}>>>>>>> loadBidi() >>>>>>>`);
  }
  try {
    const DATA = (await import("../data/bidi/bidiCharTypes.data.js")).default;
    for (const typ of Object.keys(DATA)) {
      // let lastCode = 0;
      // DATA[typ as ChrTypName].split(",").forEach((r_y) => {
      //   const [skip_s, step_s] = r_y.split("+");
      //   const skip = parseInt(skip_s, 36);
      //   const step = step_s ? parseInt(step_s, 36) : 0;
      //   chrTyp_m_.set(lastCode += skip, ChrTyp[typ as ChrTypName]);
      //   for (let i = 0; i < step; i++) {
      //     chrTyp_m_.set(++lastCode, ChrTyp[typ as ChrTypName]);
      //   }
      // });

      const segs_s = DATA[typ as Exclude<ChrTypName, "L">];
      let temp = "";
      let strt: uint;
      /** inclusive */
      let stop: uint;
      /** Seen "+" or not */
      let state = false;
      let lastCode = 0;
      for (let i = 0, iI = segs_s.length; i <= iI + 1; i += 1) {
        const uc_: UChr = segs_s[i];
        if (uc_ !== "," && i !== iI) {
          if (uc_ === "+") {
            state = true;
            lastCode = strt = lastCode + parseInt(temp, 36);
            temp = "";
          } else {
            temp += uc_;
          }
        } else {
          if (state) {
            stop = strt! + parseInt(temp, 36);
          } else {
            lastCode = strt = lastCode + parseInt(temp, 36);
            stop = strt;
          }
          state = false;
          temp = "";
          lastCode = stop;
          for (let j = strt!; j < stop + 1; j += 1) {
            chrTyp_m_.set(j, ChrTyp[typ as ChrTypName]);
          }
        }
      }
    }
    // console.log(chrTyp_m_.size);
  } catch (err) {
    console.error(err);
  }
  try {
    const DATA = (await import("../data/bidi/bidiBrackets.data.js")).default;
    const { map, reverseMap } = parseCharacterMap(DATA.pairs, true);
    openToClose_m_ = map;
    closeToOpen_m_ = reverseMap;
    canonical_m_ = parseCharacterMap(DATA.canonical, false).map;
  } catch (err) {
    console.error(err);
  }
  /*#static*/ if (_TRACE) trace.outdent;
  return;
}
/*80--------------------------------------------------------------------------*/
