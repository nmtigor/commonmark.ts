/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/InlineBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import type {
  Constructor,
  int,
  lnum_t,
  loff_t,
  uint,
  uint16,
} from "@fe-lib/alias.ts";
import { assert, fail, out } from "@fe-lib/util/trace.ts";
import { INOUT } from "@fe-src/global.ts";
import type { LexdInfo } from "../../Lexr.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import { TokLoc } from "../../TokLoc.ts";
import { TokRan } from "../../TokRan.ts";
import { MdextTk } from "../../Token.ts";
import type { BrktOpen_LI, EmphDelim_LI, MdextLexr } from "../MdextLexr.ts";
import { MdextTok } from "../MdextTok.ts";
import { gathrUnrelTk } from "../util.ts";
import { Autolink } from "./Autolink.ts";
import { Block } from "./Block.ts";
import { IndentedCodeBlock } from "./CodeBlock.ts";
import { CodeInline } from "./CodeInline.ts";
import { Emphasis } from "./Emphasis.ts";
import { HTMLInline } from "./HTMLInline.ts";
import { Inline } from "./Inline.ts";
import { Link, type LinkMode } from "./Link.ts";
import { Linkdef } from "./Linkdef.ts";
import type { TokenSN } from "./TokenSN.ts";
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
  /**
   * @final
   * @primaryconst
   */
  get curStrtLoc() {
    return this.curTk_$.sntStrtLoc;
  }
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
  #getTokenBefo(
    tk_x = this.curTk_$,
    iSnt_x = this.iCurSnt_$,
  ): MdextTk | undefined {
    const retTk = tk_x.prevToken_$;
    if (!retTk) return undefined;

    let snt = this.host$.snt_a_$[iSnt_x];
    const tk_0 = snt instanceof Inline ? snt.frstToken : snt;
    if (tk_0.posSE(retTk)) return retTk;

    if (iSnt_x === 0) return undefined;

    snt = this.host$.snt_a_$[iSnt_x - 1];
    return snt instanceof Inline ? snt.lastToken : snt;
  }
  /** @final */
  get hasPrevTk(): boolean {
    return !!this.#getTokenBefo();
  }

  /** @see {@linkcode prevTk()} */
  #getTokenAftr(
    tk_x = this.curTk_$,
    iSnt_x = this.iCurSnt_$,
  ): MdextTk | undefined {
    const retTk = tk_x.nextToken_$;
    if (!retTk) return undefined;

    let snt = this.host$.snt_a_$[iSnt_x];
    const tk_1 = snt instanceof Inline ? snt.lastToken : snt;
    if (retTk.posSE(tk_1)) return retTk;

    if (iSnt_x === this.host$.snt_a_$.length - 1) return undefined;

    snt = this.host$.snt_a_$[iSnt_x + 1];
    return snt instanceof Inline ? snt.frstToken : snt;
  }
  /** @final */
  get hasNextTk(): boolean {
    return !!this.#getTokenAftr();
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

  /** @const @param _x */
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

  /** @headconst @param host_x */
  constructor(host_x: InlineBlock) {
    super(host_x.sntFrstLine, host_x.sntStrtLoff);
    this.host$ = host_x;
    this.tabsize$ = IndentedCodeBlock.indent;
  }
  static override create() {
    return fail("Disabled");
  }

  /** @final */
  reset_O(snt_x: MdextTk | Inline): this {
    this.toTk("strt", snt_x instanceof MdextTk ? snt_x : snt_x.frstToken);
    this.tailEmphDelim$ = undefined;
    this.tailBrktOpen$ = undefined;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * "Start Of Host"
   * @final
   * @const
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
        this.toLoc(this.#getTokenAftr(oldTk, this.iCurSnt_$)!.sntStrtLoc);
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
      this.toLoc(this.#getTokenBefo(oldTk, this.iCurSnt_$)!.sntStopLoc);
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
    const curTk = this.curTk_$;
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

  /** @const @param endp_x */
  toPrevTk(endp_x: "strt" | "stop"): this {
    const tk_ = this.#getTokenBefo();
    if (tk_) this.toTk(endp_x, tk_);
    else this.toTk("strt");
    return this;
  }
  /** @const @param endp_x */
  toNextTk(endp_x: "strt" | "stop"): this {
    const tk_ = this.#getTokenAftr();
    if (tk_) this.toTk(endp_x, tk_);
    else this.toTk("stop");
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
    if (args[5]) assert(self.posE(args[5]));
    else assert(self.posE(ret.sntStopLoc));
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
    using tkStrtLoc = (strtLoc_x ?? this).using();
    using tkStopLoc = this.using();
    tkStopLoc.loff = tkStrtLoc.loff_$ + size_t;
    let curTk = this.curTk_$;
    let nextTk = curTk.nextToken_$;
    if (nextTk?.sntStrtLoc.posS(tkStopLoc)) {
      /* Notice the difference here to `forwSetTks_inline()`, which will not
      remove token. */
      nextTk = curTk.removeSelf("next")!;
      nextTk.sntStrtLoc.become(curTk.sntStrtLoc);
      if (curTk === this.curSnt_$) {
        this.host$.snt_a_$.splice(this.iCurSnt_$, 1);
      }
      curTk = nextTk;
    }

    /** @primaryconst */
    const stopLoc = stopLoc_x ?? tkStopLoc;
    let ret;
    if (curTk.sntStrtLoc.posE(tkStrtLoc) && curTk.sntStopLoc.posE(stopLoc)) {
      let reusd = false;
      if (lexr_x.reusdSnt_sa_$.includes(curTk)) {
        lexr_x.reusdSnt_sa_$.delete(curTk);
        lexr_x._reusdSnt_2_sa.add(curTk);
        if (curTk.value === value_x && curTk.sntStopLoc.posE(tkStopLoc)) {
          reusd = true;
        }
      } else if (
        lexr_x._reusdSnt_2_sa.includes(curTk) &&
        curTk.value === value_x && curTk.sntStopLoc.posE(tkStopLoc)
      ) {
        reusd = true;
      }
      if (!reusd) {
        curTk.reset(value_x, tkStrtLoc, tkStopLoc);
      }
      ret = curTk;
      this.become(stopLoc);
    } else {
      ret = new MdextTk(lexr_x, new TokRan(this.dup()), value_x)
        .syncRanvalAnchr() //!
        .setStop(tkStopLoc);
      this.become(stopLoc);
      this.host$.splice_$(ret, tkStrtLoc);
    }
    this.refresh();

    if (lexdInfo_x !== undefined) ret.lexdInfo = lexdInfo_x;
    return ret;
  }

  /**
   * Prerequisites: All Snt from `this` to `stopLoc_x` are end-to-end `MdextTk`s.
   * @headconst @param lexr_x
   * @const @param value_x
   * @out @param outTk_a_x
   * @primaryconst @param stopLoc_x
   */
  @out((_, self: ILoc, args) => {
    assert(args[2].length);
    const stopLoc = args[2].at(-1)!.sntStopLoc;
    assert(stopLoc.posE(args[3]));
    assert(stopLoc.posE(self));
  })
  forwSetTks_inline(
    lexr_x: MdextLexr,
    value_x: MdextTok,
    outTk_a_x: MdextTk[],
    stopLoc_x: Loc,
  ): void {
    /*#static*/ if (INOUT) {
      assert(this.posS_inline(stopLoc_x));
    }
    const VALVE = 1_000;
    let valve = VALVE;
    for (
      const iI = this.host$.snt_a_$.length;
      this.iCurSnt_$ < iI && --valve;
    ) {
      const tk_i = this.curSnt_$;
      /*#static*/ if (INOUT) {
        assert(tk_i instanceof MdextTk && this.posE(tk_i.sntStrtLoc));
      }
      if (tk_i.touch(stopLoc_x)) {
        outTk_a_x.push(
          this.setCurTk(lexr_x, stopLoc_x.loff_$ - this.loff_$, value_x),
        );
        break;
      } else {
        outTk_a_x.push(
          this.setCurTk(lexr_x, (tk_i as MdextTk).length_1, value_x),
        );
        //jjjj TOCLEANUP
        // if (this.atEol) break;
      }
    }
    assert(valve, `Loop ${VALVE}±1 times`);
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
    super.reset();
    this.children$ = undefined; //!
    this.snt_a_$.length = 0;
    return this;
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

    iloc.reset_O(snt_a[i_]);

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
   * @headconst @param lablTk_a_x
   * @headconst @param destPart_x
   * @headconst @param titlTk_a_x
   */
  addLinkdef(
    lablTk_a_x: MdextTk[],
    destPart_x: MdextTk[],
    titlTk_a_x: MdextTk[] | undefined,
  ): Linkdef {
    const snt_a = this.snt_a_$;
    const frstTk = lablTk_a_x[0];
    const lastTk = titlTk_a_x?.at(-1) ?? destPart_x.at(-1)!;
    let iLastTk = snt_a.length;
    for (; iLastTk--;) if (snt_a[iLastTk] === lastTk) break;
    let iFrstTk = iLastTk;
    for (; iFrstTk--;) if (snt_a[iFrstTk] === frstTk) break;
    if (iFrstTk === 0 || iLastTk === snt_a.length - 1) this.invalidateBdry();

    for (let i = iFrstTk; i <= iLastTk; ++i) {
      const snt_i = snt_a[i];
      if (
        snt_i instanceof MdextTk &&
        snt_i.value === MdextTok.chunk && !snt_i.lexdInfo
      ) {
        snt_i.removeSelf();
      }
    }

    const sn_ = new Linkdef(lablTk_a_x, destPart_x, titlTk_a_x);
    sn_.parent_$ = this;
    snt_a.splice(iFrstTk, iLastTk - iFrstTk + 1, sn_);
    this.children$ = undefined;
    this.#correct_iCurSnt(iFrstTk, iLastTk);
    return sn_;
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
   * @const @param linkMode_x
   * @const @param normdLabel_x
   * @headconst @param frstTk_x
   * @headconst @param textClozTk_x
   * @headconst @param lastTk_x
   * @headconst @param lablTk_a_x
   * @headconst @param destTPart_x
   * @headconst @param titlTk_a_x
   */
  addLink(
    linkMode_x: LinkMode,
    normdLabel_x: string | undefined,
    frstTk_x: MdextTk,
    textClozTk_x: MdextTk,
    lastTk_x: MdextTk,
    lablTk_a_x?: MdextTk[],
    destTPart_x?: MdextTk[],
    titlTk_a_x?: MdextTk[],
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

    for (let i = iFrstTk; i <= iLastTk; ++i) {
      const snt_i = snt_a[i];
      if (
        snt_i instanceof MdextTk &&
        snt_i.value === MdextTok.chunk && !snt_i.lexdInfo
      ) {
        snt_i.removeSelf();
      }
    }

    const sn_ = new Link(
      linkMode_x,
      normdLabel_x,
      snt_a.slice(iFrstTk, iTextCloz + 1),
      lastTk_x,
      lablTk_a_x,
      destTPart_x,
      titlTk_a_x,
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
      assert(
        curTk.sntStrtLoc.posSE(strtLoc) &&
          strtLoc.posSE(tk_x.sntStrtLoc) &&
          tk_x.sntStopLoc.posSE(stopILoc) &&
          stopILoc.posSE(curTk.sntStopLoc),
      );
      /* Handled in `ILoc.setToken()` */
      assert(
        !(curTk.sntStrtLoc.posE(strtLoc) && stopILoc.posE(curTk.sntStopLoc)),
      );
    }
    let ret: MdextTk;
    const snt_a = this.snt_a_$;
    if (curTk.sntStrtLoc.posE(strtLoc)) {
      curTk.setStrt(stopILoc);
      curTk.insertPrev(tk_x);
      snt_a.splice(stopILoc.iCurSnt_$, 0, tk_x);
      ret = tk_x;
      ++stopILoc.iCurSnt_$; //!
    } else if (stopILoc.posE(curTk.sntStopLoc)) {
      curTk.setStop(strtLoc);
      curTk.insertNext(tk_x);
      snt_a.splice(stopILoc.iCurSnt_$ + 1, 0, tk_x);
      ret = tk_x;
      stopILoc.toTk("stop", tk_x); //!
    } else {
      const tk_ = curTk.dup()
        .syncRanvalAnchr() //!
        .setStop(strtLoc);
      curTk.setStrt(stopILoc);
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
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    let ret = 0;
    for (const snt of this.snt_a_$) {
      if (snt instanceof MdextTk) {
        ret += gathrUnrelTk(snt, drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      } else {
        ret += snt.gathrUnrelSnt(drtStrtLoc_x, drtStopLoc_x, unrelSnt_sa_x);
      }
    }
    return ret;
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    //jjjj TOCLEANUP
    // const i_ = this.snt_a_$.findIndex((snt) => loc_x.posE(snt.sntStrtLoc));
    const i_ = this.snt_a_$.findIndex((snt) =>
      loc_x.line_$ === snt.sntFrstLine
    );
    return i_ >= 0 ? this.snt_a_$[i_].sntFrstLidx_1 : -1;
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: (MdextTk | Inline)[]) {
    for (const snt of this.snt_a_$) {
      const lidx = snt.sntFrstLidx_1;
      if (lidx > lidx_x) break;
      if (lidx === lidx_x) {
        snt_a_x.push(snt);
        if (snt instanceof Inline) snt.ensureAllBdry(); //!
      }
    }
  }

  //jjjj TOCLEANUP
  // /**
  //  * If return true, `iloc` is moved to the end of Linkdef.\
  //  * If return false, `iloc` is unchanged.
  //  * @headconst @const lexr_x
  //  */
  // reuseLinkdef(lexr_x: MdextLexr): boolean {
  //   if (lexr_x.reusdSnt_sa_$.n_Linkdef === 0) return false;

  //   const iloc = this.iloc;
  //   const curSnt = iloc.curSnt_$;
  //   if (!(curSnt instanceof Linkdef)) return false;

  //   let reusd = false;
  //   using loc_fb = iloc.using();
  //   if (lexr_x.reusdSnt_sa_$.includes(curSnt)) {
  //     lexr_x.reusdSnt_sa_$.delete(curSnt);
  //     iloc.toSnt("stop");
  //     if (blankEnd(iloc)) {
  //       lexr_x._reusdSnt_2_sa.add(curSnt);
  //       reusd = true;
  //     } else {
  //       lexr_x.abadnSnt_sa_$.add(curSnt);
  //       iloc.toLoc(loc_fb);
  //     }
  //   }
  //   return reusd;
  // }
}
/*80--------------------------------------------------------------------------*/
