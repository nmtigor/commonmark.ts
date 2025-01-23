/** 80**************************************************************************
 * @module lib/compiling/Loc
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT, PRF } from "../../global.ts";
import type {
  id_t,
  int,
  lcol_t,
  lnum_t,
  loff_t,
  UChr,
  uint,
  uint16,
} from "../alias.ts";
import { assert } from "../util/trace.ts";
import { BufrDir } from "../alias.ts";
import type { Bidir } from "../Bidi.ts";
import type { Line } from "./Line.ts";
import { Ranval } from "./Ranval.ts";
import type { Bufr } from "./Bufr.ts";
import { Factory } from "../util/Factory.ts";
import { LOG_cssc } from "../../alias.ts";
import { Endpt } from "../editor/alias.ts";
/*80--------------------------------------------------------------------------*/

export const enum LocCompared {
  yes = 0b0_0001,
  /** no but at the same `Line` */
  no_sameline = 0b0_0010,
  /** no and not at the same `Line` */
  no_othrline = 0b0_0100,
  /** no and not in the same `Bufr` */
  no_othrBufr = 0b0_1000,
  /* just use `!== LocCompared.yes` */
  // no = no_sameline | no_othrline | no_othrBufr,
}

type BidirMap_ = Map<Line, Bidir>;
export type _BidirMap = BidirMap_;

/** */
export class Loc {
  static #ID = 0 as id_t;
  readonly id = ++Loc.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  line_$!: Line;
  get line() {
    return this.line_$;
  }
  get bufr() {
    return this.line_$.bufr;
  }
  loff_$!: loff_t;
  /** @final */
  get loff(): loff_t {
    return this.loff_$;
  }
  /** @final */
  set loff(_x: loff_t) {
    if (this.loff_$ !== _x) {
      this.loff_$ = _x;
      this.#lcol = -1;
      this.#part = false;
    }
  }
  /** @primaryconst */
  get lidx_1() {
    return this.line_$.lidx_1;
  }

  protected tabsize$: 2 | 4 | 8 = 4;
  get tabsize() {
    return this.tabsize$;
  }
  // //jjjj
  // set tabsize(_x: 2 | 4 | 8) {
  //   this.tabsize$ = _x;
  // }

  /**
   * ! Any change of `line_$` or `loff_$` should invalidate `#lcol` to -1.
   */
  #lcol: lcol_t | -1 = -1;

  /**
   * If tab partially consumed or not
   */
  #part = false;
  get part() {
    return this.#part;
  }

  /**
   * `in( this.#part )`
   */
  get tabtail(): lcol_t {
    return this.tabsize$ - this.#lcol % this.tabsize$;
  }
  /**
   * `in( this.#part )`
   */
  get tabhead(): lcol_t {
    return this.#lcol % this.tabsize$;
  }

  get dir(): BufrDir {
    return this.bufr?.dir ?? BufrDir.ltr;
  }

  //jjjj TOCLEANUP
  // /** Peeked `Loc` */
  // protected poc$?: Loc;

  /**
   * @headconst @param line_x
   * @const @param loff_x
   */
  constructor(line_x: Line, loff_x?: loff_t) {
    this.setLoc(line_x, loff_x);
  }
  /**
   * @headconst @param bufr_x
   * @const @param lidx_x
   * @const @param loff_x
   */
  static create(bufr_x: Bufr, lidx_x: lnum_t, loff_x?: loff_t) {
    return new Loc(bufr_x.line(lidx_x), loff_x);
  }

  /**
   * out( this.line_$ )
   * @final
   * @headconst @param line_x
   * @const @param loff_x
   */
  setLoc(line_x: Line, loff_x?: loff_t): this {
    this.line_$ = line_x;
    this.loff_$ = loff_x === undefined ? line_x.uchrLen : loff_x;
    this.#lcol = -1;
    this.#part = false;
    return this;
  }
  /** @final */
  setLoc_O(lidx_x: lnum_t, loff_x?: loff_t, bufr_x = this.bufr) {
    /*#static*/ if (INOUT) {
      assert(bufr_x);
    }
    const line = bufr_x!.line(lidx_x);
    return this.setLoc(line, loff_x);
  }

  /** @const */
  dup() {
    const ret = new Loc(this.line_$, this.loff_$);
    ret.tabsize$ = this.tabsize$;
    ret.#lcol = this.#lcol;
    ret.#part = this.#part;
    return ret;
  }

  /**
   * @final
   * @const @param loc_x
   */
  becomeLoc(loc_x: Loc): this {
    this.line_$ = loc_x.line_$;
    this.loff_$ = loc_x.loff_$;
    this.tabsize$ = loc_x.tabsize$;
    this.#lcol = loc_x.#lcol;
    this.#part = loc_x.#part;
    return this;
  }

  [Symbol.dispose]() {
    g_loc_fac.revoke(this);
  }

  /** @const */
  usingDup() {
    return g_loc_fac.setLine(this.line_$).oneMore().becomeLoc(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // reset() { this.line_$ = null; }
  // get unset() { return !this.line_$; }

  /** @const */
  get atSol() {
    return this.loff_$ === 0;
  }
  /**
   * @const
   * "Start Of Bufr"
   */
  get atSob() {
    return this.line_$.isFrstLine && this.atSol;
  }
  /** @const */
  get atEol() {
    return this.loff_$ === this.line_$.uchrLen;
  }
  /** @const */
  get overEol() {
    return this.loff_$ > this.line_$.uchrLen;
  }
  correctLoff(): loff_t {
    if (this.overEol) this.loff_$ = this.line_$.uchrLen;
    else if (this.loff_$ < 0) this.loff_$ = 0;
    return this.loff_$;
  }
  /** @const */
  get reachEol() {
    return this.loff_$ >= this.line_$.uchrLen;
  }
  /** @const */
  get reachEob() {
    return this.line_$.isLastLine && this.reachEol;
  }

  /**
   * `in( this.loff_$ >= 0 )`
   * @const
   */
  get uchr(): UChr {
    return (this.overEol || this.reachEob)
      ? "\x00"
      : this.atEol
      ? "\n"
      : this.line_$.uchrAt(this.loff_$)!;
  }
  /** @see {@linkcode uchr} */
  get ucod(): uint16 {
    return (this.overEol || this.reachEob)
      ? 0 as uint16
      : this.atEol
      ? /* "\n" */ 0xA as uint16
      : this.line_$.ucodAt(this.loff_$)!;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  forw(inline_x?: "inline"): this {
    ++this.loff_$;
    if (!inline_x && this.overEol && !this.line_$.isLastLine) {
      this.line_$ = this.line_$.nextLine!;
      this.loff_$ = 0;
    }
    this.#lcol = -1;
    this.#part = false;
    return this;
  }
  back(inline_x?: "inline"): this {
    /*#static*/ if (INOUT) {
      assert(!this.atSob);
    }
    if (this.atSol) {
      if (!inline_x) {
        this.line_$ = this.line_$.prevLine!;
        this.loff_$ = this.line_$.uchrLen;
      }
    } else {
      --this.loff_$;
    }
    this.#lcol = -1;
    this.#part = false;
    return this;
  }
  forwn(n_x: loff_t, inline_x?: "inline"): this {
    while (n_x-- > 0) this.forw(inline_x);
    return this;
  }
  backn(n_x: loff_t, inline_x?: "inline"): this {
    while (n_x-- > 0) this.back(inline_x);
    return this;
  }

  /** @final */
  uchr_forw(inline_x?: "inline"): UChr {
    const ret = this.uchr;
    this.forw(inline_x);
    return ret;
  }
  /** @final */
  ucod_forw(inline_x?: "inline"): uint16 {
    const ret = this.ucod;
    this.forw(inline_x);
    return ret;
  }
  /** @final */
  forw_uchr(inline_x?: "inline"): UChr {
    this.forw(inline_x);
    return this.uchr;
  }
  /** @final */
  forw_ucod(inline_x?: "inline"): uint16 {
    this.forw(inline_x);
    return this.ucod;
  }

  toSol(): this {
    this.loff_$ = 0;
    this.#lcol = 0;
    this.#part = false;
    return this;
  }
  toEol(): this {
    this.loff = this.line_$.uchrLen;
    return this;
  }

  /** @primaryconst */
  peek_uchr(n_x: int, inline_x?: "inline"): UChr {
    using loc = this.usingDup();
    if (n_x >= 0) loc.forwn(n_x, inline_x);
    else loc.backn(-n_x, inline_x);
    return loc.uchr;
  }
  /** @primaryconst */
  peek_ucod(n_x: int, inline_x?: "inline"): uint16 {
    using loc = this.usingDup();
    if (n_x >= 0) loc.forwn(n_x, inline_x);
    else loc.backn(-n_x, inline_x);
    return loc.ucod;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @primaryconst
   * @primaryconst @param line_x
   * @const @param loff_x
   */
  #locS(line_x: Line, loff_x: loff_t): LocCompared {
    if (this.bufr !== line_x.bufr) return LocCompared.no_othrBufr;
    if (this.line_$ === line_x && this.loff_$ >= loff_x) {
      return LocCompared.no_sameline;
    }
    if (this.lidx_1 > line_x.lidx_1) return LocCompared.no_othrline;
    return LocCompared.yes;
  }
  /** @see {@linkcode #locS()} */
  #posS(line_x: Line, loff_x: loff_t): boolean {
    return this.line_$.bufr === line_x.bufr &&
      (this.line_$ === line_x && this.loff_$ < loff_x ||
        this.lidx_1 < line_x.lidx_1);
  }
  /** @see {@linkcode #locS()} */
  #locGE(line_x: Line, loff_x: loff_t): LocCompared {
    if (this.bufr !== line_x.bufr) return LocCompared.no_othrBufr;
    if (this.line_$ === line_x && this.loff_$ < loff_x) {
      return LocCompared.no_sameline;
    }
    if (this.lidx_1 < line_x.lidx_1) return LocCompared.no_othrline;
    return LocCompared.yes;
  }
  /** @see {@linkcode #locS()} */
  #posGE(line_x: Line, loff_x: loff_t): boolean {
    return this.line_$.bufr === line_x.bufr &&
      (this.line_$ === line_x && this.loff_$ >= loff_x ||
        this.lidx_1 > line_x.lidx_1);
  }
  /** @see {@linkcode #locS()} */
  #locSE(line_x: Line, loff_x: loff_t): LocCompared {
    if (this.bufr !== line_x.bufr) return LocCompared.no_othrBufr;
    if (this.line_$ === line_x && this.loff_$ > loff_x) {
      return LocCompared.no_sameline;
    }
    if (this.lidx_1 > line_x.lidx_1) return LocCompared.no_othrline;
    return LocCompared.yes;
  }
  /** @see {@linkcode #locS()} */
  #posSE(line_x: Line, loff_x: loff_t): boolean {
    return this.line_$.bufr === line_x.bufr &&
      (this.line_$ === line_x && this.loff_$ <= loff_x ||
        this.lidx_1 < line_x.lidx_1);
  }
  /** @see {@linkcode #locS()} */
  #locG(line_x: Line, loff_x: loff_t): LocCompared {
    if (this.bufr !== line_x.bufr) return LocCompared.no_othrBufr;
    if (this.line_$ === line_x && this.loff_$ <= loff_x) {
      return LocCompared.no_sameline;
    }
    if (this.lidx_1 < line_x.lidx_1) return LocCompared.no_othrline;
    return LocCompared.yes;
  }
  /** @see {@linkcode #locS()} */
  #posG(line_x: Line, loff_x: loff_t): boolean {
    return this.line_$.bufr === line_x.bufr &&
      (this.line_$ === line_x && this.loff_$ > loff_x ||
        this.lidx_1 > line_x.lidx_1);
  }
  /**
   * @const
   * @const @param line_x
   * @const @param loff_x
   */
  #locE(line_x: Line, loff_x: loff_t): LocCompared {
    if (this.bufr !== line_x.bufr) return LocCompared.no_othrBufr;
    if (this.line_$ !== line_x) return LocCompared.no_othrline;
    if (this.loff_$ !== loff_x) return LocCompared.no_sameline;
    return LocCompared.yes;
  }
  /** @see {@linkcode #locE()} */
  #posE(line_x: Line, loff_x: loff_t): boolean {
    return this.line_$.bufr === line_x.bufr &&
      this.line_$ === line_x && this.loff_$ === loff_x;
  }

  /**
   * @final
   * @primaryconst
   * @primaryconst @param rhs_x
   */
  locS(rhs_x: Loc): LocCompared {
    return this.#locS(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  posS(rhs_x: Loc): boolean {
    return this.#posS(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  posS_inline(rhs_x: Loc): boolean {
    return this.locGE(rhs_x) === LocCompared.no_sameline;
  }
  /** @see {@linkcode locS()} */
  locGE(rhs_x: Loc): LocCompared {
    return this.#locGE(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  posGE(rhs_x: Loc): boolean {
    return this.#posGE(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  locSE(rhs_x: Loc): LocCompared {
    return this.#locSE(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  posSE(rhs_x: Loc): boolean {
    return this.#posSE(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  locG(rhs_x: Loc): LocCompared {
    return this.#locG(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locS()} */
  posG(rhs_x: Loc): boolean {
    return this.#posG(rhs_x.line_$, rhs_x.loff_$);
  }
  /**
   * @final
   * @const
   * @const @param rhs_x
   */
  locE(rhs_x: Loc): LocCompared {
    return this.#locE(rhs_x.line_$, rhs_x.loff_$);
  }
  /** @see {@linkcode locE()} */
  posE(rhs_x: Loc): boolean {
    return this.#posE(rhs_x.line_$, rhs_x.loff_$);
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Calc line column by `hintLoff_x` and `hintLcol_x`\
   * Assign `#lcol` if `#lcol < 0` or `recalc_x`\
   *
   * ! `this` can be `#part` if `this.#lcol >= 0 && !recalc_x`
   *
   * @const @param recalc_x
   */
  lcol_1(
    hintLoff_x: loff_t = 0,
    hintLcol_x: lcol_t = 0,
    recalc_x?: "recalc",
  ): lcol_t {
    if (this.#lcol >= 0 && !recalc_x) return this.#lcol;

    this.#part = false;

    if (hintLoff_x > this.loff_$) {
      hintLoff_x = 0;
      hintLcol_x = 0;
    }
    if (hintLoff_x === this.loff_$) return this.#lcol = hintLcol_x;

    let ret = hintLcol_x;
    using loc_ = this.usingDup().setLoc(this.line_$, hintLoff_x);
    for (; loc_.loff_$ < this.loff_$; ++loc_.loff_$) {
      if (loc_.ucod === /* "\t" */ 9) {
        ret += this.tabsize$ - ret % this.tabsize$;
      } else {
        ++ret;
      }
    }
    return this.#lcol = ret;
  }
  /**
   * Calc line column by `loc_x.loff_$` and `loc_x.lcol_1()`\
   * Assign `#lcol` if `#lcol < 0` or `recalc_x`\
   *
   * `in( this.bufr === loc_x.bufr )`
   *
   * @const @param loc_x
   */
  lcolBy(loc_x: Loc): lcol_t {
    using loc_ = loc_x.usingDup();
    if (loc_.#part) {
      loc_.#lcol -= loc_.#lcol % this.tabsize$;
      loc_.#part = false;
    } else {
      loc_.lcol_1();
    }
    return this.lcol_1(loc_.loff_$, loc_.#lcol);
  }

  /**
   * Assign `loff_$`, `#lcol, `#part`
   * @const @param n_x
   */
  forwnCol(n_x: lcol_t): void {
    let uchrsToTab, lcol_;
    if (this.#part) {
      uchrsToTab = this.tabsize$ - this.#lcol % this.tabsize$;
      if (n_x < uchrsToTab) {
        this.#lcol += n_x;
        return;
      }

      this.#lcol += uchrsToTab;
      this.#part = false;
      ++this.loff_$;
      n_x -= uchrsToTab;
    } else {
      this.lcol_1();
    }

    let ucod;
    while (n_x > 0 && (ucod = this.ucod)) {
      if (ucod === /* "\t" */ 9) {
        uchrsToTab = this.tabsize$ - (this.#lcol % this.tabsize$);
        lcol_ = uchrsToTab > n_x ? n_x : uchrsToTab;
        this.#lcol += lcol_;
        this.#part = uchrsToTab > n_x;
        this.loff_$ += this.#part ? 0 : 1;
        n_x -= lcol_;
      } else {
        ++this.#lcol;
        this.#part = false;
        ++this.loff_$;
        --n_x;
      }
    }
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @const */
  getText(strt_x = this.loff_$, stop_x?: loff_t): string {
    return this.line_$.text.slice(strt_x, stop_x);
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * `in( bidirMap_x.has(this.line_$) )`
   * @headconst @param bidirMap_x
   * @return effective or not
   */
  visulFarleftenIn(bidirMap_x: BidirMap_, row_x?: "row"): boolean {
    const bidi = bidirMap_x.get(this.line_$)!.bidi;
    const oldLoff = this.loff_$;
    this.loff_$ = bidi.visulFarleften(
      row_x ? bidi.rowOf(this.loff_$) : undefined,
    );
    return oldLoff !== this.loff_$;
  }
  /** @see {@linkcode visulFarleftenIn()} */
  visulFarrigtenIn(bidirMap_x: BidirMap_, row_x?: "row"): boolean {
    const bidi = bidirMap_x.get(this.line_$)!.bidi;
    const oldLoff = this.loff_$;
    this.loff_$ = bidi.visulFarrigten(
      row_x ? bidi.rowOf(this.loff_$) : undefined,
    );
    return oldLoff !== this.loff_$;
  }

  /** @see {@linkcode visulFarleftenIn()} */
  visulLeftenIn(bidirMap_x: BidirMap_): boolean {
    const DIR = this.dir;
    let ln_1: Line | undefined;
    //jjjj TOCLEANUP
    // /* The case `atEol` does not go through Bidi, because it's not in `[0,$)`. */
    // if (this.atEol && DIR === BufrDir.rtl) {
    //   ln_1 = this.line.nextLine;
    //   if (!ln_1) return false;

    //   this.line_$ = ln_1;
    //   this.visulFarrigtenIn(bidirMap_x);
    //   return true;
    // }

    const bidi = bidirMap_x.get(this.line_$)!.bidi;
    const ret = bidi.visulLeften(this.loff_$);
    this.loff_$ = bidi.lastLogal;
    if (ret) return true;

    ln_1 = DIR === BufrDir.ltr ? this.line.prevLine : this.line.nextLine;
    if (!ln_1) return false;

    this.line_$ = ln_1;
    this.visulFarrigtenIn(bidirMap_x);
    return true;
  }
  /** @see {@linkcode visulFarleftenIn()} */
  visulRigtenIn(bidirMap_x: BidirMap_): boolean {
    const DIR = this.dir;
    let ln_1: Line | undefined;
    //jjjj TOCLEANUP
    // /* The case `atEol` does not go through Bidi, because it's not in `[0,$)`. */
    // if (this.atEol && DIR === BufrDir.ltr) {
    //   ln_1 = this.line.nextLine;
    //   if (!ln_1) return false;

    //   this.line_$ = ln_1;
    //   this.visulFarleftenIn(bidirMap_x);
    //   return true;
    // }

    const bidi = bidirMap_x.get(this.line_$)!.bidi;
    const ret = bidi.visulRigten(this.loff_$);
    this.loff_$ = bidi.lastLogal;
    if (ret) return true;

    ln_1 = DIR === BufrDir.ltr ? this.line.nextLine : this.line.prevLine;
    if (!ln_1) return false;

    this.line_$ = ln_1;
    this.visulFarleftenIn(bidirMap_x);
    return true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @out @param ret_x
   * @const @param endpt_x
   */
  toRanval(ret_x?: Ranval, endpt_x?: Endpt): Ranval {
    /*#static*/ if (INOUT) {
      assert(!ret_x || ret_x && endpt_x);
    }
    if (ret_x) {
      if (endpt_x === Endpt.focus) {
        ret_x[0] = this.lidx_1;
        ret_x[1] = this.loff_$;
      } else if (endpt_x === Endpt.anchr) {
        ret_x[2] = this.lidx_1;
        ret_x[3] = this.loff_$;
      }
    } else {
      ret_x = new Ranval(this.lidx_1, this.loff_$);
    }
    return ret_x;
  }

  /** For testing only */
  toString() {
    return `${this.lidx_1}-${this.loff_$}`;
  }
}
/*64----------------------------------------------------------*/

class LocFac_ extends Factory<Loc> {
  #line!: Line;
  setLine(_x: Line): this {
    this.#line = _x;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  protected createVal$() {
    /*#static*/ if (PRF) {
      console.log(
        `%c# of cached Loc instances: ${this.val_a$.length + 1}`,
        `color:${LOG_cssc.performance}`,
      );
    }
    return new Loc(this.#line, 0);
  }

  protected override reuseVal$(i_x: uint) {
    return this.get(i_x).setLoc(this.#line, 0);
  }
}
export const g_loc_fac = new LocFac_();
/*80--------------------------------------------------------------------------*/
