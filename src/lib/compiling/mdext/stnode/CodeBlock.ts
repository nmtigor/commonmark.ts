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
import type { lcol_t, loff_t, uint16 } from "@fe-lib/alias.ts";
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
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class IndentedCodeBlock extends CodeBlock {
  static readonly indent = 4;

  override continue(lexr_x: MdextLexr): BlockCont {
    return lexr_x.continueIndentedCodeBlock_$(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  get frstToken() {
    return this.frstToken$ ??= this.chunkTk_a$[0];
  }
  /** @implement */
  get lastToken() {
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
    while (lastNonblankIn(this.chunkTk_a$.at(-1)!.frstLine) < 0) {
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

//kkkk TOCLEANUP
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

  //kkkk TOCLEANUP
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
    return this.#headTk.strtLoc.ucod;
  }

  get headSize(): loff_t {
    return this.#headTk.length_1;
  }
  /* ~ */

  /* #headChunkTk */
  #headChunkTk: MdextTk | undefined;
  setHeadChunk(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      //kkkk TOCLEANUP
      // assert(!this.#headChunkTk && this.#st === FencedCodeBlockSt.head);
      assert(!this.#headChunkTk);
    }
    this.#headChunkTk = _x;
    //kkkk TOCLEANUP
    // this.#st = FencedCodeBlockSt.head_chunk;
  }
  /* ~ */

  /* #tailTk */
  #tailTk: MdextTk | undefined;
  setTail(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      //kkkk TOCLEANUP
      // assert(!this.#tailTk && this.#st !== FencedCodeBlockSt.tail);
      assert(!this.#tailTk);
    }
    this.#tailTk = _x;
    //kkkk TOCLEANUP
    // this.#st = FencedCodeBlockSt.tail;

    this.invalidateBdry();
  }
  /* ~ */

  /** @implement */
  get frstToken() {
    return this.frstToken$ ??= this.#headTk;
  }
  /** @implement */
  get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    return this.lastToken$ = this.#tailTk ??
      this.chunkTk_a$.at(-1) ??
      this.#headChunkTk ??
      this.#headTk;
  }

  constructor(headTk_x: MdextTk) {
    super();
    this.#headTk = headTk_x;
    //kkkk TOCLEANUP
    // this.#st = FencedCodeBlockSt.head;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** */
  protected override closeBlock_impl$(): void {
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
