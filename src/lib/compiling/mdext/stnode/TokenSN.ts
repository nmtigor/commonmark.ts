/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/TokenSN
 * @license BSD-3-Clause
 ******************************************************************************/

import { domParser } from "@fe-lib/util/dom.ts";
import type { MdextTk } from "../../Token.ts";
import { _escapeXml } from "../util.ts";
import { Inline } from "./Inline.ts";
/*80--------------------------------------------------------------------------*/

export abstract class TokenSN extends Inline {
  protected tk$;

  override get frstToken() {
    return this.frstToken$ ??= this.tk$;
  }
  override get lastToken() {
    return this.lastToken$ ??= this.tk$;
  }

  constructor(tk_x: MdextTk) {
    super();
    this.tk$ = tk_x;

    this.ensureBdry();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  override tokenAt(): MdextTk {
    return this.tk$;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // override toString(): string {
  //   return this.tk$.getText();
  // }
}
/*80--------------------------------------------------------------------------*/

/** @finale */
export class HardBr extends TokenSN {
  override _toHTML(): string {
    return "<br />";
  }
}

/** @finale */
export class SoftBr extends TokenSN {
}
/*80--------------------------------------------------------------------------*/

/** @finale */
export class Entity extends TokenSN {
  static readonly Re_lf = /^&#(?:x0*a|0*10);$/i;
  static readonly Re_tab = /^&#(?:x0*9|0*9);$/i;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  override _toHTML(): string {
    let s_ = this.tk$.getText();
    if (Entity.Re_lf.test(s_)) return "\n";
    if (Entity.Re_tab.test(s_)) return "\t";

    s_ = domParser.parseFromString(
      this.tk$.getText(),
      "text/html",
    ).textContent ?? "";
    return _escapeXml(s_);
  }
}
/*80--------------------------------------------------------------------------*/

/** @finale */
export class Escaped extends TokenSN {
  override _toHTML(): string {
    return _escapeXml(this.tk$.getText()[1]);
  }
}
/*80--------------------------------------------------------------------------*/
