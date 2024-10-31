/** 80**************************************************************************
 * @module lib/compiling/latex/LaTeXTok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum LaTeXTok_ {
  _ = 600,

  _max,
}
console.assert(LaTeXTok_._max <= 700);

export type LaTeXTok = BaseTok | LaTeXTok_;
export const LaTeXTok = { ...BaseTok, ...LaTeXTok_ };
/*80--------------------------------------------------------------------------*/
