/** 80**************************************************************************
 * @module lib/editor/Caret
 * @license BSD-3-Clause
 ******************************************************************************/

import {
  _TRACE,
  CYPRESS,
  DEV,
  EDITOR,
  EDITOR_v,
  global,
  INOUT,
} from "../../global.ts";
import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { WritingDir } from "../alias.ts";
import type { Cssc } from "../color/alias.ts";
import { Pale } from "../color/Pale.ts";
import { RanP } from "../compiling/Ran.ts";
import { Ranval, ranval_fac, RanvalMo } from "../compiling/Ranval.ts";
import { HTMLVuu } from "../cv.ts";
import { html, span } from "../dom.ts";
import "../jslang.ts";
import { $ovlap } from "../symbols.ts";
import { assert } from "../util/trace.ts";
import { Caret_passive_z, Caret_proactive_z } from "./alias.ts";
import type { EdtrScrolr } from "./Edtr.ts";
import type { EdtrBase, EdtrBaseScrolr } from "./EdtrBase.ts";
import { ELoc } from "./ELoc.ts";
import { ERan, ERanEndpoint } from "./ERan.ts";
import { SelecFac } from "./Selec.ts";
/*80--------------------------------------------------------------------------*/

export type CaretRvM = [proactiveCaret: Caret, ranval_mo: RanvalMo];

/** @final */
export class Caret extends HTMLVuu<EdtrBase, HTMLInputElement> {
  static #ID = 0 as id_t;
  override readonly id = ++Caret.#ID as id_t;

  /* Pale */
  #proactiveBg = Pale.get("lib.editor.Caret.proactiveBg");
  #passiveBg = Pale.get("lib.editor.Caret.passiveBg");
  #proactiveFatOl = Pale.get("lib.editor.Caret.proactiveFatOl");
  #passiveFatOl = Pale.get("lib.editor.Caret.passiveFatOl");
  #onProactiveBgCssc = (_x: Cssc) => {
    if (this.#proactive) {
      this.el$.style.backgroundColor = _x;
      this.#anchr_el.style.backgroundColor = _x;
    }
  };
  #onPassiveBgCssc = (_x: Cssc) => {
    if (!this.#proactive) {
      this.el$.style.backgroundColor = _x;
      this.#anchr_el.style.backgroundColor = _x;
    }
  };
  #onProactiveFatOlCssc = (_x: Cssc) => {
    if (this.#proactive) this.#fat_el.style.outlineColor = _x;
  };
  #onPassiveFatOlCssc = (_x: Cssc) => {
    if (!this.#proactive) this.#fat_el.style.outlineColor = _x;
  };
  override observeTheme() {
    this.#proactiveBg.registCsscHandler(this.#onProactiveBgCssc);
    this.#passiveBg.registCsscHandler(this.#onPassiveBgCssc);
    this.#proactiveFatOl.registCsscHandler(this.#onProactiveFatOlCssc);
    this.#passiveFatOl.registCsscHandler(this.#onPassiveFatOlCssc);
  }
  /* ~ */

  get edtr() {
    return this.coo._scrolr;
  }

  /* #caretrvm */
  /**
   * Exist after attaching Bufr (ref. `EdtrScrolr.attachBufr_impl$()`)
   */
  #caretrvm: CaretRvM | undefined;
  get caretrvm() {
    return this.#caretrvm;
  }
  /**
   * Not active means no reaction. But the `el$` could still show on the screen.
   * Call `disable_$()` to hide `this`.
   */
  get active() {
    return this.#caretrvm?.[1].nCb;
  }
  get realBody(): Caret | undefined {
    return this.#caretrvm?.[0];
  }
  /* ~ */

  /* #proactive */
  get #proactive() {
    return this === this.realBody;
  }
  get #bgCssc() {
    return this.#proactive ? this.#proactiveBg.cssc : this.#passiveBg.cssc;
  }
  get #fatOlCssc() {
    return this.#proactive
      ? this.#proactiveFatOl.cssc
      : this.#passiveFatOl.cssc;
  }
  get #zCssc() {
    return this.#proactive ? Caret_proactive_z : Caret_passive_z;
  }
  /* ~ */

  readonly ranval = new Ranval(0 as lnum_t, 0);

  /* #focused */
  /** For main caret only */
  #focused = false;
  set focused(_x: boolean) {
    if (this.#focused === _x) return;

    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.focused( ${_x} ) >>>>>>>`,
      );
    }
    this.#focused = _x;

    // if (this.#st !== CaretState.hidden) {
    if (this.#proactive && this.#focused) {
      this.blink();
    } else {
      this.stare();
    }
    // }

    if (this.#focused) this.#ranval_kept = undefined; //!
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  /** Keep (if not undefiend) until `focused = true` */
  #ranval_kept: Ranval | undefined;
  keepRanval_$(rv_x: Ranval) {
    this.#ranval_kept = rv_x;
  }
  /* ~ */

  #eran?: ERan;
  get eran() {
    return this.#eran;
  }

  readonly #fat_el = span();
  #fat_eran?: ERan;

  /* #st */
  #st = CaretState.hidden;
  get st() {
    return this.#st;
  }

  #shown = false;
  get shown() {
    return this.#shown;
  }

  #blink_an?: Animation;
  stare() {
    if (this.#st === CaretState.staring) return;

    this.#blink_an?.cancel();

    this.el$.style.display = "unset";
    this.#fat_el.style.display = "unset";
    this.#shown = true;

    this.#st = CaretState.staring;
  }
  blink() {
    if (this.#st === CaretState.blinking) return;

    if (this.#blink_an) {
      this.#blink_an.play();
    } else {
      this.#blink_an = this.el$.animate([
        { opacity: 1 },
        { opacity: 0 },
        { opacity: 1 },
      ], {
        easing: "steps(2)",
        duration: 800,
        iterations: Infinity,
      });
    }

    this.el$.style.display = "unset";
    this.#fat_el.style.display = "unset";
    this.#shown = true;

    this.#st = CaretState.blinking;
  }

  hide() {
    if (this.#st === CaretState.hidden) return;

    this.el$.style.display = "none";
    this.#fat_el.style.display = "none";
    this.#shown = false;

    this.#st = CaretState.hidden;
  }
  /* ~ */

  /* #selec_fac, #anchr_el */
  readonly #selec_fac: SelecFac;
  readonly #anchr_el = span();
  #hideSelec() {
    this.#selec_fac.init();
    this.#anchr_el.style.display = "none";
  }
  #showSelec() {
    this.#selec_fac.showAll();
    this.#anchr_el.style.display = "unset";
  }
  /* ~ */

  hideAll() {
    if (this.#shown) {
      this.hide();
      this.#hideSelec();
    }
    /*#static*/ if (INOUT) {
      assert(!this.#shown);
    }
  }

  /* vInline_$ */
  /**
   * Viewport inline within `edtr` to keep
   */
  vInline_$ = 0;

  keepVLInlineOnce_$ = false;
  /* ~ */

  /** Helper @see {@linkcode EdtrScrolr.prereplace_$()} */
  ranval_$ = new Ranval(0 as lnum_t, 0);
  ranpA_$ = RanP.unknown;
  ranpF_$ = RanP.unknown; //jjjj always `eran !== undefined` if `ranpF_$ !== RanP.unknown`?
  offsA_$: loff_t | lnum_t = 0;
  offsF_$: loff_t | lnum_t = 0;
  /* ~ */

  /**
   * @headconst @param coo_x
   * @headconst @param cr_x
   */
  private constructor(coo_x: EdtrBase, cr_x?: CaretRvM) {
    super(coo_x, html("input"));
    this.#selec_fac = new SelecFac(coo_x);

    this.el$.id = this._type_id; // Otherwise, Chrome DevTools will issue "A form field element has neither an id nor a name attribute."
    /*#static*/ if (CYPRESS) {
      this.el$.cyName = this._type_id;
    }
    this.assignAttro({
      // className: "editor-selection",
      //
      // contenteditable: true,
      // inputmode: "text",
      spellcheck: "false",
      // autocapitalize: "off",
      //
      // readonly: "readonly",
      // maxlength: 0,
      autocomplete: "off",
      autocorrect: "off",

      /* To prevent Edge from complaining. See [Form <input> elements must have labels](https://dequeuniversity.com/rules/axe/4.4/label) */
      "aria-label": this._type_id,
    });
    this.assignStylo({
      display: "none",
      position: "absolute",
      // top: `5px`,
      // left: `10px`,
      margin: "0px",

      border: "0px",
      padding: "0px",
      outline: "none",
      // caretColor: "transparent",
    });
    this.#fat_el.assignStylo({
      display: "none",
      position: "absolute",

      outlineWidth: "2px",
      outlineStyle: "dotted",
    });
    this.#anchr_el.assignStylo({
      display: "none",
      position: "absolute",
    });
    this.reset_$(cr_x);

    this.on("focus", this.#onFocus);
    this.on("blur", this.#onBlur);
    // this.on( "keydown", this.#onKeyDown );
    this.on("keyup", this.#onKeyUp);
    // this.on("input", this.#onInput);
    this.on("compositionend", () => this.el$.value = "");
  }
  static create(coo_x: EdtrBase, cr_x?: CaretRvM) {
    const ret = new Caret(coo_x, cr_x);
    /*#static*/ if (DEV) ret.observeTheme();
    return ret;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param cr_x
   */
  reset_$(cr_x?: CaretRvM) {
    if (this.#proactive) {
      this.#caretrvm![1].reset();
      /* Then other shadow carets are not `enabled()` automatically because
      `#caretrvm![1].nCb === 0` */
    } else if (this.active) {
      this.disable_$();
    }
    this.#caretrvm = cr_x;
    if (cr_x) {
      cr_x[1].registHandler(this.#onRanvalChange);
      cr_x[1].forceOnce = true; //!
    }

    // this.el$.assignStylo({
    //   zIndex: this.#zCssc,

    //   backgroundColor: this.#bgCssc,
    // });
    // this.#fat_el.assignStylo({
    //   zIndex: this.#zCssc,

    //   outlineColor: this.#fatOlCssc,
    // });
    // this.#anchr_el.assignStylo({
    //   zIndex: this.#zCssc,

    //   backgroundColor: this.#bgCssc,
    // });
  }

  attachTo(_x: EdtrBaseScrolr): this {
    _x.el.append(this.#fat_el, this.el$, this.#anchr_el);
    return this;
  }

  // createCaretRvM_$() {
  //   /*#static*/ if (INOUT) {
  //     assert(!this.enabled);
  //   }
  //   this.#caretrvm = [this, new RanvalMo()];
  //   this.#caretrvm[1].registHandler(this.#onRanvalChange);
  //   this.#caretrvm[1].forceOnce = true; //!
  //   /*#static*/ if (INOUT) {
  //     assert(this.enabled && this.#proactive);
  //   }
  //   return this.#caretrvm;
  // }

  /**
   * No effects on the proactive caret, only hiding.
   * For the proactive caret, use reset_$() to reset it.
   */
  disable_$() {
    this.hideAll();
    if (!this.#proactive) {
      this.#caretrvm?.[1].removeHandler(this.#onRanvalChange);
      this.#caretrvm = undefined;
    }
    /*#static*/ if (INOUT) {
      assert((!this.active || this.#proactive) && !this.#shown);
    }
  }

  /**
   * @const @param rv_x
   */
  #onRanvalChange = (rv_x: Ranval) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onRanvalChange([${rv_x}]) >>>>>>>`,
      );
    }
    this.ranval.become(rv_x);
    /*#static*/ if (CYPRESS) {
      this.el$["cy.any"] = this.ranval.toString();
    }
    this.#eran = this.edtr.getERanBy_$(this.ranval, this.#eran);
    // if( !this.#eran.focusCtnr.isText ) { this.hide(); return; }
    // console.log(this.#eran);
    using fat_rv = ranval_fac.oneMore().reset(rv_x.focusLidx, rv_x.focusLoff);
    fat_rv.focusLoff += 1;
    this.#fat_eran = this.edtr.getERanBy_$(fat_rv, this.#fat_eran);

    this.draw_$();
    // if (this.#st === CaretState.hidden) {
    if (this.#proactive && this.#focused) {
      this.blink();
    } else {
      this.stare();
    }
    // }
    if (!this.#eran.collapsed) {
      this.#showSelec();
    }
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  /**
   * Cf. `onRanvalChange()`:\
   * No `rv_x`, corr of which, `rv_0`, is taken from `#caretrvm![1]`.
   */
  shadowShow(): void {
    if (this.#proactive) return;

    /*#static*/ if (INOUT) {
      assert(this.active);
    }
    const rv_0 = this.#caretrvm![1].val;
    using rv_ = ranval_fac.oneMore().become(rv_0);
    this.#eran = this.edtr.getERanBy_$(rv_, this.#eran);
    using fat_rv = ranval_fac.oneMore().reset(rv_0.focusLidx, rv_0.focusLoff);
    fat_rv.focusLoff += 1;
    this.#fat_eran = this.edtr.getERanBy_$(fat_rv, this.#fat_eran);

    this.draw_$();
    this.stare();
    if (!this.#eran.collapsed) {
      this.#showSelec();
    }
  }
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  #onFocus = (evt_x: FocusEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onFocus() >>>>>>>`,
      );
    }
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };
  #onBlur = (evt_x: FocusEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(`${global.indent}>>>>>>> ${this._type_id}.#onBlur() >>>>>>>`);
    }
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  // #onKeyDown = ( evt:KeyboardEvent ) =>
  // {
  //   // #if _TRACE
  //     console.log(`>>>>>>> Caret.#onKeyDown() >>>>>>>`);
  //   // #endif
  // }
  #onKeyUp = (evt_x: KeyboardEvent) => {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#onKeyUp() >>>>>>>`,
      );
      console.log(`${global.dent}value = "${this.el$.value}"`);
    }
    // this.el$.value = "";
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };

  /** @deprecated */
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

    evt_x.preventDefault();

    switch (evt_x.inputType) {
      case "insertText":
        // case "deleteContentBackward":
        this.el$.value = "";
        break;
    }
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  };
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param sel_x
   */
  setERanBySel_$(sel_x: Selection) {
    /*#static*/ if (INOUT) {
      assert(sel_x.focusNode && sel_x.anchorNode);
    }
    if (this.#eran) {
      // this.#eran.rise$_();
      this.#eran.focusELoc.ctnr_$ = sel_x.focusNode!;
      this.#eran.focusELoc.offs_$ = sel_x.focusOffset;
      this.#eran.anchrELoc.ctnr_$ = sel_x.anchorNode!;
      this.#eran.anchrELoc.offs_$ = sel_x.anchorOffset;
    } else {
      this.#eran = new ERan(
        new ELoc(sel_x.focusNode!, sel_x.focusOffset),
        new ELoc(sel_x.anchorNode!, sel_x.anchorOffset),
      );
    }
    /*#static*/ if (INOUT) {
      assert(this.#eran);
    }
  }

  /**
   * `in( this.#caretrvm )`
   * @headconst @param rv_x [COPIED]
   * @const @param forceOnce_x
   */
  setByRanval(rv_x: Ranval, forceOnce_x = false) {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.setByRanval([${rv_x}], ${forceOnce_x}) >>>>>>>`,
      );
    }
    // if( !this.#caretrvm ) this.createCaretRvM_$( bufr_x );
    this.#caretrvm![1].forceOnce = forceOnce_x || !!this.#ranval_kept;
    this.#caretrvm![1].val = this.#ranval_kept ?? rv_x;
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  draw_$() {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.draw_$() >>>>>>>`,
      );
    }
    // console.log( this.el$.isConnected );
    // console.log( this.#eran );
    /*#static*/ if (INOUT) {
      assert(this.#eran);
    }
    this.#drawFocus();
    this.#drawRange();
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  /**
   * @headconst @param el_x
   * @const @param x_x
   * @const @param y_x
   * @const @param w_x
   * @const @param h_x
   * @const @param ovlap_x
  //  * @return `true`, success;
  //  *  `false`, failure, and `hideAll()` is already invoked
   */
  #setPosSiz(
    el_x: HTMLInputElement | HTMLSpanElement,
    x_x: number,
    y_x: number,
    w_x: number,
    h_x: number,
    // ovlap_x = false,
  ) {
    // console.log({
    //   x_x: x_x.fixTo(1),
    //   y_x: y_x.fixTo(1),
    //   w_x: w_x.fixTo(1),
    //   h_x: h_x.fixTo(1),
    // });
    const edtr = this.edtr;
    const wm_ = this.coo._writingMode;
    /**
     * blockSizei
     *
     * ! Firefox does not correctly implement vertical `writingMode` about this.
     */
    const bs_ = wm_ & WritingDir.h ? h_x : w_x;
    /** inlineSize */
    const is_ = Math.clamp(1, bs_ * .1, 5);
    // const scrollLeft_save = edtr.el.scrollLeft;
    // const scrollTop_save = edtr.el.scrollTop;
    // const edtrWidth_save = edtr.el.clientWidth;
    // const edtrHeight_save = edtr.el.clientHeight;
    //jjjj Why CSS `blockSize`, `inlineSize` do not work?
    el_x.assignStylo({
      left: wm_ & WritingDir.h
        ? `${Math.clamp(0, x_x - is_ / 2, edtr.el.clientWidth - is_)}px`
        : `${x_x}px`,
      top: wm_ & WritingDir.h
        ? `${y_x}px`
        : `${Math.clamp(0, y_x - is_ / 2, edtr.el.clientHeight - is_)}px`,
      zIndex: this.#zCssc,

      width: wm_ & WritingDir.h ? `${is_}px` : `${bs_}px`,
      height: wm_ & WritingDir.h ? `${bs_}px` : `${is_}px`,
      backgroundColor: this.#bgCssc,
    });
    // if( edtr.el.scrollLeft !== scrollLeft_save
    //  || edtr.el.scrollTop !== scrollTop_save
    //  && edtr.el.clientWidth !== edtrWidth_save
    //  || edtr.el.clientHeight !== edtrHeight_save
    // ) {
    //   // console.log( {scrollTop_save,edtrWidth_save} );
    //   // console.log( `edtr.el.scrollTop=${edtr.el.scrollTop}` );
    //   // console.log( `edtr.el.clientWidth=${edtr.el.clientWidth}` );
    //   edtr.moveCarets$_(
    //     edtr.el.scrollLeft - scrollLeft_save,
    //     edtr.el.scrollTop - scrollTop_save );
    // }

    //jjjj should be able to configure if synchronize views or not
    // if( this !== this.coo.caret ) return;

    // if (edtr.el.scrollTop > y_x) {
    //   if (this.#proactive) {
    //     edtr.vu_$(
    //       [undefined, y_x],
    //       [undefined, edtr.el.scrollTop],
    //     );
    //   } else {
    //     edtr.el.scrollTop = y_x;
    //     edtr.lastScrollpos_$[1] = edtr.el.scrollTop;
    //   }
    // } else if (
    //   edtr.lastScrollpos_$[1] !== undefined &&
    //   edtr.lastScrollpos_$[1] > y_x
    // ) {
    //   if (this.#proactive) {
    //     edtr.vu_$([undefined, edtr.el.scrollTop]);
    //   }
    // } else if (edtr.el.scrollTop < y_x + h_x - edtr.el.clientHeight) {
    //   if (this.#proactive) {
    //     edtr.vu_$(
    //       [undefined, y_x + h_x - edtr.el.clientHeight],
    //       [undefined, edtr.el.scrollTop],
    //     );
    //   } else {
    //     edtr.el.scrollTop = y_x + h_x - edtr.el.clientHeight;
    //     edtr.lastScrollpos_$[1] = edtr.el.scrollTop;
    //   }
    // } else if (
    //   edtr.lastScrollpos_$[1] !== undefined &&
    //   edtr.lastScrollpos_$[1] < y_x + h_x - edtr.el.clientHeight
    // ) {
    //   if (this.#proactive) {
    //     edtr.vu_$([undefined, edtr.el.scrollTop]);
    //   }
    // }
  }

  /**
   * `in( this.#eran )`
   */
  #drawFocus() {
    /*#static*/ if (_TRACE && EDITOR) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id}.#drawFocus() >>>>>>>`,
      );
    }
    const edtr = this.edtr;
    // console.log(`${global.dent}vInline_$ = ${this.vInline_$.fixTo(1)}`);
    const rec = this.#eran!.getRecSync_$();
    // console.log( rec );
    this.#setPosSiz(
      this.el$,
      rec.left - edtr.vpLeft,
      rec.top - edtr.vpTop,
      rec.width,
      rec.height,
      // rec[$ovlap],
    );
    // const rec1 = this.#eran.getRecSync_$();
    // if( rec1.left !== rec.left || rec1.top !== rec.top )
    // {
    //   console.log( {rec,rec1} );
    // }

    const range = this.#fat_eran!.syncRange_$();
    const fat = range.getBoundingClientRect();
    this.#fat_el.assignStylo({
      top: `${fat.top - edtr.vpTop}px`,
      left: `${fat.left - edtr.vpLeft}px`,
      zIndex: this.#zCssc,

      width: `${fat.width}px`,
      height: `${fat.height}px`,
      outlineColor: this.#fatOlCssc,
    });

    if (!this.keepVLInlineOnce_$) {
      // this.vInline_$ = edtr.writingMode & WritingDir.h
      //   ? rec.left - edtr.vpLeft
      //   : rec.top - edtr.vpTop;
      /* It's better to use midpoint because `EdtrScrolr.prevRow()`,
      EdtrScrolr._nextRow()` use midpoints. */
      this.vInline_$ = this.coo._writingMode & WritingDir.h
        ? (fat.left + fat.right) / 2 - edtr.vpLeft
        : (fat.top + fat.bottom) / 2 - edtr.vpTop;
    }
    this.keepVLInlineOnce_$ = false;
    // console.log(`${global.dent}vInline_$ = ${this.vInline_$.fixTo(1)}`);
    /*#static*/ if (_TRACE && EDITOR) global.outdent;
    return;
  }

  /**
   * `in( this.#eran )`
   */
  #drawRange() {
    // // #if _TRACE
    //   console.log(`${global.indent}>>>>>>> ${this._type_id}.#drawRange() >>>>>>>`);
    // // #endif
    const edtr = this.edtr;
    if (this.#eran!.collapsed) {
      this.#hideSelec();
    } else {
      const rec_a = edtr.getReca_$(this.#eran!.syncRange_$());
      this.#selec_fac.proactive_$ = this.#proactive;
      const n_ = this.#selec_fac.produce(rec_a.length);
      const selec_a = this.#selec_fac.val_a;
      for (let i = n_; i--;) {
        const rec = rec_a[i];
        selec_a[i].draw_$(
          rec.left - edtr.vpLeft,
          rec.top - edtr.vpTop,
          rec.width,
          rec.height,
          rec[$ovlap],
        );
      }

      const rec = this.#eran!.getRecSync_$(ERanEndpoint.anchr);
      this.#setPosSiz(
        this.#anchr_el,
        rec.left - edtr.vpLeft,
        rec.top - edtr.vpTop,
        rec.width,
        rec.height,
        // rec[$ovlap],
      );
    }
    // // #if _TRACE
    //   global.outdent;
    // // #endif
  }
}

export enum CaretState {
  staring = 1,
  blinking,
  hidden,
}
/*80--------------------------------------------------------------------------*/