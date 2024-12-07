/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/CodeBlock
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail } from "@fe-lib/util/trace.ts";
import { Block } from "./Block.ts";
import type { MdextTk } from "../../Token.ts";
import {
  _escapeXml,
  _tag,
  _toHTML,
  _unescapeString,
  lastNonblankIn,
} from "../util.ts";
import type { FencedCBHead_LI, MdextLexr } from "../MdextLexr.ts";
import type { BlockCont } from "../alias.ts";
import { INOUT } from "@fe-src/global.ts";
import type { lcol_t, lnum_t, loff_t, uint16 } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import type { SortedStnod_id } from "../../Stnode.ts";
import type { SortedSnt_id } from "../../Snt.ts";
import { BaseTok } from "../../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

export abstract class CodeBlock extends Block {
  override readonly acceptsLines = true;
  /**
   * @final
   * @headconst @param _x can be an empty token
   */
  override appendLine(_x: MdextTk): void {
    this.chunkTk_a$.push(_x);

    this.invalidateBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected readonly chunkTk_a$: MdextTk[] = [];

  override get children() {
    return undefined;
  }

  override reset(): this {
    super.reset();
    this.chunkTk_a$.length = 0;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    _unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    for (const tk of this.chunkTk_a$) {
      if (
        tk.value !== BaseTok.unknown &&
        (tk.sntStopLoc.posSE(drtStrtLoc_x) ||
          tk.sntStrtLoc.posGE(drtStopLoc_x))
      ) unrelSnt_sa_x.add(tk);
    }
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    //jjjj TOCLEANUP
    // const i_ = this.chunkTk_a$.findIndex((tk) => loc_x.posE(tk.sntStrtLoc));
    const i_ = this.chunkTk_a$.findIndex((tk) =>
      loc_x.line_$ === (tk.sntFrstLine)
    );
    return i_ >= 0 ? this.chunkTk_a$[i_].sntFrstLidx_1 : -1;
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: MdextTk[]) {
    for (const tk of this.chunkTk_a$) {
      const lidx = tk.sntFrstLidx_1;
      if (lidx > lidx_x) break;
      if (lidx === lidx_x) snt_a_x.push(tk);
    }
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class IndentedCodeBlock extends CodeBlock {
  static readonly indent = 4;

  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueIndentedCodeBlock_$(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override get frstToken() {
    return this.frstToken$ ??= this.chunkTk_a$[0];
  }
  override get lastToken() {
    return this.lastToken$ ??= this.chunkTk_a$.at(-1)!;
  }

  constructor(chunkTk_x: MdextTk) {
    super();
    this.chunkTk_a$.push(chunkTk_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Blank lines preceding or following an indented code block are not included
   * in it
   */
  protected override closeBlock_impl$(): void {
    while (lastNonblankIn(this.chunkTk_a$.at(-1)!.sntFrstLine) < 0) {
      this.chunkTk_a$.pop();
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    const s_a = ["<pre><code>"];
    for (const tk of this.chunkTk_a$) {
      s_a.push(_escapeXml(tk.getText()), "\n");
    }
    s_a.push("</code></pre>");
    return s_a.join("");
  }
}
/*80--------------------------------------------------------------------------*/

//jjjj TOCLEANUP
// export const enum FencedCodeBlockSt {
//   head = 1,
//   head_chunk,
//   chunk,
//   tail,
// }

/** @final */
export class FencedCodeBlock extends CodeBlock {
  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueFencedCodeBlock_$(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // #st;
  // get st() {
  //   return this.#st;
  // }

  /* #headTk */
  readonly #headTk;

  get headIndent(): lcol_t {
    return (this.#headTk.lexdInfo as FencedCBHead_LI).indent;
  }

  get headUCod(): uint16 {
    return this.#headTk.sntStrtLoc.ucod;
  }

  get headSize(): loff_t {
    return this.#headTk.length_1;
  }
  /* ~ */

  /* #headChunkTk */
  #headChunkTk: MdextTk | undefined;
  setHeadChunk(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      //jjjj TOCLEANUP
      // assert(!this.#headChunkTk && this.#st === FencedCodeBlockSt.head);
      assert(!this.#headChunkTk);
    }
    this.#headChunkTk = _x;
    //jjjj TOCLEANUP
    // this.#st = FencedCodeBlockSt.head_chunk;
  }
  /* ~ */

  /* #tailTk */
  #tailTk: MdextTk | undefined;
  setTail(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      //jjjj TOCLEANUP
      // assert(!this.#tailTk && this.#st !== FencedCodeBlockSt.tail);
      assert(!this.#tailTk);
    }
    this.#tailTk = _x;
    //jjjj TOCLEANUP
    // this.#st = FencedCodeBlockSt.tail;

    this.invalidateBdry();
  }
  /* ~ */

  override get frstToken() {
    return this.frstToken$ ??= this.#headTk;
  }
  override get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    return this.lastToken$ = this.#tailTk ??
      this.chunkTk_a$.at(-1) ??
      this.#headChunkTk ??
      this.#headTk;
  }

  constructor(headTk_x: MdextTk) {
    super();
    this.#headTk = headTk_x;
    //jjjj TOCLEANUP
    // this.#st = FencedCodeBlockSt.head;
  }

  override reset(): this {
    super.reset();
    this.#headChunkTk = undefined;
    this.#tailTk = undefined;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** */
  protected override closeBlock_impl$(): void {
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    _unrelSn_sa_x: SortedStnod_id,
    unrelSnt_sa_x: SortedSnt_id,
  ): void {
    let tk_ = this.#headTk;
    if (
      tk_.value !== BaseTok.unknown &&
      (tk_.sntStopLoc.posSE(drtStrtLoc_x) ||
        tk_.sntStrtLoc.posGE(drtStopLoc_x))
    ) unrelSnt_sa_x.add(tk_);

    if (this.#headChunkTk) {
      tk_ = this.#headChunkTk;
      if (
        tk_.value !== BaseTok.unknown &&
        (tk_.sntStopLoc.posSE(drtStrtLoc_x) ||
          tk_.sntStrtLoc.posGE(drtStopLoc_x))
      ) unrelSnt_sa_x.add(tk_);
    }

    super.gathrUnrelSnt(
      drtStrtLoc_x,
      drtStopLoc_x,
      _unrelSn_sa_x,
      unrelSnt_sa_x,
    );

    if (this.#tailTk) {
      tk_ = this.#tailTk;
      if (
        tk_.value !== BaseTok.unknown &&
        (tk_.sntStopLoc.posSE(drtStrtLoc_x) ||
          tk_.sntStrtLoc.posGE(drtStopLoc_x))
      ) unrelSnt_sa_x.add(tk_);
    }
  }

  override lidxOf(loc_x: Loc): lnum_t | -1 {
    //jjjj TOCLEANUP
    // if (
    //   loc_x.posE(this.#headTk.sntStrtLoc) ||
    //   this.#headChunkTk?.sntStrtLoc.posE(loc_x)
    // ) return this.#headTk.sntFrstLidx_1;
    if (loc_x.line_$ === this.#headTk.sntFrstLine) {
      return this.#headTk.sntFrstLidx_1;
    }

    //jjjj TOCLEANUP
    // if (this.#tailTk?.sntStrtLoc.posE(loc_x)) {
    //   return this.#tailTk.sntFrstLidx_1;
    // }
    if (loc_x.line_$ === this.#tailTk?.sntFrstLine) {
      return this.#tailTk.sntFrstLidx_1;
    }

    return super.lidxOf(loc_x);
  }

  override reuseLine(lidx_x: lnum_t, snt_a_x: MdextTk[]) {
    if (this.sntFrstLidx_1 === lidx_x) {
      snt_a_x.push(this.#headTk);
      if (this.#headChunkTk) snt_a_x.push(this.#headChunkTk);
    } else if (this.#tailTk && this.sntLastLidx_1 === lidx_x) {
      snt_a_x.push(this.#tailTk);
    } else {
      super.reuseLine(lidx_x, snt_a_x);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    const attrs: [k: string, v: string][] = [];

    const info_s = _unescapeString(this.#headChunkTk?.getText().trim() ?? "");
    let lang_s = info_s.split(/\s+/).at(0);
    if (lang_s?.length) {
      lang_s = _escapeXml(lang_s);
      attrs.push([
        "class",
        `${/^language-/.test(lang_s) ? "" : "language-"}${lang_s}`,
      ]);
    }

    const s_a = [`<pre>${_tag("code", attrs)}`];
    for (const tk of this.chunkTk_a$) {
      s_a.push(_escapeXml(tk.getText()), "\n");
    }
    s_a.push("</code></pre>");
    return s_a.join("");
  }
}
/*80--------------------------------------------------------------------------*/
