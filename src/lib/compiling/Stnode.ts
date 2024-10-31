/** 80**************************************************************************
 * @module lib/compiling/Stnode
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../global.ts";
import type { id_t, int, loff_t, TupleOf, uint } from "../alias.ts";
import { type Less, SortedArray, SortedIdo } from "../util/SortedArray.ts";
import { Visitable } from "../util/Visitor.ts";
import { assert, fail, out } from "../util/trace.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { Loc } from "./Loc.ts";
import type { Token } from "./Token.ts";
import type { Tok } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

type Depth_ = uint | -1;
type NErr_ = 4;
const NErr_ = 4;

/** @final */
export class SortedStnod_depth extends SortedArray<Stnode<any>> {
  static #less: Less<Stnode<any>> = (a, b) => a.depth < b.depth;

  constructor(val_a_x?: Stnode<any>[]) {
    super(SortedStnod_depth.#less, val_a_x);
  }
}

/** @final */
export class SortedStnod_id extends SortedIdo<Stnode<any>> {
  _repr(): string[] {
    const ret: string[] = [];
    for (const v of this) ret.push(v._oldInfo);
    return ret;
  }
}

export type CalcCommonO_ = {
  unrelSn_sa?: SortedStnod_id;
  unrelSn_a?: Stnode<any>[];
  debug?: { a?: Stnode<any>[]; f?: Stnode<any>[][] };
};

/** >=1 */
const FilterDepth_ = 2;

/**
 * primaryconst: const exclude `#depth`, `frstToken$`, `lastToken$`
 */
export abstract class Stnode<T extends Tok = BaseTok> extends Visitable {
  static #ID = 0 as id_t;
  /** @final */
  readonly id = ++Stnode.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

  /* parent_$ */
  parent_$: Stnode<T> | undefined;
  get parent() {
    return this.parent_$;
  }
  /** @final */
  get isRoot() {
    return !this.parent_$;
  }

  /** @final */
  get root_1() {
    let ret: Stnode<T> = this;
    const VALVE = 1_000;
    let valve = VALVE;
    while (ret.parent_$ && --valve) ret = ret.parent_$;
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret;
  }
  /**
   * Inclusive
   * @final
   */
  isAncestorOf(sn_x?: Stnode<T>) {
    const VALVE = 1_000;
    let valve = VALVE;
    while (sn_x && --valve) {
      if (sn_x === this) return true;
      sn_x = sn_x.parent_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    return false;
  }
  /* ~ */

  /* children$ */
  protected children$: Stnode<T>[] | undefined;
  get children(): Stnode<T>[] | undefined {
    return fail("Not implemented");
  }
  _c(i_x: int) {
    return this.children?.at(i_x);
  }

  get hasChild() {
    return this.children?.length;
  }

  /** @final */
  get frstChild(): Stnode<T> | undefined {
    return this.children?.at(0);
  }
  /** @final */
  get lastChild(): Stnode<T> | undefined {
    return this.children?.at(-1);
  }

  // /** @final */
  // get frstLeaf(): Stnode<T> | undefined {
  //   const c_ = this.frstChild;
  //   if (!c_) return undefined;

  //   const ret = c_.frstLeaf;
  //   return ret ?? c_;
  // }
  // /** @final */
  // get lastLeaf(): Stnode<T> | undefined {
  //   const c_ = this.lastChild;
  //   if (!c_) return undefined;

  //   const ret = c_.lastLeaf;
  //   return ret ?? c_;
  // }

  /**
   * @return [COPIED]
   */
  get siblings(): Stnode<T>[] | undefined {
    const s_a = this.parent_$?.children;
    if (!s_a?.length) return undefined;

    const i_ = s_a.indexOf(this);
    return i_ >= 0 ? s_a.toSpliced(i_, 1) : undefined;
  }

  get prevStnod(): Stnode<T> | undefined {
    const s_a = this.parent_$?.children;
    if (!s_a?.length) return undefined;

    const i_ = s_a.indexOf(this);
    return i_ > 0 ? s_a[i_ - 1] : this.parent_$!.prevStnod;
  }
  get nextStnod(): Stnode<T> | undefined {
    const s_a = this.parent_$?.children;
    if (!s_a?.length) return undefined;

    const i_ = s_a.indexOf(this);
    return 0 <= i_ && i_ < s_a.length - 1
      ? s_a[i_ + 1]
      : this.parent_$!.nextStnod;
  }

  // /**
  //  * Not rely on the token chain
  //  * @final
  //  */
  // get prevLeaf(): Stnode<T> | undefined {
  //   const s_a = this.parent_$?.children;
  //   if (!s_a?.length) return undefined;

  //   const i_ = s_a.indexOf(this);
  //   return i_ > 0 ? s_a[i_ - 1].frstLeaf : this.parent_$!.prevLeaf;
  // }
  // /** @see {@linkcode prevLeaf} */
  // get nextLeaf(): Stnode<T> | undefined {
  //   const s_a = this.parent_$?.children;
  //   if (!s_a?.length) return undefined;

  //   const i_ = s_a.indexOf(this);
  //   return 0 <= i_ && i_ < s_a.length - 1
  //     ? s_a[i_ + 1].lastLeaf
  //     : this.parent_$!.nextLeaf;
  // }
  /* ~ */

  /* #depth */
  /** 0 means no parent */
  #depth: Depth_ = -1;
  get depth() {
    return this.#depth;
  }
  set depth_$(de_x: Depth_) {
    this.#depth = de_x;
  }

  /** @final */
  get depth_1(): Depth_ {
    let ret: Depth_ = 0;
    let pa_ = this.parent_$;
    const VALVE = 1_000;
    let valve = VALVE;
    while (pa_ && --valve) {
      ret++;
      if (pa_.#depth >= 0) {
        ret += pa_.#depth;
        break;
      }
      pa_ = pa_.parent_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    return this.#depth = ret;
  }

  /** @final */
  get depth_2(): Depth_ {
    return (this.parent_$?.depth_2 ?? -1) + 1;
  }
  /* ~ */

  /* #errMsg_a */
  readonly #errMsg_a = new Array(NErr_).fill("") as TupleOf<string, NErr_>;
  get _err(): string[] {
    return this.#errMsg_a.filter(Boolean);
  }
  /** @fianl */
  get isErr(): boolean {
    return !!this.#errMsg_a[0];
  }

  /**
   * @const @param errMsg_x
   */
  setErr(errMsg_x: string): this {
    for (let i = 0; i < NErr_; ++i) {
      if (!this.#errMsg_a[i]) {
        this.#errMsg_a[i] = errMsg_x;
        break;
      }
    }
    return this;
  }

  clrErr(): this {
    this.#errMsg_a.fill("");
    return this;
  }
  /* ~ */

  /** @final */
  get safeSn_1() {
    let ret: Stnode<T> = this;
    const VALVE = 1_000;
    let valve = VALVE;
    while (ret.isErr && ret.parent_$ && --valve) ret = ret.parent_$;
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret;
  }

  /* frstToken$ */
  protected frstToken$: Token<T> | undefined;
  /**
   * ! Do not call in `Pazr.markPazRegion_$()`
   * @primaryconst
   */
  get frstToken(): Token<T> {
    return fail("Not implemented");
  }
  /** @final */
  get frstBdryTk(): Token<T> {
    const tk_ = this.frstToken;
    tk_.stnod_$ ??= this; // First setting wins.
    return tk_;
  }
  /** @final */
  get sntFrstLine() {
    return this.frstToken.sntFrstLine;
  }
  /** @final */
  get snFrstLidx_1() {
    return this.sntFrstLine.lidx_1;
  }
  /** @final */
  get sntStrtLoc() {
    return this.frstToken.sntStrtLoc;
  }
  /** @final */
  get strtLoff(): loff_t {
    return this.frstToken.strtLoff;
  }
  /* ~ */

  /* lastToken$ */
  protected lastToken$: Token<T> | undefined;
  /**
   * ! Do not call in `Pazr.markPazRegion_$()`
   * @primaryconst
   */
  get lastToken(): Token<T> {
    return fail("Not implemented");
  }
  /** @final */
  get lastBdryTk(): Token<T> {
    const tk_ = this.lastToken;
    tk_.stnod_$ ??= this; // First setting wins.
    return tk_;
  }
  /** @final */
  get sntLastLine() {
    return this.lastToken.sntLastLine;
  }
  /** @final */
  get snLastLidx_1() {
    return this.sntLastLine.lidx_1;
  }
  /** @final */
  get sntStopLoc() {
    return this.lastToken.sntStopLoc;
  }
  /** @final */
  get stopLoff(): loff_t {
    return this.lastToken.stopLoff;
  }
  /* ~ */

  /**
   * ! Do not use `frstToken` and `lastToken`, because this will be called in
   * ! `Pazr.markPazRegion_$()()`.
   * @final
   */
  invalidateBdry(): this {
    if (this.frstToken$?.stnod_$ === this) {
      this.frstToken$.stnod_$ = undefined;
    }
    if (this.lastToken$?.stnod_$ === this) {
      this.lastToken$.stnod_$ = undefined;
    }
    this.frstToken$ = undefined;
    this.lastToken$ = undefined;
    return this;
  }

  /** @final */
  ensureBdry(): this {
    this.frstBdryTk;
    this.lastBdryTk;
    return this;
  }
  /** @final */
  ensureAllBdry(): this {
    const c_a = this.children;
    if (c_a) {
      for (const sn of c_a) sn.ensureAllBdry();
    }
    return this.ensureBdry();
  }

  /** @final */
  contain(loc_x: Loc): boolean {
    return this.sntStrtLoc.posSE(loc_x) && loc_x.posS(this.sntStopLoc);
  }
  /** @final */
  touch(loc_x: Loc): boolean {
    return this.sntStrtLoc.posSE(loc_x) && loc_x.posSE(this.sntStopLoc);
  }

  /** */
  constructor() {
    super();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param oldSn_x
   * @headconst @param newSn_x
   */
  replaceChild(_oldSn_x: Stnode<T>, _newSn_x?: Stnode<T>): void {
    return fail("Not implemented");
  }
  /** @final */
  removeSelf(): void {
    this.parent_$?.replaceChild(this);
  }

  //jjjj TOCLEANUP
  // /**
  //  * Helper function
  //  * @final
  //  * @headconst @param newSn_x
  //  */
  // transferParentTo(newSn_x: Stnode<T>) {
  //   /*#static*/ if (INOUT) {
  //     assert(!newSn_x.parent_$);
  //   }
  //   newSn_x.parent_$ = this.parent_$;
  //   /* Do not remove `this` from syntax tree because `this` (normally as
  //   `drtSn`) could be needed in `sufrepl_edtr` phase. */
  //   // this.parent_$ = undefined;
  // }

  //jjjj TOCLEANUP
  // /**
  //  * Helper function
  //  * @final
  //  * @headconst @param newSn_x
  //  */
  // transferBdryTo(newSn_x: Stnode<T>) {
  //   if (this.frstToken$?.stnod_$ === this) {
  //     this.frstToken$.stnod_$ = newSn_x;
  //   }
  //   if (this.lastToken$?.stnod_$ === this) {
  //     this.lastToken$.stnod_$ = newSn_x;
  //   }
  // }

  /**
   * Count Stnode error only. Do not count Token error.
   * @fianl
   */
  get hasErr_1(): boolean {
    if (this.isErr) return true;

    const c_a = this.children;
    if (c_a?.length) {
      for (const sn of c_a) {
        if (sn.hasErr_1) return true;
      }
    }

    return false;
  }

  /**
   * @final
   * @out @param sn_a
   * @headconst @param except_x
   * @const @param fd_x
   * @return same as `hasErr_1`
   */
  filterTo(
    sn_a: Stnode<T>[],
    except_x?: Stnode<T>,
    fd_x = FilterDepth_,
  ): boolean {
    if (this === except_x) return false;

    let ret = false;
    const c_a = this.children;
    if (c_a?.length) {
      for (const sn of c_a) {
        ret ||= fd_x === 1
          ? sn.hasErr_1
          : sn.filterTo(sn_a, except_x, fd_x - 1);
      }
    }
    if (ret) return true;

    if (this.isErr) ret = true;
    else sn_a.push(this);
    return ret;
  }
  /** @see {@linkcode filterTo()} */
  filterChildrenTo(sn_a: Stnode<T>[], except_x?: Stnode<T>): boolean {
    let ret = false;
    const c_a = this.children;
    if (c_a?.length) {
      for (const sn of c_a) {
        ret ||= sn.filterTo(sn_a, except_x);
      }
    }
    ret ||= this.isErr;
    return ret;
  }

  // /**
  //  * @final
  //  * @headconst @param { Token } token
  //  * @return { Boolean }
  //  */
  // directBdryBy$_( token )
  // {
  //   return this.frstToken$ === token || this.lastToken$ === token;
  // }

  // /** @final */
  // get isBdryValid() {
  //   return this.frstToken$.stnode === this && this.lastToken$.stnode === this;
  // }

  // /**
  //  * Is the beginning | end of the whole AST?
  //  * @final
  //  * @return { Boolean }
  //  */
  // isBeg()
  // {
  //   if( this.isRoot ) return true;

  //   return this.calcFrstToken() ===
  //          this.root1.calcFrstToken();
  // }
  // isEnd()
  // {
  //   if( this.isRoot ) return true;

  //   return this.calcLastToken() ===
  //          this.root1.calcLastToken();
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param sn_sa_x
   * @out @param unrelSn_sa
   * @headconst @param unrelSn_a
   * @out @param debug
   * @return `sn_sa_x[0]`
   */
  @out((_, _1, args) => {
    const sn_sa = args[0];
    assert(
      sn_sa.length === 1 && sn_sa[0] &&
        (!sn_sa[0].isErr || sn_sa[0].isRoot),
    );
  })
  static calcCommon(
    sn_sa_x: SortedStnod_depth,
    { unrelSn_sa, unrelSn_a, debug }: CalcCommonO_ = {},
  ): Stnode<any> {
    /*#static*/ if (INOUT) {
      assert(sn_sa_x.length);
    }
    if (sn_sa_x.length === 1) {
      return sn_sa_x[0];
    }

    const sn_0_a = unrelSn_sa ? sn_sa_x.slice() : undefined;

    sn_sa_x.forEach((sn) => sn.depth_1);
    sn_sa_x.resort();
    if (debug) debug.a = sn_sa_x.slice();

    let swapSn;
    const swap = (i_y: uint, j_y: uint): void => {
      if (i_y !== j_y) {
        swapSn = sn_sa_x[i_y];
        sn_sa_x[i_y] = sn_sa_x[j_y];
        sn_sa_x[j_y] = swapSn;
      }
    };

    const VALVE = 1_000;
    let valve = VALVE;

    /**
     * @const @param i_y sn_sa_x[i_y].#depth >= 0
     * @param n_y >=1
     */
    const floatUp = (i_y: uint, n_y: uint = 1): void => {
      let sn_i = sn_sa_x[i_y];
      let de_ = sn_i.depth;
      while (n_y--) {
        unrelSn_sa?.add_O(sn_i.siblings);
        sn_i = sn_sa_x[i_y] = sn_i.parent_$!;
        sn_i.depth_$ = --de_;
      }
    };

    /**
     * Make all of sorted `sn_sa_x` up `iUp_y` to the depth `tgtDe_y`.\
     * Remove duplicates.
     * @const @param iUp_y >=1
     * @const @param tgtDe_y
     */
    const floatupTail = (iUp_y: uint, tgtDe_y: Depth_): void => {
      let j_0 = iUp_y;
      for (; j_0--;) {
        if (sn_sa_x[j_0].depth !== tgtDe_y) {
          break;
        }
      }
      ++j_0; // Now `j_0` is the index of leftmost node depth equal to `tgtDe_y`.
      /*#static*/ if (INOUT) {
        assert(0 <= j_0 && j_0 < iUp_y);
      }

      const n_ = sn_sa_x.at(-1)!.depth - tgtDe_y;
      for (let k = sn_sa_x.length; k-- > iUp_y;) {
        floatUp(k, n_);
      }

      let len = sn_sa_x.length;
      /* Remove duplicates */
      L_0: while (j_0 < len - 1) {
        for (let j = j_0; j < len - 1; ++j) {
          if (sn_sa_x[j] === sn_sa_x[len - 1]) {
            sn_sa_x.length = --len;
            continue L_0;
          }
        }
        if (j_0 < len - 2) swap(j_0, len - 1);
        j_0++;
      }
    };

    let floatupTailCalled = false;
    L_0: while (sn_sa_x.length > 1 && --valve) {
      const de_0 = sn_sa_x.at(-1)!.depth;
      for (let i = sn_sa_x.length - 1; i--;) {
        const de_i = sn_sa_x[i].depth;
        if (
          de_i !== de_0 ||
          i === 0 && !floatupTailCalled
        ) {
          /* must be called at least once to remove duplicates */
          floatupTail(i + 1, de_i);
          floatupTailCalled = true;
          /*
        ! `sn_sa_x` can have been shortened */
          if (debug) {
            debug.f ??= [];
            debug.f.push(sn_sa_x.slice());
          }
          continue L_0;
        }
      }
      break;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    const floatupAll = (): void => {
      let len = sn_sa_x.length;
      if (len <= 1) return;

      for (let i = 0; i < len; i++) {
        floatUp(i);
        const sn_i = sn_sa_x[i];
        for (let j = i + 1; j < len;) {
          if (sn_i === sn_sa_x[j].parent) {
            swap(j, len - 1);
            sn_sa_x.length = --len;
          } else j++;
        }
      }

      floatupAll();
    };

    floatupAll();

    unrelSn_sa?.delete_O(sn_0_a);
    unrelSn_sa?.add_O(unrelSn_a);

    /* `sn_sa_x[0]` may be `hasErr` */
    sn_sa_x[0] = sn_sa_x[0].safeSn_1;
    return sn_sa_x[0];
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  override toString() {
    return this._type_id;
  }

  /** @final */
  get _info(): string {
    return `${this.constructor.name}(${this.depth_2})`;
  }
  //jjjj TOCLEANUP
  // /** @final */
  // get _oldInfo(): string {
  //   return `${this._info}[ ` +
  //     `${this.frstToken$?._name}${this.frstToken$?.oldRanval}, ` +
  //     `${this.lastToken$?._name}${this.lastToken$?.oldRanval} ]`;
  // }
  /** @final */
  get _oldInfo(): string {
    return this.frstToken === this.lastToken
      ? `${this._info}[ ` +
        `${this.frstToken._name}${this.frstToken.oldRanval} ]`
      : `${this._info}[ ` +
        `${this.frstToken._name}${this.frstToken.oldRanval}, ` +
        `${this.lastToken._name}${this.lastToken.oldRanval} ]`;
  }
  /** @final */
  get _newInfo(): string {
    return this.frstToken === this.lastToken
      ? `${this._info}[ ${this.frstToken} ]`
      : `${this._info}[ ${this.frstToken}, ${this.lastToken} ]`;
  }

  _repr(): unknown {
    return this._info;
  }

  // /** For testing only */
  // abstract dup(): Stnode<T>;

  // /**
  //  * @headconst @param rhs
  //  */
  // abstract _test_eq(rhs: Stnode<T>): this;
}
/*80--------------------------------------------------------------------------*/

// /**
//  * @param { Stnode[] } sn_a_x
//  * @return { Stnode }
//  */
// export function calcCommonToBeg( sn_a_x )
// {
//   const out = ret => {
//     assert( ret );
//   }

//   let ret = calcCommon( sn_a_x );
//   if( !ret.isBeg() )
//   {
//     ret = ret.parent_$;
//     let valve = 1000+1;
//     while( ret && !ret.isBeg() && --valve ) ret = ret.parent_$;
//     assert(valve);
//   }
//   out(ret); return ret;
// }
/*80--------------------------------------------------------------------------*/

// /**
//  * Notice, used node will be removed from `oldsn_a`
//  * @headconst @param oldsn_a
//  * @headconst @param frsttk_x
//  * @headconst @param T_x - subclass of Stnode<T>
//  * @return return null or one of oldsn_a
//  */
// export function useOldSn<T extends Tok>(
//   oldsn_a: (Stnode<T> | undefined)[],
//   frsttk_x: Token<T>,
//   T_x: AbstractConstructor<Stnode<T>>,
// ): Stnode<T> | undefined {
//   /*#static*/ if (INOUT) {
//     assert(oldsn_a);
//     assert(frsttk_x);
//     assert(T_x);
//   }
//   for (let i = oldsn_a.length; i--;) {
//     const oldSn = oldsn_a[i];
//     let frsttk;
//     if (
//       oldSn &&
//       oldSn instanceof T_x &&
//       (frsttk = oldSn.frstToken) &&
//       frsttk.posE(frsttk_x)
//       //  && oldSn.isBdryValid
//       //jjjj strict?
//     ) {
//       oldsn_a[i] = oldsn_a.last!;
//       oldsn_a.length--;
//       return oldSn;
//     }
//   }
//   return undefined;
// }
/*80--------------------------------------------------------------------------*/
