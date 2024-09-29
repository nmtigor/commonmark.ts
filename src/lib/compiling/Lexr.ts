/** 80**************************************************************************
 * @module lib/compiling/Lexr
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, global, INOUT } from "../../global.ts";
import type { id_t, ldt_t, loff_t } from "../alias.ts";
import { MAX_lnum } from "../alias.ts";
import "../jslang.ts";
import { SortedArray } from "../util/SortedArray.ts";
import { assert, out, traceOut } from "../util/trace.ts";
import type { Tok } from "./alias.ts";
import { BaseTok } from "./BaseTok.ts";
import { LocCompared } from "./Loc.ts";
import { TokRan } from "./Ran.ts";
import type { TokBufr } from "./TokBufr.ts";
import { Token } from "./Token.ts";
import type { TokLine } from "./TokLine.ts";
import { TokLoc } from "./TokLoc.ts";
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
  get frstToken() {
    return this.bufr$.frstLine.frstTokenBy(this)!;
  }
  /**
   * `out( ret; ret.value === BaseTok.stopBdry )`
   * @final
   */
  get lastToken() {
    return this.bufr$.lastLine.lastTokenBy(this)!;
  }
  /* ~ */

  protected strtToken$!: Token<T>;
  get _strtToken() {
    return this.strtToken$;
  }
  protected stopToken$!: Token<T>;
  get stopToken() {
    return this.stopToken$;
  }
  protected strtToken_save$!: Token<T>;
  get strtToken_save() {
    return this.strtToken_save$;
  }

  #oldStopLoff: loff_t = 0;
  #dtLoff = 0 as ldt_t;
  get dtLoff(): ldt_t {
    return this.#dtLoff;
  }

  #adjustStrtToken = false;
  #adjustStopToken = false;

  #errTk_sa = new SortedArray<Token<T>>((a, b) => a.id < b.id);
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

  // static readonly #VALVE = 100;
  // #valve = Lexr.#VALVE;

  /**
   * @headconst @param bufr_x
   */
  constructor(bufr_x: TokBufr<T>) {
    this.reset(bufr_x);
  }

  /**
   * @final
   * @headconst @param bufr_x
   */
  reset(bufr_x: TokBufr<T>) {
    if (this.bufr$) {
      let ln_: TokLine<T> | undefined = this.bufr$.frstLine;
      let valve = MAX_lnum;
      do {
        ln_!.delFrstToken_$(this);
        ln_!.delLastToken_$(this);

        ln_ = ln_!.nextLine;
      } while (ln_ && --valve);
      assert(valve);
    }

    this.bufr$ = bufr_x;

    this.strtToken$ = new Token(
      this,
      new TokRan(new TokLoc(bufr_x.frstLine, 0)),
      BaseTok.strtBdry as T,
    );
    this.stopToken$ = new Token(
      this,
      new TokRan(new TokLoc(bufr_x.lastLine)),
      BaseTok.stopBdry as T,
    );

    this.#errTk_sa.reset();

    this.curLoc$ = this.strtToken$.stopLoc.dup();

    // this.initialized_ = false; /** @member { Boolean } */
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
  //     assert( this.strtToken$ && this.stopToken$ );
  //     assert( this.initialized_ );
  //   }

  //   this.bufr$ = bufr; /** @member { TokBufr<T> } */
  //   // this.curLoc$ = new TokLoc( bufr.frstLine ); /** @member */
  //   // this.strtloc_ = this.curLoc$.dup();
  //   // this.stoploc_ = this.curLoc$.dup();

  //   /** @member { Token } */
  //   this.strtToken$ = new Token( new TokLoc(bufr.frstLine), BaseTok.strtBdry );
  //   /** @member { Token } */
  //   this.stopToken$ = new Token( new TokLoc(bufr.lastLine,bufr.lastLine.uchrLen), BaseTok.stopBdry );

  //   this.initialized_ = true;

  //   out();
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected sufmark$() {
    let tk_: Token<T> | undefined = this.strtToken$;
    const tk_1 = this.stopToken$;
    const VALVE = 10_000;
    let valve = VALVE;
    do {
      tk_.saveRanval_$();
      if (tk_ === tk_1) break;
      tk_ = tk_.nextToken_$;
    } while (tk_ && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);
  }

  /**
   * Set `#oldStopLoff`, `#dtLoff`, `strtToken$`, `stopToken$`.
   * @final
   * @headconst @param oldRan_x
   */
  @traceOut(_TRACE)
  markLexRegion_$(oldRan_x: TokRan<T>) {
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

    const regressed = this.strtToken$ === this.stopToken$;

    const strtLoc_1 = oldRan_x.strtLoc;
    // let valve = 1000;
    if (regressed || strtLoc_1.posS(this.strtToken$.stopLoc)) {
      // reset `strtToken$`
      let ln = oldRan_x.frstLine;
      let tk = ln.frstTokenBy(this);
      while (
        !tk || strtLoc_1.posS(tk.stopLoc) || tk.value === BaseTok.stopBdry //!
      ) {
        if (ln.isFrstLine) {
          tk = undefined;
          break;
        }

        // assert( ln.prevLine );
        ln = ln.prevLine!;
        tk = ln.frstTokenBy(this);
      }
      // assert(valve);
      if (tk) {
        /*#static*/ if (INOUT) {
          assert(tk.stopLoc.posSE(strtLoc_1));
        }
        while (
          tk.nextToken_$?.stopLoc.posSE(strtLoc_1) &&
          tk.nextToken_$.value !== BaseTok.stopBdry
        ) {
          tk = tk.nextToken_$;
        }
      }

      if (tk) {
        this.strtToken$ = tk;
      } else {
        /*#static*/ if (INOUT) {
          assert(this.strtToken$.value === BaseTok.strtBdry);
        }
      }
    }

    const stopLoc_0 = oldRan_x.stopLoc;
    if (regressed || stopLoc_0.posG(this.stopToken$.strtLoc)) {
      // reset `stopToken$`
      let ln = oldRan_x.lastLine;
      let tk = ln.lastTokenBy(this);
      while (
        !tk ||
        tk.strtLoc.posS(stopLoc_0) ||
        tk.value === BaseTok.strtBdry //!
      ) {
        if (ln.isLastLine) {
          tk = undefined;
          break;
        }

        // assert( ln.nextLine );
        ln = ln.nextLine!;
        tk = ln.lastTokenBy(this);
      }
      // assert(valve);
      if (tk) {
        /*#static*/ if (INOUT) {
          assert(stopLoc_0.posSE(tk.strtLoc));
        }
        while (
          tk.prevToken_$?.strtLoc.posGE(stopLoc_0) &&
          tk.prevToken_$.value !== BaseTok.strtBdry
        ) {
          tk = tk.prevToken_$;
        }
      }

      if (tk) {
        this.stopToken$ = tk;
      } else {
        /*#static*/ if (INOUT) {
          assert(this.stopToken$.value === BaseTok.stopBdry);
        }
      }
    }

    this.#adjustStrtToken = oldRan_x.frstLine === this.strtToken$.lastLine;
    this.#adjustStopToken = oldRan_x.lastLine === this.stopToken$.frstLine;

    // if( this.strtToken$
    //  && this.strtToken$.value === BaseTok.stopBdry
    // ) {
    //   this.strtToken$ = this.strtToken$.prevToken_$;
    // }

    // // consider "a 1" -> "_a 1", in which case strtToken$ and stopToken$ are BaseTok.strtBdry
    // if( this.stopToken$
    //  && this.stopToken$ === this.strtToken$
    // ) {
    //   this.stopToken$ = this.stopToken$.nextToken_$;
    // }

    this.sufmark$();
    /*#static*/ if (INOUT) {
      assert(!this.strtToken$.hasErr);
      assert(!this.stopToken$.hasErr);
      assert(this.strtToken$.posS(this.stopToken$));
    }
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
   * Reset strtToken$, and tokens before at the same line.\
   * Adjust stopToken$, and tokens after at the same line.\
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
    if (this.#adjustStrtToken) {
      const strtLn_src = this.strtToken$.lastLine;
      const strtLn_tgt = newRan_x.frstLine;
      if (strtLn_src !== strtLn_tgt) {
        let tk_: Token<T> | undefined = this.strtToken$;
        do {
          tk_.stopLoc.line_$ = strtLn_tgt;
          if (tk_.frstLine === strtLn_src) {
            tk_.strtLoc.line_$ = strtLn_tgt;
          }
          tk_.bakeRanval_$(); // Recalc the new one

          if (tk_ === strtLn_src.frstTokenBy(this)) {
            strtLn_tgt.frstByToken_$(tk_);
            strtLn_src.delFrstToken_$(this);
          }
          if (tk_ === strtLn_src.lastTokenBy(this)) {
            strtLn_tgt.lastByToken_$(tk_);
            strtLn_src.delLastToken_$(this);
          }

          tk_ = tk_.prevToken_$;
        } while (tk_?.lastLine === strtLn_src);
      }
    }

    if (this.#adjustStopToken) {
      const stopLn_src = this.stopToken$.frstLine;
      const stopLn_tgt = newRan_x.lastLine;
      this.#dtLoff = (newRan_x.stopLoff - this.#oldStopLoff) as ldt_t;
      if (stopLn_src !== stopLn_tgt || this.#dtLoff !== 0) {
        let tk_: Token<T> | undefined = this.stopToken$;
        do {
          tk_.strtLoc.reset(stopLn_tgt, tk_.strtLoff + this.#dtLoff);
          if (tk_.lastLine === stopLn_src) {
            tk_.stopLoc.reset(stopLn_tgt, tk_.stopLoff + this.#dtLoff);
          }
          tk_.bakeRanval_$(); // Recalc the new one

          if (tk_ === stopLn_src.frstTokenBy(this)) {
            stopLn_tgt.frstByToken_$(tk_);
            stopLn_src.delFrstToken_$(this);
          }
          if (tk_ === stopLn_src.lastTokenBy(this)) {
            stopLn_tgt.lastByToken_$(tk_);
            stopLn_src.delLastToken_$(this);
          }

          tk_ = tk_.nextToken_$;
        } while (tk_?.frstLine === stopLn_src);
      }
    }

    if (this.hasErr) {
      /*#static*/ if (INOUT) {
        assert(
          this.strtToken$.posS(this.#errTk_sa[0]) &&
            this.stopToken$.posG(this.#errTk_sa.at(-1)!),
        );
      }
      this.#errTk_sa.reset();
    }
    return this;
  }

  // get stoplocNew$_() { return this.stoplocNew_; }

  protected prelex$() {}

  protected suflex$() {
    let tk_: Token<T> | undefined = this.strtToken_save$;
    const tk_1 = this.stopToken$;
    // console.log(tk_.toString());
    // console.log(tk_1.toString());
    const VALVE = 10_000;
    let valve = VALVE;
    do {
      tk_.bakeRanval_$();
      if (tk_ === tk_1) break;
      tk_ = tk_.nextToken_$;
    } while (tk_ && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);
  }

  /**
   * Lex [ strtToken$.stopLoc, stopToken$.strtLoc )
   * @final
   */
  @traceOut(_TRACE)
  lex() {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.lex() >>>>>>>`);
    }
    if (this.strtToken$ === this.stopToken$) {
      /* This is the case of one `Bufr` with two or more `EdtrScrolr`. */
      return;
    }

    /*#static*/ if (INOUT) {
      /* Error tokens, if any, are included in the lex region. */
      assert(!this.hasErr);
      assert(this.strtToken$.posS(this.stopToken$));
    }
    this.prelex$();

    this.strtToken_save$ = this.strtToken$;
    // this.#valve = Lexr.#VALVE;
    const tk_a = this.lex_impl$();
    this.concatTokens$(tk_a);

    // console.log(this.bufr$.frstLine.frstTokenBy(this));
    // console.log(this.bufr$.lastLine.lastTokenBy(this));

    this.suflex$();
  }

  /**
   * Lex [ strtToken$.stopLoc, stopToken$.strtLoc )\
  //  * `in( this.#valve > 0 )`
   * @final
   */
  protected lex_impl$(): Token<T>[] {
    // assert(this.#valve--, `Loop ${Lexr.#VALVE} times`);
    const ret: Token<T>[] = [];

    this.curLoc$.become(this.strtToken$.stopLoc);

    let tk_0 = this.strtToken$;
    const VALVE = 10_000;
    let valve = VALVE;
    do {
      let tk = tk_0.nextToken_$;
      tk = this._scan(tk);
      if (tk.value === BaseTok.unknown) { // 2269
        assert(valve--, `Loop ${VALVE}±1 times`);
        continue;
      }
      tk_0.linkNext(tk, this.stopToken$);

      if (tk.hasErr) this.#errTk_sa.add(tk);
      if (!this.hasErr) this.strtToken$ = tk;
      if (tk === this.stopToken$) break;

      ret.push(tk);
      tk_0 = tk;
    } while (--valve);
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret;
  }

  /** @final */
  protected reachRigtBdry$(): LocCompared {
    return this.curLoc$.locGE(this.stopToken$.strtLoc);
  }
  /** @final */
  protected atRigtBdry$(): LocCompared {
    return this.curLoc$.locE(this.stopToken$.strtLoc);
  }
  /** @final */
  protected overRigtBdry$(): LocCompared {
    return this.curLoc$.locG(this.stopToken$.strtLoc);
  }

  /**
   * Scan one token ab to stopToken$ (excluded).
   * @param retTk_x Token<T> to fill if any
   */
  @out((ret, self: Lexr<T>) => {
    if (ret !== self.stopToken$) {
      assert(ret.posS(self.stopToken$));
      assert(ret.stopLoc.posSE(self.curLoc$));
    }
  })
  private _scan(retTk_x?: Token<T>): Token<T> {
    this.curLoc$.correctLoff(); // Could `overEol`
    /*#static*/ if (INOUT) {
      // assert( this.strtToken$ && this.stopToken$ );
      assert(
        this.strtToken$.stopLoc.posSE(this.curLoc$) &&
          this.curLoc$.posSE(this.stopToken$.strtLoc),
      );
    }
    if (this.reachRigtBdry$() === LocCompared.yes) {
      retTk_x = this.stopToken$;
      return retTk_x;
    }

    if (!retTk_x || retTk_x === this.stopToken$) {
      retTk_x = new Token(this, new TokRan(this.curLoc$.dup()));
    } else {
      retTk_x.clrErr();
      retTk_x.value = BaseTok.unknown as T;
      retTk_x.strtLoc.become(this.curLoc$);
    }
    this.scan_impl$(retTk_x);
    return retTk_x;
  }

  /**
   * `curLoc$` must be at the end of the scaned `tok_x` (excluded)
   * @final
   * @const @param tok_x
   * @out @param out_x
   */
  protected setTok$(tok_x: T, out_x: Token<T>): void {
    out_x.value = tok_x;
    out_x.stopLoc.become(this.curLoc$);
  }

  /**
   * Scan one token ab to stopToken$ (excluded)\
   * `in( this.reachRigtBdry$() !== LocCompared.yes )` \
   * `in( out_x.strtLoc.posSE(this.curLoc$) )`\
   * `in( out_x.value === BaseTok.unknown )`
   * @out @param out_x Token<T> to fill
   */
  protected abstract scan_impl$(out_x: Token<T>): void;

  /**
   * @const @param tk_0
   * @const @param tk_1
   */
  protected canConcat$(tk_0: Token<T>, tk_1: Token<T>): boolean {
    return false;
  }

  /**
   * Try to concat `tk_a_x[0]` with `strtToken_save$` and `tk_a_x.at(-1)` with
   * `stopToken$`.\
   * `strtToken_save$` could be adjusted to keep valid, which will be used in
   * `Pazr.paz()`.
   *
   * Priority to keep unchanged: `stopToken$` > `strtToken_save$` > `tk_a_x`
   *
   * @final
   * @headconst @param tk_a_x
   */
  protected concatTokens$(tk_a_x: Token<T>[]) {
    /*#static*/ if (INOUT) {
      if (tk_a_x.length) {
        assert(
          tk_a_x[0].prevToken_$ === this.strtToken_save$ &&
            tk_a_x.at(-1)!.nextToken_$ === this.stopToken$,
        );
      } else {
        assert(this.strtToken_save$.isConcatedTo(this.stopToken$));
      }
    }
    let tk_0, tk_1: Token<T> | undefined;
    if (tk_a_x.length) {
      tk_0 = this.strtToken_save$;
      tk_1 = tk_a_x[0];
      if (this.canConcat$(tk_0, tk_1)) { // 1894
        tk_0.stopLoc.become(tk_1.stopLoc);
        tk_0.linkNext(tk_1.nextToken_$!, this.stopToken$);
        tk_a_x.splice(0, 1);
      }
      tk_0 = tk_a_x.at(-1);
      tk_1 = this.stopToken$;
      if (tk_0 && this.canConcat$(tk_0, tk_1)) { // 1895
        tk_1.strtLoc.become(tk_0.strtLoc);
        tk_1.linkPrev(tk_0.prevToken_$!, this.strtToken_save$);
        tk_a_x.pop();
      }
    }
    if (!tk_a_x.length) {
      tk_0 = this.strtToken_save$;
      tk_1 = this.stopToken$;
      if (this.canConcat$(tk_0, this.stopToken$)) {
        tk_1.strtLoc.become(tk_0.strtLoc);
        tk_1.linkPrev(tk_0.prevToken_$!);
        this.strtToken_save$ = tk_1; //!
      }
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  toString() {
    let tk = this.frstToken;
    const ret_a: string[] = [tk.toString()];
    let curlidx = tk.frstLine.lidx_1;
    const lasttk = this.lastToken;
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      tk = tk.nextToken_$!;
      const lidx = tk.frstLine.lidx_1;
      if (lidx === curlidx) {
        ret_a.push(" ");
      } else {
        ret_a.push("\n");
        curlidx = lidx;
      }
      ret_a.push(tk.toString());
      if (tk.posE(lasttk)) break;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret_a.join("");
  }
}
/*80--------------------------------------------------------------------------*/

export abstract class LexdInfo {
  static #ID = 0 as id_t;
  readonly id = ++LexdInfo.#ID as id_t;

  //kkkk TOCLEANUP
  // /** @const */
  // become(li_x: LexdInfo) {}

  toString(): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
