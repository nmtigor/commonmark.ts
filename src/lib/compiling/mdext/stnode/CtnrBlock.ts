/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/CtnrBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type { MdextLexr } from "../MdextLexr.ts";
import { Block } from "./Block.ts";
/*80--------------------------------------------------------------------------*/

export abstract class CtnrBlock extends Block {
  /* block_a$ */
  protected readonly block_a$: Block[] = [];
  get empty() {
    return !this.block_a$.length;
  }

  getBlockAftr(_x: Block): Block | undefined {
    const i_ = this.block_a$.indexOf(_x);
    return i_ >= 0 ? this.block_a$.at(i_ + 1) : undefined;
  }
  getBlockBefo(_x: Block): Block | undefined {
    const i_ = this.block_a$.indexOf(_x);
    return i_ > 0 ? this.block_a$.at(i_ - 1) : undefined;
  }
  /* ~ */

  override get frstChild(): Block | undefined {
    return this.block_a$.at(0);
  }
  override get lastChild(): Block | undefined {
    return this.block_a$.at(-1);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @headconst @param ref_x
   * @headconst @param _x
   */
  appendBlock(_x: Block, ref_x?: Block) {
    _x.parent_$ = this;
    if (ref_x) {
      const i_ = this.block_a$.indexOf(ref_x);
      if (i_ >= 0) {
        this.block_a$.splice(i_ + 1, 0, _x);
      } else {
        this.block_a$.push(_x);
      }
    } else {
      this.block_a$.push(_x);
    }

    this.invalidateBdry();
  }

  /** @final */
  override replaceChild(oldSn_x: Block, newSn_x?: Block) {
    const iI = this.block_a$.length;
    const i_ = this.block_a$.indexOf(oldSn_x);
    if (i_ >= 0) {
      if (newSn_x) this.block_a$.splice(i_, 1, newSn_x);
      else this.block_a$.splice(i_, 1);
    }

    if (i_ === 0 || i_ === iI - 1) {
      this.invalidateBdry();
    }
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  override reference(lexr_x: MdextLexr): this {
    /* `block_a$` may be modified in flying */
    for (let i = 0; i < this.block_a$.length; ++i) {
      this.block_a$[i].reference(lexr_x);
    }
    return this;
  }

  protected override inline_impl$(lexr_x: MdextLexr) {
    for (const block of this.block_a$) {
      block.inline(lexr_x);
    }
  }
}
/*80--------------------------------------------------------------------------*/
