/** 80**************************************************************************
 * @module lib/Scronr
 * @license BSD-3-Clause
 ******************************************************************************/

import { g_getRootVCo, LOG_cssc } from "../alias.ts";
import { _TRACE, DEV, global, INOUT, RESIZ } from "../global.ts";
import { Moo } from "./Moo.ts";
import type { id_t, SetLayoutP, unum } from "./alias.ts";
import {
  BufrDir,
  Scrobar_z,
  Scrod_z,
  scrollO,
  WritingDir,
  WritingMode,
} from "./alias.ts";
import type { Colr } from "./color/Colr.ts";
import { Pale } from "./color/Pale.ts";
import type { Cssc } from "./color/alias.ts";
import type { Coo } from "./cv.ts";
import { HTMLVuu } from "./cv.ts";
import { div, MouseButton } from "./dom.ts";
import { assert, bind, fail, traceOut } from "./util/trace.ts";
/*80--------------------------------------------------------------------------*/

/** Scroll container */
export abstract class Scronr<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  static #ID = 0 as id_t;
  override readonly id = ++Scronr.#ID as id_t;

  /* Pale */
  /* 2 #scrod_p */
  #scrod_p = Pale.get("lib.Scronr.scrod");
  get scrod_cp(): Colr | Pale {
    return this.#scrod_p;
  }
  #onScrodCssc = (_x: Cssc) => {
    this.#scrodB.el.style.backgroundColor = _x;
  };
  /* 2 ~ */

  /* 2 #scrodicatr_p */
  #scrodicatr_p = Pale.get("lib.Scronr.scrodicatr");
  get scrodicatr_cp(): Colr | Pale {
    return this.#scrodicatr_p;
  }
  #onScrodicatrCssc = (_x: Cssc) => {
    this.#scrodB.scrodicatr.el.style.backgroundColor = _x;
  };
  /* 2 ~ */

  /* 2 #scrobar_p */
  #scrobar_p = Pale.get("lib.Scronr.scrobar");
  get scrobar_cp(): Colr | Pale {
    return this.#scrobar_p;
  }
  #onScrobarCssc = (_x: Cssc) => {
    this.#scrobarB.el.style.backgroundColor = _x;
  };
  /* 2 ~ */

  /* 2 #slidr_p */
  #slidr_p = Pale.get("lib.Scronr.slidr");
  get slidr_cp(): Colr | Pale {
    return this.#slidr_p;
  }
  #onSlidrCssc = (_x: Cssc) => {
    this.#scrobarB.slidr.el.style.backgroundColor = _x;
  };
  /* 2 ~ */

  override observeTheme() {
    this.#scrod_p.registCsscHandler(this.#onScrodCssc);
    this.#scrodicatr_p.registCsscHandler(this.#onScrodicatrCssc);
    this.#scrobar_p.registCsscHandler(this.#onScrobarCssc);
    this.#slidr_p.registCsscHandler(this.#onSlidrCssc);
  }
  override unobserveTheme() {
    this.#scrod_p.removeCsscHandler(this.#onScrodCssc);
    this.#scrodicatr_p.removeCsscHandler(this.#onScrodicatrCssc);
    this.#scrobar_p.removeCsscHandler(this.#onScrobarCssc);
    this.#slidr_p.removeCsscHandler(this.#onSlidrCssc);
  }
  /* ~ */
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  #scrolr!: Scrolr<C>;
  readonly #scrodB: ScrodB_<C>;
  readonly #scrodI: ScrodI_<C>;

  readonly #scrobarB: ScrobarB_<C>;
  get slidrB() {
    return this.#scrobarB.slidr;
  }

  readonly #scrobarI: ScrobarI_<C>;
  get slidrI() {
    return this.#scrobarI.slidr;
  }

  /** @final */
  get bufrDir(): BufrDir {
    return this.#scrolr.bufrDir;
  }

  /** @final */
  readonly writingMode_mo = new Moo({ val: WritingMode.htb, active: true });
  /** @final */
  get writingMode(): WritingMode {
    return this.writingMode_mo.val;
  }

  /* #scrollBStrt, #clientBSize, #scrollBSize */
  /**
   * scroll block-start, used to detect in `_onScroll_scrolr()` vertical or
   * horizontal scroll
   */
  #scrollBStrt: unum = 0;

  /** client block-size */
  #clientBSize = 0;
  get clientBSize() {
    return this.#clientBSize;
  }
  #scrollBSize = 0;
  get scrollBSize() {
    return this.#scrollBSize;
  }

  get #slidrOrigBSize() {
    return this.#clientBSize ** 2 / this.#scrollBSize;
  }
  get #slidrBSize() {
    return Math.max(this.#slidrOrigBSize, Slidr_.size_MIN);
  }

  /** @const @param scrollBStrt_x */
  #calcSlidrBStrt(scrollBStrt_x: unum) {
    return this.#slidrOrigBSize >= Slidr_.size_MIN
      ? scrollBStrt_x * this.#clientBSize / this.#scrollBSize
      : scrollBStrt_x *
        ((this.#clientBSize - Slidr_.size_MIN) /
          (this.#scrollBSize - this.#clientBSize));
  }

  calcScrollBStrt_$(slidrBStrt_x: unum): unum {
    return this.#slidrOrigBSize >= Slidr_.size_MIN
      ? slidrBStrt_x / (this.#clientBSize / this.#scrollBSize)
      : slidrBStrt_x /
        ((this.#clientBSize - Slidr_.size_MIN) /
          (this.#scrollBSize - this.#clientBSize));
  }
  /* ~ */

  /* #scrollIStrt, #clientISize, #scrollISize */
  /**
   * scroll inline-start, used to detect in `_onScroll_scrolr()` vertical or
   * horizontal scroll
   */
  #scrollIStrt: unum = 0;

  /** client block-size */
  #clientISize = 0;
  get clientISize() {
    return this.#clientISize;
  }
  #scrollISize = 0;
  get scrollISize() {
    return this.#scrollISize;
  }

  get #slidrOrigISize() {
    return this.#clientISize ** 2 / this.#scrollISize;
  }
  get #slidrISize() {
    return Math.max(this.#slidrOrigISize, Slidr_.size_MIN);
  }

  /** @const @param scrollIStrt_x */
  #calcSlidrIStrt(scrollIStrt_x: unum) {
    return this.#slidrOrigISize >= Slidr_.size_MIN
      ? scrollIStrt_x * this.#clientISize / this.#scrollISize
      : scrollIStrt_x *
        ((this.#clientISize - Slidr_.size_MIN) /
          (this.#scrollISize - this.#clientISize));
  }

  calcScrollIStrt_$(slidrIStrt_x: unum): unum {
    return this.#slidrOrigISize >= Slidr_.size_MIN
      ? slidrIStrt_x / (this.#clientISize / this.#scrollISize)
      : slidrIStrt_x /
        ((this.#clientISize - Slidr_.size_MIN) /
          (this.#scrollISize - this.#clientISize));
  }
  /* ~ */

  /** @headconst @param coo_x */
  constructor(coo_x: C) {
    super(coo_x, div());

    /*#static*/ if (DEV) {
      this.el$.id = this._type_id_;
    }
    this.assignStylo({
      display: "grid",
      position: "relative",
      contain: "size",
      isolation: "isolate", // to form a new stacking context
      // overflow: "hidden",
      gridTemplateRows: `[frst-line] 1fr ${Scrod_.thick}px [last-line]`,
      gridTemplateColumns: `[frst-line] 1fr ${Scrod_.thick}px [last-line]`,
    });

    this.#scrodB = new ScrodB_(this);
    this.#scrodI = new ScrodI_(this);

    this.#scrobarB = new ScrobarB_(this);
    this.#scrobarI = new ScrobarI_(this);

    this.el$.append(
      this.#scrodB.el,
      this.#scrodI.el,
      this.#scrobarB.el,
      this.#scrobarI.el,
    );

    this.#resizob.observe(this.el$);
  }

  #scrolrInited = false;
  /**
   * Called by subclasses
   *
   * This method does not have to be called, i.e., it could be the state that
   * `!#scrolrInited`, `#scrolr` are not set.
   *
   * @final
   * @headconst @param scrolr_x
   */
  initScrolr(scrolr_x: Scrolr<C>): void {
    /*#static*/ if (INOUT) {
      assert(!this.#scrolrInited);
    }
    /* Set styles here to make sure the highest priority. */
    this.#scrolr = scrolr_x.assignStylo({
      overflow: "hidden",
    });

    this.el$.append(scrolr_x.el);

    // this.#resizob.observe(scrolr_x.el);

    this.el$.onWheel(this._onWheel);
    scrolr_x.on("scroll", this._onScroll_scrolr);

    this.#scrolrInited = true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Could be called during `writingMode_mo` callbacks. Since its `active: true`,
   * so `writingMode` is new.
   *
   * `in( this.#scrolrInited )`
   *
   * @const @param lo_x act as a verifier if any
   */
  syncLayout(lo_x?: SetLayoutP) {
    /*#static*/ if (INOUT) {
      assert(!lo_x?.writingMode || lo_x.writingMode === this.writingMode);
    }
    /* final switch */ ({
      [WritingMode.htb]: () => {
        this.el$.style.writingMode = "horizontal-tb";
      },
      [WritingMode.vrl]: () => {
        this.el$.style.writingMode = "vertical-rl";
      },
      [WritingMode.vlr]: () => {
        this.el$.style.writingMode = "vertical-lr";
      },
    }[this.writingMode])();
  }

  /**
   * @const @param strt_x
   * @const @param horz_x
   */
  scrollScrolrBy(strt_x: number, horz_x?: "horz") {
    if (horz_x) {
      /* final switch */ ({
        [WritingMode.htb]: () => {
          scrollO.top = 0;
          scrollO.left = -strt_x;
        },
        [WritingMode.vrl]: () => {
          scrollO.top = strt_x;
          scrollO.left = 0;
        },
        [WritingMode.vlr]: () => {
          scrollO.top = strt_x;
          scrollO.left = 0;
        },
      }[this.writingMode])();
    } else {
      /* final switch */ ({
        [WritingMode.htb]: () => {
          scrollO.top = strt_x;
          scrollO.left = 0;
        },
        [WritingMode.vrl]: () => {
          scrollO.top = 0;
          scrollO.left = -strt_x;
        },
        [WritingMode.vlr]: () => {
          scrollO.top = 0;
          scrollO.left = -strt_x;
        },
      }[this.writingMode])();
    }
    this.#scrolr.el.scrollBy(scrollO);
  }

  /**
   * @const @param strt_x
   * @const @param horz_x
   */
  // @traceOut(_TRACE)
  scrollScrolrTo(strt_x: number, horz_x?: "horz") {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> `,
    //     `${this._type_id_}.scrollScrolrTo( ${strt_x.fixTo(2)}, ${horz_x})`,
    //     `>>>>>>>`,
    //   );
    // }
    if (horz_x) {
      /* final switch */ ({
        [WritingMode.htb]: () => {
          scrollO.top = this.#scrolr.el.scrollTop;
          scrollO.left = strt_x;
        },
        [WritingMode.vrl]: () => {
          scrollO.top = strt_x;
          scrollO.left = this.#scrolr.el.scrollLeft;
        },
        [WritingMode.vlr]: () => {
          scrollO.top = strt_x;
          scrollO.left = this.#scrolr.el.scrollLeft;
        },
      }[this.writingMode])();
    } else {
      /* final switch */ ({
        [WritingMode.htb]: () => {
          scrollO.top = strt_x;
          scrollO.left = this.#scrolr.el.scrollLeft;
        },
        [WritingMode.vrl]: () => {
          scrollO.top = this.#scrolr.el.scrollTop;
          scrollO.left = -strt_x;
        },
        [WritingMode.vlr]: () => {
          scrollO.top = this.#scrolr.el.scrollTop;
          scrollO.left = strt_x;
        },
      }[this.writingMode])();
    }
    this.#scrolr.el.scrollTo(scrollO);
  }

  /** @param bstrt_x block-start value */
  #setSlidrBStrt(bstrt_x: unum) {
    this.#scrodB.scrodicatr.el.style.insetBlockStart =
      this.#scrobarB.slidr.el.style.insetBlockStart =
        `${bstrt_x}px`;
  }
  /** @param istrt_x inline-start value */
  #setSlidrIStrt(istrt_x: unum) {
    this.#scrodI.scrodicatr.el.style.insetInlineStart =
      this.#scrobarI.slidr.el.style.insetInlineStart =
        `${istrt_x}px`;
  }

  /**
   * Also update `#clientBSize`, `#scrollBSize`
   * @final
   */
  @bind
  refresh_Scronr(): void {
    // console.log(`%crun here: refresh()`, `color:${LOG_cssc.runhere}`);
    if (!this.el$.isConnected || !this.#scrolrInited) return;

    /*#static*/ if (_TRACE) {
      console.log(
        `${global.indent}>>>>>>> ${this._type_id_}.refresh_Scronr() >>>>>>>`,
      );
    }
    const wm_ = this.writingMode;
    const el_ = this.#scrolr.el;

    this.#clientBSize = wm_ & WritingDir.h ? el_.clientHeight : el_.clientWidth;
    this.#scrollBSize = wm_ & WritingDir.h ? el_.scrollHeight : el_.scrollWidth;
    // console.log({
    //   clientBSize: this.#clientBSize,
    //   scrollBSize: this.#scrollBSize,
    // });

    const scrollBStrt = this.#scrollBStrt = Math.abs(
      wm_ & WritingDir.h ? el_.scrollTop : el_.scrollLeft,
    );
    if (0 < this.#clientBSize && this.#clientBSize < this.#scrollBSize) {
      this.#scrodB.show();
      this.#scrodB.scrodicatr.el.style.blockSize =
        this.#scrobarB.slidr.el.style.blockSize =
          `${this.#slidrBSize}px`;
      this.#setSlidrBStrt(this.#calcSlidrBStrt(scrollBStrt));
    } else {
      this.#scrodB.hide();
      this.#scrobarB.hide();
    }

    this.#clientISize = wm_ & WritingDir.h ? el_.clientWidth : el_.clientHeight;
    this.#scrollISize = wm_ & WritingDir.h ? el_.scrollWidth : el_.scrollHeight;
    // console.log({
    //   clientISize: this.#clientISize,
    //   scrollISize: this.#scrollISize,
    // });

    const scrollIStrt = this.#scrollIStrt = Math.abs(
      wm_ & WritingDir.h ? el_.scrollLeft : el_.scrollTop,
    );
    if (0 < this.#clientISize && this.#clientISize < this.#scrollISize) {
      this.#scrodI.show();
      this.#scrodI.scrodicatr.el.style.inlineSize =
        this.#scrobarI.slidr.el.style.inlineSize =
          `${this.#slidrISize}px`;
      this.#setSlidrIStrt(this.#calcSlidrIStrt(scrollIStrt));
    } else {
      this.#scrodI.hide();
      this.#scrobarI.hide();
    }
    /*#static*/ if (_TRACE) global.outdent;
    return;
  }

  #refresh_to: number | undefined;
  toRefresh() {
    clearTimeout(this.#refresh_to);
    this.#refresh_to = setTimeout(this.refresh_Scronr, 500);
  }

  readonly #resizob = new ResizeObserver(this._onResiz);
  @bind
  @traceOut(_TRACE && RESIZ)
  private _onResiz() {
    /*#static*/ if (_TRACE && RESIZ) {
      console.log(
        `%c${global.indent}>>>>>>> ${this._type_id_}._onResiz() >>>>>>>`,
        `color:${LOG_cssc.resiz}`,
      );
    }
    if (!this.el$.isConnected || !this.#scrolrInited) return;

    this.refresh_Scronr();
  }

  /** `in( this.#scrolrInited )` */
  @bind
  // @traceOut(_TRACE)
  private _onScroll_scrolr() {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type}._onScroll_scrolr() >>>>>>>`,
    //   );
    // }
    const scrollLeft = this.#scrolr.el.scrollLeft;
    const scrollTop = this.#scrolr.el.scrollTop;
    // console.log({ scrollLeft, scrollTop });

    const newScrollBStrt = Math.abs(
      this.writingMode & WritingDir.h ? scrollTop : scrollLeft,
    );
    if (!Number.apxE(newScrollBStrt, this.#scrollBStrt)) {
      // console.log("block: ", {
      //   newScrollBStrt,
      //   "#scrollBStrt": this.#scrollBStrt,
      // });
      this.#scrobarB.show();
      this.#setSlidrBStrt(this.#calcSlidrBStrt(newScrollBStrt));
      this.#scrollBStrt = newScrollBStrt;
    }

    const newScrollIStrt = Math.abs(
      this.writingMode & WritingDir.h ? scrollLeft : scrollTop,
    );
    if (!Number.apxE(newScrollIStrt, this.#scrollIStrt)) {
      // console.log("inline: ", {
      //   newScrollIStrt,
      //   "#scrollIStrt": this.#scrollIStrt,
      // });
      this.#scrobarI.show();
      this.#setSlidrIStrt(this.#calcSlidrIStrt(newScrollIStrt));
      this.#scrollIStrt = newScrollIStrt;
    }
  }

  /** `in( this.#scrolrInited )` */
  @bind
  // @traceOut(_TRACE)
  private _onWheel(evt_x: WheelEvent) {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id_}._onWheel(`,
    //     evt_x._repr,
    //     `) >>>>>>>`,
    //   );
    // }
    this.scrollScrolrBy(
      evt_x.deltaY > 0 ? 50 : -50,
      evt_x.shiftKey ? "horz" : undefined,
    );
  }
}
/*64----------------------------------------------------------*/

/** Scrolller, the `HTMLVuu` being scrolled */
export abstract class Scrolr<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  readonly host;

  get bufrDir(): BufrDir {
    return BufrDir.ltr;
  }

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x.coo, div());
    this.host = host_x;

    this.assignStylo({
      gridArea: "frst-line / frst-line / last-line / last-line",
    });
  }
}
/*64----------------------------------------------------------*/

/** Scroll rod */
abstract class Scrod_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  static readonly thick = 2;

  readonly host;

  #shown = false;
  get shown() {
    return this.#shown;
  }
  show() {
    this.el$.style.display = "unset";
    this.#shown = true;
  }
  hide() {
    this.el$.style.display = "none";
    this.#shown = false;
  }

  abstract readonly scrodicatr: Scrodicatr_<C>;

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x.coo, div());
    this.host = host_x;

    this.assignStylo({
      position: "relative",
      zIndex: Scrod_z,

      backgroundColor: host_x.scrod_cp.cssc,
    });
    this.hide();
  }
}

/**
 * Block scroll rod
 * @final
 */
class ScrodB_<C extends Coo> extends Scrod_<C> {
  /** @implement */
  readonly scrodicatr;

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x);

    this.assignStylo({
      gridArea: "frst-line / 2 / last-line / last-line",
    });

    this.scrodicatr = new ScrodicatrB_(this);

    this.el$.append(
      this.scrodicatr.el,
    );
  }
}

/**
 * Inline scroll rod
 * @final
 */
class ScrodI_<C extends Coo> extends Scrod_<C> {
  /** @implement */
  readonly scrodicatr;

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x);

    this.assignStylo({
      gridArea: "2 / frst-line / last-line / last-line",
    });

    this.scrodicatr = new ScrodicatrI_(this);

    this.el$.append(
      this.scrodicatr.el,
    );
  }
}
/*49-------------------------------------------*/

/** Scroll indicator */
abstract class Scrodicatr_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  /** @headconst @param host_x */
  constructor(host_x: Scrod_<C>) {
    super(host_x.coo, div());

    this.assignStylo({
      position: "absolute",

      backgroundColor: host_x.host.scrodicatr_cp.cssc,
    });
  }
}

/**
 * Block scroll indicator
 * @final
 */
class ScrodicatrB_<C extends Coo> extends Scrodicatr_<C> {
  constructor(host_x: ScrodB_<C>) {
    super(host_x);

    this.assignStylo({
      inlineSize: "100%",
    });
  }
}

/**
 * Inline scroll indicator
 * @final
 */
class ScrodicatrI_<C extends Coo> extends Scrodicatr_<C> {
  constructor(host_x: ScrodI_<C>) {
    super(host_x);

    this.assignStylo({
      blockSize: "100%",
    });
  }
}
/*64----------------------------------------------------------*/

/** In milliseconds */
const Hide_to_ = 500;

/** Scrollbar */
abstract class Scrobar_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  readonly host;

  /** inline-start or block-start */
  protected strt$ = Number.MAX_SAFE_INTEGER;
  get strt() {
    return this.strt$;
  }
  set strt(_x: unum) {
    fail("Disabled");
  }

  strtMax = 0;
  protected abstract setStrtMax$(): void;

  /* shown$ */
  protected shown$ = false;
  /** @final */
  get shown() {
    return this.shown$;
  }

  /** @final */
  show() {
    clearTimeout(this.hide_to$);
    // console.log(`%crun here: show()`, `color:${LOG_cssc.runhere}`);
    this.hide_to$ = setTimeout(this.hide, Hide_to_ * 2);

    if (this.shown$) return;

    this.el$.style.display = "unset";

    this.setStrtMax$();
    // console.log({ strt: this.strt, strtMax: this.strtMax });
    if (this.strt$ > this.strtMax) this.strt = this.strtMax;
    this.shown$ = true;
  }

  protected hide_to$: number | undefined;
  get hide_to() {
    return this.hide_to$;
  }
  readonly hide = () => {
    this.el$.style.display = "none";
    this.shown$ = false;
  };
  /* ~ */

  abstract readonly slidr: Slidr_<C>;

  /** `Moo` of `Slidr_` block-start or inline-start */
  readonly slidrStrt_mo = new Moo({ val: 0 });

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x.coo, div());
    this.host = host_x;

    this.assignStylo({
      display: "none",
      position: "absolute",
      zIndex: Scrobar_z,

      backgroundColor: host_x.scrobar_cp.cssc,
    });

    if (global.can_hover) {
      this.on("pointerenter", this.onPointerEnter);
      this.on("pointerleave", this.onPointerLeave);
    }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  readonly onPointerEnter = () => {
    clearTimeout(this.hide_to$);
  };
  readonly onPointerLeave = () => {
    clearTimeout(this.hide_to$);
    // console.log(`%crun here: onPointerLeave`, `color:${LOG_cssc.runhere}`);
    this.hide_to$ = setTimeout(this.hide, Hide_to_);
  };
}

/**
 * Block scrollbar
 * @final
 */
class ScrobarB_<C extends Coo> extends Scrobar_<C> {
  override set strt(_x: unum) {
    this.el$.style.insetInlineStart = `${_x}px`;
  }

  /** @implement */
  protected setStrtMax$() {
    this.strtMax = this.host.writingMode & WritingDir.h
      ? this.host.el.clientWidth - this.el$.clientWidth
      : this.host.el.clientHeight - this.el$.clientHeight;
  }

  /** @implement */
  readonly slidr;

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x);

    this.assignStylo({
      blockSize: "100%",
      inlineSize: "min(50px,70%)",
    });

    this.slidr = new SlidrB_(this);

    this.el$.append(
      this.slidr.el,
    );

    this.slidrStrt_mo.registHandler((n_y) => {
      this.host.scrollScrolrTo(this.host.calcScrollBStrt_$(n_y));
    });
  }
}

/**
 * Inline scrollbar
 * @final
 */
class ScrobarI_<C extends Coo> extends Scrobar_<C> {
  override set strt(_x: unum) {
    this.el$.style.insetBlockStart = `${_x}px`;
  }

  /** @implement */
  protected setStrtMax$() {
    this.strtMax = this.host.writingMode & WritingDir.h
      ? this.host.el.clientHeight - this.el$.clientHeight
      : this.host.el.clientWidth - this.el$.clientWidth;
  }

  /** @implement */
  readonly slidr;

  /** @headconst @param host_x */
  constructor(host_x: Scronr<C>) {
    super(host_x);

    this.assignStylo({
      blockSize: "min(50px,70%)",
      inlineSize: "100%",
    });

    this.slidr = new SlidrI_(this);

    this.el$.append(
      this.slidr.el,
    );

    this.slidrStrt_mo.registHandler((n_y) => {
      const istrt = this.host.calcScrollIStrt_$(n_y);
      this.host.scrollScrolrTo(
        this.host.bufrDir === BufrDir.ltr ? istrt : -istrt,
        "horz",
      );
    });
  }
}
/*49-------------------------------------------*/

/** Slider */
abstract class Slidr_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  static readonly size_MIN = 20;

  protected readonly host$;
  /** @final */
  protected get scronr$(): Scronr<C> {
    return this.host$.host;
  }

  /** @headconst @param host_x */
  constructor(host_x: Scrobar_<C>) {
    super(host_x.coo, div());
    this.host$ = host_x;

    this.assignStylo({
      position: "absolute",

      backgroundColor: host_x.host.slidr_cp.cssc,
    });

    this.on("pointerdown", this.#onPointerDown);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  protected abstract set_0$(): void;
  protected abstract apply_0$(dtB_x: number, dtI_x: number): void;

  protected bufrDir$!: BufrDir;
  protected writingMode$!: WritingMode;
  #clientX = 0;
  #clientY = 0;
  #onPointerDown = (evt_x: PointerEvent) => {
    if (evt_x.button === MouseButton.Main) {
      evt_x.stopPropagation();

      this.bufrDir$ = this.scronr$.bufrDir;
      this.writingMode$ = this.scronr$.writingMode;
      this.set_0$();
      this.#clientX = evt_x.clientX;
      this.#clientY = evt_x.clientY;

      clearTimeout(this.host$.hide_to);
      g_getRootVCo()?.on("pointermove", this.#onPointerMove);
      g_getRootVCo()?.on("pointerup", this.#onPointerUp);
      if (global.can_hover) {
        this.host$.off("pointerenter", this.host$.onPointerEnter);
        this.host$.off("pointerleave", this.host$.onPointerLeave);
      }
    }
  };

  #onPointerMove = (evt_x: PointerEvent) => {
    const dtX = evt_x.clientX - this.#clientX;
    const dtY = evt_x.clientY - this.#clientY;
    this.apply_0$(
      /* final switch */ {
        [WritingMode.htb]: dtY,
        [WritingMode.vrl]: -dtX,
        [WritingMode.vlr]: dtX,
      }[this.writingMode$],
      /* final switch */ {
        [BufrDir.ltr]: /* final switch */ {
          [WritingMode.htb]: dtX,
          [WritingMode.vrl]: dtY,
          [WritingMode.vlr]: dtY,
        }[this.writingMode$],
        [BufrDir.rtl]: /* final switch */ {
          [WritingMode.htb]: -dtX,
          [WritingMode.vrl]: -dtY,
          [WritingMode.vlr]: -dtY,
        }[this.writingMode$],
      }[this.bufrDir$],
    );
  };

  #onPointerUp = (evt_x: PointerEvent) => {
    evt_x.stopPropagation();

    g_getRootVCo()?.off("pointermove", this.#onPointerMove);
    g_getRootVCo()?.off("pointerup", this.#onPointerUp);
    if (global.can_hover) {
      this.host$.on("pointerenter", this.host$.onPointerEnter);
      this.host$.on("pointerleave", this.host$.onPointerLeave);
    }
  };
}

/**
 * Block slider
 * @final
 */
class SlidrB_<C extends Coo> extends Slidr_<C> {
  /** @headconst @param host_x */
  constructor(host_x: ScrobarB_<C>) {
    super(host_x);

    this.assignStylo({
      inlineSize: "100%",
    });
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** block-start */
  #bStrt_0 = 0;
  /** `ScrobarB_` inline-start */
  #scrobarIStrt_0 = 0;
  /** @implement */
  protected set_0$(): void {
    /* final switch */ ({
      [WritingMode.htb]: () => {
        this.#bStrt_0 = this.el$.viewTop;
        this.#scrobarIStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.host$.el.viewLeft
          : this.scronr$.el.clientWidth - this.host$.el.viewRight;
      },
      [WritingMode.vrl]: () => {
        this.#bStrt_0 = this.host$.el.clientWidth - this.el$.viewRight;
        this.#scrobarIStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.host$.el.viewTop
          : this.scronr$.el.clientHeight - this.host$.el.viewBottom;
      },
      [WritingMode.vlr]: () => {
        this.#bStrt_0 = this.el$.viewLeft;
        this.#scrobarIStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.host$.el.viewTop
          : this.scronr$.el.clientHeight - this.host$.el.viewBottom;
      },
    }[this.writingMode$])();
  }

  /** @implement */
  // @traceOut(_TRACE)
  protected apply_0$(dtB_x: number, dtI_x: number): void {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id_}.apply_0$( ${dtB_x}, ${dtI_x}) >>>>>>>`,
    //   );
    // }
    this.host$.slidrStrt_mo.val = this.#bStrt_0 + dtB_x;
    this.host$.strt = Math.clamp(
      0,
      this.#scrobarIStrt_0 + dtI_x,
      this.host$.strtMax,
    );
  }
}

/**
 * Inline slider
 * @final
 */
class SlidrI_<C extends Coo> extends Slidr_<C> {
  /** @headconst @param host_x */
  constructor(host_x: ScrobarI_<C>) {
    super(host_x);

    this.assignStylo({
      blockSize: "100%",
    });
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** inline-start */
  #iStrt_0 = 0;
  /** `ScrobarI_` block-start */
  #scrobarBStrt_0 = 0;
  /** @implement */
  protected set_0$(): void {
    /* final switch */ ({
      [WritingMode.htb]: () => {
        this.#iStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.el$.viewLeft
          : this.scronr$.el.clientWidth - this.el$.viewRight;
        this.#scrobarBStrt_0 = this.host$.el.viewTop;
      },
      [WritingMode.vrl]: () => {
        this.#iStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.el$.viewTop
          : this.scronr$.el.clientHeight - this.el$.viewBottom;
        this.#scrobarBStrt_0 = this.scronr$.el.clientWidth -
          this.host$.el.viewRight;
      },
      [WritingMode.vlr]: () => {
        this.#iStrt_0 = this.bufrDir$ === BufrDir.ltr
          ? this.el$.viewTop
          : this.scronr$.el.clientHeight - this.el$.viewBottom;
        this.#scrobarBStrt_0 = this.host$.el.viewLeft;
      },
    }[this.writingMode$])();
    // console.log({
    //   "#iStrt_0": this.#iStrt_0,
    //   "#scrobarBStrt_0": this.#scrobarBStrt_0,
    // });
  }

  /** @implement */
  // @traceOut(_TRACE)
  protected apply_0$(dtB_x: number, dtI_x: number) {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id_}.apply_0$( ${dtB_x}, ${dtI_x}) >>>>>>>`,
    //   );
    // }
    this.host$.slidrStrt_mo.val = this.#iStrt_0 + dtI_x;
    this.host$.strt = Math.clamp(
      0,
      this.#scrobarBStrt_0 + dtB_x,
      this.host$.strtMax,
    );
  }
}
/*80--------------------------------------------------------------------------*/
