/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Block
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import { MdextSN } from "../../Stnode.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Block extends MdextSN {
  /**
   * @headconst @param lexr_x
   */
  continue(lexr_x: MdextLexr): BlockCont {
    return BlockCont.break;
  }

  canContain(_x: Block): boolean {
    return false;
  }

  readonly acceptsLines: boolean = false;
  appendLine(_x: MdextTk): void {
    fail("Not implemented");
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  get frstChild(): Block | undefined {
    return undefined;
  }
  get lastChild(): Block | undefined {
    return undefined;
  }

  #open = true;
  /** @final */
  get open() {
    return this.#open;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected closeBlock_impl$() {}
  /** @final */
  closeBlock(): Block {
    /*#static*/ if (INOUT) {
      assert(this.#open);
      assert(this.parent_$);
    }
    this.closeBlock_impl$();
    this.#open = false;
    return this.parent_$ as Block;
  }

  /**
   * @headconst @param lexr_x
   */
  reference(lexr_x: MdextLexr): this {
    return this;
  }

  /**
   * @headconst @param lexr_x
   */
  protected inline_impl$(lexr_x: MdextLexr) {}
  /**
   * @final
   * @headconst @param lexr_x
   */
  inline(lexr_x: MdextLexr): void {
    this.inline_impl$(lexr_x);
    this.frstBdryTk;
    this.lastBdryTk;
  }
}
/*80--------------------------------------------------------------------------*/
