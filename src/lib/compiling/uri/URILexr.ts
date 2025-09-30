/** 80**************************************************************************
 * @module lib/compiling/uri/URILexr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { loff_t, uint, uint16 } from "../../alias.ts";
import { assert } from "../../util.ts";
import { Factory } from "../../util/Factory.ts";
import { isDecimalDigit, isWhitespaceUCod } from "../../util/string.ts";
import { Err } from "../alias.ts";
import { Lexr } from "../Lexr.ts";
import type { TokBart } from "../TokBart.ts";
import type { URITk } from "../Token.ts";
import { TokRan } from "../TokRan.ts";
import { frstNon } from "../util.ts";
import type { URIBufr } from "./URIBufr.ts";
import { URITok } from "./URITok.ts";
import {
  peekIPrivate,
  peekIPv4,
  peekIPv6,
  peekIPv7,
  peekIUPSCA,
  peekScheme,
  peekSeqIUPS,
  peekSeqIUPSA,
  peekSeqIUPSC,
  peekSeqIUPSCA,
} from "./util.ts";
/*80--------------------------------------------------------------------------*/

const enum Ctx_ {
  uri = 1,
  hier_part,
  authority,
  host,
  port,
  path_abempty,
  query,
  fragment,
  blanktail,
}

/** Notice, `ws_a`\\`uriws_a` is contained in "ucschar". */
const uriws_a = [/* "\t" */ 9, 0xB, 0xC, /* " " */ 0x20] as uint16[];

/** @final */
export class URILexr extends Lexr<URITok> {
  #ctx = Ctx_.uri;

  /**
   * @headconst @param bufr_x
   * @const @param strtLoff_x
   * @const @param stopLoff_x
   */
  constructor(
    bufr_x: URIBufr | TokBart<URITok>,
    strtLoff_x: loff_t = 0,
    stopLoff_x?: loff_t,
  ) {
    super(bufr_x, strtLoff_x, stopLoff_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For uri, always `lex()` from `frstLexTk`(for the moment). */
  protected override calcStrtLexTk$(_oldRan_x: TokRan<URITok>) {
    return undefined;
  }

  /** For uri, always `lex()` to `lastLexTk`(for the moment). */
  protected override calcStopLexTk$(_oldRan_x: TokRan<URITok>) {
    return undefined;
  }

  protected override prelex$(): void {
    super.prelex$();
    this.#ctx = Ctx_.uri;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  #scanFragment(): void {
    this.#ctx = Ctx_.blanktail;

    if (this.curLoc$.ucod !== /* "#" */ 0x23) return;

    using poc = this.curLoc$.usingDup();
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      const n_ = peekIUPSCA(poc);
      if (n_ > 0) {
        poc.loff_$ += n_;
        continue;
      }

      const uc_ = poc.ucod;
      if (uc_ === /* "/" */ 0x2F || uc_ === /* "?" */ 0x3F) {
        poc.loff_$ += 1;
        continue;
      }

      break;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    this.outTk_1$.setStop(
      this.curLoc$.forwn(poc.loff_$ - this.curLoc$.loff_$),
      URITok.fragment,
    );
  }

  #scanQuery(): void {
    this.#ctx = Ctx_.fragment;

    if (this.curLoc$.ucod !== /* "?" */ 0x3F) return;

    using poc = this.curLoc$.usingDup();
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      let n_ = peekIUPSCA(poc);
      if (n_ > 0) {
        poc.loff_$ += n_;
        continue;
      }

      const li_ = poc.info_1;
      n_ = peekIPrivate(li_);
      if (n_ > 0) {
        poc.loff_$ += n_;
        continue;
      }

      if (li_.ucod === /* "/" */ 0x2F || li_.ucod === /* "?" */ 0x3F) {
        poc.loff_$ += 1;
        continue;
      }

      break;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    this.outTk_1$.setStop(
      this.curLoc$.forwn(poc.loff_$ - this.curLoc$.loff_$),
      URITok.query,
    );
  }

  #scanPathAbempty(): void {
    this.#ctx = Ctx_.query;

    using poc = this.curLoc$.usingDup();
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      if (poc.ucod !== /* "/" */ 0x2F) break;

      poc.loff_$ += 1;
      poc.loff_$ += peekSeqIUPSCA(poc);
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    const n_ = poc.loff_$ - this.curLoc$.loff_$;
    if (n_ > 0) {
      /* ipath-abempty = 1*( "/" isegment ) */
      this.outTk_1$.setStop(this.curLoc$.forwn(n_), URITok.path_abempty);
    }
  }

  #scanPathAbsolute(): void {
    this.#ctx = Ctx_.query;

    if (this.curLoc$.ucod !== /* "/" */ 0x2F) return;

    using poc = this.curLoc$.usingDup().forw();
    const n_ = peekSeqIUPSCA(poc);
    if (n_ === 0) {
      /* "/" */
      this.outTk_1$.setStop(this.curLoc$.forw(), URITok.path_absolute);
      return;
    }

    poc.loff_$ += n_;
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      if (poc.ucod !== /* "/" */ 0x2F) break;

      poc.loff_$ += 1;
      poc.loff_$ += peekSeqIUPSCA(poc);
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    /* ipath-absolute = "/" isegment-nz *( "/" isegment ) */
    this.outTk_1$.setStop(
      this.curLoc$.forwn(poc.loff_$ - this.curLoc$.loff_$),
      URITok.path_absolute,
    );
  }

  #scanPathNoscheme(): void {
    this.#ctx = Ctx_.query;

    using poc = this.curLoc$.usingDup();
    const n_ = peekSeqIUPSA(poc);
    if (n_ === 0) return;

    poc.loff_$ += n_;
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      if (poc.ucod !== /* "/" */ 0x2F) break;

      poc.loff_$ += 1;
      poc.loff_$ += peekSeqIUPSCA(poc);
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    /* ipath-noscheme = isegment-nz-nc *( "/" isegment ) */
    this.outTk_1$.setStop(
      this.curLoc$.forwn(poc.loff_$ - this.curLoc$.loff_$),
      URITok.path_noscheme,
    );
  }

  #scanPathRootless(): void {
    this.#ctx = Ctx_.query;

    using poc = this.curLoc$.usingDup();
    const n_ = peekSeqIUPSCA(poc);
    if (n_ === 0) return;

    poc.loff_$ += n_;
    const VALVE = 1_000;
    let valve = VALVE;
    while (--valve) {
      if (poc.ucod !== /* "/" */ 0x2F) break;

      poc.loff_$ += 1;
      poc.loff_$ += peekSeqIUPSCA(poc);
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    /* ipath-rootless = isegment-nz *( "/" isegment ) */
    this.outTk_1$.setStop(
      this.curLoc$.forwn(poc.loff_$ - this.curLoc$.loff_$),
      URITok.path_rootless,
    );
  }

  #scanPort(): void {
    this.#ctx = Ctx_.path_abempty;

    if (this.curLoc$.ucod !== /* ":" */ 0x3A) return;

    const loff_1 = frstNon(
      isDecimalDigit,
      this.curLoc$.line_$,
      this.curLoc$.loff_$ + 1,
    );
    this.outTk_1$.setStop(
      this.curLoc$.forwn(loff_1 - this.curLoc$.loff_$),
      URITok.port,
    );
  }

  #scanHost(): void {
    this.#ctx = Ctx_.port;

    const err4_a: Err[] = [];
    const n4_ = peekIPv4(this.curLoc$, err4_a);
    if (n4_ > 0 && err4_a.length === 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n4_), URITok.IPv4);
      return;
    }

    const err6_a: Err[] = [];
    const n6_ = peekIPv6(this.curLoc$, err6_a);
    if (n6_ > 0 && err6_a.length === 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n6_), URITok.IPv6);
      return;
    }

    const err7_a: Err[] = [];
    const n7_ = peekIPv7(this.curLoc$, err7_a);
    if (n7_ > 0 && err7_a.length === 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n7_), URITok.IPv7);
      return;
    }

    /* "first-match-wins" */
    if (n6_ > 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n6_), URITok.IPv6);
      for (let i = 0; i < err6_a.length; ++i) {
        this.outTk$!.setErr(err6_a[i]);
      }
      return;
    }
    if (n7_ > 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n7_), URITok.IPv7);
      for (let i = err7_a.length; i--;) {
        this.outTk$!.setErr(err7_a[i]);
      }
      return;
    }
    if (n4_ > 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n4_), URITok.IPv4);
      for (let i = err4_a.length; i--;) {
        this.outTk$!.setErr(err4_a[i]);
      }
      return;
    }
    /* ~ */

    const n_ = peekSeqIUPS(this.curLoc$);
    if (n_ > 0) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n_), URITok.regname);
    }
  }

  #scanAuthority(): void {
    const n_ = peekSeqIUPSC(this.curLoc$);
    if (this.curLoc$.peek_ucod(n_) === /* "@" */ 0x40) {
      this.outTk_1$.setStop(this.curLoc$.forwn(n_ + 1), URITok.userinfo);
      this.#ctx = Ctx_.host;
      return;
    }

    this.#scanHost();
  }

  #scanHierPart(): void {
    if (this.curLoc$.ucod === /* "/" */ 0x2F) {
      if (this.curLoc$.peek_ucod(1) === /* "/" */ 0x2F) {
        this.outTk_1$.setStop(this.curLoc$.forwn(2), URITok.twoslash);
        this.#ctx = Ctx_.authority;
        return;
      }

      this.#scanPathAbsolute();
    } else {
      this.#scanPathRootless();
    }
  }

  #scanURI(): void {
    if (this.curLoc$.ucod === /* "/" */ 0x2F) {
      if (this.curLoc$.peek_ucod(1) === /* "/" */ 0x2F) {
        this.outTk_1$.setStop(this.curLoc$.forwn(2), URITok.twoslash);
        this.#ctx = Ctx_.authority;
        return;
      }

      this.#scanPathAbsolute();
    } else {
      const n_ = peekScheme(this.curLoc$);
      if (n_ > 0 && this.curLoc$.peek_ucod(n_) === /* ":" */ 0x3A) {
        this.outTk_1$.setStop(this.curLoc$.forwn(n_ + 1), URITok.scheme);
        this.#ctx = Ctx_.hier_part;
        return;
      }

      this.#scanPathNoscheme();
    }
  }

  /** @implement */
  protected scan_impl$(): URITk | undefined {
    this.outTk$ = undefined;
    /* final switch */ ({
      [Ctx_.uri]: () => {
        if (
          isWhitespaceUCod(this.curLoc$.ucod, uriws_a) &&
          !this.skipWhitespace$(uriws_a)
        ) return;

        this.#scanURI();
      },
      [Ctx_.hier_part]: () => this.#scanHierPart(),
      [Ctx_.authority]: () => this.#scanAuthority(),
      [Ctx_.host]: () => this.#scanHost(),
      [Ctx_.port]: () => this.#scanPort(),
      [Ctx_.path_abempty]: () => this.#scanPathAbempty(),
      [Ctx_.query]: () => this.#scanQuery(),
      [Ctx_.fragment]: () => this.#scanFragment(),
      [Ctx_.blanktail]: () => {
        if (
          isWhitespaceUCod(this.curLoc$.ucod, uriws_a) &&
          !this.skipWhitespace$(uriws_a)
        ) return;

        this.stopLexTk$.setErr(Err.uri_invalid_tail);
        this.curLoc$.become_Loc(this.stopLexTk$.sntStrtLoc);
      },
    }[this.#ctx])();
    return this.outTk$;
  }
}
/*64----------------------------------------------------------*/

class URILexrFac_ extends Factory<URILexr> {
  #bart!: TokBart<URITok>;
  #strtLoff: loff_t = 0;
  #stopLoff: loff_t | undefined;
  setBart(
    bart_x: TokBart<URITok>,
    strtLoff_x: loff_t = 0,
    stopLoff_x?: loff_t,
  ): this {
    this.#bart = bart_x;
    this.#strtLoff = strtLoff_x;
    this.#stopLoff = stopLoff_x;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override createVal$(): URILexr {
    // /*#static*/ if (PRF) {
    //   console.log(
    //     `%c# of cached URILexr instances: ${this.val_a$.length + 1}`,
    //     `color:${LOG_cssc.performance}`,
    //   );
    // }
    return new URILexr(this.#bart, this.#strtLoff, this.#stopLoff);
  }

  protected override resetVal$(i_x: uint) {
    const ret = this.get(i_x);
    ret.destructor();
    return ret;
  }
  protected override reuseVal$(i_x: uint) {
    return this.get(i_x)
      .reset_Lexr(this.#bart, this.#strtLoff, this.#stopLoff);
  }
}
export const g_urilexr_fac = new URILexrFac_();
/*80--------------------------------------------------------------------------*/
