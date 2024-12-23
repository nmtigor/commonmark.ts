/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Linkdef
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import { gathrUnrelTk } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Linkdef extends Inline {
  readonly lablTk_a;
  readonly destTk_a;
  readonly titlTk_a;

  override get children() {
    return undefined;
  }

  override get frstToken() {
    return this.frstToken$ ??= this.lablTk_a[0];
  }
  override get lastToken() {
    return this.lastToken$ ??= this.titlTk_a?.at(-1) ??
      this.destTk_a.at(-1)!;
  }

  constructor(
    lablTk_a_x: MdextTk[],
    destTk_a_x: MdextTk[],
    titlTk_a_x: MdextTk[] | undefined,
  ) {
    super();
    this.lablTk_a = lablTk_a_x;
    this.destTk_a = destTk_a_x;
    this.titlTk_a = titlTk_a_x;

    this.ensureBdry();

    //jjjj TOCLEANUP
    // let tk_a: MdextTk[] | undefined = this.lablTk_a;
    // let lastTok = MdextTok.bracket_colon;
    // for (const tk of tk_a_x) {
    //   if (tk_a === this.lablTk_a) {
    //     tk_a.push(tk);
    //     if (tk.value === lastTok) tk_a = this.destTk_a;
    //   } else if (tk_a === this.destTk_a) {
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
    //     this.titlTk_a ??= [];
    //     this.titlTk_a.push(tk);
    //   }
    // }
    // /*#static*/ if (INOUT) {
    //   assert(
    //     this.lablTk_a.length >= 3 &&
    //       this.lablTk_a[0].value === MdextTok.bracket_open &&
    //       this.lablTk_a.at(-1)!.value === MdextTok.bracket_colon,
    //   );
    //   if (this.destTk_a.length === 3) {
    //     assert(
    //       this.destTk_a[0].value === MdextTok.link_dest_head &&
    //         this.destTk_a.at(-1)!.value === MdextTok.link_dest_tail,
    //     );
    //   } else {
    //     assert(this.destTk_a.length === 1);
    //   }
    //   if (this.titlTk_a) {
    //     assert(this.titlTk_a.length);
    //     const frstUCod = this.titlTk_a[0].strtLoc.ucod;
    //     const lastUCod = frstUCod === /* "(" */ 0x28
    //       ? /* ")" */ 0x29
    //       : frstUCod;
    //     assert(
    //       this.titlTk_a.at(-1)!.stopLoc.peek_ucod(-1) === lastUCod,
    //     );
    //   }
    // }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(loc_x: Loc): MdextTk {
    if (this.titlTk_a?.length) {
      for (let i = this.titlTk_a.length; i--;) {
        const tk_ = this.titlTk_a[i];
        if (tk_.touch(loc_x)) return tk_;
      }
    }
    for (let i = this.destTk_a.length; i--;) {
      const tk_ = this.destTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }
    for (let i = this.lablTk_a.length; i--;) {
      const tk_ = this.lablTk_a[i];
      if (tk_.touch(loc_x)) return tk_;
    }

    return /*#static*/ INOUT ? fail("Should not run here!") : this.frstToken;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    let ret = super.gathrUnrelSnt(drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    if (ret) return ret;

    for (const tk of this.lablTk_a) {
      ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }

    for (const tk of this.destTk_a) {
      ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
    }

    if (this.titlTk_a) {
      for (const tk of this.titlTk_a) {
        ret += gathrUnrelTk(tk, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
