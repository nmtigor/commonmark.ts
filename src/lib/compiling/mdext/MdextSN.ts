/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextSN
 * @license BSD-3-Clause
 ******************************************************************************/

import { Stnode } from "../Stnode.ts";
import type { MdextLexr } from "./MdextLexr.ts";
import type { MdextTok } from "./MdextTok.ts";
/*80--------------------------------------------------------------------------*/

export abstract class MdextSN extends Stnode<MdextTok> {
  /**
   * @headconst @param lexr_x
   */
  _toHTML(lexr_x: MdextLexr): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
