/** 80**************************************************************************
 * @module lib/loadTheme
 * @license BSD-3-Clause
 ******************************************************************************/

import { BeReturn } from "../alias.ts";
import { _TRACE, DEV, global } from "../global.ts";
import type { UpdateTheme_PUT } from "./alias.ts";
import { Pale, type PaleRaw, zPaleRaw } from "./color/Pale.ts";
import { type PaleName, zPaleName } from "./color/PaleCoor.ts";
import { Moo } from "./Moo.ts";
import { $theme } from "./symbols.ts";
import wretch from "@wretch";
import { z } from "@zod";
import { baseUrl } from "../baseurl.mjs";
/*80--------------------------------------------------------------------------*/

const D_base_ = /*#static*/ DEV ? baseUrl : "https://premsys.org"; //jjjj

// type PaleRaw = {
//   readonly t: PaleType;
//   readonly g: readonly PaleGrup[];
//   readonly n: string; // pale name
//   readonly d: string; // description
//   readonly l?: string; // label
//   readonly p?: readonly p_t[];
//   readonly c: readonly c_t[];

//   pale?: Pale;
// };

// type ThemeRaw = { readonly [palename: string]: PaleRaw };
type ThemeJ_ = [PaleName, PaleRaw][];
type ThemeRaw_ = { [palename: PaleName]: PaleRaw };
type Theme_ = {
  readonly raw_o: ThemeRaw_;
  readonly ord_a: PaleName[];
  readonly pale_m: Map<PaleName, Pale>;
  // readonly pale_modified_m: Map<PaleName, Pale>;
  readonly modified_mo: Moo<boolean>;
};
declare global {
  interface Document {
    // [$theme]: ThemeTsRaw;
    [$theme]: Theme_;

    // [$theme_modified]: {
    //   pale_m: Map<PaleName, Pale>;
    // };

    // [$palename]: { [category: string]: any };
  }

  // var theme_2028: undefined | {
  //   theme_ts: number;
  //   theme_o: { [palename: string]: any };
  // };
}
document[$theme] = {
  raw_o: {},
  ord_a: [],
  pale_m: new Map(),
  // pale_modified_m: new Map(),
  modified_mo: new Moo({ val: false }),
};

// export type ThemeTsRaw = {
//   theme_ts: number;
//   theme_o: ThemeRaw;
// };
/*80--------------------------------------------------------------------------*/

// export type PaleType =
//   | "全局"
//   | "尺寸控制"
//   | "MdextCodeEditor"
//   | "MdextRichEditor"
//   | "PlainEdtr"
//   | "日历";

// // for subrepo "src/dev"
// export type PaleGrup =
//   | "datetime"
//   | "plaineditor"
//   | "editor"
//   | "premsys";

// export const THEME_DEFAULT_ts = 1592298639427;
// /* All pale names are here */
// export const THEME_DEFAULT: ThemeRaw = Object.freeze({
//   "bg_2100": {
//     "t": "全局",
//     "g": ["datetime"],
//     "n": "bg_2100",
//     "d": "总的背景",
//     "l": "Background color",
//     "c": [
//       "#333",
//       "#435935",
//       "rgba( 49, 123, 142, 1 )",
//       "#7F0020",
//       "hsla( 43.3, 100%, 64.6%, 1 )",
//     ],
//   },
//   "flip_2106": {
//     "t": "全局",
//     "g": ["datetime"],
//     "n": "flip_2106",
//     "d": "Flip",
//     "c": [
//       "rgba( 49, 123, 142, 1 )",
//       "#333",
//       "#7F0020",
//       "hsla( 43.3, 100%, 64.6%, 1 )",
//       "#435935",
//     ],
//   },
//   "calrbg_2101": {
//     "g": ["datetime"],
//     "t": "日历",
//     "n": "calrbg_2101",
//     "d": "日历背景",
//     "c": [
//       "hsla( 181.5, 0%, 62.5%, 1 )",
//       "#E1F2C4",
//       "hsla( 192.2, 61.5%, 85%, 1 )",
//       "rgba( 245, 224, 226, 1 )",
//       "hsla( 57.3, 100%, 89.6%, 1 )",
//     ],
//   },
//   "calrclock_2147": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrclock_2147",
//     "d": "时钟前景",
//     "p": [
//       ["calrbg_2101", 0],
//       null,
//       ["calrbg_2101", 1],
//       ["calrbg_2101", 2],
//       ["calrbg_2101", 3],
//     ],
//     "c": [
//       "",
//       "hsla( 43.4, 100%, 25%, 1 )",
//       "",
//       "",
//       "",
//     ],
//   },
//   "timebar_2150": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "timebar_2150",
//     "d": "时间进度条",
//     "c": [
//       "#fff1",
//     ],
//   },
//   "calrweek_2148": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrweek_2148",
//     "d": "星期前景",
//     "p": [
//       ["calrbg_2101", 0],
//       null,
//       ["calrbg_2101", 1],
//       ["calrbg_2101", 2],
//       ["calrbg_2101", 3],
//     ],
//     "c": [
//       "",
//       "hsla( 43.4, 100%, 22.9%, 1 )",
//       "",
//       "",
//       "",
//     ],
//   },
//   "calrbg_fo_2105": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrbg_fo_2105",
//     "d": "日历背景（聚焦态）",
//     "p": [
//       ["calrbg_2101", 0],
//       ["calrbg_2101", 4],
//       ["calrbg_2101", 1],
//       ["calrbg_2101", 2],
//       ["calrbg_2101", 3],
//     ],
//     "c": [
//       "l+0.125 ",
//       "l-0.125 ",
//       "l+0.125 ",
//       "l+0.125 ",
//       "l+0.125 ",
//     ],
//   },
//   "calrbg_1_2109": {
//     "g": ["datetime"],
//     "t": "日历",
//     "n": "calrbg_1_2109",
//     "d": "日历背景（非当前）",
//     "p": [
//       ["calrbg_2101", 0],
//       ["calrbg_2101", 1],
//       ["calrbg_2101", 2],
//       ["calrbg_2101", 3],
//       ["calrbg_2101", 4],
//     ],
//     "c": [
//       "l+0.23",
//       "l+0.23",
//       "l+0.23",
//       "l+0.23",
//       "l+0.23",
//     ],
//   },
//   "calrbg_1_fo_2110": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrbg_1_fo_2110",
//     "d": "日历背景（非当前，聚焦态）",
//     "p": [
//       ["calrbg_1_2109", 0],
//     ],
//     "c": [
//       "l-0.104 ",
//     ],
//   },
//   "calrbg_now_2107": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrbg_now_2107",
//     "d": "当前时间背景",
//     "c": [
//       "rgba( 49, 123, 142, 1 )",
//       "#333",
//       "#7F0020",
//       "hsla( 43.3, 100%, 64.6%, 1 )",
//       "#435935",
//     ],
//   },
//   "calrfg_2104": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrfg_2104",
//     "d": "日历前景",
//     "p": [
//       ["bg_2100", 0],
//       ["bg_2100", 2],
//       null,
//       ["bg_2100", 4],
//       ["bg_2100", 1],
//     ],
//     "c": [
//       "",
//       "l-0.3 ",
//       "rgba( 128, 51, 51, 1 )",
//       "l-0.57",
//       "",
//     ],
//   },
//   "calrfg_1_2111": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrfg_1_2111",
//     "d": "日历前景（非当前）",
//     "p": [
//       ["calrfg_2104", 0],
//       ["calrfg_2104", 3],
//       ["calrfg_2104", 1],
//       ["calrfg_2104", 2],
//     ],
//     "c": [
//       "l+0.1",
//       " l+0.025 ",
//       "l+0.1",
//       "l+0.1",
//     ],
//   },
//   "calrfg_now_2108": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "calrfg_now_2108",
//     "d": "当前时间前景",
//     "p": [
//       ["calrbg_now_2107", 0],
//       ["calrbg_now_2107", 3],
//       ["calrbg_now_2107", 1],
//       ["calrbg_now_2107", 2],
//       ["calrbg_now_2107", 4],
//     ],
//     "c": [
//       "l+0.95 ",
//       "l-0.64",
//       "l+0.95 ",
//       "l+0.95 ",
//       "l+0.95 ",
//     ],
//   },
//   "shichen_2151": {
//     "t": "日历",
//     "g": ["datetime"],
//     "n": "shichen_2151",
//     "d": "时辰",
//     "c": [
//       "#fff4",
//     ],
//   },
//   "bg_2027": {
//     "t": "全局",
//     "g": ["plaineditor", "editor"],
//     "n": "bg_2027",
//     "d": "总的背景",
//     "l": "Background color",
//     "c": [
//       "#333",
//       "rgba( 255, 168, 136, 1 )",
//     ],
//   },
//   "resizbutn_2095": {
//     "t": "尺寸控制",
//     "g": ["editor"],
//     "n": "resizbutn_2095",
//     "d": "尺寸调整按钮",
//     "c": [
//       "#f79377",
//     ],
//   },
//   "resizbutn_fo_2096": {
//     "t": "尺寸控制",
//     "g": ["editor"],
//     "n": "resizbutn_fo_2096",
//     "d": "尺寸调整按钮（聚焦态）",
//     "c": [
//       "#fabaa8",
//     ],
//   },
//   "mdcode_bg_2026": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "mdcode_bg_2026",
//     "d": "MdextCodeEditor背景",
//     "c": [
//       "#aee0e0",
//       "hsla( 202.5, 22.1%, 29.2%, 1 )",
//     ],
//   },
//   "caret_2041": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "caret_2041",
//     "d": "MdextCodeEditor的光标",
//     "l": "Caret of CODE",
//     "c": [
//       "#f9dc00",
//       "hsla( 167.1, 77.5%, 32.3%, 1 )",
//     ],
//   },
//   "selec_2054": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "selec_2054",
//     "d": "MdextCodeEditor的选区",
//     "p": [
//       ["caret_2041", 0],
//       ["caret_2041", 1],
//     ],
//     "c": [
//       "l+.6",
//       "l+.6",
//     ],
//   },
//   "selec_ovlap_2057": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "selec_ovlap_2057",
//     "d": "MdextCodeEditor覆盖图片的选区",
//     "c": [
//       "rgba(255, 243, 153, .5)",
//     ],
//   },
//   "shadowcaret_2048": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "shadowcaret_2048",
//     "d": "MdextCodeEditor的影子光标",
//     "c": [
//       "rgba(249, 220, 0, .35)",
//     ],
//   },
//   "shadowselec_2060": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "shadowselec_2060",
//     "d": "MdextCodeEditor的影子选区",
//     "c": [
//       "rgba(255, 231, 51, .35)",
//     ],
//   },
//   "shadowselec_ovlap_2063": {
//     "t": "MdextCodeEditor",
//     "g": ["editor"],
//     "n": "shadowselec_ovlap_2063",
//     "d": "MdextCodeEditor覆盖图片的影子选区",
//     "c": [
//       "#ddd",
//     ],
//   },
//   "mdrich_bg_2042": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "mdrich_bg_2042",
//     "d": "MdextRichEditor背景",
//     "c": [
//       "#aee0e0",
//       "#69875a",
//     ],
//   },
//   "caret_2043": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "caret_2043",
//     "d": "MdextRichEditor的光标",
//     "l": "Caret of RICH",
//     "c": [
//       "#f99500",
//       "hsla( 210, 100%, 41.7%, 1 )",
//     ],
//   },
//   "selec_2055": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "selec_2055",
//     "d": "MdextRichEditor的选区",
//     "l": "Selection of RICH",
//     "p": [
//       null,
//       ["caret_2043", 1],
//     ],
//     "c": [
//       "#ffd699",
//       "l+.6",
//     ],
//   },
//   "selec_ovlap_2058": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "selec_ovlap_2058",
//     "d": "MdextRichEditor覆盖图片的选区",
//     "c": [
//       "rgba(255, 214, 153, .5)",
//     ],
//   },
//   "shadowcaret_2049": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "shadowcaret_2049",
//     "d": "MdextRichEditor的影子光标",
//     "c": [
//       "rgba(249, 149, 0, .35)",
//     ],
//   },
//   "shadowselec_2061": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "shadowselec_2061",
//     "d": "MdextRichEditor的影子选区",
//     "c": [
//       "rgba(255, 173, 51, .35)",
//     ],
//   },
//   "shadowselec_ovlap_2064": {
//     "t": "MdextRichEditor",
//     "g": ["editor"],
//     "n": "shadowselec_ovlap_2064",
//     "d": "MdextRichEditor覆盖图片的影子选区",
//     "c": [
//       "#ddd",
//     ],
//   },
//   "plain_bg_2050": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "plain_bg_2050",
//     "d": "PlainEditor背景",
//     "c": [
//       "#ddd",
//     ],
//   },
//   "caret_2051": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "caret_2051",
//     "d": "PlainEditor的光标",
//     "c": [
//       "#444444",
//     ],
//   },
//   "selec_2053": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "selec_2053",
//     "d": "PlainEditor的选区",
//     "p": [
//       ["caret_2051", 0],
//     ],
//     "c": [
//       "a0.333",
//     ],
//   },
//   "selec_ovlap_2056": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "selec_ovlap_2056",
//     "d": "PlainEditor覆盖图片的选区",
//     "c": [
//       "rgba(218, 255, 153, .5)",
//     ],
//   },
//   "shadowcaret_2052": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "shadowcaret_2052",
//     "d": "PlainEditor的影子光标",
//     "p": [
//       ["caret_2051", 0],
//     ],
//     "c": [
//       "s-0.9",
//     ],
//   },
//   "shadowselec_2059": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "shadowselec_2059",
//     "d": "PlainEditor的影子选区",
//     "p": [
//       ["selec_2053", 0],
//     ],
//     "c": [
//       "s-0.9",
//     ],
//   },
//   "shadowselec_ovlap_2062": {
//     "t": "PlainEdtr",
//     "g": ["plaineditor"],
//     "n": "shadowselec_ovlap_2062",
//     "d": "PlainEditor覆盖图片的影子选区",
//     "c": [
//       "#ddd",
//     ],
//   },
// });
/*80--------------------------------------------------------------------------*/

/**
 * Fetch, validate, then assign to `document[$theme].raw_o`
 * @noreject
 */
export async function loadTheme() {
  /*#static*/ if (_TRACE) {
    console.log(`${global.indent}>>>>>>> loadTheme() >>>>>>>`);
  }
  // /*#static*/ if (MOZCENTRAL) {
  //   // Firefox does not implement "import assert {type: json}" yet.
  //   // Ref. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#browser_compatibility
  //   return;
  // }

  try {
    // Object.assign(
    //   document[$theme].raw_o,
    //   (await import("../data/theme/premsys.theme.json", {
    //     assert: { type: "json" },
    //   })).default,
    // );
    const DATA = (await import("../data/theme/premsys_theme.js"))
      .default as [PaleName, PaleRaw][];
    // console.log(DATA);
    for (const raw of DATA) {
      try {
        z.tuple([zPaleName, zPaleRaw]).parse(raw);
        document[$theme].raw_o[raw[0]] = raw[1];
        document[$theme].ord_a.push(raw[0]);
      } catch (_) { /* no-ops */ }
    }
  } catch (err) {
    console.error(err);
  }
  // console.log(document[$theme].raw_o);

  // console.log(abc);
  // // console.log( `loadTheme( "${palegrup_x}" ):` );
  // // if( typeof theme_2028 !== "undefined" ) console.log( {theme_2028} );
  // /**
  //  * @const @param ret_y pale_o
  //  */
  // const check_g = (ret_y: PaleRaw) => {
  //   if (
  //     palegrup_x === undefined ||
  //     ret_y.g.some((pg) => pg === palegrup_x)
  //   ) {
  //     return ret_y;
  //   }
  //   return false;
  // };

  // document[$theme] = Object.create(null);
  // const theme_o = document[$theme].theme_o = Object.create(null);
  // if (
  //   typeof theme_2028 === "undefined" ||
  //   !theme_2028 ||
  //   !theme_2028.theme_ts ||
  //   theme_2028.theme_ts < THEME_DEFAULT_ts
  // ) {
  //   // console.log( `run here` );
  //   document[$theme].theme_ts = THEME_DEFAULT_ts;
  //   for (const palename in THEME_DEFAULT) {
  //     const pale_o = check_g(THEME_DEFAULT[palename]);
  //     if (pale_o) theme_o[palename] = pale_o;
  //   }
  // } else {
  //   document[$theme].theme_ts = theme_2028.theme_ts;
  //   for (const palename in THEME_DEFAULT) {
  //     // console.log( {palename} );
  //     let pale_o = theme_2028.theme_o[palename];
  //     if (!pale_o) pale_o = THEME_DEFAULT[palename];
  //     pale_o = check_g(pale_o);
  //     if (pale_o) theme_o[palename] = pale_o;
  //   }
  // }

  // // //! sort `r`
  // // const sortfunc = (a,b) => {
  // //   let ret = a[0] - b[0];
  // //   if (ret === 0) ret = a[1] - b[1];
  // //   return ret;
  // // };
  // // for( let palename in theme_o ) theme_o[palename].r.sort( sortfunc );
  // // // console.log( theme_o );

  // document[$theme_modified] = {
  //   pale_m: new Map<PaleName, Pale>(),
  // };
  // // tm.struct_ts = Date.now();
  /*#static*/ if (_TRACE) global.outdent;
  return;
}

export function readTheme(): ThemeJ_ {
  const ret: ThemeJ_ = [];
  for (const palename of document[$theme].ord_a) {
    const pale = document[$theme].pale_m.get(palename);
    if (pale) {
      ret.push([palename, pale.toJSON()]);
    } else {
      ret.push([palename, document[$theme].raw_o[palename]]);
    }
  }
  return ret;
}

export async function saveTheme(): Promise<BeReturn> {
  return await wretch(`${D_base_}/api/v1/updateTheme`)
    .put({
      theme_j: JSON.stringify(readTheme()),
    } as UpdateTheme_PUT)
    .json((jo: { ret: BeReturn }) => {
      /* After everything is ok, ... */
      document[$theme].modified_mo.val = false;
      return jo.ret;
    })
    .catch((err: unknown) => {
      console.error("There has been a problem with the fetch operation:", err);
      return BeReturn.fail_connection;
    });
  // try {
  //   const res = await fetch(D_base_, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       fn: "updateTheme",
  //       theme_j: JSON.stringify(readTheme(), undefined, 2),
  //     }),
  //   });
  //   const jo: { ret: BeReturn } = await res.json();
  //   // After everything is ok, ...
  //   document[$theme].modified_mo.val = false;
  //   return jo.ret;
  // } catch (err) {
  //   console.error("There has been a problem with the fetch operation:", err);
  //   return BeReturn.fail_connection;
  // }
}
/*80--------------------------------------------------------------------------*/

// const Pe = EdtrType.plain;
// const Ce = EdtrType.mdext_code;
// const Re = EdtrType.mdextrich;
// document[$palename] = {
//   bg: {
//     [Pe]: "plain_bg_2050",
//     [Ce]: "mdcode_bg_2026",
//     [Re]: "mdrich_bg_2042",
//   },
//   caret: {
//     [Pe]: "caret_2051",
//     [Ce]: "caret_2041",
//     [Re]: "caret_2043",
//     shadow: {
//       [Pe]: "shadowcaret_2052",
//       [Ce]: "shadowcaret_2048",
//       [Re]: "shadowcaret_2049",
//     },
//   },
//   selec: {
//     [Pe]: "selec_2053",
//     [Ce]: "selec_2054",
//     [Re]: "selec_2055",
//     shadow: {
//       [Pe]: "shadowselec_2059",
//       [Ce]: "shadowselec_2060",
//       [Re]: "shadowselec_2061",
//     },
//   },
//   selec_ovlap: {
//     [Pe]: "selec_ovlap_2056",
//     [Ce]: "selec_ovlap_2057",
//     [Re]: "selec_ovlap_2058",
//     shadow: {
//       [Pe]: "shadowselec_ovlap_2062",
//       [Ce]: "shadowselec_ovlap_2063",
//       [Re]: "shadowselec_ovlap_2064",
//     },
//   },
// };
// // console.log( document[$theme] );
/*80--------------------------------------------------------------------------*/
