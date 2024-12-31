/** 80**************************************************************************
 * @module lib/editor/Edtr
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Keybinding } from "../../alias.ts";
import { Key, LOG_cssc } from "../../alias.ts";
import { _TRACE, CYPRESS, EDITOR, global, INOUT } from "../../global.ts";
import { Moo } from "../Moo.ts";
import type { ldt_t, lnum_t, loff_t, ts_t, UChr } from "../alias.ts";
import { BufrDir, MAX_lnum, WritingDir, WritingMode } from "../alias.ts";
import { Pale } from "../color/Pale.ts";
import type { Cssc } from "../color/alias.ts";
import type { BaseTok } from "../compiling/BaseTok.ts";
import type { Lexr } from "../compiling/Lexr.ts";
import type { Pazr } from "../compiling/Pazr.ts";
import { Ran, RanP } from "../compiling/Ran.ts";
import { g_ranval_fac, Ranval } from "../compiling/Ranval.ts";
import { Repl } from "../compiling/Repl.ts";
import type { Stnode } from "../compiling/Stnode.ts";
import { Tfmr } from "../compiling/Tfmr.ts";
import type { TokBufr } from "../compiling/TokBufr.ts";
import type { TokLine } from "../compiling/TokLine.ts";
import type { sig_t, Tok } from "../compiling/alias.ts";
import { BufrDoState, BufrReplState } from "../compiling/alias.ts";
import { MouseButton } from "../dom.ts";
import {
  $cssstylesheet,
  $loff,
  $rec_utx_a,
  $selection_vu,
  $uts,
} from "../symbols.ts";
import { noContextMenu } from "../util/general.ts";
import { assert, bind, fail, traceOut } from "../util/trace.ts";
import { Caret, CaretState } from "./Caret.ts";
import { ELine } from "./ELine.ts";
import { OzrInfo } from "./ELineBase.ts";
import { ELoc } from "./ELoc.ts";
import { ERan, g_eran_fac } from "./ERan.ts";
import type { EdtrBaseCI, EdtrScronr } from "./EdtrBase.ts";
import { EdtrBase, EdtrBaseScrolr } from "./EdtrBase.ts";
import type { EdtrShortcut, EdtrState } from "./alias.ts";
import { EdtrFuncName, EdtrShortcut_m, EdtrType } from "./alias.ts";
import type { InlineOf, Sameline } from "./util.ts";
import {
  sameline_bot,
  sameline_left,
  sameline_rigt,
  sameline_top,
} from "./util.ts";
/*80--------------------------------------------------------------------------*/

declare global {
  interface Node {
    /** Usage: @see {@linkcode anchrRecOf_$()} */
    [$rec_utx_a]: DOMRect[];
    "cy.rec_utx_a": DOMRect[];
  }

  interface DOMRect {
    /** Usage: @see {@linkcode anchrRecOf_$()} */
    [$uts]: ts_t;
  }

  interface Document {
    [$selection_vu]: EdtrScrolr<any> | undefined;
  }

  // interface Selection
  // {
  //   [$sync_eran]:boolean;
  // }
}

let rulidx = document[$cssstylesheet].insertRule(
  `.editor-scrollbar ::-webkit-scrollbar { width: 10px; background-color: #333; }`,
); //kkkk make color into pale
rulidx = document[$cssstylesheet].insertRule(
  `.editor-scrollbar ::-webkit-scrollbar-thumb { background-color: #524f5f; }`,
  rulidx,
);

document.on("selectionchange", (evt_x: Event) => {
  /*#static*/ if (_TRACE && EDITOR) {
    console.log(
      `%c${global.indent}>>>>>>> document.on("selectionchange") >>>>>>>`,
      `color:${LOG_cssc.selectionchange}`,
    );
  }
  document[$selection_vu]?.onSelectionchange();
  /*#static*/ if (_TRACE && EDITOR) global.outdent;
  return;
});
/*80--------------------------------------------------------------------------*/

export interface EdtrCI extends EdtrBaseCI {
}

export abstract class Edtr<T extends Tok = BaseTok, CI extends EdtrCI = EdtrCI>
  extends EdtrBase<CI> {
  /* Pale */
  readonly fg_p = Pale.get("lib.editor.Edtr.fg");
  #onFgCssc = (_x: Cssc) => {
    this.el$.style.color = _x;
  };
  readonly bg_p = Pale.get("lib.editor.Edtr.bg");
  #onBgCssc = (_x: Cssc) => {
    this.el$.style.backgroundColor = _x;
  };

  override observeTheme() {
    this.fg_p.registCsscHandler(this.#onFgCssc);
    this.bg_p.registCsscHandler(this.#onBgCssc);
  }
  /* ~ */

  // override get scrolr(): EdtrScrolr<T> {
  //   return this.scrolr$ as EdtrScrolr<T>;
  // }

  override init(scrolr_x: EdtrScrolr<T, CI>) {
    super.init(scrolr_x);
  }
}
/*64----------------------------------------------------------*/

export abstract class EdtrScrolr<
  T extends Tok = BaseTok,
  CI extends EdtrCI = EdtrCI,
> extends EdtrBaseScrolr<CI> {
  /* eline_m */
  override readonly eline_m = new Map<TokLine<T>, ELine<T>>();
  /** @final */
  protected get frstELine$(): ELine<T> | undefined {
    return this.eline_m.get(this.bufr$.frstLine);
  }
  /** @final */
  protected get lastELine$() {
    return this.eline_m.get(this.bufr$.lastLine);
  }
  /* ~ */

  /* bufr */
  declare bufr$: TokBufr<T>;

  get lastBLidx_1(): lnum_t {
    return this.bufr$.lastLine.lidx_1;
  }

  //jjjj uses?
  #sig: sig_t = 0;
  get sig() {
    return this.#sig;
  }

  protected abstract lexr$: Lexr<T>;
  /** @final */
  get lexr() {
    return this.lexr$;
  }
  get dtBLoff(): ldt_t {
    return this.lexr$.dtLoff;
  }

  protected abstract pazr$: Pazr<T>;
  /** @final */
  get pazr() {
    return this.pazr$;
  }

  protected abstract tfmr$: Tfmr;
  /** @final */
  get tfmr() {
    return this.tfmr$;
  }
  protected get tbufr$() {
    return this.tfmr$.tbufr;
  }
  /* ~ */

  // #imevu:IMEVu<T>;

  readonly #dragingM_mo = new Moo({ val: false });
  readonly #draggedM_mo = new Moo({ val: false });

  #composingRepl: Repl | undefined;
  readonly #replText_a: string[] = [];

  /**
   * @headconst @param host_x
   * @const @param type_x
   */
  constructor(host_x: EdtrScronr<CI>, type_x: EdtrType) {
    super(host_x, type_x);

    // this.#imevu = new IMEVu( this );
    // this.el$.append( this.#imevu.el );

    // this.dir_mo$.registHandler((_y) => {
    //   this.eline_m.forEach((eline) => eline.dir_$(_y));

    //   for (let i = this.caret_a$.length; i--;) {
    //     this.caret_a$[i].caretrvm?.[1].refresh();
    //   }

    //   this.bufr$.lastView_ts = Date.now(); //!
    // });

    this.#dragingM_mo.registHandler((n_y) => {
      if (n_y) this.#strtDragM();
      else this.#stopDragM();
    });
    this.#draggedM_mo.registHandler((n_y) => {
      if (n_y) {
        /* Focus back to EdtrScrolr from Caret in order to receive "selectionchange". */
        this.el$.focus();
      }
    });

    // new IntersectionObserver( this.#onIntersect )
    //   .observe( this.el$ );

    this.on("focus", this._onFocus);
    this.on("blur", this._onBlur);
    this.on("pointerdown", this._onPointerDown);
    this.on("pointerup", this.#onPointerUp);
    // this.on( "touchstart", this.#onTouchStart );
    this.on("touchend", this.#onTouchEnd);
    if (global.can_hover) {
      this.on("pointerenter", this.#onPointerEnter);
      this.on("pointerleave", this.#onPointerLeave);
    }
    this.on("keydown", this._onKeyDown);
    this.on("keyup", this.#onKeyUp);
    this.on("contextmenu", noContextMenu);
    // this.on( "selectstart", ( evt:Event ) => {
    //   // #if _TRACE
    //     console.log(`>>>>>>> ${this._type_id}.#onSelectstart() >>>>>>>`);
    //     // console.log(evt);
    //   // #endif
    //   // evt.preventDefault();
    //   // evt.stopPropagation();
    //   // evt.stopImmediatePropagation();
    // });
    // this.on( "scroll", e => {
    //   // console.log( e );
    //   console.log( this.el$.scrollTop );
    // });
    // this.on("input", this.#onInput);
    this.on("compositionstart", this._onCompositionStart);
    this.on("compositionupdate", this._onCompositionUpdate);
    this.on("compositionend", this._onCompositionEnd);
    // this.on( "beforeinput", ( evt:InputEvent ) => {
    //   // #if _TRACE
    //     console.log(`>>>>>>> ${this._type_id}.#onBeforeinput() >>>>>>>`);
    //     console.log(evt);
    //   // #endif
    //   evt.preventDefault();
    //   evt.stopPropagation();
    // }, true );
    // this.on( "dragstart", evt => console.log("dragstart") );
    // this.on( "drag", evt => console.log("drag") );
    // this.on( "dragover", evt => console.log("dragover") );
    // this.on( "dragend", evt => console.log("dragend") );

    // EdtrScrolr.#cache_a.add( this );
    /*#static*/ if (INOUT) {
      assert(this.proactiveCaret);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** `in( this.bufr$ )` */
  #onBufr_idle2prerepl = (_: BufrReplState) => {
    if (this.bufr$.oldRan_a.length) this.prereplace_$();
  };
  /** `in( this.bufr$ )` */
  #onBufr_sufrepl2idle = (_: BufrReplState) => {
    if (this.bufr$.newRan_a.length) this.replace_$();
  };

  #onBufrDir = (n_x: BufrDir) => {
    this.coo.el.dir = BufrDir[n_x];
  };

  /**
   * @final
   * @headconst @param bufr_x
   * @headconst @param lexr_x
   * @headconst @param pazr_x
   * @headconst @param tfmr_x
   */
  protected attachBufr_impl$(
    bufr_x: TokBufr<T>,
    lexr_x: Lexr<T>,
    pazr_x: Pazr<T>,
    tfmr_x: Tfmr,
  ) {
    if (bufr_x !== this.bufr$) {
      if (this.bufr$) {
        this.bufr$.dir_mo.removeHandler(this.#onBufrDir);
        this.bufr$.resSig(this.#sig);
        this.bufr$.repl_mo.removeHandler(
          this.#onBufr_idle2prerepl,
          {
            o: BufrReplState.idle,
            n: BufrReplState.prerepl,
          },
        );
        this.bufr$.repl_mo.removeHandler(
          this.#onBufr_sufrepl2idle,
          {
            o: BufrReplState.sufrepl,
            n: BufrReplState.sufrepl_edtr,
          },
        );

        this.bufr$.edtr_sa.delete(this);
      }

      this.bufr$ = bufr_x;

      this.coo.el.dir = BufrDir[bufr_x.dir];
      this.bufr$.dir_mo.registHandler(this.#onBufrDir);
      this.#sig = bufr_x.getSig();
      this.lexr$ = lexr_x;
      // if( this.lexr$ ) assert( this.lexr$ === lexr_x );
      // else this.lexr$ = lexr_x;
      this.pazr$ = pazr_x;
      // if( this.pazr$ ) assert( this.pazr$ === pazr_x );
      // else this.pazr$ = pazr_x;
      this.tfmr$ = tfmr_x;
      bufr_x.repl_mo.registHandler(
        this.#onBufr_idle2prerepl,
        {
          o: BufrReplState.idle,
          n: BufrReplState.prerepl,
        },
      );
      bufr_x.repl_mo.registHandler(
        this.#onBufr_sufrepl2idle,
        {
          o: BufrReplState.sufrepl,
          n: BufrReplState.sufrepl_edtr,
        },
      );
      // console.log(bufr_x.repl_mo.nCb);

      this.bufr$.edtr_sa.add(this);
      this.resetCarets$(this.bufr$.edtr_sa);
    }

    /*#static*/ if (INOUT) {
      assert(this.bufr$);
      assert(this.#sig);
      assert(this.lexr$.bufr === this.bufr$);
      assert(this.pazr$.bufr === this.bufr$ && this.pazr$.lexr === this.lexr$);
      assert(
        this.tfmr$.bufr === this.bufr$ && this.tfmr$.tbufr.bufr === this.bufr$,
      );
    }
    return this;
  }

  /**
   * `in( this.el$.isConnected )`
   * @final
   */
  refresh(): this {
    // /*#static*/ if (_TRACE) {
    //   console.log(`${global.indent}>>>>>>> ${this._type_id}.refresh() >>>>>>>`);
    // }
    // this.reset$();

    // createSetELines(this, this.bufr$.frstLine, this.bufr$.lastLine);
    // /*#static*/ if (DEV) {
    //   ++count.newVuu;
    // }
    // this.bufr$.refresh();

    for (const caret of this.caret_a$) {
      if (caret.realBody?.shown) {
        caret.shadowShow();
      } else {
        caret.hideAll();
      }
    }
    // /*#static*/ if (_TRACE && RESIZ) global.outdent;
    return this;
  }

  // /** @vcoo @final */
  // _init_after_attached()
  // {
  //   console.log(">>>>>>> EdtrScrolr._init_after_attached() >>>>>>>");
  //   /* in */ {
  //     assert( this.el$.isConnected );
  //   }

  //   this.#bcr = this.el$.getBoundingClientRect(); /** @member { DOMRect } */
  //   // console.log( this.#bcr );
  //   this.bufr$.lastView_ts = Date.now(); //!

  //   // for( let i = this.main_el.childNodes.length; i--; )
  //   // {
  //   //   const vuu = this.main_el.childNodes[i][ $vuu ];
  //   //   if( vuu && vuu._init_after_attached ) vuu._init_after_attached();
  //   // }

  //   // this.resizeObserver_.observe( this.el$ );
  // }

  // #onIntersect = () =>
  // {
  //   // #if _TRACE
  //     console.log(`>>>>>>> ${this._type_id}.#onIntersect() >>>>>>>`);
  //   // #endif
  // }
  // _onIntersect() { return this.#onIntersect(); }

  // hideCarets() {
  //   this.caret_a$.forEach((caret_y) => caret_y.hideAll());
  // }
  // /**
  //  * @const @param { Number } leftDIFF
  //  * @const @param { Number } topDIFF
  //  */
  // moveCarets$_( leftDIFF, topDIFF )
  // {
  //   this.caret_a$.forEach( caret_y =>
  //     Object.assign( caret_y.el.style, {
  //       left: `${ caret_y.el.offsetLeft + leftDIFF }px`,
  //       top: `${ caret_y.el.offsetTop + topDIFF }px`,
  //     })
  //   );
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final @implement */
  getEFocusBy_$(rv_x: Ranval, ret_x?: ERan): ERan {
    ret_x ??= new ERan(new ELoc(this.frstELine$!.frstCaretNode, 0));
    const bloc = this.bufr$.getFocusLoc(rv_x);
    /*#static*/ if (INOUT) {
      assert(this.eline_m.has(bloc.line));
    }
    const ctnr = this.eline_m.get(bloc.line)!.caretNodeAt(rv_x.focusLoff);
    ret_x.focusELoc.ctnr_$ = ctnr;
    ret_x.focusELoc.offs_$ = ctnr.isText
      ? bloc.loff - (ctnr as Text)[$loff]
      : fail("kkkk");
    return ret_x;
  }
  /** @final @implement */
  getEAnchrBy_$(rv_x: Ranval, out_x: ERan) {
    const bloc = this.bufr$.getAnchrLoc(rv_x);
    /*#static*/ if (INOUT) {
      assert(this.eline_m.has(bloc.line));
    }
    // console.log(rv_x);
    const ctnr = this.eline_m.get(bloc.line)!.caretNodeAt(rv_x.anchrLoff);
    out_x.anchrELoc.ctnr_$ = ctnr;
    out_x.anchrELoc.offs_$ = ctnr.isText
      ? bloc.loff - (ctnr as Text)[$loff]
      : fail("kkkk");
  }

  /**
   * Set `ranval_$`, `ranpA_$`, `offsA_$`, `ranpF_$`, `offsF_$` of `caret_x`
   * `in( caret_x.eran )`\
   * `in( caret_x.st === CaretState.staring || caret_x.st === CaretState.blinking )`
   * @headconst @param oldRan_x
   * @headconst @param caret_x
   */
  #calcRanP(oldRan_x: Ran, caret_x: Caret): void {
    const rv_ = caret_x.ranval_$ = this.getRanvalBy$(caret_x.eran!);
    [caret_x.ranpF_$, caret_x.offsF_$] = oldRan_x.calcRanP(
      rv_.focusLidx,
      rv_.focusLoff,
    );
    if (rv_.collapsed) {
      [caret_x.ranpA_$, caret_x.offsA_$] = [caret_x.ranpF_$, caret_x.offsF_$];
    } else {
      [caret_x.ranpA_$, caret_x.offsA_$] = oldRan_x.calcRanP(
        rv_.anchrLidx,
        rv_.anchrLoff,
      );
    }
  }
  /**
   * Set `ranpA_$`, `offsA_$`, `ranpF_$`, `offsF_$` of each `Caret` in
   * `caret_a$`\
   * `in( this.bufr.oldRan_a.length )`
   * @final
   */
  prereplace_$(): void {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.prereplace_$() >>>>>>>`,
      );
    }
    if (this.bufr$.oldRan_a.length > 1) {
      fail("Not implemented"); //kkkk
    }

    const oldRan = this.bufr$.oldRan_a[0];
    let mc_ = this.proactiveCaret;
    if (
      mc_.eran &&
      (mc_.st === CaretState.staring || mc_.st === CaretState.blinking)
    ) {
      if (
        this.bufr$.doState === BufrDoState.undoing ||
        this.bufr$.doState === BufrDoState.redoing
      ) {
        mc_.ranpA_$ = RanP.frstLineBefor;
        mc_.offsA_$ = oldRan.strtLoff;
        mc_.ranpF_$ = RanP.lastLineAfter;
        mc_.offsF_$ = 0;
      } else {
        this.#calcRanP(oldRan, mc_);
      }
    } else {
      /* In passive `EdtrScrolr`, where its `proactiveCaret` does not `blink()` or
      `stare()` yet. */
      mc_.ranpF_$ = RanP.unknown;
    }

    for (let i = 1; i < this.caret_a$.length; ++i) {
      const c_ = this.caret_a$[i];
      if (
        c_.eran &&
        (c_.st === CaretState.staring || c_.st === CaretState.blinking)
      ) {
        this.#calcRanP(oldRan, c_);
      } else {
        /* In proactive `EdtrScrolr`, where its passive `Caret`s do not `stare()` yet. */
        c_.ranpF_$ = RanP.unknown;
      }
    }
    /*#static*/ if (_TRACE) global.outdent;
    return;
  }

  // get pazer() { return this.pazr$; }
  get rootSn(): Stnode<T> | undefined {
    return this.pazr$ ? this.pazr$.root : undefined;
  }

  /**
   * @final
   * @headconst @param ret_x
   * @headconst @param refV_x
   */
  addELine_$(ret_x: ELine<T>, refV_x?: ELine<T>): ELine<T> {
    refV_x ? refV_x.el.before(ret_x.el) : this.main_el.append(ret_x.el);
    this.eline_m.set(ret_x.bline_$, ret_x);
    return ret_x;
  }
  /**
   * `in( this.eline_m.get(ret_x.bline_$) === ret_x )`
   * @final
   * @headconst @param ret_x
   */
  remELine_$(ret_x: ELine<T>): ELine<T> {
    ret_x.el.remove();
    /* `eline_m.get(ret_x.bline_$)` could already be a valid `ELine`, e.g.
    "a\nb" repl(rv(0,1,1,0), "") */
    if (this.eline_m.get(ret_x.bline_$) === ret_x) {
      this.eline_m.delete(ret_x.bline_$);
    }
    return ret_x;
  }

  /**
   * @final
   * @headconst @param ret_x
   * @headconst @param bln_x
   */
  resetELine_$(ret_x: ELine<T, CI>, bln_x: TokLine<T>): ELine<T, CI> {
    if (ret_x.bline_$ !== bln_x) {
      this.eline_m.delete(ret_x.bline_$);
      ret_x.bline_$ = bln_x;
      this.eline_m.set(bln_x, ret_x);
    }
    return ret_x;
  }

  /**
   * @headconst @param newRan_x
   * @const @param ranp_x
   * @const @param offs_x
   * @const @param loff_x
   * @out @headconst @param out_a
   */
  #replace_adjust_impl(
    newRan_x: Ran,
    ranp_x: RanP,
    offs_x: loff_t | lnum_t,
    loff_x: loff_t,
    out_a: [lnum_t, loff_t],
  ) {
    /* final switch */ ({
      [RanP.ranLinesBefor]: () => {
        out_a[0] = offs_x as lnum_t;
        out_a[1] = loff_x;
      },
      [RanP.ranLinesAfter]: () => {
        out_a[0] = (newRan_x.lastLine.lidx_1 + offs_x) as lnum_t;
        out_a[1] = loff_x;
      },
      [RanP.lastLineAfter]: () => {
        out_a[0] = newRan_x.lastLine.lidx_1;
        out_a[1] = newRan_x.stopLoff + offs_x;
      },
      [RanP.frstLineBefor]: () => {
        out_a[0] = newRan_x.frstLine.lidx_1;
        out_a[1] = loff_x;
      },
      [RanP.inOldRan]: () => {
        out_a[0] = newRan_x.lastLine.lidx_1;
        out_a[1] = newRan_x.stopLoff;
      },
      [RanP.unknown]: () => {
        fail();
      },
    }[ranp_x])();
  }
  /**
   * Set `caret_x.ranval_$`\
   * `in( caret_x.ranpF_$ !== RanP.unknown )`
   * @headconst @param newRan_x
   * @headconst @param caret_x
   * @const @param collapsed_x
   */
  #replace_adjust(newRan_x: Ran, caret_x: Caret, collapsed_x = false) {
    const out_a: [lnum_t, loff_t] = [0 as lnum_t, 0];
    this.#replace_adjust_impl(
      newRan_x,
      caret_x.ranpF_$,
      caret_x.offsF_$,
      caret_x.ranval_$.focusLoff,
      out_a,
    );
    caret_x.ranval_$.focusLidx = out_a[0];
    caret_x.ranval_$.focusLoff = out_a[1];
    if (collapsed_x) {
      caret_x.ranval_$.collapseToFocus();
    } else {
      this.#replace_adjust_impl(
        newRan_x,
        caret_x.ranpA_$,
        caret_x.offsA_$,
        caret_x.ranval_$.anchrLoff,
        out_a,
      );
      caret_x.ranval_$.anchrLidx = out_a[0];
      caret_x.ranval_$.anchrLoff = out_a[1];
    }
  }

  /** `in( this.bufr$.newRan && this.bufr$.oldRan )` */
  protected abstract replace_impl$(): void;
  /**
   * `in( this.bufr$.newRan && this.bufr$.oldRan )`
   * @final
   */
  replace_$(): void {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.replace_$() >>>>>>>`,
      );
    }
    if (this.bufr$.newRan_a.length > 1) {
      fail("Not implemented"); //kkkk
    }

    // const oldRan = this.bufr$.oldRan;
    const newRan = this.bufr$.newRan_a[0];
    const mc_ = this.proactiveCaret;
    if (mc_.ranpF_$ === RanP.unknown) {
      /* In passive `EdtrScrolr`, where its `proactiveCaret` does not `blink()` or
      `stare()` yet. */
    } else {
      if (
        this.bufr$.doState === BufrDoState.undoing ||
        this.bufr$.doState === BufrDoState.redoing
      ) {
        mc_.ranval_$.focusLidx = newRan.lastLine.lidx_1;
        mc_.ranval_$.focusLoff = newRan.stopLoff;
        mc_.ranval_$.anchrLidx = newRan.frstLine.lidx_1;
        mc_.ranval_$.anchrLoff = newRan.strtLoff;
      } else {
        this.#replace_adjust(newRan, mc_, true);
      }
    }

    for (let i = 1; i < this.caret_a$.length; i++) {
      const c_ = this.caret_a$[i];
      if (c_.ranpF_$ === RanP.unknown) {
        /* In proactive `EdtrScrolr`, where its passive `Caret`s do not `stare()` yet. */
      } else {
        this.#replace_adjust(newRan, c_);
      }
    }

    this.replace_impl$();

    for (const c_ of this.caret_a$) {
      this.getERanBy_$(c_.ranval_$, c_.eran);
    }

    // if( eran0 )
    // {
    //   if( this.bufr$.doState === BufrDoState.doing )
    //   {
    //     adjust( eran0.focusELoc, eran0.ranpF_$ );
    //     eran0.collapse_$();
    //   }
    //   else if( this.bufr$.doState === BufrDoState.undoing
    //         || this.bufr$.doState === BufrDoState.redoing
    //   ) {
    //     if( eran0.collapsed )
    //     {
    //       if( eran0.ranpF_$ === RanP.lastLineAfter
    //        && eran0.focusELoc.offs_$ === oldRan.stopLoff
    //        && oldRan.collapsed
    //       ) {
    //         eran0.focusELoc.ctnr_$ = stopContainer;
    //         eran0.focusELoc.offs_$ = newRan.stopLoff;
    //         eran0.rise$_();
    //         eran0.anchrELoc.ctnr_$ = strtContainer;
    //         eran0.anchrELoc.offs_$ = newRan.strtLoff;
    //         assert( !eran0.collapsed );
    //       }
    //       else {
    //         adjust( eran0.focusELoc, eran0.ranpF_$ );
    //         eran0.collapse_$();
    //       }
    //     }
    //     else {
    //       adjust( eran0.focusELoc, eran0.ranpF_$ );
    //       adjust( eran0.anchrELoc, eran0.ranpA_$ );
    //     }
    //   }
    //   else assert(0);
    // }
    /*#static*/ if (_TRACE) global.outdent;
    return;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  @bind
  @traceOut(_TRACE && EDITOR)
  private _onFocus(evt_x: FocusEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onFocus() >>>>>>>`,
      );
    }
    // /* in */ { assert( this.proactiveCaret.st !== CaretState.blinking ); }

    // console.log(e);

    // this.st_ = EdtrScrolr.ST.focusing;
    // assert( !document[ $selection_vu ] );

    // this.setSel$();
    // this.setRange$(
    //   this.sel$.focusNode, this.sel$.focusOffs,
    //   this.sel$.anchorNode, this.sel$.anchorOffset );
    // this.proactiveCaret.blink();
    // this.restoreSel$();

    // console.log( document[ $selection_vu ] );
    // console.log( this );
    document[$selection_vu] = this; //!
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.dent}Set document[$selection_vu] = ${this._type_id}`,
      );
    }

    // if( this.proactiveCaret.st === CaretState.hidden )
    // {
    //   this.setCaret_( this.el$.firstChild, 0 );
    // }
    // getSelection().collapse( this.proactiveCaret.focus$_.startContainer,
    //                          this.proactiveCaret.focus$_.startOffset );
    // this.proactiveCaret.blink();

    // if( this.proactiveCaret.st === CaretState.hidden )
    // {
    //   this.setCaret_( this.el$.firstChild, 0 );
    // }

    // // assert( this.proactiveCaret.focus$_ );
    // const sel = getSelection();
    // // sel.empty();
    // sel.addRange( this.proactiveCaret.focus$_ );

    // this.proactiveCaret.blink();
  }
  @bind
  @traceOut(_TRACE && EDITOR)
  private _onBlur(evt_x: FocusEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}._onBlur() >>>>>>>`);
    }
    if (document[$selection_vu] === this) {
      document[$selection_vu] = undefined;
      /*#static*/ if (_TRACE && EDITOR) {
        console.log(`${global.dent}Set document[$selection_vu] = undefined`);
      }
    }

    // if( this.proactiveCaret.shown )
    //   this.proactiveCaret.stare();

    // if( this.sel$ )
    // {
    //   this.sel$.empty();
    //   this.sel$ = null;
    // }

    // // this.st_ = EdtrScrolr.ST.unfocus;
  }

  #strtDragM() {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#strtDragM() >>>>>>>`,
      );
    }
    this.on("pointermove", this.#onDragM);

    // document[ $selection_vu ] = this;
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }
  #stopDragM() {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#stopDragM() >>>>>>>`,
      );
    }
    this.off("pointermove", this.#onDragM);

    // Otherwise, selected texts could get dragged by mouse.
    this.proactiveCaret.el.focus();
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  #onDragM = () => {
    // // #if _TRACE
    //   console.log(`${global.indent}>>>>>>> ${this._type_id}.#onDragM() >>>>>>>`);
    // // #endif
    this.#draggedM_mo.val = true;

    document[$selection_vu] = this;
    // // #if _TRACE
    //   global.outdent;
    // // #endif
  };

  @bind
  @traceOut(_TRACE && EDITOR)
  private _onPointerDown(evt_x: PointerEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onPointerDown() >>>>>>>`,
      );
    }
    // evt_x.preventDefault();
    // evt_x.stopPropagation();

    this.#draggedM_mo.val = false; //!

    if (evt_x.button === MouseButton.Main) {
      this.#dragingM_mo.val = true;

      document[$selection_vu] = this;
      /*#static*/ if (_TRACE && EDITOR) {
        console.log(
          `${global.dent}Set document[$selection_vu] = ${this._type_id}`,
        );
      }
    } else {
      evt_x.preventDefault();
    }
  }
  #onPointerUp = (evt_x: PointerEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onPointerUp() >>>>>>>`,
      );
    }
    // if( this.#dragingM_mo.val )
    // {
    //   this.proactiveCaret.el.focus();
    // }

    this.#dragingM_mo.val = false;
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  // #onTouchStart = ( evt_x:TouchEvent ) =>
  // {
  //   // #if _TRACE
  //     console.log(`${global.indent}>>>>>>> ${this._type_id}.#onTouchStart() >>>>>>>`);
  //   // #endif
  //   evt_x.preventDefault();
  //   // #if _TRACE
  //     global.outdent;
  //   // #endif
  // }
  /**
   * "pointerup" doesn't seem to be triggered after "touchmove".
   * "touchend" will be trggered anyway after "touchmove".
   */
  #onTouchEnd = (evt: TouchEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onTouchEnd() >>>>>>>`,
      );
    }
    // if( this.#dragingM_mo.val )
    // {
    //   this.proactiveCaret.el.focus();
    // }

    this.#dragingM_mo.val = false;
    /*#static*/ if (_TRACE && EDITOR) {
      global.outdent;
    }
  };

  #onPointerEnter = () => {
    // // #if _TRACE
    //   console.log(`>>>>>>> ${this._type_id}.#onPointerEnter() >>>>>>>`);
    // // #endif
    // if( this.#dragingM_mo.val )
    // {
    //   this.#draging0_mo.val = true;

    //   document[ $selection_vu ] = this;
    //   console.log( `Set document[$selection_vu] = ${this._type_id}` );
    // }
  };
  #onPointerLeave = () => {
    // // #if _TRACE
    //   console.log(`>>>>>>> ${this._type_id}.#onPointerLeave() >>>>>>>`);
    // // #endif
    if (this.#dragingM_mo.val) {
      this.el$.blur();
    }

    this.#dragingM_mo.val = false;
  };

  /**
   * Set `sel$` by `proactiveCaret.eran`
   * @deprecated seems not useful
   * @final
   */
  protected restoreSel$() {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.restoreSel$() >>>>>>>`,
      );
    }
    const mc_ = this.proactiveCaret;
    /*#static*/ if (INOUT) {
      assert(mc_.st === CaretState.blinking);
    }
    const sel = this.sel$ = window.getSelection()!;
    const eran = mc_.eran!;
    /*#static*/ if (INOUT) {
      assert(sel && eran);
    }
    if (eran.collapsed) {
      sel.collapse(eran.focusCtnr, eran.focusOffs); // `_onFocus()`
    } else {
      sel.collapse(eran.anchrCtnr, eran.anchrOffs); // `_onFocus()`
      sel.extend(eran.focusCtnr, eran.focusOffs);
    }
    // sel[ $sync_eran ] = true;

    mc_.el.focus(); //! `_onBlur()`
    /* Then `document[$selection_vu] = undefined` in `_onBlur()`, so
    `onSelectionchange()` will not be called. */
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  /**
   * When moving main caret, handle main caret.
   * @final
   * @headconst @param rv_x [COPIED] because it will be kept through
   *    `proactiveCaret.keepRanval_$()`
   */
  @traceOut(_TRACE && EDITOR)
  onSelectionchange(rv_x?: Ranval) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        [
          "%c",
          global.indent,
          ">>>>>>> ",
          `${this._type_id}.onSelectionchange(${rv_x ?? ""})`,
          " >>>>>>>",
        ].join(""),
        `color:${LOG_cssc.selectionchange_1}`,
      );
      console.log(
        global.dent +
          `proactiveCaret.st: ${CaretState[this.proactiveCaret.st]}`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(document[$selection_vu] === this);
    }
    document[$selection_vu] = undefined;
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(`${global.dent}Set document[$selection_vu] = undefined`);
    }

    const mc_ = this.proactiveCaret;
    if (rv_x) mc_.keepRanval_$(rv_x); //!
    if (mc_.st === CaretState.staring) {
      rv_x ??= this.getRanvalBy$(mc_.eran!);
      mc_.setByRanval(rv_x, true);

      // mc_.blink();
    } else if (this.setSel$()) {
      // if( this.sel$?.[$sync_eran] )
      mc_.setERanBySel_$(this.sel$!);

      rv_x ??= this.getRanvalBy$(mc_.eran!);
      mc_.setByRanval(rv_x, mc_.st !== CaretState.blinking);
      // mc_.setByRanval( rv_x, true );

      // if( !mc_.caretrvm ) mc_.createCaretRvM_$( this.bufr$ );
      // const ranval = this.getRanvalBy$( eran );
      // // // #if DEV && !TESTING
      // //   reportMove( Van.getRan(this.bufr$,ranval).toRanval()
      // //       , this.type );
      // // // #endif
      // mc_.caretrvm![1].val = ranval;
      // console.log(this.el$.scrollLeft);
      // console.log(this.el$.scrollTop);

      // this.sel$!.collapse( this.el$, 1 );
      // const sel = window.getSelection();
      // console.log( sel!.focusNode );
      // console.log( sel!.focusOffs );
    }
    // console.log( document.activeElement );
    if (!this.#draggedM_mo.val) {
      mc_.el.focus();
    }

    // if( selectchanging ) document[ $selection_vu ] = this;

    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        global.dent +
          `proactiveCaret.st: ${CaretState[this.proactiveCaret.st]}`,
      );
    }
  }

  /** Helper */
  protected ctnr$!: Node;
  /** Helper */
  protected offs$!: number;
  /**
   * `out( this.ctnr$ !== undefined )`\
   * `out( this.offs$ !== undefined )`
   * @headconst @param ctnr_x
   * @const @param offs_x
   */
  protected correctSel$(ctnr_x: Node | null, offs_x: number) {
    // console.log("🚀 ", ctnr_x);
    if (ctnr_x?.isText) {
      const ozrInfo = new OzrInfo();
      ELine.getBLine(ctnr_x, ozrInfo);
      this.offs$ = ozrInfo.eline.empty ? 0 : offs_x;
      this.ctnr$ = ctnr_x;
    } else {
      this.ctnr$ = this.frstELine$!.frstCaretNode;
      this.offs$ = 0;
    }
  }

  /** Set by other data rather than `eran`. */
  protected setSel$(): boolean {
    this.sel$ = window.getSelection();
    if (!this.sel$) return false;

    // this.sel$[ $sync_eran ] = false; //!

    // this.correctSel$( this.sel$.focusNode, this.sel$.focusOffs );
    // this.sel$.collapse( this.ctnr$, this.offs$ );
    // this.sel$[ $sync_eran ] = true;
    if (this.sel$.isCollapsed) {
      this.correctSel$(this.sel$.focusNode, this.sel$.focusOffset);
      this.sel$.collapse(this.ctnr$, this.offs$);
      // this.sel$[ $sync_eran ] = true;
    } // if( this.sel$.focusNode && this.sel$.focusNode.isText
    //       && this.sel$.anchorNode && this.sel$.anchorNode.isText
    // )
    else {
      this.correctSel$(this.sel$.anchorNode, this.sel$.anchorOffset);
      const focusCtnr = this.sel$.focusNode;
      const focusOffs = this.sel$.focusOffset;
      this.sel$.collapse(this.ctnr$, this.offs$);
      this.correctSel$(focusCtnr, focusOffs);
      this.sel$.extend(this.ctnr$, this.offs$);
      // this.sel$[ $sync_eran ] = true;
    }
    return true;
  }

  // /**
  //  * @headconst @param { ERan } eran
  //  * @return { TokRan }
  //  */
  // getBran$( eran ) { assert(0); }

  /**
   * @const @param forceOnce_x E.g., through `deleteUChr$()`, `ranval_$` will
   *    not change `caretrvm![1].val`, so must `forceOnce_x` to update
   *    `eran.focusCtnr`, etc in `Caret.#onRanvalChange()`.
   */
  #syncAllCaret(forceOnce_x?: boolean) {
    // if (!this.proactiveCaret.caretrvm) {
    //   this.proactiveCaret.createCaretRvM_$(this.bufr$);
    // }
    // In reverse order to make sure that the main caret is handled last
    for (let i = this.caret_a$.length; i--;) {
      const caret = this.caret_a$[i];
      if (caret.active && caret.ranpF_$ !== RanP.unknown) {
        if (forceOnce_x !== undefined) {
          caret.caretrvm![1].forceOnce = forceOnce_x;
        }
        // console.log(`caret.ranval_$ = [${caret.ranval_$}]`);
        caret.caretrvm![1].val = caret.ranval_$;
      }
    }
  }
  _syncAllCaret(forceOnce_x?: boolean) {
    return this.#syncAllCaret(forceOnce_x);
  }

  protected get shortcut$(): EdtrShortcut {
    return EdtrShortcut_m;
  }
  /**
   * @const @param kb_x
   * @headconst @param st_x
   */
  #funcOf(kb_x: Keybinding, st_x?: EdtrState) {
    const ret = this.shortcut$.get(kb_x);
    return (!ret || typeof ret === "string")
      ? ret
      : st_x
      ? ret[st_x]
      : undefined;
  }
  /** @const @param f_x */
  protected onKeydown_impl_f$(f_x: string): void {
    const mc_ = this.proactiveCaret;
    /** EdtrFuncRet */
    const efr = this[f_x as EdtrFuncName](mc_);
    // if (efr === EdtrFuncRet.caret) {
    //   // mc_.show$();
    //   // this.restoreSel$();
    // }
  }
  /** @deprecated */
  #keydown_unidentified = false;
  @bind
  @traceOut(_TRACE && EDITOR)
  private _onKeyDown(evt_x: KeyboardEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onKeyDown() >>>>>>>`,
      );
      // console.log(evt_x);
      console.log(`${global.dent}isComposing = ${evt_x.isComposing}`);
      console.log(`${global.dent}key = "${evt_x.key}"`);
    }
    const key = evt_x.key;
    const mc_ = this.proactiveCaret;

    if (document[$selection_vu] === this) {
      document[$selection_vu] = undefined;
      /*#static*/ if (_TRACE && EDITOR) {
        console.log(`${global.dent}Set document[$selection_vu] = undefined`);
      }
    }

    /* Handled by IME */
    if (key === "Unidentified" || key === "Process" || evt_x.isComposing) {
      return;
    }

    /* Handled by higher events handlers */
    if (key === "F5" || key === "F12") {
      return;
    }

    evt_x.preventDefault();

    if (!this.edting) {
      ///
    }

    /*#static*/ if (INOUT) {
      assert(mc_.eran && mc_.active && mc_.st === CaretState.blinking);
    }
    let func_: string | undefined;
    if (key.length === 1) {
      if (evt_x.altKey) {
        func_ = this.#funcOf(`${Key.Alt}+${key}`);
      } else if (evt_x.ctrlKey) {
        func_ = this.#funcOf(`${Key.Control}+${key}`);
      } else if (evt_x.metaKey) {
        func_ = this.#funcOf(`${Key.Meta}+${key}`);
      } else {
        this.insertUChr$(key);
      }
    } // else if( key === "Unidentified" && !evt_x.isComposing )
    // {
    //   if( evt_x.altKey ) {}
    //   else if( evt_x.ctrlKey ) {}
    //   else if( evt_x.metaKey ) {}
    //   else impl_k( "insertUChr$", "?" );
    // }
    else if (key === "Enter") {
      if (evt_x.altKey) {}
      else if (evt_x.ctrlKey) {}
      else if (evt_x.metaKey) {}
      else this.carriageReturn$();
    } else if (key === "Tab") {
      if (evt_x.altKey) {}
      else if (evt_x.ctrlKey) {}
      else if (evt_x.metaKey) {}
      else this.tabulate$();
    } else if (key === "Backspace") {
      if (evt_x.altKey) {}
      else if (evt_x.ctrlKey) {}
      else if (evt_x.metaKey) {}
      else this.deletePrevUChr$();
    } else if (key === "Delete") {
      if (evt_x.altKey) {}
      else if (evt_x.ctrlKey) {}
      else if (evt_x.metaKey) {}
      else this.deleteUChr$();
    } else if (key === "ArrowLeft") {
      if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        if (evt_x.shiftKey) {
          func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.ArrowLeft}`);
        } else {
          func_ = this.#funcOf(`${Key.Control}+${Key.ArrowLeft}`);
        }
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.ArrowLeft}`);
      } else {
        func_ = this.#funcOf(`${Key.ArrowLeft}`);
      }
    } else if (key === "ArrowRight") {
      if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        if (evt_x.shiftKey) {
          func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.ArrowRight}`);
        } else {
          func_ = this.#funcOf(`${Key.Control}+${Key.ArrowRight}`);
        }
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.ArrowRight}`);
      } else {
        func_ = this.#funcOf(`${Key.ArrowRight}`);
      }
    } else if (key === "ArrowUp") {
      if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        if (evt_x.shiftKey) {
          func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.ArrowUp}`);
        } else {
          func_ = this.#funcOf(`${Key.Control}+${Key.ArrowUp}`);
        }
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.ArrowUp}`);
      } else {
        func_ = this.#funcOf(`${Key.ArrowUp}`);
      }
    } else if (key === "ArrowDown") {
      if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        if (evt_x.shiftKey) {
          func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.ArrowDown}`);
        } else {
          func_ = this.#funcOf(`${Key.Control}+${Key.ArrowDown}`);
        }
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.ArrowDown}`);
      } else {
        func_ = this.#funcOf(`${Key.ArrowDown}`);
      }
    } else if (key === "Home") {
      if (evt_x.ctrlKey && evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.Home}`);
      } else if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        func_ = this.#funcOf(`${Key.Control}+${Key.Home}`);
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.Home}`);
      } else {
        func_ = this.#funcOf(`${Key.Home}`);
      }
    } else if (key === "End") {
      if (evt_x.ctrlKey && evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Control}+${Key.Shift}+${Key.End}`);
      } else if (evt_x.altKey) {
      } else if (evt_x.ctrlKey) {
        func_ = this.#funcOf(`${Key.Control}+${Key.End}`);
      } else if (evt_x.metaKey) {
      } else if (evt_x.shiftKey) {
        func_ = this.#funcOf(`${Key.Shift}+${Key.End}`);
      } else {
        func_ = this.#funcOf(`${Key.End}`);
      }
    }
    if (func_) {
      this.onKeydown_impl_f$(func_);
    }
  }

  #onKeyUp = (evt_x: KeyboardEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onKeyUp() >>>>>>>`,
      );
      console.log(`${global.dent}isComposing = ${evt_x.isComposing}`);
    }
    // console.log( this.#imevu.height_save );
    // console.log( this.#imevu.el.clientHeight );

    // if( evt_x.isComposing ) this.#imevu.adjust_$();
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  /**
   * See [why](https://stackoverflow.com/questions/63273548/why-input-event-has-event-type-of-event-instead-of-inputevent)
   * `Event` rather than `InputEvent`?
   * @deprecated
   */
  #onInput = (evt_x: Event) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onInput() >>>>>>>`,
      );
      console.log(
        `${global.dent}inputType = "${(evt_x as InputEvent).inputType}"`,
      );
      console.log(`${global.dent}data = "${(evt_x as InputEvent).data}"`);
    }
    if (!(evt_x instanceof InputEvent)) {
      /*#static*/ if (_TRACE && EDITOR) global.outdent;
      return;
    }
    if (!this.#keydown_unidentified) {
      /*#static*/ if (_TRACE && EDITOR) global.outdent;
      return;
    }

    evt_x.preventDefault();
    // evt_x.stopPropagation();

    const mc_ = this.proactiveCaret;
    /*#static*/ if (INOUT) {
      assert(mc_.eran && mc_.active && mc_.st === CaretState.blinking);
    }
    switch (evt_x.inputType) {
      case "insertText":
        console.log(
          `%c${global.dent}run here: "insertText"`,
          `color:${LOG_cssc.runhere}`,
        );
        this.insertUChr$(evt_x.data!);
        break;
      case "deleteContentBackward":
        console.log(
          `%c${global.dent}run here: "deleteContentBackward"`,
          `color:${LOG_cssc.runhere}`,
        );
        this.deletePrevUChr$();
        break;
      case "insertCompositionText":
        if (evt_x.data) {
          if (this.#composingRepl) {
            console.log(
              `%c${global.dent}run here: #composingRepl = true`,
              `color:${LOG_cssc.runhere}`,
            );
            this.#composingRepl.replFRun(evt_x.data);
          } else {
            console.log(
              `%c${global.dent}run here: #composingRepl = false`,
              `color:${LOG_cssc.runhere}`,
            );
            this.#composingRepl = new Repl(
              this.bufr$,
              this.getRanvalBy$(mc_.eran!),
              evt_x.data,
            );
            this.#composingRepl.replFRun();
          }
          this.#syncAllCaret(true);
        }
        break;
    }
    // const sel = window.getSelection();
    // console.log( `sel.anchorOffset=${sel.anchorOffset}, sel.focusOffs=${sel.focusOffs}` );
    // // evt.preventDefault();
    // // evt.stopPropagation();
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  @bind
  @traceOut(_TRACE && EDITOR)
  private _onCompositionStart(evt_x: CompositionEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onCompositionStart() >>>>>>>`,
      );
      console.log(`${global.dent}data: "${evt_x.data}"`);
    }
    /*#static*/ if (INOUT) {
      assert(this.#composingRepl === undefined);
    }
    this.#composingRepl = new Repl(
      this.bufr$,
      this.getRanvalBy$(this.proactiveCaret.eran!),
      "",
    );
    this.#composingRepl.replFRun(evt_x.data);
    this.#replText_a.become(this.#composingRepl!.replText_a!);
    this.#syncAllCaret(true);

    // evt_x.preventDefault();
    // evt_x.stopPropagation();

    // assert( this.sel$ );
    // this.sel$!.collapse( this.#imevu.el.firstChild, 0 );
    // this.sel$![ $sync_eran ] = false;

    // assert( this.proactiveCaret.st === CaretState.blinking );
    // const caret_el = this.proactiveCaret.el;
    // this.#imevu.show_$(
    //   caret_el.offsetLeft + caret_el.clientWidth,
    //   caret_el.offsetTop,
    //   caret_el.clientHeight );
  }
  /** `in( this.#composingRepl )` */
  @bind
  @traceOut(_TRACE && EDITOR)
  private _onCompositionUpdate(evt_x: CompositionEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onCompositionUpdate() >>>>>>>`,
      );
      console.log(`${global.dent}data = "${evt_x.data}"`);
    }
    this.#composingRepl!.replFRun(evt_x.data);
    this.#syncAllCaret(true);

    // evt_x.preventDefault();
    // evt_x.stopPropagation();
    // console.log( this.#imevu.height_save );
    // console.log( this.#imevu.el.clientHeight );
  }
  /** `in( this.#composingRepl )` */
  @bind
  @traceOut(_TRACE && EDITOR)
  private _onCompositionEnd(evt_x: CompositionEvent) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}._onCompositionEnd() >>>>>>>`,
      );
      console.log(`${global.dent}data = "${evt_x.data}"`);
    }
    // if (!this.#composingRepl) {
    //   /*#static*/ if (_TRACE && EDITOR) global.outdent;
    //   return;
    // }

    if (evt_x.data) {
      this.bufr$.doqOnly(this.#composingRepl!);
    } else {
      this.#composingRepl!.replText_a!.become(this.#replText_a);
      this.#composingRepl!.replBRun();
      this.#syncAllCaret(true);
    }
    this.#composingRepl = undefined;
    // this.#replText_a.length = 0;

    // if( evt_x.data )
    // {
    //   const caret = this.proactiveCaret;
    //   assert( caret.eran );
    //   this.kChr$( evt_x.data, <ERan>caret.eran, caret.caretrvm );
    //   // if( caret.st === CaretState.blinking ) this.restoreSel$();
    // }

    // // this.#imevu.hide_$();
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  // kCtrlEnter$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  // kShiftEnter$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  /** `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )` */
  protected carriageReturn$() {
    this.insertUChr$("\n");
  }

  // kCtrlTab$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  // kShiftTab$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  /** @see {@linkcode carriageReturn$()} */
  protected tabulate$() {
    this.insertUChr$("\t");
  }

  // kCtrlBackspace$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  // kShiftBackspace$( mc_x: Caret ) { return EdtrFuncRet.nope; }
  /**
   * `in( this.proactiveCaret.eran && this.proactiveCaret.active && this.proactiveCaret.st === CaretState.blinking )`
   * @final
   */
  protected deletePrevUChr$(): void {
    let efr = EdtrFuncRet.unknown;
    const eran = this.proactiveCaret.eran!;
    const rv_ = this.getRanvalBy$(eran);
    if (eran.collapsed) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (focusBLoc.atSob) {
        efr = EdtrFuncRet.nope;
      } else {
        efr = EdtrFuncRet.caret;
        focusBLoc.back().toRanval(rv_, 0);
      }
    } else {
      efr = EdtrFuncRet.caret;
    }

    if (efr === EdtrFuncRet.caret) {
      this.bufr$.Do(rv_, "");
      this.#syncAllCaret();

      // this.restoreSel$();
    }
  }

  // kCtrlDelete$( caret ) { return false; }
  // kShiftDelete$( caret ) { return false; }
  /** @see {@linkcode deletePrevUChr$()} */
  protected deleteUChr$(): void {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.deleteUChr$() >>>>>>>`,
      );
    }
    let efr = EdtrFuncRet.unknown;
    const eran = this.proactiveCaret.eran!;
    const rv_ = this.getRanvalBy$(eran);
    if (eran.collapsed) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (focusBLoc.reachEob) {
        efr = EdtrFuncRet.nope;
      } else {
        efr = EdtrFuncRet.caret;
        focusBLoc.forw().toRanval(rv_, 0);
      }
    } else {
      efr = EdtrFuncRet.caret;
    }

    if (efr === EdtrFuncRet.caret) {
      this.bufr$.Do(rv_, "");
      this.#syncAllCaret(true);

      // this.restoreSel$();
    }
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  /**
   * `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )`
   *
   * @final
   * @headconst @param mc_x `proactiveCaret`
   */
  protected moveCaretLeft(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (mc_x.eran!.collapsed) {
        ret = focusBLoc.visulLeftenIn(this.eline_m)
          ? EdtrFuncRet.caret
          : EdtrFuncRet.nope;
        if (ret === EdtrFuncRet.caret) {
          rv_.focusLidx = focusBLoc.line.lidx_1;
          rv_.focusLoff = focusBLoc.loff;
          rv_.collapseToFocus();
        }
      } else {
        ret = EdtrFuncRet.caret;
        const anchrBLoc = this.bufr$.getAnchrLoc(rv_);
        const focusRec = mc_x.eran!.focusCtnr[$rec_utx_a][mc_x.eran!.focusOffs];
        const anchrRec = mc_x.eran!.anchrCtnr[$rec_utx_a][mc_x.eran!.anchrOffs];
        if (Number.apxS(anchrRec.left, focusRec.left)) {
          rv_.focusLidx = anchrBLoc.line.lidx_1;
          rv_.focusLoff = anchrBLoc.loff;
        }
        rv_.collapseToFocus();
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusNextRow(rv_, mc_x)
        : this._focusPrevRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
      //             , this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretRigt(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (mc_x.eran!.collapsed) {
        ret = focusBLoc.visulRigtenIn(this.eline_m)
          ? EdtrFuncRet.caret
          : EdtrFuncRet.nope;
        if (ret === EdtrFuncRet.caret) {
          rv_.focusLidx = focusBLoc.line.lidx_1;
          rv_.focusLoff = focusBLoc.loff;
          rv_.collapseToFocus();
        }
      } else {
        ret = EdtrFuncRet.caret;
        const anchrBLoc = this.bufr$.getAnchrLoc(rv_);
        const focusRec = mc_x.eran!.focusCtnr[$rec_utx_a][mc_x.eran!.focusOffs];
        const anchrRec = mc_x.eran!.anchrCtnr[$rec_utx_a][mc_x.eran!.anchrOffs];
        if (Number.apxG(anchrRec.right, focusRec.right)) {
          rv_.focusLidx = anchrBLoc.line.lidx_1;
          rv_.focusLoff = anchrBLoc.loff;
        }
        rv_.collapseToFocus();
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusPrevRow(rv_, mc_x)
        : this._focusNextRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval(), this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }

  /** @final @implement */
  anchrRecOf_$(rv_x: Ranval, eran_x?: ERan): DOMRect {
    rv_x.focusLidx = rv_x.anchrLidx;
    rv_x.focusLoff = rv_x.anchrLoff + 1;
    eran_x = this.getERanBy_$(rv_x, eran_x);
    const ctnr = eran_x!.anchrCtnr;
    const offs = eran_x!.anchrOffs;
    ctnr[$rec_utx_a] ??= [];
    let ret = ctnr[$rec_utx_a].at(offs);
    if (!ret || ret[$uts] < this.bufr$.lastView_ts) {
      ret =
        ctnr[$rec_utx_a][offs] =
          eran_x!.syncRange_$().getBoundingClientRect();
      ret[$uts] = Date.now() as ts_t;
      // console.log( ">>>>>>>>>>>" );
      // console.log( `x=${ret.x}, l=${ret.left}, y=${ret.y}, t=${ret.top}, r=${ret.right}, b=${ret.bottom}` );
      ret.x -= this.vpLeft; //! record relative value
      ret.y -= this.vpTop;
      // console.log( `x=${ret.x}, l=${ret.left}, y=${ret.y}, t=${ret.top}, r=${ret.right}, b=${ret.bottom}` );
    }
    /*#static*/ if (CYPRESS) {
      ctnr["cy.rec_utx_a"] = ctnr[$rec_utx_a];
    }
    return ret;
  }

  /**
   * Modify `rv_x.anchrLoff`\
   * `in( rv_x.anchrLidx === rv_1_x.anchrLidx )`
   * @headconst @param rv_x
   * @headconst @param rv_1_x
   * @headconst @param eran_x
   * @const @param block_0_x
   * @headconst @param sameline_x
   * @const @param inline_0_x
   * @headconst @param inlineMidOf_x
   */
  #scan_sameline_back(
    rv_x: Ranval,
    rv_1_x: Ranval,
    eran_x: ERan,
    block_0_x: number,
    sameline_x: Sameline,
    inline_0_x: number,
    inlineMidOf_x: InlineOf,
  ) {
    const ab_ = rv_1_x.anchrLoff;
    let dtMin = Number.MAX_SAFE_INTEGER;
    for (let i = ab_; i >= 0; --i) {
      rv_1_x.anchrLoff = i;
      const rec = this.anchrRecOf_$(rv_1_x, eran_x);
      if (!sameline_x(rec, block_0_x)) break;

      /* For simplicity, comapre midpoint of the "fat" `rec` with `inline_0_x` */
      const dt_ = Math.abs(inlineMidOf_x(rec) - inline_0_x);
      if (dt_ < dtMin) {
        rv_x.anchrLoff = rv_1_x.anchrLoff;
        dtMin = dt_;
      }
    }
  }
  /**
   * Set `rv_x.anchrLidx`, `rv_x.anchrLoff`.\
   * ! `rv_x.focusLidx`, `rv_x.focusLoff` could change.\
   * @out @headconst @param rv_x
   * @headconst @param mc_x
   */
  private _prevRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    // // #if _TRACE
    //   console.log(`${global.indent}>>>>>>> ${this._type_id}._prevRow() >>>>>>>`);
    // // #endif
    const wm_ = this.coo._writingMode;
    const inline_0 = mc_x.vInline_$;
    const inlineMidOf = wm_ & WritingDir.h
      ? (rec_y: DOMRect) => (rec_y.left + rec_y.right) / 2
      : (rec_y: DOMRect) => (rec_y.top + rec_y.bottom) / 2;
    const blockOf = /* final switch */ {
      [WritingMode.htb]: (rec_y: DOMRect) => rec_y.top,
      [WritingMode.vrl]: (rec_y: DOMRect) => rec_y.right,
      [WritingMode.vlr]: (rec_y: DOMRect) => rec_y.left,
    }[wm_];
    const sameline = /* final switch */ {
      [WritingMode.htb]: sameline_top,
      [WritingMode.vrl]: sameline_rigt,
      [WritingMode.vlr]: sameline_left,
    }[wm_];

    /* `anchrRecOf_$()` could modify its `eran_x`, so not to use `mc_x.eran`
    directly, because if return `EdtrFuncRet.nope`, `mc_x.eran` will have no
    chance to be corrected back. */
    using eran_0 = g_eran_fac.oneMore().become(mc_x.eran!);
    const rec_0 = this.anchrRecOf_$(rv_x, eran_0);

    using rv_1 = g_ranval_fac.oneMore().reset(rv_x.anchrLidx, 0);
    using eran_1 = g_eran_fac.oneMore().become(mc_x.eran!);
    let rec_1 = this.anchrRecOf_$(rv_1, eran_1);
    if (sameline(rec_1, blockOf(rec_0))) {
      if (rv_x.anchrLidx === 0) {
        // console.log("run here 1");
        // // #if _TRACE
        //   global.outdent;
        // // #endif
        return EdtrFuncRet.nope;
      }

      rv_x.anchrLidx--;
      this.bufr$.getAnchrLoc(rv_x); // to correct `rv_x.anchrLidx`, `rv_x.anchrLoff`
      rv_1.anchrLidx = rv_x.anchrLidx;
      rv_1.anchrLoff = Number.MAX_SAFE_INTEGER;
      rec_1 = this.anchrRecOf_$(rv_1, eran_1);
      this.#scan_sameline_back(
        rv_x,
        rv_1,
        eran_1,
        blockOf(rec_1),
        sameline,
        inline_0,
        inlineMidOf,
      );
    } else {
      // console.log("run here 4");
      while (rv_x.anchrLoff > 0) {
        rv_1.anchrLoff = --rv_x.anchrLoff;
        rec_1 = this.anchrRecOf_$(rv_1, eran_1);
        if (!sameline(rec_1, blockOf(rec_0))) break;
      }
      this.#scan_sameline_back(
        rv_x,
        rv_1,
        eran_1,
        blockOf(rec_1),
        sameline,
        inline_0,
        inlineMidOf,
      );
    }
    // // #if _TRACE
    //   global.outdent;
    // // #endif
    return EdtrFuncRet.caret;
  }
  // /**
  //  * Set `rv_x.anchrLidx`, `rv_x.anchrLoff`.\
  //  * `rv_x.focusLidx`, `rv_x.focusLoff` won't change.\
  //  * `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )`\
  //  * ! `rv_x` and `mc_x.eran` must match.
  //  *
  //  * @out @headconst @param rv_x
  //  * @headconst @param mc_x
  //  */
  // private _anchrPrevRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
  //   using rv_ = g_ranval_fac.oneMore().become(rv_x);
  //   const ret = this._prevRow(rv_, mc_x);
  //   rv_x.anchrLidx = rv_.anchrLidx;
  //   rv_x.anchrLoff = rv_.anchrLoff;
  //   return ret;
  // }
  /**
   * Set `rv_x.focusLidx`, `rv_x.focusLoff`.\
   * `rv_x.anchrLidx`, `rv_x.anchrLoff` won't change.\
   * `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )`\
   * ! `rv_x` and `mc_x.eran` must match.
   *
   * @out @headconst @param rv_x
   * @headconst @param mc_x
   */
  private _focusPrevRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    using rv_ = g_ranval_fac.oneMore().reset(rv_x.focusLidx, rv_x.focusLoff);
    const ret = this._prevRow(rv_, mc_x);
    rv_x.focusLidx = rv_.anchrLidx;
    rv_x.focusLoff = rv_.anchrLoff;
    return ret;
  }

  /**
   * Modify `rv_x.anchrLoff`\
   * `in( rv_x.anchrLidx === rv_1_x.anchrLidx )`
   * @headconst @param rv_x
   * @headconst @param rv_1_x
   * @headconst @param eran_x
   * @const @param block_0_x
   * @headconst @param sameline_x
   * @const @param inline_0_x
   * @headconst @param inlineMidOf_x
   */
  #scan_sameline_forw(
    rv_x: Ranval,
    rv_1_x: Ranval,
    eran_x: ERan,
    block_0_x: number,
    sameline_x: Sameline,
    inline_0_x: number,
    inlineMidOf_x: InlineOf,
  ) {
    const ab_ = rv_1_x.anchrLoff;
    let dtMin = Number.MAX_SAFE_INTEGER;
    const to_ = this.bufr$.line(rv_x.anchrLidx).uchrLen;
    for (let i = ab_; i <= to_; ++i) {
      rv_1_x.anchrLoff = i;
      const rec = this.anchrRecOf_$(rv_1_x, eran_x);
      if (!sameline_x(rec, block_0_x)) break;

      /* For simplicity, comapre midpoint of the "fat" `rec` with `inline_0_x` */
      const dt_ = Math.abs(inlineMidOf_x(rec) - inline_0_x);
      if (dt_ < dtMin) {
        rv_x.anchrLoff = rv_1_x.anchrLoff;
        dtMin = dt_;
      }
    }
  }
  /** @see {@linkcode _prevRow()} */
  private _nextRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    // // #if _TRACE
    //   console.log(`${global.indent}>>>>>>> ${this._type_id}._nextRow() >>>>>>>`);
    // // #endif
    const wm_ = this.coo._writingMode;
    const inline_0 = mc_x.vInline_$;
    const inlineMidOf = wm_ & WritingDir.h
      ? (rec_y: DOMRect) => (rec_y.left + rec_y.right) / 2
      : (rec_y: DOMRect) => (rec_y.top + rec_y.bottom) / 2;
    const blockOf = /* final switch */ {
      [WritingMode.htb]: (rec_y: DOMRect) => rec_y.bottom,
      [WritingMode.vrl]: (rec_y: DOMRect) => rec_y.left,
      [WritingMode.vlr]: (rec_y: DOMRect) => rec_y.right,
    }[wm_];
    const sameline = /* final switch */ {
      [WritingMode.htb]: sameline_bot,
      [WritingMode.vrl]: sameline_left,
      [WritingMode.vlr]: sameline_rigt,
    }[wm_];

    /* `anchrRecOf_$()` could modify its `eran_x`, so not to use `mc_x.eran`
    directly, because if return `EdtrFuncRet.nope`, `mc_x.eran` will have no
    chance to be corrected back. */
    using eran_0 = g_eran_fac.oneMore().become(mc_x.eran!);
    const rec_0 = this.anchrRecOf_$(rv_x, eran_0);

    using rv_1 = g_ranval_fac.oneMore().reset(
      rv_x.anchrLidx,
      Number.MAX_SAFE_INTEGER,
    );
    using eran_1 = g_eran_fac.oneMore().become(mc_x.eran!);
    let rec_1 = this.anchrRecOf_$(rv_1, eran_1);
    if (sameline(rec_1, blockOf(rec_0))) {
      if (rv_x.anchrLidx >= this.bufr$.lineN - 1) {
        // console.log("run here 1");
        // // #if _TRACE
        //   global.outdent;
        // // #endif
        return EdtrFuncRet.nope;
      }

      rv_x.anchrLidx++;
      this.bufr$.getAnchrLoc(rv_x); // to correct `rv_x.anchrLidx`, `rv_x.anchrLoff`
      rv_1.anchrLidx = rv_x.anchrLidx;
      rv_1.anchrLoff = 0;
      rec_1 = this.anchrRecOf_$(rv_1, eran_1);
      this.#scan_sameline_forw(
        rv_x,
        rv_1,
        eran_1,
        blockOf(rec_1),
        sameline,
        inline_0,
        inlineMidOf,
      );
    } else {
      // console.log("run here 4");
      const uchrLen = rv_1.anchrLoff;
      while (rv_x.anchrLoff < uchrLen) {
        rv_1.anchrLoff = ++rv_x.anchrLoff;
        rec_1 = this.anchrRecOf_$(rv_1, eran_1);
        if (!sameline(rec_1, blockOf(rec_0))) break;
      }
      this.#scan_sameline_forw(
        rv_x,
        rv_1,
        eran_1,
        blockOf(rec_1),
        sameline,
        inline_0,
        inlineMidOf,
      );
    }
    // // #if _TRACE
    //   global.outdent;
    // // #endif
    return EdtrFuncRet.caret;
  }
  // /** @see {@linkcode _anchrPrevRow()} */
  // private _anchrNextRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
  //   using rv_ = g_ranval_fac.oneMore().become(rv_x);
  //   const ret = this._nextRow(rv_, mc_x);
  //   rv_x.anchrLidx = rv_.anchrLidx;
  //   rv_x.anchrLoff = rv_.anchrLoff;
  //   return ret;
  // }
  /** @see {@linkcode _focusPrevRow()} */
  private _focusNextRow(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    using rv_ = g_ranval_fac.oneMore().reset(rv_x.focusLidx, rv_x.focusLoff);
    const ret = this._nextRow(rv_, mc_x);
    rv_x.focusLidx = rv_.anchrLidx;
    rv_x.focusLoff = rv_.anchrLoff;
    return ret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretUp(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusPrevRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (mc_x.eran!.collapsed) {
        ret = focusBLoc.visulLeftenIn(this.eline_m)
          ? EdtrFuncRet.caret
          : EdtrFuncRet.nope;
        if (ret === EdtrFuncRet.caret) {
          rv_.focusLidx = focusBLoc.line.lidx_1;
          rv_.focusLoff = focusBLoc.loff;
          rv_.collapseToFocus();
        }
      } else {
        ret = EdtrFuncRet.caret;
        const anchrBLoc = this.bufr$.getAnchrLoc(rv_);
        const focusRec = mc_x.eran!.focusCtnr[$rec_utx_a][mc_x.eran!.focusOffs];
        const anchrRec = mc_x.eran!.anchrCtnr[$rec_utx_a][mc_x.eran!.anchrOffs];
        if (Number.apxS(anchrRec.top, focusRec.top)) {
          rv_.focusLidx = anchrBLoc.line.lidx_1;
          rv_.focusLoff = anchrBLoc.loff;
        }
        rv_.collapseToFocus();
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
      //             , this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretDown(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusNextRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      if (mc_x.eran!.collapsed) {
        ret = focusBLoc.visulRigtenIn(this.eline_m)
          ? EdtrFuncRet.caret
          : EdtrFuncRet.nope;
        if (ret === EdtrFuncRet.caret) {
          rv_.focusLidx = focusBLoc.line.lidx_1;
          rv_.focusLoff = focusBLoc.loff;
          rv_.collapseToFocus();
        }
      } else {
        ret = EdtrFuncRet.caret;
        const anchrBLoc = this.bufr$.getAnchrLoc(rv_);
        const focusRec = mc_x.eran!.focusCtnr[$rec_utx_a][mc_x.eran!.focusOffs];
        const anchrRec = mc_x.eran!.anchrCtnr[$rec_utx_a][mc_x.eran!.anchrOffs];
        if (Number.apxG(anchrRec.bottom, focusRec.bottom)) {
          rv_.focusLidx = anchrBLoc.line.lidx_1;
          rv_.focusLoff = anchrBLoc.loff;
        }
        rv_.collapseToFocus();
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval(), this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusLeft(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const bloc = this.bufr$.getFocusLoc(rv_);
      ret = bloc.visulLeftenIn(this.eline_m)
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLidx = bloc.line.lidx_1;
        rv_.focusLoff = bloc.loff;
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusNextRow(rv_, mc_x)
        : this._focusPrevRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
      //             , this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusRigt(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const bloc = this.bufr$.getFocusLoc(rv_);
      ret = bloc.visulRigtenIn(this.eline_m)
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLidx = bloc.line.lidx_1;
        rv_.focusLoff = bloc.loff;
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusPrevRow(rv_, mc_x)
        : this._focusNextRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
      //             , this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusUp(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusPrevRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const bloc = this.bufr$.getFocusLoc(rv_);
      ret = bloc.visulLeftenIn(this.eline_m)
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLidx = bloc.line.lidx_1;
        rv_.focusLoff = bloc.loff;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
      //             , this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusDown(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusNextRow(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const bloc = this.bufr$.getFocusLoc(rv_);
      ret = bloc.visulRigtenIn(this.eline_m)
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLidx = bloc.line.lidx_1;
        rv_.focusLoff = bloc.loff;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      // // #if DEV && !TESTING
      //   reportMove( Van.getRan(this.bufr$,rv_).toRanval(), this.type );
      // // #endif
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }

  /**
   * Set `rv_x.focusLidx`, `rv_x.focusLoff`.\
   * `rv_x.anchrLidx`, `rv_x.anchrLoff` won't change.\
   * `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )`\
   * ! `rv_x` and `mc_x.eran` must match.
   *
   * @out @headconst @param rv_x
   * @headconst @param mc_x
   */
  private _focusPrevRowMost(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.nope;

    if (rv_x.focusLidx > 1) {
      rv_x.focusLidx = 1 as lnum_t; // Setting to `0` can have no chance to align vleft.
      this.getERanBy_$(rv_x, mc_x.eran);
      ret = EdtrFuncRet.caret;
    }
    const VALVE = 1_000;
    let valve = VALVE;
    while (this._focusPrevRow(rv_x, mc_x) === EdtrFuncRet.caret && --valve) {
      ret = EdtrFuncRet.caret;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret;
  }
  /** @see {@linkcode _focusPrevRowMost()} */
  private _focusNextRowMost(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.nope;

    if (rv_x.focusLidx < this.bufr$.lineN - 2) {
      rv_x.focusLidx = (this.bufr$.lineN - 2) as lnum_t; // ditto
      this.getERanBy_$(rv_x, mc_x.eran);
      ret = EdtrFuncRet.caret;
    }
    const VALVE = 1_000;
    let valve = VALVE;
    while (this._focusNextRow(rv_x, mc_x) === EdtrFuncRet.caret && --valve) {
      ret = EdtrFuncRet.caret;
    }
    assert(valve, `Loop ${VALVE}±1 times`);

    return ret;
  }

  /**
   * "Lor": Left of row
   * Set `rv_x.focusLoff`, `rv_x.anchrLoff`.\
   * `rv_x.focusLidx`, `rv_x.anchrLidx` won't change.\
   * `in( mc_x.eran && mc_x.active && mc_x.st === CaretState.blinking )`\
   * ! `rv_x` and `mc_x.eran` must match.
   *
   * @out @headconst @param rv_x
   * @headconst @param mc_x
   */
  private _moveCaretLor(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;

    const focusBLoc = this.bufr$.getFocusLoc(rv_x);
    if (mc_x.eran!.collapsed) {
      ret = focusBLoc.visulFarleftenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_x.focusLoff = focusBLoc.loff;
        rv_x.collapseToFocus();
      }
    } else {
      ret = EdtrFuncRet.caret;
      focusBLoc.visulFarleftenIn(this.eline_m, "row");
      rv_x.focusLoff = focusBLoc.loff;
      rv_x.collapseToFocus();
    }

    return ret;
  }
  /** @see {@linkcode _moveCaretLor()} */
  private _moveCaretRor(rv_x: Ranval, mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;

    const focusBLoc = this.bufr$.getFocusLoc(rv_x);
    if (mc_x.eran!.collapsed) {
      ret = focusBLoc.visulFarrigtenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_x.focusLoff = focusBLoc.loff;
        rv_x.collapseToFocus();
      }
    } else {
      focusBLoc.visulFarrigtenIn(this.eline_m, "row");
      ret = EdtrFuncRet.caret;
      rv_x.focusLoff = focusBLoc.loff;
      rv_x.collapseToFocus();
    }

    return ret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretLeftMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._moveCaretLor(rv_, mc_x);
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusNextRowMost(rv_, mc_x)
        : this._focusPrevRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretRigtMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._moveCaretRor(rv_, mc_x);
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusPrevRowMost(rv_, mc_x)
        : this._focusNextRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretUpMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusPrevRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      ret = this._moveCaretLor(rv_, mc_x);
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretDownMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusNextRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        rv_.collapseToFocus();
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      ret = this._moveCaretRor(rv_, mc_x);
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusLeftMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      ret = focusBLoc.visulFarleftenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLoff = focusBLoc.loff;
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusNextRowMost(rv_, mc_x)
        : this._focusPrevRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusRigtMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      ret = focusBLoc.visulFarrigtenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLoff = focusBLoc.loff;
      }
    } else {
      ret = this.coo._writingMode === WritingMode.vrl
        ? this._focusPrevRowMost(rv_, mc_x)
        : this._focusNextRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusUpMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusPrevRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      ret = focusBLoc.visulFarleftenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLoff = focusBLoc.loff;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return ret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusDownMost(mc_x: Caret): EdtrFuncRet {
    let ret = EdtrFuncRet.unknown;
    const rv_ = this.getRanvalBy$(mc_x.eran!);

    if (this.coo._writingMode & WritingDir.h) {
      ret = this._focusNextRowMost(rv_, mc_x);
      if (ret === EdtrFuncRet.caret) {
        mc_x.keepVLInlineOnce_$ = true;
      }
    } else {
      const focusBLoc = this.bufr$.getFocusLoc(rv_);
      ret = focusBLoc.visulFarrigtenIn(this.eline_m, "row")
        ? EdtrFuncRet.caret
        : EdtrFuncRet.nope;
      if (ret === EdtrFuncRet.caret) {
        rv_.focusLoff = focusBLoc.loff;
      }
    }

    if (ret === EdtrFuncRet.caret) {
      mc_x.caretrvm![1].val = rv_;
    }
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretSol(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLoff = 0;
    rv_.collapseToFocus();

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretEol(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLoff = Number.MAX_SAFE_INTEGER;
    rv_.collapseToFocus();

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusSol(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLoff = 0;

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusEol(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLoff = Number.MAX_SAFE_INTEGER;

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretSob(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLidx = 0 as lnum_t;
    rv_.focusLoff = 0;
    rv_.collapseToFocus();

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveCaretEob(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLidx = MAX_lnum as lnum_t;
    rv_.focusLoff = Number.MAX_SAFE_INTEGER;
    rv_.collapseToFocus();

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusSob(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLidx = 0 as lnum_t;
    rv_.focusLoff = 0;

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected moveFocusEob(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.focusLidx = MAX_lnum as lnum_t;
    rv_.focusLoff = Number.MAX_SAFE_INTEGER;

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected selectAll(mc_x: Caret): EdtrFuncRet {
    const rv_ = this.getRanvalBy$(mc_x.eran!);
    rv_.anchrLidx = 0 as lnum_t;
    rv_.anchrLoff = 0;
    rv_.focusLidx = MAX_lnum as lnum_t;
    rv_.focusLoff = Number.MAX_SAFE_INTEGER;

    mc_x.caretrvm![1].val = rv_;
    return EdtrFuncRet.caret;
  }

  /** @see {@linkcode moveCaretLeft()} */
  protected undo(mc_x: Caret): EdtrFuncRet {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.undo() >>>>>>>`);
    }
    if (this.#composingRepl) { //!
      /* Simulate `_onCompositionEnd()`. */
      this.bufr$.doqOnly(this.#composingRepl);
      this.#composingRepl = undefined;
    }

    const got = this.bufr$.undo();
    if (got) {
      this.#syncAllCaret(true);

      // this.restoreSel$();
    }
    /*#static*/ if (_TRACE) global.outdent;
    return got ? EdtrFuncRet.caret : EdtrFuncRet.nope;
  }
  /** @see {@linkcode moveCaretLeft()} */
  protected redo(mc_x: Caret) {
    /*#static*/ if (_TRACE) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.redo() >>>>>>>`);
    }
    if (this.#composingRepl) { //!
      /* Simulate `_onCompositionEnd()`. */
      this.bufr$.doqOnly(this.#composingRepl);
      this.#composingRepl = undefined;
    }

    const got = this.bufr$.redo();
    if (got) {
      this.#syncAllCaret(true);

      // this.restoreSel$();
    }
    /*#static*/ if (_TRACE) global.outdent;
    return got ? EdtrFuncRet.caret : EdtrFuncRet.nope;
  }

  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlc$(mc_x: Caret) {
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     console.log(`${global.indent}>>>>>>> ${this._type_id}.kCtrlc$() >>>>>>>`);
  //   }
  //   const ranval = mc_x.caretrvm![1].val;
  //   if (ranval.collapsed) {
  //     return /*#static*/ _TRACE && EDITOR
  //       ? (global.outdent, EdtrFuncRet.nope)
  //       : EdtrFuncRet.nope;
  //   }

  //   // const ranval = this.getRanvalBy$( eran_x );
  //   const txt = TokRan.create(this.bufr$, ranval).getText();
  //   // console.log(`${global.dent}txt="${txt}"`);
  //   navigator.clipboard.writeText(txt);
  //   return /*#static*/ _TRACE && EDITOR
  //     ? (global.outdent, EdtrFuncRet.func)
  //     : EdtrFuncRet.func;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlR$(mc_x: Caret) {
  //   const reversed = mc_x.eran!.reverse_$();
  //   if (reversed) {
  //     const rv_ = this.getRanvalBy$(mc_x.eran!);
  //     // // #if DEV && !TESTING
  //     //   reportMove( Van.getRan(this.bufr$,rv_).toRanval()
  //     //             , this.type );
  //     // // #endif
  //     mc_x.caretrvm![1].val = rv_;
  //   }
  //   return reversed ? EdtrFuncRet.caret : EdtrFuncRet.nope;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrls$(mc_x: Caret) {
  //   return EdtrFuncRet.nope;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlv$(mc_x: Caret) {
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     console.log(`${global.indent}>>>>>>> ${this._type_id}.kCtrlv$() >>>>>>>`);
  //   }
  //   navigator.clipboard.readText().then((txt) => {
  //     if (txt) {
  //       this.insertUChr$(txt);
  //     }
  //   });
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     global.outdent;
  //   }
  //   return EdtrFuncRet.func;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlx$(mc_x: Caret) {
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     console.log(`${global.indent}>>>>>>> ${this._type_id}.kCtrlx$() >>>>>>>`);
  //   }
  //   const ranval = mc_x.caretrvm![1].val;
  //   if (ranval.collapsed) {
  //     return /*#static*/ _TRACE && EDITOR
  //       ? (global.outdent, EdtrFuncRet.nope)
  //       : EdtrFuncRet.nope;
  //   }

  //   // const ranval = this.getRanvalBy$( eran_x );
  //   const txt = TokRan.create(this.bufr$, ranval).getText();
  //   // console.log(`${global.dent}txt="${txt}"`);
  //   navigator.clipboard.writeText(txt).then(() => {
  //     this.deleteUChr$();
  //   });
  //   return /*#static*/ _TRACE && EDITOR
  //     ? (global.outdent, EdtrFuncRet.func)
  //     : EdtrFuncRet.func;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlBacktick$(mc_x: Caret) {
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     console.log(
  //       `${global.indent}>>>>>>> ${this._type_id}.kCtrlBacktick$() >>>>>>>`,
  //     );
  //   }
  //   this.unvu$();
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     global.outdent;
  //   }
  //   return EdtrFuncRet.func;
  // }
  // /** @see {@linkcode moveCaretLeft()} */
  // protected kCtrlSlide$(mc_x: Caret) {
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     console.log(
  //       `${global.indent}>>>>>>> ${this._type_id}.kCtrlSlide$() >>>>>>>`,
  //     );
  //   }
  //   this.revu$();
  //   /*#static*/ if (_TRACE && EDITOR) {
  //     global.outdent;
  //   }
  //   return EdtrFuncRet.func;
  // }

  /**
   * `in( this.proactiveCaret.eran && this.proactiveCaret.active && this.proactiveCaret.st === CaretState.blinking )`
   * @final
   * @const @param uchr_x
   */
  protected insertUChr$(uchr_x: UChr) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.insertUChr$( "${uchr_x}" ) >>>>>>>`,
      );
    }
    const rv_ = this.getRanvalBy$(this.proactiveCaret.eran!);
    this.bufr$.Do(rv_, uchr_x);
    this.#syncAllCaret();

    // this.restoreSel$();
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  // search(key_x: string) {
  //   const rv_a = this.tbufr$.search(key_x);
  //   //kkkk
  // }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  // // static readonly #cache_a = new SortedArray<{id:id_t}>( (a,b)=>a.id<b.id );
  // static #focus_?:{};
  // static #focus< T extends tok_t=tok_t >( edtr_x:{
  //   proactiveCaret:Caret;
  // }) {
  //   if( EdtrScrolr.#focus_ === edtr_x ) return;

  //   (<{proactiveCaret:Caret}>EdtrScrolr.#focus_)?.proactiveCaret.stare();
  //   EdtrScrolr.#focus_ = edtr_x;
  // }

  // static blur_$< T extends tok_t=tok_t >( edtr_x:{ proactiveCaret:Caret })
  // {
  //   if( EdtrScrolr.#focus_ !== edtr_x ) return;

  //   (<{proactiveCaret:Caret}>edtr_x).proactiveCaret.stare();
  //   EdtrScrolr.#focus_ = undefined;
  // }
}

/**
 * @headconst @param eran_x
 * @headconst @param caretrvm_x
 */
type KFuncName =
  // | "kEnter$"
  // | "kTab$"
  // | "kBackspace$"
  // | "kDelete$"
  // | "kArrowLeft$"
  // | "kArrowRight$"
  // | "kArrowUp$"
  // | "kArrowDown$"
  // | "kHome$"
  // | "kEnd$"
  // | "kShiftArrowLeft$"
  // | "kShiftArrowRight$"
  // | "kShiftArrowUp$"
  // | "kShiftArrowDown$"
  // | "kShiftHome$"
  // | "kShiftEnd$"
  // | "kCtrlHome$"
  // | "kCtrlEnd$"
  // | "kCtrlShiftHome$"
  // | "kCtrlShiftEnd$"
  | "kCtrlc$"
  | "kCtrlR$"
  | "kCtrls$"
  | "kCtrlv$"
  | "kCtrlx$"
  // | "kCtrlZ$"
  // | "kCtrlz$"
  | "kCtrlBacktick$"
  | "kCtrlSlide$";

export const enum EdtrFuncRet {
  unknown,
  nope,
  /** Caret is possibly moved. */
  caret,
  /** Other function run. Nothing to do with caret. */
  func,
}
/*80--------------------------------------------------------------------------*/
