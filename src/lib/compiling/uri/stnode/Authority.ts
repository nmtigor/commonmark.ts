/** 80**************************************************************************
 * @module lib/compiling/uri/stnode/Authority
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import { Err } from "../../alias.ts";
import type { URITk } from "../../Token.ts";
import { URI_SN } from "./URI_SN.ts";
/*80--------------------------------------------------------------------------*/

type AuthorityCtorP_ = {
  twoslash: URITk;
  userinfo: URITk | undefined;
  host: URITk | undefined;
  port: URITk | undefined;
};

/** @final */
export class Authority extends URI_SN {
  #twoslash;
  #userinfo;
  #host;
  #port;

  override get frstToken(): URITk {
    return this.frstToken$ ??= this.#twoslash;
  }
  override get lastToken(): URITk {
    return this.lastToken$ ??= this.#port ??
      this.#host ?? this.#userinfo ?? this.#twoslash;
  }

  constructor({ twoslash, userinfo, host, port }: AuthorityCtorP_) {
    super();
    this.#twoslash = twoslash;
    this.#userinfo = userinfo;
    this.#host = host;
    this.#port = port;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    const tk_a: URITk[] = [];
    if (this.#userinfo) tk_a.push(this.#userinfo);
    if (this.#host) tk_a.push(this.#host);
    if (this.#port) tk_a.push(this.#port);
    return `${this._info_} ( //${tk_a.join(" ")})`;
  }
}
/*80--------------------------------------------------------------------------*/
