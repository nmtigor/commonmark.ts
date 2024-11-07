/** 80**************************************************************************
 * @module lib/compiling/Bufr
 * @license BSD-3-Clause
 ******************************************************************************/

import { DEV, INOUT } from "../../global.ts";
import { Bidi } from "../Bidi.ts";
import { LastCb_i, Moo } from "../Moo.ts";
import type { id_t, lnum_t, ts_t, uint } from "../alias.ts";
import { BufrDir, MAX_lnum } from "../alias.ts";
import type { EdtrScrolr } from "../editor/Edtr.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import { Unre } from "../util/Unre.ts";
import { linesOf } from "../util/general.ts";
import { assert, out } from "../util/trace.ts";
import { Line } from "./Line.ts";
import { type Ran } from "./Ran.ts";
import { g_ranval_fac, type Ranval } from "./Ranval.ts";
import { Repl } from "./Repl.ts";
import { ReplActr } from "./ReplActr.ts";
import type { sig_t } from "./alias.ts";
import { BufrDoState, BufrReplState } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * A nnon-generic base s.t. many related uses can be non-generic.
 *
 * primaryconst: const exclude `maxValidLidx_$`
 *
 * @using
 */
export class Bufr {
  static #ID = 0 as id_t;
  readonly id = ++Bufr.#ID as id_t;
  /** @final */
  get _type_id() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /* dir_mo */
  readonly dir_mo = new Moo({ val: BufrDir.ltr, active: true });
  get dir() {
    return this.dir_mo.val;
  }

  #onDir = () => {
    // const rv_a = this.edtr_sa.map((edtr_y) =>
    //   (edtr_y as EdtrScrolr).proactiveCaret.ranval
    // );
    // console.log(rv_a);
    this.refresh();
    /* Notice, `invalidate_bcr()` should be called firstly for all `edtr_sa`,
    because setting `mc_.caretrvm![1]` in one `eds` will impact other `eds`s
    immediately. */
    this.edtr_sa.forEach((eds) => (eds as EdtrScrolr).invalidate_bcr());
    for (let i = this.edtr_sa.length; i--;) {
      const eds = this.edtr_sa.at(i) as EdtrScrolr;
      const mc_ = eds.proactiveCaret;
      if (mc_.shown) {
        // mc_.caretrvm![1].force().val = rv_a[i];
        mc_.caretrvm![1].force().val = mc_.ranval;
      }
    }
  };
  /* ~ */

  lineN_$ = 0 as lnum_t;
  /** @final */
  get lineN() {
    return this.lineN_$;
  }
  maxValidLidx_$: lnum_t | -1 = -1;

  frstLine_$: Line;
  get frstLine() {
    return this.frstLine_$;
  }
  lastLine_$: Line;
  get lastLine() {
    return this.lastLine_$;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /* modified */
  readonly modified_mo = new Moo({ val: false });
  get modified() {
    return this.modified_mo.val;
  }
  /**
   * Also update `lastView_ts` if `modified_x`
   * @const @param modified_x
   */
  set modified(modified_x: boolean) {
    this.modified_mo.val = modified_x;
    if (modified_x) {
      this.lastView_ts = Date.now() as ts_t;
    } else {
      this.#repl_saved = this.#lastRepl;
    }
  }

  #lastRepl: Repl | undefined;
  #repl_saved: Repl | undefined;
  /* ~ */

  // oldRan_$ = new RanMoo(); /** @member */
  // newRan_$ = new RanMoo(); /** @member */
  /** @using */
  readonly oldRan_a_$: Ran[] = [];
  get oldRan_a() {
    return this.oldRan_a_$;
  }
  /** @using */
  readonly newRan_a_$: Ran[] = [];
  get newRan_a() {
    return this.newRan_a_$;
  }
  // dtLineN_$ = 0;
  // get dtLn() {
  //   return this.dtLineN_$;
  // }

  #doState = BufrDoState.idle;
  get doState() {
    return this.#doState;
  }

  /* #doq */
  #doq = new Unre<Repl>(/*#static*/ DEV ? 10 : 200);

  readonly canUndo_mo = new Moo({ val: false });
  readonly canRedo_mo = new Moo({ val: false });

  #updateDoCap() {
    this.canUndo_mo.val = this.#doq.canGetUn();
    this.canRedo_mo.val = this.#doq.canGetRe();
  }
  /* ~ */

  /* repl_mo */
  readonly repl_mo = new Moo({ val: BufrReplState.idle });

  #onReplStateChange:
    | ((newval: BufrReplState, oldval: BufrReplState) => void)
    | undefined;
  set onReplStateChange(
    _x: ((newval: BufrReplState, oldval: BufrReplState) => void) | undefined,
  ) {
    if (_x === this.#onReplStateChange) return;

    if (this.#onReplStateChange) {
      this.repl_mo.removeHandler(this.#onReplStateChange);
    }
    if (_x) {
      this.repl_mo.registHandler(_x);
    }
    this.#onReplStateChange = _x;
  }
  /* ~ */

  readonly repl_actr = new ReplActr(this);
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  lastView_ts = Date.now() as ts_t;

  /* #sigPool */
  #sigPool: sig_t = 0xffff_ffff;
  getSig(): sig_t {
    /*#static*/ if (INOUT) {
      assert(this.#sigPool);
    }
    let ret = 1;

    const VALVE = 30;
    let valve = VALVE;
    while (!(ret & this.#sigPool) && --valve) ret <<= 1;
    assert(valve, `Loop ${VALVE}±1 times`);

    this.#sigPool &= ~ret;
    // console.log(`0x${this.#sigPool.toString(16)}`);
    // console.log(`0x${ret.toString(16)}`);
    /*#static*/ if (INOUT) {
      assert(ret);
    }
    return ret;
  }
  /**
   * @const @param sig_x
   */
  resSig(sig_x: sig_t) {
    this.#sigPool |= sig_x;
  }
  /* ~ */

  readonly edtr_sa = new SortedIdo();
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const @param text_x
   */
  constructor(text_x?: string | undefined, dir_x = BufrDir.ltr) {
    this.dir_mo.set(dir_x)
      .registHandler(this.#onDir, { i: LastCb_i });

    this.frstLine_$ = this.createLine();
    this.frstLine_$.linked_$ = true;
    this.lastLine_$ = this.frstLine_$;

    this.setLines(text_x);
    // // #if DEV && !TESTING
    //   reportBuf( text_a );
    // // #endif
    /*#static*/ if (INOUT) {
      assert(this.lineN_$ >= 1);
      assert(this.frstLine_$ && this.frstLine_$.bufr === this);
      assert(this.lastLine_$ && this.lastLine_$.bufr === this);
    }
  }

  @out((_, self: Bufr) => {
    assert(self.lineN_$ >= 1);
    assert(self.frstLine_$ && self.frstLine_$.bufr === self);
    assert(self.lastLine_$ && self.lastLine_$.bufr === self);
  })
  reset(): this {
    this.dir_mo.reset()
      .registHandler(this.#onDir, { i: LastCb_i });

    let line: Line | undefined = this.lastLine;
    const VALVE = 10_000;
    let valve = VALVE;
    while (line && line !== this.frstLine_$ && --valve) {
      const line_1: Line | undefined = line.prevLine;
      line.removeSelf_$();
      line = line_1;
    }
    assert(valve, `Loop ${VALVE}±1 times`);
    line!.removeSelf_$();

    this.modified_mo.reset();
    this.#lastRepl = this.#repl_saved = undefined;

    for (const ran of this.oldRan_a_$) ran[Symbol.dispose]();
    for (const ran of this.newRan_a_$) ran[Symbol.dispose]();

    this.#doState = BufrDoState.idle;

    this.#doq.reset();
    this.canUndo_mo.reset();
    this.canRedo_mo.reset();

    this.repl_mo.reset();
    this.#onReplStateChange = undefined;

    this.repl_actr.fina();

    this.lastView_ts = Date.now() as ts_t;

    /*#static*/ if (DEV) {
      assert(this.#sigPool === 0xffff_ffff); //kkkk
    }

    /*#static*/ if (DEV) {
      assert(this.edtr_sa.length === 0); //kkkk
    }

    return this;
  }

  [Symbol.dispose]() {
    this.reset();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const @param text_x
   */
  setLines(text_x?: string): this {
    /*#static*/ if (INOUT) {
      assert(this.lineN === 1);
    }
    const txt_a = text_x ? linesOf(text_x) : [""];
    this.frstLine_$.resetText_$(txt_a[0]);

    let ln = this.frstLine_$;
    for (let i = 1, LEN = txt_a.length; i < LEN; ++i) {
      ln = ln.insertNext_$(this.createLine(txt_a[i]));
    }
    /*#static*/ if (INOUT) {
      assert(ln === this.lastLine_$);
    }
    return this;
  }

  /**
   * @const @param text_x
   */
  createLine(text_x?: string): Line {
    return Line.create(this, text_x);
  }

  /**
   * @const @param lidx_x
   */
  line(lidx_x: lnum_t): Line {
    if (lidx_x >= this.lineN) return this.lastLine;

    let ret;
    if (lidx_x < this.lineN * 2 / 3) {
      ret = this.frstLine;
      while (ret) {
        if (ret.lidx_1 === lidx_x) break;
        ret = ret.nextLine;
      }
    } else {
      ret = this.lastLine;
      while (ret) {
        if (ret.lidx_1 === lidx_x) break;
        ret = ret.prevLine;
      }
    }
    /*#static*/ if (INOUT) {
      assert(ret);
    }
    return ret!;
  }

  frstLineWith(cb_x: (ln_y: Line) => boolean, valve_x = MAX_lnum) {
    // let ln_ = this.frstLine_$;
    // while (!cb_x(ln_) && ln_.nextLine && --valve_x) {
    //   ln_ = ln_.nextLine;
    // }
    // return cb_x(ln_) ? ln_ : undefined;
    let ln_: Line | undefined;
    while (--valve_x) {
      if (ln_) ln_ = ln_.nextLine;
      else ln_ = this.frstLine_$;
      if (!ln_) break;
      if (cb_x(ln_)) return ln_;
    }
    return undefined;
  }
  frstNonemptyLine(valve_x = MAX_lnum) {
    return this.frstLineWith((ln_y) => !!ln_y.uchrLen, valve_x);
  }
  lastLineWith(cb_x: (ln_y: Line) => boolean, valve_x = MAX_lnum) {
    // let ln_ = this.lastLine_$;
    // while (!cb_x(ln_) && ln_.prevLine && --valve_x) {
    //   ln_ = ln_.prevLine;
    // }
    // return cb_x(ln_) ? ln_ : undefined;
    let ln_: Line | undefined;
    while (--valve_x) {
      if (ln_) ln_ = ln_.prevLine;
      else ln_ = this.lastLine_$;
      if (!ln_) break;
      if (cb_x(ln_)) return ln_;
    }
    return undefined;
  }
  lastNonemptyLine(valve_x = MAX_lnum) {
    return this.lastLineWith((ln_y) => !!ln_y.uchrLen, valve_x);
  }

  /**
   * @final
   * @const @param szMAX_x
   */
  getTexta(szMAX_x?: uint): string[] {
    const ret: string[] = [];

    let sz = 0;
    let ln: Line | undefined = this.frstLine;
    const VALVE = MAX_lnum;
    let valve = VALVE;
    while (ln && --valve) {
      ret.push(ln.text);
      sz += ln.uchrLen;
      if (szMAX_x !== undefined && sz > szMAX_x) {
        ret.push("...");
        break;
      }
      ln = ln.nextLine;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    /*#static*/ if (INOUT) {
      assert(ret.length);
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const @param rv_x [COPIED]
   * @const @param txt_x
   */
  Do(rv_x: Ranval, txt_x: string[] | string) {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;

    this.#lastRepl = new Repl(this, rv_x, txt_x);
    this.#lastRepl.replFRun();
    this.modified = true;

    this.#doq.add(this.#lastRepl);
    // console.log(this.#doq._repr);
    this.#updateDoCap();

    this.#doState = doState_save;
  }

  /**
   * To trigger `repl_mo`s callbacks
   */
  refresh() {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;

    using rv_ = g_ranval_fac.oneMore();
    rv_.anchrLidx = 0 as lnum_t;
    rv_.anchrLoff = 0;
    rv_.focusLidx = this.lastLine_$.lidx_1;
    rv_.focusLoff = this.lastLine_$.uchrLen;
    new Repl(this, rv_, this.getTexta()).replFRun();

    this.#doState = doState_save;
  }

  /**
   * @headconst @param repl_x
   */
  doqOnly(repl_x: Repl) {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;

    this.#lastRepl = repl_x;
    this.modified = true;

    this.#doq.add(repl_x);
    this.#updateDoCap();

    this.#doState = doState_save;
  }

  undo(): boolean {
    const ret = this.#doq.canGetUn();
    if (ret) {
      const doState_save = this.#doState;
      this.#doState = BufrDoState.undoing;

      // this.#doq.getUn().replBRun();
      // this.#updateDoCap();
      // this.#lastRepl = this.#doq.peekUn(); //!
      this.#lastRepl = this.#doq.getUn();
      this.#lastRepl.replBRun();
      this.modified = this.#lastRepl !== this.#repl_saved;

      this.#updateDoCap();

      this.#doState = doState_save;
    }
    return ret;
  }
  redo(): boolean {
    const ret = this.#doq.canGetRe();
    if (ret) {
      const doState_save = this.#doState;
      this.#doState = BufrDoState.redoing;

      this.#lastRepl = this.#doq.getRe();
      this.#lastRepl.replFRun();
      this.modified = this.#lastRepl !== this.#repl_saved;

      this.#updateDoCap();

      this.#doState = doState_save;
    }
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  get _lineIds() {
    const lineId_a: id_t[] = [];

    let line = this.frstLine;
    let valve = 1000;
    do {
      lineId_a.push(line.id);
      line = line.nextLine!;
    } while (line && --valve);
    assert(valve);

    return `[#${lineId_a.join(", ")}]`;
  }
}
/*80--------------------------------------------------------------------------*/
