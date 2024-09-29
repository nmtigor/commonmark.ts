/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextLexr
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/global.ts";
import type { int, lcol_t, loff_t, uint, uint16 } from "../../alias.ts";
import {
  isASCIIControl,
  isDecimalDigit,
  isLFOr0,
  isSpaceOrTab,
  isWhitespaceUCod,
  isWordLetter,
} from "../../util/general.ts";
import { assert, fail, out } from "../../util/trace.ts";
import { LexdInfo, Lexr } from "../Lexr.ts";
import type { Loc } from "../Loc.ts";
import type { MdextBufr } from "./MdextBufr.ts";
import { MdextTk } from "../Token.ts";
import { MdextPazr } from "./MdextPazr.ts";
import { MdextTok } from "./MdextTok.ts";
import { BlockCont } from "./alias.ts";
import { Block } from "./stnode/Block.ts";
import { BlockQuote } from "./stnode/BlockQuote.ts";
import { FencedCodeBlock, IndentedCodeBlock } from "./stnode/CodeBlock.ts";
import { CtnrBlock } from "./stnode/CtnrBlock.ts";
import { Document } from "./stnode/Document.ts";
import { HTMLBlock, HTMLMode } from "./stnode/HTMLBlock.ts";
import { HTMLInline } from "./stnode/HTMLInline.ts";
import { ATXHeading, ATXHeadingSt, SetextHeading } from "./stnode/Heading.ts";
import type { ILoc } from "./stnode/InlineBlock.ts";
import { LinkMode } from "./stnode/Link.ts";
import { BulletList, List, OrderdList } from "./stnode/List.ts";
import { BulletListItem, ListItem, OrderdListItem } from "./stnode/ListItem.ts";
import { Paragraph, type PLoc } from "./stnode/Paragraph.ts";
import { ThematicBreak } from "./stnode/ThematicBreak.ts";
import { Entity, Escaped, HardBr, SoftBr } from "./stnode/TokenSN.ts";
import {
  blankEnd,
  entitySizeAt,
  frstNonblankIn,
  lastNon,
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
  matchedPart,
  /** */
  matchedFull,
  //kkkk TOCLEANUP
  // /**
  //  * matched branch (non-leaf container), keep going
  //  * @deprecated Use `matchedPart` or `matchedFull`
  //  */
  // matchedBran,
  /**
   * matched leaf, no more block starts
   */
  matchedLeaf,
}
type BlockStrtCheckr_ = (ctnr_x: Block) => BlockStrt_;

const maybeSpecial_a_ = /* deno-fmt-ignore */ [
  /* "#" */0x23, /* "*" */0x2A, /* "+" */0x2B, /* "-" */0x2D, /* "<" */0x3C, 
  /* "=" */0x3D, /* ">" */0x3E, /* "_" */0x5F, /* "`" */0x60, /* "~" */0x7E, 
];
/** reMaybeSpecial = /^[#`~*+_=<>0-9-]/ */
const maybeSpecial_ = (_x: uint16) =>
  maybeSpecial_a_.indexOf(_x) >= 0 || isDecimalDigit(_x);

const Nonmain_a_ = /* deno-fmt-ignore */ [
  /* "!" */0x21, /* "&" */0x26, /* "*" */0x2A, /* "<" */0x3C, /* "[" */0x5B, 
  /* "\\" */0x5C, /* "]" */0x5D, /* "_" */0x5F, /* "`" */0x60, 

  // /* '"' */0x22, /* "'" */0x27, 
];
/** reMain = /^[^\n`\[\]\\!<&*_'"]+/m */
const main_ = (_x: uint16) => Nonmain_a_.indexOf(_x) < 0;

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
  Punct_a_.indexOf(_x) >= 0 ||
  Punct_re_.test(String.fromCharCode(_x));

/** ESCAPABLE = "[!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]" */
const escapable_ = (_x: uint16) => Punct_a_.indexOf(_x) >= 0;

const LinkHead_a_ = /* deno-fmt-ignore */ [
  /* "!" */0x21, /* "#" */0x23, /* "$" */0x24, /* "%" */0x25, /* "&" */0x26, 
  /* "'" */0x27, /* "*" */0x2A, /* "+" */0x2B, /* "-" */0x2D, /* "." */0x2E, 
  /* "/" */0x2F, /* "=" */0x3D, /* "?" */0x3F, /* "^" */0x5E, /* "`" */0x60, 
  /* "{" */0x7B, /* "|" */0x7C, /* "}" */0x7D, /* "~" */0x7E, 
];
const linkhead_ = (_x: uint16) =>
  isWordLetter(_x) || LinkHead_a_.indexOf(_x) >= 0;
/** reEmailAutolink */
const EmailAutolink_re_ =
  /^<(?:[\w.!#$%&'*+\/=?^`{|}~-]+@[0-9A-Za-z](?:[0-9A-Za-z-]{0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:[0-9A-Za-z-]{0,61}[0-9A-Za-z])?)*)>/;
/** reAutolink */
const URLAutolink_re_ = /^<[A-Za-z][0-9A-Za-z.+-]{1,31}:[^<>\x00-\x20]*>/;

const LLabelNormr_re_ = /[ \t\r\n]+/g;

/** @final */
export class MdextLexr extends Lexr<MdextTok> {
  #pazr!: MdextPazr;
  get _root() {
    return this.#pazr.root;
  }

  #ctx = Ctx_.sol;
  #ctnr!: Block;

  #tip!: Block;
  #oldtip!: Block;
  #allClosed = true;
  #lastMatchedCtnr!: Block;
  /** Update `#tip`, `#oldtip`, `#allClosed`  */
  #closeUnmatchedBlocks(): void {
    if (!this.#allClosed) {
      /* finalize any blocks not matched */
      while (this.#oldtip !== this.#lastMatchedCtnr) {
        this.#oldtip = this.#tip = this.#oldtip.closeBlock();
      }
      this.#allClosed = true;
    }
  }

  /* #poc */
  #poc;
  /**
   * Peek next nonspace from start of container\
   * Assign `#poc`, `#blank`, `#indent`, `#indented`
   */
  #peekNextNonspaceSoc(): void {
    this.#poc.become(this.curLoc$);
    this.#poc.loff = frstNonblankIn(this.curLoc$.line_$, this.curLoc$.loff_$);
    this.#blank = this.#poc.atEol;
    this.#indent = -this.curLoc$.lcol_1() + this.#poc.lcolBy(this.curLoc$);
    this.#indented = this.#indent >= IndentedCodeBlock.indent;
  }
  /* ~ */

  #blank = false;
  #indent: lcol_t = 0;
  #indented = false;

  #outTk!: MdextTk;

  readonly refmap: Record<
    string,
    {
      labelTk_a: MdextTk[];
      destTk_a: MdextTk[];
      titleTk_a: MdextTk[] | undefined;
    }
  > = {};

  _enableTags = true;

  private constructor(bufr_x: MdextBufr) {
    super(bufr_x);
    this.#poc = this.curLoc$.dup();
  }
  /**
   * @headconst @param bufr_x
   */
  static create(bufr_x: MdextBufr) {
    const lexr = new MdextLexr(bufr_x);
    const pazr = new MdextPazr(bufr_x, lexr);
    lexr.#pazr = pazr;
    pazr.drtSn_$ = pazr.root;
    lexr.#ctnr =
      lexr.#tip =
      lexr.#oldtip =
      lexr.#lastMatchedCtnr =
        pazr.drtSn_$ as Block;
    return lexr;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Assign `#outTk` a `MdextTok.chunk` token up from `curLoc$` to eol
   */
  #chunkEnd(): void {
    this.#outTk.strtLoc.become(this.curLoc$);
    this.curLoc$.toEol();
    this.setTok$(MdextTok.chunk, this.#outTk);
  }

  #blockStrtCheckr_a: BlockStrtCheckr_[] = [
    /** block quote */
    () => {
      if (this.#indented || this.#poc.ucod !== /* ">" */ 0x3E) {
        return BlockStrt_.continue;
      }

      this.#closeUnmatchedBlocks();

      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.loff = this.#poc.loff_$ + 1;
      this.setTok$(MdextTok.block_quote_marker, this.#outTk);
      this.#addChild(new BlockQuote(this.#outTk));

      /* optional following space */
      if (isSpaceOrTab(this.curLoc$.ucod)) {
        this.curLoc$.forwnCol(1);
      }

      this.#ctx = Ctx_.BlockQuote;
      return BlockStrt_.matchedPart;
    },
    /** ATX heading */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      using loc = this.#poc.uoc();
      let level = 0;
      /** reATXHeadingMarker = /^#{1,6}(?:[ \t]+|$)/ */
      const lexATXHead = (): boolean => {
        let ucod: uint16;
        for (; level < 6; ++level) {
          ucod = loc.ucod;
          if (ucod !== /* "#" */ 0x23) {
            return level > 0 && (isSpaceOrTab(ucod) || isLFOr0(ucod));
          }
          loc.forw();
        }
        ucod = loc.ucod;
        return isSpaceOrTab(ucod) || isLFOr0(ucod);
      };
      if (!lexATXHead()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.become(loc);
      this.setTok$(MdextTok.atx_heading, this.#outTk);
      this.#addChild(new ATXHeading(this.#outTk));

      this.#ctx = Ctx_.ATXHeading;
      return BlockStrt_.matchedPart;
    },
    /** Fenced code block */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      using loc = this.#poc.uoc();
      /** reCodeFence = /^`{3,}(?!.*`)|^~{3,}/ */
      const lexFencedCBHead = (): boolean => {
        const ucod_0 = loc.ucod;
        if (ucod_0 !== /* "`" */ 0x60 && ucod_0 !== /* "~" */ 0x7E) {
          return false;
        }

        const ln_ = loc.line_$;
        let i_ = loc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== ucod_0) break;
        if (i_ - loc.loff_$ < 3) return false;

        loc.loff = i_;
        if (ucod_0 === /* "`" */ 0x60) {
          for (++i_; i_ < iI; ++i_) {
            if (ln_.ucodAt(i_) === /* "`" */ 0x60) return false;
          }
        }
        return true;
      };
      if (!lexFencedCBHead()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.become(loc);
      this.setTok$(MdextTok.code_fence, this.#outTk);
      this.#outTk.lexdInfo = new FencedCBHead_LI(this.#indent);
      this.#addChild(new FencedCodeBlock(this.#outTk));

      this.#ctx = Ctx_.FencedCodeBlock;
      return BlockStrt_.matchedPart;
    },
    /** HTML block */
    (ctnr_x: Block) => {
      if (this.#indented || this.#poc.ucod !== /* "<" */ 0x3C) {
        return BlockStrt_.continue;
      }

      let mode!: HTMLMode;
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
      if (!lexHTMLBlockHead()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      /* Not `#chunkEnd()` here because the block could be closed at the same
      line (e.g. `<pre></pre>`), so `#chunkEnd()` and `addLine()` later, and
      `closeBlock()` there if needed. */
      this.#addChild(new HTMLBlock(mode));

      return BlockStrt_.matchedLeaf;
    },
    /** Setext heading */
    (ctnr_x: Block) => {
      if (this.#indented || !(ctnr_x instanceof Paragraph)) {
        return BlockStrt_.continue;
      }

      using loc = this.#poc.uoc();
      /** reSetextHeadingLine = /^(?:=+|-+)[ \t]*$/ */
      const lexSetextTail = (): boolean => {
        const ucod_0 = loc.ucod;
        if (ucod_0 !== /* "=" */ 0x3D && ucod_0 !== /* "-" */ 0x2D) {
          return false;
        }

        const ln_ = loc.line_$;
        let i_ = loc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) if (ln_.ucodAt(i_) !== ucod_0) break;

        loc.loff = i_;
        return blankEnd(loc);
      };
      if (!lexSetextTail()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      ctnr_x.removeSelf();

      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.become(loc);
      this.setTok$(MdextTok.setext_heading, this.#outTk);
      this.#addChild(new SetextHeading(ctnr_x, this.#outTk));

      this.#toNextLine();
      return BlockStrt_.matchedFull;
    },
    /** Thematic break */
    () => {
      if (this.#indented) return BlockStrt_.continue;

      using loc = this.#poc.uoc();
      const ln_ = loc.line_$;
      /** reThematicBreak = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/ */
      const lexThematicBreak = (): boolean => {
        const ucod_0 = loc.ucod;
        if (
          ucod_0 !== /* "*" */ 0x2A && ucod_0 !== /* "_" */ 0x5F &&
          ucod_0 !== /* "-" */ 0x2D
        ) return false;

        let count = 1;
        let i_ = loc.loff_$ + 1;
        const iI = ln_.uchrLen;
        for (; i_ < iI; ++i_) {
          const ucod = ln_.ucodAt(i_);
          if (ucod === ucod_0) ++count;
          else if (!isSpaceOrTab(ucod)) break;
        }
        loc.loff = i_;
        return i_ === iI && count >= 3;
      };
      if (!lexThematicBreak()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      this.#outTk.strtLoc.become(this.#poc);
      loc.loff = lastNonblankIn(ln_, 0, loc.loff_$) + 1;
      this.curLoc$.become(loc);
      this.setTok$(MdextTok.thematic_break, this.#outTk);
      this.#addChild(new ThematicBreak(this.#outTk));

      this.#toNextLine();
      return BlockStrt_.matchedFull;
    },
    /** List item */
    (ctnr_x: Block) => {
      if (this.#indented) return BlockStrt_.continue;

      using loc = this.#poc.uoc();
      /** ucod of one of  "*", "+", "-", ")", "." */
      let sign = 0 as uint16;
      /** For ordered list item only */
      let start: uint | -1 = -1;
      /**
       * reBulletListMarker = /^[*+-]/\
       * reOrderedListMarker = /^(\d{1,9})([.)])/
       */
      const lexListMrkr = (): boolean => {
        let ucod = loc.ucod;
        if (
          ucod !== /* "*" */ 0x2A && ucod !== /* "+" */ 0x2B &&
          ucod !== /* "-" */ 0x2D
        ) {
          let i_ = 0;
          for (; i_ < 10; ++i_) {
            if (!isDecimalDigit(ucod)) break;

            loc.forw();
            ucod = loc.ucod;
          }
          if (
            i_ === 0 || i_ === 10 ||
            ucod !== /* ")" */ 0x29 && ucod !== /* "." */ 0x2E
          ) return false;

          start = parseInt(loc.getText(this.#poc.loff_$, loc.loff_$));
          if (ctnr_x instanceof Paragraph && start !== 1) return false;
        }
        sign = ucod;
        ucod = loc.forw_ucod();
        /* make sure we have spaces after */
        if (!isSpaceOrTab(ucod) && !isLFOr0(ucod)) return false;
        /* if it interrupts paragraph, make sure first line isn't blank */
        if (ctnr_x instanceof Paragraph && blankEnd(loc)) return false;

        return true;
      };
      if (!lexListMrkr()) return BlockStrt_.continue;

      this.#closeUnmatchedBlocks();

      const mrkrSize = loc.loff_$ - this.#poc.loff_$;
      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.become(loc);
      this.setTok$(
        mrkrSize === 1
          ? MdextTok.bullet_list_marker
          : MdextTok.ordered_list_marker,
        this.#outTk,
      );
      this.curLoc$.loff = frstNonblankIn(loc.line_$, loc.loff_$);
      /** spaces_after_marker */
      // let lcol = this.curLoc$.loff_$ - loc.loff_$;
      let lcol: lcol_t = -loc.lcol_1() + this.curLoc$.lcolBy(loc);
      if (
        lcol === 0 || lcol >= IndentedCodeBlock.indent + 1 ||
        this.curLoc$.reachEol
      ) {
        lcol = 1;
        this.curLoc$.become(loc);
        if (isSpaceOrTab(this.curLoc$.ucod)) this.curLoc$.forwnCol(1);
      }
      this.#outTk.lexdInfo = new ListMrkr_LI(this.#indent, mrkrSize + lcol);

      /* add the list if needed */
      if (!(ctnr_x instanceof List) || ctnr_x.sign !== sign) {
        this.#addChild(
          mrkrSize === 1 ? new BulletList(sign) : new OrderdList(start, sign),
        );
      }

      /* add the list item */
      this.#addChild(
        mrkrSize === 1
          ? new BulletListItem(this.#outTk)
          : new OrderdListItem(this.#outTk),
      );

      this.#ctx = Ctx_.ListItem;
      return BlockStrt_.matchedPart;
    },
    /** Indented code block */
    () => {
      if (!this.#indented || this.#tip instanceof Paragraph || this.#blank) {
        return BlockStrt_.continue;
      }

      this.#closeUnmatchedBlocks();

      this.curLoc$.forwnCol(IndentedCodeBlock.indent);
      this.#chunkEnd();
      this.#addChild(new IndentedCodeBlock(this.#outTk));

      this.#toNextLine();
      return BlockStrt_.matchedFull;
    },
  ];

  /**
   * Add `ret_x` as a child of `#tip`.  If `#tip` can't accept children, close
   * and finalize it and try its parent, and so on till we find a block that can
   * accept children.\
   * Reset `#tip` to `ret_x`.
   */
  #addChild(ret_x: Block): void {
    const VALVE = 100;
    let valve = VALVE;
    while (!this.#tip.canContain(ret_x) && --valve) {
      this.#tip = this.#tip.closeBlock();
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    /*#static*/ if (INOUT) {
      assert(this.#tip instanceof CtnrBlock);
    }
    (this.#tip as CtnrBlock).appendBlock(ret_x);
    this.#tip = ret_x;
  }

  #toNextLine() {
    this.curLoc$.toEol().forw();
    this.#ctx = Ctx_.sol;
    /*#static*/ if (INOUT) {
      assert(this.#pazr.drtSn_$ instanceof Block);
    }
    this.#ctnr = this.#pazr.drtSn_$ as Block;
  }

  #lexBlock(ctnr_x: Block) {
    const matchedLeaf = ctnr_x.acceptsLines && !(ctnr_x instanceof Paragraph);
    if (!matchedLeaf) {
      this.#peekNextNonspaceSoc();

      if (this.#indented || maybeSpecial_(this.#poc.ucod)) {
        const strts = this.#blockStrtCheckr_a;
        const strtsLen = strts.length;
        let i_ = 0;
        L_0: for (; i_ < strtsLen; ++i_) {
          switch (strts[i_](ctnr_x)) {
            case BlockStrt_.matchedPart:
            case BlockStrt_.matchedFull:
              return;
              //kkkk TOCLEANUP
              // case BlockStrt_.matchedBran:
              //   ctnr_x = this.#tip;
              //   break L_0;
            case BlockStrt_.matchedLeaf:
              break L_0;
          }
        }
        if (i_ === strtsLen) {
          /* nothing matched */
          this.curLoc$.become(this.#poc);
        }
      } else {
        /* this is a little performance optimization */
        this.curLoc$.become(this.#poc);
      }
    }

    /* What remains at the offset is a text line.  Add the text to the
    appropriate container. */

    if (
      !this.#allClosed && !this.#blank && this.#tip instanceof Paragraph
    ) {
      /* lazy paragraph continuation */
      this.#chunkEnd();
      this.#tip.appendLine(this.#outTk);
    } else {
      /* not a lazy continuation */
      this.#closeUnmatchedBlocks();

      if (this.#tip.acceptsLines) {
        const loff_0 = this.curLoc$.loff_$;
        this.#chunkEnd();
        this.#tip.appendLine(this.#outTk);

        if (this.#tip instanceof HTMLBlock) {
          const mode = this.#tip.mode;
          if (
            (mode === HTMLMode.cm_1 || mode === HTMLMode.cm_2 ||
              mode === HTMLMode.cm_3 || mode === HTMLMode.cm_4 ||
              mode === HTMLMode.cm_5) &&
            HTMLBlock.Cloz_re[mode].test(this.curLoc$.getText(loff_0))
          ) this.#tip = this.#tip.closeBlock();
        }
      } else if (/* !this.curLoc$.reachEol &&  */ !this.#blank) {
        this.#chunkEnd();
        this.#addChild(new Paragraph(this.#outTk));
      }
    }
    this.#toNextLine();
  }

  #lexLine() {
    let ctnr = this.#ctnr;
    this.#oldtip = this.#tip;
    this.#blank = false;

    let lastChild: Block | undefined;
    /* For each containing block, try to parse the associated line start.
    Bail out on failure: container will point to the last matching block.
    Set all_matched to false if not all containers match. */
    L_0: while ((lastChild = ctnr.lastChild) && lastChild.open) {
      ctnr = lastChild;

      this.#peekNextNonspaceSoc();

      switch (ctnr.continue(this)) {
        case BlockCont.matchedPart:
        case BlockCont.matchedFull:
          return;
        case BlockCont.break:
          /*  we've failed to match a block */
          ctnr = ctnr.parent_$ as Block; // `Document` returns `BlockCont.continue`
          break L_0;
      }
    }

    this.#allClosed = ctnr === this.#oldtip;
    this.#lastMatchedCtnr = ctnr;
    this.#lexBlock(ctnr);
  }

  /** @implement */
  protected scan_impl$(out_x: MdextTk): void {
    this.#outTk = out_x;
    /* final switch */ ({
      [Ctx_.sol]: () => {
        this.#lexLine();
      },
      [Ctx_.BlockQuote]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof BlockQuote);
        }
        this.#lexBlock(this.#tip);
      },
      [Ctx_.ListItem]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof ListItem);
        }
        this.#lexBlock(this.#tip);
      },
      [Ctx_.ATXHeading]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof ATXHeading);
        }
        const ctnr = this.#tip as ATXHeading;
        if (ctnr.st === ATXHeadingSt.head) {
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
                this.#outTk.strtLoc.become(this.curLoc$);
                this.curLoc$.loff = tailStop;
                this.setTok$(MdextTok.atx_heading, this.#outTk);
                ctnr.setTail(this.#outTk);

                this.#toNextLine();
              } else {
                if (isSpaceOrTab(ln_.ucodAt(lastNonhash))) {
                  /* has valid `ATXHeading.#tail` */
                  ctnr.tailStrt_$ = tailStrt;
                  ctnr.tailStop_$ = tailStop;

                  this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
                  this.#outTk.strtLoc.become(this.curLoc$);
                  this.curLoc$.loff = lastNonblankIn(
                    ln_,
                    strt + 1,
                    lastNonhash,
                  ) + 1;
                  this.setTok$(MdextTok.chunk, this.#outTk);
                  ctnr.setChunk(this.#outTk);
                } else {
                  /* no valid `ATXHeading.#tail` */
                  this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
                  this.#outTk.strtLoc.become(this.curLoc$);
                  this.curLoc$.loff = tailStop;
                  this.setTok$(MdextTok.chunk, this.#outTk);
                  ctnr.setChunk(this.#outTk);

                  this.#toNextLine();
                }
              }
            } else {
              /* has `ATXHeading.#text` only */
              this.curLoc$.loff = frstNonblankIn(ln_, strt + 1);
              this.#outTk.strtLoc.become(this.curLoc$);
              this.curLoc$.loff = lastNonspace + 1;
              this.setTok$(MdextTok.chunk, this.#outTk);
              ctnr.setChunk(this.#outTk);

              this.#toNextLine();
            }
          }
        } else if (ctnr.st === ATXHeadingSt.chunk) {
          /*#static*/ if (INOUT) {
            assert(0 < ctnr.tailStrt_$ && ctnr.tailStrt_$ < ctnr.tailStop_$);
          }
          this.curLoc$.loff = ctnr.tailStrt_$;
          this.#outTk.strtLoc.become(this.curLoc$);
          this.curLoc$.loff = ctnr.tailStop_$;
          this.setTok$(MdextTok.atx_heading, this.#outTk);
          ctnr.setTail(this.#outTk);

          this.#toNextLine();
        } else {
          /*#static*/ if (INOUT) {
            fail("Should not run here!");
          }
          this.#toNextLine();
        }
      },
      [Ctx_.FencedCodeBlock]: () => {
        /*#static*/ if (INOUT) {
          assert(this.#tip instanceof FencedCodeBlock);
        }
        if (!blankEnd(this.curLoc$)) {
          this.#chunkEnd();
          (this.#tip as FencedCodeBlock).setHeadChunk(this.#outTk);
        }

        this.#toNextLine();
      },
    }[this.#ctx])();
  }

  protected override suflex$(): void {
    while (!(this.#tip instanceof Document)) {
      this.#tip = this.#tip.closeBlock();
    }
    this.#tip
      .reference(this)
      .inline(this);

    super.suflex$();
  }

  continueBlockQuote_$(_x: BlockQuote): BlockCont {
    if (this.#indented || this.#poc.ucod !== /* ">" */ 0x3E) {
      return BlockCont.break;
    }

    this.#outTk.strtLoc.become(this.#poc);
    this.curLoc$.loff = this.#poc.loff_$ + 1;
    this.setTok$(MdextTok.block_quote_marker, this.#outTk);
    _x.addMrkr(this.#outTk);

    /* optional following space */
    if (isSpaceOrTab(this.curLoc$.ucod)) {
      this.curLoc$.forwnCol(1);
    }

    this.#ctx = Ctx_.sol;
    this.#ctnr = _x;
    return BlockCont.matchedPart;
  }

  continueListItem_$(_x: ListItem): BlockCont {
    if (this.#blank) {
      if (_x.empty) {
        /* Blank line after empty list item */
        return BlockCont.break;
      } else {
        this.curLoc$.become(this.#poc);
        return BlockCont.continue;
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
      this.curLoc$.become(this.#poc);
      return BlockCont.continue;
    } else {
      return BlockCont.break;
    }
  }

  continueFencedCodeBlock_$(_x: FencedCodeBlock): BlockCont {
    using loc = this.#poc.uoc();
    /** reClosingCodeFence = /^(?:`{3,}|~{3,})(?=[ \t]*$)/ */
    const lexFenceTail = (): boolean => {
      if (this.#indented) return false;

      const headUCod = _x.headUCod;
      const headSize = _x.headSize;
      let i_ = loc.loff_$;
      const ln_ = loc.line_$;
      for (const iI = ln_.uchrLen; i_ < iI; ++i_) {
        if (ln_.ucodAt(i_) !== headUCod) break;
      }
      if (i_ - loc.loff_$ < headSize) return false;

      loc.loff = i_;
      if (!blankEnd(loc)) return false;

      return true;
    };
    if (lexFenceTail()) {
      this.#outTk.strtLoc.become(this.#poc);
      this.curLoc$.become(loc);
      this.setTok$(MdextTok.code_fence, this.#outTk);
      _x.setTail(this.#outTk);

      this.#tip = _x.closeBlock();

      this.#toNextLine();
      return BlockCont.matchedFull;
    } else {
      for (let i = _x.headIndent; i--;) {
        if (!isSpaceOrTab(this.curLoc$.ucod)) break;
        this.curLoc$.forwnCol(1);
      }
      return BlockCont.continue;
    }
  }

  continueHTMLBlock_$(_x: HTMLBlock): BlockCont {
    return this.#blank &&
        (_x.mode === HTMLMode.cm_6 || _x.mode === HTMLMode.cm_7)
      ? BlockCont.break
      : BlockCont.continue;
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
  @out((ret, _, args) => {
    if (ret) {
      assert(args[0].ucod === /* "]" */ 0x5D);
      assert(args[1].length >= 2);
    }
  })
  private _lexLinkLabel(iloc_x: ILoc, outTk_a_x: MdextTk[]): boolean {
    /*#static*/ if (INOUT) {
      assert(outTk_a_x.length === 1);
    }
    using loc = iloc_x.uoc();

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
                ++count;
                continue;
              default:
                ++count;
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
        const loc_1 = iloc_x.curStopLoc;
        /*#static*/ if (INOUT) {
          assert(curStopLoc !== loc_1);
        }
        curStopLoc = loc_1;
        loc.become(iloc_x);
      } else if (ucod === 0) {
        if (loc.loff_$ - iloc_x.loff_$ > 0) {
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text);
        }
        break;
      } else {
        /*#static*/ if (INOUT) {
          fail("Should not run here!");
        }
        // if (loc.loff_$ - iloc_x.loff_$ > 0) {
        //   outTk_a_x.push(
        //     iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text),
        //   );
        // }
        // iloc_x.refresh();
        // const loc_1 = iloc_x.curStopLoc;
        // /*#static*/ if (INOUT) {
        //   assert(curStopLoc !== loc_1);
        //   assert(loc.posE(iloc_x));
        // }
        // curStopLoc = loc_1;
      }
    }
    return seen && count > 0;
  }

  /**
   * reSpnl = /^ *(?:\n *)?/
   * @headconst @param iloc_x
   */
  #lexSpnl(iloc_x: ILoc): boolean {
    let sp_ = 0;
    /** new line */
    let nl_ = false;
    let curStopLoc = iloc_x.curStopLoc;
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
        iloc_x.refresh();
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

  /**
   * reLinkDestinationBraces = /^(?:<(?:[^<>\n\\\x00]|\\.)*>)/
   * @headconst @param ploc_x
   * @out @param outTk_a_x
   */
  @out((ret, _, args) => {
    if (ret) {
      assert(1 <= args[1].length && args[1].length <= 3);
    }
  })
  private _lexLinkDest(iloc_x: ILoc, outTk_a_x: MdextTk[]): uint | -1 {
    /*#static*/ if (INOUT) {
      assert(!outTk_a_x.length);
    }
    using loc = iloc_x.uoc();

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
  @out((ret, _, args) => {
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
    using loc = iloc_x.uoc();

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
          loc.become(iloc_x);
        }
      } else if (ucod === 0) {
        iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text);
        break;
      } else {
        outTk_a_x.push(
          iloc_x.setCurTk(this, loc.loff_$ - iloc_x.loff_$, MdextTok.text),
        );

        iloc_x.refresh();
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
   * ! Make sure no holes in token chain, because this is called before
   * `lexInline_$()`
   * @headconst @param iloc_x
   */
  lexReference_$(iloc_x: ILoc): boolean {
    if (iloc_x.ucod !== /* "[" */ 0x5B) return false;

    const labelTk_a = [
      iloc_x.setCurTk(this, 1, MdextTok.bracket_open),
    ];
    if (!this._lexLinkLabel(iloc_x, labelTk_a)) return false;

    if (iloc_x.peek_ucod(1) !== /* ":" */ 0x3A) return false;
    labelTk_a.push(
      iloc_x.setCurTk(this, 2, MdextTok.bracket_colon),
    );

    this.#lexSpnl(iloc_x);
    const destTk_a: MdextTk[] = [];
    const destSize = this._lexLinkDest(iloc_x, destTk_a);
    if (
      destSize < 0 ||
      destSize === 0 && destTk_a.at(0)?.value !== MdextTok.link_dest_head
    ) return false;

    /** Loc for fallback */
    using loc_fb = iloc_x.uoc();

    let titleTk_a: MdextTk[] | undefined;
    if (this.#lexSpnl(iloc_x)) {
      titleTk_a = [];
      if (!this._lexTitle(iloc_x, titleTk_a)) {
        titleTk_a = undefined;
        iloc_x.toLoc(loc_fb);
      }
    }

    if (!blankEnd(iloc_x)) {
      if (titleTk_a?.length) {
        /* The potential title we found is not at the line end, but it could
        still be a legal link reference if we discard the title. */
        iloc_x.toLoc(loc_fb);
        if (!blankEnd(iloc_x)) return false;

        titleTk_a = undefined;
      } else {
        return false;
      }
    }

    const normlabel = labelTk_a
      .slice(1, -1)
      .map((tk) => tk.getText())
      .join(" ")
      .trim()
      .replace(LLabelNormr_re_, " ")
      .toLowerCase()
      .toUpperCase();
    /*#static*/ if (INOUT) {
      assert(normlabel);
    }
    this.refmap[normlabel] ??= { labelTk_a, destTk_a, titleTk_a };

    iloc_x.host.addLinkdef(labelTk_a, destTk_a, titleTk_a);
    return true;
  }

  /**
   * @headconst @param iloc_x
   */
  lexInline_$(iloc_x: ILoc): boolean {
    const ucod = iloc_x.ucod;
    if (!ucod) return false;

    let handled = false;
    switch (ucod) {
      case /* "\n" */ 0xA: {
        if (iloc_x.peek_ucod(-1) === /* " " */ 0x20) {
          if (iloc_x.peek_ucod(-2) === /* " " */ 0x20) {
            const loff_1 = iloc_x.loff_$;
            iloc_x.loff = 1 + lastNon(
              /* " " */ 0x20 as uint16,
              iloc_x.line_$,
              iloc_x.curTk_$.strtLoff,
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
        using loc_fb = iloc_x.uoc();
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
        using loc = iloc_x.uoc();
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
        tk_.lexdInfo = new BrktOpen_LI(tk_, false, iloc_x.tailEmphDelim);
        iloc_x.tailBrktOpen = tk_.lexdInfo as BrktOpen_LI;
        handled = true;
        break;
      }
      case /* "!" */ 0x21: {
        using loc = iloc_x.uoc().forw();
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
        using loc = iloc_x.uoc().forw();
        if (!linkhead_(loc.ucod)) break;

        let s_ = iloc_x.getText();
        let found, isEmail: boolean;
        if (found = EmailAutolink_re_.exec(s_)) {
          isEmail = true;
        } else if (found = URLAutolink_re_.exec(s_)) {
          isEmail = false;
        }
        const forwSetTks_inline = (size_y: loff_t): MdextTk[] => {
          loc.become(iloc_x);
          loc.loff += size_y;
          const ret_a: MdextTk[] = [];
          iloc_x.forwSetTks_inline(this, MdextTok.chunk, ret_a, loc);
          return ret_a;
        };
        if (found) {
          const frstTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_head);
          const destTk_a = forwSetTks_inline(found[0].length - 2);
          const lastTk = iloc_x.setCurTk(this, 1, MdextTok.link_dest_tail);
          iloc_x.host.addAutolink(frstTk, destTk_a, lastTk, isEmail!);
          handled = true;
        } else {
          s_ = `${s_}\n${iloc_x.forwTextBelow()}`;
          if (found = HTMLInline.HTMLTag_re.exec(s_)) {
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
      const ln_ = iloc_x.line_$;
      let i_ = iloc_x.loff_$ + 1;
      const iI = iloc_x.curStopLoc.loff_$;
      /*#static*/ if (INOUT) {
        assert(i_ <= iI);
      }
      for (; i_ < iI; ++i_) if (!main_(ln_.ucodAt(i_))) break;
      iloc_x.setCurTk(this, i_ - iloc_x.loff_$, MdextTok.text);
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
      //kkkk TOCLEANUP
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
      //kkkk TOCLEANUP
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

    /* If we got here, open is a potential opener */
    let linkmode, textClozTk, lastTk, destTk_a, titleTk_a;
    const is_image = opener.is_image;

    /* Check to see if we have a link/image */
    let matched = false;
    /** Loc for fallback */
    using loc_fb = iloc_x.uoc();

    /* Inline link? */
    if (loc_fb.peek_ucod(1) === /* "(" */ 0x28) {
      linkmode = LinkMode.inline;
      /* "]" and "(" must not have been seperated yet. */
      textClozTk = iloc_x.setCurTk(this, 2, MdextTok.bracket_paren);
      this.#lexSpnl(iloc_x);
      destTk_a = [] as MdextTk[];
      if (this._lexLinkDest(iloc_x, destTk_a) >= 0) {
        if (this.#lexSpnl(iloc_x)) {
          titleTk_a = [] as MdextTk[];
          this._lexTitle(iloc_x, titleTk_a);
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
        let curLn = upTk_y.frstLine;
        const VALVE = 100;
        let valve = VALVE;
        for (let tk = upTk_y; tk !== toTk_y && --valve;) {
          const ln_ = tk.frstLine;
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
        const labelTk_a = [
          iloc_x.setCurTk(this, 1, MdextTok.bracket_open),
        ];
        if (loc_fb.peek_ucod(2) === /* "]" */ 0x5D) {
          /* [...][] */
          linkmode = LinkMode.ref_collapsed;
          lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
          label = openerLabel(textClozTk);
        } else if (this._lexLinkLabel(iloc_x, labelTk_a)) {
          /* [...][...] */
          linkmode = LinkMode.ref_full;
          lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
          labelTk_a.push(lastTk);
          label = openerLabel(labelTk_a.at(-1)!, labelTk_a[1]);
        } else if (!opener.prev) {
          /* [...] */
          linkmode = LinkMode.ref_shortcut;
          lastTk = iloc_x.toTk("strt", textClozTk)
            .setCurTk(this, 1, MdextTok.bracket_cloz);
          textClozTk.value = MdextTok.bracket_open;
          textClozTk = lastTk;
          label = openerLabel(textClozTk);
        }
      } else {
        /* [...] */
        linkmode = LinkMode.ref_shortcut;
        textClozTk = lastTk = iloc_x.setCurTk(this, 1, MdextTok.bracket_cloz);
        label = openerLabel(lastTk);
      }
      if (label) {
        const normlabel = label
          .trim()
          .replace(LLabelNormr_re_, " ")
          .toLowerCase()
          .toUpperCase();
        const link = this.refmap[normlabel];
        if (link) {
          destTk_a = link.destTk_a;
          titleTk_a = link.titleTk_a;
          matched = true;
        }
      }
    }

    if (!matched) {
      iloc_x.removeBrktOpen(opener);
      iloc_x.toLoc(loc_fb);
      iloc_x.toNextTk("strt");
      return;
    }

    /*#static*/ if (INOUT) {
      assert(linkmode && textClozTk && lastTk);
      assert(
        textClozTk!.value === MdextTok.bracket_paren ||
          textClozTk!.value === MdextTok.bracket_cloz,
      );
      assert(textClozTk!.strtLoc.posE(loc_fb));
    }

    using loc_save = iloc_x.uoc();
    iloc_x.toLoc(loc_fb);
    this.lexEmphasis_$(iloc_x, opener.emphdelims);
    iloc_x.toLoc(loc_save);

    iloc_x.host.addLink(
      linkmode!,
      opener.host,
      textClozTk!,
      lastTk!,
      destTk_a,
      titleTk_a,
    );

    iloc_x.removeBrktOpen(opener);
    /* We remove this bracket and processEmphasis will remove later delimiters.
    Now, for a link, we also deactivate earlier link openers.
    (no links in links) */
    if (!is_image) {
      opener = iloc_x.tailBrktOpen;
      const VALVE = 100;
      let valve = VALVE;
      while (opener !== undefined) {
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
    return this.host.strtLoc.ucod;
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

  //kkkk TOCLEANUP
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

//kkkk TOCLEANUP
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
  indent;
  padding;

  constructor(indent_x: lcol_t, padding_x: lcol_t) {
    super();
    this.indent = indent_x;
    this.padding = padding_x;
  }
}
/*80--------------------------------------------------------------------------*/
