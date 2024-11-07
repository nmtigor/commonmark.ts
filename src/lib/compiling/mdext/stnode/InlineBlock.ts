/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/InlineBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Constructor, int, loff_t, uint, uint16 } from "@fe-lib/alias.ts";
import { assert, fail, out } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { LexdInfo } from "../../Lexr.ts";
import type { Loc } from "../../Loc.ts";
import { TokRan } from "../../TokRan.ts";
import { TokLoc } from "../../TokLoc.ts";
import { MdextTk } from "../../Token.ts";
import type { BrktOpen_LI, EmphDelim_LI, MdextLexr } from "../MdextLexr.ts";
import { MdextTok } from "../MdextTok.ts";
import { Autolink } from "./Autolink.ts";
import { Block } from "./Block.ts";
import { IndentedCodeBlock } from "./CodeBlock.ts";
import { CodeInline } from "./CodeInline.ts";
import { Emphasis } from "./Emphasis.ts";
import { HTMLInline } from "./HTMLInline.ts";
import { Inline } from "./Inline.ts";
import { Link, type LinkMode } from "./Link.ts";
import type { TokenSN } from "./TokenSN.ts";
import { Linkdef } from "./Linkdef.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import type { SortedStnod_id } from "../../Stnode.ts";
/*80--------------------------------------------------------------------------*/

/**
 * primaryconst: const exclude +`#poc`,`iCurSnt_$`
 */
export class ILoc extends TokLoc<MdextTok> {
  protected readonly host$;
  get host() {
    return this.host$;
  }
  // get snt_a() :(MdextTk | Inline)[]{
  //   return this.host$.snt_a_$;
  // }

  #poc: ILoc | undefined;
  private get _poc() {
    return this.#poc ??= new ILoc(this.host);
  }

  /* iCurSnt_$ */
  iCurSnt_$: uint = 0;
  get valid() {
    return 0 <= this.iCurSnt_$ && this.iCurSnt_$ < this.host$.snt_a_$.length;
  }

  /**
   * @final
   * @const
   */
  get curSnt_$(): MdextTk | Inline {
    return this.host$.snt_a_$[this.iCurSnt_$];
  }

  /**
   * ! Set `line_$`, `loff_$` correct (by e.g. `become()`) first, then call
   * this. Otherwise `snt.tokenAt()` could fail.\
   * `in( this.valid )`
   * @final
   * @primaryconst
   */
  get curTk_$(): MdextTk {
    const snt = this.host$.snt_a_$.at(this.iCurSnt_$)!;
    return snt instanceof Inline ? snt.tokenAt(this) : snt;
  }
  // /**
  //  * @final
  //  * @primaryconst
  //  */
  // get curStrtLoc() {
  //   return this.curTk_$.strtLoc;
  // }
  /**
   * @final
   * @primaryconst
   */
  get curStopLoc() {
    return this.curTk_$.sntStopLoc;
  }

  /**
   * Not rely on `iCurSnt_$`, and not change `iCurSnt_$`.
   * @final
   * @primaryconst
   * @headconst @param tk_x MUST be valid with `iSnt_x`
   * @const @param iSnt_x MUST be valid
   */
  getTokenBefo(tk_x: MdextTk, iSnt_x: uint): MdextTk | undefined {
    const tk_ = tk_x.prevToken_$;
    if (!tk_) return undefined;

    let snt = this.host$.snt_a_$[iSnt_x];
    const tk_0 = snt instanceof Inline ? snt.frstToken : snt;
    if (tk_0.posSE(tk_)) return tk_;

    if (iSnt_x === 0) return undefined;

    snt = this.host$.snt_a_$[iSnt_x - 1];
    return snt instanceof Inline ? snt.lastToken : snt;
  }
  /** @see {@linkcode prevTk())} */
  getTokenAftr(tk_x: MdextTk, iSnt_x: uint): MdextTk | undefined {
    const tk_ = tk_x.nextToken_$;
    if (!tk_) return undefined;

    let snt = this.host$.snt_a_$[iSnt_x];
    const tk_1 = snt instanceof Inline ? snt.lastToken : snt;
    if (tk_.posSE(tk_1)) return tk_;

    if (iSnt_x === this.host$.snt_a_$.length - 1) return undefined;

    snt = this.host$.snt_a_$[iSnt_x + 1];
    return snt instanceof Inline ? snt.frstToken : snt;
  }
  /* ~ */

  /* tailEmphDelim$ */
  protected tailEmphDelim$: EmphDelim_LI | undefined;
  get tailEmphDelim(): EmphDelim_LI | undefined {
    return this.tailEmphDelim$;
  }
  set tailEmphDelim(_x: EmphDelim_LI) {
    if (this.tailEmphDelim$) this.tailEmphDelim$.insertNext(_x);
    this.tailEmphDelim$ = _x;
  }
  /* ~ */

  removeEmphDelim(_x: EmphDelim_LI): void {
    if (_x.prev) {
      _x.prev.next = _x.next;
    }
    if (_x.next) {
      _x.next.prev = _x.prev;
    } else {
      /* top of stack */
      this.tailEmphDelim$ = _x.prev;
    }
  }
  removeEdLIBetween(bot_x: EmphDelim_LI, top_x: EmphDelim_LI): void {
    if (bot_x.next !== top_x) {
      bot_x.next = top_x;
      top_x.prev = bot_x;
    }
  }

  /* tailBrktOpen$ */
  protected tailBrktOpen$: BrktOpen_LI | undefined;
  get tailBrktOpen(): BrktOpen_LI | undefined {
    return this.tailBrktOpen$;
  }
  set tailBrktOpen(_x: BrktOpen_LI) {
    if (this.tailBrktOpen$) this.tailBrktOpen$.insertNext(_x);
    this.tailBrktOpen$ = _x;
  }
  /* ~ */

  removeBrktOpen(_x: BrktOpen_LI): void {
    if (_x.prev) {
      _x.prev.next = _x.next;
    }
    if (_x.next) {
      _x.next.prev = _x.prev;
    } else {
      /* top of stack */
      this.tailBrktOpen$ = _x.prev;
    }
  }

  /**
   * @headconst @param host_x
   */
  constructor(host_x: InlineBlock) {
    super(host_x.sntFrstLine, host_x.sntStrtLoff);
    this.host$ = host_x;
    this.tabsize$ = IndentedCodeBlock.indent;
  }
  static override create() {
    return fail("Disabled");
  }

  /** @final */
  reset_O(tk_x: MdextTk): this {
    this.toTk("strt", tk_x);
    this.tailEmphDelim$ = undefined;
    this.tailBrktOpen$ = undefined;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @const
   * "Start Of Host"
   */
  get aheadSoh(): boolean {
    if (this.host$.snt_a_$.length) {
      return this.posS(this.host$.snt_a_$[0].sntStrtLoc);
    } else {
      return true;
    }
  }
  /**
   * @final
   * @const
   */
  get reachEoh(): boolean {
    if (this.host$.snt_a_$.length) {
      return this.posGE(this.host$.snt_a_$.at(-1)!.sntStopLoc);
    } else {
      return true;
    }
  }

  /** @final */
  override get ucod(): uint16 {
    return this.reachEoh || this.aheadSoh ? 0 as uint16 : super.ucod;
  }

  /**
   * Update `iCurSnt_$`
   * @final
   */
  override forw(): this {
    const oldTk = this.curTk_$;
    super.forw();
    if (this.reachEol || this.reachEoh) return this;

    if (this.posGE(oldTk.sntStopLoc)) {
      if (
        this.posG(oldTk.sntStopLoc) ||
        oldTk.sntLastLine === this.curTk_$.sntFrstLine
      ) {
        this.toLoc(this.getTokenAftr(oldTk, this.iCurSnt_$)!.sntStrtLoc);
      }
    }
    return this;
  }
  /** @see {@linkcode forw())} */
  override back(): this {
    const oldTk = this.curTk_$;
    super.back();
    if (this.atEol || this.aheadSoh) return this;

    if (this.posS(oldTk.sntStrtLoc)) {
      this.toLoc(this.getTokenBefo(oldTk, this.iCurSnt_$)!.sntStopLoc);
      if (oldTk.sntFrstLine === this.curTk_$.sntLastLine) {
        super.back();
      }
    }
    return this;
  }

  override peek_uchr(): string {
    fail("Disabled");
  }
  /** @primaryconst */
  override peek_ucod(n_x: int): uint16 {
    const poc = this._poc.toLoc(this);
    if (n_x >= 0) poc.forwn(n_x);
    else poc.backn(-n_x);
    return poc.ucod;
  }

  /**
   * Update `iCurSnt_$`
   * @final
   * @primaryconst
   */
  refresh(): void {
    let curTk = this.curTk_$;
    if (this.posE(curTk.sntStopLoc) && !this.reachEoh) {
      const nextSnt = this.host$.snt_a_$[this.iCurSnt_$ + 1];
      if (this.posE(nextSnt.sntStrtLoc)) {
        ++this.iCurSnt_$;
      }
    }
  }

  /**
   * Update `iCurSnt_$`\
   * `loc_x` MUST be contained `host`.
   * @final
   * @primaryconst @param loc_x
   */
  toLoc(loc_x: Loc): this {
    const snt_a = this.host$.snt_a_$;
    let i_ = snt_a.length;
    for (; i_--;) {
      const snt = snt_a[i_];
      if (snt.touch(loc_x)) {
        this.iCurSnt_$ = i_;
        break;
      }
    }
    return super.become(loc_x);
  }

  /**
   * `tk_x` MUST be part of `host`.
   * @final
   * @const @param endp_x
   * @param tk_x
   */
  toTk(endp_x: "strt" | "stop", tk_x = this.curTk_$): this {
    if (this.valid && tk_x === this.curTk_$) {
      this.become(endp_x === "strt" ? tk_x.sntStrtLoc : tk_x.sntStopLoc);
    } else {
      this.toLoc(endp_x === "strt" ? tk_x.sntStrtLoc : tk_x.sntStopLoc);
    }
    return this;
  }

  /**
   * @const @param endp_x
   */
  toNextTk(endp_x: "strt" | "stop"): this {
    const tk_ = this.getTokenAftr(this.curTk_$, this.iCurSnt_$);
    if (tk_) this.toTk(endp_x, tk_);
    else this.toTk("stop");
    return this;
  }
  /**
   * @const @param endp_x
   */
  toPrevTk(endp_x: "strt" | "stop"): this {
    const tk_ = this.getTokenBefo(this.curTk_$, this.iCurSnt_$);
    if (tk_) this.toTk(endp_x, tk_);
    else this.toTk("strt");
    return this;
  }

  /**
   * `snt_x` MUST be part of `host`.
   * @final
   * @const @param endp_x
   * @primaryconst @param snt_x
   */
  toSnt(endp_x: "strt" | "stop", snt_x = this.curSnt_$): this {
    if (snt_x === this.curSnt_$) {
      this.become(endp_x === "strt" ? snt_x.sntStrtLoc : snt_x.sntStopLoc);
    } else {
      this.toLoc(endp_x === "strt" ? snt_x.sntStrtLoc : snt_x.sntStopLoc);
    }
    return this;
  }

  @out((ret, self: ILoc) => {
    assert(ret || self.reachEoh);
  })
  forwNextLine_$(): boolean {
    const snt_a = this.host$.snt_a_$;
    let tk_ = this.curTk_$;
    const curLn = tk_.sntFrstLine;
    for (let i = this.iCurSnt_$ + 1, iI = snt_a.length; i < iI; ++i) {
      tk_ = snt_a[i] as MdextTk;
      if (tk_.sntFrstLine !== curLn) {
        this.toLoc(tk_.sntStrtLoc);
        return true;
      }
    }
    this.toLoc(tk_.sntStopLoc);
    return false;
  }

  /**
   * @final
   * @headconst @param lexr_x
   * @const @param size_t
   * @const @param value_x
   * @const @param lexdInfo_x
   * @primaryconst @param strtLoc_x
   * @primaryconst @param stopLoc_x
   */
  @out((ret, self: ILoc, args) => {
    if (args[5]) {
      assert(self.posE(args[5]));
    } else {
      assert(self.posE(ret.sntStopLoc));
    }
  })
  setCurTk(
    lexr_x: MdextLexr,
    size_t: loff_t,
    value_x: MdextTok,
    lexdInfo_x?: LexdInfo | null,
    strtLoc_x?: Loc,
    stopLoc_x?: Loc,
  ): MdextTk {
    /*#static*/ if (INOUT) {
      assert(size_t > 0);
    }
    /** @primaryconst */
    using strtLoc = (strtLoc_x ?? this).using();
    using tkStopLoc = this.using();
    tkStopLoc.loff += size_t;
    /** @primaryconst */
    const stopLoc = stopLoc_x ?? tkStopLoc;
    let ret;
    const curTk = this.curTk_$;
    if (curTk.sntStrtLoc.posE(strtLoc) && stopLoc.posE(curTk.sntStopLoc)) {
      curTk.reset(value_x, this, tkStopLoc);
      ret = curTk;
      this.become(stopLoc).refresh();
    } else {
      ret = new MdextTk(lexr_x, new TokRan(this.dup()), value_x);
      ret.setStopLoc(tkStopLoc);
      this.become(stopLoc);
      this.host$.splice_$(ret, strtLoc);
    }

    if (lexdInfo_x !== undefined) ret.lexdInfo = lexdInfo_x;
    return ret;
  }

  /**
   * "forw" means no `Inline`, all (after `this`) are `MdextTk`.
   * @headconst @param lexr_x
   * @const @param value_x
   * @out @param outTk_a_x
   * @primaryconst @param stopLoc_x
   */
  @out((_, self: ILoc, args) => {
    assert(args[2].length);
    const stopLoc = args[2].at(-1)!.sntStopLoc;
    if (args[3]) {
      assert(stopLoc.posE(args[3]));
    } else {
      assert(stopLoc.atEol);
    }
    assert(stopLoc.posE(self));
  })
  forwSetTks_inline(
    lexr_x: MdextLexr,
    value_x: MdextTok,
    outTk_a_x: MdextTk[],
    stopLoc_x?: Loc,
  ): void {
    /*#static*/ if (INOUT) {
      assert(!stopLoc_x || this.posS_inline(stopLoc_x));
    }
    for (const iI = this.host$.snt_a_$.length; this.iCurSnt_$ < iI;) {
      const tk_i = this.curSnt_$;
      /*#static*/ if (INOUT) {
        assert(this.posE(tk_i.sntStrtLoc));
        assert(tk_i instanceof MdextTk);
      }
      if (stopLoc_x && tk_i.touch(stopLoc_x)) {
        outTk_a_x.push(
          this.setCurTk(lexr_x, stopLoc_x.loff_$ - this.loff_$, value_x),
        );
        break;
      } else {
        outTk_a_x.push(
          this.setCurTk(lexr_x, (tk_i as MdextTk).length_1, value_x),
        );
        if (this.atEol) break;
      }
    }
  }

  forwTextBelow(): string {
    return this.host$.forwTextBelow(this.iCurSnt_$);
  }
}
/*80--------------------------------------------------------------------------*/

export abstract class InlineBlock extends Block {
  abstract get iloc(): ILoc;

  readonly snt_a_$: (MdextTk | Inline)[] = [];

  override get children(): Inline[] {
    if (this.children$) return this.children$ as Inline[];

    const ret: Inline[] = [];
    for (const snt of this.snt_a_$) {
      if (snt instanceof Inline) ret.push(snt);
    }
    return this.children$ = ret;
  }

  override reset(): this {
    this.snt_a_$.length = 0;
    return super.reset();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  protected override inline_impl$(lexr_x: MdextLexr): void {
    const iloc = this.iloc;

    const snt_a = this.snt_a_$;
    let i_ = 0;
    const iI = snt_a.length;
    for (; i_ < iI; ++i_) if (!(snt_a[i_] instanceof Linkdef)) break;
    if (i_ === iI) return;

    //jjjj TOCLEANUP
    // /*#static*/ if (INOUT) {
    //   assert(snt_a[i_] instanceof MdextTk);
    // }
    iloc.reset_O(snt_a[i_] as MdextTk);

    const VALVE = 1_000;
    let valve = VALVE;
    while (lexr_x.lexInline_$(iloc) && --valve);
    assert(valve, `Loop ${VALVE}±1 times`);
    lexr_x.lexEmphasis_$(iloc);
  }

  /**
   * @const @param iFrstTk_x
   * @const @param iLastTk_x
   */
  #correct_iCurSnt(iFrstTk_x: uint, iLastTk_x: uint) {
    const iloc = this.iloc;
    if (iFrstTk_x < iloc.iCurSnt_$ && iloc.iCurSnt_$ < iLastTk_x) {
      iloc.iCurSnt_$ = iFrstTk_x;
    } else if (iLastTk_x <= iloc.iCurSnt_$) {
      iloc.iCurSnt_$ -= (iLastTk_x - iFrstTk_x + 1) - 1;
    }
  }

  /**
   * @final
   * @headconst @param labelTk_a
   * @headconst @param destTk_a
   * @headconst @param titleTk_a
   */
  addLinkdef(
    labelTk_a: MdextTk[],
    destTk_a: MdextTk[],
    titleTk_a: MdextTk[] | undefined,
  ): void {
    const snt_a = this.snt_a_$;
    const frstTk = labelTk_a[0];
    const lastTk = titleTk_a?.at(-1) ?? destTk_a.at(-1)!;
    let iLastTk = snt_a.length;
    for (; iLastTk--;) if (snt_a[iLastTk] === lastTk) break;
    let iFrstTk = iLastTk;
    for (; iFrstTk--;) if (snt_a[iFrstTk] === frstTk) break;

    for (let i = iFrstTk; i <= iLastTk; ++i) {
      const tk_i = snt_a[i] as MdextTk;
      if (tk_i.value === MdextTok.chunk && !tk_i.lexdInfo) {
        tk_i.removeSelf();
      }
    }

    const sn_ = new Linkdef(labelTk_a, destTk_a, titleTk_a);
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }

  /**
   * @fianl
   * @headconst @param tk_x
   * @headconst @param SN_x
   */
  addTokenSN(tk_x: MdextTk, SN_x: Constructor<TokenSN>): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(tk_x);
    /*#static*/ if (INOUT) {
      assert(0 <= iFrstTk);
    }
    if (iFrstTk === 0 || iFrstTk >= snt_a.length - 1) this.invalidateBdry();

    const sn_ = new SN_x(tk_x);
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, 1, sn_);
    this.children$ = undefined;
  }

  /** @see {@linkcode addEmphasis()} */
  addCodeInline(frstTk_x: MdextTk, lastTk_x: MdextTk): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(frstTk_x);
    let iLastTk = iFrstTk + 1;
    const iI = snt_a.length;
    for (; iLastTk < iI; ++iLastTk) if (snt_a[iLastTk] === lastTk_x) break;
    /*#static*/ if (INOUT) {
      assert(0 <= iFrstTk && iLastTk < iI);
    }
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    const sn_ = new CodeInline(
      frstTk_x,
      lastTk_x,
      snt_a.slice(iFrstTk + 1, iLastTk) as MdextTk[],
    );
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }

  /**
   * `in( this.snt_a_$.length )`
   * @final
   * @headconst @param frstTk_x
   * @headconst @param lastTk_x
   */
  addEmphasis(frstTk_x: MdextTk, lastTk_x: MdextTk): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(frstTk_x);
    let iLastTk = iFrstTk + 1;
    const iI = snt_a.length;
    for (; iLastTk < iI; ++iLastTk) if (snt_a[iLastTk] === lastTk_x) break;
    /*#static*/ if (INOUT) {
      assert(0 <= iFrstTk && iLastTk < iI);
    }
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    const sn_ = new Emphasis(
      frstTk_x,
      lastTk_x,
      snt_a.slice(iFrstTk + 1, iLastTk),
    );
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }

  /**
   * `in( this.snt_a_$.length )`
   * @final
   * @const @param linkmode_x
   * @headconst @param frstTk_x
   * @headconst @param textClozTk_x
   * @headconst @param lastTk_x
   * @headconst @param destTk_a_x
   * @headconst @param titleTk_a_x
   */
  addLink(
    linkmode_x: LinkMode,
    frstTk_x: MdextTk,
    textClozTk_x: MdextTk,
    lastTk_x: MdextTk,
    destTk_a_x?: MdextTk[],
    titleTk_a_x?: MdextTk[],
  ): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(frstTk_x);
    let iTextCloz = iFrstTk + 1;
    let iLastTk = iTextCloz;
    const iI = snt_a.length;
    for (; iLastTk < iI; ++iLastTk) {
      const snt = snt_a[iLastTk];
      if (snt === textClozTk_x) iTextCloz = iLastTk;
      if (snt === lastTk_x) break;
    }
    /*#static*/ if (INOUT) {
      assert(0 <= iFrstTk && iLastTk < iI);
    }
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    const sn_ = new Link(
      linkmode_x,
      frstTk_x,
      snt_a.slice(iFrstTk + 1, iTextCloz),
      lastTk_x,
      destTk_a_x,
      titleTk_a_x,
    );
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }

  /**
   * @final
   * @headconst @param frstTk_x
   * @headconst @param destTk_a_x
   * @headconst @param lastTk_x
   * @const @param isEmail_x
   */
  addAutolink(
    frstTk_x: MdextTk,
    destTk_a_x: MdextTk[],
    lastTk_x: MdextTk,
    isEmail_x: boolean,
  ): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(frstTk_x);
    const iLastTk = iFrstTk + destTk_a_x.length + 1;
    /*#static*/ if (INOUT) {
      assert(
        0 <= iFrstTk &&
          snt_a[iFrstTk + 1] === destTk_a_x[0] &&
          snt_a[iLastTk] === lastTk_x,
      );
    }
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    const sn_ = new Autolink(frstTk_x, destTk_a_x, lastTk_x, isEmail_x);
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }

  /**
   * @final
   * @headconst @param frstTk_x
   * @headconst @param chunkTk_a_x
   * @headconst @param lastTk_x
   */
  addHTMLInline(
    frstTk_x: MdextTk,
    chunkTk_a_x: MdextTk[],
    lastTk_x: MdextTk,
  ): void {
    const snt_a = this.snt_a_$;
    const iFrstTk = snt_a.indexOf(frstTk_x);
    const iLastTk = iFrstTk + chunkTk_a_x.length + 1;
    /*#static*/ if (INOUT) {
      assert(
        0 <= iFrstTk &&
          snt_a[iFrstTk + 1] === chunkTk_a_x[0] &&
          snt_a[iLastTk] === lastTk_x,
      );
    }
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    const sn_ = new HTMLInline(frstTk_x, chunkTk_a_x, lastTk_x);
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * `in( this.snt_a_$.length )`
   * @final
   * @headconst @param tk_x
   * @primaryconst @param strtLoc_x
   */
  splice_$(tk_x: MdextTk, strtLoc_x?: Loc): MdextTk {
    /** @primaryconst */
    const stopILoc = this.iloc;
    const curTk = stopILoc.curTk_$;
    const strtLoc = strtLoc_x ?? curTk.sntStrtLoc;
    /*#static*/ if (INOUT) {
      assert(strtLoc.posSE(tk_x.sntStrtLoc) && tk_x.sntStopLoc.posSE(stopILoc));
      assert(stopILoc.posSE(curTk.sntStopLoc));
      /* Handled in `ILoc.setToken()` */
      assert(
        !(curTk.sntStrtLoc.posE(strtLoc) && stopILoc.posE(curTk.sntStopLoc)),
      );
    }
    let ret: MdextTk;
    const snt_a = this.snt_a_$;
    if (curTk.sntStrtLoc.posE(strtLoc)) {
      curTk.setStrtLoc(stopILoc);
      curTk.insertPrev(tk_x);
      snt_a.splice(stopILoc.iCurSnt_$, 0, tk_x);
      ret = tk_x;
      ++stopILoc.iCurSnt_$; //!
    } else if (stopILoc.posE(curTk.sntStopLoc)) {
      curTk.setStopLoc(strtLoc);
      curTk.insertNext(tk_x);
      snt_a.splice(stopILoc.iCurSnt_$ + 1, 0, tk_x);
      ret = tk_x;
      stopILoc.toTk("stop", tk_x); //!
    } else {
      const tk_ = curTk.dup();
      tk_.setStopLoc(strtLoc);
      curTk.setStrtLoc(stopILoc);
      curTk.insertPrev(tk_x).insertPrev(tk_);
      snt_a.splice(stopILoc.iCurSnt_$, 0, tk_, tk_x);
      ret = tk_x;
      stopILoc.iCurSnt_$ += 2; //!
    }
    return ret;
  }

  /**
   * jjjj If needed, could cache to optimize
   * @const
   * @const @param i_x
   */
  forwTextBelow(i_x: uint): string {
    const snt_a = this.snt_a_$;
    /*#static*/ if (INOUT) {
      assert(0 <= i_x && i_x < snt_a.length);
    }
    let tk_ = snt_a[i_x];
    let curLn = tk_.sntFrstLine;
    const s_a: string[] = [];
    for (let j = i_x + 1, jJ = snt_a.length; j < jJ; ++j) {
      tk_ = snt_a[j];
      const ln_ = tk_.sntFrstLine;
      if (ln_ !== curLn) {
        curLn = ln_;
        s_a.push(curLn.text.slice(tk_.sntStrtLoff));
      }
    }
    return s_a.join("\n");
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    _unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    for (const snt of this.snt_a_$) {
      if (
        snt.sntStopLoc.posSE(drtStrtLoc_x) ||
        snt.sntStrtLoc.posGE(drtStopLoc_x)
      ) unrelSnt_sa_x.add(snt);
    }
  }
}
/*80--------------------------------------------------------------------------*/
