/** 80**************************************************************************
 * @module lib/compiling/Lexr
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, ldt_t, loff_t, uint } from "../alias.ts";
import { MAX_lnum } from "../alias.ts";
import "../jslang.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import { assert, out, traceOut } from "../util/trace.ts";
import type { Tok } from "./alias.ts";
import { BaseTok } from "./BaseTok.ts";
import { type Loc, LocCompared } from "./Loc.ts";
import type { Stnode } from "./Stnode.ts";
import type { TokBufr } from "./TokBufr.ts";
import { Token } from "./Token.ts";
import type { TokLine } from "./TokLine.ts";
import { TokLoc } from "./TokLoc.ts";
import { TokRan } from "./TokRan.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Lexr<T extends Tok = BaseTok> {
  static #ID = 0 as id_t;
  readonly id = ++Lexr.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }

  /* bufr$ */
  protected bufr$!: TokBufr<T>;
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

  #oldStopLoff: loff_t = 0;
  #dtLoff = 0 as ldt_t;
  get dtLoff(): ldt_t {
    return this.#dtLoff;
  }

  #adjustStrtToken = false;
  #adjustStopToken = false;

  #errTk_sa = new SortedIdo<Token<T>>();
  get hasErr() {
    return !!this.#errTk_sa.length;
  }
  get _err() {
    const ret: [string, string[]][] = [];
    for (const tk of this.#errTk_sa) {
      ret.push([tk.toString(), tk._err]);
    }
    return ret;
  }

  protected curLoc$!: TokLoc<T>;
  //jjjj TOCLEANUP
  // initCurLoc() {
  //   let loc = this.strtLexTk$.nextToken_$?.sntStrtLoc;
  //   if (!loc?.posS(this.stopLexTk$.sntStrtLoc)) {
  //     loc = this.strtLexTk$.sntStopLoc;
  //   }
  //   this.curLoc$.become(loc);
  // }

  readonly #scandTk_a: Token<T>[] = [];
  /** last scanned Token */
  lsTk$: Token<T> | undefined;

  // static readonly #VALVE = 100;
  // #valve = Lexr.#VALVE;

  /**
   * @headconst @param bufr_x
   */
  constructor(bufr_x: TokBufr<T>) {
    this.reset$(bufr_x);
  }

  /**
   * @final
   * @headconst @param bufr_x
   */
  protected reset$(bufr_x: TokBufr<T>): this {
    if (this.bufr$) {
      let ln_: TokLine<T> | undefined = this.bufr$.frstLine;
      let valve = MAX_lnum;
      do {
        ln_!.delFrstTokenBy_$(this);
        ln_!.delLastTokenBy_$(this);

        ln_ = ln_!.nextLine;
      } while (ln_ && --valve);
      assert(valve);
    }

    this.bufr$ = bufr_x;

    this.strtLexTk$ = new Token(
      this,
      new TokRan(new TokLoc(bufr_x.frstLine, 0)),
      BaseTok.strtBdry as T,
    );
    this.lsTk$ = undefined;
    this.stopLexTk$ = new Token(
      this,
      new TokRan(new TokLoc(bufr_x.lastLine)),
      BaseTok.stopBdry as T,
    );
    bufr_x.frstLine.setFrstToken_$(this.strtLexTk$);
    bufr_x.lastLine.setLastToken_$(this.stopLexTk$);

    this.#errTk_sa.reset();

    this.curLoc$ = this.strtLexTk$.sntStopLoc.dup();

    // this.initialized_ = false; /** @member { Boolean } */

    return this;
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
    const VALVE = 10_000;
    let valve = VALVE;
    while (tk_ && tk_ !== stopTk_x && --valve) {
      fn_x(tk_);
      tk_ = tk_.nextToken_$;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    /*#static*/ if (INOUT) {
      assert(tk_);
    }
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
    /*#static*/ if (INOUT) {
      assert(tk_);
    }
  }

  protected sufmark$() {}

  /**
   * Set `#oldStopLoff`, `#dtLoff`, `strtLexTk$`, `stopLexTk$`.
   * @final
   * @headconst @param oldRan_x
   */
  @traceOut(_TRACE)
  @out((_, self: Lexr<T>) => {
    assert(!self.strtLexTk$.isErr);
    assert(!self.stopLexTk$.isErr);
    assert(self.strtLexTk$.posS(self.stopLexTk$));
  })
  markLexRegion_$(oldRan_x: TokRan<T>): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.markLexRegion_$(${oldRan_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(oldRan_x.bufr === this.bufr$);
      // const ranbufr = oldRan_x.bufr;
      // assert( !ranbufr || ranbufr === this.bufr$ );
    }
    // this.bufr$.strtLoc.val = oldRan_x.strtLoc.dup();
    // this.bufr$.stoplocOld.val = oldRan_x.stopLoc.dup();
    // this.strtloc_ = oldRan_x.strtLoc.dup(); /** @member { TokLoc } */
    this.#oldStopLoff = oldRan_x.stopLoff;
    this.#dtLoff = 0 as ldt_t;

    const regressed = this.strtLexTk$ === this.stopLexTk$;

    const strtLoc_1 = oldRan_x.strtLoc;
    // let valve = 1000;
    if (regressed || strtLoc_1.posS(this.strtLexTk$.sntStopLoc)) {
      /* reset `strtLexTk$` */
      let ln_ = oldRan_x.frstLine;
      let tk_ = ln_.frstTokenBy(this);
      while (
        !tk_ || strtLoc_1.posS(tk_.sntStopLoc) || tk_.value === BaseTok.stopBdry //!
      ) {
        if (ln_.isFrstLine) {
          tk_ = undefined;
          break;
        }

        // assert( ln_.prevLine );
        ln_ = ln_.prevLine!;
        tk_ = ln_.frstTokenBy(this);
      }
      // assert(valve);
      if (tk_) {
        /*#static*/ if (INOUT) {
          assert(tk_.sntStopLoc.posSE(strtLoc_1));
        }
        while (
          tk_.nextToken_$?.sntStopLoc.posSE(strtLoc_1) &&
          tk_.nextToken_$.value !== BaseTok.stopBdry
        ) {
          tk_ = tk_.nextToken_$;
        }
      }

      if (tk_) {
        this.strtLexTk$ = tk_;
      } else {
        /*#static*/ if (INOUT) {
          assert(this.strtLexTk$.value === BaseTok.strtBdry);
        }
      }
    }

    const stopLoc_0 = oldRan_x.stopLoc;
    if (regressed || stopLoc_0.posG(this.stopLexTk$.sntStrtLoc)) {
      /* reset `stopLexTk$` */
      let ln_ = oldRan_x.lastLine;
      let tk_ = ln_.lastTokenBy(this);
      while (
        !tk_ ||
        tk_.sntStrtLoc.posS(stopLoc_0) ||
        tk_.value === BaseTok.strtBdry //!
      ) {
        if (ln_.isLastLine) {
          tk_ = undefined;
          break;
        }

        // assert( ln_.nextLine );
        ln_ = ln_.nextLine!;
        tk_ = ln_.lastTokenBy(this);
      }
      // assert(valve);
      if (tk_) {
        /*#static*/ if (INOUT) {
          assert(stopLoc_0.posSE(tk_.sntStrtLoc));
        }
        while (
          tk_.prevToken_$?.sntStrtLoc.posGE(stopLoc_0) &&
          tk_.prevToken_$.value !== BaseTok.strtBdry
        ) {
          tk_ = tk_.prevToken_$;
        }
      }

      if (tk_) {
        this.stopLexTk$ = tk_;
      } else {
        /*#static*/ if (INOUT) {
          assert(this.stopLexTk$.value === BaseTok.stopBdry);
        }
      }
    }

    this.#adjustStrtToken = this.strtLexTk$.sntLastLine === oldRan_x.frstLine;
    this.#adjustStopToken = oldRan_x.lastLine === this.stopLexTk$.sntFrstLine;

    // if( this.strtLexTk$
    //  && this.strtLexTk$.value === BaseTok.stopBdry
    // ) {
    //   this.strtLexTk$ = this.strtLexTk$.prevToken_$;
    // }

    // // consider "a 1" -> "_a 1", in which case strtLexTk$ and stopLexTk$ are BaseTok.strtBdry
    // if( this.stopLexTk$
    //  && this.stopLexTk$ === this.strtLexTk$
    // ) {
    //   this.stopLexTk$ = this.stopLexTk$.nextToken_$;
    // }

    this.batchForw_$(
      (tk) => tk.reset().saveRanval_$(),
      this.strtLexTk$.nextToken_$,
      this.stopLexTk$,
    );
    this.sufmark$();
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

  /**
   * Adjust `strtLexTk$`, and tokens before at the same line.\
   * Adjust `stopLexTk$`, and tokens after at the same line.\
   * Reset `#errTk_sa`
   * @final
   * @headconst @param newRan_x
   */
  @traceOut(_TRACE)
  adjust_$(newRan_x: TokRan<T>): this {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.adjust_$(${newRan_x}) >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(newRan_x.bufr === this.bufr$);
    }
    const strtLn_tgt = newRan_x.frstLine;
    const stopLn_tgt = newRan_x.lastLine;
    if (this.#adjustStrtToken) {
      const strtLn_src = this.strtLexTk$.sntLastLine;
      if (strtLn_src !== strtLn_tgt) {
        let tk_: Token<T> | undefined = this.strtLexTk$;
        do {
          tk_.sntStopLoc.line_$ = strtLn_tgt;
          if (tk_.sntFrstLine === strtLn_src) {
            tk_.sntStrtLoc.line_$ = strtLn_tgt;
          }
          tk_.syncRanval(); // Recalc the new one

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

    if (this.#adjustStopToken) {
      const stopLn_src = this.stopLexTk$.sntFrstLine;
      this.#dtLoff = (newRan_x.stopLoff - this.#oldStopLoff) as ldt_t;
      if (stopLn_src !== stopLn_tgt || this.#dtLoff !== 0) {
        let tk_: Token<T> | undefined = this.stopLexTk$;
        do {
          tk_.sntStrtLoc.set(stopLn_tgt, tk_.sntStrtLoff + this.#dtLoff);
          if (tk_.sntLastLine === stopLn_src) {
            tk_.sntStopLoc.set(stopLn_tgt, tk_.sntStopLoff + this.#dtLoff);
          }
          tk_.syncRanval(); // Recalc the new one

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

    if (this.hasErr) {
      /*#static*/ if (INOUT) {
        assert(
          this.strtLexTk$.posS(this.#errTk_sa[0]) &&
            this.stopLexTk$.posG(this.#errTk_sa.at(-1)!),
        );
      }
      this.#errTk_sa.reset();
    }
    return this;
  }

  // get stoplocNew$_() { return this.stoplocNew_; }

  /**
   * Assign `curLoc$`
   */
  protected prelex$() {
    this.curLoc$.become(this.strtLexTk$.sntStopLoc);
  }

  protected suflex$(_valve_x: uint) {}

  /**
   * Lex [ strtLexTk$.stopLoc, stopLexTk$.strtLoc )
   * @final
   */
  @traceOut(_TRACE)
  lex(valve_x = 10) {
    assert(valve_x--, "Cycle call!");
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.lex() >>>>>>>`);
    }
    if (this.strtLexTk$ === this.stopLexTk$) {
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
  }

  protected getScanningToken$(): undefined | Token<T> | (() => Token<T>) {
    return this.lsTk$?.nextToken_$;
  }

  /**
   * Lex [ strtLexTk$.stopLoc, stopLexTk$.strtLoc )\
  //  * `in( this.#valve > 0 )`
   * @final
   */
  protected lex_impl$(): this {
    // assert(this.#valve--, `Loop ${Lexr.#VALVE} times`);
    this.#scandTk_a.length = 0;
    this.lsTk$ = this.strtLexTk$;
    const VALVE = 10_000;
    let valve = VALVE;
    do {
      const tk_ = this._scan(this.getScanningToken$());
      if (!tk_ || tk_.value === BaseTok.unknown) { // 2269
        assert(valve--, `Loop ${VALVE}±1 times`);
        continue;
      }
      /* Could set `lsTk$` to `undefined` in `scan_impl$()` to prevent
      `.lineNext()` here. */
      this.lsTk$?.linkNext(tk_, this.stopLexTk$);

      if (tk_.isErr) this.#errTk_sa.add(tk_);
      if (!this.hasErr) this.strtLexTk$ = tk_;
      if (tk_ === this.stopLexTk$) break;

      tk_.syncRanval(); //!
      this.#scandTk_a.push(tk_);
      this.lsTk$ = tk_;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    return this;
  }

  /** @final */
  protected reachRigtBdry$(): LocCompared {
    return this.curLoc$.locGE(this.stopLexTk$.sntStrtLoc);
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
   */
  @out((ret, self: Lexr<T>) => {
    if (ret && ret !== self.stopLexTk$) {
      assert(ret.posS(self.stopLexTk$));
      assert(ret.sntStopLoc.posSE(self.curLoc$));
    }
  })
  private _scan(
    retTk_x: undefined | Token<T> | (() => Token<T>),
  ): Token<T> | undefined {
    this.curLoc$.correctLoff(); // Could `overEol`
    /*#static*/ if (INOUT) {
      // assert( this.strtLexTk$ && this.stopLexTk$ );
      assert(
        this.strtLexTk$.sntStopLoc.posSE(this.curLoc$) &&
          this.curLoc$.posSE(this.stopLexTk$.sntStrtLoc),
      );
    }
    if (this.reachRigtBdry$() === LocCompared.yes) {
      return this.stopLexTk$;
    }

    if (!retTk_x || retTk_x === this.stopLexTk$) {
      retTk_x = new Token(this, new TokRan(this.curLoc$.dup()));
    } else if (retTk_x instanceof Token) {
      retTk_x //jjjj TOCLEANUP.reset()
        .setStrt(this.curLoc$);
    }
    return this.scan_impl$(retTk_x);
  }

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
   * Scan one token ab to stopLexTk$ (excluded)\
   * `in( this.reachRigtBdry$() !== LocCompared.yes )` \
  //  * `in( retTk_x.strtLoc.posSE(this.curLoc$) )`\
  //  * `in( retTk_x.value === BaseTok.unknown )`
   */
  protected abstract scan_impl$(
    retTk_x: Token<T> | (() => Token<T>),
  ): Token<T> | undefined;

  /**
   * @const @param tk_0
   * @const @param tk_1
   */
  protected canConcat$(_tk_0: Token<T>, _tk_1: Token<T>): boolean {
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
      if (this.canConcat$(tk_0, tk_1)) { // 1894
        tk_0.setStop(tk_1.sntStopLoc);
        tk_0.linkNext(tk_1.nextToken_$!, this.stopLexTk$);
        tk_a.splice(0, 1);
      }
      tk_0 = tk_a.at(-1);
      tk_1 = this.stopLexTk$;
      if (tk_0 && this.canConcat$(tk_0, tk_1)) { // 1895
        tk_1.setStrt(tk_0.sntStrtLoc)
          .linkPrev(tk_0.prevToken_$!, this.strtLexTk_0$);
        tk_a.pop();
      }
    }
    if (!tk_a.length) {
      tk_0 = this.strtLexTk_0$;
      tk_1 = this.stopLexTk$;
      if (this.canConcat$(tk_0, this.stopLexTk$)) {
        tk_1.setStrt(tk_0.sntStrtLoc)
          .linkPrev(tk_0.prevToken_$!);
        this.strtLexTk_0$ = tk_1; //!
      }
    }
  }

  #scanBypassSn(sn_x: Stnode<T>): void {
    let tk_: Token<T> | undefined = sn_x.frstToken;
    const lastTk = sn_x.lastToken;
    const VALVE = 1_000;
    let valve = VALVE;
    while (tk_ && tk_ !== lastTk && --valve) {
      tk_.syncRanval(); //!
      this.#scandTk_a.push(tk_);
      tk_ = tk_.nextToken_$;
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
    this.lsTk$ = undefined; //! to prevent `.lineNext()` in `lex_impl$()`
    const lastSnt = snt_a_x.at(-1)!;
    return lastSnt instanceof Token ? lastSnt : lastSnt.lastToken;
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

  get _tkId_a(): id_t[] {
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

  //jjjj TOCLEANUP
  // /** @const */
  // become(li_x: LexdInfo) {}

  toString(): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
