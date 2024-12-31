/** 80**************************************************************************
 * @module lib/compiling/mdext/alias
 * @license BSD-3-Clause
 ******************************************************************************/

export {};
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
