/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextLexr
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/preNs.ts";
import type { lcol_t, lnum_t, loff_t, uint, uint16 } from "../../alias.ts";
import { assert, fail, out } from "../../util.ts";
import {
  isASCIIControl,
  isASCIILetter,
  isDecimalDigit,
  isLFOr0,
  isSpaceOrTab,
  isWhitespaceUCod,
} from "../../util/string.ts";
import { LexdInfo, Lexr } from "../Lexr.ts";
import type { Line } from "../Line.ts";
import type { Loc } from "../Loc.ts";
import { g_ran_fac } from "../RanFac.ts";
import { type Snt, SortedSnt_id } from "../Snt.ts";
import { TokBart } from "../TokBart.ts";
import { MdextTk, Token } from "../Token.ts";
import { Err } from "../alias.ts";
import { g_urilexr_fac, URILexr } from "../uri/URILexr.ts";
import { g_uripazr_fac, URIPazr } from "../uri/URIPazr.ts";
import type { URITok } from "../uri/URITok.ts";
import type { URI } from "../uri/stnode/URI.ts";
import { isURIHead } from "../uri/util.ts";
import { lastNon } from "../util.ts";
import type { MdextBufr } from "./MdextBufr.ts";
import { MdextPazr } from "./MdextPazr.ts";
import { MdextTok } from "./MdextTok.ts";
import { BlockCont } from "./alias.ts";
import { Block } from "./stnode/Block.ts";
import { BlockQuote } from "./stnode/BlockQuote.ts";
import {
  CodeBlock,
  FencedCodeBlock,
  IndentedCodeBlock,
} from "./stnode/CodeBlock.ts";
import { CtnrBlock } from "./stnode/CtnrBlock.ts";
import { HTMLBlock, HTMLMode } from "./stnode/HTMLBlock.ts";
import { HTMLInline } from "./stnode/HTMLInline.ts";
import { ATXHeading, ATXHeadingSt, SetextHeading } from "./stnode/Heading.ts";
import { Inline } from "./stnode/Inline.ts";
import type { ILoc } from "./stnode/InlineBlock.ts";
import { LinkMode } from "./stnode/Link.ts";
import { Linkdef } from "./stnode/Linkdef.ts";
import { BulletList, List, OrderdList } from "./stnode/List.ts";
import { BulletListItem, ListItem, OrderdListItem } from "./stnode/ListItem.ts";
import type { MdextSN } from "./stnode/MdextSN.ts";
import { Paragraph } from "./stnode/Paragraph.ts";
import { ThematicBreak } from "./stnode/ThematicBreak.ts";
import { Entity, Escaped, HardBr, SoftBr } from "./stnode/TokenSN.ts";
import {
  blankEnd,
  entitySizeAt,
  frstNonblankIn,
  lastNonblankIn,
  lastNonhashIn,
} from "./util.ts";
/*80--------------------------------------------------------------------------*/

const enum Ctx_ {
  sol = 1,
  BlockQuote,
  ListItem,
  ATXHeading,
  FencedCodeBlock,
}

const enum BlockStrt_ {
  /** no match */
  continue = 1,
  /** matched something, next token */
  matched,
  //jjjj TOCLEANUP
  // /**
  //  * matched branch (non-leaf container), keep going
  //  * @deprecated Use `matchedPart` or `matchedFull`
  //  */
  // matchedBran,
  /** matched leaf, no more block starts */
  break,
}
type BlockStrtCheckr_ = (ctnr_x: Block) => BlockStrt_;

const maybeSpecial_a_ = /* deno-fmt-ignore */ [
  /* "#" */0x23, /* "*" */0x2A, /* "+" */0x2B, /* "-" */0x2D, /* "<" */0x3C, 
  /* "=" */0x3D, /* ">" */0x3E, /* "_" */0x5F, /* "`" */0x60, /* "~" */0x7E, 
];
/** reMaybeSpecial = /^[#`~*+_=<>0-9-]/ */
const maybeSpecial_ = (_x: uint16) =>
  maybeSpecial_a_.includes(_x) || isDecimalDigit(_x);

const Nonmain_a_ = /* deno-fmt-ignore */ [
  /* "!" */0x21, /* "&" */0x26, /* "*" */0x2A, /* "<" */0x3C, /* "[" */0x5B, 
  /* "\\" */0x5C, /* "]" */0x5D, /* "_" */0x5F, /* "`" */0x60, 

  // /* '"' */0x22, /* "'" */0x27, 
];
/** reMain = /^[^\n`\[\]\\!<&*_'"]+/m */
const main_ = (_x: uint16) => !Nonmain_a_.includes(_x);

const Punct_re_ = /^[\p{P}\p{S}]/u;
const Punct_a_ = Nonmain_a_.concat(/* deno-fmt-ignore */ [
  /* "#" */0x23, /* "$" */0x24, /* "%" */0x25, /* "(" */0x28, /* ")" */0x29, 
  /* "+" */0x2B, /* "," */0x2C, /* "-" */0x2D, /* "." */0x2E, /* "/" */0x2F, 
  /* ":" */0x3A, /* ";" */0x3B, /* "=" */0x3D, /* ">" */0x3E, /* "?" */0x3F, 
  /* "@" */0x40, /* "^" */0x5E, /* "{" */0x7B, /* "|" */0x7C, /* "}" */0x7D, 
  /* "~" */0x7E, 
  
  /* "'" */0x27, /* '"' */0x22,
]);
const punct_ = (_x: uint16) =>
  Punct_a_.includes(_x) ||
  Punct_re_.test(String.fromCharCode(_x));

/** ESCAPABLE = "[!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]" */
const escapable_ = (_x: uint16) => Punct_a_.includes(_x);

//jjjj TOCLEANUP
// const LinkHead_a_ = /* deno-fmt-ignore */ [
//   /* "!" */0x21, /* "#" */0x23, /* "$" */0x24, /* "%" */0x25, /* "&" */0x26,
//   /* "'" */0x27, /* "*" */0x2A, /* "+" */0x2B, /* "-" */0x2D, /* "." */0x2E,
//   /* "/" */0x2F, /* "=" */0x3D, /* "?" */0x3F, /* "^" */0x5E, /* "`" */0x60,
//   /* "{" */0x7B, /* "|" */0x7C, /* "}" */0x7D, /* "~" */0x7E,
// ];
// const linkhead_ = (_x: uint16) => isWordLetter(_x) || LinkHead_a_.includes(_x);
// /** reEmailAutolink */
// const EmailAutolink_re_ =
//   /^<(?:[\w.!#$%&'*+\/=?^`{|}~-]+@[0-9A-Za-z](?:[0-9A-Za-z-]{0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:[0-9A-Za-z-]{0,61}[0-9A-Za-z])?)*)>/;
// /** reAutolink */
// const URLAutolink_re_ = /^<[A-Za-z][0-9A-Za-z.+-]{1,31}:[^<>\x00-\x20]*>/;
const isHTMLH2nd_ = (_x: uint16) => {
  return isASCIILetter(_x) ||
    _x === /* "!" */ 0x21 || _x === /* "/" */ 0x2F || _x === /* "?" */ 0x3F;
};

const LLabelNormr_re_ = /[ \t\r\n]+/g;

/** @final */
export class MdextLexr extends Lexr<MdextTok> {
  private _relex = false;
  _relexd_ = false;

  readonly unrelSnt_sa_$ = new SortedMdextSnt_id();
  /** `MdextTk | Inline`s reused once */
  readonly reusdSnt_sa_$ = new SortedMdextSnt_id();
  /** `MdextTk | Inline`s abandoned from `unrelSnt_sa_$` */
  readonly abadnSnt_sa_$ = new SortedMdextSnt_id();
  /** `MdextTk | Inline`s reused twice */
  readonly _reusdSnt_2_sa_ = new SortedMdextSnt_id();
  /** `MdextTk | Inline`s abandoned from `reusdSnt_sa_$` */
  readonly _abadnSnt_2_sa_ = new SortedMdextSnt_id();

  #pazr!: MdextPazr;
  get pazr_$() {
    return this.#pazr;
  }

  /**
   * ! Use `newRan_a`, so invode this after `.lexadj_$()`.
   */
  get #drtStrtLoc(): Loc | undefined {
    //jjjj TOCLEANUP
    // return this.#pazr.headBdryClrTk_$?.sntStopLoc;
    // return this.#pazr.headBdryClrTk_$?.nextToken_$?.sntStopLoc ??
    //   this.#pazr.headBdryClrTk_$?.sntStopLoc;
    return this.bufr$.newRan_a.at(0)?.strtLoc;
  }
  /** @see {@linkcode #drtStrtLoc()} */
  get #drtStopLoc(): Loc | undefined {
    //jjjj TOCLEANUP
    // return this.#pazr.tailBdryClrTk_$?.sntStrtLoc;
    // return this.#pazr.tailBdryClrTk_$?.prevToken_$?.sntStrtLoc ??
    //   this.#pazr.tailBdryClrTk_$?.sntStrtLoc;
    return this.bufr$.newRan_a.at(0)?.stopLoc;
  }
  /** @see {@linkcode #drtStrtLoc()} */
  get #drtFrstLine(): Line | undefined {
    return this.#drtStrtLoc?.line_$;
  }

  #ctx = Ctx_.sol;
  #ctnr!: CtnrBlock;

  #tip!: Block;
  #oldtip!: Block;
  #allClosed = true;
  #lastMatchedBloc!: Block;
  /**
   * Update `#tip`, `#oldtip`, `#allClosed`\
   * May assign `_relex`
   */
  @out((self: MdextLexr, _, args) => {
    if (!args[0]) assert(!self._relex);
  })
  private _closeUnmatchedBlocks(_x?: "may_relex"): void {
    if (this.#allClosed) return;

    /* finalize any blocks not matched */
    const curLidx = this.curLoc$.lidx_1;
    while (this.#oldtip !== this.#lastMatchedBloc) {
      const ctnr = this.#oldtip.closeBlock(curLidx, "may_err");
      if (this.#oldtip.isErr) {
        this.#toRelex(this.#oldtip);
        return;
      }

      this.#oldtip = ctnr;
      //jjjj TOCLEANUP
      // if (ctnr.inCompiling) {
      //   ctnr.compil(null);
      //   break;
      // }
    }
    this.#tip = this.#oldtip;
    this.#allClosed = true;
  }

  #blank = false;
  #indent: lcol_t = 0;
  #indented = false;

  /* #poc */
  #poc;
  /**
   * Peek next nonspace from start of container\
   * Assign `#poc`, `#blank`, `#indent`, `#indented`
   */
  #peekNextNonspaceSoc(): void {
    this.#poc.become_Loc(this.curLoc$);
    this.#poc.loff = frstNonblankIn(this.curLoc$.line_$, this.curLoc$.loff_$);
    this.#blank = this.#poc.atEol;
    this.#indent = -this.curLoc$.lcol_1() + this.#poc.lcolBy(this.curLoc$);
    this.#indented = this.#indent >= IndentedCodeBlock.indent;
  }
  /* ~ */

  readonly linkdef_m_$ = new Map<string, Linkdef>();

  _enableTags = true;

  //jjjj TOCLEANUP
  // #compilingTip = false;

  private constructor(bufr_x: MdextBufr) {
    super(bufr_x);
    this.#poc = this.curLoc$.dup_Loc();
  }
  /** @headconst @param bufr_x */
  static create(bufr_x: MdextBufr) {
    const lexr = new MdextLexr(bufr_x);
    const pazr = new MdextPazr(lexr);
    lexr.#pazr = pazr;

    lexr.#tip = pazr.drtSn;
    return lexr;
  }

  override reset_Lexr(): this {
    super.reset_Lexr();
    this.unrelSnt_sa_$.reset_SortedArray();
    this.reusdSnt_sa_$.reset_SortedArray();
    this.abadnSnt_sa_$.reset_SortedArray();
    this._reusdSnt_2_sa_.reset_SortedArray();
    this._abadnSnt_2_sa_.reset_SortedArray();
    this.#pazr.reset_Pazr();

    this.#pazr.drtSn_$ = undefined;
    this.#tip = this.#pazr.drtSn;

    this.linkdef_m_$.clear();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Fill `unrelSnt_sa_$`\
   * Invoke this after `#pazr.unrelSn_sa_$` is correctly filled.\
   * ! This will use `bufr$.newRan_a`, so invode after `.lexadj_$()`.
   */
  #gathrUnrelSntIn(sn_x: MdextSN): void {
    sn_x.gathrUnrelSnt(
      this.#drtStrtLoc!,
      this.#drtStopLoc!,
      //jjjj TOCLEANUP
      // this.#pazr.headBdryClrTk_$!.sntStopLoc,
      // this.#pazr.tailBdryClrTk_$!.sntStrtLoc,
      this.unrelSnt_sa_$,
      this.#pazr.unrelSn_sa_$,
    );
  }

  protected override suflexmrk$(): void {
    // super.suflexmrk$();

    this._relex = false;
    this._relexd_ = false;
    this.unrelSnt_sa_$.reset_SortedArray();
    this.reusdSnt_sa_$.reset_SortedArray();
    this.abadnSnt_sa_$.reset_SortedArray();
    this._reusdSnt_2_sa_.reset_SortedArray();
    this._abadnSnt_2_sa_.reset_SortedArray();

    //llll use aoa
    const drtStrtLoc = this.bufr$.oldRan_a[0].strtLoc;
    const drtStopLoc = this.bufr$.oldRan_a[0].stopLoc;
    for (const [/* normdLabel */ nl, /* Linkdef */ ld] of this.linkdef_m_$) {
      if (ld.sntStopLoc.posG(drtStrtLoc) && ld.sntStrtLoc.posS(drtStopLoc)) {
        this.linkdef_m_$.delete(nl);
      }
    }

    this.#pazr.pazmrk_$();
  }

  #drtCtnr(): Block {
    const drtSn = this.#pazr.drtSn;
    if (drtSn.isRoot) {
      this.#ctnr = drtSn as CtnrBlock;
      this.#ctnr.compil(null);
    } else {
      this.#ctnr = drtSn.parent!;
      this.#ctnr.compil(drtSn);
    }
    return drtSn;
  }

  /** Reassign `strtLexTk$`, `stopLexTk$`, and assign `curLoc$` */
  @out((self: MdextLexr) => {
    assert(self.strtLexTk$ === self.pazr_$.strtPazTk_$);
    assert(self.stopLexTk$ === self.pazr_$.stopPazTk_$);
  })
  protected override prelex$(): void {
    const drtSn = this.#drtCtnr(); // MUST be called before `.reset_Block()`
    this.#gathrUnrelSntIn(drtSn);

    const strtTk_orig = this.strtLexTk$;
    const stopTk_orig = this.stopLexTk$;
    if (drtSn.isRoot) {
      this.strtLexTk$ = this.frstLexTk;
      this.stopLexTk$ = this.lastLexTk;
    } else {
      this.strtLexTk$ = drtSn.frstToken.prevToken_$!;
      this.stopLexTk$ = drtSn.lastToken.nextToken_$!;
    }
    /*#static*/ if (INOUT) {
      assert(
        this.#pazr.strtPazTk_$ === this.strtLexTk$ &&
          this.strtLexTk$.posSE(strtTk_orig),
      );
      assert(
        this.#pazr.stopPazTk_$ === this.stopLexTk$ &&
          this.stopLexTk$.posGE(stopTk_orig),
      );
    }
    if (this.strtLexTk$.posS(strtTk_orig)) {
      this.batchBack_$(
        (tk) => this.drtTk_sa$.add(tk),
        strtTk_orig,
        this.strtLexTk$,
      );
    }
    if (this.stopLexTk$.posG(stopTk_orig)) {
      this.batchForw_$(
        (tk) => this.drtTk_sa$.add(tk),
        stopTk_orig,
        this.stopLexTk$,
      );
    }

    this.#tip = drtSn.reset_Block();
    //jjjj TOCLEANUP
    // this.#compilingTip = false;
    //jjjj TOCLEANUP
    // this.curLoc$.become(
    //   this.strtLexTk$.nextToken_$?.sntStrtLoc ?? this.strtLexTk$.sntStopLoc,
    // );
    if (drtSn.isRoot) {
      this.curLoc$.become_Loc(this.strtLexTk$.sntStopLoc);
    } else {
      this.curLoc$.become_Loc(this.strtLexTk$.nextToken_$!.sntStrtLoc!);
      if (drtSn instanceof IndentedCodeBlock) {
        this.curLoc$.backn(IndentedCodeBlock.indent);
      }
    }

    this.#ctx = Ctx_.sol;
  }

  //jjjj TOCLEANUP
  // protected override getScanningToken$(): null {
  //   return null;
  // }

  protected override suflex$(valve_x: uint): void {
    const pazr = this.#pazr;
    const newSn = pazr.drtSn;
    if (newSn.isErr) {
      pazr.newSn_$ = undefined;
    } else {
      let bloc = this.#tip;
      if (bloc !== newSn && bloc.isAncestorOf(newSn)) bloc = newSn;
      if (newSn.isAncestorOf(bloc)) {
        const curLidx = this.curLoc$.lidx_1;
        while (bloc !== newSn) bloc = bloc.closeBlock(curLidx);
      }
      bloc
        .reference(this)
        .inline(this);

      pazr.newSn_$ = newSn;
    }
    if (!this._relex) {
      /*#static*/ if (INOUT) {
        assert(pazr.newSn_$);
      }
      return;
    }
    this._relex = false; // relex at most once

    /*#static*/ if (INOUT) {
      assert(!newSn.isRoot);
    }
    pazr.enlargeBdriesTo_$(
      newSn.parent_$!.invalidateBdry(),
    );
    if (!newSn.isErr) pazr.unrelSn_sa_$.add(newSn);

    this.unrelSnt_sa_$.add_O(this.reusdSnt_sa_$);
    this.unrelSnt_sa_$.add_O(this.abadnSnt_sa_$);
    this.reusdSnt_sa_$.reset_SortedArray();
    this.abadnSnt_sa_$.reset_SortedArray();
    /* `_reusdSnt_2_sa_` is used only in `lexInline_$()` which is after possible
    relex. */
    // this.unrelSnt_sa_$.add_O(this._reusdSnt_2_sa_);
    // this._reusdSnt_2_sa_.reset();

    this.strtLexTk$ = this.strtLexTk_0$; //!
    this.lex(valve_x);
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * For compiling only\
   * Based on `curLoc$`, which is primaryconst if return false\
   * Assign `outTk$` if return true
   * @const @param strict_x
   * @const @param stop_x
   */
  @out((self: MdextLexr, ret) => {
    if (ret.length) assert(self.outTk$);
  })
  private _reuseChunk(
    strict_x?: "strict",
    stop_x = this.curLoc$.line_$.uchrLen,
  ): (MdextTk | Inline)[] {
    const snt_a: (MdextTk | Inline)[] = [];
    const loc = this.curLoc$;
    const ln_ = loc.line_$;
    for (const snt of this.unrelSnt_sa_$) {
      let got = false;
      if (
        loc.posSE(snt.sntStrtLoc) &&
        snt.sntFrstLine === ln_ && snt.sntStopLoff <= stop_x
      ) {
        let i_ = snt_a.length;
        for (; i_--;) {
          if (snt_a[i_].sntStopLoc.posSE(snt.sntStrtLoc)) {
            snt_a.splice(i_ + 1, 0, snt as MdextTk | Inline);
            got = true;
            break;
          }
        }
        if (i_ < 0) {
          snt_a.unshift(snt as MdextTk | Inline);
          got = true;
        }
      }
      if (got && snt instanceof Inline) {
        /* It's sure that Inline will be reused. */
        if (this.#pazr.unrelSn_sa_$.delete(snt) >= 0) {
          this.#pazr.takldSn_sa_$.add(snt);
        }
        snt.ensureAllBdry(); //!
      }
    }
    const iI = snt_a.length;
    if (!iI) return snt_a;

    if (
      strict_x &&
      (iI !== 1 || !(snt_a[0] instanceof Token) ||
        snt_a[0].value !== MdextTok.chunk)
    ) return [];

    this.unrelSnt_sa_$.delete_O(snt_a);
    // if (!snt_a[0].sntStrtLoc.posE(loc)) {
    //   this.abadnSnt_sa_$.add_O(snt_a);
    //   return [];
    // }

    //jjjj TOCLEANUP
    // const tk_1 = this.#pazr.tailBdryClrTk_$ ?? this.lastLexTk;
    const drtStopLoc = this.#drtStopLoc!;
    if (drtStopLoc.posSE(loc)) {
      this.reusdSnt_sa_$.add_O(snt_a);
      let tk_: MdextTk | undefined;
      if (loc.loff_$ < snt_a[0].sntStrtLoff) {
        tk_ = new Token(this, g_ran_fac.byTokLoc(loc), MdextTok.chunk)
          .syncRanvalAnchr() //!
          .setStop(snt_a[0].sntStrtLoc);
        this.lsTk$ = this.scanBypassSnt$(tk_);
      }
      loc.loff = stop_x;
      this.outTk$ = this.scanBypassSnt$(...snt_a);
      return tk_ ? [tk_, ...snt_a] : snt_a;
    }

    //jjjj TOCLEANUP
    // const tk_0 = this.#pazr.headBdryClrTk_$ ?? this.frstLexTk;
    const drtStrtLoc = this.#drtStrtLoc!;
    using poc = loc.usingDup();
    poc.loff = stop_x;
    if (drtStrtLoc.posGE(poc)) {
      this.reusdSnt_sa_$.add_O(snt_a);
      loc.loff = snt_a.at(-1)!.sntStopLoff;
      if (loc.loff_$ < stop_x) {
        this.lsTk$ = this.scanBypassSnt$(...snt_a);
        this.outTk_1$.setStrt(loc, MdextTok.chunk).setStop(poc);
        return [...snt_a, this.outTk$!];
      } else {
        this.outTk$ = this.scanBypassSnt$(...snt_a);
        return snt_a;
      }
    }

    let snt_i: MdextTk | Inline;
    let i_0 = 0;
    for (; i_0 < iI; ++i_0) {
      snt_i = snt_a[i_0];
      if (snt_i.sntStopLoc.posG(drtStrtLoc)) {
        break;
      }
    }
    /* make continuous chunk or text tokens be able to merge into one chunk  */
    for (; i_0--;) {
      snt_i = snt_a[i_0];
      if (
        !(snt_i instanceof Token) ||
        snt_i.value !== MdextTok.chunk && snt_i.value !== MdextTok.text
      ) {
        i_0 += 1;
        break;
      }
    }
    let i_1 = iI;
    for (; i_1--;) {
      snt_i = snt_a[i_1];
      if (snt_i.sntStrtLoc.posS(drtStopLoc)) {
        break;
      }
    }
    i_1 += 1;
    /* make continuous chunk or text tokens be able to merge into one chunk  */
    for (; i_1 < iI; ++i_1) {
      snt_i = snt_a[i_1];
      if (
        !(snt_i instanceof Token) ||
        snt_i.value !== MdextTok.chunk && snt_i.value !== MdextTok.text
      ) {
        break;
      }
    }
    const snt_a_0 = 0 < i_0 ? snt_a.slice(0, i_0) : undefined;
    const snt_a_1 = i_1 < iI ? snt_a.slice(i_1) : undefined;
    if (!snt_a_0 && !snt_a_1) {
      this.abadnSnt_sa_$.add_O(snt_a);
      return [];
    }

    if (snt_a_0) this.reusdSnt_sa_$.add_O(snt_a_0);
    if (snt_a_1) this.reusdSnt_sa_$.add_O(snt_a_1);
    this.abadnSnt_sa_$.add_O(snt_a.slice(i_0, i_1));
    poc.loff = loc.loff_$;
    loc.loff = stop_x;

    if (snt_a_0) {
      this.lsTk$ = this.scanBypassSnt$(...snt_a_0);
      if (snt_a_1) {
        let tk_;
        if (this.lsTk$.sntStopLoff < snt_a_1[0].sntStrtLoff) {
          tk_ = new Token(this, g_ran_fac.byTokLoc(loc), MdextTok.chunk)
            .setStrt(this.lsTk$.sntStopLoc)
            .setStop(snt_a_1[0].sntStrtLoc);
          this.lsTk$ = this.scanBypassSnt$(tk_);
        }
        this.outTk$ = this.scanBypassSnt$(...snt_a_1);
        return [...snt_a_0, ...tk_ ? [tk_] : [], ...snt_a_1];
      } else {
        this.outTk_1$
          .setStrt(this.lsTk$.sntStopLoc, MdextTok.chunk)
          .setStop(loc);
        /*#static*/ if (INOUT) {
          assert(!this.outTk$!.empty);
        }
        return [...snt_a_0, this.outTk$!];
      }
    } else {
      const tk_ = new Token(this, g_ran_fac.byTokLoc(loc), MdextTok.chunk)
        .setStrt(poc)
        .setStop(snt_a_1![0].sntStrtLoc);
      /*#static*/ if (INOUT) {
        assert(!tk_.empty);
      }
      this.lsTk$ = this.scanBypassSnt$(tk_);
      this.outTk$ = this.scanBypassSnt$(...snt_a_1!);
      return [tk_, ...snt_a_1!];
    }

    //jjjj TOCLEANUP
    // /**
    //  * Call it AFTER `scanBypassSnt$()` because `linkNext()` in which will erase
    //  * `stnod_$`.
    //  * @headconst @param snt_a_y
    //  */
    // function ensureAllBdryOfInline(
    //   snt_a_y: (MdextTk | Inline)[],
    // ): (MdextTk | Inline)[] {
    //   for (const snt of snt_a_y) {
    //     if (snt instanceof Inline) snt.ensureAllBdry();
    //   }
    //   return snt_a_y;
    // }
  }

  /**
   * Assign `outTk$` a `MdextTok.chunk` token up from `curLoc$` to eol\
   * Move `curLoc$` to eol
   * @const @param _x
   */
  @out((self: MdextLexr, ret, args) => {
    if (args[0]) {
      assert(ret.length === 1 && ret[0] === self.outTk$);
    } else {
      assert(ret.length);
      const snt = ret.at(-1);
      if (snt instanceof Token) assert(snt === self.outTk$);
      else assert(snt?.lastToken === self.outTk$);
    }
  })
  private _chunkEnd(_x?: "strict"): (MdextTk | Inline)[] {
    const snt_a = this._reuseChunk(_x);
    if (snt_a.length) return snt_a;

    this.outTk_1$
      .setStrt(this.curLoc$, MdextTok.chunk)
      .setStop(this.curLoc$.toEol(), MdextTok.chunk);
    return [this.outTk$!];
  }

  /**
   * `sn_x` can be lengthened.\
   * If lengthened, MUST be "may_fail".
   *
   * If no change of `sn_x`, `sn_x.parent` can still be a new one, in which case
   * this is used to correct `sn_x`'s token chain.
   *
   * Based on `curLoc$`. Assign `outTk$`. Move `curLoc$` to eol.
   * @headconst @param sn_x
   * @const @param _x
   */
  @out((_, ret, args) => {
    if (!args[1]) assert(ret);
  })
  private _reuseLine(sn_x: Block, _x?: "may_fail"): boolean {
    const lidx = sn_x.lidxOf(this.curLoc$);
    if (lidx < 0) return false;

    const snt_a: (MdextTk | Inline)[] = [];
    sn_x.reuseLine(lidx as lnum_t, snt_a);
    if (snt_a.length) {
      this.reusdSnt_sa_$.add_O(snt_a); //!
      this.curLoc$.toEol();
      this.outTk$ = this.scanBypassSnt$(...snt_a);
    }
    return !!snt_a.length;
  }

  /** @const `#poc` */
  #blockStrtCheckr_a: BlockStrtCheckr_[] = [
    /** Block quote */
    () => {
      if (this.#indented || this.#poc.ucod !== /* ">" */ 0x3E) {
        return BlockStrt_.continue;
      }

      this._closeUnmatchedBlocks();

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof BlockQuote && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          let sn_: BlockQuote;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx && snLastLidx !== drtFrstLidx - 1
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.block_quote_marker
        ) {
          this.unrelSnt_sa_$.delete(snt);
          this.reusdSnt_sa_$.add(snt);
          this.curLoc$.become_Loc(snt.sntStopLoc);
          this.outTk$ = snt;
          break;
        }
      }
      /* ~ */

      if (!this.outTk$) {
        this.curLoc$.loff = this.#poc.loff_$ + 1;
        this.outTk_1$
          .setStrt(this.#poc, MdextTok.block_quote_marker)
          .setStop(this.curLoc$);
      }

      this._addChild(new BlockQuote(this.outTk$!));
      /* optional following space */
      if (isSpaceOrTab(this.curLoc$.ucod)) {
        this.curLoc$.forwnCol(1);
      }

      this.#ctx = Ctx_.BlockQuote;
      return BlockStrt_.matched;
    },
    /** ATX heading */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof ATXHeading && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          this._closeUnmatchedBlocks();

          let sn_: ATXHeading;
          if (this.#tip.isAncestorOf(sn)) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.atx_heading
        ) {
          this.unrelSnt_sa_$.delete(snt);
          const ucod = snt.sntStopLoc.ucod;
          if (isSpaceOrTab(ucod) || isLFOr0(ucod)) {
            this.reusdSnt_sa_$.add(snt);
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      using poc = this.#poc.usingDup();
      /** reATXHeadingMarker = /^#{1,6}(?:[ \t]+|$)/ */
      const lexATXHead = (): boolean => {
        let ucod: uint16;
        let level = 0;
        for (; level < 6; ++level) {
          ucod = poc.ucod;
          if (ucod !== /* "#" */ 0x23) {
            return level > 0 && (isSpaceOrTab(ucod) || isLFOr0(ucod));
          }
          poc.forw();
        }
        ucod = poc.ucod;
        return isSpaceOrTab(ucod) || isLFOr0(ucod);
      };
      if (!this.outTk$ && !lexATXHead()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();

      if (!this.outTk$) {
        this.outTk_1$
          .setStrt(this.#poc, MdextTok.atx_heading)
          .setStop(this.curLoc$.become_Loc(poc));
      }
      this._addChild(new ATXHeading(this.outTk$!));

      this.#ctx = Ctx_.ATXHeading;
      return BlockStrt_.matched;
    },
    /** Fenced code block */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      using poc = this.#poc.usingDup();

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof FencedCodeBlock && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          this._closeUnmatchedBlocks();

          let sn_: FencedCodeBlock;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      /**
       * Based on `poc`
       * @const `poc`
       * @const @param ucod_y 0x60 or  0x7E
       */
      const validInfoString = (ucod_y: uint16): boolean => {
        if (ucod_y === /* "~" */ 0x7E) return true;

        const ln_ = poc.line_$;
        for (let i = poc.loff_$, iI = ln_.uchrLen; i < iI; ++i) {
          if (ln_.ucodAt(i) === /* "`" */ 0x60) return false;
        }
        return true;
      };

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.code_fence
        ) {
          this.unrelSnt_sa_$.delete(snt);
          poc.loff = snt.sntStopLoff;
          if (validInfoString(this.#poc.ucod)) {
            this.reusdSnt_sa_$.add(snt);
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      /** reCodeFence = /^`{3,}(?!.*`)|^~{3,}/ */
      const lexFencedCBHead = (): boolean => {
        const ucod_0 = poc.ucod;
        if (ucod_0 !== /* "`" */ 0x60 && ucod_0 !== /* "~" */ 0x7E) {
          return false;
        }

        const ln_ = poc.line_$;
        let i_ = poc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== ucod_0) break;
        if (i_ - poc.loff_$ < 3) return false;

        poc.loff = i_;
        return validInfoString(ucod_0);
      };
      if (!this.outTk$ && !lexFencedCBHead()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();

      if (!this.outTk$) {
        this.outTk_1$
          .setStrt(this.#poc, MdextTok.code_fence)
          .setStop(this.curLoc$.become_Loc(poc));
        this.outTk$!.lexdInfo = new FencedCBHead_LI(this.#indent);
      }
      this._addChild(new FencedCodeBlock(this.outTk$!));

      this.#ctx = Ctx_.FencedCodeBlock;
      return BlockStrt_.matched;
    },
    /** HTML block */
    (ctnr_x: Block) => {
      if (this.#indented || this.#poc.ucod !== /* "<" */ 0x3C) {
        return BlockStrt_.continue;
      }

      let mode!: HTMLMode;

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof HTMLBlock && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          this._closeUnmatchedBlocks();

          let sn_: HTMLBlock;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      let hasHead = false;
      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.chunk
        ) {
          if (
            snt.sntStopLoc.atEol &&
            snt.lexdInfo instanceof RawHTML_LI &&
            snt.lexdInfo.mode && snt.lexdInfo.hasHead
          ) {
            mode = snt.lexdInfo.mode;
            hasHead = true;
            /* reuse `snt` not here, but later by `_chunkEnd()` */
          } else {
            this.abadnSnt_sa_$.add(snt);
            hasHead = false;
          }
          break;
        }
      }
      /* ~ */

      /** reHtmlBlockOpen */
      const lexHTMLBlockHead = (): boolean => {
        const s_ = this.#poc.getText();
        const lexMode = (mode_z: HTMLMode): boolean => {
          if (HTMLBlock.Open_re[mode_z].test(s_)) {
            mode = mode_z;
            return true;
          }
          return false;
        };
        if (
          lexMode(HTMLMode.cm_1) || lexMode(HTMLMode.cm_2) ||
          lexMode(HTMLMode.cm_3) || lexMode(HTMLMode.cm_4) ||
          lexMode(HTMLMode.cm_5) || lexMode(HTMLMode.cm_6)
        ) return true;

        if (
          lexMode(HTMLMode.cm_7) &&
          !(ctnr_x instanceof Paragraph) &&
          (this.#allClosed || /* maybe lazy */
            !(this.#tip instanceof Paragraph))
        ) return true;

        return false;
      };
      if (!hasHead && !lexHTMLBlockHead()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();

      /* Not `_chunkEnd()` here because the block could be closed at the same
      line (e.g. `<pre></pre>`), so `_chunkEnd()` and `addLine()` later, and
      `closeBlock()` there if needed. */
      this._addChild(new HTMLBlock(mode));

      return BlockStrt_.break;
    },
    /** Setext heading */
    (ctnr_x: Block) => {
      if (
        this.#indented ||
        !(ctnr_x instanceof Paragraph) && !(ctnr_x instanceof SetextHeading)
      ) {
        return BlockStrt_.continue;
      }

      using poc = this.#poc.usingDup();

      /* In case compiling ... */
      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.setext_heading
        ) {
          this.unrelSnt_sa_$.delete(snt);
          if (blankEnd(snt.sntStopLoc)) {
            this.reusdSnt_sa_$.add(snt);
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      /** reSetextHeadingLine = /^(?:=+|-+)[ \t]*$/ */
      const lexSetextTail = (): boolean => {
        const ucod_0 = poc.ucod;
        if (ucod_0 !== /* "=" */ 0x3D && ucod_0 !== /* "-" */ 0x2D) {
          return false;
        }

        const ln_ = poc.line_$;
        let i_ = poc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== ucod_0) break;

        poc.loff = i_;
        return blankEnd(poc);
      };
      if (!this.outTk$ && !lexSetextTail()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();

      if (ctnr_x instanceof Paragraph) {
        ctnr_x.removeSelf();
      }

      if (!this.outTk$) {
        this.outTk_1$
          .setStrt(this.#poc, MdextTok.setext_heading)
          .setStop(this.curLoc$.become_Loc(poc));
      }
      if (ctnr_x instanceof Paragraph) {
        this._addChild(new SetextHeading(ctnr_x, this.outTk$!));
      } else {
        ctnr_x.setTail(this.outTk$!);
      }

      this.#toNextLine();
      return BlockStrt_.matched;
    },
    /** Thematic break */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      using poc = this.#poc.usingDup();
      const ln_ = poc.line_$;

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof ThematicBreak && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          this._closeUnmatchedBlocks();

          let sn_: ThematicBreak;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.thematic_break
        ) {
          this.unrelSnt_sa_$.delete(snt);
          if (blankEnd(snt.sntStopLoc)) {
            this.reusdSnt_sa_$.add(snt);
            poc.loff = snt.sntStopLoff;
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      /** reThematicBreak = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/ */
      const lexThematicBreak = (): boolean => {
        const ucod_0 = poc.ucod;
        if (
          ucod_0 !== /* "*" */ 0x2A && ucod_0 !== /* "_" */ 0x5F &&
          ucod_0 !== /* "-" */ 0x2D
        ) return false;

        let count = 1;
        let i_ = poc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) {
          const ucod = ln_.ucodAt(i_);
          if (ucod === ucod_0) ++count;
          else if (!isSpaceOrTab(ucod)) break;
        }
        poc.loff = i_;
        return i_ === iI && count >= 3;
      };
      if (!this.outTk$ && !lexThematicBreak()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();
      // if (this._relex) return BlockStrt_.matched;

      if (!this.outTk$) {
        this.outTk_1$
          .setStrt(this.#poc, MdextTok.thematic_break)
          .setStop(this.curLoc$.become_Loc(poc));
      }
      //jjjj TOCLEANUP
      // if (this.#compilingTip) {
      //   this.unrelSnt_sa_$.add(this.outTk$!);
      //   this.#toRelex();
      // } else {
      //   this._addChild(new ThematicBreak(this.outTk$!));
      // }
      this._addChild(new ThematicBreak(this.outTk$!));

      this.#toNextLine();
      return BlockStrt_.matched;
    },
    /** List item */
    (ctnr_x: Block) => {
      if (this.#indented) return BlockStrt_.continue;

      using poc = this.#poc.usingDup();
      /** ucod of one of  "*", "+", "-", ")", "." */
      let sign = 0 as uint16;
      let mrkrSize: loff_t = 0;

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof ListItem && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          this._closeUnmatchedBlocks();

          let sn_: ListItem;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      /**
       * Based on `poc`
       * @const `poc`
       */
      const validListMarker = (): boolean => {
        const ucod = poc.ucod;
        return (
          /* make sure we have spaces after */
          (isSpaceOrTab(ucod) || isLFOr0(ucod)) &&
          /* if it interrupts paragraph, make sure first line isn't blank */
          (!(ctnr_x instanceof Paragraph) || !blankEnd(poc))
        );
      };

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token &&
          (snt.value === MdextTok.bullet_list_marker ||
            snt.value === MdextTok.ordered_list_marker)
        ) {
          this.unrelSnt_sa_$.delete(snt);
          poc.loff = snt.sntStopLoff;
          if (validListMarker()) {
            this.reusdSnt_sa_$.add(snt);
            sign = poc.peek_ucod(-1);
            mrkrSize = poc.loff_$ - this.#poc.loff_$;
            this.curLoc$.become_Loc(poc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      /** For ordered list item only */
      let start: uint | -1 = -1;
      /**
       * reBulletListMarker = /^[*+-]/\
       * reOrderedListMarker = /^(\d{1,9})([.)])/
       */
      const lexListItemMrkr = (): boolean => {
        let ucod = poc.ucod;
        if (
          ucod !== /* "*" */ 0x2A && ucod !== /* "+" */ 0x2B &&
          ucod !== /* "-" */ 0x2D
        ) {
          let i_ = 0;
          for (; i_ < 10; ++i_) {
            if (!isDecimalDigit(ucod)) break;

            poc.forw();
            ucod = poc.ucod;
          }
          if (
            i_ === 0 || i_ === 10 ||
            ucod !== /* ")" */ 0x29 && ucod !== /* "." */ 0x2E
          ) return false;

          start = parseInt(
            poc.line.text.slice(this.#poc.loff_$, poc.loff_$),
          );
          if (ctnr_x instanceof Paragraph && start !== 1) return false;
        }
        sign = ucod;
        poc.forw();
        return validListMarker();
      };
      if (!this.outTk$ && !lexListItemMrkr()) return BlockStrt_.continue;

      this._closeUnmatchedBlocks();

      if (!this.outTk$) {
        mrkrSize = poc.loff_$ - this.#poc.loff_$;
        this.outTk_1$
          .setStrt(
            this.#poc,
            mrkrSize === 1
              ? MdextTok.bullet_list_marker
              : MdextTok.ordered_list_marker,
          )
          .setStop(this.curLoc$.become_Loc(poc));
      }
      this.curLoc$.loff = frstNonblankIn(poc.line_$, poc.loff_$);
      /** spaces_after_marker */
      let lcol: lcol_t = -poc.lcol_1() + this.curLoc$.lcolBy(poc);
      if (
        lcol === 0 || lcol >= IndentedCodeBlock.indent + 1 ||
        this.curLoc$.reachEol
      ) {
        lcol = 1;
        this.curLoc$.become_Loc(poc);
        if (isSpaceOrTab(this.curLoc$.ucod)) this.curLoc$.forwnCol(1);
      }
      /*#static*/ if (INOUT) {
        assert(mrkrSize > 0);
      }
      if (this.outTk$!.lexdInfo instanceof ListMrkr_LI) {
        this.outTk$!.lexdInfo.set(this.#indent, mrkrSize + lcol);
      } else {
        this.outTk$!.lexdInfo = new ListMrkr_LI(this.#indent, mrkrSize + lcol);
      }

      /* add the list if needed */
      if (!(ctnr_x instanceof List) || ctnr_x.sign !== sign) {
        this._addChild(
          mrkrSize === 1 ? new BulletList(sign) : new OrderdList(start, sign),
        );
      }

      /* add the list item */
      this._addChild(
        mrkrSize === 1
          ? new BulletListItem(this.outTk$!)
          : new OrderdListItem(this.outTk$!),
      );

      this.#ctx = Ctx_.ListItem;
      return BlockStrt_.matched;
    },
    /** Indented code block */
    () => {
      if (!this.#indented || this.#tip instanceof Paragraph || this.#blank) {
        return BlockStrt_.continue;
      }

      this._closeUnmatchedBlocks();

      /* In case compiling ... */
      for (const sn of this.#pazr.unrelSn_sa_$) {
        if (sn instanceof IndentedCodeBlock && this.#poc.posE(sn.sntStrtLoc)) {
          this.#pazr.unrelSn_sa_$.delete(sn);
          this.#pazr.takldSn_sa_$.add(sn);

          /* This is the case of newly added at the end of `sn`, so `sn` can
          not be reused, but Token in `sn` may still be reused. */
          if (!sn.sntStopLoc.atEol) {
            this.#gathrUnrelSntIn(sn);
            break;
          }

          let sn_: IndentedCodeBlock;
          const snLastLidx = sn.sntLastLidx_1;
          const drtFrstLidx = this.#drtFrstLine!.lidx_1;
          if (
            this.#tip.isAncestorOf(sn) &&
            snLastLidx !== drtFrstLidx && snLastLidx !== drtFrstLidx - 1
          ) {
            this.curLoc$.become_Loc(sn.sntStopLoc);
            this.outTk$ = this.scanBypassSnt$(sn);
            sn_ = sn.ensureAllBdry();
          } else {
            this._reuseLine(sn);
            sn_ = sn.reuse_Block();
          }
          this._addChild(sn_);

          this.#toNextLine();
          return BlockStrt_.matched;
        }
      }

      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.chunk
        ) {
          this.unrelSnt_sa_$.delete(snt);
          if (snt.sntStopLoc.atEol) {
            this.reusdSnt_sa_$.add(snt);
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
      /* ~ */

      if (!this.outTk$) {
        this.curLoc$.forwnCol(IndentedCodeBlock.indent);
        this._chunkEnd("strict");
      }
      this._addChild(new IndentedCodeBlock(this.outTk$!));

      this.#toNextLine();
      return BlockStrt_.matched;
    },
  ];

  /**
   * Add `ret_x` as a child of `#tip`.  If `#tip` can't accept children, close
   * and finalize it and try its parent, and so on till we find a block that can
   * accept children.\
   * Reset `#tip` to `ret_x`.
   */
  private _addChild(ret_x: Block): void {
    const curLidx = this.curLoc$.lidx_1;
    const VALVE = 100;
    let valve = VALVE;
    while (!this.#tip.canContain(ret_x) && --valve) {
      const ctnr = this.#tip.closeBlock(curLidx, "may_err");
      if (this.#tip.isErr) this.#toRelex(this.#tip);

      this.#tip = ctnr;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    /*#static*/ if (INOUT) {
      assert(this.#tip instanceof CtnrBlock);
    }
    (this.#tip as CtnrBlock).appendBlock(ret_x);
    this.#tip = ret_x;
  }

  #toNextLine() {
    this.#drtCtnr();
    this.curLoc$.toEol().forw();

    this.#ctx = Ctx_.sol;
  }

  /** @headconst @param closdBloc_x */
  #toRelex(closdBloc_x?: Block): void {
    if (closdBloc_x) {
      /* `drtSn_$.lastToken` is required in `enlargeBdriesTo_$()` */
      const lastTk = closdBloc_x.lastToken;
      if (this.lsTk$?.posS(lastTk)) {
        this.lsTk$ = this.scanBypassSnt$(lastTk);
      }
    }
    this._relex = true;
    this._relexd_ = true;
    this.outTk$ = this.stopLexTk$;
  }

  /**
   * For compiling only\
   * Based on `curLoc$`\
   * Assign `outTk$` if successfully reused
   * @const @param stop_x
   */
  #tryReuseTail(stop_x: loff_t): void {
    for (const snt of this.unrelSnt_sa_$) {
      if (snt.sntStrtLoc.posE(this.curLoc$)) {
        this.unrelSnt_sa_$.delete(snt);
        if (
          snt.sntStopLoff === stop_x &&
          snt instanceof Token && snt.value === MdextTok.atx_heading
        ) {
          this.reusdSnt_sa_$.add(snt);
          this.curLoc$.loff = stop_x;
          this.outTk$ = snt;
        } else {
          this.abadnSnt_sa_$.add(snt);
        }
        break;
      }
    }
  }
  /** @headconst @param ctnr_x */
  #scanATX(ctnr_x: ATXHeading) {
    if (ctnr_x.st === ATXHeadingSt.head) {
      const ln_ = this.curLoc$.line_$;
      const strt = this.curLoc$.loff_$;
      const lastNonspace = lastNonblankIn(ln_, strt);
      if (lastNonspace < strt) {
        this.#toNextLine();
      } else {
        if (ln_.ucodAt(lastNonspace) === /* "#" */ 0x23) {
          const tailStop = lastNonspace + 1;
          const lastNonhash = lastNonhashIn(ln_, strt + 1, lastNonspace);
          const tailStrt = lastNonhash + 1;
          if (lastNonhash === strt) {
            /* no `ATXHeading.#text` */
            this.curLoc$.loff = tailStrt;
            this.#tryReuseTail(tailStop);
            if (!this.outTk$) {
              this.outTk_1$.setStrt(this.curLoc$, MdextTok.atx_heading);
              this.curLoc$.loff = tailStop;
              this.outTk$!.setStop(this.curLoc$);
            }
            ctnr_x.setTail(this.outTk$!);

            this.#toNextLine();
          } else {
            if (isSpaceOrTab(ln_.ucodAt(lastNonhash))) {
              /* has valid `ATXHeading.#tail` */
              ctnr_x.tailStrt_$ = tailStrt;
              ctnr_x.tailStop_$ = tailStop;

              this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
              const chunkStop = lastNonblankIn(
                ln_,
                strt + 1,
                lastNonhash,
              ) + 1;
              const snt_a = this._reuseChunk(undefined, chunkStop);
              if (!snt_a.length) {
                this.outTk_1$.setStrt(this.curLoc$, MdextTok.chunk);
                this.curLoc$.loff = chunkStop;
                this.outTk$!.setStop(this.curLoc$);
                snt_a.push(this.outTk$!);
              }
              ctnr_x.setChunk(snt_a);
            } else {
              /* no valid `ATXHeading.#tail` */
              this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
              const snt_a = this._reuseChunk(undefined, tailStop);
              if (!snt_a.length) {
                this.outTk_1$.setStrt(this.curLoc$, MdextTok.chunk);
                this.curLoc$.loff = tailStop;
                this.outTk$!.setStop(this.curLoc$);
                snt_a.push(this.outTk$!);
              }
              ctnr_x.setChunk(snt_a);

              this.#toNextLine();
            }
          }
        } else {
          /* has `ATXHeading.#text` only */
          this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
          const snt_a = this._reuseChunk(undefined, lastNonspace + 1);
          if (!snt_a.length) {
            this.outTk_1$.setStrt(this.curLoc$, MdextTok.chunk);
            this.curLoc$.loff = lastNonspace + 1;
            this.outTk$!.setStop(this.curLoc$);
            snt_a.push(this.outTk$!);
          }
          ctnr_x.setChunk(snt_a);

          this.#toNextLine();
        }
      }
    } else if (ctnr_x.st === ATXHeadingSt.chunk) {
      /*#static*/ if (INOUT) {
        assert(0 < ctnr_x.tailStrt_$ && ctnr_x.tailStrt_$ < ctnr_x.tailStop_$);
      }
      this.curLoc$.loff = ctnr_x.tailStrt_$;
      this.#tryReuseTail(ctnr_x.tailStop_$);
      if (!this.outTk$) {
        this.outTk_1$.setStrt(this.curLoc$, MdextTok.atx_heading);
        this.curLoc$.loff = ctnr_x.tailStop_$;
        this.outTk$!.setStop(this.curLoc$);
      }
      ctnr_x.setTail(this.outTk$!);

      this.#toNextLine();
    } else {
      /*#static*/ if (INOUT) {
        fail("Should not run here!");
      }
      this.#toNextLine();
    }
  }

  /** @headconst @param bloc_x */
  #scanBlock(bloc_x: Block): void {
    //jjjj TOCLEANUP
    // this.#compilingTip = this.#tip instanceof CtnrBlock &&
    //   this.#tip.inCompiling;
    if (!bloc_x.acceptsLines || bloc_x instanceof Paragraph) {
      this.#peekNextNonspaceSoc();

      if (this.#indented || maybeSpecial_(this.#poc.ucod)) {
        const strts = this.#blockStrtCheckr_a;
        const strtsLen = strts.length;
        let i_ = 0;
        L_0: for (; i_ < strtsLen; ++i_) {
          switch (strts[i_](bloc_x)) {
            case BlockStrt_.matched:
              return;
              //jjjj TOCLEANUP
              // case BlockStrt_.matchedBran:
              //   ctnr_x = this.#tip;
              //   break L_0;
            case BlockStrt_.break:
              break L_0;
          }
        }
        if (i_ === strtsLen) {
          /* nothing matched */
          this.curLoc$.become_Loc(this.#poc);
        }
      } else {
        /* this is a little performance optimization */
        this.curLoc$.become_Loc(this.#poc);
      }
    }

    /* What remains at the offset is a text line.  Add the text to the
    appropriate container. */

    /* Lazy paragraph continuation? */
    if (!this.#allClosed && !this.#blank && this.#tip instanceof Paragraph) {
      if (this.#pazr.takldSn_sa_$.includes(this.#tip)) {
        this._reuseLine(this.#tip);
      } else {
        this.#tip.appendLine(
          this._chunkEnd(),
        );
      }
    } else {
      /* not a lazy continuation */
      this._closeUnmatchedBlocks("may_relex");
      if (this._relex) return;

      if (
        (this.#tip instanceof Paragraph || this.#tip instanceof HTMLBlock) &&
        this.#pazr.takldSn_sa_$.includes(this.#tip) &&
        this._reuseLine(this.#tip, "may_fail")
      ) {
        /* The current line of `#tip` is successfully reused. */
      } else if (
        this.#tip.acceptsLines ||
        this.#tip.parent?.inCompiling && this.#tip instanceof SetextHeading
      ) {
        /* In case compiling ... */
        for (const sn of this.#pazr.unrelSn_sa_$) {
          /* if `sn` has become a part of `#tip` ... */
          if (this.curLoc$.posE(sn.sntStrtLoc)) {
            this.#pazr.unrelSn_sa_$.delete(sn);
            this.#pazr.takldSn_sa_$.add(sn);
            this.#gathrUnrelSntIn(sn as MdextSN);
            break;
          }
        }
        /* ~ */

        this.#tip.appendLine(
          this._chunkEnd(
            this.#tip instanceof CodeBlock || this.#tip instanceof HTMLBlock
              ? "strict"
              : undefined,
          ),
        );

        //jjjj TOCLEANUP
        // } else if (this.#tip instanceof CtnrBlock && this.#tip.inCompiling) {
        //   /* 3113 */
        //   // console.log(`%crun here: `, `color:${LOG_cssc.runhere}`);
        //   /* Will add a Paragraph into `#tip` in the next branch. But if
        //   `#tip.inCompiling`, means `drtSn_$` is _shortened_. Need to lex
        //   `drtSn_$.parent_$`. */
        //   this.#toRelex();
      } else if (!this.#blank) {
        let sn_: Paragraph | SetextHeading | undefined;
        /* In case compiling ... */
        for (const sn of this.#pazr.unrelSn_sa_$) {
          if (
            (sn instanceof Paragraph || sn instanceof SetextHeading) &&
            this.curLoc$.posE(sn.sntStrtLoc)
          ) {
            this.#pazr.unrelSn_sa_$.delete(sn);
            this.#pazr.takldSn_sa_$.add(sn);

            /* This is the case of newly added at the end of `sn`, so `sn` can
            not be reused, but Token in `sn` may still be reused. */
            if (!sn.sntStopLoc.atEol) {
              this.#gathrUnrelSntIn(sn);
              break;
            }

            const snLastLidx = sn.sntLastLidx_1;
            const drtFrstLidx = this.#drtFrstLine!.lidx_1;
            if (
              this.#tip.isAncestorOf(sn) &&
              snLastLidx !== drtFrstLidx &&
              (sn instanceof Paragraph && snLastLidx !== drtFrstLidx - 1 ||
                sn instanceof SetextHeading)
            ) {
              // console.log(`%crun here: 1`, `color:${LOG_cssc.runhere}`);
              this.curLoc$.become_Loc(sn.sntStopLoc);
              this.outTk$ = this.scanBypassSnt$(sn);
              sn_ = sn.ensureAllBdry();
            } else {
              // console.log(`%crun here: 2`, `color:${LOG_cssc.runhere}`);
              this._reuseLine(sn);
              sn_ = sn.reuse_Block();
            }
            break;
          }
        }
        /* ~ */
        if (!sn_) {
          sn_ = new Paragraph(
            this._chunkEnd(),
          );
        }
        this._addChild(sn_);
      }

      if (
        this.#tip instanceof HTMLBlock &&
        (this.outTk$!.lexdInfo as RawHTML_LI).hasTail(this.#tip.mode)
      ) {
        this.#tip = this.#tip.closeBlock(this.curLoc$.lidx_1);
      }
    }
    this.#toNextLine();
  }

  /**
   * Forward `curLoc$` to the right position, chaining Token along the way.\
   * For compiling only
   * @headconst @param ctnr_x
   */
  #lcolCntStrt(ctnr_x = this.#ctnr, valve_x = 100): boolean {
    assert(valve_x--, "Cycle call!");
    let ret = true;
    if (!ctnr_x.isRoot) ret &&= this.#lcolCntStrt(ctnr_x.parent, valve_x);
    let tk_;
    if (ret) {
      tk_ = ctnr_x.lcolCntStrt(this.curLoc$);
      ret &&= tk_ !== undefined;
    }
    if (tk_) {
      //jjjj TOCLEANUP
      // if (this.unrelSnt_sa_$.includes(tk_)) {
      //   this.unrelSnt_sa_$.delete(tk_);
      //   this.reusdSnt_sa_$.add(tk_);
      // }
      this.lsTk$ = this.scanBypassSnt$(tk_);
    }
    return ret;
  }

  #scanLine() {
    if (
      this.#ctnr.inCompiling && !this.#ctnr.isRoot && this.curLoc$.atSol &&
      !this.#lcolCntStrt()
    ) {
      this.#toRelex();
      return;
    }

    let bloc: Block = this.#ctnr;
    this.#oldtip = this.#tip;
    this.#blank = false;

    let curChild: Block | undefined;
    /* For each containing block, try to parse the associated line start.
    Bail out on failure: container will point to the last matching block. */
    L_0: while ((curChild = bloc.curChild) && curChild.open) {
      this.#peekNextNonspaceSoc();
      switch (curChild.continue(this)) {
        case BlockCont.matched:
          return;
        case BlockCont.break:
          /*  we've failed to match a block */
          bloc = curChild.parent!; // `Document` returns `BlockCont.continue`
          break L_0;
      }
      bloc = curChild;
    }

    this.#allClosed = bloc === this.#oldtip;
    this.#lastMatchedBloc = bloc;
    this.#scanBlock(bloc);
  }

  /** @implement */
  protected scan_impl$(): MdextTk | undefined {
    this.outTk$ = undefined;
    /* final switch */ ({
      [Ctx_.sol]: () => {
        this.#scanLine();
      },
      [Ctx_.BlockQuote]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof BlockQuote);
        }
        this.#scanBlock(this.#tip);
      },
      [Ctx_.ListItem]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof ListItem);
        }
        this.#scanBlock(this.#tip);
      },
      [Ctx_.ATXHeading]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof ATXHeading);
        }
        this.#scanATX(this.#tip as ATXHeading);
      },
      [Ctx_.FencedCodeBlock]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof FencedCodeBlock);
        }
        if (!blankEnd(this.curLoc$)) {
          this._chunkEnd("strict");
          (this.#tip as FencedCodeBlock).setHeadChunk(this.outTk$!);
        }

        this.#toNextLine();
      },
    }[this.#ctx])();
    return this.outTk$;
  }

  continueBlockQuote_$(_x: BlockQuote): BlockCont {
    if (this.#indented || this.#poc.ucod !== /* ">" */ 0x3E) {
      return BlockCont.break;
    }

    /* In case compiling ... */
    if (
      this.#pazr.takldSn_sa_$.includes(_x) && this._reuseLine(_x, "may_fail")
    ) {
      /* The current line of `_x` is successfully reused. */
      this.#toNextLine();
      return BlockCont.matched;
    }

    /* 2 In case `_x` is a reused BlockQuote ... */
    this.outTk$ = _x.lcolCntStrt(this.curLoc$);

    /* 2 In case `_x` is a new BlockQuote but ">" is in `unrelSnt_sa_$` ... */
    if (!this.outTk$) {
      for (const snt of this.unrelSnt_sa_$) {
        if (snt.sntStrtLoc.posE(this.curLoc$)) {
          this.unrelSnt_sa_$.delete(snt);
          if (
            snt instanceof Token && snt.value === MdextTok.block_quote_marker
          ) {
            this.reusdSnt_sa_$.add(snt);
            this.curLoc$.become_Loc(snt.sntStopLoc);
            this.outTk$ = snt;
            _x.addMrkr(snt);
            /* optional following space */
            if (isSpaceOrTab(this.curLoc$.ucod)) {
              this.curLoc$.forwnCol(1);
            }
          } else {
            this.abadnSnt_sa_$.add(snt);
          }
          break;
        }
      }
    }
    /* ~ */

    if (!this.outTk$) {
      this.curLoc$.loff = this.#poc.loff_$ + 1;
      this.outTk_1$
        .setStrt(this.#poc, MdextTok.block_quote_marker)
        .setStop(this.curLoc$);
      _x.addMrkr(this.outTk$!);
      /* optional following space */
      if (isSpaceOrTab(this.curLoc$.ucod)) {
        this.curLoc$.forwnCol(1);
      }
    }

    this.#ctnr = _x;
    this.#ctx = Ctx_.sol;
    return BlockCont.matched;
  }

  continueListItem_$(_x: ListItem): BlockCont {
    /* In case compiling ... */
    if (this.#poc.posE(_x.sntStrtLoc)) {
      this.outTk$ = _x.lcolCntStrt(this.curLoc$)!;
      /*#static*/ if (INOUT) {
        assert(this.outTk$);
      }
      if (this.unrelSnt_sa_$.includes(this.outTk$)) {
        this.unrelSnt_sa_$.delete(this.outTk$);
        this.reusdSnt_sa_$.add(this.outTk$);
      }
      /* `curLoc$` is now at the right place of the first line of `_x` */

      this.#ctx = Ctx_.ListItem;
      return BlockCont.matched;
    }
    /* ~ */

    if (this.#blank) {
      if (_x.children?.length) {
        this.curLoc$.become_Loc(this.#poc);
        return BlockCont.continue;
      } else {
        /* Blank line after empty list item */
        return BlockCont.break;
      }
    } else if (this.#indent >= _x.indent) {
      this.curLoc$.forwnCol(_x.indent);
      return BlockCont.continue;
    } else {
      return BlockCont.break;
    }
  }

  continueIndentedCodeBlock_$(_x: IndentedCodeBlock): BlockCont {
    if (this.#indent >= IndentedCodeBlock.indent) {
      this.curLoc$.forwnCol(IndentedCodeBlock.indent);
      return BlockCont.continue;
    } else if (this.#blank) {
      this.curLoc$.become_Loc(this.#poc);
      return BlockCont.continue;
    } else {
      return BlockCont.break;
    }
  }

  /** @const `#poc` */
  continueFencedCodeBlock_$(_x: FencedCodeBlock): BlockCont {
    const curLidx = this.curLoc$.lidx_1;

    /* In case compiling ... */
    if (this.#pazr.takldSn_sa_$.includes(_x) && this._reuseLine(_x)) {
      /* The current line of `_x` is successfully reused. */
      if (this.curLoc$.line_$ === _x.sntLastLine) {
        this.#tip = _x.closeBlock(curLidx);
      }
      this.#toNextLine();
      return BlockCont.matched;
    }

    if (this.#poc.posE(_x.sntStrtLoc)) {
      this.curLoc$.become_Loc(_x.frstToken.sntStopLoc);
      this.outTk$ = _x.frstToken;
      if (this.unrelSnt_sa_$.includes(this.outTk$)) {
        this.unrelSnt_sa_$.delete(this.outTk$);
        this.reusdSnt_sa_$.add(this.outTk$);
      }

      this.#ctx = Ctx_.FencedCodeBlock;
      return BlockCont.matched;
    }

    /* 2 reuse fence tail */
    if (!this.#indented) {
      for (const snt of this.unrelSnt_sa_$) {
        if (
          snt.sntStrtLoc.posE(this.#poc) &&
          snt instanceof Token && snt.value === MdextTok.code_fence
        ) {
          this.unrelSnt_sa_$.delete(snt);
          if (
            snt.sntStrtLoc.ucod === _x.headUCod &&
            snt.length_1 >= _x.headSize &&
            blankEnd(snt.sntStopLoc)
          ) {
            this.reusdSnt_sa_$.add(snt);
            _x.setTail(snt);
            this.outTk$ = snt;

            this.#tip = _x.closeBlock(curLidx, "may_err");
            if (_x.isErr) this.#toRelex(_x);
            else this.#toNextLine();
            return BlockCont.matched;
          }

          this.abadnSnt_sa_$.add(snt);
          break;
        }
      }
    }

    for (const sn of this.#pazr.unrelSn_sa_$) {
      if (this.#poc.posE(sn.sntStrtLoc)) {
        this.#pazr.unrelSn_sa_$.delete(sn);
        this.#pazr.takldSn_sa_$.add(sn);
        this.#gathrUnrelSntIn(sn as MdextSN);
        break;
      }
    }
    /* ~ */

    using poc = this.#poc.usingDup();
    /** reClosingCodeFence = /^(?:`{3,}|~{3,})(?=[ \t]*$)/ */
    const lexFenceTail = (): boolean => {
      if (this.#indented) return false;

      const headUCod = _x.headUCod;
      const headSize = _x.headSize;
      let i_ = poc.loff_$;
      const ln_ = poc.line_$;
      for (const iI = ln_.uchrLen; i_ < iI; ++i_) {
        if (ln_.ucodAt(i_) !== headUCod) break;
      }
      if (i_ - poc.loff_$ < headSize) return false;

      poc.loff = i_;
      if (!blankEnd(poc)) return false;

      return true;
    };
    if (lexFenceTail()) {
      this.outTk_1$
        .setStrt(this.#poc, MdextTok.code_fence)
        .setStop(this.curLoc$.become_Loc(poc));
      _x.setTail(this.outTk$!);

      this.#tip = _x.closeBlock(curLidx, "may_err");
      if (_x.isErr) this.#toRelex(_x);
      else this.#toNextLine();
      return BlockCont.matched;
    } else {
      for (let i = _x.headIndent; i--;) {
        if (!isSpaceOrTab(this.curLoc$.ucod)) break;
        this.curLoc$.forwnCol(1);
      }
      return BlockCont.continue;
    }
  }

  continueHTMLBlock_$(_x: HTMLBlock): BlockCont {
    /* In case compiling ... */
    // if (this.#poc.posE(_x.sntStrtLoc)) {
    //   this.curLoc$.become(_x.frstToken.sntStopLoc);
    //   this.outTk$ = _x.frstToken;
    //   if (this.unrelSnt_sa_$.includes(this.outTk$)) {
    //     this.unrelSnt_sa_$.delete(this.outTk$);
    //     this.reusdSnt_sa_$.add(this.outTk$);
    //   }

    //   this.#toNextLine();
    //   return BlockCont.matched;
    // }
    /* ~ */

    return this.#blank &&
        (_x.mode === HTMLMode.cm_6 || _x.mode === HTMLMode.cm_7)
      ? BlockCont.break
      : BlockCont.continue;
  }

  continueATX_$(_x: ATXHeading): BlockCont {
    /* In case compiling ... */
    if (this.#poc.posE(_x.sntStrtLoc)) {
      this.curLoc$.become_Loc(_x.frstToken.sntStopLoc);
      this.outTk$ = _x.frstToken;
      if (this.unrelSnt_sa_$.includes(this.outTk$)) {
        this.unrelSnt_sa_$.delete(this.outTk$);
        this.reusdSnt_sa_$.add(this.outTk$);
      }
      _x.st = ATXHeadingSt.head;

      this.#ctx = Ctx_.ATXHeading;
      return BlockCont.matched;
    }
    /* ~ */

    return BlockCont.continue;
  }

  continueSetext_$(_x: SetextHeading): BlockCont {
    /* In case compiling ... */
    if (
      this.#pazr.takldSn_sa_$.includes(_x) && this._reuseLine(_x, "may_fail")
    ) {
      /* The current line of `_x` is successfully reused. */
      this.#toNextLine();
      return BlockCont.matched;
    }
    /* ~ */

    return this.#blank ? BlockCont.break : BlockCont.continue;
  }

  continueParagraph_$(): BlockCont {
    return this.#blank ? BlockCont.break : BlockCont.continue;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * reLinkLabel = /^\[(?:[^\\\[\]]|\\.){0,1000}\]/s
   * @headconst @param ploc_x
   * @out @param outTk_a_x
   */
  @out((_, ret, args) => {
    if (ret) {
      assert(args[0].ucod === /* "]" */ 0x5D);
      assert(args[1].length >= 2);
    }
  })
  private _lexLinkLabel(iloc_x: ILoc, outTk_a_x: MdextTk[]): boolean {
    /*#static*/ if (INOUT) {
      assert(outTk_a_x.length === 1);
    }
    using loc = iloc_x.usingDup();

    /** seen "]"? */
    let seen = false;
    let count: uint = 0;
    let curStopLoc = iloc_x.curStopLoc;
    L_0: for (let i = 0; i < 1000; ++i) {
      let ucod = loc.ucod;
      if (loc.posS(curStopLoc)) {
        switch (ucod) {
          case /* "\\" */ 0x5C:
            ++loc.loff;
            ucod = loc.ucod;
            switch (ucod) {
              case /* " " */ 0x20:
              case /* "\t" */ 9:
                break;
              case /* "\n" */ 0xA:
              case 0:
                count += 1;
                continue;
              default:
                count += 2;
            }
            break;
          case /* "]" */ 0x5D:
            seen = true;

            if (loc.loff_$ - iloc_x.loff_$ > 0) {
              outTk_a_x.push(
                iloc_x.setCurTk(
                  this,
                  loc.loff_$ - iloc_x.loff_$,
                  MdextTok.text,
                ),
              );
            }
            break L_0;
          case /* "[" */ 0x5B:
            count = 0;

            /* do not seperate "![" */
            if (loc.peek_ucod(-1) === /* "!" */ 0x21) {
              if (loc.loff_$ - 1 - iloc_x.loff_$ > 0) {
                iloc_x.setCurTk(
                  this,
                  loc.loff_$ - 1 - iloc_x.loff_$,
                  MdextTok.text,
                );
              }
            } else {
              if (loc.loff_$ - iloc_x.loff_$ > 0) {
                iloc_x.setCurTk(
                  this,
                  loc.loff_$ - iloc_x.loff_$,
                  MdextTok.text,
                );
              }
            }
            break L_0;
          case /* " " */ 0x20:
          case /* "\t" */ 9:
            break;
          default:
            // /*#static*/ if (INOUT) {
            //   assert(ucod !== /* "\n" */ 0xA);
            // }
            ++count;
        }
        ++loc.loff;
      } else if (ucod === /* "\n" */ 0xA) {
        if (loc.loff_$ - iloc_x.loff_$ > 0) {
          outTk_a_x.push(
            iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text),
          );
        }
        iloc_x.forw();
        if (iloc_x.curStopLoc.posE(curStopLoc)) break;

        curStopLoc = iloc_x.curStopLoc;
        loc.become_Loc(iloc_x);
      } else if (ucod === 0) {
        if (loc.loff_$ - iloc_x.loff_$ > 0) {
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text);
        }
        break;
      } else {
        /* In link label, for reused token, do not change `value`,  */
        let tv_ = iloc_x.posE(iloc_x.curStrtLoc)
          ? iloc_x.curTk_$.value
          : MdextTok.text;
        /* ..., unless it's a `chunk`, because `chunk` token will be removed
        in `addLinkdef()`, `addLink()`. */
        if (tv_ === MdextTok.chunk) tv_ = MdextTok.text;
        outTk_a_x.push(
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, tv_),
        );
        /* Link label does not contain Inline.*/
        if (iloc_x.curSnt_$ instanceof Inline) break;

        /*#static*/ if (INOUT) {
          assert(iloc_x.posE(loc));
          assert(iloc_x.curStopLoc.posG(curStopLoc));
        }
        curStopLoc = iloc_x.curStopLoc;
      }
    }
    return seen && count > 0;
  }

  /**
   * reSpnl = /^ *(?:\n *)?/
   * @headconst @param iloc_x
   */
  #lexSpnl(iloc_x: ILoc): boolean {
    let curStopLoc = iloc_x.curStopLoc;
    /* In case compiling ... */
    if (iloc_x.posE(curStopLoc)) {
      if (iloc_x.hasNextTk) {
        iloc_x.toNextTk("strt");
        return true;
      } else {
        return false;
      }
    }

    let sp_ = 0;
    /** new line */
    let nl_ = false;
    const VALVE = 1_000;
    let valve = VALVE;
    L_0: while (--valve) {
      const ucod = iloc_x.ucod;
      if (iloc_x.posS(curStopLoc)) {
        switch (ucod) {
          case /* " " */ 0x20:
          case /* "\t" */ 9:
            ++sp_;
            break;
          default:
            // /*#static*/ if (INOUT) {
            //   assert(ucod !== /* "\n" */ 0xA);
            // }
            break L_0;
        }
        ++iloc_x.loff;
      } else if (ucod === /* "\n" */ 0xA) {
        /*#static*/ if (INOUT) {
          assert(!nl_);
        }
        nl_ = true;

        iloc_x.forw();
        const loc_1 = iloc_x.curStopLoc;
        /*#static*/ if (INOUT) {
          assert(curStopLoc !== loc_1);
        }
        curStopLoc = loc_1;
      } else if (ucod === 0) {
        break;
      } else {
        iloc_x.refreshILoc();
        const loc_1 = iloc_x.curStopLoc;
        /*#static*/ if (INOUT) {
          assert(curStopLoc !== loc_1);
        }
        curStopLoc = loc_1;
      }
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    return sp_ > 0 || nl_;
  }

  //kkkk use URILexr, URI_LI, etc
  /**
   * reLinkDestinationBraces = /^(?:<(?:[^<>\n\\\x00]|\\.)*>)/
   * @headconst @param ploc_x
   * @out @param outTk_a_x
   */
  @out((_, ret, args) => {
    if (ret) {
      assert(1 <= args[1].length && args[1].length <= 3);
    }
  })
  private _lexLinkDest(iloc_x: ILoc, outTk_a_x: MdextTk[]): uint | -1 {
    /*#static*/ if (INOUT) {
      assert(!outTk_a_x.length);
    }
    using loc = iloc_x.usingDup();

    /** seen ">"? */
    let seen: boolean | undefined;
    let size: uint = 0;
    let openparens: uint | -1 = 0;
    if (iloc_x.ucod === /* "<" */ 0x3C) {
      seen = false;
      outTk_a_x.push(
        iloc_x.setCurTk(this, 1, MdextTok.link_dest_head),
      );

      ++loc.loff;
      const VALVE = 1_000;
      let valve = VALVE;
      L_0: while (--valve) {
        let ucod = loc.ucod;
        switch (ucod) {
          case /* "\\" */ 0x5C:
            ++loc.loff;
            ucod = loc.ucod;
            switch (ucod) {
              case /* "\n" */ 0xA:
              case 0:
                size = 0;

                iloc_x.setCurTk(
                  this,
                  loc.loff_$ - iloc_x.loff_$,
                  MdextTok.chunk,
                  new LinkDest_LI(),
                );
                break L_0;
              default:
                ++size;
            }
            break;
          case /* ">" */ 0x3E:
            seen = true;

            if (loc.loff_$ - iloc_x.loff_$ > 0) {
              outTk_a_x.push(
                iloc_x.setCurTk(
                  this,
                  loc.loff_$ - iloc_x.loff_$,
                  MdextTok.chunk,
                  new LinkDest_LI(),
                ),
              );
            }
            outTk_a_x.push(
              iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail),
            );
            break L_0;
          case /* "<" */ 0x3C:
          case /* "\n" */ 0xA:
          case 0:
            size = 0;

            iloc_x.setCurTk(
              this,
              loc.loff_$ - iloc_x.loff_$,
              MdextTok.chunk,
              new LinkDest_LI(),
            );
            break L_0;
          default:
            ++size;
        }
        ++loc.loff;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
    } else {
      const VALVE = 1_000;
      let valve = VALVE;
      while (--valve) {
        let ucod = loc.ucod;
        if (isASCIIControl(ucod) || ucod === /* " " */ 0x20) {
          break;
        } else if (ucod === /* "\\" */ 0x5C) {
          ++size;
          ucod = loc.peek_ucod(1);
          if (escapable_(ucod)) ++loc.loff;
        } else if (ucod === /* ")" */ 0x29) {
          if (openparens <= 0) break;
          --openparens;
        } else if (ucod === /* "(" */ 0x28) {
          ++openparens;
        } else {
          ++size;
        }
        ++loc.loff;
      }
      assert(valve, `Loop ${VALVE}±1 times`);

      let tk_;
      if (loc.loff_$ - iloc_x.loff_$ > 0) {
        tk_ = iloc_x.setCurTk(
          this,
          loc.loff_$ - iloc_x.loff_$,
          MdextTok.chunk,
          new LinkDest_LI(),
        );
      }
      if (tk_ && openparens === 0) outTk_a_x.push(tk_);
    }
    return seen === true || seen === undefined && openparens === 0 ? size : -1;
  }

  /**
   * reLinkTitle
   * @headconst @param ploc_x
   * @out @param outTk_a_x
   */
  @out((_, ret, args) => {
    if (ret) {
      assert(args[1].length);
    }
  })
  private _lexTitle(iloc_x: ILoc, outTk_a_x: MdextTk[]): boolean {
    /*#static*/ if (INOUT) {
      assert(!outTk_a_x.length);
    }
    const frstUCod = iloc_x.ucod;
    if (
      frstUCod !== /* '"' */ 0x22 && frstUCod !== /* "'" */ 0x27 &&
      frstUCod !== /* "(" */ 0x28
    ) return false;

    const lastUCod = frstUCod === /* "(" */ 0x28 ? /* ")" */ 0x29 : frstUCod;
    using loc = iloc_x.usingDup();

    /** seen `lastUCod`? */
    let seen = false;
    let curStopLoc = iloc_x.curStopLoc;
    ++loc.loff;
    const VALVE = 1_000;
    let valve = VALVE;
    L_0: while (--valve) {
      let ucod = loc.ucod;
      if (loc.posS(curStopLoc)) {
        switch (ucod) {
          case /* "\\" */ 0x5C:
            ++loc.loff;
            ucod = loc.ucod;
            switch (ucod) {
              case /* "\n" */ 0xA:
              case 0:
                continue;
            }
            break;
          case lastUCod:
            seen = true;

            outTk_a_x.push(
              iloc_x.setCurTk(
                this,
                loc.loff_$ - iloc_x.loff_$ + 1,
                MdextTok.text,
              ),
            );
            break L_0;
          case frstUCod:
            iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text);
            break L_0;
          default:
            // /*#static*/ if (INOUT) {
            //   assert(ucod !== /* "\n" */ 0xA);
            // }
        }
        ++loc.loff;
      } else if (ucod === /* "\n" */ 0xA) {
        outTk_a_x.push(
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text),
        );
        if (iloc_x.reachEoh) {
          /* `ucod !== 0` because `loc` is `Loc`, not `ILoc` */
          break;
        } else {
          iloc_x.forw();
          const loc_1 = iloc_x.curStopLoc;
          /*#static*/ if (INOUT) {
            assert(loc_1 !== curStopLoc);
          }
          curStopLoc = loc_1;
          loc.become_Loc(iloc_x);
        }
      } else if (ucod === 0) {
        iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text);
        break;
      } else {
        outTk_a_x.push(
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text),
        );

        iloc_x.refreshILoc();
        const loc_1 = iloc_x.curStopLoc;
        /*#static*/ if (INOUT) {
          assert(loc_1 !== curStopLoc);
          assert(loc.posE(iloc_x));
        }
        curStopLoc = loc_1;
      }
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    return seen;
  }

  /**
  //jjjj TOCLEANUP
  //  * ! Make sure no holes in token chain, because this is called before
  //  * `lexInline_$()`
   * @headconst @param iloc_x
   */
  lexReference_$(iloc_x: ILoc): boolean {
    if (iloc_x.ucod !== /* "[" */ 0x5B) return false;

    /** Loc for fallback */
    using loc_fb = iloc_x.usingDup();

    const curSnt = iloc_x.curSnt_$;
    if (
      this.reusdSnt_sa_$.n_Linkdef &&
      curSnt instanceof Linkdef && this.reusdSnt_sa_$.includes(curSnt)
    ) {
      this.reusdSnt_sa_$.delete(curSnt);
      iloc_x.toSnt("stop");
      if (blankEnd(iloc_x)) {
        this._reusdSnt_2_sa_.add(curSnt);
        return true;
      } else {
        this.abadnSnt_sa_$.add(curSnt);
        iloc_x.toLoc(loc_fb);
      }
    } else if (
      curSnt instanceof Inline && this.reusdSnt_sa_$.includes(curSnt)
    ) {
      return false;
    }

    const lablTk_a = [
      iloc_x.setCurTk(this, 1, MdextTok.bracket_open),
    ];
    if (!this._lexLinkLabel(iloc_x, lablTk_a)) return false;

    if (iloc_x.peek_ucod(1) !== /* ":" */ 0x3A) return false;
    lablTk_a.push(
      iloc_x.setCurTk(this, 2, MdextTok.bracket_colon),
    );

    this.#lexSpnl(iloc_x);
    const destPart: MdextTk[] = [];
    const destSize = this._lexLinkDest(iloc_x, destPart);
    if (
      destSize < 0 ||
      destSize === 0 && destPart.at(0)?.value !== MdextTok.link_dest_head
    ) return false;

    loc_fb.become_Loc(iloc_x);

    let titlTk_a: MdextTk[] | undefined;
    if (this.#lexSpnl(iloc_x)) {
      titlTk_a = [];
      if (!this._lexTitle(iloc_x, titlTk_a)) {
        titlTk_a = undefined;
        iloc_x.toLoc(loc_fb);
      }
    }

    if (!blankEnd(iloc_x)) {
      if (titlTk_a?.length) {
        /* The potential title we found is not at the line end, but it could
        still be a legal link reference if we discard the title. */
        iloc_x.toLoc(loc_fb);
        if (!blankEnd(iloc_x)) return false;

        titlTk_a = undefined;
      } else {
        return false;
      }
    }

    const normdLabel = lablTk_a
      .slice(1, -1)
      .map((tk) => tk.getText())
      .join(" ")
      .trim()
      .replace(LLabelNormr_re_, " ")
      .toLowerCase()
      .toUpperCase();
    /*#static*/ if (INOUT) {
      assert(normdLabel);
    }
    const linkdef = iloc_x.host.addLinkdef(lablTk_a, destPart, titlTk_a);
    if (!this.linkdef_m_$.has(normdLabel)) {
      this.linkdef_m_$.set(normdLabel, linkdef);
    }
    return true;
  }

  /** @headconst @param iloc_x */
  lexInline_$(iloc_x: ILoc): boolean {
    const ucod = iloc_x.ucod;
    if (!ucod) return false;

    const curSnt = iloc_x.curSnt_$;
    if (this.reusdSnt_sa_$.includes(curSnt) && curSnt instanceof Inline) {
      this.reusdSnt_sa_$.delete(curSnt);
      if (curSnt.sntStrtLoc.ucod === ucod) {
        this._reusdSnt_2_sa_.add(curSnt);
        iloc_x.toSnt("stop").toNextTk("strt");
        return true;
      } else {
        this._abadnSnt_2_sa_.add(curSnt);
      }
    }

    let handled = false;
    switch (ucod) {
      case /* "\n" */ 0xA: {
        if (iloc_x.peek_ucod(-1) === /* " " */ 0x20) {
          if (iloc_x.peek_ucod(-2) === /* " " */ 0x20) {
            const loff_1 = iloc_x.loff_$;
            iloc_x.loff = 1 + lastNon(
              /* " " */ 0x20 as uint16,
              iloc_x.line_$,
              iloc_x.curTk_$.sntStrtLoff,
            );
            iloc_x.host.addTokenSN(
              iloc_x.setCurTk(this, loff_1 - iloc_x.loff_$, MdextTok.text),
              HardBr,
            );
          } else {
            iloc_x.loff -= 1;
            iloc_x.host.addTokenSN(
              iloc_x.setCurTk(this, 1, MdextTok.text),
              SoftBr,
            );
          }
        }
        iloc_x.forw();
        handled = true;
        break;
      }
      case /* "\\" */ 0x5C: {
        const ucod = iloc_x.peek_ucod(1); //! MUST use `ILoc` here
        if (ucod === /* "\n" */ 0xA) {
          iloc_x.host.addTokenSN(
            iloc_x.setCurTk(this, 1, MdextTok.backslash),
            HardBr,
          );
          iloc_x.forw();
        } else if (escapable_(ucod)) {
          iloc_x.host.addTokenSN(
            iloc_x.setCurTk(this, 2, MdextTok.escaped),
            Escaped,
          );
        } else {
          iloc_x.setCurTk(this, 1, MdextTok.text);
        }
        handled = true;
        break;
      }
      case /* "`" */ 0x60: {
        /**
         * `in( loc_y.ucod === 0x60 )`
         * @const @param loc_y
         */
        const backtickSize = (loc_y: Loc): loff_t => {
          const ln_ = loc_y.line_$;
          let i_ = loc_y.loff_$ + 1;
          const iI = ln_.uchrLen;
          for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== /* "`" */ 0x60) break;
          return i_ - iloc_x.loff_$;
        };

        /**
         * Move `iloc_x` forward
         * `in( iloc_x.ucod !== 0x60 )`
         */
        const toNextBacktick = (): boolean => {
          const VALVE = 10_000;
          let valve = VALVE;
          let ucod;
          while (
            (ucod = iloc_x.forw_ucod()) !== /* "`" */ 0x60 && ucod !== 0 &&
            --valve
          );
          assert(valve, `Loop ${VALVE}±1 times`);
          return ucod === /* "`" */ 0x60;
        };

        const TOK = MdextTok.backtick_string;
        const size_0 = backtickSize(iloc_x);
        const frstTk = iloc_x.setCurTk(this, size_0, TOK);
        using loc_fb = iloc_x.usingDup();
        let hasTail, size;
        while (
          (hasTail = toNextBacktick()) &&
          (size = backtickSize(iloc_x)) !== size_0
        ) iloc_x.loff += size;
        if (hasTail) {
          const lastTk = iloc_x.setCurTk(this, size_0, TOK);
          iloc_x.host.addCodeInline(frstTk, lastTk);
        } else {
          iloc_x.toLoc(loc_fb);
        }
        handled = true;
        break;
      }
      case /* "*" */ 0x2A:
      case /* "_" */ 0x5F: {
        using loc = iloc_x.usingDup();
        const prevUCod = loc.atSol
          ? /* "\n" */ 0xA as uint16
          : loc.peek_ucod(-1); //! Use normal `Loc` rather than `ILoc`

        const ln_ = iloc_x.line_$;
        let i_ = iloc_x.loff_$ + 1;
        const iI = iloc_x.curStopLoc.loff_$;
        /*#static*/ if (INOUT) {
          assert(i_ <= iI);
        }
        for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== ucod) break;
        const tk_ = iloc_x
          .setCurTk(this, i_ - iloc_x.loff_$, MdextTok.emphasis_delimiter);
        const nextUCod = iloc_x.ucod;
        const after_is_whitespace = isLFOr0(nextUCod) ||
          isWhitespaceUCod(nextUCod);
        const after_is_punctuation = punct_(nextUCod);
        const before_is_whitespace = prevUCod === /* "\n" */ 0xA ||
          isWhitespaceUCod(prevUCod);
        const before_is_punctuation = punct_(prevUCod);
        const left_flanking = !after_is_whitespace &&
          (!after_is_punctuation || before_is_whitespace ||
            before_is_punctuation);
        const right_flanking = !before_is_whitespace &&
          (!before_is_punctuation || after_is_whitespace ||
            after_is_punctuation);
        let can_open: boolean, can_cloz: boolean;
        if (ucod === /* "_" */ 0x5F) {
          can_open = left_flanking &&
            (!right_flanking || before_is_punctuation);
          can_cloz = right_flanking &&
            (!left_flanking || after_is_punctuation);
        } else {
          can_open = left_flanking;
          can_cloz = right_flanking;
        }
        tk_.lexdInfo = new EmphDelim_LI(tk_, can_open, can_cloz);
        iloc_x.tailEmphDelim = tk_.lexdInfo as EmphDelim_LI;
        handled = true;
        break;
      }
      // case /* '"' */ 0x22:
      // case /* "'" */ 0x27:
      //   ///
      //   iloc.forw();
      //   break;
      case /* "[" */ 0x5B: {
        const tk_ = iloc_x.setCurTk(this, 1, MdextTok.bracket_open);
        tk_.lexdInfo =
          iloc_x.tailBrktOpen =
            new BrktOpen_LI(tk_, false, iloc_x.tailEmphDelim);
        handled = true;
        break;
      }
      case /* "!" */ 0x21: {
        using loc = iloc_x.usingDup().forw();
        if (loc.ucod === /* "[" */ 0x5B) {
          /* "!" and "[" must not be seperated. */
          const tk_ = iloc_x.setCurTk(this, 2, MdextTok.bang_bracket);
          tk_.lexdInfo = new BrktOpen_LI(tk_, true, iloc_x.tailEmphDelim);
          iloc_x.tailBrktOpen = tk_.lexdInfo as BrktOpen_LI;
          handled = true;
        }
        break;
      }
      case /* "]" */ 0x5D:
        this.#lexBracketCloz(iloc_x);
        handled = true;
        break;
      case /* "<" */ 0x3C: {
        using loc = iloc_x.usingDup().forw();
        if (isURIHead(loc)) {
          const uri_li = new URI_LI(loc);
          if (uri_li.ok && (uri_li.hasScheme || uri_li.isEmail_1)) {
            loc.loff = uri_li.stopLoff;
            if (loc.ucod === /* ">" */ 0x3E) {
              const frstTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_head);
              const destTk_a: MdextTk[] = [];
              iloc_x.forwSetTks_inline(
                this,
                destTk_a,
                loc,
                MdextTok.chunk,
                uri_li,
              );
              const lastTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail);
              iloc_x.host.addAutolink(frstTk, destTk_a, lastTk);
              handled = true;
              break;
            }
          }
          uri_li.destructor()!; //!
        }
        { //kkkk HTMLInline
          const forwSetTks_inline = (size_y: loff_t): MdextTk[] => {
            loc.become_Loc(iloc_x);
            loc.loff += size_y;
            const ret_a: MdextTk[] = [];
            iloc_x.forwSetTks_inline(this, ret_a, loc, MdextTok.chunk);
            return ret_a;
          };
          loc.loff = iloc_x.loff_$ + 1;
          if (isHTMLH2nd_(loc.ucod)) {
            let s_ = iloc_x.getText();
            s_ = `${s_}\n${iloc_x.forwTextBelow()}`;
            const found = HTMLInline.HTMLTag_re.exec(s_);
            if (found) {
              const frstTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_head);
              const chunkTk_a: MdextTk[] = [];
              for (const pln of found[0].slice(1, -1).split("\n")) {
                chunkTk_a.push(
                  ...forwSetTks_inline(pln.length),
                );
                if (iloc_x.ucod === /* "\n" */ 0xA) iloc_x.forw();
              }
              const lastTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail);
              iloc_x.host.addHTMLInline(frstTk, chunkTk_a, lastTk!);
              handled = true;
            }
          }
        }

        //jjjj TOCLEANUP
        // if (!linkhead_(loc.ucod)) break;

        // const li_ = new URI_LI(loc);
        // console.log(`ok: ${li_.ok}`);
        // li_.destructor();

        // let s_ = iloc_x.getText();
        // let found = EmailAutolink_re_.exec(s_);
        // let isEmail: boolean;
        // if (found) isEmail = true;
        // else {
        //   found = URLAutolink_re_.exec(s_);
        //   if (found) isEmail = false;
        // }
        // const forwSetTks_inline = (size_y: loff_t): MdextTk[] => {
        //   loc.become_Loc(iloc_x);
        //   loc.loff += size_y;
        //   const ret_a: MdextTk[] = [];
        //   iloc_x.forwSetTks_inline(this, ret_a, loc, MdextTok.chunk);
        //   return ret_a;
        // };
        // if (found) {
        //   const frstTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_head);
        //   const destTk_a = forwSetTks_inline(found[0].length - 2);
        //   const lastTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail);
        //   iloc_x.host.addAutolink(frstTk, destTk_a, lastTk);
        //   handled = true;
        // } else {
        //   s_ = `${s_}\n${iloc_x.forwTextBelow()}`;
        //   found = HTMLInline.HTMLTag_re.exec(s_);
        //   if (found) {
        //     const frstTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_head);
        //     const chunkTk_a: MdextTk[] = [];
        //     for (const pln of found[0].slice(1, -1).split("\n")) {
        //       chunkTk_a.push(
        //         ...forwSetTks_inline(pln.length),
        //       );
        //       if (iloc_x.ucod === /* "\n" */ 0xA) iloc_x.forw();
        //     }
        //     const lastTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail);
        //     iloc_x.host.addHTMLInline(frstTk, chunkTk_a, lastTk!);
        //     handled = true;
        //   }
        // }
        break;
      }
      case /* "&" */ 0x26: {
        const size = entitySizeAt(iloc_x);
        if (size > 0) {
          iloc_x.host.addTokenSN(
            iloc_x.setCurTk(this, size, MdextTok.entity),
            Entity,
          );
        } else {
          iloc_x.forw();
        }
        handled = true;
        break;
      }
    }
    if (!handled) {
      const stopLoc = curSnt.sntStopLoc;
      let reusd = false;
      if (this.reusdSnt_sa_$.includes(curSnt) && curSnt instanceof Token) {
        this.reusdSnt_sa_$.delete(curSnt);
        if (curSnt.value === MdextTok.chunk) {
          this._abadnSnt_2_sa_.add(curSnt);
        } else {
          this._reusdSnt_2_sa_.add(curSnt);
          iloc_x.toNextTk("strt");
          reusd = true;
        }
      } else if (this._reusdSnt_2_sa_.includes(curSnt)) {
        /*#static*/ if (INOUT) {
          assert(curSnt instanceof Token);
        }
        iloc_x.toNextTk("strt");
        reusd = true;
      }
      if (!reusd) {
        const ln_ = iloc_x.line_$;
        let i_ = iloc_x.loff_$ + 1;
        const iI = stopLoc.loff_$;
        /*#static*/ if (INOUT) {
          assert(i_ <= iI);
        }
        for (; i_ < iI; ++i_) if (!main_(ln_.ucodAt(i_))) break;
        iloc_x.setCurTk(this, i_ - iloc_x.loff_$, MdextTok.text);
      }
    }
    return true;
  }

  /**
   * @headconst @param iloc_x
   * @const @param stack_bottom
   */
  lexEmphasis_$(iloc_x: ILoc, stack_bottom?: EmphDelim_LI): void {
    const VALVE = 10_000;
    let valve = VALVE;

    /* find first closer above stack_bottom */
    let closer = iloc_x.tailEmphDelim;
    while (closer && ED_continue_(closer.prev, stack_bottom) && --valve) {
      closer = closer.prev;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    /* move forward, looking for closers, and handling each */
    while (closer && --valve) {
      if (!closer.can_cloz) {
        closer = closer.next;
        continue;
      }

      /* found emphasis closer. now look back for first matching opener */
      let opener = closer.prev;
      let opener_found = false;
      while (opener && ED_continue_(opener, stack_bottom) && --valve) {
        const odd_match = (closer.can_open || opener.can_cloz) &&
          closer.origsize % 3 !== 0 &&
          (opener.origsize + closer.origsize) % 3 === 0;
        if (opener.ucod === closer.ucod && opener.can_open && !odd_match) {
          opener_found = true;
          break;
        }
        opener = opener.prev;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
      if (!opener_found) {
        closer = closer.next;
        continue;
      }

      const closerLen = closer.host.length_1;
      const openerLen = opener!.host.length_1;

      /* calculate actual number of delimiters used from closer */
      const use_delims = closerLen! >= 2 && openerLen! >= 2 ? 2 : 1;

      /* remove used delimiters from stack elts and inlines */
      const openerTk = opener!.host;
      iloc_x.toTk("strt", openerTk);
      //jjjj TOCLEANUP
      // iloc_x.setCurTk(this, openerLen!, MdextTok.emphasis_delimiter);
      if (openerLen! > use_delims) {
        iloc_x.toTk("strt", openerTk);
        const tk_ = iloc_x.setCurTk(
          this,
          openerLen! - use_delims,
          MdextTok.emphasis_delimiter,
        );
        tk_.lexdInfo = new EmphDelim_LI(
          tk_,
          opener!.can_open,
          opener!.can_cloz,
          opener!.origsize, //!
        );
        opener!.insertPrev(tk_.lexdInfo as EmphDelim_LI);
      }

      const closerTk = closer.host;
      iloc_x.toTk("strt", closerTk);
      //jjjj TOCLEANUP
      // iloc_x.setCurTk(this, closerLen!, MdextTok.emphasis_delimiter);
      if (closerLen! > use_delims) {
        iloc_x.toTk("strt", closerTk);
        iloc_x.loff += use_delims;
        const tk_ = iloc_x.setCurTk(
          this,
          closerLen! - use_delims,
          MdextTok.emphasis_delimiter,
        );
        tk_.lexdInfo = new EmphDelim_LI(
          tk_,
          closer.can_open,
          closer.can_cloz,
          closer.origsize, //!
        );
        if (closer === iloc_x.tailEmphDelim) {
          iloc_x.tailEmphDelim = tk_.lexdInfo as EmphDelim_LI;
        }
      }
      /* ~ */

      /* build contents for new emph element */
      iloc_x.host.addEmphasis(openerTk, closerTk);

      /* remove elts between opener and closer in delimiters stack */
      /* if opener has 0 delims, remove it and the inline */
      iloc_x.removeEdLIBetween(opener!, closer);
      iloc_x.removeEmphDelim(opener!);
      const tempstack = closer.next;
      iloc_x.removeEmphDelim(closer);
      closer = tempstack;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    /* remove all delimiters */
    while (
      iloc_x.tailEmphDelim &&
      ED_continue_(iloc_x.tailEmphDelim, stack_bottom) && --valve
    ) {
      iloc_x.removeEmphDelim(iloc_x.tailEmphDelim);
    }
    assert(valve, `Loop ${VALVE}±1 times`);
  }

  /** @see {@linkcode lexInline_$()} */
  #lexBracketCloz(iloc_x: ILoc): void {
    /* get last [ or ![ */
    let opener = iloc_x.tailBrktOpen;
    if (!opener) {
      iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
      return;
    }
    if (!opener.active) {
      iloc_x.removeBrktOpen(opener);
      iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
      return;
    }

    /* If we got here, `opener` is a potential opener */
    let linkMode: LinkMode, normdLabel: string | undefined;
    let textClozTk, lastTk, lablTk_a, destPart, titlTk_a;
    const is_image = opener.is_image;

    /* Check to see if we have a link/image */
    let matched = false;
    /** Loc for fallback */
    using loc_fb = iloc_x.usingDup();

    /* Inline link? */
    if (loc_fb.peek_ucod(1) === /* "(" */ 0x28) {
      linkMode = LinkMode.inline;
      /* "]" and "(" must not have been seperated yet. */
      textClozTk = iloc_x.setCurTk(this, 2, MdextTok.bracket_paren);
      this.#lexSpnl(iloc_x);
      destPart = [] as MdextTk[];
      if (this._lexLinkDest(iloc_x, destPart) >= 0) {
        if (this.#lexSpnl(iloc_x)) {
          titlTk_a = [] as MdextTk[];
          this._lexTitle(iloc_x, titlTk_a);
          this.#lexSpnl(iloc_x);
          if (iloc_x.ucod === /* ")" */ 0x29) {
            lastTk = iloc_x.setCurTk(this, 1, MdextTok.paren_cloz);
            matched = true;
          }
        } else if (iloc_x.ucod === /* ")" */ 0x29) {
          lastTk = iloc_x.setCurTk(this, 1, MdextTok.paren_cloz);
          matched = true;
        }
      }
    }

    if (!matched) {
      destPart = titlTk_a = undefined; //!

      /* Next, see if there's a link label */
      iloc_x.toLoc(loc_fb);
      let label: string | undefined;
      /**
       * @headconst @param toTk_y
       * @headconst @param upTk_y
       */
      const openerLabel = (
        toTk_y: MdextTk,
        upTk_y = opener!.host.nextToken_$!,
      ): string => {
        const s_a: string[] = [];
        let curLn = upTk_y.sntFrstLine;
        const VALVE = 100;
        let valve = VALVE;
        for (let tk = upTk_y; tk !== toTk_y && --valve;) {
          const ln_ = tk.sntFrstLine;
          if (ln_ !== curLn) {
            curLn = ln_;
            s_a.push("\n");
          }
          s_a.push(tk.getText());
          tk = tk.nextToken_$!;
        }
        assert(valve, `Loop ${VALVE}±1 times`);
        return s_a.join("");
      };
      if (loc_fb.peek_ucod(1) === /* "[" */ 0x5B) {
        /* "]" and "[" must not have been seperated yet. */
        textClozTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
        lablTk_a = [
          iloc_x.setCurTk(this, 1, MdextTok.bracket_open),
        ];
        if (loc_fb.peek_ucod(2) === /* "]" */ 0x5D) {
          /* [...][] */
          linkMode = LinkMode.ref_collapsed;
          lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
          lablTk_a = undefined;
          label = openerLabel(textClozTk);
        } else if (this._lexLinkLabel(iloc_x, lablTk_a)) {
          /* [...][...] */
          linkMode = LinkMode.ref_full;
          lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
          lablTk_a.push(lastTk);
          label = openerLabel(lablTk_a.at(-1)!, lablTk_a[1]);
        } else if (!opener.prev) {
          /* [...] */
          linkMode = LinkMode.ref_shortcut;
          lastTk = iloc_x.toTk("strt", textClozTk)
            .setCurTk(this, 1, MdextTok.bracket_cloz);
          lablTk_a = undefined;
          textClozTk.value = MdextTok.bracket_open;
          textClozTk = lastTk;
          label = openerLabel(textClozTk);
        }
      } else {
        /* [...] */
        linkMode = LinkMode.ref_shortcut;
        textClozTk = lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
        label = openerLabel(lastTk);
      }
      if (label) {
        normdLabel = label
          .trim()
          .replace(LLabelNormr_re_, " ")
          .toLowerCase()
          .toUpperCase();
        /* For reference link, get LAZILY `destPart`, `titlTk_a` from
        `linkdef_m_$`. */
        if (this.linkdef_m_$.has(normdLabel)) matched = true;
      }
    }

    if (!matched) {
      iloc_x.removeBrktOpen(opener);
      iloc_x.toLoc(loc_fb);
      iloc_x.toNextTk("strt");
      return;
    }

    /*#static*/ if (INOUT) {
      assert(linkMode! && textClozTk && lastTk);
      assert(
        textClozTk!.value === MdextTok.bracket_paren ||
          textClozTk!.value === MdextTok.bracket_cloz,
      );
      assert(textClozTk!.sntStrtLoc.posE(loc_fb));
    }

    using loc_save = iloc_x.usingDup();
    iloc_x.toLoc(loc_fb);
    this.lexEmphasis_$(iloc_x, opener.emphdelims);
    iloc_x.toLoc(loc_save);

    iloc_x.host.addLink(
      linkMode!,
      normdLabel,
      opener.host,
      textClozTk!,
      lastTk!,
      lablTk_a,
      destPart,
      titlTk_a,
    );

    iloc_x.removeBrktOpen(opener);
    /* We remove this bracket and `lexEmphasis_$()` will remove later
    delimiters.
    Now, for a link, we also deactivate earlier link openers.
    (no links in links) */
    if (!is_image) {
      opener = iloc_x.tailBrktOpen;
      const VALVE = 100;
      let valve = VALVE;
      while (opener !== undefined && --valve) {
        if (!opener.is_image) {
          opener.active = false; // deactivate this opener
        }
        opener = opener.prev;
      }
      assert(valve, `Loop ${VALVE}±1 times`);
    }
  }
}
/*80--------------------------------------------------------------------------*/

/**
 * Emphasis Delimiters
 * @final
 */
export class EmphDelim_LI extends LexdInfo {
  readonly host;
  get ucod(): uint16 {
    return this.host.sntStrtLoc.ucod;
  }

  origsize;

  can_open;
  can_cloz;

  prev: EmphDelim_LI | undefined;
  next: EmphDelim_LI | undefined;

  constructor(
    host_x: MdextTk,
    can_open_x: boolean,
    can_close_x: boolean,
    origsize_x?: uint,
  ) {
    super();
    this.host = host_x;
    this.can_open = can_open_x;
    this.can_cloz = can_close_x;
    this.origsize = origsize_x ?? host_x.length_1;
  }

  // reset(can_open_x: boolean, can_close_x: boolean) {
  //   this.can_open = can_open_x;
  //   this.can_cloz = can_close_x;
  //   this.prev = undefined;
  //   this.next = undefined;
  // }

  //jjjj TOCLEANUP
  // override become(li_x: EmphDelim_LI): void {
  //   this.reset(li_x.can_open, li_x.can_cloz);
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  insertPrev(ret_x: EmphDelim_LI) {
    if (this.prev) {
      this.prev.next = ret_x;
      ret_x.prev = this.prev;
    } else {
      ret_x.prev = undefined;
    }

    ret_x.next = this;
    this.prev = ret_x;

    return ret_x;
  }
  insertNext(ret_x: EmphDelim_LI) {
    if (this.next) {
      this.next.prev = ret_x;
      ret_x.next = this.next;
    } else {
      ret_x.next = undefined;
    }

    ret_x.prev = this;
    this.next = ret_x;

    return ret_x;
  }
}

const ED_continue_ = (tip_x?: EmphDelim_LI, bot_x?: EmphDelim_LI): boolean => {
  if (tip_x) {
    if (bot_x) return bot_x.host.posS(tip_x.host);
    else return true;
  } else {
    return false;
  }
};

//jjjj TOCLEANUP
// /** @final */
// export class LinkLI extends LexdInfo {}

/**
 * Bracket Open
 * @final
 */
export class BrktOpen_LI extends LexdInfo {
  readonly host;

  active = true;
  is_image;

  emphdelims;
  prev: BrktOpen_LI | undefined;
  next: BrktOpen_LI | undefined;

  constructor(
    host_x: MdextTk,
    is_image_x: boolean,
    emphdelims_x?: EmphDelim_LI,
  ) {
    super();
    this.host = host_x;
    this.is_image = is_image_x;
    this.emphdelims = emphdelims_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // insertPrev(ret_x: BrktOpen_LI) {
  //   if (this.prev) {
  //     this.prev.next = ret_x;
  //     ret_x.prev = this.prev;
  //   } else {
  //     ret_x.prev = undefined;
  //   }

  //   ret_x.next = this;
  //   this.prev = ret_x;

  //   return ret_x;
  // }
  insertNext(ret_x: BrktOpen_LI) {
    if (this.next) {
      this.next.prev = ret_x;
      ret_x.next = this.next;
    } else {
      ret_x.next = undefined;
    }

    ret_x.prev = this;
    this.next = ret_x;

    return ret_x;
  }
}

/** @final */
export class LinkDest_LI extends LexdInfo {}

/** @final */
export class FencedCBHead_LI extends LexdInfo {
  indent;

  constructor(indent_x: lcol_t) {
    super();
    this.indent = indent_x;
  }
}

/** @final */
export class ListMrkr_LI extends LexdInfo {
  indent!: lcol_t;
  padding!: lcol_t;

  constructor(indent_x: lcol_t, padding_x: lcol_t) {
    super();
    this.set(indent_x, padding_x);
  }

  set(indent_x: lcol_t, padding_x: lcol_t) {
    this.indent = indent_x;
    this.padding = padding_x;
  }
}

/** @final */
export class RawHTML_LI extends LexdInfo {
  readonly #host;

  #mode: HTMLMode | undefined;
  get mode() {
    return this.#mode;
  }

  hasHead = false;

  #hasTail = false;
  /** @const @param mode_x */
  hasTail(mode_x: HTMLMode): boolean {
    if (this.#mode === mode_x) return this.#hasTail;

    const m_ = this.#mode = mode_x;
    if (
      (m_ === HTMLMode.cm_1 || m_ === HTMLMode.cm_2 ||
        m_ === HTMLMode.cm_3 || m_ === HTMLMode.cm_4 ||
        m_ === HTMLMode.cm_5) &&
      HTMLBlock.Cloz_re[m_].test(this.#host.getText())
    ) this.#hasTail = true;
    else this.#hasTail = false;

    return this.#hasTail;
  }

  constructor(host_x: MdextTk) {
    super();
    this.#host = host_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override toString(): string {
    const ret_a: string[] = [];
    if (this.hasHead) ret_a.push("hasHead");
    if (this.#hasTail) ret_a.push("hasTail");
    return ret_a.join(",");
  }
}

/** @final */
export class URI_LI extends LexdInfo {
  #bart;
  #lexr: URILexr;
  #pazr: URIPazr;

  #ok = false;
  get ok() {
    return this.#ok;
  }

  /**
   * `in( strtLoc_x.bufr)`
   * @borrow @primaryconst @param strtLoc_x
   */
  constructor(strtLoc_x: Loc) {
    super();
    this.#bart = new TokBart<URITok>(strtLoc_x.bufr!, strtLoc_x.lidx_1);
    this.#lexr = g_urilexr_fac.setBart(this.#bart, strtLoc_x.loff_$).oneMore();
    this.#pazr = g_uripazr_fac.setLexr(this.#lexr).oneMore();

    this.#lexr.lex();
    const lastTk = this.#lexr.lastLexTk;
    const l2ndTk = lastTk.prevToken_$!;
    if (
      l2ndTk === this.#lexr.frstLexTk ||
      this.#lexr.hasErr && !this.#lexr.onlyErr(Err.uri_invalid_tail, lastTk)
    ) return;

    lastTk.setStrt(l2ndTk.sntStopLoc);
    lastTk.setStop(l2ndTk.sntStopLoc);
    lastTk.clrErr();
    this.#lexr.clrErr_$();

    this.#pazr.paz();
    if (!this.#pazr.hasErr) this.#ok = true;
  }

  #destroyed = false;
  // get destroyed() {
  //   return this.#destroyed;
  // }
  override destructor(): void {
    if (this.#destroyed) return;

    g_urilexr_fac.revoke(this.#lexr);
    g_uripazr_fac.revoke(this.#pazr);

    this.#destroyed = true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** `in( this.#ok)` */
  get stopLoff(): loff_t {
    return this.#lexr.lastLexTk.sntStopLoff;
  }

  get hasScheme(): boolean {
    return (this.#pazr.root as URI).hasScheme;
  }

  get isEmail_1(): boolean {
    return this.#ok && (this.#pazr.root as URI).isEmail_1;
  }
}
/*64----------------------------------------------------------*/

export class SortedMdextSnt_id extends SortedSnt_id {
  #n_Linkdef = 0;
  get n_Linkdef() {
    return this.#n_Linkdef;
  }

  constructor() {
    super();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override add(val_x: Snt): uint | -1 {
    const ret = super.add(val_x);
    if (val_x instanceof Linkdef) this.#n_Linkdef += 1;
    return ret;
  }

  override deleteByIndex() {
    return fail("Disabled");
  }
  override delete(val_x: Snt): uint | -1 {
    const ret = super.delete(val_x);
    if (val_x instanceof Linkdef) this.#n_Linkdef -= 1;
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
