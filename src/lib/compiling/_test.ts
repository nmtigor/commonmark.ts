/** 80**************************************************************************
 * @module lib/compiling/_test
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t, loff_t } from "../alias.ts";
import type { Bufr } from "./Bufr.ts";
import type { Lexr } from "./Lexr.ts";
import { Loc } from "./Loc.ts";
import type { Pazr } from "./Pazr.ts";
import { Ran } from "./Ran.ts";
import { Ranval } from "./Ranval.ts";
import type { Tfmr } from "./Tfmr.ts";
/*80--------------------------------------------------------------------------*/

export type TestO = {
  bufr: Bufr;
  lexr: Lexr;
  pazr: Pazr;
  tfmr: Tfmr;
};
export const test_o = Object.create(null) as TestO;
/*64----------------------------------------------------------*/

export const ln = (i_x: number) => test_o.bufr.line(i_x as lnum_t);
export const loc = (i_x: number, j_x?: number) =>
  new Loc(ln(i_x), j_x as loff_t | undefined);
export const ran = (
  i_0_x: number,
  j_0_x?: number,
  i_1_x?: number,
  j_1_x?: number,
) =>
  new Ran(
    loc(i_0_x, j_0_x as loff_t | undefined),
    i_1_x === undefined ? undefined : loc(i_1_x, j_1_x as loff_t | undefined),
  );
export const rv = (
  anchrLidx_x: number,
  anchrLoff_x: number,
  focusLidx_x?: number,
  focusLoff_x?: number,
) =>
  new Ranval(
    anchrLidx_x as lnum_t,
    anchrLoff_x as loff_t,
    focusLidx_x as lnum_t | undefined,
    focusLoff_x as loff_t | undefined,
  );

export const repl = (ranval_x: Ranval, txt_x: string[] | string) =>
  test_o.bufr.Do(ranval_x, txt_x);
export const undo = () => test_o.bufr.undo();
export const redo = () => test_o.bufr.redo();
/*80--------------------------------------------------------------------------*/
