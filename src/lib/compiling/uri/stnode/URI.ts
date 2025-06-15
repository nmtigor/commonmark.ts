/** 80**************************************************************************
 * @module lib/compiling/uri/stnode/URI
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/global.ts";
import { assert } from "@fe-lib/util/trace.ts";
import type { URITk } from "../../Token.ts";
import type { Fragment } from "./Fragment.ts";
import { PathKind, type PathPart } from "./PathPart.ts";
import type { Query } from "./Query.ts";
import { URI_SN } from "./URI_SN.ts";
import { Err } from "../../alias.ts";
import { Stnode } from "../../Stnode.ts";
import { URITok } from "../URITok.ts";
/*80--------------------------------------------------------------------------*/

type URICtorP_ = {
  scheme: URITk | undefined;
  pathpart: PathPart | undefined;
  query: Query | undefined;
  fragment: Fragment | undefined;
};

/** @final */
export class URI extends URI_SN {
  #scheme;
  #pathpart;
  #query;
  #fragment;

  get hasScheme(): boolean {
    return !!this.#scheme;
  }

  get isEmail_1(): boolean {
    return !!this.#pathpart?.isEmail_1 &&
      !this.#scheme && !this.#query && !this.#fragment;
  }

  override get children(): URI_SN[] {
    const ret: URI_SN[] = [];
    if (this.#pathpart) ret.push(this.#pathpart);
    if (this.#query) ret.push(this.#query);
    if (this.#fragment) ret.push(this.#fragment);
    return ret;
  }

  override get frstToken(): URITk {
    return this.frstToken$ ??= this.#scheme ??
      this.#pathpart?.frstToken ?? this.#query?.frstBdryTk ??
      this.#fragment!.frstToken;
  }
  override get lastToken(): URITk {
    return this.lastToken$ ??= this.#fragment?.lastToken ??
      this.#query?.lastToken ?? this.#pathpart?.lastToken ?? this.#scheme!;
  }

  constructor({ scheme, pathpart, query, fragment }: URICtorP_) {
    /*#static*/ if (INOUT) {
      assert(scheme || pathpart || query || fragment);
    }
    super();
    this.#scheme = scheme;
    this.#pathpart = pathpart;
    this.#query = query;
    this.#fragment = fragment;

    if (pathpart) pathpart.parent_$ = this;
    if (query) query.parent_$ = this;
    if (fragment) fragment.parent_$ = this;

    if (pathpart) {
      if (pathpart.kind === PathKind.abs && !scheme) {
        this.setErr(Err.uri_no_scheme);
      } else if (pathpart.kind === PathKind.rel && scheme) {
        this.setErr(Err.uri_unexpected_scheme);
      }
    }

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString() {
    const snt_a: (URITk | URI_SN)[] = [];
    if (this.#scheme) snt_a.push(this.#scheme);
    if (this.#pathpart) snt_a.push(this.#pathpart);
    if (this.#query) snt_a.push(this.#query);
    if (this.#fragment) snt_a.push(this.#fragment);
    return `${this._info_} ( ${snt_a.join(" ")})`;
  }
}
/*80--------------------------------------------------------------------------*/
