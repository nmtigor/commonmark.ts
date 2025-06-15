/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Document
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import { Block } from "./Block.ts";
import { BlockCont } from "../alias.ts";
import { ListItem } from "./ListItem.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { _toHTML } from "../util.ts";
import { CtnrBlock } from "./CtnrBlock.ts";
import type { Loc } from "@fe-lib/compiling/Loc.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Document extends CtnrBlock {
  override continue(): BlockCont {
    return BlockCont.continue;
  }

  override canContain(_x: Block): boolean {
    return !(_x instanceof ListItem);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

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

  /** `in( this.children$.length )` */
  override get frstToken() {
    return this.frstToken$ ??= this.children[0].frstToken;
  }
  /** @see {@linkcode frstToken()} */
  override get lastToken() {
    return this.lastToken$ ??= this.children.at(-1)!.lastToken;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override closeBlock(): CtnrBlock {
    fail("Disabled");
  }

  /** @implement */
  lcolCntStrt(_loc_x: Loc) {
    return null;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    return _toHTML(lexr_x, this.children);
  }
}
/*80--------------------------------------------------------------------------*/
