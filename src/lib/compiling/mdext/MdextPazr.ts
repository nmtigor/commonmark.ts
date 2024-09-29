/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextPazr
 * @license BSD-3-Clause
 ******************************************************************************/

import { fail } from "@fe-lib/util/trace.ts";
import { Pazr } from "../Pazr.ts";
import type { MdextBufr } from "./MdextBufr.ts";
import type { MdextLexr } from "./MdextLexr.ts";
import type { MdextTok } from "./MdextTok.ts";
import { Document } from "./stnode/Document.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class MdextPazr extends Pazr<MdextTok> {
  protected override root$: Document | undefined = undefined;
  override get root(): Document {
    return this.root$ ??= new Document();
  }

  /**
   * Only invoked  in `MdextLexr.create()`
   * @package
   */
  constructor(bufr_x: MdextBufr, Lexr_x: MdextLexr) {
    super(bufr_x, Lexr_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  protected paz_impl$(): void {
    fail("Not implemented");
  }
}
