/** 80**************************************************************************
 * @module lib/compiling/Lexr
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, ldt_t, loff_t, uint, uint16 } from "../alias.ts";
import { MAX_lnum } from "../alias.ts";
import "../jslang.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import { ws_a } from "../util/string.ts";
import { assert, out, traceOut } from "../util/trace.ts";
import type { Err, Locval, Tok } from "./alias.ts";
import { BaseTok } from "./BaseTok.ts";
import { LocCompared } from "./Loc.ts";
import { g_ran_fac } from "./RanFac.ts";
import { SortedSnt_id } from "./Snt.ts";
import type { Stnode } from "./Stnode.ts";
import type { TokBart } from "./TokBart.ts";
import type { TokBufr } from "./TokBufr.ts";
import { Token } from "./Token.ts";
import type { TokLine } from "./TokLine.ts";
import { TokLoc } from "./TokLoc.ts";
import { TokRan } from "./TokRan.ts";
import { frstNon } from "./util.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Lexr<T extends Tok = BaseTok> {
  static #ID = 0 as id_t;
  readonly id = ++Lexr.#ID as id_t;
  /** @final */
  get _type_id_() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* bufr$ */
  protected bufr$!: TokBufr<T> | TokBart<T>;
  get bufr() {
    return this.bufr$;
  }

  /**
   * `out( ret; ret.value === BaseTok.strtBdry )`
   * @final
   */
  get frstLexTk(): Token<T> {
    return this.bufr$.frstLine.frstTokenBy(this)!;
  }
  /**
   * `out( ret; ret.value === BaseTok.stopBdry )`
   * @final
   */
  get lastLexTk(): Token<T> {
    return this.bufr$.lastLine.lastTokenBy(this)!;
  }
  /* ~ */

  protected strtLexTk$!: Token<T>;
  get strtLexTk_$() {
    return this.strtLexTk$;
  }
  protected stopLexTk$!: Token<T>;
  get stopLexTk_$() {
    return this.stopLexTk$;
  }
  protected strtLexTk_0$!: Token<T>;
  // get strtToken_0_$() {
  //   return this.strtLexTk_0$;
  // }

  readonly #strtLexTk_a: Token<T>[] = [];
  readonly #stopLexTk_a: Token<T>[] = [];

  readonly #lv_oldStop_a: Locval[] = [];
  readonly #dtLoff_a: ldt_t[] = [];
  get dtLoff() {
    //jjjj For the moment, take the last one. May change if needed.
    return this.#dtLoff_a.at(-1)!;
  }

  readonly #adjStrtTk_a: boolean[] = [];
  readonly #adjStopTk_a: boolean[] = [];

  /* #errTk_sa */
  #errTk_sa = new SortedIdo<Token<T>>();
  get hasErr() {
    return !!this.#errTk_sa.length;
  }
  onlyErr(err_x: Err, tk_x?: Token<T>): boolean {
    return this.#errTk_sa.length === 1 &&
      this.#errTk_sa[0].onlyErr(err_x) &&
      (!tk_x || this.#errTk_sa[0] === tk_x);
  }

  clrErr_$() {
    this.#errTk_sa.reset_SortedArray();
  }

  get _err_() {
    const ret: [string, string[]][] = [];
    for (const tk of this.#errTk_sa) {
      ret.push([tk.toString(), tk._err_]);
    }
    return ret;
  }
  /* ~ */

  protected curLoc$!: TokLoc<T>;
  //jjjj TOCLEANUP
  // initCurLoc() {
  //   let loc = this.strtLexTk$.nextToken_$?.sntStrtLoc;
  //   if (!loc?.posS(this.stopLexTk$.sntStrtLoc)) {
  //     loc = this.strtLexTk$.sntStopLoc;
  //   }
  //   this.curLoc$.become(loc);
  // }

  protected readonly drtTk_sa$ = new SortedSnt_id<Token<T>>();
  /** @borrow @headconst @param tk_x */
  drtenTk_$(tk_x: Token<T>) {
    tk_x.saveRanval_$();
    tk_x.value = BaseTok.unknown as T; // !
    this.drtTk_sa$.add(tk_x);
  }

  readonly #scandTk_a: Token<T>[] = [];
  get _scandTk_a_() {
    return this.#scandTk_a;
  }

  /** last scanned Token */
  lsTk$: Token<T> | undefined;

  //jjjj TOCLEANUP
  // readonly #genOutTk = () =>
  //   this.reachLexBdry$() === LocCompared.yes
  //     ? this.stopLexTk$
  //     : new Token(this, new TokRan(this.curLoc$.dup()));
  protected genOutTk$(): Token<T> {
    return new Token(this, g_ran_fac.byTokLoc(this.curLoc$));
  }
  protected outTk$: Token<T> | undefined;
  protected get outTk_1$(): Token<T> {
    //jjjj optimize
    return this.outTk$ ??= this.genOutTk$();
  }

  // static readonly #VALVE = 100;
  // #valve = Lexr.#VALVE;

  /**
   * @headconst @param bufr_x
   * @const @param strtLoff_x
   * @const @param stopLoff_x
   */
  constructor(
    bufr_x: TokBufr<T> | TokBart<T>,
    strtLoff_x: loff_t = 0,
    stopLoff_x?: loff_t,
  ) {
    this.reset_Lexr$(bufr_x, strtLoff_x, stopLoff_x);
  }

  #destroyed = false;
  /** `in( this.bufr$)` */
  destructor(): void {
    if (this.#destroyed) return;

    this.batchForw_$((tk) => tk.destructor(), this.frstLexTk);

    let ln_: TokLine<T> | undefined = this.bufr$.frstLine;
    const VALVE = MAX_lnum;
    let valve = VALVE;
    while (ln_ && --valve) {
      ln_.delFrstTokenBy_$(this);
      ln_.delLastTokenBy_$(this);
      ln_ = ln_.nextLine;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    // this.bufr$ = undefined as any;
    this.strtLexTk$ = undefined as any;
    this.stopLexTk$ = undefined as any;
    this.strtLexTk_0$ = undefined as any;

    this.#strtLexTk_a.length = 0;
    this.#stopLexTk_a.length = 0;

    this.#lv_oldStop_a.length = 0;
    this.#dtLoff_a.length = 0;

    this.#adjStrtTk_a.length = 0;
    this.#adjStopTk_a.length = 0;

    this.clrErr_$();

    this.curLoc$ = undefined as any;
    this.drtTk_sa$.reset_SortedArray();
    this.#scandTk_a.length = 0;
    this.lsTk$ = undefined;
    this.outTk$ = undefined;

    this.#destroyed = true;
  }

  /**
   * @final
   * @headconst @param bufr_x
   * @const @param strtLoff_x
   * @const @param stopLoff_x
   */
  @out((self: Lexr<T>) => {
    assert(self.frstLexTk.value === BaseTok.strtBdry);
    assert(self.lastLexTk.value === BaseTok.stopBdry);
  })
  protected reset_Lexr$(
    bufr_x: TokBufr<T> | TokBart<T>,
    strtLoff_x: loff_t,
    stopLoff_x?: loff_t,
  ): this {
    if (this.bufr$) this.destructor();

    this.bufr$ = bufr_x;

    this.strtLexTk$ = new Token(
      this,
      g_ran_fac.byTok(bufr_x.frstLine, strtLoff_x),
      BaseTok.strtBdry as T,
    );
    this.stopLexTk$ = new Token(
      this,
      g_ran_fac.byTok(bufr_x.lastLine, stopLoff_x),
      BaseTok.stopBdry as T,
    );
    this.strtLexTk$.linkNext(this.stopLexTk$);
    bufr_x.frstLine.setFrstToken_$(this.strtLexTk$);
    bufr_x.lastLine.setLastToken_$(this.stopLexTk$);

    this.curLoc$ = this.strtLexTk$.sntStopLoc.dup_Loc();

    // this.initialized_ = false; /** @member { Boolean } */

    this.#destroyed = false;
    return this;
  }

  /**
   * @headconst @param bufr_x
   * @const @param strtLoff_x
   * @const @param stopLoff_x
   */
  reset_Lexr(
    bufr_x?: TokBufr<T> | TokBart<T>,
    strtLoff_x: loff_t = 0,
    stopLoff_x?: loff_t,
  ): this {
    return this.reset_Lexr$(bufr_x ?? this.bufr$, strtLoff_x, stopLoff_x);
  }

  // get initialized() { return this.initialized_; }

  // /**
  //  * @param { TokBufr<T> } bufr @const
  //  */
  // initialize$_( bufr )
  // {
  //   /* in */ {
  //     assert( !this.initialized_ );
  //     assert( bufr );
  //   }
  //   const out = () => {
  //     assert( this.bufr$ );
  //     assert( this.strtLexTk$ && this.stopLexTk$ );
  //     assert( this.initialized_ );
  //   }

  //   this.bufr$ = bufr; /** @member { TokBufr<T> } */
  //   // this.curLoc$ = new TokLoc( bufr.frstLine ); /** @member */
  //   // this.strtloc_ = this.curLoc$.dup();
  //   // this.stoploc_ = this.curLoc$.dup();

  //   /** @member { Token } */
  //   this.strtLexTk$ = new Token( new TokLoc(bufr.frstLine), BaseTok.strtBdry );
  //   /** @member { Token } */
  //   this.stopLexTk$ = new Token( new TokLoc(bufr.lastLine,bufr.lastLine.uchrLen), BaseTok.stopBdry );

  //   this.initialized_ = true;

  //   out();
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @headconst @param oldRan_x */
  protected calcStrtLexTk$(oldRan_x: TokRan<T>): Token<T> | undefined {
    let ln_ = oldRan_x.frstLine;
    let retTk = ln_.frstTokenBy(this);
    /** @primaryconst */
    const strtLoc = oldRan_x.strtLoc;
    while (
      !retTk ||
      strtLoc.posS(retTk.sntStopLoc) ||
      retTk.value === BaseTok.stopBdry //!
    ) {
      if (ln_.isFrstLine) {
        retTk = undefined;
        break;
      }

      // assert( ln_.prevLine );
      ln_ = ln_.prevLine!;
      retTk = ln_.frstTokenBy(this);
    }
    // assert(valve);
    if (retTk) {
      /*#static*/ if (INOUT) {
        assert(retTk.sntStopLoc.posSE(strtLoc));
      }
      while (
        retTk.nextToken_$?.sntStopLoc.posSE(strtLoc) &&
        retTk.nextToken_$.value !== BaseTok.stopBdry
      ) {
        retTk = retTk.nextToken_$;
      }
    }
    return retTk;
  }

  /** @headconst @param oldRan_x */
  protected calcStopLexTk$(oldRan_x: TokRan<T>): Token<T> | undefined {
    let ln_ = oldRan_x.lastLine;
    let retTk = ln_.lastTokenBy(this);
    /** @primaryconst */
    const stopLoc = oldRan_x.stopLoc;
    while (
      !retTk ||
      retTk.sntStrtLoc.posS(stopLoc) ||
      retTk.value === BaseTok.strtBdry //!
    ) {
      if (ln_.isLastLine) {
        retTk = undefined;
        break;
      }

      // assert( ln_.nextLine );
      ln_ = ln_.nextLine!;
      retTk = ln_.lastTokenBy(this);
    }
    // assert(valve);
    if (retTk) {
      /*#static*/ if (INOUT) {
        assert(stopLoc.posSE(retTk.sntStrtLoc));
      }
      while (
        retTk.prevToken_$?.sntStrtLoc.posGE(stopLoc) &&
        retTk.prevToken_$.value !== BaseTok.strtBdry
      ) {
        retTk = retTk.prevToken_$;
      }
    }
    return retTk;
  }

  // /**
  //  * [`strtTk_x`, `stopTk_x`)
  //  * @headconst @param strtTk_x
  //  * @headconst @param stopTk_x
  //  */
  // bakeRanvalForw_$(strtTk_x?: Token<T>, stopTk_x?: Token<T>): void {
  //   if (!strtTk_x) return;

  //   let tk_: Token<T> | undefined = strtTk_x;
  //   const VALVE = 10_000;
  //   let valve = VALVE;
  //   while (tk_ && tk_ !== stopTk_x && --valve) {
  //     tk_.bakeRanval_$();
  //     tk_ = tk_.nextToken_$;
  //   }
  //   assert(valve, `Loop ${VALVE}±1 times`);
  // }
  // /** @see {@linkcode bakeRanvalForw_$()} */
  // bakeRanvalBack_$(strtTk_x?: Token<T>, stopTk_x?: Token<T>): void {
  //   if (!strtTk_x) return;

  //   let tk_: Token<T> | undefined = strtTk_x;
  //   const VALVE = 10_000;
  //   let valve = VALVE;
  //   while (tk_ && tk_ !== stopTk_x && --valve) {
  //     tk_.bakeRanval_$();
  //     tk_ = tk_.prevToken_$;
  //   }
  //   assert(valve, `Loop ${VALVE}±1 times`);
  // }
  /**
   * [`strtTk_x`, `stopTk_x`)
   * @headconst @param fn_x
   * @headconst @param strtTk_x
   * @headconst @param stopTk_x
   */
  batchForw_$(
    fn_x: (tk: Token<T>) => void,
    strtTk_x?: Token<T>,
    stopTk_x?: Token<T>,
  ): void {
    if (!strtTk_x) return;

    let tk_: Token<T> | undefined = strtTk_x;
    const VALVE = MAX_lnum;
    let valve = VALVE;
    while (tk_ && tk_ !== stopTk_x && --valve) {
      fn_x(tk_);
      tk_ = tk_.nextToken_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    //jjjj TOCLEANUP
    // /*#static*/ if (INOUT) {
    //   assert(tk_);
    // }
  }
  /** @see {@linkcode batchForw_$()} */
  batchBack_$(
    fn_x: (tk: Token<T>) => void,
    strtTk_x?: Token<T>,
    stopTk_x?: Token<T>,
  ): void {
    if (!strtTk_x) return;

    let tk_: Token<T> | undefined = strtTk_x;
    const VALVE = 10_000;
    let valve = VALVE;
    while (tk_ && tk_ !== stopTk_x && --valve) {
      fn_x(tk_);
      tk_ = tk_.prevToken_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    //jjjj TOCLEANUP
    // /*#static*/ if (INOUT) {
    //   assert(tk_);
    // }
  }

  /**
   * `in( _oldRan_a_x.length )`
   * @headconst @param _oldRan_a_x
   */
  protected suflexmrk$(_oldRan_a_x?: TokRan<T>[]) {}

  /**
   * Mark lex region
   *
   * Assign `#strtLexTk_a`, `#stopLexTk_a`, `#lv_oldStop_a`, `#dtLoff_a`,
   * `#adjStrtTk_a`, `#adjStopTk_a`.\
   * Set `strtLexTk$`, `stopLexTk$`.
   *
   * @final
   * @headconst @param oldRan_a_x
   */
  @traceOut(_TRACE)
  @out((self: Lexr<T>) => {
    assert(!self.strtLexTk$.isErr);
    assert(!self.stopLexTk$.isErr);
    assert(self.strtLexTk$.posS(self.stopLexTk$));
  })
  lexmrk_$(oldRan_a_x: TokRan<T>[]): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id_}.lexmrk_$(${oldRan_a_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(oldRan_a_x.length && oldRan_a_x[0].bufr === this.bufr$);
      // const ranbufr = oldRan_x.bufr;
      // assert( !ranbufr || ranbufr === this.bufr$ );
    }
    this.#strtLexTk_a.length =
      this.#stopLexTk_a.length =
      this.#lv_oldStop_a.length =
      this.#dtLoff_a.length =
      this.#adjStrtTk_a.length =
      this.#adjStopTk_a.length =
        oldRan_a_x.length;

    for (let i = oldRan_a_x.length; i--;) {
      const oldRan = oldRan_a_x[i];

      this.#lv_oldStop_a[i] = [oldRan.stopLoc.lidx_1, oldRan.stopLoff];
      this.#dtLoff_a[i] = 0 as ldt_t;

      this.#strtLexTk_a[i] = this.calcStrtLexTk$(oldRan) ?? this.frstLexTk;
      this.#stopLexTk_a[i] = this.calcStopLexTk$(oldRan) ?? this.lastLexTk;

      this.#adjStrtTk_a[i] =
        this.#strtLexTk_a[i].sntLastLine === oldRan.frstLine;
      this.#adjStopTk_a[i] =
        oldRan.lastLine === this.#stopLexTk_a[i].sntFrstLine;

      if (i < oldRan_a_x.length - 1) {
        const gen_tk = () =>
          new Token(
            this,
            g_ran_fac.byTokLoc(oldRan.stopLoc, oldRan_a_x[i + 1].strtLoc),
          ).syncRanval();
        if (this.#strtLexTk_a[i] === this.#strtLexTk_a[i + 1]) {
          const tk_ = this.#stopLexTk_a[i] =
            this.#strtLexTk_a[i + 1] =
              this.#strtLexTk_a[i].insertNext(gen_tk());
          if (
            tk_.nextToken_$ && tk_.sntStopLoc.posG(tk_.nextToken_$.sntStrtLoc)
          ) tk_.nextToken_$.setStrt(tk_.sntStopLoc);
        } else if (this.#stopLexTk_a[i] === this.#stopLexTk_a[i + 1]) {
          const tk_ = this.#stopLexTk_a[i] =
            this.#strtLexTk_a[i + 1] =
              this.#stopLexTk_a[i + 1].insertPrev(gen_tk());
          if (
            tk_.prevToken_$ && tk_.sntStrtLoc.posS(tk_.prevToken_$.sntStopLoc)
          ) tk_.prevToken_$.setStop(tk_.sntStrtLoc);
        }
      }
    }

    if (this.strtLexTk$ === this.stopLexTk$) {
      this.strtLexTk$ = this.#strtLexTk_a[0];
      this.stopLexTk$ = this.#stopLexTk_a.at(-1)!;
    } else {
      if (this.strtLexTk$.posG(this.#strtLexTk_a[0])) {
        this.strtLexTk$ = this.#strtLexTk_a[0];
      }
      if (this.stopLexTk$.posS(this.#stopLexTk_a.at(-1)!)) {
        this.stopLexTk$ = this.#stopLexTk_a.at(-1)!;
      }
    }
    if (this.strtLexTk$.isErr) {
      /*#static*/ if (INOUT) {
        assert(this.strtLexTk$.value === BaseTok.strtBdry);
      }
      this.strtLexTk$.clrErr();
      this.#errTk_sa.delete(this.strtLexTk$);
    }
    if (this.stopLexTk$.isErr) {
      /*#static*/ if (INOUT) {
        assert(this.stopLexTk$.value === BaseTok.stopBdry);
      }
      this.stopLexTk$.clrErr();
      this.#errTk_sa.delete(this.stopLexTk$);
    }

    this.batchForw_$(
      //jjjj TOCLEANUP
      // (tk) => tk.reset_Token().saveRanval_$(),
      (tk) => this.drtenTk_$(tk),
      this.strtLexTk$.nextToken_$,
      this.stopLexTk$,
    );
    this.suflexmrk$(oldRan_a_x);
    return this;
  }

  // /**
  //  * @final
  //  * @param { TokLine<T> } line_x
  //  * @const @param { loff_t } loff_x
  //  */
  // markLexRegion( line_x, loff_x )
  // {
  //   markLexRegion( line_x, loff_x, line_x, loff_x );
  // }

  // get strtLoc$_() { return this.strtloc_; }
  // get stoplocOld$_() { return this.stoplocOld_; }

  /** Helper */
  #anchr_s = new Set<Token<T>>();
  /** Helper */
  #focus_s = new Set<Token<T>>();
  /**
   * Adjust lex region
   *
   * Adjust `strtLexTk$`, and tokens before at the same line.\
   * Adjust `stopLexTk$`, and tokens after at the same line.\
   * Reset `#errTk_sa`
   *
   * @final
   * @headconst @param newRan_a_x
   */
  @traceOut(_TRACE)
  lexadj_$(newRan_a_x: TokRan<T>[]): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id_}.lexadj_$(${newRan_a_x}) >>>>>>>`,
      );
    }
    const LEN = newRan_a_x.length;
    /*#static*/ if (INOUT) {
      assert(LEN && newRan_a_x[0].bufr === this.bufr$);
    }
    this.#anchr_s.clear();
    this.#focus_s.clear();
    /* Adjusting each of `newRan_a_x`, not just `newRan_a_x[0]`,
    `newRan_a_x.at(-1)!`, is because unrelated tokens also need to be adjusted. */
    /* MUST be in (non-reverse) order, because following tokens and
    `#lv_oldStop_a` on the same line need to be adjusted. */
    for (let i = 0; i < LEN; ++i) {
      const newRan = newRan_a_x[i];

      const strtLn_tgt = newRan.frstLine;
      const stopLn_tgt = newRan.lastLine;
      if (this.#adjStrtTk_a[i]) {
        const strtLn_src = this.#strtLexTk_a[i].sntLastLine;
        if (strtLn_src !== strtLn_tgt) {
          let tk_: Token<T> | undefined = this.#strtLexTk_a[i];
          do {
            tk_.sntStopLoc.line_$ = strtLn_tgt;
            this.#focus_s.add(tk_);
            if (tk_.sntFrstLine === strtLn_src) {
              tk_.sntStrtLoc.line_$ = strtLn_tgt;
              this.#anchr_s.add(tk_);
            }

            if (tk_ === strtLn_src.frstTokenBy(this)) {
              strtLn_src.delFrstTokenBy_$(this);
              strtLn_tgt.setFrstToken_$(tk_);
            }
            if (
              tk_ === strtLn_src.lastTokenBy(this) && strtLn_tgt !== stopLn_tgt
            ) {
              strtLn_src.delLastTokenBy_$(this);
              strtLn_tgt.setLastToken_$(tk_);
            }

            tk_ = tk_.prevToken_$;
          } while (tk_?.sntLastLine === strtLn_src);
        }
      }

      if (this.#adjStopTk_a[i]) {
        const stopLn_src = this.#stopLexTk_a[i].sntFrstLine;
        const dtLoff = this.#dtLoff_a[i] =
          (newRan.stopLoff - this.#lv_oldStop_a[i][1]) as ldt_t;
        if (dtLoff !== 0) {
          for (let j = i + 1; j < LEN; ++j) {
            if (this.#lv_oldStop_a[j][0] !== this.#lv_oldStop_a[i][0]) break;
            this.#lv_oldStop_a[j][1] += dtLoff;
          }
        }
        if (stopLn_src !== stopLn_tgt || dtLoff !== 0) {
          let tk_: Token<T> | undefined = this.#stopLexTk_a[i];
          do {
            tk_.sntStrtLoc.set_Loc(stopLn_tgt, tk_.sntStrtLoff + dtLoff);
            this.#anchr_s.add(tk_);
            if (tk_.sntLastLine === stopLn_src) {
              tk_.sntStopLoc.set_Loc(stopLn_tgt, tk_.sntStopLoff + dtLoff);
              this.#focus_s.add(tk_);
            }

            if (
              tk_ === stopLn_src.frstTokenBy(this) && strtLn_tgt !== stopLn_tgt
            ) {
              stopLn_src.delFrstTokenBy_$(this);
              stopLn_tgt.setFrstToken_$(tk_);
            }
            if (tk_ === stopLn_src.lastTokenBy(this)) {
              stopLn_src.delLastTokenBy_$(this);
              stopLn_tgt.setLastToken_$(tk_);
            }

            tk_ = tk_.nextToken_$;
          } while (tk_?.sntFrstLine === stopLn_src);
        }
      }
    }
    /* Since in (non-reverse) order, so `syncRanvalAnchr()`, `syncRanvalFocus()`
    can not be called in above loop, because otherwise they could calc `lidx_1`
    on `removed` Line.  */
    for (const tk of this.#anchr_s) tk.syncRanvalAnchr();
    for (const tk of this.#focus_s) tk.syncRanvalFocus();

    if (this.hasErr) {
      /*#static*/ if (INOUT) {
        assert(
          this.strtLexTk$.posS(this.#errTk_sa[0]) &&
            this.stopLexTk$.posG(this.#errTk_sa.at(-1)!),
        );
      }
      this.clrErr_$();
    }
    return this;
  }

  // get stoplocNew$_() { return this.stoplocNew_; }

  /** Assign `curLoc$` */
  protected prelex$(): void {
    this.curLoc$.become_Loc(this.strtLexTk$.sntStopLoc);
  }

  protected suflex$(_valve_x: uint): void {}

  /**
   * Lex [ strtLexTk$.stopLoc, stopLexTk$.strtLoc )
   * @final
   */
  @traceOut(_TRACE)
  lex(valve_x = 10): void {
    assert(valve_x--, "Cycle call!");
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id_}.lex() >>>>>>>`);
    }
    if (this.strtLexTk$ === this.stopLexTk$) { //llll review (one Bufr with different Lexr? etc)
      /* This is the case of one `Bufr` with two or more `EdtrScrolr`. */
      return;
    }

    /*#static*/ if (INOUT) {
      /* Error tokens, if any, are included in the lex region. */
      assert(!this.hasErr);
      assert(this.strtLexTk$.posS(this.stopLexTk$));
    }
    this.prelex$();

    this.strtLexTk_0$ = this.strtLexTk$;
    // this.#valve = Lexr.#VALVE;
    this.lex_impl$()
      .concatTokens$();

    // console.log(this.bufr$.frstLine.frstTokenBy(this));
    // console.log(this.bufr$.lastLine.lastTokenBy(this));

    this.suflex$(valve_x);

    if (this.drtTk_sa$.length) {
      this.drtTk_sa$.delete_O(this.#scandTk_a);
      for (const tk of this.drtTk_sa$) tk.destructor();
      this.drtTk_sa$.reset_SortedArray();
    }
    this.#scandTk_a.length = 0;
  }

  //jjjj TOCLEANUP
  // /** @return `null` means scanning token not provided here. */
  // protected getScanningToken$(): Token<T> | undefined | null {
  //   return this.lsTk$?.nextToken_$;
  // }

  /**
   * Lex [ `strtLexTk$.sntStopLoc`, `stopLexTk$.sntStrtLoc` )\
  //  * `in( this.#valve > 0 )`
   * @final
   */
  protected lex_impl$(): this {
    // assert(this.#valve--, `Loop ${Lexr.#VALVE} times`);
    /* if in `_relex`ing... */
    if (this.#scandTk_a.length) {
      for (const tk of this.#scandTk_a) {
        if (!this.drtTk_sa$.includes(tk)) tk.destructor();
      }
      this.#scandTk_a.length = 0;
    }
    this.lsTk$ = this.strtLexTk$;
    const VALVE = 10_000;
    let valve = VALVE;
    do {
      const tk_ = this._scan();
      if (!tk_ || tk_.value === BaseTok.unknown) { // 2269
        assert(valve--, `Loop ${VALVE}±1 times`);
        continue;
      }
      /* Could set `lsTk$` to `undefined` in `scan_impl$()` to prevent
      `.lineNext()` here. */
      this.lsTk$?.linkNext(tk_);

      if (tk_.isErr) this.#errTk_sa.add(tk_);
      if (!this.hasErr) this.strtLexTk$ = tk_;
      if (tk_ === this.stopLexTk$) break;

      tk_.syncRanval(); //!
      if (this.lsTk$) this.#scandTk_a.push(tk_);
      this.lsTk$ = tk_;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    return this;
  }

  /** @final */
  protected reachLexBdry$(): boolean {
    return this.curLoc$.posGE(this.stopLexTk$.sntStrtLoc);
  }
  /** @final */
  protected atRigtBdry$(): LocCompared {
    return this.curLoc$.locE(this.stopLexTk$.sntStrtLoc);
  }
  /** @final */
  protected overRigtBdry$(): LocCompared {
    return this.curLoc$.locG(this.stopLexTk$.sntStrtLoc);
  }

  /**
   * Scan one token ab to stopLexTk$ (excluded).
  //jjjj TOCLEANUP
  //  * @param retTk_x Derived from {@linkcode getScanningToken$()}
   */
  @out((self: Lexr<T>, ret) => {
    if (ret && ret !== self.stopLexTk$) {
      assert(ret.posS(self.stopLexTk$));
      assert(ret.sntStopLoc.posSE(self.curLoc$));
    }
  })
  private _scan(
    // retTk_x: Token<T> | undefined | null,
  ): Token<T> | undefined {
    this.curLoc$.correctLoff(); // Could `overEol`
    /*#static*/ if (INOUT) {
      // assert( this.strtLexTk$ && this.stopLexTk$ );
      assert(
        this.strtLexTk$.sntStopLoc.posSE(this.curLoc$) &&
          this.curLoc$.posSE(this.stopLexTk$.sntStrtLoc),
      );
    }
    if (this.reachLexBdry$()) {
      return this.stopLexTk$;
    }

    //jjjj TOCLEANUP
    // if (retTk_x === undefined || retTk_x === this.stopLexTk$) {
    //   retTk_x = new Token(this, new TokRan(this.curLoc$.dup_Loc()));
    // } else if (retTk_x instanceof Token) {
    //   retTk_x.setStrt(this.curLoc$);
    // }
    return this.scan_impl$();
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // /**
  //  * `curLoc$` must be at the end of the scaned `tok_x` (excluded)
  //  * @final
  //  * @const @param tok_x
  //  * @out @param out_x
  //  * @const @param stopLoc_x
  //  */
  // protected setTok$(
  //   tok_x: T,
  //   out_x: Token<T>,
  //   stopLoc_x: Loc = this.curLoc$,
  // ): void {
  //   out_x.value = tok_x;
  //   out_x.setStop(stopLoc_x);
  // }

  /**
   * @const @param ucod_x
   * @return `true` if continue; `false` if `atRigtBdry$() === LocCompared.yes`.
   *  Whatever `true` or `false`, `curLoc$` will be at the right place.
   */
  protected skipWhitespace$(ucod_x: uint16 | uint16[] = ws_a): boolean {
    let ret = true;
    const VALVE = 1_000;
    let valve = VALVE;
    L_0: do {
      this.curLoc$.forw();
      switch (this.atRigtBdry$()) {
        case LocCompared.yes:
          ret = false;
          break L_0;
        case LocCompared.no_othrline:
          this.curLoc$.loff_$ = frstNon(
            ucod_x,
            this.curLoc$.line_$,
            this.curLoc$.loff_$,
          );
          if (!this.curLoc$.reachEol) break L_0;
          break;
        default:
          this.curLoc$.loff_$ = frstNon(
            ucod_x,
            this.curLoc$.line_$,
            this.curLoc$.loff_$,
          );
          if (this.atRigtBdry$()) ret = false;
          break L_0;
      }
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    return ret;
  }

  /**
   * Scan one token ab to stopLexTk$ (excluded)\
   * `in( this.reachLexBdry$() !== LocCompared.yes )` \
  //  * `in( retTk_x.strtLoc.posSE(this.curLoc$) )`\
  //  * `in( retTk_x.value === BaseTok.unknown )`
   */
  protected abstract scan_impl$(): Token<T> | undefined;
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  #scanBypassSn(sn_x: Stnode<T>): void {
    let tk_ = sn_x.frstToken;
    const lastTk = sn_x.lastToken;
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      tk_.syncRanval(); //!
      this.#scandTk_a.push(tk_);
      if (tk_ === lastTk) break;
      tk_ = tk_.nextToken_$!;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
  }
  #scanBypassTk(tk_x: Token<T>): void {
    tk_x.syncRanval(); //!
    this.#scandTk_a.push(tk_x);
  }
  /**
   * Only chain the first token of `snt_a_x` with `lsTk$`, and put all tokens of
   * `snt_a_x` into `#scandTk_a`.\
   * ! Tokens in `snt_a_x` SHOULD already be well chained.
   *
   * ! Do not modify `curLoc$`
   * @final
   * @headconst @param snt_a_x
   */
  protected scanBypassSnt$(...snt_a_x: (Token<T> | Stnode<T>)[]): Token<T> {
    /*#static*/ if (INOUT) {
      assert(snt_a_x.length);
      assert(this.lsTk$);
    }
    const tk_0 = snt_a_x[0] instanceof Token
      ? snt_a_x[0]
      : snt_a_x[0].frstToken;
    this.lsTk$!.linkNext(tk_0);
    for (const snt of snt_a_x) {
      if (snt instanceof Token) this.#scanBypassTk(snt);
      else this.#scanBypassSn(snt);
    }
    //! to prevent `.linkNext()` in `lex_impl$()`, and `#scandTk_a.push()`
    this.lsTk$ = undefined;
    const lastSnt = snt_a_x.at(-1)!;
    return lastSnt instanceof Token ? lastSnt : lastSnt.lastToken;
  }

  /**
   * @const @param _tk_0_x
   * @const @param _tk_1_x
   */
  protected canConcat$(_tk_0_x: Token<T>, _tk_1_x: Token<T>): boolean {
    return false;
  }

  /**
   * Try to concat `#scandTk_a[0]` with `strtLexTk_0$` and `#scandTk_a.at(-1)`
   * with `stopLexTk$`.\
   * `strtLexTk_0$` could be adjusted to keep valid, which will be used in
   * `Pazr.paz()`.
   *
   * Priority to keep unchanged: `stopLexTk$` > `strtLexTk_0$` > `#scandTk_a`
   *
   * @final
   */
  protected concatTokens$() {
    const tk_a = this.#scandTk_a;
    /*#static*/ if (INOUT) {
      if (tk_a.length) {
        assert(
          tk_a[0].prevToken_$ === this.strtLexTk_0$ &&
            tk_a.at(-1)!.nextToken_$ === this.stopLexTk$,
        );
      } else {
        assert(this.strtLexTk_0$.isConcatedTo(this.stopLexTk$));
      }
    }
    let tk_0, tk_1: Token<T> | undefined;
    if (tk_a.length) {
      tk_0 = this.strtLexTk_0$;
      tk_1 = tk_a[0];
      if (tk_0 !== this.frstLexTk && this.canConcat$(tk_0, tk_1)) { // 1894
        tk_0.setStop(tk_1.sntStopLoc).linkNext(tk_1.nextToken_$!);
        if (!this.drtTk_sa$.includes(tk_1)) tk_1.destructor(); //!
        tk_a.splice(0, 1);
      }
      tk_0 = tk_a.at(-1);
      tk_1 = this.stopLexTk$;
      if (tk_1 !== this.lastLexTk && tk_0 && this.canConcat$(tk_0, tk_1)) { // 1895
        tk_1.setStrt(tk_0.sntStrtLoc).linkPrev(tk_0.prevToken_$!);
        if (!this.drtTk_sa$.includes(tk_0)) tk_0.destructor(); //!
        tk_a.pop();
      }
    }
    if (!tk_a.length) {
      tk_0 = this.strtLexTk_0$;
      tk_1 = this.stopLexTk$;
      if (
        tk_0 !== this.frstLexTk && tk_1 !== this.lastLexTk &&
        this.canConcat$(tk_0, tk_1)
      ) {
        tk_1.setStrt(tk_0.sntStrtLoc).linkPrev(tk_0.prevToken_$!);
        tk_0.destructor(); //!
        this.strtLexTk_0$ = tk_1; //!
      }
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  toString() {
    let tk_ = this.frstLexTk;
    const ret_a: string[] = [tk_.toString()];

    let curlidx = tk_.sntFrstLine.lidx_1;
    const lastTk = this.lastLexTk;
    const VALVE = 1_000;
    let valve = VALVE;
    do {
      tk_ = tk_.nextToken_$!;
      const lidx = tk_.sntFrstLine.lidx_1;
      if (lidx === curlidx) {
        ret_a.push(" ");
      } else {
        ret_a.push("\n");
        curlidx = lidx;
      }
      ret_a.push(tk_.toString());
    } while (!tk_.posE(lastTk) && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret_a.join("");
  }

  get _tkId_a_(): id_t[] {
    let tk_ = this.frstLexTk;
    const ret_a = [tk_.id];

    const lastTk = this.lastLexTk;
    const VALVE = 1_000;
    let valve = VALVE;
    do {
      tk_ = tk_.nextToken_$!;
      ret_a.push(tk_.id);
    } while (!tk_.posE(lastTk) && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret_a;
  }
}
/*80--------------------------------------------------------------------------*/

export abstract class LexdInfo {
  static #ID = 0 as id_t;
  readonly id = ++LexdInfo.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  destructor() {}
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // /** @const */
  // become(li_x: LexdInfo) {}

  toString(): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
