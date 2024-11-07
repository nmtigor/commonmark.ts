/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/CtnrBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { Block } from "./Block.ts";
import type { MdextTk } from "../../Token.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { SortedStnod_id } from "../../Stnode.ts";
/*80--------------------------------------------------------------------------*/

export abstract class CtnrBlock extends Block {
  /* children$ */
  override get children(): Block[] {
    return this.children$ as Block[];
  }

  getChildAftr(_x: Block): Block | undefined {
    const i_ = this.children.indexOf(_x);
    return i_ >= 0 ? this.children.at(i_ + 1) : undefined;
  }
  getChildBefo(_x: Block): Block | undefined {
    const i_ = this.children.indexOf(_x);
    return i_ > 0 ? this.children.at(i_ - 1) : undefined;
  }
  /* ~ */

  /* #iCurChild */
  #iCurChild: -1 | uint = -1;
  //jjjj TOCLEANUP
  // private set _iCurChild(_x: -1 | uint) {
  //   this.#wasCompiling = this.isCompiling;
  //   this.#iCurChild = _x;
  // }
  override get curChild(): Block | undefined {
    return this.children.at(this.#iCurChild);
  }

  compiling(child_x: Block | null): void {
    if (child_x) {
      /* `#iCurChild` won't change to other non-negatives after setting to a
      non-negative. */
      if (this.#iCurChild === -1) {
        this.#iCurChild = this.children.indexOf(child_x);
      }
    } else {
      this.#iCurChild = -1;
    }
  }

  get isCompiling() {
    return this.#iCurChild >= 0;
  }

  //jjjj TOCLEANUP
  // #wasCompiling = false;
  // get wasCompiling() {
  //   return this.#wasCompiling;
  // }
  /* ~ */

  constructor() {
    super();
    this.children$ = [];
  }

  override reset(): this {
    this.children.length = 0;
    this.#iCurChild = -1;
    //jjjj TOCLEANUP
    // this.#wasCompiling = false;
    return super.reset();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @headconst @param newSn_x
   * @headconst @param ref_x
   */
  appendBlock(newSn_x: Block, ref_x?: Block) {
    newSn_x.parent_$ = this;

    const c_a = this.children;
    const iI = c_a.length;
    let i_;
    if (ref_x) {
      i_ = c_a.indexOf(ref_x);
      if (i_ >= 0) i_ += 1;
      else i_ = iI;
    } else {
      i_ = iI;
    }
    c_a.splice(i_, 0, newSn_x);

    if (i_ === 0 || i_ === iI - 1) this.invalidateBdry();
  }

  /** @final */
  override replaceChild(oldSn_x: Block, newSn_x?: Block) {
    const c_a = this.children;
    const i_ = c_a.indexOf(oldSn_x);
    if (i_ >= 0) {
      if (newSn_x) {
        newSn_x.parent_$ = this;
        c_a.splice(i_, 1, newSn_x);
      } else {
        c_a.splice(i_, 1);
      }
    }

    if (i_ === 0 || i_ === c_a.length - 1) this.invalidateBdry();
  }

  //jjjj TOCLEANUP
  // /** @final */
  // removeAllChild() {
  //   this.children.length = 0;
  //   this.invalidateBdry();
  // }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  override reference(lexr_x: MdextLexr): this {
    const c_a = this.children;
    /* `children$` may be modified in flying */
    for (let i = 0; i < c_a.length; ++i) {
      if (!c_a[i].complete) c_a[i].reference(lexr_x);
    }
    return this;
  }

  protected override inline_impl$(lexr_x: MdextLexr) {
    for (const block of this.children) {
      block.inline(lexr_x);
    }
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    //jjjj TOCLEANUP
    // /* Functinal Token (e.g. ">" in BlockQuote) are not gathered. They are
    // skipped (reused) by `lcolCntStrt()` */
    for (const c of this.children) {
      if (!unrelSn_sa_x.includes(c)) {
        c.gathrUnrelSnt(
          drtStrtLoc_x,
          drtStopLoc_x,
          unrelSn_sa_x,
          unrelSnt_sa_x,
        );
      }
    }
  }

  /**
   * @headconst @param _loc_x
   */
  abstract lcolCntStrt(_loc_x: Loc): MdextTk | undefined;
}
/*80--------------------------------------------------------------------------*/
