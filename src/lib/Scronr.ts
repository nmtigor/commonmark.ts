/** 80**************************************************************************
 * @module lib/Scronr
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../alias.ts";
import { _TRACE, DEV, g_vco, global, INOUT, RESIZ } from "../global.ts";
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

/**
 * Scroll container
 */
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

  #scrolr!: Scrolr<C>;
  readonly #scrodB: ScrodB_<C>;
  readonly #scrodI: ScrodI_<C>; //kkkk make it in use
  readonly #scrobarB: ScrobarB_<C>;
  readonly #scrobarI: ScrobarI_<C>; //kkkk make it in use

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

  #clientHigt = 0;
  get clientHigt() {
    return this.#clientHigt;
  }
  #scrollHigt = 0;
  get scrollHigt() {
    return this.#scrollHigt;
  }

  /**
   * @headconst @param coo_x
   */
  constructor(coo_x: C) {
    super(coo_x, div());

    /*#static*/ if (DEV) {
      this.el$.id = this._type_id;
    }
    this.assignStylo({
      display: "grid",
      position: "relative",
      contain: "size",
      isolation: "isolate", // to form a new stacking context
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
   * This method does not need to be called, i.e., it could be `!#scrolrInited`,
   * and `#scrolr` is not set.
   *
   * @final
   * @headconst @param scrolr_x
   */
  initScrolr(scrolr_x: Scrolr<C>) {
    /*#static*/ if (INOUT) {
      assert(!this.#scrolrInited);
    }
    this.#scrolr = scrolr_x;

    /* Styles set here to make sure the highest priority */
    scrolr_x.assignStylo({
      overflow: "hidden",
    });

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
  syncLayout(lo_x?: Required<SetLayoutP>) {
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
   * @param bstrt_x block-start change
   */
  scrollScrolrBy(bstrt_x: number) {
    /* final switch */ ({
      [WritingMode.htb]: () => {
        scrollO.top = bstrt_x;
        scrollO.left = 0;
      },
      [WritingMode.vrl]: () => {
        scrollO.top = 0;
        scrollO.left = -bstrt_x; //!
      },
      [WritingMode.vlr]: () => {
        scrollO.top = 0;
        scrollO.left = bstrt_x;
      },
    }[this.writingMode])();
    this.#scrolr.el.scrollBy(scrollO);
  }

  /**
   * @param bstrt_x block-start value
   */
  scrollScrolrTo(bstrt_x: number) {
    /* final switch */ ({
      [WritingMode.htb]: () => {
        scrollO.top = bstrt_x;
        scrollO.left = 0;
      },
      [WritingMode.vrl]: () => {
        scrollO.top = 0;
        scrollO.left = -bstrt_x; //!
      },
      [WritingMode.vlr]: () => {
        scrollO.top = 0;
        scrollO.left = bstrt_x;
      },
    }[this.writingMode])();
    this.#scrolr.el.scrollTo(scrollO);
  }

  /**
   * @param bstrt_x block-start value
   */
  scrollSlidrTo(bstrt_x: unum) {
    this.#scrodB.scrodicatr.el.style.insetBlockStart =
      this.#scrobarB.slidr.el.style.insetBlockStart =
        `${bstrt_x}px`;
  }

  /**
   * Also update `#clientHigt`, `#scrollHigt`
   * @final
   */
  readonly refresh = () => {
    // console.log(`%crun here: refresh()`, `color:${LOG_cssc.runhere}`);
    if (!this.el$.isConnected || !this.#scrolrInited) return;

    const wm_ = this.writingMode;
    const el_ = this.#scrolr.el;
    this.#clientHigt = wm_ & WritingDir.h ? el_.clientHeight : el_.clientWidth;
    this.#scrollHigt = wm_ & WritingDir.h ? el_.scrollHeight : el_.scrollWidth;
    // console.log({
    //   clientHigt: this.#clientHigt,
    //   scrollHigt: this.#scrollHigt,
    // });

    /** `Scrolr` block-start */
    const scrolrBStrt = Math.abs(
      wm_ & WritingDir.h ? el_.scrollTop : el_.scrollLeft,
    );
    if (0 < this.#clientHigt && this.#clientHigt < this.#scrollHigt) {
      this.#scrodB.show();
      this.#scrodB.scrodicatr.el.style.blockSize =
        this.#scrobarB.slidr.el.style.blockSize =
          `${this.#clientHigt ** 2 / this.#scrollHigt}px`;
      this.scrollSlidrTo(
        (scrolrBStrt * this.#clientHigt / this.#scrollHigt) as unum,
      );
    } else {
      this.#scrodB.hide();
      this.#scrobarB.hide();
    }
  };

  #refresh_to: number | undefined;
  toRefresh() {
    clearTimeout(this.#refresh_to);
    this.#refresh_to = setTimeout(this.refresh, 500);
  }

  readonly #resizob = new ResizeObserver(this._onResiz);
  @bind
  @traceOut(_TRACE && RESIZ)
  private _onResiz() {
    /*#static*/ if (_TRACE && RESIZ) {
      console.log(
        `%c${global.indent}>>>>>>> ${this._type_id}._onResiz() >>>>>>>`,
        `color:${LOG_cssc.resiz}`,
      );
    }
    if (!this.el$.isConnected || !this.#scrolrInited) return;

    this.refresh();
  }

  /**
   * `in( this.#scrolrInited )`
   */
  @bind
  // @traceOut(_TRACE)
  private _onScroll_scrolr() {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type}._onScroll_scrolr() >>>>>>>`,
    //   );
    // }
    this.#scrobarB.show();

    /** `Scrolr` block-start */
    const scrolrBStrt = Math.abs(
      this.writingMode & WritingDir.h
        ? this.#scrolr.el.scrollTop
        : this.#scrolr.el.scrollLeft,
    );
    this.scrollSlidrTo(
      (scrolrBStrt * this.#clientHigt / this.#scrollHigt) as unum,
    );
  }

  /**
   * `in( this.#scrolrInited )`
   */
  @bind
  // @traceOut(_TRACE)
  private _onWheel(evt_x: WheelEvent) {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id}._onWheel(`,
    //     evt_x._repr,
    //     `) >>>>>>>`,
    //   );
    // }
    this.scrollScrolrBy(evt_x.deltaY > 0 ? 50 : -50);
  }
}
/*64----------------------------------------------------------*/

/**
 * Scrolller, the `HTMLVuu` being scrolled
 */
export abstract class Scrolr<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  readonly host;

  get bufrDir(): BufrDir {
    return BufrDir.ltr;
  }

  /**
   * @headconst @param host_x
   */
  constructor(host_x: Scronr<C>) {
    super(host_x.coo, div());
    this.host = host_x;

    this.assignStylo({
      gridArea: "frst-line / frst-line / last-line / last-line",
    });
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
}
/*64----------------------------------------------------------*/

/**
 * Scroll rod
 */
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

  /**
   * @headconst @param host_x
   */
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

  /**
   * @headconst @param host_x
   */
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

  /**
   * @headconst @param host_x
   */
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

/**
 * Scroll indicator
 */
abstract class Scrodicatr_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  /**
   * @headconst @param host_x
   */
  constructor(host_x: Scrod_<C>) {
    super(host_x.coo, div());

    this.assignStylo({
      position: "absolute",

      inlineSize: "100%",
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
  strt = Number.MAX_SAFE_INTEGER;
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
    if (this.shown$) return;

    this.el$.style.display = "unset";

    this.setStrtMax$();
    // console.log({ strt: this.strt, strtMax: this.strtMax });
    if (this.strt > this.strtMax) {
      this.strt = this.strtMax;
      this.el$.style.insetInlineStart = `${this.strt}px`;
    }
    this.shown$ = true;

    clearTimeout(this.hide_to$);
    // console.log(`%crun here: show()`, `color:${LOG_cssc.runhere}`);
    this.hide_to$ = setTimeout(this.hide, Hide_to_ * 2);
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
  readonly slidrBStrt_mo = new Moo({ val: 0 as unum });

  /**
   * @headconst @param host_x
   */
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
  /** @implement */
  protected setStrtMax$() {
    this.strtMax = this.host.writingMode & WritingDir.h
      ? this.host.el.clientWidth - this.el$.clientWidth
      : this.host.el.clientHeight - this.el$.clientHeight;
  }

  /** @implement */
  readonly slidr;

  /**
   * @headconst @param host_x
   */
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

    this.slidrBStrt_mo.registHandler((n_y) => {
      this.host.scrollScrolrTo(
        n_y / (this.host.clientHigt / this.host.scrollHigt),
      );
    });
  }
}

/**
 * Inline scrollbar
 * @final
 */
class ScrobarI_<C extends Coo> extends Scrobar_<C> {
  /** @implement */
  protected setStrtMax$() {
    fail("Not implemented");
  }

  /** @implement */
  readonly slidr;

  /**
   * @headconst @param host_x
   */
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

    this.slidrBStrt_mo.registHandler((n_y) => {
      //kkkk
      // this.host.scrollScrolrTo(
      //   n_y / (this.host.clientHigt / this.host.scrollHigt),
      // );
    });
  }
}
/*49-------------------------------------------*/

/** Slider */
abstract class Slidr_<C extends Coo> extends HTMLVuu<C, HTMLDivElement> {
  protected readonly host$;
  /** @final */
  protected get scronr$(): Scronr<C> {
    return this.host$.host;
  }

  /**
   * @headconst @param host_x
   */
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
      g_vco().on("pointermove", this.#onPointerMove);
      g_vco().on("pointerup", this.#onPointerUp);
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
      this.writingMode$ & WritingDir.h ? dtY : dtX,
      this.writingMode$ & WritingDir.h ? dtX : dtY,
    );
  };

  #onPointerUp = (evt_x: PointerEvent) => {
    evt_x.stopPropagation();

    g_vco().off("pointermove", this.#onPointerMove);
    g_vco().off("pointerup", this.#onPointerUp);
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
  /**
   * @headconst @param host_x
   */
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
  protected apply_0$(dtB_x: number, dtI_x: number): void {
    this.host$.slidrBStrt_mo.val = this.writingMode$ === WritingMode.vrl
      ? (this.#bStrt_0 - dtB_x) as unum
      : (this.#bStrt_0 + dtB_x) as unum;
    this.host$.strt = Math.clamp(
      0,
      this.bufrDir$ === BufrDir.ltr
        ? this.#scrobarIStrt_0 + dtI_x
        : this.#scrobarIStrt_0 - dtI_x,
      this.host$.strtMax,
    );
    this.host$.el.style.insetInlineStart = `${this.host$.strt}px`;
  }
}

/**
 * Inline slider
 * @final
 */
class SlidrI_<C extends Coo> extends Slidr_<C> {
  /**
   * @headconst @param host_x
   */
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
    fail("Not implemented");
  }

  /** @implement */
  protected apply_0$(dtB_x: number, dtI_x: number) {
    fail("Not implemented");
  }
}
/*80--------------------------------------------------------------------------*/
