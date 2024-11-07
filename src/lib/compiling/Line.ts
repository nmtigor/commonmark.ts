/** 80**************************************************************************
 * @module lib/compiling/Line
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT, TESTING } from "../../global.ts";
import type { id_t, lnum_t, loff_t, uint16 } from "../alias.ts";
import { BufrDir, llen_MAX, MAX_lnum } from "../alias.ts";
import { Bidi } from "../Bidi.ts";
import { assert, out } from "../util/trace.ts";
import type { Tok } from "./alias.ts";
import type { Bufr } from "./Bufr.ts";
import type { Lexr } from "./Lexr.ts";
import type { Tfmr } from "./Tfmr.ts";
import type { Token } from "./Token.ts";
import type { TSeg } from "./TSeg.ts";
/*80--------------------------------------------------------------------------*/

/**
 * A nnon-generic base s.t. many related uses can be non-generic.
 *
 * primaryconst: const exclude `lidx$`
 */
export class Line {
  static #ID = 0 as id_t;
  readonly id = ++Line.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected bufr$: Bufr | undefined;
  get bufr() {
    return this.bufr$;
  }
  get removed() {
    return !this.bufr$;
  }

  /* text$ */
  protected text$ = "";
  get text(): string {
    return this.text$;
  }

  /** @final */
  get uchrLen(): loff_t {
    return this.text.length;
  }

  /** @final */
  uchrAt(i_x: loff_t) {
    return this.text.at(i_x);
  }
  /** @final */
  ucodAt(i_x: loff_t): uint16 {
    return this.text.charCodeAt(i_x) as uint16;
  }

  /** @final */
  get empty(): boolean {
    return !this.text.length;
  }
  /* ~ */

  get dir(): BufrDir {
    return this.bufr$?.dir ?? BufrDir.ltr;
  }

  readonly bidi = new Bidi();
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * ! `lidx$` must be nondecreasing, however valid or not
   */
  protected lidx$: lnum_t | -1 = -1; /** 0-based */

  protected linked$ = false;
  /**
   * @final
   * @const @param linked_x
   */
  set linked_$(linked_x: boolean) {
    /*#static*/ if (INOUT) {
      assert(!this.removed);
      assert(this.linked$ !== linked_x);
    }
    if (this.linked$) {
      this.bufr$!.lineN_$--;
    } else {
      this.bufr$!.lineN_$++;
    }
    this.linked$ = linked_x;
  }

  protected prevLine$: Line | undefined;
  protected nextLine$: Line | undefined;
  get prevLine() {
    return this.prevLine$;
  }
  get nextLine() {
    return this.nextLine$;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* #frstToken_m */
  /**
   * Map of `Token<any>`s whose `frstLine` is `this` and `prevToken_$?.frstLine`
   * is not.
   */
  #frstToken_m = new Map<Lexr<any>, Token<any>>();
  /**
   * `out( ret; !ret || ret.frstLine === this )`
   */
  frstTokenBy<T extends Tok>(lexr_x: Lexr<T>): Token<T> | undefined {
    return this.#frstToken_m.get(lexr_x);
  }
  /**
   * `out( ret; !ret || ret.lastLine === this )`
   */
  strtTokenBy<T extends Tok>(lexr_x: Lexr<T>): Token<T> | undefined {
    let ret: Token<T> | undefined;
    let tk_ = this.frstTokenBy(lexr_x);
    if (tk_) {
      ret = tk_.prevToken_$?.sntLastLine === this ? tk_.prevToken_$ : tk_;
    } else {
      tk_ = this.prevLine?.lastTokenBy(lexr_x);
      if (tk_?.nextToken_$?.sntLastLine === this) {
        ret = tk_.nextToken_$;
      }
    }
    return ret;
  }
  setFrstToken_$<T extends Tok>(tk_x: Token<T>) {
    this.#frstToken_m.set(tk_x.lexr_$, tk_x);
  }
  isFrstToken_$<T extends Tok>(tk_x: Token<T>): boolean {
    return this.#frstToken_m.get(tk_x.lexr_$) === tk_x;
  }
  delFrstTokenBy_$<T extends Tok>(lexr_x: Lexr<T>) {
    this.#frstToken_m.delete(lexr_x);
  }
  // hasStrt_$( lexr_x:Lexr ) { return this.#frstToken_m.has(lexr_x); }
  /* ~ */

  /* #lastToken_m */
  /**
   * Map of `Token<any>`s whose `lastLine` is `this` and `nextToken_$?.lastLine`
   * is not.
   */
  #lastToken_m = new Map<Lexr<any>, Token<any>>();
  /**
   * `out( ret; !ret || ret.lastLine === this )`
   */
  lastTokenBy<T extends Tok>(lexr_x: Lexr<T>): Token<T> | undefined {
    return this.#lastToken_m.get(lexr_x);
  }
  /**
   * `out( ret; !ret || ret.frstLine === this )`
   */
  stopTokenBy<T extends Tok>(lexr_x: Lexr<T>): Token<T> | undefined {
    let ret: Token<T> | undefined;
    let tk_ = this.lastTokenBy(lexr_x);
    if (tk_) {
      ret = tk_.nextToken_$?.sntFrstLine === this ? tk_.nextToken_$ : tk_;
    } else {
      tk_ = this.nextLine?.frstTokenBy(lexr_x);
      if (tk_?.prevToken_$?.sntFrstLine === this) {
        ret = tk_.prevToken_$;
      }
    }
    return ret;
  }
  setLastToken_$<T extends Tok>(tk_x: Token<T>) {
    this.#lastToken_m.set(tk_x.lexr_$, tk_x);
  }
  isLastToken_$<T extends Tok>(tk_x: Token<T>): boolean {
    return this.#lastToken_m.get(tk_x.lexr_$) === tk_x;
  }
  delLastTokenBy_$<T extends Tok>(lexr_x: Lexr<T>) {
    this.#lastToken_m.delete(lexr_x);
  }
  // hasStop_$( lexr_x:Lexr ) { return this.#lastToken_m.has(lexr_x); }
  /* ~ */
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* #strtTSeg_m */
  #strtTSeg_m = new Map<Tfmr, TSeg>();
  strtTSeg_$(tfmr_x: Tfmr): TSeg | undefined {
    return this.#strtTSeg_m.get(tfmr_x);
  }
  strtByTSeg_$(tseg_x: TSeg) {
    this.#strtTSeg_m.set(tseg_x.tfmr_$, tseg_x);
  }
  isStrtByTSeg_$(tseg_x: TSeg) {
    return this.#strtTSeg_m.get(tseg_x.tfmr_$) === tseg_x;
  }
  delStrtTSeg_$(tfmr_x: Tfmr) {
    this.#strtTSeg_m.delete(tfmr_x);
  }
  /* ~ */

  /* #stopTSeg_m */
  #stopTSeg_m = new Map<Tfmr, TSeg>();
  stopTSeg_$(tfmr_x: Tfmr): TSeg | undefined {
    return this.#stopTSeg_m.get(tfmr_x);
  }
  stopByTSeg_$(tseg_x: TSeg) {
    this.#stopTSeg_m.set(tseg_x.tfmr_$, tseg_x);
  }
  isStopByTSeg_$(tseg_x: TSeg) {
    return this.#stopTSeg_m.get(tseg_x.tfmr_$) === tseg_x;
  }
  delStopTSeg_$(tfmr_x: Tfmr) {
    this.#stopTSeg_m.delete(tfmr_x);
  }
  /* ~ */

  delTSegBdryOf(tfmr_x: Tfmr) {
    this.strtTSeg_$(tfmr_x)?.revokeSelf_$();
    this.stopTSeg_$(tfmr_x)?.revokeSelf_$();
    /*#static*/ if (INOUT) {
      assert(this.strtTSeg_$(tfmr_x) === undefined);
      assert(this.stopTSeg_$(tfmr_x) === undefined);
    }
  }

  delTSegBdry() {
    for (const tseg of this.#strtTSeg_m.values()) {
      tseg.revokeSelf_$();
    }
    for (const tseg of this.#stopTSeg_m.values()) {
      tseg.revokeSelf_$();
    }
    this.#strtTSeg_m.clear();
    this.#stopTSeg_m.clear();
  }

  /**
   * @headconst @param tseg_x
   */
  hasTSeg(tseg_x: TSeg) {
    const tfmr = tseg_x.tfmr_$;
    const strtTSeg = this.strtTSeg_$(tfmr);
    const stopTSeg = this.stopTSeg_$(tfmr);
    // if (!strtTSeg || !stopTSeg) return true;
    if (!strtTSeg || !stopTSeg) return false;

    let tseg = strtTSeg;
    const VALVE = 100;
    let valve = VALVE;
    while (tseg !== tseg_x && tseg !== stopTSeg && --valve) {
      tseg = tseg.nextTSeg_$!;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    return tseg === tseg_x;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  protected constructor(bufr_x: Bufr) {
    this.bufr$ = bufr_x;
    this.invalLidx$();
  }
  /**
   * @package
   * @headconst @param bufr_x
   * @const @param text_x
   */
  static create(bufr_x: Bufr, text_x?: string) {
    return new Line(bufr_x).resetText_$(text_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const @param text_x
   */
  @out((_, self: Line) => {
    assert(self.text$.length < llen_MAX);
  })
  resetText_$(text_x?: string): this {
    this.text$ = text_x ?? "";
    this.bidi.reset(this.text$, this.dir);
    /*#static*/ if (!TESTING) {
      this.bidi.validate();
    }
    return this;
  }

  /**
   * @const @param strt_x
   * @const @param stop_x
   * @const @param newt_x
   */
  // @traceOut(_TRACE)
  splice_$(strt_x: loff_t, stop_x: loff_t, newt_x?: string): void {
    // /*#static*/ if (_TRACE) {
    //   console.log([
    //     global.indent,
    //     `>>>>>>> ${this._type_id}.splice_$( ${strt_x}, ${stop_x}, `,
    //     newt_x === undefined ? "" : `"${newt_x}"`,
    //     " ) >>>>>>>",
    //   ].join(""));
    // }
    /*#static*/ if (INOUT) {
      assert(0 <= strt_x && strt_x <= this.uchrLen);
    }
    if (strt_x === stop_x && !newt_x) {
      return;
    }

    const t_0 = this.text$.slice(0, strt_x);
    const t_1 = this.text$.slice(stop_x);
    this.resetText_$(`${t_0}${newt_x ?? ""}${t_1}`);
  }

  // /**
  //  * @final
  //  * @const @param newt_x
  //  */
  // append_$( newt_x:string )
  // {
  //   if( !newt_x ) return;

  //   this.resetText_$( this.text$.concat(newt_x) );
  // }

  /**
   * @final
   * @const
   */
  get #lidx_valid() {
    return !this.removed &&
      0 <= this.lidx$ && this.lidx$ <= this.bufr$!.maxValidLidx_$;
  }

  /**
   * `in( !this.removed )`
   * @primaryconst
   * @final
   */
  invalLidx$() {
    /*#static*/ if (INOUT) {
      assert(this.bufr$!.maxValidLidx_$ < MAX_lnum - 1);
    }
    this.lidx$ = (this.bufr$!.maxValidLidx_$ + 1) as lnum_t;
  }

  /**
   * Imvalidate lidx's as few as possible after `this`.
   * @primaryconst
   */
  #inval_lidx_gt() {
    for (
      let line = this.nextLine$;
      line && line.#lidx_valid;
      line = line.nextLine$
    ) {
      line.invalLidx$();
    }
  }

  /**
   * `in( !this.removed )`
   * @primaryconst
   */
  #inval_lidx_selfup() {
    if (!this.prevLine$) {
      this.bufr$!.maxValidLidx_$ = 0 as lnum_t;
    } else if (this.prevLine$.#lidx_valid) {
      this.bufr$!.maxValidLidx_$ = this.prevLine$.lidx_1;
    }

    if (this.#lidx_valid) this.invalLidx$();
    this.#inval_lidx_gt();
  }

  /**
   * @primaryconst
   * @final
   */
  get lidx_1(): lnum_t {
    /*#static*/ if (INOUT) {
      assert(!this.removed);
    }
    if (!this.#lidx_valid) {
      if (this.prevLine$) {
        this.lidx$ = (this.prevLine$.lidx_1 + 1) as lnum_t;
      } else {
        this.lidx$ = 0 as lnum_t;
      }

      if (this.bufr$!.maxValidLidx_$ < this.lidx$) {
        this.bufr$!.maxValidLidx_$ = this.lidx$;
        this.#inval_lidx_gt();
      }
    }
    return this.lidx$ as lnum_t;
  }

  /** @const */
  get isFrstLine() {
    /*#static*/ if (INOUT) {
      assert(!this.removed && this.linked$);
    }
    return this === this.bufr$!.frstLine_$;
  }
  /** @const */
  get isLastLine() {
    /*#static*/ if (INOUT) {
      assert(!this.removed && this.linked$);
    }
    return this === this.bufr$!.lastLine_$;
  }

  nextLineWith(
    cb_x: (ln_y: Line) => boolean,
    do_x?: (ln_y: Line) => void,
    valve_x = MAX_lnum,
  ) {
    // let ln = this.nextLine$;
    // while (ln && !cb_x(ln) && --valve_x) {
    //   do_x?.(ln);

    //   ln = ln.nextLine;
    // }
    // return (ln && cb_x(ln)) ? ln : undefined;
    let ln: Line | undefined = this;
    while (--valve_x) {
      ln = ln!.nextLine$;
      if (!ln) break;
      if (cb_x(ln)) return ln;
      else do_x?.(ln);
    }
    return undefined;
  }
  nextNonemptyLine(orCb_x?: (ln_y: Line) => boolean, valve_x = MAX_lnum) {
    return this.nextLineWith(
      (ln_y) => !!ln_y.uchrLen || !!orCb_x?.(ln_y),
      (ln_y) => ln_y.delTSegBdry(),
      valve_x,
    );
  }
  prevLineWith(
    cb_x: (ln_y: Line) => boolean,
    do_x?: (ln_y: Line) => void,
    valve_x = MAX_lnum,
  ) {
    // let ln = this.prevLine$;
    // while (ln && !cb_x(ln) && --valve_x) {
    //   do_x?.(ln);

    //   ln = ln.prevLine;
    // }
    // return (ln && cb_x(ln)) ? ln : undefined;
    let ln: Line | undefined = this;
    while (--valve_x) {
      ln = ln!.prevLine$;
      if (!ln) break;
      if (cb_x(ln)) return ln;
      else do_x?.(ln);
    }
    return undefined;
  }
  prevNonemptyLine(orCb_x?: (ln_y: Line) => boolean, valve_x = MAX_lnum) {
    return this.prevLineWith(
      (ln_y) => !!ln_y.uchrLen || !!orCb_x?.(ln_y),
      (ln_y) => ln_y.delTSegBdry(),
      valve_x,
    );
  }

  /**
   * @const @param ret_ln_x
   */
  @out((ret: any, self: Line) => {
    assert(ret.linked$);
    assert(ret === self.prevLine$);
    assert(ret.nextLine$ === self);
    if (ret.prevLine$) {
      assert(ret === ret.prevLine$.nextLine$);
    } else {
      assert(ret === self.bufr$!.frstLine_$);
    }
  })
  insertPrev_$<L extends Line>(ret_ln_x: L) {
    /*#static*/ if (INOUT) {
      assert(!this.removed && this.linked$);
      assert(ret_ln_x?.bufr$ === this.bufr$);
      assert(!ret_ln_x.linked$);
    }
    if (this.prevLine$) {
      this.prevLine$.nextLine$ = ret_ln_x;
      ret_ln_x.prevLine$ = this.prevLine$;
    } else {
      this.bufr$!.frstLine_$ = ret_ln_x;
    }

    ret_ln_x.nextLine$ = this;
    this.prevLine$ = ret_ln_x;

    ret_ln_x.linked_$ = true;

    ret_ln_x.#inval_lidx_selfup();
    return ret_ln_x;
  }
  /**
   * @const @param ret_ln_x
   */
  @out((ret: any, self: Line) => {
    assert(ret.linked$);
    assert(ret === self.nextLine$);
    assert(ret.prevLine$ === self);
    if (ret.nextLine$) {
      assert(ret === ret.nextLine$.prevLine$);
    } else {
      assert(ret === self.bufr$!.lastLine_$);
    }
  })
  insertNext_$<L extends Line>(ret_ln_x: L) {
    /*#static*/ if (INOUT) {
      assert(!this.removed && this.linked$);
      assert(ret_ln_x?.bufr === this.bufr$);
      assert(!ret_ln_x.linked$);
    }
    if (this.nextLine$) {
      this.nextLine$.prevLine$ = ret_ln_x;
      ret_ln_x.nextLine$ = this.nextLine$;
    } else {
      this.bufr$!.lastLine_$ = ret_ln_x;
    }

    ret_ln_x.prevLine$ = this;
    this.nextLine$ = ret_ln_x;

    ret_ln_x.linked_$ = true;

    ret_ln_x.#inval_lidx_selfup();
    return ret_ln_x;
  }

  @out((_, self: Line) => {
    assert(
      self.removed ||
        self === self.bufr$!.frstLine_$ &&
          self === self.bufr$!.lastLine_$,
    );
  })
  removeSelf_$(): void {
    /* `strtTSeg_$?`, `stopTSeg_$?` could be useful in `Tfmr.adjust_$()` even
    after `this.removed`.*/
    // this.delTSegBdryOf();

    if (this.removed) {
      return;
    }
    if (this.bufr$!.lineN == 1) {
      this.resetText_$("");
      return;
    }

    this.#inval_lidx_selfup();

    if (this.nextLine$) {
      if (this.prevLine$) {
        this.nextLine$.prevLine$ = this.prevLine$;
        this.prevLine$.nextLine$ = this.nextLine$;
      } else {
        /*#static*/ if (INOUT) {
          assert(this === this.bufr$!.frstLine_$);
        }
        this.nextLine$.prevLine$ = undefined;
        this.bufr$!.frstLine_$ = this.nextLine$;
      }
    } else {
      /*#static*/ if (INOUT) {
        assert(this === this.bufr$!.lastLine_$);
        assert(this.prevLine$);
      }
      this.prevLine$!.nextLine$ = undefined;
      this.bufr$!.lastLine_$ = this.prevLine$!;
    }
    // `prevLine$`, `lastLine_$` are not modified
    this.linked_$ = false;
    this.bufr$ = undefined;

    /* `#frstToken_m`, `#lastToken_m` will be used in `Lexr.adjust_$()` */
    // /* Because Lexr<T> could keep using to make `this` unreleasable. */
    // this.#frstToken_m.clear();
    // this.#lastToken_m.clear();
  }

  // /**
  //  * `in( tstrt_x <= tstop_x )`
  //  * @const @param tstop_x
  //  */
  // tmap_$(tstrt_x: loff_t, tstop_x: loff_t) {
  //   const ret: Ranval[] = [];
  //   let tseg = this.strtTSeg_$;
  //   if (tseg) {
  //     let valve = 100;
  //     do {
  //       if (tseg.strtTLoff <= tstrt_x && tstrt_x < tseg.stopTLoff) {
  //         const rv = new Ranval(
  //           this.lidx_1,
  //           tseg.strtLoff + tstrt_x - tseg.strtTLoff,
  //         );
  //         rv[3] = tseg.stopLoff - Math.max(tseg.stopTLoff - tstop_x, 0);
  //         ret.push(rv);

  //         if (tstop_x <= tseg.stopTLoff) {
  //           break;
  //         } else tstrt_x = tseg.stopTLoff;
  //       }

  //       tseg = tseg.nextTSeg_$;
  //     } while (tseg && tseg !== this.stopTSeg_$ && --valve);
  //     assert(valve);
  //   }
  //   return ret;
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  get _info(): string {
    return `${this._type_id}, ${this.bufr$?._type_id ?? "-"}, ` +
      `prev: ${this.prevLine$?._type_id ?? "-"}, ` +
      `next: ${this.nextLine$?._type_id ?? "-"}`;
  }
}
/*80--------------------------------------------------------------------------*/
