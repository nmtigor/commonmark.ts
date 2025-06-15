/** 80**************************************************************************
 * @module lib/compiling/uri/stnode/Fragment
 * @license BSD-3-Clause
 ******************************************************************************/

import type { URITk } from "../../Token.ts";
import { URI_SN } from "./URI_SN.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class Fragment extends URI_SN {
  #tk;

  override get frstToken(): URITk {
    return this.frstToken$ ??= this.#tk;
  }
  override get lastToken(): URITk {
    return this.lastToken$ ??= this.#tk;
  }

  /** @const @param tk_x  */
  constructor(tk_x: URITk) {
    super();
    this.#tk = tk_x;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    return this._info_;
  }
}
/*80--------------------------------------------------------------------------*/
