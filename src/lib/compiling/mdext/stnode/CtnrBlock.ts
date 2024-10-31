/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/CtnrBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { Block } from "./Block.ts";
import type { MdextTk } from "../../Token.ts";
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
  override get curChild(): Block | undefined {
    return this.children.at(this.#iCurChild);
  }

  compiling(child_x: Block | null): void {
    this.#iCurChild = child_x ? this.children.indexOf(child_x) : -1;
  }

  get inCompiling() {
    return this.#iCurChild >= 0;
  }
  /* ~ */

  constructor() {
    super();
    this.children$ = [];
  }

  override reset(): this {
    this.children.length = 0;
    this.#iCurChild = -1;
    this.invalidateBdry();
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

  /**
   * @headconst @param _loc_x
   */
  abstract lcolCntStrt(_loc_x: Loc): MdextTk | undefined;
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
}
/*80--------------------------------------------------------------------------*/
