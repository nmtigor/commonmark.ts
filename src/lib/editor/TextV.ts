/** 80**************************************************************************
 * @module lib/editor/TextV
 * @license BSD-3-Clause
 ******************************************************************************/

import type { loff_t } from "../alias.ts";
import type { BaseTok } from "../compiling/BaseTok.ts";
import type { Tok } from "../compiling/alias.ts";
import { span, textnode } from "../dom.ts";
import type { ELineBase } from "./ELineBase.ts";
import type { EdtrBaseCI } from "./EdtrBase.ts";
import { StnodeV } from "./StnodeV.ts";
/*80--------------------------------------------------------------------------*/

export class TextV<T extends Tok = BaseTok, CI extends EdtrBaseCI = EdtrBaseCI>
  extends StnodeV<T, CI, HTMLSpanElement> {
  protected host$;
  /** @implement */
  get eline_$() {
    return this.host$;
  }

  /** @implement */
  protected snt$!: never;

  constructor(host_x: ELineBase<CI>, text_x: string, loff_x: loff_t) {
    super(host_x.coo, span());
    this.host$ = host_x;
    this.strtLoff$ = loff_x;

    this.el$.append(textnode(text_x, loff_x));
    this.stopLoff$ = loff_x + text_x.length;
  }
}
/*80--------------------------------------------------------------------------*/
