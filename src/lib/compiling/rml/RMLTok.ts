/** 80**************************************************************************
 * @module lib/compiling/rml/RMLTok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum RMLTok_ {
  _ = 700,

  _max,
}
console.assert(RMLTok_._max <= 800);

export type RMLTok = BaseTok | RMLTok_;
export const RMLTok = { ...BaseTok, ...RMLTok_ };
/*80--------------------------------------------------------------------------*/
