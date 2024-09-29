/** 80**************************************************************************
 * @module lib/compiling/Stnode
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../global.ts";
import type { id_t, loff_t, TupleOf, uint } from "../alias.ts";
import { SortedArray } from "../util/SortedArray.ts";
import { Visitable } from "../util/Visitor.ts";
import { assert, fail } from "../util/trace.ts";
import type { BaseTok } from "./BaseTok.ts";
import type { Loc } from "./Loc.ts";
import { Token } from "./Token.ts";
import type { Tok } from "./alias.ts";
import type { MdextLexr } from "./mdext/MdextLexr.ts";
import type { MdextTok } from "./mdext/MdextTok.ts";
import type { SetTok } from "./set/SetTok.ts";
/*80--------------------------------------------------------------------------*/

type Depth_ = uint | -1;
type NErr_ = 4;
const NErr_ = 4;

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
  /** @final */
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

  // get children(): Stnode<T>[] | undefined {
  //   return undefined;
  // }
  // /** @final */
  // isLeaf() {
  //   return !this.children || !this.children.length;
  // }

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
  calcDepth_$(): Depth_ {
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
  /* ~ */

  /* #errMsg_a */
  readonly #errMsg_a = new Array(NErr_).fill("") as TupleOf<string, NErr_>;
  get _err(): string[] {
    return this.#errMsg_a.filter(Boolean);
  }
  get hasErr(): boolean {
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
    while (ret.hasErr && ret.parent_$ && --valve) ret = ret.parent_$;
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret;
  }

  /* frstToken$, lastToken$ */
  protected frstToken$: Token<T> | undefined;
  /**
   * ! Do not call in `Pazr._markPazRegion()`
   * @const
   */
  abstract get frstToken(): Token<T>;
  /** @final */
  get frstBdryTk(): Token<T> {
    const tk_ = this.frstToken;
    tk_.stnode_$ ??= this; // First setting wins.
    return tk_;
  }
  /** @final */
  get frstLine() {
    return this.frstToken.frstLine;
  }
  /** @final */
  get frstLidx_1() {
    return this.frstLine.lidx_1;
  }
  /** @final */
  get strtLoc() {
    return this.frstToken.strtLoc;
  }
  /** @final */
  get strtLoff(): loff_t {
    return this.frstToken.strtLoff;
  }

  protected lastToken$: Token<T> | undefined;
  /**
   * ! Do not call in `Pazr._markPazRegion()`
   * @const
   */
  abstract get lastToken(): Token<T>;
  /** @final */
  get lastBdryTk(): Token<T> {
    const tk_ = this.lastToken;
    tk_.stnode_$ ??= this; // First setting wins.
    return tk_;
  }
  /** @final */
  get lastLine() {
    return this.lastToken.lastLine;
  }
  /** @final */
  get lastLidx_1() {
    return this.lastLine.lidx_1;
  }
  /** @final */
  get stopLoc() {
    return this.lastToken.stopLoc;
  }
  /** @final */
  get stopLoff(): loff_t {
    return this.lastToken.stopLoff;
  }

  /** @final */
  contain(loc_x: Loc): boolean {
    return this.strtLoc.posSE(loc_x) && loc_x.posS(this.stopLoc);
  }
  /** @final */
  touch(loc_x: Loc): boolean {
    return this.strtLoc.posSE(loc_x) && loc_x.posSE(this.stopLoc);
  }

  /**
   * ! Do not use `frstToken` and `lastToken`, because this will be called in
   * ! `Pazr._markPazRegion()()`.
   * @final
   */
  invalidateBdry() {
    if (this.frstToken$?.stnode_$ === this) {
      this.frstToken$.stnode_$ = undefined;
    }
    if (this.lastToken$?.stnode_$ === this) {
      this.lastToken$.stnode_$ = undefined;
    }
    this.frstToken$ = undefined;
    this.lastToken$ = undefined;
  }
  /* ~ */

  /** */
  constructor() {
    super();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param oldSn_x
   * @headconst @param newSn_x
   */
  replaceChild(oldSn_x: Stnode<T>, newSn_x?: Stnode<T>): void {
    return fail("Not implemented");
  }
  /** @final */
  removeSelf(): void {
    this.parent_$?.replaceChild(this);
  }

  /**
   * Helper function
   * @final
   * @headconst @param newSn_x
   */
  transferParentTo(newSn_x: Stnode<T>) {
    /*#static*/ if (INOUT) {
      assert(!newSn_x.parent_$);
    }
    newSn_x.parent_$ = this.parent_$;
    /* Do not remove `this` from syntax tree because `this` (normally as
    `drtSn`) could be needed in `sufrepl_edtr` phase. */
    // this.parent_$ = undefined;
  }

  /**
   * Helper function
   * @final
   * @headconst @param newSn_x
   */
  transferBdryTo(newSn_x: Stnode<T>) {
    if (this.frstToken$?.stnode_$ === this) {
      this.frstToken$.stnode_$ = newSn_x;
    }
    if (this.lastToken$?.stnode_$ === this) {
      this.lastToken$.stnode_$ = newSn_x;
    }
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

  /** For testing only */
  override toString() {
    return this._type_id;
  }

  /** @final */
  get _info(): string {
    return `${this.constructor.name}(${this.calcDepth_$()})`;
  }

  /** @final */
  get _oldInfo(): string {
    return `${this._info}[ ` +
      `${this.frstToken$?._name}${this.frstToken$?.oldRanval}, ` +
      `${this.lastToken$?._name}${this.lastToken$?.oldRanval} ]`;
  }

  /** @final */
  get _newInfo(): string {
    return this.frstToken === this.lastToken
      ? `${this._info}[ ${this.frstToken} ]`
      : `${this._info}[ ${this.frstToken}, ${this.lastToken} ]`;
  }

  _repr(): any {
    return this._info;
  }

  // /** For testing only */
  // abstract dup(): Stnode<T>;

  // /**
  //  * @headconst @param rhs
  //  */
  // abstract _test_eq(rhs: Stnode<T>): this;
}

export abstract class SetSN extends Stnode<SetTok> {}

export abstract class MdextSN extends Stnode<MdextTok> {
  /**
   * @headconst @param lexr_x
   */
  _toHTML(lexr_x: MdextLexr): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/

export class SortedStnode_depth<T extends Tok = BaseTok>
  extends SortedArray<Stnode<T>> {
  constructor(val_a_x?: Stnode<T>[]) {
    super((a, b) => a.depth < b.depth, val_a_x);
  }
}

/**
 * @headconst @param sn_sa_x
 * @headconst @param debug_x
 * @return `sn_sa_x[0]`
 */
export function calcCommon<T extends Tok = BaseTok>(
  sn_sa_x: SortedStnode_depth<T>,
  debug_x?: {
    a?: Stnode<T>[];
    f?: Stnode<T>[][];
  },
): Stnode<T> {
  /*#static*/ if (INOUT) {
    assert(sn_sa_x?.length);
  }
  if (sn_sa_x.length === 1) {
    out_calcCommon_(sn_sa_x);
    return sn_sa_x[0];
  }

  sn_sa_x.forEach((sn) => sn.calcDepth_$());

  // /**
  //  * @const @param i0_y
  //  * @const @param j0_y
  //  */
  // const ascByDepthInPlace = (i0_y: uint, j0_y: uint) => {
  //   /*#static*/ if (INOUT) {
  //     assert(valve--, `Loop ${VALVE}±1 times`);
  //   }
  //   if (j0_y - i0_y <= 1) return;

  //   const len = j0_y - i0_y;
  //   swap(i0_y + len >> 1, j0_y - 1);
  //   const de_0 = sn_sa_x[j0_y - 1].depth;

  //   let i = 0; // index of leftmost value larger than `de_0`
  //   let j = 0;
  //   L_0:
  //   while (i < len - 1) {
  //     if (sn_sa_x[i0_y + i].depth <= de_0) {
  //       i++;
  //       continue;
  //     }

  //     j = i + 1;
  //     for (; j < len - 1; j++) {
  //       if (sn_sa_x[i0_y + j].depth <= de_0) {
  //         swap(i0_y + i++, i0_y + j);
  //         if (j === len - 2) {
  //           break L_0;
  //         } else {
  //           continue;
  //         }
  //       }
  //     }
  //     break;
  //   }
  //   if (i < len - 1) swap(i0_y + i, j0_y - 1);

  //   /* has seperated to [0,de_0] and (de_0,infty) */

  //   ascByDepthInPlace(i0_y, i0_y + i);
  //   ascByDepthInPlace(i0_y + i + 1, j0_y);
  // };
  // ascByDepthInPlace(0, sn_sa_x.length);
  sn_sa_x.resort();
  if (debug_x) debug_x.a = sn_sa_x.slice();

  let swapsn;
  const swap = (i: uint, j: uint) => {
    if (i !== j) {
      swapsn = sn_sa_x[i];
      sn_sa_x[i] = sn_sa_x[j];
      sn_sa_x[j] = swapsn;
    }
  };

  const VALVE = 1_000;
  let valve = VALVE;

  /**
   * @const @param i0_y sn_sa_x[i0_y].#depth >= 0
   * @param n_y >=1
   */
  const floatUp = (i0_y: number, n_y: uint = 1) => {
    let de_ = sn_sa_x[i0_y].depth;
    while (n_y--) {
      sn_sa_x[i0_y] = sn_sa_x[i0_y].parent!;
      sn_sa_x[i0_y].depth_$ = --de_;
    }
  };

  /**
   * Make all of sorted `sn_sa_x` up `iup_y` to the depth `tgtDe_y`.\
   * Remove duplicates.
   * @const @param iup_y >=1
   * @const @param tgtDe_y
   */
  const floatupTail = (iup_y: uint, tgtDe_y: Depth_) => {
    let j0 = iup_y;
    for (; j0--;) {
      if (sn_sa_x[j0].depth !== tgtDe_y) {
        break;
      }
    }
    j0++; // Now `j0` is the index of leftmost node depth equal to `tgtDe_y`.
    /*#static*/ if (INOUT) {
      assert(0 <= j0 && j0 < iup_y);
    }

    const diff = sn_sa_x.at(-1)!.depth - tgtDe_y;
    for (let k = sn_sa_x.length; k-- > iup_y;) {
      floatUp(k, diff);
    }

    let len = sn_sa_x.length;
    /* Remove duplicates */
    L_0: while (j0 < len - 1) {
      for (let j = j0; j < len - 1; j++) {
        if (sn_sa_x[j] === sn_sa_x[len - 1]) {
          sn_sa_x.length = --len;
          continue L_0;
        }
      }
      if (j0 < len - 2) swap(j0, len - 1);
      j0++;
    }
  };

  let floatupTailCalled = false;
  L_0: while (sn_sa_x.length > 1 && --valve) {
    const de_0 = sn_sa_x.at(-1)!.depth;
    for (let i = sn_sa_x.length - 1; i--;) {
      const de_1 = sn_sa_x[i].depth;
      if (
        de_1 !== de_0 ||
        i === 0 && !floatupTailCalled
      ) {
        /* must be called at least once to remove duplicates */
        floatupTail(i + 1, de_1);
        floatupTailCalled = true;
        /*
        ! `sn_sa_x` can have been shortened */
        if (debug_x) {
          debug_x.f ??= [];
          debug_x.f.push(sn_sa_x.slice());
        }
        continue L_0;
      }
    }
    break;
  }
  assert(valve, `Loop ${VALVE}±1 times`);

  const floatupAll = () => {
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

  sn_sa_x[0] = sn_sa_x[0].safeSn_1;
  out_calcCommon_(sn_sa_x);
  return sn_sa_x[0];
}
const out_calcCommon_ = <T extends Tok = BaseTok>(sn_sa_x: Stnode<T>[]) => {
  assert(
    sn_sa_x.length === 1 && sn_sa_x[0] &&
      (!sn_sa_x[0].hasErr || sn_sa_x[0].isRoot),
  );
};

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
