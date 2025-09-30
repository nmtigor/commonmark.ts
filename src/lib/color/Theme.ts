/** 80**************************************************************************
 * @module lib/color/Theme
 * @license BSD-3-Clause
 ******************************************************************************/

import * as v from "@valibot/valibot";
import wretch from "@wretch";
import { BeReturn } from "../../alias.ts";
import { baseUrl } from "../../baseurl.mjs";
import { _TRACE, DEBUG } from "../../preNs.ts";
import { Boor } from "../Moo.ts";
import { tryCatch } from "../util/general.ts";
import { trace, traceOut } from "../util/trace.ts";
import { Pale, type PaleRaw, vPaleRaw } from "./Pale.ts";
import { type PaleName, vPaleName } from "./PaleCoor.ts";
import type { Cssc } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

type ThemeRaw_ = { [palename: PaleName]: PaleRaw };
type JO_theme_ = [PaleName, PaleRaw][];

export const enum ThemeMode {
  unknown = 1,
  ligt,
  dark,
}

const D_base_ = /*#static*/ DEBUG ? baseUrl : "https://premsys.org"; //jjjj
/*64----------------------------------------------------------*/

/** @final */
export class Theme {
  readonly raw_o: ThemeRaw_ = {};
  readonly ord_a: PaleName[] = [];
  readonly pale_m = new Map<PaleName, Pale>();
  readonly modified_br_Theme = new Boor();

  #mode = ThemeMode.unknown;
  get mode() {
    return this.#mode;
  }

  /** @const @param data_x */
  private constructor(data_x: [PaleName, PaleRaw][]) {
    // console.log(data_x);
    // for (const raw of data_x) {
    //   const parsed = z.tuple([zPaleName, zPaleRaw]).safeParse(raw);
    //   if (!parsed.success && parsed.error.toString().includes("ColrStep_old")) {
    //     // console.log(g_zPath, g_zNuev);
    //     let v_: any = raw;
    //     for (let i = 0; i < g_zPath.length - 1; ++i) v_ = v_[g_zPath[i]];
    //     // console.log(v_);
    //     v_[g_zPath.at(-1)!] = g_zNuev;
    //   }
    // }
    // // console.log(data_x);
    for (const raw of data_x) {
      if (v.safeParse(v.tuple([vPaleName, vPaleRaw]), raw).success) {
        this.raw_o[raw[0]] = raw[1];
        this.ord_a.push(raw[0]);
      }
    }
    // console.log(this.raw_o);
    // if (Object.keys(this.raw_o).length === data_x.length) {
    //   this.save();
    // }
  }
  static #instance: Theme;
  static get instance() {
    return this.#instance;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  @traceOut(_TRACE)
  static async load() {
    /*#static*/ if (_TRACE) {
      console.log(`${trace.indent}>>>>>>> Theme.load() >>>>>>>`);
    }
    const { data: mod, error } = await tryCatch(
      import("../../data/theme/premsys_theme.js"),
    );
    if (error) {
      console.error(error);
      return;
    }

    Theme.#instance = new Theme(mod.default as [PaleName, PaleRaw][]);
  }

  async save(): Promise<BeReturn> {
    return await wretch(`${D_base_}/api/v1/updateTheme`)
      .put({
        theme_j: JSON.stringify(this),
      })
      .json((jo: { ret: BeReturn }) => {
        /* After everything is ok, ... */
        this.modified_br_Theme.val = false;
        return jo.ret;
      })
      .catch((err: unknown) => {
        console.error(`Save Theme failed: ${err}`);
        return BeReturn.fail_connection;
      });
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @const @param cssc_x */
  readonly #act = (cssc_x?: Cssc) => {
    const baseCoor = Pale.get("Base").forceHex().coor;
    if (cssc_x) baseCoor.setMapped(cssc_x);
    else baseCoor.run();

    Pale.get("Error").forceHex().coor.run();
  };

  /**
   * Except "Base", cidx 0 for ligt mode.
   * @const @param cssc_x
   */
  setLigt(cssc_x?: Cssc): void {
    if (this.#mode === ThemeMode.ligt && !cssc_x) return;

    for (const palename of this.ord_a) {
      const pale = this.pale_m.get(palename);
      if (pale) {
        pale.cidx_mo.set_Moo(0);
        pale.forceHex();
      } else {
        this.raw_o[palename].cidx = 0;
      }
    }
    this.#act(cssc_x);

    this.#mode = ThemeMode.ligt;
  }

  /** Except "Base", cidx 1 for dark mode, or 0 if there is no cidx 1. */
  setDark(cssc_x?: Cssc): void {
    if (this.#mode === ThemeMode.dark && !cssc_x) return;

    for (const palename of this.ord_a) {
      const pale = this.pale_m.get(palename);
      if (pale) {
        pale.cidx_mo.set_Moo(pale.coor_a.at(1) ? 1 : 0);
        pale.forceHex();
      } else {
        const raw = this.raw_o[palename];
        raw.cidx = raw.coors.at(1) ? 1 : 0;
      }
    }
    this.#act(cssc_x);

    this.#mode = ThemeMode.dark;
  }

  /**
   * @const @param mode
   * @const @param cssc
   */
  set({ mode, cssc }: { mode?: "ligt" | "dark"; cssc?: Cssc }) {
    if (mode) {
      /* final switch */ ({
        ligt: () => this.setLigt(cssc),
        dark: () => this.setDark(cssc),
      }[mode])();
    } else if (cssc) {
      Pale.get("Base").coor.setMapped(cssc);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON(): JO_theme_ {
    const ret: JO_theme_ = [];
    for (const palename of this.ord_a) {
      const pale = this.pale_m.get(palename);
      if (pale) {
        ret.push([palename, pale.toJSON()]);
      } else {
        ret.push([palename, this.raw_o[palename]]);
      }
    }
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
