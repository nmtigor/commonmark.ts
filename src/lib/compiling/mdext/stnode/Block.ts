/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Block
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t } from "@fe-lib/alias.ts";
import { assert, fail, out } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { Loc } from "../../Loc.ts";
import type { MdextTk } from "../../Token.ts";
import { Err } from "../../alias.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { MdextSN } from "../MdextSN.ts";
import { BlockCont } from "../alias.ts";
import type { CtnrBlock } from "./CtnrBlock.ts";
import type { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Block extends MdextSN {
  /** @headconst @param _lexr_x */
  continue(_lexr_x: MdextLexr): BlockCont {
    return BlockCont.break;
  }

  canContain(_x: Block): boolean {
    return false;
  }

  readonly acceptsLines: boolean = false;
  appendLine(_x: (MdextTk | Inline)[]): void {
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
  /** "iS" */
  #_inlineSkipd = false;

  /** For compiling only */
  #oldLastLidx: lnum_t | -1 = -1;
  get oldLastLidx() {
    return this.#oldLastLidx;
  }

  /** @final */
  reuseBlock(): this {
    this.#open = true;
    this.#complete = false;
    this.#_inlineSkipd = false;
    this.invalidateBdry();
    return this;
  }
  /** Will be invoked FIRSTLY by subclasses */
  resetBlock(): this {
    this.#oldLastLidx = this.parent?.isCompiling(this)
      ? this.sntLastLidx_1
      : -1;
    return this.reuseBlock();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected closeBlock_impl$() {}
  /**
   * @final
   * @const @param curLidx_x
   * @const @param _x
   */
  @out((_, self: Block, args) => {
    if (!args[1]) assert(!self.isErr);
  })
  closeBlock(curLidx_x: lnum_t, _x?: "may_err"): CtnrBlock {
    if (this.#complete) return this.parent!;

    /*#static*/ if (INOUT) {
      assert(this.#open);
      assert(this.parent_$);
    }
    if (curLidx_x < this.oldLastLidx) {
      this.setErr(Err.unexpected_close);
    } else {
      this.closeBlock_impl$();
    }
    this.#open = false;
    return this.parent!;
  }

  /** @headconst @param _lexr_x */
  reference(_lexr_x: MdextLexr): this {
    return this;
  }

  /** @headconst @param _lexr_x */
  protected inline_impl$(_lexr_x: MdextLexr) {}
  /**
   * @final
   * @headconst @param lexr_x
   */
  inline(lexr_x: MdextLexr): void {
    if (this.#complete) {
      this.#_inlineSkipd = true;
      return;
    }

    this.inline_impl$(lexr_x);
    /* `invalidateBdry()` is because, after `reference()`, `frstToken$` could
    have been set (e.g. in `ILoc.constructor()`), and could have been changed
    to an incorrect value in `inline_impl$`. */
    this.invalidateBdry()
      .ensureBdry();
    this.#complete = true;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @const @param loc_x */
  lidxOf(_loc_x: Loc): lnum_t | -1 {
    return -1;
  }

  /**
   * @const @param _lidx_x already valid, i.e., within the line-range of `this`
   * @out @param _snt_a_x
   */
  reuseLine(_lidx_x: lnum_t, _snt_a_x: (MdextTk | Inline)[]): void {}
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override get _info(): string {
    return `${super._info}${this.#_inlineSkipd ? ",iS" : ""}`;
  }
}
/*80--------------------------------------------------------------------------*/
