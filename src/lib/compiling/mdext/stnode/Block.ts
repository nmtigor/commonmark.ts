/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Block
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import { MdextSN } from "../MdextSN.ts";
import type { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import type { CtnrBlock } from "./CtnrBlock.ts";
import { BlockCont } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Block extends MdextSN {
  /**
   * @headconst @param _lexr_x
   */
  continue(_lexr_x: MdextLexr): BlockCont {
    return BlockCont.break;
  }

  canContain(_x: Block): boolean {
    return false;
  }

  readonly acceptsLines: boolean = false;
  appendLine(_x: MdextTk): void {
    fail("Disabled");
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override get parent(): CtnrBlock | undefined {
    return this.parent_$ as CtnrBlock | undefined;
  }

  get curChild(): Block | undefined {
    return undefined;
  }

  #open = true;
  /** @final */
  get open() {
    return this.#open;
  }

  #complete = false;
  /** @final */
  get complete() {
    return this.#complete;
  }

  /** @final */
  reuse(): this {
    this.#open = true;
    this.#complete = false;
    this.invalidateBdry();
    return this;
  }
  reset(): this {
    return this.reuse();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected closeBlock_impl$() {}
  /** @final */
  closeBlock(): CtnrBlock {
    if (this.#complete) return this.parent!;

    /*#static*/ if (INOUT) {
      assert(this.#open);
      assert(this.parent_$);
    }
    this.closeBlock_impl$();
    this.#open = false;
    return this.parent!;
  }

  /**
   * @headconst @param _lexr_x
   */
  reference(_lexr_x: MdextLexr): this {
    return this;
  }

  /**
   * @headconst @param _lexr_x
   */
  protected inline_impl$(_lexr_x: MdextLexr) {}
  /**
   * @final
   * @headconst @param lexr_x
   */
  inline(lexr_x: MdextLexr): void {
    if (this.#complete) return;

    this.inline_impl$(lexr_x);
    this.ensureBdry();
    this.#complete = true;
  }
}
/*80--------------------------------------------------------------------------*/
