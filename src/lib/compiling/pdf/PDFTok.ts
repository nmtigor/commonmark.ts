/** 80**************************************************************************
 * @module lib/compiling/pdf/PDFTok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum PDFTok_ {
  _ = 500,

  _max,
}
console.assert(PDFTok_._max <= 600);

export type PDFTok = BaseTok | PDFTok_;
export const PDFTok = { ...BaseTok, ...PDFTok_ };
/*80--------------------------------------------------------------------------*/
