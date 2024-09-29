/** 80**************************************************************************
 * @module lib/compiling/TSeg
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { INOUT } from "../../global.ts";
import type { id_t, lnum_t, loff_t } from "../alias.ts";
import type { uint } from "../alias.ts";
import { zUint } from "../alias.ts";
import { Factory } from "../util/Factory.ts";
import { assert } from "../util/trace.ts";
import { Line } from "./Line.ts";
import { Loc, LocCompared } from "./Loc.ts";
import { Ran } from "./Ran.ts";
import { Tfmr } from "./Tfmr.ts";
import { TLoc } from "./TLoc.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Segment on _one_ line
 * @final
 */
export class TSeg {
  static #ID = 0 as id_t;
  readonly id = ++TSeg.#ID as id_t;

  // /**
  //  * `Line` could be removed, but `this` would be used, so store
  //  * `Bufr` explicitly.
  //  */
  // readonly #bufr;
  // /**
  //  * `TLine` could be removed, but `this` would be used, so store
  //  * `TBufr` explicitly.
  //  */
  // readonly #tbufr;
  readonly tfmr_$: Tfmr;
  get #bufr() {
    return this.tfmr_$.bufr;
  }
  get #tbufr() {
    return this.tfmr_$.tbufr;
  }

  readonly #ran;
  get strtLoc() {
    return this.#ran.strtLoc;
  }
  get stopLoc() {
    return this.#ran.stopLoc;
  }
  get strtLoff() {
    return this.strtLoc.loff_$;
  }
  get stopLoff() {
    return this.stopLoc.loff_$;
  }
  get line() {
    return this.#ran.frstLine;
  }
  set line_$(line_x: Line) {
    this.strtLoc.line_$ = line_x;
    this.stopLoc.line_$ = line_x;
  }

  /**
   * `linkPrev()`, `linkNext()` could invalidate `this`.
   */
  get valid() {
    const ln_ = this.line;
    return ln_.bufr === this.#bufr && ln_.hasTSeg(this);
  }

  #length: loff_t | -1 = -1;
  get length() {
    if (this.#length < 0) {
      this.#length = this.#ran.length_1;
    }
    return this.#length;
  }

  readonly #tloc;
  get strtTLoff() {
    return this.#tloc.loff_$;
  }
  get stopTLoff() {
    return this.strtTLoff + this.length;
  }
  get tline() {
    return this.#tloc.line;
  }

  #mapped = false;
  get mapped() {
    return this.#mapped;
  }

  prevTSeg_$: TSeg | undefined;
  nextTSeg_$: TSeg | undefined;
  get _prevTSeg() {
    return this.prevTSeg_$;
  }
  get _nextTSeg() {
    return this.nextTSeg_$;
  }
  /** @deprecated */
  _noPrevTSeg() {
    console.assert(this.prevTSeg_$ === undefined);
  }
  /** @deprecated */
  _noNextTSeg() {
    console.assert(this.nextTSeg_$ === undefined);
  }

  /**
   * @headconst @param tfmr_x
   */
  constructor(tfmr_x: Tfmr) {
    this.tfmr_$ = tfmr_x;
    this.#ran = new Ran(new Loc(this.#bufr.frstLine_$, 0));
    this.#tloc = new TLoc(this.#tbufr.frstLine, 0);
    /*#static*/ if (INOUT) {
      assert(this.#ran.frstLine === this.#ran.lastLine);
    }
  }

  reset_$() {
    const ln_ = this.line;
    if (ln_.isStrtByTSeg_$(this)) ln_.delStrtTSeg_$(this.tfmr_$);
    if (ln_.isStopByTSeg_$(this)) ln_.delStopTSeg_$(this.tfmr_$);

    this.#length = -1; //!
    if (ln_.bufr !== this.#bufr) {
      this.#ran.reset(this.#bufr); //!
    }
    if (this.tline.bufr !== this.#tbufr) {
      this.#tloc.reset(this.#tbufr.frstLine_$, 0); //!
    }

    if (this.nextTSeg_$ && this.prevTSeg_$) {
      this.nextTSeg_$.prevTSeg_$ = this.prevTSeg_$;
      this.prevTSeg_$.nextTSeg_$ = this.nextTSeg_$;
    } else if (this.prevTSeg_$) {
      this.prevTSeg_$.nextTSeg_$ = undefined;
    } else if (this.nextTSeg_$) {
      this.nextTSeg_$.prevTSeg_$ = undefined;
    }
    this.prevTSeg_$ = undefined;
    this.nextTSeg_$ = undefined;

    this.#mapped = false;
    return this;
  }

  revokeSelf_$() {
    this.tfmr_$.tseg_fac.revoke(this);
  }

  /**
   * `in( this.#tbufr === rhs_x.#tbufr )`
   * @headconst @param rhs_x
   */
  posS(rhs_x: TSeg): boolean {
    const lidx_0 = this.#tloc.lidx_1;
    const lidx_1 = rhs_x.#tloc.lidx_1;
    return lidx_0 < lidx_1 ||
      lidx_0 === lidx_1 &&
        this.#tloc.loff_$ + this.length <= rhs_x.#tloc.loff_$;
  }
  /** @see {@linkcode posS()} */
  posGE(rhs_x: TSeg): boolean {
    return !this.posS(rhs_x);
  }
  /** @see {@linkcode posS()} */
  posSE(rhs_x: TSeg): boolean {
    return this.posS(rhs_x) || this.posE(rhs_x);
  }
  /** @see {@linkcode posS()} */
  posG(rhs_x: TSeg): boolean {
    return !this.posSE(rhs_x);
  }
  /**
   * @const
   * @headconst @param rhs_x
   */
  posE(rhs_x: TSeg): boolean {
    return this === rhs_x ||
      this.#tloc.posE(rhs_x.#tloc) && this.length === rhs_x.length;
  }

  #correct_line_tseg() {
    const ln_ = this.line;
    let strtTSeg_old = ln_.strtTSeg_$(this.tfmr_$);
    let stopTSeg_old = ln_.stopTSeg_$(this.tfmr_$);

    const VALVE = 1_000;
    let valve = VALVE;
    let tseg: TSeg = this;
    do {
      if (tseg === strtTSeg_old) strtTSeg_old = undefined;
      if (tseg === stopTSeg_old) stopTSeg_old = undefined;
      if (tseg.prevTSeg_$?.line !== ln_) break;
      tseg = tseg.prevTSeg_$;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    ln_.strtByTSeg_$(tseg);

    tseg = this;
    do {
      if (tseg === strtTSeg_old) strtTSeg_old = undefined;
      if (tseg === stopTSeg_old) stopTSeg_old = undefined;
      if (tseg.nextTSeg_$?.line !== ln_) break;
      tseg = tseg.nextTSeg_$;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    ln_.stopByTSeg_$(tseg);

    strtTSeg_old?.revokeSelf_$();
    stopTSeg_old?.revokeSelf_$();
  }

  map(
    lidx_0_x: lnum_t,
    loff_0_x: loff_t,
    lidx_1_x: lnum_t,
    loff_1_x: loff_t,
    length_x: loff_t,
  ) {
    /*#static*/ if (INOUT) {
      assert(length_x > 0);
    }
    // const prev = this.prevTSeg_$;
    // const next = this.nextTSeg_$;
    this.reset_$();

    this.strtLoc.reset_1(lidx_0_x, loff_0_x);
    this.stopLoc.reset_1(lidx_0_x, loff_0_x + length_x);
    this.#tloc.reset_1(lidx_1_x, loff_1_x);

    this.#correct_line_tseg();
    // if( prev ) this.linkPrev( prev );
    // else if( next ) this.linkNext( next );
    // else this.#correct_line_tseg();

    this.#mapped = true;
    /*#static*/ if (INOUT) {
      assert(this.#ran.frstLine === this.#ran.lastLine);
      assert(this.length === length_x);
    }
    return this;
  }

  /**
   * @return unlinked `TSeg`
   */
  #unlinkPrev() {
    const tseg = this.prevTSeg_$;
    if (tseg) {
      tseg.nextTSeg_$ = this.prevTSeg_$ = undefined;
    }
    return tseg;
  }
  /**
   * @return unlinked `TSeg`
   */
  #unlinkNext() {
    const tseg = this.nextTSeg_$;
    if (tseg) {
      tseg.prevTSeg_$ = this.nextTSeg_$ = undefined;
    }
    return tseg;
  }

  /**
   * !`ret_x.prevTSeg_$` will be untouched. (cf. `Line.linkPrev_$`)
   * @headconst @param ret_x
   */
  linkPrev(ret_x: TSeg) {
    /*#static*/ if (INOUT) {
      assert(ret_x !== this);
      assert(ret_x.posS(this));
    }
    if (this.prevTSeg_$ !== ret_x) {
      ret_x.#unlinkNext();
      ret_x.nextTSeg_$ = this;
      this.#unlinkPrev();
      this.prevTSeg_$ = ret_x;
    }

    ret_x.#correct_line_tseg();
    if (this.line !== ret_x.line) this.#correct_line_tseg();
    /*#static*/ if (INOUT) {
      assert(ret_x === this.prevTSeg_$);
      assert(ret_x.nextTSeg_$ === this);
    }
    return ret_x;
  }
  /**
   * ! `ret_x.nextTSeg_$` will be untouched. (cf. `Line.linkNext_$`)
   * @headconst @param ret_x
   */
  linkNext(ret_x: TSeg) {
    /*#static*/ if (INOUT) {
      assert(ret_x !== this);
      assert(this.posS(ret_x));
    }
    if (this.nextTSeg_$ !== ret_x) {
      ret_x.#unlinkPrev();
      ret_x.prevTSeg_$ = this;
      this.#unlinkNext();
      this.nextTSeg_$ = ret_x;
    }

    ret_x.#correct_line_tseg();
    if (this.tline !== ret_x.tline) this.#correct_line_tseg();
    /*#static*/ if (INOUT) {
      assert(ret_x === this.nextTSeg_$);
      assert(ret_x.prevTSeg_$ === this);
    }
    return ret_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  toString() {
    // return `${this.strtLoc.toString()}:${this.#tloc.toString()}:${this.length}`;
    return `${this.strtLoc}:${this.length}:${this.#tloc}`;
  }

  /**
   * @deprecated
   * @const @param rhs_x
   */
  _toString_eq(rhs_x: string) {
    console.assert(this.toString() === rhs_x);
    return this;
  }

  _Repr(prevN_x?: uint, nextN_x?: uint): [string[], string, string[]] {
    /*#static*/ if (INOUT) {
      if (prevN_x !== undefined) zUint.parse(prevN_x);
      if (nextN_x !== undefined) zUint.parse(nextN_x);
    }
    const prev_a: string[] = [],
      next_a: string[] = [];
    let tseg = this.prevTSeg_$;
    prevN_x ??= 100;
    for (let i = prevN_x; i--;) {
      if (!tseg) break;
      prev_a.unshift(tseg.toString());
      tseg = tseg.prevTSeg_$;
    }
    tseg = this.nextTSeg_$;
    nextN_x ??= 100;
    for (let i = nextN_x; i--;) {
      if (!tseg) break;
      next_a.push(tseg.toString());
      tseg = tseg.nextTSeg_$;
    }
    return [prev_a, this.toString(), next_a];
  }

  get _repr(): [string | undefined, string, string | undefined] {
    return [
      this.prevTSeg_$?.toString(),
      this.toString(),
      this.nextTSeg_$?.toString(),
    ];
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class TSegFac extends Factory<TSeg> {
  #tfmr!: Tfmr;

  constructor(tfmr_x: Tfmr) {
    super();
    this.reset(tfmr_x);
  }

  reset(tfmr_x: Tfmr, hard_x?: "hard") {
    this.#tfmr = tfmr_x;

    this.init(hard_x);
  }

  override init(hard_x?: "hard") {
    this.val_a$.forEach((val) => val.reset_$());
    super.init(hard_x);
  }

  /** @implement */
  protected createVal$() {
    /*#static*/ if (INOUT) {
      assert(this.#tfmr.tseg_fac === this);
    }
    // console.log(
    //   `%c# of cached TSeg instances: ${this.val_a$.length + 1}`,
    //   `color:${LOG_cssc.performance}`,
    // );
    return new TSeg(this.#tfmr);
  }

  /** @implement */
  protected override resetVal$(i_x: number) {
    const ret = this.val_a$[i_x];
    ret.reset_$();
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
