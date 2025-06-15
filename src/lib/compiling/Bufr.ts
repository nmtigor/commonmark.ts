/** 80**************************************************************************
 * @module lib/compiling/Bufr
 * @license BSD-3-Clause
 ******************************************************************************/

import { DEBUG, INOUT } from "../../global.ts";
import { Boor, LastCb_i, Moo, type MooHandler } from "../Moo.ts";
import type { id_t, lnum_t, uint } from "../alias.ts";
import type { BufrDir, ts_t } from "../alias.ts";
import { MAX_lnum } from "../alias.ts";
import type { EdtrBaseScrolr } from "../editor/EdtrBase.ts";
import { SortedIdo } from "../util/SortedArray.ts";
import { Unre } from "../util/Unre.ts";
import { linesOf } from "../util/string.ts";
import { assert, out } from "../util/trace.ts";
import { Line } from "./Line.ts";
import type { Ran } from "./Ran.ts";
import { g_ranval_fac } from "./Ranval.ts";
import { Repl, type Replin } from "./Repl.ts";
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
  get _type_id_() {
    return `${this.constructor.name}_${this.id}`;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /* dir_mo */
  readonly dir_mo = new Moo({ val: "ltr" as BufrDir, active: true });
  get dir() {
    return this.dir_mo.val;
  }

  #onDir = (n_x: BufrDir): void => {
    // const rv_a = this.edtr_sa.map((edtr_y) =>
    //   (edtr_y as EdtrBaseScrolr).proactiveCaret.ranval
    // );
    // console.log(rv_a);
    this.refresh_Bufr();
    /* Notice, `invalidate_bcr()` should be called firstly for all `edtr_sa`,
    because setting `mc_.caretrvm![1]` in one `eds` will impact other `eds`s
    immediately. */
    this.edtr_sa.forEach((eds) => (eds as EdtrBaseScrolr).invalidate_bcr());
    for (let i = this.edtr_sa.length; i--;) {
      const eds = this.edtr_sa.at(i) as EdtrBaseScrolr;
      eds.coo.el.dir = n_x;

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
  get lineN(): lnum_t {
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
  readonly modified_br_Bufr = new Boor();
  get modified() {
    return this.modified_br_Bufr.val;
  }
  /**
   * Also update `lastRead_ts` if `modified_x`
   * @const @param modified_x
   */
  set modified(modified_x: boolean) {
    this.modified_br_Bufr.val = modified_x;
    if (modified_x) {
      this.updateLastReadTs();
    } else {
      this.#repl_saved = this.#lastRepl;
    }
  }

  #lastRepl: Repl | undefined;
  #repl_saved: Repl | undefined;
  /* ~ */

  //jjjj TOCLEANUP
  // oldRan_$ = new RanMoo(); /** @member */
  // newRan_$ = new RanMoo(); /** @member */
  /**
   * Disjoint and in order
   * @using
   */
  readonly oldRan_a_$: Ran[] = [];
  get oldRan_a() {
    return this.oldRan_a_$;
  }
  /**
   * Disjoint and in order
   * @using
   */
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
  #doq = new Unre<Repl>(/*#static*/ DEBUG ? 10 : 200);

  readonly canUndo_mo = new Moo({ val: false });
  readonly canRedo_mo = new Moo({ val: false });

  #updateDoCap() {
    this.canUndo_mo.val = this.#doq.canGetUn();
    this.canRedo_mo.val = this.#doq.canGetRe();
  }
  /* ~ */

  /* repl_mo */
  readonly repl_mo = new Moo({ val: BufrReplState.idle });

  //jjjj TOCLEANUP
  // #onReplStateChange:
  //   | ((newval: BufrReplState, oldval: BufrReplState) => void)
  //   | undefined;
  // set onReplStateChange(
  //   _x: ((newval: BufrReplState, oldval: BufrReplState) => void) | undefined,
  // ) {
  //   if (_x === this.#onReplStateChange) return;

  //   if (this.#onReplStateChange) {
  //     this.repl_mo.removeHandler(this.#onReplStateChange);
  //   }
  //   if (_x) {
  //     this.repl_mo.registHandler(_x);
  //   }
  //   this.#onReplStateChange = _x;
  // }
  /* ~ */

  readonly repl_actr = new ReplActr(this);
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  #lastRead_ts = 0 as ts_t;
  get lastRead_ts() {
    return this.#lastRead_ts;
  }
  updateLastReadTs(): ts_t {
    return this.#lastRead_ts = Date.now_1();
  }

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
  /** @const @param sig_x */
  resSig(sig_x: sig_t) {
    this.#sigPool |= sig_x;
  }
  /* ~ */

  readonly edtr_sa = new SortedIdo();
  #onEdtrActive: MooHandler<boolean, unknown, EdtrBaseScrolr> = (
    n_x,
    _o_x,
    _d_x,
    i_x,
  ) => {
    if (n_x) this.#curEdtrId = i_x!.id;
    else if (this.#curEdtrId === i_x!.id) this.#curEdtrId = 0 as id_t;
  };
  addEdtr(_x: EdtrBaseScrolr) {
    this.edtr_sa.add(_x);
    _x.activ_mo.registHandler(this.#onEdtrActive);
  }
  remEdtr(_x: EdtrBaseScrolr) {
    this.edtr_sa.delete(_x);
    _x.activ_mo.removeHandler(this.#onEdtrActive);

    _x.reset_EdtrBaseScrolr(); //!
  }

  #curEdtrId = 0 as id_t;
  get curEdtrId() {
    return this.#curEdtrId;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  #filehandle;
  get filehandle() {
    return this.#filehandle;
  }

  /**
   * @const @param text_x
   * @const @param dir_x
   * @headconst @param fh_x
   */
  constructor(
    text_x?: string | undefined,
    dir_x = "ltr" as BufrDir,
    fh_x?: FileSystemFileHandle,
  ) {
    this.dir_mo.set_Moo(dir_x)
      .registHandler(this.#onDir, { i: LastCb_i });

    this.frstLine_$ = this.createLine();
    this.frstLine_$.linked_$ = true;
    this.lastLine_$ = this.frstLine_$;
    if (text_x) this.setLines(text_x);

    this.repl_mo.registHandler((n_y) => this.repl_actr.to(n_y));

    this.#filehandle = fh_x;

    // // #if DEBUG && !TESTING
    //   reportBuf( text_a );
    // // #endif
    /*#static*/ if (INOUT) {
      assert(this.lineN_$ >= 1);
      assert(this.frstLine_$.bufr === this);
      assert(this.lastLine_$.bufr === this);
    }
  }

  @out((self: Bufr) => {
    assert(self.lineN_$ >= 1);
    assert(self.frstLine_$.bufr === self);
    assert(self.lastLine_$.bufr === self);
  })
  reset_Bufr(): this {
    this.dir_mo.reset_Moo()
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

    this.modified_br_Bufr.reset_Boor();
    this.#lastRepl = this.#repl_saved = undefined;

    for (const ran of this.oldRan_a_$) ran[Symbol.dispose]();
    for (const ran of this.newRan_a_$) ran[Symbol.dispose]();

    this.#doState = BufrDoState.idle;
    this.#doq.reset_Unre();
    this.canUndo_mo.reset_Moo();
    this.canRedo_mo.reset_Moo();

    this.repl_mo.reset_Moo();
    //jjjj TOCLEANUP
    // this.#onReplStateChange = undefined;
    this.repl_actr.fina();

    this.updateLastReadTs();

    /*#static*/ if (DEBUG) {
      assert(this.#sigPool === 0xffff_ffff); //kkkk
      assert(this.edtr_sa.length === 0); //kkkk
    }
    return this;
  }

  [Symbol.dispose]() {
    this.reset_Bufr();
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @const @param text_x */
  setLines(text_x?: string): this {
    /*#static*/ if (INOUT) {
      assert(this.lineN === 1);
    }
    const txt_a = text_x ? linesOf(text_x) : [""];
    this.frstLine_$.resetText_$(txt_a[0]);

    let ln_ = this.frstLine_$;
    for (let i = 1, iI = txt_a.length; i < iI; ++i) {
      ln_ = ln_.insertNext_$(this.createLine(txt_a[i]));
    }
    /*#static*/ if (INOUT) {
      assert(ln_ === this.lastLine_$);
    }
    return this;
  }

  /** @const @param text_x */
  createLine(text_x?: string): Line {
    return Line.create(this, text_x);
  }

  /** @const @param lidx_x */
  @out((_, ret) => {
    assert(ret);
  })
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
   * @move @const @param replin_x
   *    If `Replin[]`, `.rv`s MUST be disjoint!.
   */
  Do(replin_x: Replin | Replin[]): void {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;
    // this.#curEdtrId = edtrId_x;

    this.#lastRepl = new Repl(this, replin_x);
    this.#lastRepl.replFRun();
    this.modified = true;

    this.#doq.add(this.#lastRepl);
    // console.log(this.#doq._repr_);
    this.#updateDoCap();

    // this.#curEdtrId = 0 as id_t;
    this.#doState = doState_save;
  }

  /**
   * To trigger `repl_mo`s callbacks
   * @const @param text_x
   */
  refresh_Bufr(text_x?: string): void {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;

    using rv_u = g_ranval_fac.oneMore();
    rv_u.anchrLidx = 0 as lnum_t;
    rv_u.anchrLoff = 0;
    rv_u.focusLidx = this.lastLine_$.lidx_1;
    rv_u.focusLoff = this.lastLine_$.uchrLen;

    new Repl(this, { rv: rv_u, txt: text_x ?? this.getTexta() }).replFRun();

    this.#doState = doState_save;
  }

  /** @headconst @param repl_x */
  doqOnly(repl_x: Repl): void {
    const doState_save = this.#doState;
    this.#doState = BufrDoState.doing;

    this.#lastRepl = repl_x;
    this.modified = true;

    this.#doq.add(repl_x);
    this.#updateDoCap();

    this.#doState = doState_save;
  }

  /** @const @param edtrId_x */
  undo(): boolean {
    const ret = this.#doq.canGetUn();
    if (ret) {
      const doState_save = this.#doState;
      this.#doState = BufrDoState.undoing;
      // this.#curEdtrId = edtrId_x;

      // this.#doq.getUn().replBRun();
      // this.#updateDoCap();
      // this.#lastRepl = this.#doq.peekUn(); //!
      this.#lastRepl = this.#doq.getUn();
      this.#lastRepl.replBRun();
      this.modified = this.#lastRepl !== this.#repl_saved;

      this.#updateDoCap();

      // this.#curEdtrId = 0 as id_t;
      this.#doState = doState_save;
    }
    return ret;
  }
  /** @const @param edtrId_x */
  redo(): boolean {
    const ret = this.#doq.canGetRe();
    if (ret) {
      const doState_save = this.#doState;
      this.#doState = BufrDoState.redoing;
      // this.#curEdtrId = edtrId_x;

      this.#lastRepl = this.#doq.getRe();
      this.#lastRepl.replFRun();
      this.modified = this.#lastRepl !== this.#repl_saved;

      this.#updateDoCap();

      // this.#curEdtrId = 0 as id_t;
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
