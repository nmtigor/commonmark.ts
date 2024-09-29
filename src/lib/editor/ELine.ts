/** 80**************************************************************************
 * @module lib/editor/ELine
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Tok } from "../compiling/alias.ts";
import type { BaseTok } from "../compiling/BaseTok.ts";
import type { TokLine } from "../compiling/TokLine.ts";
import "../jslang.ts";
import type { Edtr, EdtrCI } from "./Edtr.ts";
import { ELineBase } from "./ELineBase.ts";
/*80--------------------------------------------------------------------------*/

// declare global
// {
//   interface Node
//   {
//     [$indent_blockline]?:BlockLine;
//   }
// }

/**
 * A non-generic base s.t. many related uses (e.g. Caret) can be non-generic.
 */
export abstract class ELine<T extends Tok = BaseTok, CI extends EdtrCI = EdtrCI>
  extends ELineBase<CI> {
  // override bline_$!: TokLine<T>;
  declare bline_$: TokLine<T>;

  // /**
  //  * For `EdtrScrolr.replace_impl$()`, `bline_$.lidx_1` needs to be baked, because it
  //  * could change.
  //  */
  // initBLidx_$: lnum_t;

  // #align = EdtrDir.ltr;
  // get align() {
  //   return this.#align;
  // }
  // dir_$(align_x: EdtrDir) {
  //   /* final switch */ ({
  //     [EdtrDir.ltr]: () => {
  //       this.assignStylo({
  //         justifyContent: "flex-start",

  //         textAlign: "start",
  //       });
  //     },
  //     [EdtrDir.rtl]: () => {
  //       this.assignStylo({
  //         justifyContent: "flex-end",

  //         textAlign: "end",
  //       });
  //     },
  //   }[align_x])();
  //   this.#align = align_x;
  // }

  /**
   * @headconst @param coo_x
   * @headconst @param bln_x
   */
  constructor(coo_x: Edtr<T, CI>, bln_x: TokLine<T>) {
    super(coo_x, bln_x);
    // this.initBLidx_$ = bln_x.lidx_1;

    this.assignStylo({
      // display: "flex",
      // alignItems: "baseline",
    });
    // this.dir_$(coo_x.dir_$);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // /**
  //  * @headconst @param { TokLine } bln_x
  //  */
  // reset$( bln_x )
  // {
  //   /* in */ {
  //     assert( bln_x );
  //   }
  //   const out = () => {
  //     assert( this.bline_$ );
  //   }

  //   this.#id = bln_x.id; /** @member { id_t } */

  //   this.bline_$ = bln_x; /** @member { TokLine } */

  //   out();
  // }

  // _init_after_attached()
  // {
  //   // /* in */ {
  //   //   assert( this.el$.attached() );
  //   // }
  // }

  // /**
  //  * @const
  //  * @const @param eloc
  //  */
  // atSol?(eloc: ELoc): boolean;
  // atEol?(eloc: ELoc): boolean;

  // get prevLine() { return this.prevline_; }
  // get nextLine() { return this.nextline_; }
  // set prevLine$_( line ) { this.prevline_ = line; }
  // set nextLine$_( line ) { this.nextline_ = line; }

  // get bline_$() { assert(0); }

  // /**
  //  * @param { TokLine } bln_x
  //  */
  // syncBfline( bln_x ) { assert(0); }

  // /**
  //  * @const
  //  */
  // get text() { return this.empty$ ? "" : this.nd.textContent; }

  // /**
  //  * @final
  //  * @const
  //  * @return { loff_t }
  //  */
  // get uchrLen() { return this.empty$ ? 0 : this.nd.textContent.length; }

  // /**
  //  * @final
  //  * @const @param { loff_t } strt
  //  * @const @param { loff_t } stop
  //  * @const @param { String } [newt]
  //  */
  // splice( strt, stop, newt )
  // {
  //   /* in */ {
  //     assert( 0 <= strt && strt <= this.uchrLen );
  //   }

  //   if( strt === stop && !newt ) return;

  //   const textOld = this.text;
  //   this.resetText(
  //     textOld.slice(0,strt).concat( newt?newt:"", textOld.slice(stop) )
  //   );
  // }

  // /**
  //  * @final
  //  * @const @param { String } newt
  //  */
  // append( newt )
  // {
  //   if( !newt ) return;

  //   this.resetText( this.text.concat(newt) );
  // }

  // /**
  //  * @headconst @param { ELine } line_x
  //  * @return { ELine } - return line_x
  //  */
  // linkPrev( line_x )
  // {
  //   /* in */ {
  //     assert( line_x && line_x.coo === this.coo );
  //   }
  //   const out = () => {
  //     assert( line_x === this.prevline_ );
  //     assert( line_x.nextline_ === this );
  //   }

  //   if( this.prevline_ )
  //   {
  //     this.prevline_.nextline_ = line_x;
  //     line_x.prevline_ = this.prevline_;
  //   }
  //   line_x.nextline_ = this;
  //   this.prevline_ = line_x;

  //   out(); return line_x;
  // }

  // /**
  //  * @headconst @param { ELine } line_x
  //  * @return { ELine } - return line_x
  //  */
  // linkNext( line_x )
  // {
  //   /* in */ {
  //     assert( line_x && line_x.coo === this.coo );
  //   }
  //   const out = () => {
  //     assert( line_x === this.nextline_ );
  //     assert( line_x.prevline_ === this );
  //   }

  //   if( this.nextline_ )
  //   {
  //     this.nextline_.prevline_ = line_x;
  //     line_x.nextline_ = this.nextline_;
  //   }
  //   line_x.prevline_ = this;
  //   this.nextline_ = line_x;

  //   out(); return line_x;
  // }
}
/*80--------------------------------------------------------------------------*/
