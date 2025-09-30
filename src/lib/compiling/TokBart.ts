/** 80**************************************************************************
 * @module lib/compiling/TokBart
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../preNs.ts";
import type { lnum_t } from "../alias.ts";
import { assert } from "../util.ts";
import type { BaseTok } from "./BaseTok.ts";
import { Bufr } from "./Bufr.ts";
import type { TokLine } from "./TokLine.ts";
import type { TokRan } from "./TokRan.ts";
import type { Tok } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Bufr part, a continuous part of a Bufr
 *
 * ! Readonly (for the moment)
 *
 * @final
 */
export class TokBart<T extends Tok = BaseTok> {
  readonly #bufr;
  readonly #frstLidx;
  readonly #lastLidx;

  get frstLine(): TokLine<T> {
    return this.#bufr.line(this.#frstLidx) as TokLine<T>;
  }
  get lastLine(): TokLine<T> {
    return this.#bufr.line(this.#lastLidx) as TokLine<T>;
  }

  get oldRan_a(): TokRan<T>[] {
    return this.#bufr.oldRan_a_$ as TokRan<T>[];
  }
  get newRan_a(): TokRan<T>[] {
    return this.#bufr.newRan_a_$ as TokRan<T>[];
  }

  /**
   * @headconst @param bufr_x
   * @const @param frstLidx_x
   * @const @param lastLidx_x
   */
  constructor(bufr_x: Bufr, frstLidx_x: lnum_t, lastLidx_x?: lnum_t) {
    this.#bufr = bufr_x;
    this.#frstLidx = frstLidx_x;
    this.#lastLidx = lastLidx_x ?? frstLidx_x;

    /*#static*/ if (INOUT) {
      assert(
        this.#frstLidx <= this.#lastLidx && this.#lastLidx < this.#bufr.lineN,
      );
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
}
/*80--------------------------------------------------------------------------*/
