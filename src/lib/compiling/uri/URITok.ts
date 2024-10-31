/** 80**************************************************************************
 * @module lib/compiling/uri/URITok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum URITok_ {
  _ = 300,

  _max,
}
console.assert(URITok_._max <= 400);

export type URITok = BaseTok | URITok_;
export const URITok = { ...BaseTok, ...URITok_ };
/*80--------------------------------------------------------------------------*/
