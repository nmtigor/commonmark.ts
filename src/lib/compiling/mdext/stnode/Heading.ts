/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Heading
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/global.ts";
import type { loff_t, uint8 } from "@fe-lib/alias.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { MdextTk } from "../../Token.ts";
import type { MdextLexr } from "../MdextLexr.ts";
import { BlockCont } from "../alias.ts";
import { _toHTML } from "../util.ts";
import type { CtnrBlock } from "./CtnrBlock.ts";
import { Inline } from "./Inline.ts";
import { ILoc, InlineBlock } from "./InlineBlock.ts";
import { Paragraph } from "./Paragraph.ts";
import { ThematicBreak } from "./ThematicBreak.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
class HLoc_ extends ILoc {
  override get host() {
    return this.host$ as Heading;
  }

  //jjjj TOCLEANUP
  // /**
  //  * @headconst @param host_x
  //  */
  // constructor(host_x: Heading) {
  //   /*#static*/ if (INOUT) {
  //     assert(host_x.snt_a_$.at(0) instanceof MdextTk);
  //   }
  //   super(host_x);
  // }
}
/*80--------------------------------------------------------------------------*/

export abstract class Heading extends InlineBlock {
  override continue(): BlockCont {
    return BlockCont.break;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  abstract get level(): uint8;

  #hloc: HLoc_ | undefined;
  /** @implement */
  get iloc(): HLoc_ {
    return this.#hloc ??= new HLoc_(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // protected override inline_impl$(lexr_x: MdextLexr): void {
  //   if (this.snt_a_$.length) {
  //     const iloc = this.iloc.reset_O(this.snt_a_$[0] as MdextTk);
  //     const VALVE = 1_000;
  //     let valve = VALVE;
  //     while (lexr_x.lexInline_$(iloc) && --valve) {}
  //     assert(valve, `Loop ${VALVE}±1 times`);
  //     lexr_x.lexEmphasis_$(iloc);
  //   }
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const level = this.level;
    return `<h${level}>${_toHTML(lexr_x, this.snt_a_$)}</h${level}>`;
  }
}
/*80--------------------------------------------------------------------------*/

export const enum ATXHeadingSt {
  head = 1,
  chunk,
  tail,
  //jjjj TOCLEANUP
  // text_inline,
}

/** @final */
export class ATXHeading extends Heading {
  #st;
  get st() {
    return this.#st;
  }

  /* #headTk */
  readonly #headTk;
  /** @implement */
  get level() {
    return this.#headTk.length_1;
  }
  /* ~ */

  /* snt_a_$ */
  setChunk(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      assert(!this.snt_a_$.length);
      assert(this.#st === ATXHeadingSt.head);
    }
    this.snt_a_$.push(_x);
    this.#st = ATXHeadingSt.chunk;

    this.invalidateBdry();
  }
  /* ~ */

  /* #tailTk */
  #tailTk?: MdextTk;
  tailStrt_$: loff_t = 0;
  tailStop_$: loff_t = 0;
  setTail(_x: MdextTk) {
    /*#static*/ if (INOUT) {
      assert(!this.#tailTk && this.#st !== ATXHeadingSt.tail);
    }
    this.#tailTk = _x;
    this.#st = ATXHeadingSt.tail;

    this.invalidateBdry();
  }
  /* ~ */

  override get frstToken() {
    return this.frstToken$ ??= this.#headTk;
  }
  override get lastToken() {
    if (this.lastToken$) return this.lastToken$;

    if (this.#tailTk) return this.lastToken$ = this.#tailTk;
    if (this.snt_a_$.length) {
      const snt = this.snt_a_$.at(-1)!;
      return this.lastToken$ = snt instanceof Inline ? snt.lastToken : snt;
    }
    return this.lastToken$ = this.#headTk;
  }

  constructor(headTk_x: MdextTk) {
    super();
    this.#headTk = headTk_x;
    this.#st = ATXHeadingSt.head;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(lexr_x: MdextLexr): string {
    const level = this.level;
    return `<h${level}>${_toHTML(lexr_x, this.snt_a_$)}</h${level}>`;
  }
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class SetextHeading extends Heading {
  /* #headTk */
  readonly #tailTk;
  /** @implement */
  get level() {
    return this.#tailTk.sntStrtLoc.ucod === /* "=" */ 0x3D ? 1 : 2;
  }
  /* ~ */

  override get frstToken() {
    if (this.frstToken$) return this.frstToken$;

    /* The only case `!snt` is that `snt_a_$` is a link definitiosn. */
    const snt = this.snt_a_$.at(0);
    return this.frstToken$ = snt
      ? snt instanceof Inline ? snt.frstToken : snt
      : this.#tailTk;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.#tailTk;
  }

  constructor(para_x: Paragraph, tailTk_x: MdextTk) {
    super();
    this.snt_a_$.become(para_x.snt_a_$);
    this.#tailTk = tailTk_x;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override reference(lexr_x: MdextLexr): this {
    const iloc = this.iloc;
    iloc.reset_O(this.snt_a_$[0] as MdextTk);

    const VALVE = 10_000;
    let valve = VALVE;
    while (
      lexr_x.lexReference_$(iloc) && iloc.forwNextLine_$() && --valve
    );
    assert(valve, `Loop ${VALVE}±1 times`);

    /* if this contains `Linkdef` only */
    if (iloc.reachEoh) {
      const ctnr = this.parent!;
      /* See `CtnrBlock.reference()` before change `ctnr` */
      const para = new Paragraph(this.snt_a_$ as MdextTk[]);
      if (this.level === 1) {
        para.appendLine(this.#tailTk);

        const next = ctnr.getChildAftr(this);
        ctnr.replaceChild(this, para);
        if (
          next instanceof Paragraph &&
          this.sntLastLine.nextLine === next.sntFrstLine
        ) {
          para.appendLines(next.snt_a_$ as MdextTk[]);
          next.removeSelf();
          /* No need `para.reference()` because non-handled lines are all
          _appended_ so can not be `Linkdef` */
        }
      } else {
        ctnr.replaceChild(this, para);
        ctnr.appendBlock(new ThematicBreak(this.#tailTk), para);
      }
    }
    return this;
  }
}
/*80--------------------------------------------------------------------------*/
