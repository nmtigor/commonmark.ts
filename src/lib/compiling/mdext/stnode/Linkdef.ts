/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Linkdef
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
import { Inline } from "./Inline.ts";
import type { Loc } from "../../Loc.ts";
import { INOUT } from "@fe-src/global.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Linkdef extends Inline {
  #labelTk_a;
  #destTk_a;
  #titleTk_a;

  override get children() {
    return undefined;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.#labelTk_a[0];
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#titleTk_a?.at(-1) ??
      this.#destTk_a.at(-1)!;
  }

  constructor(
    labelTk_a_x: MdextTk[],
    destTk_a_x: MdextTk[],
    titleTk_a_x: MdextTk[] | undefined,
  ) {
    super();
    this.#labelTk_a = labelTk_a_x;
    this.#destTk_a = destTk_a_x;
    if (titleTk_a_x?.length) this.#titleTk_a = titleTk_a_x;
    //jjjj TOCLEANUP
    // let tk_a: MdextTk[] | undefined = this.#labelTk_a;
    // let lastTok = MdextTok.bracket_colon;
    // for (const tk of tk_a_x) {
    //   if (tk_a === this.#labelTk_a) {
    //     tk_a.push(tk);
    //     if (tk.value === lastTok) tk_a = this.#destTk_a;
    //   } else if (tk_a === this.#destTk_a) {
    //     if (tk.value === MdextTok.link_dest_head) {
    //       lastTok = MdextTok.link_dest_tail;
    //     }
    //     if (lastTok === MdextTok.link_dest_tail) {
    //       tk_a.push(tk);
    //       if (tk.value === lastTok) tk_a = undefined;
    //     } else {
    //       tk_a.push(tk);
    //       tk_a = undefined;
    //     }
    //   } else {
    //     this.#titleTk_a ??= [];
    //     this.#titleTk_a.push(tk);
    //   }
    // }
    // /*#static*/ if (INOUT) {
    //   assert(
    //     this.#labelTk_a.length >= 3 &&
    //       this.#labelTk_a[0].value === MdextTok.bracket_open &&
    //       this.#labelTk_a.at(-1)!.value === MdextTok.bracket_colon,
    //   );
    //   if (this.#destTk_a.length === 3) {
    //     assert(
    //       this.#destTk_a[0].value === MdextTok.link_dest_head &&
    //         this.#destTk_a.at(-1)!.value === MdextTok.link_dest_tail,
    //     );
    //   } else {
    //     assert(this.#destTk_a.length === 1);
    //   }
    //   if (this.#titleTk_a) {
    //     assert(this.#titleTk_a.length);
    //     const frstUCod = this.#titleTk_a[0].strtLoc.ucod;
    //     const lastUCod = frstUCod === /* "(" */ 0x28
    //       ? /* ")" */ 0x29
    //       : frstUCod;
    //     assert(
    //       this.#titleTk_a.at(-1)!.stopLoc.peek_ucod(-1) === lastUCod,
    //     );
    //   }
    // }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(loc_x: Loc): MdextTk {
    if (this.#titleTk_a?.length) {
      for (let i = this.#titleTk_a.length; i--;) {
        const tk_ = this.#titleTk_a[i];
        if (tk_.touch(loc_x)) return tk_;
      }
    }
    for (let i = this.#destTk_a.length; i--;) {
      const tk_ = this.#destTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }
    for (let i = this.#labelTk_a.length; i--;) {
      const tk_ = this.#labelTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
}
/*80--------------------------------------------------------------------------*/
