/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/List
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint, uint16 } from "@fe-lib/alias.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
import { _tag, _toHTML } from "../util.ts";
import type { Block } from "./Block.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import { ListItem } from "./ListItem.ts";
import type { Loc } from "../../Loc.ts";
import { fail } from "@fe-lib/util/trace.ts";
import type { MdextTk } from "../../Token.ts";
/*80--------------------------------------------------------------------------*/

export abstract class List extends CtnrBlock {
  override continue(): BlockCont {
    return BlockCont.continue;
  }

  override canContain(_x: Block): boolean {
    return _x instanceof ListItem;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // protected override readonly block_a$: ListItem[] = [];

  override get children(): ListItem[] {
    return this.children$ as ListItem[];
  }

  //jjjj TOCLEANUP
  // /**
  //  * `in( this.block_a$.length )`
  //  */
  // override get frstChild(): Block {
  //   return this.block_a$[0];
  // }
  // /**
  //  * `in( this.block_a$.length )`
  //  */
  // override get lastChild(): Block {
  //   return this.block_a$.at(-1)!;
  // }

  /**
   * `in( this.block_a$.length )`
   */
  override get frstToken() {
    return this.frstToken$ ??= this.children[0].frstToken;
  }
  /** @see {@linkcode frstToken()} */
  override get lastToken() {
    return this.lastToken$ ??= this.children.at(-1)!.lastToken;
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
    const c_a = this.children;
    for (let i = 0, iI = c_a.length; i < iI; ++i) {
      const li_i = c_a[i];
      if (i + 1 < iI) {
        /* check for non-final list item ending with blank line */
        if (li_i.sntLastLine.nextLine !== c_a[i + 1].sntFrstLine) {
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

  /** @implement */
  lcolCntStrt(_loc_x: Loc) {
    return null;
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
    return `<ul>\n${_toHTML(lexr_x, this.children)}\n</ul>`;
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
    }\n${_toHTML(lexr_x, this.children)}\n</ol>`;
  }
}
/*80--------------------------------------------------------------------------*/
