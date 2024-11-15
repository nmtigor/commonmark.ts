/** 80**************************************************************************
 * @module lib/compiling/mdext/alias
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "../../alias.ts";
import { Document } from "./stnode/Document.ts";
import { List } from "./stnode/List.ts";
import { BlockQuote } from "./stnode/BlockQuote.ts";
import { ListItem } from "./stnode/ListItem.ts";
import { Heading } from "./stnode/Heading.ts";
import { ThematicBreak } from "./stnode/ThematicBreak.ts";
import { CodeBlock } from "./stnode/CodeBlock.ts";
import { HTMLBlock } from "./stnode/HTMLBlock.ts";
import { Paragraph } from "./stnode/Paragraph.ts";
/*80--------------------------------------------------------------------------*/

export const enum BlockCont {
  /** we've matched, keep going */
  continue = 1,
  /** we've failed to match a block */
  break,
  /** */
  matched,
  // /** we've hit end of line for fenced code close and can returnb */
  // matchedFull,
}

//jjjj TOCLEANUP
// export type BlockType =
//   | typeof Document
//   | typeof List
//   | typeof BlockQuote
//   | typeof Item
//   | typeof Heading
//   | typeof ThematicBreak
//   | typeof CodeBlock
//   | typeof HTMLBlock
//   | typeof Paragraph;
/*80--------------------------------------------------------------------------*/
