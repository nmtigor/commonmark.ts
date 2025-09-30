/** 80**************************************************************************
 * @module lib/compiling/Pazr
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../preNs.ts";
import type { id_t } from "../alias.ts";
import { assert, out } from "../util.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { Lexr } from "./Lexr.ts";
import { SortedStnod_id, Stnode } from "./Stnode.ts";
import type { TokBart } from "./TokBart.ts";
import type { TokBufr } from "./TokBufr.ts";
import { type Token } from "./Token.ts";
import type { Tok } from "./alias.ts";
import type { PlainTok } from "./plain/PlainTok.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Pazr<T extends Tok = BaseTok> {
  static #ID = 0 as id_t;
  readonly id = ++Pazr.#ID as id_t;
  /** @final */
  get _type_id_() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  get bufr(): TokBufr<T> | TokBart<T> {
    return this.lexr$.bufr;
  }

  /* lexr$ */
  protected lexr$!: Lexr<T>;
  /** @final */
  get lexr() {
    return this.lexr$;
  }

  headBdryClrTk_$: Token<T> | undefined;
  tailBdryClrTk_$: Token<T> | undefined;

  //jjjj TOCLEANUP
  // /** @primaryconst @param loc_x */
  // headClr(loc_x: Loc): boolean {
  //   return !!this.headBdryClrTk_$?.sntStopLoc.posGE(loc_x);
  // }
  // /** @primaryconst @param loc_x */
  // tailClr(loc_x: Loc): boolean {
  //   return !!this.tailBdryClrTk_$?.sntStrtLoc.posSE(loc_x);
  // }
  /* ~ */

  protected root$: Stnode<T> | undefined;
  get root() {
    return this.root$;
  }

  /* drtSn_$ */
  drtSn_$: Stnode<T> | undefined;
  get drtSn() {
    return this.drtSn_$;
  }
  /* ~ */

  /* newSn_$ */
  /** Last (finally) parsed Stnode */
  newSn_$: Stnode<T> | undefined;
  get newSn() {
    return this.newSn_$;
  }
  /* ~ */

  /* errSn_sa$ */
  protected readonly errSn_sa$ = new SortedStnod_id();
  get hasErr() {
    return !!this.errSn_sa$.length;
  }

  get _err_() {
    const ret: [string, string[]][] = [];
    for (const sn of this.errSn_sa$) {
      ret.push([sn._info_, sn._err_]);
    }
    return ret;
  }
  /* ~ */

  readonly unrelSn_sa_$ = new SortedStnod_id();
  /** reused, or partially reuesed, or abandoned */
  readonly takldSn_sa_$ = new SortedStnod_id();

  protected strtPazTk$!: Token<T>;
  get strtPazTk_$() {
    return this.strtPazTk$;
  }
  // get _curtk() { return this.strtPazTk$; }
  protected stopPazTk$!: Token<T>;
  get stopPazTk_$() {
    return this.stopPazTk$;
  }

  /** @headconst @param lexr_x */
  constructor(lexr_x: Lexr<T>) {
    this.reset_Pazr$(lexr_x);
  }

  /**
   * @final
   * @headconst @param lexr_x
   */
  protected reset_Pazr$(lexr_x: Lexr<T>): this {
    this.lexr$ = lexr_x;
    this.headBdryClrTk_$ = undefined;
    this.tailBdryClrTk_$ = undefined;

    this.root$ = undefined;
    this.drtSn_$ = undefined;
    this.newSn_$ = undefined;

    this.errSn_sa$.reset_SortedArray();
    this.unrelSn_sa_$.reset_SortedArray();
    this.takldSn_sa_$.reset_SortedArray();

    this.strtPazTk$ = this.lexr$.frstLexTk;
    this.stopPazTk$ = this.lexr$.lastLexTk;
    return this;
  }

  /** @headconst @param lexr_x */
  reset_Pazr(lexr_x?: Lexr<T>): this {
    return this.reset_Pazr$(lexr_x ?? this.lexr$);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Assign `strtPazTk$`, `stopPazTk$`
   * @final
   */
  protected setPazRegion$(ret_x?: Stnode<T>): Stnode<T> | undefined {
    if (ret_x && !ret_x.isRoot) {
      this.strtPazTk$ = ret_x.frstToken.prevToken_$!;
      this.stopPazTk$ = ret_x.lastToken.nextToken_$!;
    } else {
      this.strtPazTk$ = this.lexr$.frstLexTk;
      this.stopPazTk$ = this.lexr$.lastLexTk;
      ret_x = undefined;
    }
    return ret_x;
  }

  /** Helper */
  #tmpSn_sa = new SortedStnod_id();
  /**
   * Invalidate "(strtPazTk$, stopPazTk$).stnod_$" (if any) and their parents up to
   * `drtSn_$` (excluded)\
   * Use `#tmpSn_sa`
   * @final
   */
  protected invalidateBdries$(): void {
    this.#tmpSn_sa.reset_SortedArray();

    const VALVE = 1_000;
    let valve = VALVE;
    const invalidateUp = (sn_y: Stnode<T> | undefined) => {
      while (sn_y && !this.#tmpSn_sa.includes(sn_y) && --valve) {
        sn_y.invalidateBdry();
        this.#tmpSn_sa.add(sn_y);
        if (sn_y === this.drtSn_$) break;
        sn_y = sn_y.parent;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
    };
    let tk_ = this.strtPazTk$.nextToken_$;
    do {
      if (!tk_ || tk_ === this.stopPazTk$) break;

      invalidateUp(tk_.stnod_$);
      tk_ = tk_.nextToken_$;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    this.#tmpSn_sa.reset_SortedArray();
  }

  /**
   * Enlarge (strtTk_x, stopTk_x) to (strtPazTk$, stopPazTk$)
   * @headconst @param strtTk_x
   * @headconst @param stopTk_x
   */
  #enlargeBdries(strtTk_x: Token<T>, stopTk_x: Token<T>): void {
    /*#static*/ if (INOUT) {
      assert(this.strtPazTk$.posSE(strtTk_x));
      assert(this.stopPazTk$.posGE(stopTk_x));
    }
    this.lexr$.batchBack_$(
      (tk) => tk.saveRanval_$(),
      strtTk_x,
      this.strtPazTk$,
    );
    this.lexr$.batchForw_$(
      (tk) => tk.saveRanval_$(),
      stopTk_x,
      this.stopPazTk$,
    );
    this.invalidateBdries$();
  }

  protected sufpazmrk$() {}

  /**
   * Mark paz region
   *
   * Assign `drtSn_$`, `strtPazTk$`, `stopPazTk$`\
   * Reset `errSn_sa$`
   */
  @out((self: Pazr<T>) => {
    assert(self.strtPazTk$.posS(self.stopPazTk$));
    if (self.drtSn_$) {
      assert(!self.drtSn_$.isRoot && !self.drtSn_$.isErr);
      assert(self.strtPazTk$ === self.drtSn_$.frstToken.prevToken_$);
      assert(self.stopPazTk$ === self.drtSn_$.lastToken.nextToken_$);
    } else {
      assert(self.strtPazTk$ === self.lexr$.frstLexTk);
      assert(self.stopPazTk$ === self.lexr$.lastLexTk);
    }
  })
  pazmrk_$(): this {
    this.headBdryClrTk_$ = this.lexr$.strtLexTk_$;
    this.tailBdryClrTk_$ = this.lexr$.stopLexTk_$;
    this.newSn_$ = undefined; //!
    this.unrelSn_sa_$.reset_SortedArray();
    this.takldSn_sa_$.reset_SortedArray();
    const unrelSn_a: Stnode<T>[] = [];

    const VALVE = 10_000;
    let valve = VALVE;

    /* find boundary token backward */
    let clrTk_0: Token<T> | undefined = this.headBdryClrTk_$;
    while (!clrTk_0.stnod_$ && (clrTk_0 = clrTk_0.prevToken_$) && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    if (clrTk_0?.stnod_$!.lastToken.posSE(this.headBdryClrTk_$)) {
      let sn_: Stnode<T> | undefined = clrTk_0.stnod_$!;
      let sn_1: Stnode<T> | undefined;
      do {
        if (sn_.filterTo(unrelSn_a, sn_1)) break;
        sn_1 = sn_;
      } while (
        (sn_ = sn_.parent_$) && sn_.lastToken.posSE(this.headBdryClrTk_$) &&
        --valve
      );
    }

    /* find boundary token forward */
    let clrTk_1: Token<T> | undefined = this.tailBdryClrTk_$;
    while (!clrTk_1.stnod_$ && (clrTk_1 = clrTk_1.nextToken_$) && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    if (clrTk_1?.stnod_$!.frstToken.posGE(this.tailBdryClrTk_$)) {
      let sn_: Stnode<T> | undefined = clrTk_1.stnod_$!;
      let sn_1: Stnode<T> | undefined;
      do {
        if (sn_.filterTo(unrelSn_a, sn_1)) break;
        sn_1 = sn_;
      } while (
        (sn_ = sn_.parent_$) && sn_.frstToken.posGE(this.tailBdryClrTk_$) &&
        --valve
      );
    }

    if (!clrTk_0 || !clrTk_1) { // 1915
      if (clrTk_0) {
        let sn_: Stnode<T> | undefined = clrTk_0.stnod_$!;
        while ((sn_ = sn_.prevStnod) && --valve) sn_.filterTo(unrelSn_a);
        assert(valve, `Loop ${VALVE}±1 times`);
      }
      if (clrTk_1) {
        let sn_: Stnode<T> | undefined = clrTk_1.stnod_$!;
        while ((sn_ = sn_.nextStnod) && --valve) sn_.filterTo(unrelSn_a);
        assert(valve, `Loop ${VALVE}±1 times`);
      }
      this.unrelSn_sa_$.add_O(unrelSn_a);
      this.drtSn_$ = this.setPazRegion$();
    } else { // 1916
      Stnode.sn_sa
        .reset_SortedArray().messUp()
        .push(clrTk_0.stnod_$!, clrTk_1.stnod_$!);
      let tk_: Token<T> | undefined = clrTk_0;
      while ((tk_ = tk_.nextToken_$) && tk_ !== clrTk_1 && --valve) {
        if (tk_.stnod_$) Stnode.sn_sa.push(tk_.stnod_$);
      }
      assert(valve, `Loop ${VALVE}±1 times`);
      Stnode.sn_sa.push(...this.errSn_sa$);
      this.drtSn_$ = this.setPazRegion$(
        Stnode.calcCommon({ unrelSn_sa: this.unrelSn_sa_$, unrelSn_a }),
      );
    }
    this.errSn_sa$.reset_SortedArray();

    this.#enlargeBdries(this.headBdryClrTk_$, this.tailBdryClrTk_$);
    this.sufpazmrk$();
    return this;
  }

  /**
   * * Enlarge bdries from (strtPazTk$, stopPazTk$) to bdries of `sn_x`
   * * Restore and possibly replenish `unrelSn_sa_$`
   * * Reassign `drtSn_$`
   * @final
   * @headconst @param sn_x
   */
  enlargeBdriesTo_$(sn_x: Stnode<T>): void {
    /*#static*/ if (INOUT) {
      assert(sn_x.isAncestorOf(this.drtSn_$));
    }
    // console.log(`%crun here: `, `color:${LOG_cssc.runhere}`);
    const unrelSn_a: Stnode<T>[] = [];
    sn_x.filterChildrenTo(unrelSn_a, this.drtSn_$);
    this.unrelSn_sa_$.add_O(unrelSn_a);
    this.unrelSn_sa_$.add_O(this.takldSn_sa_$);
    this.takldSn_sa_$.reset_SortedArray();

    const origStrtTk = this.drtSn_$!.frstToken.prevToken_$!;
    const origStopTk = this.drtSn_$!.lastToken.nextToken_$!;
    this.drtSn_$ = this.setPazRegion$(sn_x);
    this.errSn_sa$.reset_SortedArray();

    this.#enlargeBdries(origStrtTk, origStopTk);
  }

  //jjjj TOCLEANUP
  // /**
  //  * Enlarge bdries from (strtPazTk$, stopPazTk$) to maximum
  //  * @final
  //  */
  // maximizeBdries_$(): void {
  //   /*#static*/ if (INOUT) {
  //     assert(!this.drtSn_$);
  //   }
  //   const origStrtTk = this.strtPazTk$;
  //   const origStopTk = this.stopPazTk$;
  //   this.setPazRegion$();
  //   this.#enlargeBdries(origStrtTk, origStopTk);
  // }

  /** @final */
  protected reachPazBdry$(): boolean {
    return this.strtPazTk$.posGE(this.stopPazTk$);
  }
  /** @final */
  overRigtBdry(): boolean {
    return this.strtPazTk$.posG(this.stopPazTk$!);
  }

  /** @final */
  @out((self: Pazr<T>) => {
    assert(self.strtPazTk$ === self.stopPazTk$);
  })
  paz() {
    this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    if (this.reachPazBdry$()) {
      this.newSn_$ = undefined;
    } else {
      //jjjj TOCLEANUP
      // if( this.drtSn_$ ) this.adjustPazRegionBy( this.drtSn_$ );
      this.paz_impl$();
    }
  }

  /** `in( !this.reachPazBdry$() )` */
  protected abstract paz_impl$(): void;

  //jjjj TOCLEANUP
  // /**
  //  * Adjust `strtPazTk$`, `stopPazTk$` by `sn_x`\
  //  * @final
  //  * @headconst @param sn_x
  //  */
  // adjustPazRegionBy(sn_x: Stnode<T>) {
  //   this.strtPazTk$ = sn_x.frstToken;

  //   const stopTk = sn_x.lastToken.nextToken_$;
  //   // if( !this.stopPazTk$ ) this.stopPazTk$ = stopTk;
  //   if (stopTk && stopTk.posG(this.stopPazTk$!)) this.stopPazTk$ = stopTk;
  //   // if( !this.stopPazTk$ ) this.stopPazTk$ = this.lexr$.lastToken_1;
  //   /*#static*/ if (INOUT) {
  //     assert(this.strtPazTk$.posS(this.stopPazTk$!));
  //   }
  // }
}
/*80--------------------------------------------------------------------------*/

export class DoNothingPazr<T extends Tok = BaseTok> extends Pazr<T> {
  override pazmrk_$(): this {
    this.setPazRegion$();
    return this;
  }

  /** @implement */
  protected paz_impl$() {
    this.strtPazTk$ = this.stopPazTk$;
  }
}

/** @final */
export class PlainPazr extends DoNothingPazr<PlainTok> {}
/*80--------------------------------------------------------------------------*/
