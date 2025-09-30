/** 80**************************************************************************
 * @module lib/editor/EdtrBase
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import {
  _COLR,
  _TRACE,
  CYPRESS,
  DEBUG,
  INOUT,
  INTRS,
  RESIZ,
} from "../../preNs.ts";
import { LastCb_i, Moo } from "../Moo.ts";
import { Scrolr, Scronr } from "../Scronr.ts";
import type { BufrDir, CSSStyle, id_t, lnum_t, ts_t, uint } from "../alias.ts";
import { MouseButton, WritingMode } from "../alias.ts";
import { Pale } from "../color/Pale.ts";
import type { Cssc } from "../color/alias.ts";
import type { Bufr } from "../compiling/Bufr.ts";
import type { Line } from "../compiling/Line.ts";
import { Ranval, RanvalMo } from "../compiling/Ranval.ts";
import { type CooInterface, HTMLVCo } from "../cv.ts";
import { div } from "../dom.ts";
import { $cssstylesheet, $loff, $tail_ignored } from "../symbols.ts";
import { assert, bind } from "../util.ts";
import { Factory } from "../util/Factory.ts";
import type { SortedIdo } from "../util/SortedArray.ts";
import { trace, traceOut } from "../util/trace.ts";
import { Caret, type CaretRvM } from "./Caret.ts";
import { ELineBase } from "./ELineBase.ts";
import { ERan } from "./ERan.ts";
import type { EdtrType, FSRec } from "./alias.ts";
import { EdtrMain_z } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

export interface EdtrBaseCI extends CooInterface {
  get writingMode_mo(): Moo<WritingMode>;
  get writingMode(): WritingMode;
  get scrollBStrt_mo(): Moo<number>;
  get scrollIStrt_mo(): Moo<number>;
  get scrolr(): EdtrBaseScrolr;

  //jjjj TOCLEANUP
  // /**
  //  * `in( this.el$.isConnected )`
  //  * @final
  //  */
  // refreshEdtrScronr(): void;

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

  /* Pale */
  readonly #fg_p = Pale.get("lib.editor.Edtr.fg");
  #onFgCssc = (_x: Cssc) => {
    this.el$.style.color = _x;
  };
  readonly #bg_p = Pale.get("lib.editor.Edtr.bg");
  #onBgCssc = (_x: Cssc) => {
    this.el$.style.backgroundColor = _x;
  };

  override observeTheme() {
    this.#fg_p.registCsscHandler(this.#onFgCssc);
    this.#bg_p.registCsscHandler(this.#onBgCssc);
  }
  /* ~ */
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #scronr!: EdtrScronr<CI>;
  /** @final */
  get scronr() {
    return this.#scronr;
  }

  /**
   * `in( this.#inited_EdtrBase)`
   * @final
   */
  get _writingMode_mo_() {
    return this.#scronr.writingMode_mo;
  }
  /**
   * `in( this.#inited_EdtrBase)`
   * @final
   */
  get _writingMode_() {
    return this.#scronr.writingMode;
  }

  get _scrollBStrt_mo() {
    return this.#scronr.scrollBStrt_mo;
  }
  get _scrollIStrt_mo_() {
    return this.#scronr.scrollIStrt_mo;
  }

  protected scrolr$!: EdtrBaseScrolr<CI>;
  /** `in( this.#inited_EdtrBase)` */
  get _scrolr() {
    return this.scrolr$;
  }

  /** @final */
  readonly wrap_mo = new Moo({ val: true, active: true });
  /** @final */
  get wrap(): boolean {
    return this.wrap_mo.val;
  }

  #lastSize_ts = Date.now_1();
  get lastSize_ts() {
    return this.#lastSize_ts;
  }
  updateLastSizeTs(): ts_t {
    return this.#lastSize_ts = Date.now_1();
  }

  /** */
  constructor() {
    super(div());
    /* `#scronr.coo` should exist before `init_EdtrBase()`. See e.g. uses of
    `init_EdtrBase()` in "PRItemVCo.ts" */
    this.#scronr = new EdtrScronr(this);

    // /*#static*/ if (DEBUG) {
    //   this.el$.id = this._type_id_;
    // }

    /* Some common settings here. May be overridden by `styl$()`. */
    this.assignStylo({
      color: this.#fg_p.cssc,
      backgroundColor: this.#bg_p.cssc,

      lineBreak: "loose",
    });

    //jjjj TOCLEANUP
    // Object.assign(this.ci, {
    //   refreshEdtrScronr: () => this._refreshEdtrScronr(),
    // } as EdtrBaseCI);
    Reflect.defineProperty(this.ci, "writingMode_mo", {
      get: () => this._writingMode_mo_,
    });
    Reflect.defineProperty(this.ci, "writingMode", {
      get: () => this._writingMode_,
    });
    Reflect.defineProperty(this.ci, "scrollBStrt_mo", {
      get: () => this._scrollBStrt_mo,
    });
    Reflect.defineProperty(this.ci, "scrollIStrt_mo", {
      get: () => this._scrollIStrt_mo_,
    });
    Reflect.defineProperty(this.ci, "scrolr", {
      get: () => this._scrolr,
    });
  }

  #inited_EdtrBase = false;
  /**
   * @final
   * @headconst @param scrolr_x
   */
  init_EdtrBase(scrolr_x: EdtrBaseScrolr<CI>): void {
    /*#static*/ if (INOUT) {
      assert(!this.#inited_EdtrBase);
    }
    this.scrolr$ = scrolr_x;
    this.#scronr.initScrolr(scrolr_x);

    this.el$.append(this.#scronr.el);

    this._writingMode_mo_.set_Moo(this.#writingMode)
      .registHandler(() => {
        this.scrolr$
          .invalidate_bcr()
          .refreshCarets();
      }, { i: LastCb_i });
    this.#scronr.syncLayout();

    new ResizeObserver(this.#scronr.refresh_Scronr)
      .observe(this.scrolr$.main_el);

    this.#scronr.observeTheme(); //!

    this.#inited_EdtrBase = true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** Used before `#inited` */
  #writingMode = WritingMode.htb;
  /**
   * Init setting. Normally called within constructors. So no callbacks will be
   * invoked.
   * @final
   */
  protected styl$(styl_x?: CSSStyle) {
    const wm_css = styl_x?.writingMode;
    this.#writingMode = wm_css === "vertical-rl"
      ? WritingMode.vrl
      : wm_css === "vertical-lr"
      ? WritingMode.vlr
      : WritingMode.htb;
    if (this.#inited_EdtrBase) {
      this.#scronr.writingMode_mo.set_Moo(this.#writingMode);
      this.#scronr.syncLayout();
    }

    if (styl_x) {
      delete styl_x.writingMode;
      this.assignStylo(styl_x);
    }
  }

  //jjjj TOCLEANUP
  // /**
  //  * `in( this.el$.isConnected )`
  //  * @final
  //  */
  // _refreshEdtrScronr() {
  //   this.#scronr.refresh_Scronr();
  // }

  //jjjj TOCLEANUP
  // /** @final */
  // _refresh_EdtrBase(): this {
  //   this.scrolr$.refresh_EdtrBaseScrolr()
  //     .coo._refreshEdtrScronr();
  //   return this;
  // }
}
/*64----------------------------------------------------------*/

/** @final */
export class EdtrScronr<CI extends EdtrBaseCI> extends Scronr<EdtrBase<CI>> {
  static #ID = 0 as id_t;
  override readonly id = ++EdtrScronr.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @headconst @param coo_x */
  constructor(coo_x: EdtrBase<CI>) {
    super(coo_x);

    /*#static*/ if (CYPRESS || DEBUG) {
      this.el$.hint = this._type_id_;

      this.scrobarB$.el.hint = `${this.el$.hint}.scrobarB`;
      this.scrobarI$.el.hint = `${this.el$.hint}.scrobarI`;
      this.scrobarB$.slidr.el.hint = `${this.el$.hint}.scrobarB.slidr`;
      this.scrobarI$.slidr.el.hint = `${this.el$.hint}.scrobarI.slidr`;

      this.scrodB$.el.hint = `${this.el$.hint}.scrodB`;
      this.scrodI$.el.hint = `${this.el$.hint}.scrodI`;
      this.scrodB$.scrodicatr.el.hint = `${this.el$.hint}.scrodB.scrodicatr`;
      this.scrodI$.scrodicatr.el.hint = `${this.el$.hint}.scrodI.scrodicatr`;
    }
    this.assignStylo({
      blockSize: "100%",
      inlineSize: "100%",
    });
  }

  //jjjj TOCLEANUP
  // #inited = false;
  // /**
  //  * @final
  //  * @headconst @param scrolr_x
  //  */
  // init_EdtrScronr(scrolr_x: EdtrBaseScrolr<CI>): void {
  //   /*#static*/ if (INOUT) {
  //     assert(!this.#inited);
  //   }
  //   this.initScrolr(scrolr_x);

  //   this.#inited = true;
  // }
}
/*49-------------------------------------------*/

/**
 * A non-generic base s.t. many related uses (e.g. Caret) can be non-generic.
 */
export abstract class EdtrBaseScrolr<CI extends EdtrBaseCI = EdtrBaseCI>
  extends Scrolr<EdtrBase<CI>> {
  static #ID = 0 as id_t;
  override readonly id = ++EdtrBaseScrolr.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  readonly type: EdtrType;

  readonly main_el = div();

  /* eline_m */
  readonly eline_m = new Map<Line, ELineBase>();
  /* ~ */

  /* bufr */
  protected bufr$!: Bufr;
  get bufr() {
    return this.bufr$;
  }
  /* ~ */

  override get bufrDir(): BufrDir {
    return this.bufr$.dir;
  }

  //kkkk What about wrap for PRItmFmt other than txt?
  /** @final */
  readonly wrap_mo = new Moo({ val: true, active: true });
  /** @final */
  get wrap(): boolean {
    return this.wrap_mo.val;
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

      this.coo$.updateLastSizeTs(); //!
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

  protected readonly dragingM_mo$ = new Moo({ val: false });
  get dragingM() {
    return this.dragingM_mo$.val;
  }

  protected readonly draggedM_mo$ = new Moo({ val: false });
  get draggedM() {
    return this.draggedM_mo$.val;
  }

  /* #vuq */
  // readonly #vuq = new Unre<Vchange>(
  //   /*#static*/ APP ? 500 : /*#static*/ DEBUG ? 100 : 30,
  // );
  // lastScrollpos_$: ScrollPos;

  // readonly #canUnvu_mo = new Moo({ val: false });
  // readonly #canRevu_mo = new Moo({ val: false });

  // #updateUnrevu() {
  //   this.#canUnvu_mo.val = this.#vuq.canGetUn();
  //   this.#canRevu_mo.val = this.#vuq.canGetRe();
  // }
  /* ~ */

  //jjjj TOCLEANUP
  // protected readonly dir_mo$ = new Moo<BufrDir>({ val: "ltr" });
  // get dir_$() {
  //   return this.dir_mo$.val;
  // }
  // _dir(_x: BufrDir) {
  //   this.dir_mo$.val = _x;
  // }

  /* #activEdtr_mo, activ_mo */
  static readonly #activEdtr_mo = new Moo<EdtrBaseScrolr | null>({
    val: null,
  });
  static inactivate() {
    this.#activEdtr_mo.val = null;
  }
  set edtrActiv(_x: boolean) {
    if (_x) {
      EdtrBaseScrolr.#activEdtr_mo.val = this;
    } else {
      if (EdtrBaseScrolr.#activEdtr_mo.val === this) {
        EdtrBaseScrolr.#activEdtr_mo.val = null;
      }
    }
  }

  readonly edtrActiv_mo = new Moo({ val: false, info: this as EdtrBaseScrolr });
  // get edtrActiv() {
  //   return this.edtrActiv_mo.val;
  // }
  /* ~ */

  //jjjj
  /* edting_mo */
  readonly edting_mo = new Moo({ val: true });
  get edting() {
    return this.edting_mo.val;
  }
  /* ~ */

  protected readonly resizob$;
  protected readonly intrsob$;

  /**
   * @headconst @param host_x
   * @const @param type_x
   */
  constructor(host_x: EdtrScronr<CI>, type_x: EdtrType) {
    super(host_x);
    this.type = type_x;
    this.caret_a$ = [Caret.create(host_x.coo)];

    const id_ = this.el$.id = this._type_id_;
    /*#static*/ if (CYPRESS || DEBUG) {
      this.el$.hint = this._type_id_;
    }
    this.assignAttro({
      contenteditable: "true",
      spellcheck: "false",
      // autocapitalize: "off",

      autocomplete: "off",
      autocorrect: "off",
    }).assignStylo({
      position: "relative",
      // zIndex: 0,
      isolation: "isolate", //!
      // writingMode: "vertical-rl",

      // border: "2px solid",
      // inlineSize: "max-content",
      // backgroundColor: "#fff",
      outlineStyle: "none",

      whiteSpace: "break-spaces", // Ref. https://stackoverflow.com/questions/64699828/css-property-white-space-example-for-break-spaces
      // whiteSpace: "preserve nowrap",
      // wordBreak: "break-all",
      // overflowWrap: "anywhere",
      // lineBreak: "loose",
      // fontFamily: fontFamily_x,
      // fontSize: fontSize_x,

      caretColor: "transparent",
      // userSelect: "text",
    });
    document[$cssstylesheet].insertRule(
      /*#static*/ _COLR
        ? `#${id_} ::selection { background-color: yellow; }`
        : `#${id_} ::selection { background-color: transparent; }`,
    );

    /*#static*/ if (CYPRESS || DEBUG) {
      this.main_el.hint = `${this.el$.hint}.main`;
    }
    // Object.assign( this.main_el, {
    //   inputMode: "none",
    // });
    this.main_el.assignAttro({
      // contenteditable: "true",
    }).assignStylo({
      position: "relative",
      zIndex: EdtrMain_z,
      //
      // inlineSize: "max-content",
      // backgroundColor: "transparent",
      //
      // textAlign: "end",
      // whiteSpace: "preserve nowrap",
    });

    this.el$.append(
      this.main_el,
    );
    this.proactiveCaret.attachTo(this);

    EdtrBaseScrolr.#activEdtr_mo.registHandler((_y) => {
      this.edtrActiv_mo.val = _y === this;
    });
    this.edtrActiv_mo.registHandler((_y) => {
      this.proactiveCaret.focusd_a100 = _y;
    });

    this.resizob$ = new ResizeObserver(this._onResiz);
    this.resizob$.observe(this.el$);
    this.resizob$.observe(document.body); //!

    this.intrsob$ = new IntersectionObserver(
      this._onIntrs,
      { root: this.el$, threshold: 1 },
    );
    this.intrsob$.observe(this.proactiveCaret.el);

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

    this.on("pointerup", this.#onPointerUp.bind(this));
    // this.host.slidrB.on("pointerdown", () => this.active = false);
  }

  //kkkk cache `ELineBase`?
  /** `in( this.el$.isConnected )` */
  reset_EdtrBaseScrolr(): this {
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
        // const bline = ELineBase.getBLine( ctnr, out_o );
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

    const bln_0 = ELineBase.getBLine(ctnr_0);
    const bln_1 = ELineBase.getBLine(ctnr_1);
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

  /** @headconst @param crm_x */
  #setShadowCaret(crm_x?: CaretRvM) {
    /*#static*/ if (INOUT) {
      assert(!crm_x || this !== crm_x[0].edtr);
    }
    // if( !(this.#sig & crm_x.sigmask) ) return; //jjjj

    // const colr = crm_x.host.colr.dup().setAlpha( .35 );

    let c_;
    for (let i = 1; i < this.caret_a$.length; ++i) {
      if (!this.caret_a$[i].active) {
        const c_1 = this.caret_a$[i].disable_$();
        c_ ??= c_1;
      }
    }
    if (crm_x) {
      if (c_) {
        c_.reset_$(crm_x);
      } else {
        c_ = Caret.create(this.coo, crm_x).attachTo(this);
        this.caret_a$.push(c_);
      }
    }
  }

  /**
   * @final
   * @headconst @param edtr_sa_x
   * @const @param hard_x
   */
  protected resetCarets$(edtr_sa_x: SortedIdo, hard_x?: "hard") {
    this.caret_a$.forEach((caret_y) => caret_y.disable_$());
    const crm = hard_x
      ? undefined
      : [this.proactiveCaret, new RanvalMo()] as CaretRvM;
    this.proactiveCaret.reset_$(crm);
    for (let i = 0; i < edtr_sa_x.length; ++i) {
      const edtr = edtr_sa_x[i] as EdtrBaseScrolr<CI>;
      if (edtr === this) continue;

      edtr.#setShadowCaret(crm);
      if (!hard_x) {
        this.#setShadowCaret(edtr.proactiveCaret.caretrvm!);
      }
    }
  }

  /**
   * `refreshCarets()` vs `refresh_EdtrBaseScrolr()` is in essence
   * `Caret.draw_$()` vs `Caret.shadowShow()`, where `draw_$()` does not care
   * about show-hide-things, nor does it update `Caret.#eran` or
   * `Caret.#fat_eran`.
   * @final
   */
  refreshCarets() {
    /* In reverse order to make sure that the main caret is handled lastly */
    for (let i = this.caret_a$.length; i--;) {
      const caret = this.caret_a$[i];
      if (caret.active && caret.shown) {
        const k_ = caret.keepInlineOnce_$;
        caret.draw_$();
        caret.keepInlineOnce_$ = k_;
      }
    }
  }

  @bind
  @traceOut(_TRACE && RESIZ)
  private _onResiz() {
    /*#static*/ if (_TRACE && RESIZ) {
      console.log(
        `%c${trace.indent}>>>>>>> ${this._type_id_}._onResiz() >>>>>>>`,
        `color:${LOG_cssc.resiz}`,
      );
    }
    if (!this.el$.isConnected) return;

    this.invalidate_bcr()
      .refreshCarets();
  }
  // _onResiz_() {
  //   return this._onResiz();
  // }

  /** @headconst @param entries_x */
  @bind
  @traceOut(_TRACE && INTRS)
  private _onIntrs(entries_x: IntersectionObserverEntry[]) {
    /*#static*/ if (_TRACE && INTRS) {
      console.log(
        `%c${trace.indent}>>>>>>> ${this._type_id_}._onIntrs() >>>>>>>`,
        `color:${LOG_cssc.intrs}`,
      );
    }
    if (!this.el$.isConnected) return;

    for (const entry of entries_x) {
      this.proactiveCaret.visible = entry.isIntersecting;
      break;
    }
  }

  /**
   * Cf. {@linkcode refreshCarets()}\
   * `in( this.el$.isConnected )`
   * @final
   */
  // @traceOut(_TRACE)
  refresh_EdtrBaseScrolr(): this {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${trace.indent}>>>>>>> ${this._type_id_}.refresh_EdtrBaseScrolr() >>>>>>>`,
    //   );
    // }
    // this.reset$();

    // createSetELines(this, this.bufr$.frstLine, this.bufr$.lastLine);
    // /*#static*/ if (DEBUG) {
    //   ++g_count.newVuu;
    // }
    // this.bufr$.refresh();

    for (const caret of this.caret_a$) {
      if (caret.realBody?.shown) {
        caret.shadowShow();
      } else {
        caret.hideAll();
      }
    }
    return this;
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param eran_x
  //jjjj TOCLEANUP
  //  * @out @param outF_o
  //  * @out @param outA_o
  //  * @return fill and return caret.rv_repl_$
   */
  protected getRanvalBy$(eran_x: ERan, ret_x?: Ranval): Ranval {
    ret_x ??= new Ranval(0 as lnum_t, 0);
    ret_x.focusLidx = ELineBase.getBLine(eran_x.focusCtnr).lidx_1;
    ret_x.focusLoff = eran_x.focusLoff;
    if (eran_x.collapsed) {
      ret_x.collapseToFocus();
    } else {
      ret_x.anchrLidx = ELineBase.getBLine(eran_x.anchrCtnr).lidx_1;
      ret_x.anchrLoff = eran_x.anchrLoff;
    }
    return ret_x;
  }

  /**
   * Assign `ret_x.#focusELoc` only.
   * @headconst @param rv_x will be corrected
   */
  abstract getEFocusOf_$(rv_x: Ranval, ret_x?: ERan): ERan;
  /**
   * Assign `ret_x.#anchrELoc` only.
   * @headconst @param rv_x will be corrected
   */
  abstract getEAnchrOf_$(rv_x: Ranval, out_x: ERan): void;
  /**
   * @final
   * @headconst @param rv_x will be corrected
   */
  getERanOf_$(rv_x: Ranval, ret_x?: ERan) {
    // console.log(rv_x);
    ret_x = this.getEFocusOf_$(rv_x, ret_x);
    this.getEAnchrOf_$(rv_x, ret_x);
    return ret_x;
  }

  /** @headconst @param rv_x will be modified */
  abstract anchrRecOf_$(rv_x: Ranval): FSRec;
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

  @traceOut(_TRACE)
  #onPointerUp(evt_x: PointerEvent) {
    /*#static*/ if (_TRACE) {
      console.log(
        `${trace.indent}>>>>>>> ${this._type_id_}.#onPointerUp() >>>>>>>`,
      );
    }
    if (evt_x.button === MouseButton.Main) {
      this.edtrActiv = true;
    }
  }
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
