/** 80**************************************************************************
 * @module lib/compiling/uri/stnode/PathPart
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert } from "@fe-lib/util.ts";
import { INOUT } from "@fe-src/preNs.ts";
import { Err } from "../../alias.ts";
import type { URITk } from "../../Token.ts";
import type { Authority } from "./Authority.ts";
import { URI_SN } from "./URI_SN.ts";
/*80--------------------------------------------------------------------------*/

export enum PathKind {
  err = 1,
  abs,
  rel,
  any,
}

type PathPartCtorP_ = {
  authority: Authority | undefined;
  pathAbempty: URITk | undefined;
  pathAbsolute: URITk | undefined;
  pathNoscheme: URITk | undefined;
  pathRootless: URITk | undefined;
};

/** @final */
export class PathPart extends URI_SN {
  #authority;
  #pathAbempty;
  #pathAbsolute;
  #pathNoscheme;
  #pathRootless;

  get isEmail_1(): boolean {
    if (
      !(!!this.#pathNoscheme &&
        !this.#authority && !this.#pathAbempty &&
        !this.#pathAbsolute && !this.#pathRootless)
    ) return false;

    const s_a = this.#pathNoscheme.getText().split("@");
    return s_a.length === 2 && !!s_a[0] && !!s_a[1];
  }

  get kind(): PathKind {
    return this.isErr
      ? PathKind.err
      : this.#pathRootless
      ? PathKind.abs
      : this.#pathNoscheme
      ? PathKind.rel
      : PathKind.any;
  }

  override get children(): [Authority] | undefined {
    return this.#authority ? [this.#authority] : undefined;
  }

  override get frstToken(): URITk {
    return this.frstToken$ ??= this.#authority?.frstToken ??
      this.#pathAbsolute ?? this.#pathNoscheme ??
      this.#pathRootless ?? this.#pathAbempty!;
  }
  override get lastToken(): URITk {
    return this.lastToken$ ??= this.#pathAbempty ??
      this.#pathAbsolute ?? this.#pathNoscheme ??
      this.#pathRootless ?? this.#authority!.lastToken;
  }

  constructor(
    { authority, pathAbempty, pathAbsolute, pathNoscheme, pathRootless }:
      PathPartCtorP_,
  ) {
    /*#static*/ if (INOUT) {
      assert(
        authority ||
          pathAbempty || pathAbsolute || pathNoscheme || pathRootless,
      );
    }
    super();
    this.#authority = authority;
    this.#pathAbempty = pathAbempty;
    this.#pathAbsolute = pathAbsolute;
    this.#pathNoscheme = pathNoscheme;
    this.#pathRootless = pathRootless;

    if (authority) authority.parent_$ = this;

    let n_ = 0;
    if (authority) n_ += 1;
    if (pathAbsolute) n_ += 1;
    if (pathNoscheme) n_ += 1;
    if (pathRootless) n_ += 1;
    if (n_ > 1) this.setErr(Err.uri_pathpart_conflict);
    else if (n_ < 1) this.setErr(Err.uri_no_authority);

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override get _info_(): string {
    return `${super._info_},${PathKind[this.kind]}`;
  }

  override toString() {
    const snt_a: (URITk | URI_SN)[] = [];
    if (this.#authority) {
      snt_a.push(this.#authority);
      if (this.#pathAbempty) snt_a.push(this.#pathAbempty);
    } else if (this.#pathAbsolute) snt_a.push(this.#pathAbsolute);
    else if (this.#pathNoscheme) snt_a.push(this.#pathNoscheme);
    else if (this.#pathRootless) snt_a.push(this.#pathRootless);
    return `${this._info_} ( ${snt_a.join(" ")})`;
  }
}
/*80--------------------------------------------------------------------------*/
