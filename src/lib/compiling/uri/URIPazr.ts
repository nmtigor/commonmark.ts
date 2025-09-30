/** 80**************************************************************************
 * @module lib/compiling/uri/URIPazr
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert } from "@fe-lib/util.ts";
import { INOUT } from "@fe-src/preNs.ts";
import type { uint } from "../../alias.ts";
import { Factory } from "../../util/Factory.ts";
import { Pazr } from "../Pazr.ts";
import { URITk } from "../Token.ts";
import type { URILexr } from "./URILexr.ts";
import { URITok } from "./URITok.ts";
import { Authority } from "./stnode/Authority.ts";
import { Fragment } from "./stnode/Fragment.ts";
import { PathPart } from "./stnode/PathPart.ts";
import { Query } from "./stnode/Query.ts";
import { URI } from "./stnode/URI.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class URIPazr extends Pazr<URITok> {
  /** @implement */
  protected paz_impl$(): void {
    this.newSn_$ = this.#pazURI();
    if (this.newSn_$?.isErr) this.errSn_sa$.add(this.newSn_$);
    this.root$ = this.newSn_$;
  }

  #pazURI(): URI | undefined {
    let scheme: URITk | undefined,
      pathpart: PathPart | undefined,
      query: Query | undefined,
      fragment: Fragment | undefined;
    if (this.strtPazTk$.value === URITok.scheme) {
      scheme = this.strtPazTk$;
      this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    }
    switch (this.strtPazTk$.value) {
      case URITok.twoslash:
      case URITok.path_abempty:
      case URITok.path_absolute:
      case URITok.path_noscheme:
      case URITok.path_rootless:
        pathpart = this.#pazPathPart();
        if (pathpart.isErr) this.errSn_sa$.add(pathpart);
        break;
    }
    if (this.strtPazTk$.value === URITok.query) {
      query = this.#pazQuery();
      if (query.isErr) this.errSn_sa$.add(query);
    }
    if (this.strtPazTk$.value === URITok.fragment) {
      fragment = this.#pazFragment();
      if (fragment.isErr) this.errSn_sa$.add(fragment);
    }
    return scheme || pathpart || query || fragment
      ? new URI({ scheme, pathpart, query, fragment })
      : undefined;
  }

  #pazPathPart(): PathPart {
    const frstTk = this.strtPazTk$;
    /*#static*/ if (INOUT) {
      assert(
        frstTk.value === URITok.twoslash ||
          frstTk.value === URITok.path_abempty ||
          frstTk.value === URITok.path_absolute ||
          frstTk.value === URITok.path_noscheme ||
          frstTk.value === URITok.path_rootless,
      );
    }
    let authority: Authority | undefined,
      pathAbempty: URITk | undefined,
      pathAbsolute: URITk | undefined,
      pathNoscheme: URITk | undefined,
      pathRootless: URITk | undefined;
    switch (this.strtPazTk$.value) {
      case URITok.twoslash:
        authority = this.#pazAuthority();
        if (authority.isErr) this.errSn_sa$.add(authority);
        if (this.strtPazTk$.value === URITok.path_abempty as any) {
          pathAbempty = this.strtPazTk$;
          this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        }
        break;
      case URITok.path_abempty:
        pathAbempty = this.strtPazTk$;
        this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        break;
      case URITok.path_absolute:
        pathAbsolute = this.strtPazTk$;
        this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        break;
      case URITok.path_noscheme:
        pathNoscheme = this.strtPazTk$;
        this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        break;
      case URITok.path_rootless:
        pathRootless = this.strtPazTk$;
        this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        break;
    }
    return new PathPart({
      authority,
      pathAbempty,
      pathAbsolute,
      pathNoscheme,
      pathRootless,
    });
  }

  #pazAuthority(): Authority {
    const twoslash = this.strtPazTk$;
    /*#static*/ if (INOUT) {
      assert(twoslash.value === URITok.twoslash);
    }
    this.strtPazTk$ = this.strtPazTk$.nextToken_$!;

    let userinfo: URITk | undefined,
      host: URITk | undefined,
      port: URITk | undefined;
    if (this.strtPazTk$.value === URITok.userinfo) {
      userinfo = this.strtPazTk$;
      this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    }
    switch (this.strtPazTk$.value) {
      case URITok.regname:
      case URITok.IPv4:
      case URITok.IPv6:
      case URITok.IPv7:
        host = this.strtPazTk$;
        this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
        break;
    }
    if (this.strtPazTk$.value === URITok.port) {
      port = this.strtPazTk$;
      this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    }
    return new Authority({ twoslash, userinfo, host, port });
  }

  #pazQuery(): Query {
    const tk_ = this.strtPazTk$;
    /*#static*/ if (INOUT) {
      assert(tk_.value === URITok.query);
    }
    this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    return new Query(tk_);
  }

  #pazFragment(): Fragment {
    const tk_ = this.strtPazTk$;
    /*#static*/ if (INOUT) {
      assert(tk_.value === URITok.fragment);
    }
    this.strtPazTk$ = this.strtPazTk$.nextToken_$!;
    return new Fragment(tk_);
  }
}
/*64----------------------------------------------------------*/

class URIPazrFac_ extends Factory<URIPazr> {
  #lexr!: URILexr;
  setLexr(_x: URILexr): this {
    this.#lexr = _x;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override createVal$(): URIPazr {
    // /*#static*/ if (PRF) {
    //   console.log(
    //     `%c# of cached URIPazr instances: ${this.val_a$.length + 1}`,
    //     `color:${LOG_cssc.performance}`,
    //   );
    // }
    return new URIPazr(this.#lexr);
  }

  // protected override resetVal$(i_x: uint) {
  //   const ret = this.get(i_x);
  //   ret.destructor();
  //   return ret;
  // }
  protected override reuseVal$(i_x: uint): URIPazr {
    return this.get(i_x).reset_Pazr(this.#lexr);
  }
}
export const g_uripazr_fac = new URIPazrFac_();
/*80--------------------------------------------------------------------------*/
