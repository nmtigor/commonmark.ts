/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/List
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint, uint16 } from "@fe-lib/alias.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
import { _tag, _toHTML } from "../util.ts";
import { Block } from "./Block.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import { ListItem } from "./ListItem.ts";
/*80--------------------------------------------------------------------------*/

export abstract class List extends CtnrBlock {
  override continue(): BlockCont {
    return BlockCont.continue;
  }

  override canContain(_x: Block): boolean {
    return _x instanceof ListItem;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected override readonly block_a$: ListItem[] = [];

  /**
   * `in( this.block_a$.length )`
   */
  override get frstChild(): Block {
    return this.block_a$[0];
  }
  /**
   * `in( this.block_a$.length )`
   */
  override get lastChild(): Block {
    return this.block_a$.at(-1)!;
  }

  /**
   * `in( this.block_a$.length )`
   * @implement
   */
  get frstToken() {
    return this.frstToken$ ??= this.block_a$[0].frstToken;
  }
  /** @see {@linkcode frstToken()} */
  get lastToken() {
    return this.lastToken$ ??= this.block_a$.at(-1)!.lastToken;
  }

  #sign;
  get sign() {
    return this.#sign;
  }

  #tight = true;
  get _tight() {
    return this.#tight;
  }

  /**
   * @const @param sign_x ucod of one of "*", "+", "-", ")", "."
   */
  constructor(sign_x: uint16) {
    super();
    this.#sign = sign_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected override closeBlock_impl$(): void {
    for (let i = 0, iI = this.block_a$.length; i < iI; ++i) {
      const li_i = this.block_a$[i];
      if (i + 1 < iI) {
        /* check for non-final list item ending with blank line */
        if (li_i.lastLine.nextLine !== this.block_a$[i + 1].frstLine) {
          this.#tight = false;
          break;
        }
      }
      /* recurse into children of list item, to see if there are
      spaces between any of them */
      if (!li_i.tight_1) {
        this.#tight = false;
        break;
      }
    }
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class BulletList extends List {
  /**
   * @const @param sign_x ucod of one of "*", "+", "-"
   */
  constructor(sign_x: uint16) {
    super(sign_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    return `<ul>\n${_toHTML(lexr_x, this.block_a$)}\n</ul>`;
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class OrderdList extends List {
  #start;

  /**
   * @const @param start_x
   * @const @param sign_x ucod of one of ")", "."
   */
  constructor(start_x: uint, sign_x: uint16) {
    super(sign_x);
    this.#start = start_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    return `${
      this.#start !== 1 ? _tag("ol", [["start", this.#start]]) : "<ol>"
    }\n${_toHTML(lexr_x, this.block_a$)}\n</ol>`;
  }
}
/*80--------------------------------------------------------------------------*/
