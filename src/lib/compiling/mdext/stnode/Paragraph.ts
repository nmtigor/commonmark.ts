/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Paragraph
 * @license BSD-3-Clause
 ******************************************************************************/

import { isLFOr0 } from "@fe-lib/util/general.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { MdextTok } from "../MdextTok.ts";
import { BlockCont } from "../alias.ts";
import { _toHTML, lastNonblankIn } from "../util.ts";
import { Inline } from "./Inline.ts";
import { ILoc, InlineBlock } from "./InlineBlock.ts";
import { List } from "./List.ts";
import type { int } from "@fe-lib/alias.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class PLoc extends ILoc {
  override get host() {
    return this.host$ as Paragraph;
  }

  //kkkk TOCLEANUP
  // /**
  //  * @headconst @param host_x
  //  */
  // constructor(host_x: Paragraph) {
  //   super(host_x);
  // }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class Paragraph extends InlineBlock {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueParagraph_$();
  }

  override readonly acceptsLines = true;
  override appendLine(_x: MdextTk): void {
    this.snt_a_$.push(_x);

    this.invalidateBdry();
  }
  appendLines(_x: MdextTk[]): void {
    for (const tk of _x) this.snt_a_$.push(tk);

    this.invalidateBdry();
  }
  prependLine(_x: MdextTk): void {
    this.snt_a_$.unshift(_x);

    this.invalidateBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  get frstToken() {
    if (this.frstToken$) return this.frstToken$;

    const snt = this.snt_a_$[0];
    return this.frstToken$ = snt instanceof Inline ? snt.frstToken : snt;
  }
  /** @implement */
  get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    const snt = this.snt_a_$.at(-1)!;
    return this.lastToken$ = snt instanceof Inline ? snt.lastToken : snt;
  }

  #iloc: PLoc | undefined;
  /** @implement */
  get iloc(): PLoc {
    return this.#iloc ??= new PLoc(this);
  }

  /**
   * @headconst @param tk_x
   */
  constructor(tk_x: MdextTk | MdextTk[]) {
    super();
    if (Array.isArray(tk_x)) {
      for (const tk of tk_x) this.snt_a_$.push(tk);
    } else {
      this.snt_a_$.push(tk_x);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected override closeBlock_impl$(): void {
    /*#static*/ if (INOUT) {
      for (const tk of this.snt_a_$) {
        assert(
          tk instanceof MdextTk && tk.value === MdextTok.chunk &&
            isLFOr0(tk.stopLoc.ucod),
        );
      }
    }
    /* Do not handle soft break here because line end may be in some multiline
    "<code></code>". */

    const lastTk = this.snt_a_$.at(-1)!;
    const lastLn = lastTk.lastLine;
    const i_ = lastNonblankIn(lastLn);
    /*#static*/ if (INOUT) {
      assert(lastTk.strtLoff <= i_ && i_ < lastLn.uchrLen);
    }
    lastTk.stopLoc.loff = 1 + i_;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override reference(lexr_x: MdextLexr): this {
    this.iloc.reset_O(this.snt_a_$[0] as MdextTk);

    const VALVE = 10_000;
    let valve = VALVE;
    while (
      lexr_x.lexReference_$(this.iloc) && this.iloc.forwNextLine_$() && --valve
    );
    assert(valve, `Loop ${VALVE}±1 times`);
    return this;
  }

  //kkkk TOCLEANUP
  // protected override inline_impl$(lexr_x: MdextLexr): void {
  //   let iloc = this.iloc;

  //   const snt_a = this.snt_a_$;
  //   let i_ = 0;
  //   const iI = snt_a.length;
  //   for (; i_ < iI; ++i_) if (!(snt_a[i_] instanceof Linkdef)) break;
  //   if (i_ === iI) return;

  //   /*#static*/ if (INOUT) {
  //     assert(snt_a[i_] instanceof MdextTk);
  //   }
  //   iloc.reset_O(snt_a[i_] as MdextTk);

  //   const VALVE = 1_000;
  //   let valve = VALVE;
  //   while (lexr_x.lexInline_$(iloc) && --valve) {}
  //   assert(valve, `Loop ${VALVE}±1 times`);
  //   lexr_x.lexEmphasis_$(iloc);
  // }

  //kkkk TOCLEANUP
  // /**
  //  * `in( this.#iloc )`
  //  * @implement
  //  */
  // splice_$(tk_x: MdextTk, strtLoc_x?: Loc): MdextTk {
  //   /** @primaryconst */
  //   const stopILoc = this.#iloc!;
  //   const curTk = stopILoc.curTk_$;
  //   const strtLoc = strtLoc_x ?? curTk.strtLoc;
  //   /*#static*/ if (INOUT) {
  //     assert(strtLoc.posSE(tk_x.strtLoc) && tk_x.stopLoc.posSE(stopILoc));
  //     assert(stopILoc.posSE(curTk.stopLoc));
  //     /* Handled in `ILoc.setToken()` */
  //     assert(!(curTk.strtLoc.posE(strtLoc) && stopILoc.posE(curTk.stopLoc)));
  //   }
  //   let ret: MdextTk;
  //   if (curTk.strtLoc.posE(strtLoc)) {
  //     curTk.strtLoc.become(stopILoc);
  //     curTk.insertPrev(tk_x);
  //     this.snt_a_$.splice(this.snt_a_$.indexOf(curTk), 0, tk_x);
  //     ret = tk_x;
  //   } else if (stopILoc.posE(curTk.stopLoc)) {
  //     curTk.stopLoc.become(strtLoc);
  //     curTk.insertNext(tk_x);
  //     this.snt_a_$.splice(this.snt_a_$.indexOf(curTk) + 1, 0, tk_x);
  //     ret = tk_x;
  //     stopILoc.toTk("stop", tk_x); //!
  //   } else {
  //     const tk_ = curTk.dup();
  //     tk_.stopLoc.become(strtLoc);
  //     curTk.strtLoc.become(stopILoc);
  //     curTk.insertPrev(tk_x).insertPrev(tk_);
  //     this.snt_a_$.splice(this.snt_a_$.indexOf(curTk), 0, tk_, tk_x);
  //     ret = tk_x;
  //   }
  //   return ret;
  // }

  //kkkk TOCLEANUP
  // /**
  //  * @primaryconst @param strtLoc_x
  //  * @primaryconst @param stopLoc_x
  //  * @const @param tok_x
  //  */
  // replace(strtLoc_x: Loc, stopLoc_x: Loc, tok_x: MdextTok): MdextTk[] {
  //   /*#static*/ if (INOUT) {
  //     assert(strtLoc_x.posS(stopLoc_x));
  //   }
  //   ///
  //   return [];
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const s_ = _toHTML(lexr_x, this.snt_a_$);
    if (!s_) return s_;

    const grandparent = this.parent_$?.parent_$;
    return grandparent instanceof List && grandparent._tight
      ? s_
      : `<p>${s_}</p>`;
  }
}
/*80--------------------------------------------------------------------------*/
