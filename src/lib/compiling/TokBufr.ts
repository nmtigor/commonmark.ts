/** 80**************************************************************************
 * @module lib/compiling/TokBufr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t } from "../alias.ts";
import { BufrDir } from "../alias.ts";
import type { BaseTok } from "./BaseTok.ts";
import { Bufr } from "./Bufr.ts";
import type { Ranval } from "./Ranval.ts";
import type { TokLine } from "./TokLine.ts";
import { TokLoc } from "./TokLoc.ts";
import type { TokRan } from "./TokRan.ts";
import type { Tok } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TokBufr<T extends Tok = BaseTok> extends Bufr {
  readonly tabsize: 2 | 4 | 8;

  override get frstLine() {
    return this.frstLine_$ as TokLine<T>;
  }
  override get lastLine() {
    return this.lastLine_$ as TokLine<T>;
  }

  override get oldRan_a() {
    return this.oldRan_a_$ as TokRan<T>[];
  }
  override get newRan_a() {
    return this.newRan_a_$ as TokRan<T>[];
  }

  /**
   * @const @param text_x
   * @const @param dir_x
   * @headconst @param fh_x
   * @const @param tabsize_x
   */
  constructor(
    text_x?: string,
    dir_x = BufrDir.ltr,
    fh_x?: FileSystemFileHandle,
    tabsize_x: 2 | 4 | 8 = 4,
  ) {
    super(text_x, dir_x, fh_x);
    this.tabsize = tabsize_x;

    //jjjj TOCLEANUP
    // this.dir_mo.registHandler((n_y) => {
    //   // const rv_a = this.edtr_sa.map((edtr_y) =>
    //   //   (edtr_y as EdtrScrolr).proactiveCaret.ranval
    //   // );
    //   // console.log(rv_a);
    //   this.refresh();
    //   /* Notice, `invalidate_bcr()` should be called firstly for all `edtr_sa`,
    //   because setting `mc_.caretrvm![1]` in one `eds` will impact other `eds`s
    //   immediately. */
    //   this.edtr_sa.forEach((eds) => (eds as EdtrScrolr).invalidate_bcr());
    //   for (let i = this.edtr_sa.length; i--;) {
    //     const eds = this.edtr_sa.at(i) as EdtrScrolr;
    //     const mc_ = eds.proactiveCaret;
    //     if (mc_.shown) {
    //       // mc_.caretrvm![1].force().val = rv_a[i];
    //       mc_.caretrvm![1].force().val = mc_.ranval;
    //     }
    //   }
    // }, { i: LastCb_i });
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // get strtLoc() { return this.strtloc_; }
  // get stoplocOld() { return this.stoplocOld_; }
  // get stoplocNew() { return this.stoplocNew_; }

  // /**
  //  * @param { Lexr } lexr_x
  //  */
  // set lexer( lexr_x )
  // {
  //   /* in */ {
  //     assert( !this.lexer_ );
  //     assert( lexr_x );
  //   }
  //   const out = () => {
  //     assert( this.lexer_ && this.lexer_.initialized );
  //   }

  //   this.lexer_ = lexr_x; /** @member */
  //   this.lexer_.initialize$_( this );

  //   out();
  // }

  // /**
  //  * @param { Pazr } pazr_x
  //  */
  // set pazer( pazr_x )
  // {
  //   /* in */ {
  //     assert( !this.pazer_ );
  //     assert( pazr_x );
  //   }
  //   const out = () => {
  //     assert( this.pazer_ && this.pazer_.initialized );
  //   }

  //   this.pazer_ = pazr_x; /** @member */
  //   this.pazer_.initialize$_( this );

  //   out();
  // }

  override line(lidx_x: lnum_t) {
    return super.line(lidx_x) as TokLine<T>;
  }

  #focusLoc: TokLoc<T> | undefined;
  /**
   * @out @param rv_x `focusLidx`, `focusLoff` will be corrected
   * @return `#focusLoc`,
   *    so suggest to `.usingDup()` it to prevent being affected by further
   *    calls of `getFocusLoc()`.
   */
  getFocusLoc(rv_x: Ranval): TokLoc<T> {
    if (this.#focusLoc) {
      this.#focusLoc.set_Loc_O(rv_x.focusLidx, rv_x.focusLoff, this);
    } else {
      this.#focusLoc = TokLoc.create(this, rv_x.focusLidx, rv_x.focusLoff);
    }
    rv_x.focusLidx = this.#focusLoc.line.lidx_1;
    rv_x.focusLoff = this.#focusLoc.correctLoff();
    return this.#focusLoc;
  }
  #anchrLoc: TokLoc<T> | undefined;
  /**
   * @out @param rv_x `anchrLidx`, `anchrLoff` will be corrected
   * @return `#anchrLoc`,
   *    so suggest to `.usingDup()` it to prevent being affected by further
   *    calls of `getAnchrLoc()`.
   */
  getAnchrLoc(rv_x: Ranval): TokLoc<T> {
    if (this.#anchrLoc) {
      this.#anchrLoc.set_Loc_O(rv_x.anchrLidx, rv_x.anchrLoff, this);
    } else {
      this.#anchrLoc = TokLoc.create(this, rv_x.anchrLidx, rv_x.anchrLoff);
    }
    rv_x.anchrLidx = this.#anchrLoc.line.lidx_1;
    rv_x.anchrLoff = this.#anchrLoc.correctLoff();
    return this.#anchrLoc;
  }

  //jjjj TOCLEANUP
  // /**
  //  * @deprecated
  //  * @const @param text_a
  //  */
  // _cntE(text_a: string[]) {
  //   const n = text_a.length;

  //   let line: TokLine<T> | undefined = this.frstLine;
  //   let i = 0;

  //   const VALVE = 1_000;
  //   let valve = VALVE;
  //   do {
  //     if (i >= n || line.text !== text_a[i]) return false;

  //     line = line.nextLine;
  //     i++;
  //   } while (line && --valve);
  //   assert(valve, `Loop ${VALVE}±1 times`);

  //   return i === n;
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // /**
  //  * Set strtloc_, stoplocOld_ of this.lexer_
  //  * @param { TokRan } ran @const
  //  */
  // prelex$_( ran )
  // {
  //   this.lexer_.markLexRegion( ran );

  //   this.strtLoc.copy( this.lexer_.strtLoc$_.dup() );
  //   this.stoplocOld.copy( this.lexer_.stoplocOld$_.dup() );
  // }

  // /**
  //  * Set stoplocNew_ of this.lexer_
  //  * @param { TokLoc } loc @const
  //  */
  // suflex$_( loc )
  // {
  //   this.lexer_.strtLoff( loc );

  //   this.stoplocNew.copy( this.lexer_.stoplocNew$_.dup() );
  // }

  // compile$_()
  // {
  //   this.lexer_.lex();
  // }
}
/*80--------------------------------------------------------------------------*/

// /**
//  * `in( bufr_x.newRan_$ )`
//  * @headconst @param bufr_x
//  * @headconst @param lexr_x
//  */
// const bakeRanval_ = <T extends Tok>(bufr_x: TokBufr<T>, lexr_x: Lexr<T>) => {
//   // console.log(`${global.dent}newRan: ${bufr_x.newRan_$?.toString()}`);
//   const loc_0 = bufr_x.newRan_$!.strtLoc;
//   const ln_0 = loc_0.line;
//   let ln_ = ln_0;
//   let tk_0 = ln_.frstTokenBy(lexr_x);
//   const VALVE = MAX_lnum * 10;
//   let valve = VALVE;
//   while (!tk_0 && ln_.nextLine && --valve) {
//     ln_ = ln_.nextLine;
//     tk_0 = ln_.frstTokenBy(lexr_x);
//   }
//   assert(valve, `Loop ${VALVE}±1 times`);
//   if (!tk_0) return; // Nothing to do.

//   if (tk_0.strtLoc.posG(loc_0)) {
//     do {
//       tk_0 = tk_0.prevToken_$!;
//     } while (tk_0.strtLoc.posG(loc_0) && --valve);
//     assert(valve, `Loop ${VALVE}±1 times`);
//   } else {
//     while (
//       (tk_0.stopLoc.posS(loc_0) ||
//         tk_0.strtLoc.posS(tk_0.stopLoc) && tk_0.stopLoc.posSE(loc_0)) &&
//       tk_0.nextToken_$ && --valve
//     ) {
//       tk_0 = tk_0.nextToken_$;
//     }
//     assert(valve, `Loop ${VALVE}±1 times`);
//   }

//   const loc_1 = bufr_x.newRan_$!.stopLoc;
//   const ln_1 = loc_1.line;
//   ln_ = ln_1;
//   let tk_1 = ln_.lastTokenBy(lexr_x);
//   while (!tk_1 && ln_.prevLine && --valve) {
//     ln_ = ln_.prevLine;
//     tk_1 = ln_.lastTokenBy(lexr_x);
//   }
//   assert(valve, `Loop ${VALVE}±1 times`);
//   if (!tk_1) return; // Nothing to do.

//   if (tk_1.stopLoc.posS(loc_1)) {
//     do {
//       tk_1 = tk_1.nextToken_$!;
//     } while (tk_1.stopLoc.posS(loc_1) && --valve);
//     assert(valve, `Loop ${VALVE}±1 times`);
//   } else {
//     while (
//       tk_1.strtLoc.posGE(loc_1) &&
//       tk_1.prevToken_$ && --valve
//     ) {
//       tk_1 = tk_1.prevToken_$;
//     }
//     assert(valve, `Loop ${VALVE}±1 times`);
//   }

//   /* Could be `tk_0.posG(tk_1)` in case delete and no add. */
//   if (tk_0.posSE(tk_1)) {
//     let tk_ = tk_0;
//     do {
//       tk_.bakeRanval_$();
//       if (tk_ === tk_1) break;
//       tk_ = tk_.nextToken_$!;
//     } while (--valve);
//     assert(valve, `Loop ${VALVE}±1 times`);
//   }
// };
/*80--------------------------------------------------------------------------*/
