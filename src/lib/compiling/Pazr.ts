/** 80**************************************************************************
 * @module lib/compiling/Pazr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { id_t } from "../alias.ts";
import { INOUT } from "../../global.ts";
import { SortedArray } from "../util/SortedArray.ts";
import { assert, out } from "../util/trace.ts";
import type { Tok } from "./alias.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { Lexr } from "./Lexr.ts";
import type { PlainTok } from "./plain/PlainTok.ts";
import { calcCommon, SortedStnode_depth, type Stnode } from "./Stnode.ts";
import type { TokBufr } from "./TokBufr.ts";
import type { Token } from "./Token.ts";
/*80--------------------------------------------------------------------------*/

class SortedStnode_id_<T extends Tok = BaseTok> extends SortedArray<Stnode<T>> {
  constructor(val_a_x?: Stnode<T>[]) {
    super((a, b) => a.id < b.id, val_a_x);
  }
}

export abstract class Pazr<T extends Tok = BaseTok> {
  static #ID = 0 as id_t;
  readonly id = ++Pazr.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

  protected bufr$!: TokBufr<T>;
  get bufr() {
    return this.bufr$;
  }
  protected lexr$!: Lexr<T>;
  get lexr() {
    return this.lexr$;
  }

  protected root$: Stnode<T> | undefined;
  get root() {
    return this.root$;
  }

  drtSn_$: Stnode<T> | undefined;
  get drtSn() {
    return this.drtSn_$;
  }
  /**
   * Last (finally) parsed `Stnode`
   */
  newSn_$: Stnode<T> | undefined;
  get newSn() {
    return this.newSn_$;
  }

  protected readonly errSn_sa$ = new SortedStnode_id_<T>();
  get hasErr() {
    return this.errSn_sa$.length;
  }
  get _err() {
    const ret: [string, string[]][] = [];
    for (const sn of this.errSn_sa$) {
      ret.push([sn._info, sn._err]);
    }
    return ret;
  }

  curTk$: Token<T> | undefined;
  // get _curtk() { return this.curTk$; }
  stopToken$: Token<T> | undefined;

  /**
   * @headconst @param bufr_x
   * @headconst @param lexr_x
   */
  constructor(bufr_x: TokBufr<T>, lexr_x: Lexr<T>) {
    this.reset(bufr_x, lexr_x);
  }

  /**
   * @final
   * @headconst @param bufr_x
   * @headconst @param lexr_x
   */
  reset(bufr_x: TokBufr<T>, lexr_x: Lexr<T>) {
    // const out = () => {
    //   assert( this.bufr$ );
    //   assert( this.lexr$ );
    //   // assert( this.curTk$ && this.curTk$.value === Tok.strtBdry );
    //   // assert( this.stopToken$ && this.curTk$.value === Tok.stopBdry );
    // };

    this.bufr$ = bufr_x;
    this.lexr$ = lexr_x;

    this.root$ = undefined;

    this.drtSn_$ = undefined;

    this.errSn_sa$.reset();
    // can not call `_markPazRegion()` b/c it needs `lex()` first

    // out();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #getBdryToken_back(ret_x?: Token<T>): Token<T> | undefined {
    const VALVE = 1_000;
    let valve = VALVE;
    while (ret_x && !ret_x.stnode_$ && --valve) {
      ret_x = ret_x.prevToken_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret_x;
  }
  #getBdryToken_forw(ret_x?: Token<T>): Token<T> | undefined {
    const VALVE = 1_000;
    let valve = VALVE;
    while (ret_x && !ret_x.stnode_$ && --valve) {
      ret_x = ret_x.nextToken_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret_x;
  }

  /**
   * Set `curTk$`, `stopToken$` by `ret_x`.
   */
  protected setPazRegion$(ret_x?: Stnode<T>) {
    if (ret_x) {
      if (ret_x.isRoot) {
        ret_x = undefined;
        this.curTk$ = this.lexr$.frstToken.nextToken_$;
        this.stopToken$ = this.lexr$.lastToken;
      } else {
        this.curTk$ = ret_x.frstToken;
        this.stopToken$ = ret_x.lastToken.nextToken_$;
      }
    } else {
      this.curTk$ = this.lexr$.frstToken.nextToken_$;
      this.stopToken$ = this.lexr$.lastToken;
    }
    return ret_x;
  }

  /** Helper */
  #sn_sa = new SortedStnode_id_<T>();
  /**
   * Invalidate "[curTk$, stopToken$).stnode" (if any) and their parents up to
   * `drtSn_$` (excluded)
   */
  protected invalidateBdries$() {
    const VALVE = 1_000;
    let valve = VALVE;
    const invalidateUp = (sn_y: Stnode<T> | undefined) => {
      while (sn_y && sn_y !== this.drtSn_$ && --valve) {
        if (this.#sn_sa.includes(sn_y)) break;

        sn_y.invalidateBdry();
        this.#sn_sa.add(sn_y);
        sn_y = sn_y.parent;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
    };
    let tk_ = this.curTk$!;
    do {
      if (tk_ === this.stopToken$) break;

      invalidateUp(tk_.stnode_$);
      tk_ = tk_.nextToken_$!;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
  }

  /**
   * Set `drtSn_$`, `curTk$`, `stopToken$`\
   * Reset `errSn_sa$`
   */
  @out((_, self: Pazr<T>) => {
    assert(
      self.curTk$ && self.stopToken$ &&
        self.curTk$.posSE(self.stopToken$),
    );
    if (self.drtSn_$) {
      assert(!self.drtSn_$.isRoot && !self.drtSn_$.hasErr);
      assert(self.curTk$ === self.drtSn_$.frstToken);
      assert(self.stopToken$ === self.drtSn_$.lastToken.nextToken_$);
    } else {
      assert(self.curTk$ === self.lexr$.frstToken.nextToken_$);
      assert(self.stopToken$ === self.lexr$.lastToken);
    }
  })
  private _markPazRegion() {
    this.curTk$ = undefined;
    this.stopToken$ = undefined;
    this.newSn_$ = undefined; //!

    const tk_0 = this.#getBdryToken_back(this.lexr$.strtToken_save);
    const tk_1 = this.#getBdryToken_forw(this.lexr$.stopToken);

    // /**
    //  * Needs tk_0, tk_1, this.drtSn_$
    //  */
    // const initPazRegion = () => {
    //   const tk = this.bufr$.frstLine.strtToken(this.lexr$);
    //   assert(tk && tk.value === Tok.strtBdry);
    //   this.curTk$ = tk.nextToken_$;

    //   this.stopToken$ = this.bufr$.lastLine.stopToken_$(this.lexr$);
    //   assert(this.stopToken$ && this.stopToken$.value === Tok.stopBdry);
    // }
    if (!tk_0 || !tk_1) { // 1915
      this.drtSn_$ = this.setPazRegion$();
    } else { // 1916
      const sn_sa = new SortedStnode_depth([tk_0.stnode_$!, tk_1.stnode_$!]);
      for (const sn of this.errSn_sa$) sn_sa.push(sn);
      this.drtSn_$ = this.setPazRegion$(calcCommon(sn_sa));
    }
    this.errSn_sa$.reset();
    this.#sn_sa.reset();
    this.invalidateBdries$();
    return this;
  }

  /**
   * `in( this.curTk$ && this.stopToken$ )`
   * @final
   */
  reachRigtBdry(): boolean {
    return this.curTk$!.posGE(this.stopToken$!);
  }
  /**
   * `in( this.curTk$ && this.stopToken$ )`
   * @final
   */
  overRigtBdry(): boolean {
    return this.curTk$!.posG(this.stopToken$!);
  }

  /** @final */
  @out((_, self: Pazr<T>) => {
    assert(self.curTk$ === self.stopToken$);
  })
  paz() {
    this._markPazRegion();

    if (this.reachRigtBdry()) {
      this.newSn_$ = undefined;
    } else {
      // if( this.drtSn_$ ) this.adjustPazRegionBy( this.drtSn_$ );
      this.paz_impl$();
    }
  }

  /**
   * `in( this.curTk$ && this.stopToken$ && !this.reachRigtBdry() )`
   */
  protected abstract paz_impl$(): void;

  // /**
  //  * Adjust `curTk$`, `stopToken$` by `sn_x`\
  //  * `in( this.curTk$ && this.stopToken$ )`
  //  * @final
  //  * @headconst @param sn_x
  //  */
  // adjustPazRegionBy(sn_x: Stnode<T>) {
  //   this.curTk$ = sn_x.frstToken;

  //   const stopTk = sn_x.lastToken.nextToken_$;
  //   // if( !this.stopToken$ ) this.stopToken$ = stopTk;
  //   if (stopTk && stopTk.posG(this.stopToken$!)) this.stopToken$ = stopTk;
  //   // if( !this.stopToken$ ) this.stopToken$ = this.lexr$.lastToken_1;
  //   /*#static*/ if (INOUT) {
  //     assert(this.curTk$!.posS(this.stopToken$!));
  //   }
  // }
}
/*80--------------------------------------------------------------------------*/

export class DoNothingPazr<T extends Tok = BaseTok> extends Pazr<T> {
  /** @implement */
  protected paz_impl$() {
    this.curTk$ = this.stopToken$;
  }
}

export class PlainPazr extends DoNothingPazr<PlainTok> {}
/*80--------------------------------------------------------------------------*/
