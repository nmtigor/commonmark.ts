/** 80**************************************************************************
 * @module lib/editor/EdtrBase
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { _TRACE, DEV, global, INOUT, RESIZ } from "../../global.ts";
import { LastCb_i, Moo } from "../Moo.ts";
import { Scrolr, Scronr } from "../Scronr.ts";
import type { CSSStyle, id_t, lnum_t, ts_t, uint } from "../alias.ts";
import { BufrDir, WritingMode } from "../alias.ts";
import type { Bufr } from "../compiling/Bufr.ts";
import type { Line } from "../compiling/Line.ts";
import { Ranval, RanvalMo } from "../compiling/Ranval.ts";
import { type CooInterface, HTMLVCo } from "../cv.ts";
import { div } from "../dom.ts";
import { $cssstylesheet, $loff, $tail_ignored } from "../symbols.ts";
import { Factory } from "../util/Factory.ts";
import { SortedArray } from "../util/SortedArray.ts";
import { assert } from "../util/trace.ts";
import { Caret, type CaretRvM } from "./Caret.ts";
import { ELine } from "./ELine.ts";
import type { ELineBase } from "./ELineBase.ts";
import { ERan } from "./ERan.ts";
import { EdtrMain_z, type EdtrType } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

export interface EdtrBaseCI extends CooInterface {
  get writingMode_mo(): Moo<WritingMode>;
  get writingMode(): WritingMode;
  get scrolr(): EdtrBaseScrolr;

  /**
   * `in( this.el$.isConnected )`
   * @final
   */
  refresh(): void;

  // onRanvalChange(
  //   handler_x: MooHandler<Ranval>,
  //   immediate_x?: "immediate",
  // ): void;
  // offRanvalChange(handler_x: MooHandler<Ranval>): void;

  // onCanUnvuChange(
  //   handler_x: MooHandler<boolean>,
  //   immediate_x?: "immediate",
  // ): void;
  // onCanRevuChange(
  //   handler_x: MooHandler<boolean>,
  //   immediate_x?: "immediate",
  // ): void;
  // offCanUnvuChange(handler_x: MooHandler<boolean>): void;
  // offCanRevuChange(handler_x: MooHandler<boolean>): void;

  // align(align_x: EdtrDir): void;
  // onAlignChange(
  //   handler_x: MooHandler<EdtrDir>,
  //   immediate_x?: "immediate",
  // ): void;
  // offAlignChange(handler_x: MooHandler<EdtrDir>): void;
}

export abstract class EdtrBase<CI extends EdtrBaseCI = EdtrBaseCI>
  extends HTMLVCo<CI, HTMLDivElement> {
  static #ID = 0 as id_t;
  override readonly id = ++EdtrBase.#ID as id_t;

  #scronr!: EdtrScronr<CI>;
  /** @final */
  get scronr() {
    return this.#scronr;
  }

  protected scrolr$!: EdtrBaseScrolr<CI>;
  /** @final */
  get _scrolr() {
    return this.scrolr$;
  }

  /**
   * `in( this.#scronr )`
   * @final
   */
  get _writingMode_mo() {
    return this.#scronr.writingMode_mo;
  }
  /** @final */
  get _writingMode() {
    return this.#scronr?.writingMode ?? this.#writingMode;
  }

  /** */
  constructor() {
    super(div());
    /* `#scronr.coo` should exist before `init()`. See e.g. uses of `init()` in
    "PRItemVCo.ts" */
    this.#scronr = new EdtrScronr(this);

    /*#static*/ if (DEV) {
      this.el$.id = this._type_id;
    }

    Object.assign(this.ci, {
      refresh: () => this._refresh(),
    } as EdtrBaseCI);
    Reflect.defineProperty(this.ci, "writingMode_mo", {
      get: () => this._writingMode_mo,
    });
    Reflect.defineProperty(this.ci, "writingMode", {
      get: () => this._writingMode,
    });
    Reflect.defineProperty(this.ci, "scrolr", {
      get: () => this._scrolr,
    });
  }

  #inited = false;
  /**
   * @final
   * @headconst @param scrolr_x
   */
  init(scrolr_x: EdtrBaseScrolr<CI>): void {
    /*#static*/ if (INOUT) {
      assert(!this.#inited);
    }
    this.scrolr$ = scrolr_x;
    this.#scronr.init(scrolr_x);

    this.el$.append(
      this.#scronr.el,
    );

    this._writingMode_mo.set(this.#writingMode)
      .registHandler((n_y) => {
        this.scrolr$
          .invalidate_bcr()
          .refreshCarets();
      }, { i: LastCb_i });
    this.#scronr.syncLayout();

    new ResizeObserver(this.#scronr.refresh).observe(this.scrolr$.main_el);

    /*#static*/ if (DEV) this.#scronr.observeTheme(); //!

    this.#inited = true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** Used before `#inited` */
  #writingMode = WritingMode.htb;
  /**
   * Init setting. Normally called within constructors. So no callbacks will be
   * invoked.
   * @final
   */
  protected style$(styl_x?: CSSStyle) {
    const wm_css = styl_x?.writingMode;
    this.#writingMode = wm_css === "vertical-rl"
      ? WritingMode.vrl
      : wm_css === "vertical-lr"
      ? WritingMode.vlr
      : WritingMode.htb;
    if (this.#inited) {
      this.#scronr.writingMode_mo.set(this.#writingMode);
      this.#scronr.syncLayout();
    }

    if (styl_x) {
      styl_x.writingMode = "unset";
      this.assignStylo(styl_x);
    }
  }

  /**
   * `in( this.el$.isConnected )`
   * @final
   */
  _refresh() {
    this.#scronr.refresh();
  }
}
/*64----------------------------------------------------------*/

/** @final */
export class EdtrScronr<CI extends EdtrBaseCI> extends Scronr<EdtrBase<CI>> {
  /** @headconst @param coo_x */
  constructor(coo_x: EdtrBase<CI>) {
    super(coo_x);

    this.assignStylo({
      blockSize: "100%",
      inlineSize: "100%",
    });
  }

  #inited = false;
  /**
   * @final
   * @headconst @param scrolr_x
   */
  init(scrolr_x: EdtrBaseScrolr<CI>): void {
    /*#static*/ if (INOUT) {
      assert(!this.#inited);
    }
    this.initScrolr(scrolr_x);

    this.el$.append(
      scrolr_x.el,
    );

    this.#inited = true;
  }
}
/*49-------------------------------------------*/

/**
 * A non-generic base s.t. many related uses (e.g. Caret) can be non-generic.
 */
export abstract class EdtrBaseScrolr<CI extends EdtrBaseCI = EdtrBaseCI>
  extends Scrolr<EdtrBase<CI>> {
  static #ID = 0 as id_t;
  override readonly id = ++EdtrBaseScrolr.#ID as id_t;

  readonly type: EdtrType;

  readonly main_el = div();

  /* eline_m */
  readonly eline_m = new Map<Line, ELineBase>();
  /* ~ */

  /* bufr */
  protected bufr$!: Bufr;
  /** @final */
  get bufr() {
    return this.bufr$;
  }
  /* ~ */

  override get bufrDir(): BufrDir {
    return this.bufr$.dir;
  }

  /* vpLeft, vpTop */
  #bcr: DOMRect | undefined;
  invalidate_bcr(): this {
    this.#bcr = undefined;
    return this;
  }
  /** @final */
  protected get bcr$() {
    if (!this.#bcr) {
      this.#bcr = this.el$.getBoundingClientRect();

      this.bufr$.updateLastViewTs(); //!
    }
    return this.#bcr;
  }
  /** @final @implement */
  get vpLeft() {
    return this.bcr$.left + this.el$.clientLeft - this.el$.scrollLeft;
  }
  /** @final @implement */
  get vpTop() {
    return this.bcr$.top + this.el$.clientTop - this.el$.scrollTop;
  }
  // get innerVHeight() { return this.el$.clientHeight + this.el$.scrollTop; }
  /* ~ */

  /* caret_a$ */
  protected caret_a$: Caret[];
  get proactiveCaret() {
    // const ret = this.caret_a$[0];
    // if( !ret.inuse ) ret.reset_$( this );
    // return ret;
    return this.caret_a$[0];
  }
  protected sel$: Selection | null = null;
  protected range_fac$ = new RangeFactory();
  /* ~ */

  /* #vuq */
  // readonly #vuq = new Unre<Vchange>(
  //   /*#static*/ APP ? 500 : /*#static*/ DEV ? 100 : 30,
  // );
  // lastScrollpos_$: ScrollPos;

  // readonly #canUnvu_mo = new Moo({ val: false });
  // readonly #canRevu_mo = new Moo({ val: false });

  // #updateUnrevu() {
  //   this.#canUnvu_mo.val = this.#vuq.canGetUn();
  //   this.#canRevu_mo.val = this.#vuq.canGetRe();
  // }
  /* ~ */

  // protected readonly dir_mo$ = new Moo<"ltr" | "rtl">({ val: "ltr" });
  // get dir_$() {
  //   return this.dir_mo$.val;
  // }
  // _dir(_x: "ltr" | "rtl") {
  //   this.dir_mo$.val = _x;
  // }

  /* #activeEdtr_mo, active_mo */
  static readonly #activeEdtr_mo = new Moo<EdtrBaseScrolr | null>({
    val: null,
  });
  static inactivate() {
    this.#activeEdtr_mo.val = null;
  }
  set active(_x: boolean) {
    if (_x) {
      EdtrBaseScrolr.#activeEdtr_mo.val = this;
    } else {
      if (EdtrBaseScrolr.#activeEdtr_mo.val === this) {
        EdtrBaseScrolr.#activeEdtr_mo.val = null;
      }
    }
  }

  readonly active_mo = new Moo({ val: false });
  get active() {
    return this.active_mo.val;
  }
  /* ~ */

  /* edting_mo */
  readonly edting_mo = new Moo({ val: true });
  get edting() {
    return this.edting_mo.val;
  }
  /* ~ */

  protected readonly resizob$;

  /**
   * @headconst @param host_x
   * @const @param type_x
   */
  constructor(host_x: EdtrScronr<CI>, type_x: EdtrType) {
    super(host_x);
    this.type = type_x;
    this.caret_a$ = [Caret.create(host_x.coo)];

    this.el$.id = this._type_id;
    // this.el$.id = "editor-selection";
    this.assignAttro({
      contenteditable: "true",
      spellcheck: "false",
      // autocapitalize: "off",

      autocomplete: "off",
      autocorrect: "off",
    });
    this.assignStylo({
      position: "relative",
      // zIndex: 0,
      isolation: "isolate", //!
      // writingMode: "vertical-rl",

      // border: "2px solid",
      // backgroundColor: "#fff",
      outlineStyle: "none",

      whiteSpace: "break-spaces",
      // wordBreak: "break-all",
      // overflowWrap: "anywhere",
      lineBreak: "anywhere",
      // fontFamily: fontFamily_x,
      // fontSize: fontSize_x,

      caretColor: "transparent",
      userSelect: "none",
    });
    document[$cssstylesheet].insertRule(
      // `#${this.el$.id} ::selection { background-color: transparent; }`,
      `#${this.el$.id} ::selection { display: none; }`,
    );

    // Object.assign( this.main_el, {
    //   inputMode: "none",
    // });
    this.main_el.assignStylo({
      position: "relative",
      zIndex: EdtrMain_z,
      //
      // backgroundColor: "transparent",
      //
      // textAlign: "end",
    });

    this.el$.append(
      this.main_el,
    );
    this.proactiveCaret.attachTo(this);

    EdtrBaseScrolr.#activeEdtr_mo.registHandler((_y) => {
      this.active_mo.val = _y === this;
    });
    this.active_mo.registHandler((_y) => {
      this.proactiveCaret.focused = _y;
    });

    this.resizob$ = new ResizeObserver(this.#onResiz);
    this.resizob$.observe(this.el$);
    this.resizob$.observe(document.body); //!

    //   this.lastScrollpos_$ = [this.el$.scrollLeft, this.el$.scrollTop];

    //   this.ci.onRanvalChange = (h_y, immediate_y) => {
    //     this.proactiveCaret.caretrvm![1].registHandler(h_y);
    //     if (immediate_y) this.proactiveCaret.caretrvm![1].refresh();
    //   };
    //   this.ci.offRanvalChange = (h_y) =>
    //     this.proactiveCaret.caretrvm![1].removeHandler(h_y);

    //   this.ci.onCanUnvuChange = (handler_x, immediate_x) => {
    //     this.#canUnvu_mo.registHandler(handler_x);
    //     if (immediate_x) this.#canUnvu_mo.refresh();
    //   };
    //   this.ci.onCanRevuChange = (handler_x, immediate_x) => {
    //     this.#canRevu_mo.registHandler(handler_x);
    //     if (immediate_x) this.#canRevu_mo.refresh();
    //   };
    //   this.ci.offCanUnvuChange = (handler_x) =>
    //     this.#canUnvu_mo.removeHandler(handler_x);
    //   this.ci.offCanRevuChange = (handler_x) =>
    //     this.#canRevu_mo.removeHandler(handler_x);

    //   this.ci.align = (align_x) => this.dir_mo$.val = align_x;
    //   this.ci.onAlignChange = (handler_x, immediate_x) => {
    //     this.dir_mo$.registHandler(handler_x);
    //     if (immediate_x) this.dir_mo$.refresh();
    //   };
    //   this.ci.offAlignChange = (handler_x) =>
    //     this.dir_mo$.removeHandler(handler_x);

    this.on("pointerup", this.#onPointerUp);
  }

  //kkkk cache `ELineBase`?
  /**
   * `in( this.el$.isConnected )`
   * @final
   */
  reset(): this {
    this.main_el.removeAllChild();
    this.eline_m.clear();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @headconst @param ctnr_a_x can have `null`
   * @const @param offs_0_x
   * @param offs_1_x
   */
  protected getReca_impl$(
    ctnr_a_x: (Node | null)[],
    offs_0_x: number,
    offs_1_x: number,
  ) {
    /*#static*/ if (INOUT) {
      assert(ctnr_a_x.length);
    }
    const ret: DOMRect[] = [];

    const n_ = this.range_fac$.produce(ctnr_a_x.length);

    let ctnr = ctnr_a_x[0];
    let len: uint;
    let r_1;
    if (ctnr) {
      len = n_ === 1
        ? offs_1_x
        : ctnr.isText
        ? (ctnr as Text)[$tail_ignored]
          ? ctnr.textContent!.length - 1
          : ctnr.textContent!.length
        : ctnr.childNodes.length;
      if (len) {
        r_1 = this.range_fac$.val_a[0];
        r_1.setStart(ctnr, offs_0_x);
        r_1.setEnd(ctnr, len);
        r_1.getSticka(ret, !ctnr.isText);
      }
    }

    for (let i = 1; i < n_ - 1; i++) {
      ctnr = ctnr_a_x[i];
      if (ctnr) {
        // const out_o = {};
        // const bline = ELine.getBLine( ctnr, out_o );
        // const offset = out_o.np === NodeInELine.indent ?
        //   ctnr.textContent.length :
        //   bline.uchrLen - out_o.vuu.indent;
        len = ctnr.isText
          ? (ctnr as Text)[$tail_ignored]
            ? ctnr.textContent!.length - 1
            : ctnr.textContent!.length
          : ctnr.childNodes.length;
        if (len) {
          r_1 = this.range_fac$.val_a[i];
          r_1.setStart(ctnr, 0);
          r_1.setEnd(ctnr, len);
          r_1.getSticka(ret, !ctnr.isText);
        }
      }
    }

    if (n_ > 1) {
      ctnr = ctnr_a_x.at(-1)!;
      if (ctnr) {
        len = offs_1_x;
        if (len) {
          r_1 = this.range_fac$.val_a[n_ - 1];
          r_1.setStart(ctnr, 0);
          r_1.setEnd(ctnr, len);
          r_1.getSticka(ret, !ctnr.isText);
        }
      }
    }

    return ret;
  }

  /**
   * `in( !range.collapsed )`
   * @final
   * @headconst @param range
   */
  getReca_$(range: Range): DOMRect[] {
    const ctnr_a: Node[] = [];

    const ctnr_0 = range.startContainer;
    const ctnr_1 = range.endContainer;
    /*#static*/ if (INOUT) {
      assert(ctnr_0.isText);
      assert(ctnr_1.isText);
    }
    const offs_0 = range.startOffset;
    const offs_1 = range.endOffset;

    const bln_0 = ELine.getBLine(ctnr_0);
    const bln_1 = ELine.getBLine(ctnr_1);
    const bloff_1 = (ctnr_1 as Text).loff(offs_1);

    let ctnr = ctnr_0;
    let bln = bln_0;
    let bloff = offs_0;
    let eln = this.eline_m.get(bln)!;

    ctnr_a.push(ctnr);
    bloff = (ctnr as Text).stopLoff;

    if (bln !== bln_1) {
      const VALVE = 10_000;
      let valve = VALVE;
      do {
        const bllen = bln.uchrLen;
        while (bloff < bllen) {
          ctnr = eln.caretNodeAt(bloff);
          /*#static*/ if (INOUT) {
            assert(ctnr.isText && bloff === (ctnr as Text)[$loff]);
          }
          ctnr_a.push(ctnr);
          bloff += (ctnr as Text).length;
        }

        bln = bln.nextLine!;
        bloff = 0;
        eln = this.eline_m.get(bln)!;
      } while (bln !== bln_1 && --valve);
      assert(valve, `Loop ${VALVE}±1 times`);
    }

    if (bln_0 !== bln) bloff = 0;
    while (bloff <= bloff_1) {
      ctnr = eln.caretNodeAt(bloff);
      /*#static*/ if (INOUT) {
        assert(ctnr.isText && bloff === (ctnr as Text)[$loff]);
      }
      ctnr_a.push(ctnr);
      bloff += (ctnr as Text).length;
    }

    // console.log(ctnr_a);
    return this.getReca_impl$(ctnr_a, offs_0, offs_1);
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @headconst @param rvm_x */
  #setShadowCaret(rvm_x: CaretRvM) {
    /*#static*/ if (INOUT) {
      assert(this !== rvm_x[0].edtr);
    }
    // if( !(this.#sig & rvm_x.sigmask) ) return; //jjjj

    // const colr = rvm_x.host.colr.dup().setAlpha( .35 );

    let c_;
    for (let i = 1; i < this.caret_a$.length; ++i) {
      if (!this.caret_a$[i].active) {
        c_ = this.caret_a$[i];
        break;
      }
    }
    if (c_) {
      c_.reset_$(rvm_x);
    } else {
      c_ = Caret.create(this.coo, rvm_x).attachTo(this);
      this.caret_a$.push(c_);
    }
  }

  /** @final */
  protected resetCarets$(edtr_sa_x: SortedArray<{ id: id_t }>) {
    this.caret_a$.forEach((caret_y) => caret_y.disable_$());
    const rvm: CaretRvM = [this.proactiveCaret, new RanvalMo()];
    this.proactiveCaret.reset_$(rvm);
    for (let i = 0; i < edtr_sa_x.length; ++i) {
      const edtr = edtr_sa_x[i] as EdtrBaseScrolr<CI>;
      if (edtr === this) continue;

      edtr.#setShadowCaret(rvm);
      this.#setShadowCaret(edtr.proactiveCaret.caretrvm!);
    }
  }

  /**
   * Can be useful after images loaded or errored asyc'ly
   * @final
   */
  refreshCarets() {
    /* In reverse order to make sure that the main caret is handled last */
    for (let i = this.caret_a$.length; i--;) {
      const caret = this.caret_a$[i];
      if (caret.active && caret.shown) {
        const k_ = caret.keepVLInlineOnce_$;
        caret.draw_$();
        caret.keepVLInlineOnce_$ = k_;
      }
    }
  }

  #onResiz = () => {
    if (!this.el$.isConnected) return;

    /*#static*/ if (_TRACE && RESIZ) {
      console.log(
        `%c${global.indent}>>>>>>> ${this._type_id}.#onResiz() >>>>>>>`,
        `color:${LOG_cssc.resiz}`,
      );
    }
    this.invalidate_bcr()
      .refreshCarets();
    /*#static*/ if (_TRACE && RESIZ) global.outdent;
    return;
  };
  _onResiz() {
    return this.#onResiz();
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param eran_x
  //jjjj TOCLEANUP
  //  * @out @param outF_o
  //  * @out @param outA_o
  //  * @return fill and return caret.ranval_$
   */
  protected getRanvalBy$(eran_x: ERan, ret_x?: Ranval): Ranval {
    ret_x ??= new Ranval(0 as lnum_t, 0);
    ret_x.focusLidx = ELine.getBLine(eran_x.focusCtnr).lidx_1;
    ret_x.focusLoff = eran_x.focusLoff;
    if (eran_x.collapsed) {
      ret_x.collapseToFocus();
    } else {
      ret_x.anchrLidx = ELine.getBLine(eran_x.anchrCtnr).lidx_1;
      ret_x.anchrLoff = eran_x.anchrLoff;
    }
    return ret_x;
  }

  /** @headconst @param rv_x will be corrected */
  abstract getEFocusBy_$(rv_x: Ranval, ret_x?: ERan): ERan;
  /** @headconst @param rv_x will be corrected */
  abstract getEAnchrBy_$(rv_x: Ranval, out_x: ERan): void;
  /**
   * @final
   * @headconst @param rv_x will be corrected
   */
  getERanBy_$(rv_x: Ranval, ret_x?: ERan) {
    // console.log(rv_x);
    ret_x = this.getEFocusBy_$(rv_x, ret_x);
    this.getEAnchrBy_$(rv_x, ret_x);
    return ret_x;
  }

  /**
   * Get `rec` of the "fat" rather than the "thin"
   * @headconst @param rv_x will be corrected
   * @param eran_x could be modified if any
   */
  abstract anchrRecOf_$(rv_x: Ranval, eran_x?: ERan): DOMRect;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // /** @final */
  // vu_$(scrollpos_x: ScrollPos, scrollpos_rev_x?: ScrollPos) {
  //   scrollpos_rev_x ??= this.lastScrollpos_$;
  //   const vchange = new Vchange(this, scrollpos_x, scrollpos_rev_x);
  //   vchange.vchange_run();
  //   this.#vuq.add(vchange);
  //   this.#updateUnrevu();
  // }

  // /** @final */
  // protected unvu$() {
  //   const ret = this.#vuq.canGetUn();
  //   if (ret) {
  //     this.#vuq.getUn().vchange_lnu();
  //     this.#updateUnrevu();
  //   }
  //   return ret;
  // }
  // /** @final */
  // protected revu$() {
  //   const ret = this.#vuq.canGetRe();
  //   if (ret) {
  //     this.#vuq.getRe().vchange_run();
  //     this.#updateUnrevu();
  //   }
  //   return ret;
  // }

  #onPointerUp = () => {
    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onPointerUp() >>>>>>>`,
      );
    }
    this.active = true;
    /*#static*/ if (_TRACE) global.outdent;
    return;
  };
}
/*80--------------------------------------------------------------------------*/

/** @final */
class RangeFactory extends Factory<Range> {
  /** @implement */
  protected createVal$() {
    return new Range();
  }

  /** @implement */
  protected override resetVal$(i_x: number) {
    const ret = this.val_a$[i_x];
    ret.reset();
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
