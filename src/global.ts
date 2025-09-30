/** 80**************************************************************************
 * This module is loaded with top priority!
 *
 * @module global
 * @license BSD-3-Clause
 ******************************************************************************/

import type { HTMLVCo } from "@fe-lib/cv.ts";
import { Hover, Pointer } from "./lib/alias.ts";
import { assert, out } from "./lib/util.ts";
import { trace } from "./lib/util/trace.ts";
import { _TRACE, AUTOTEST, CYPRESS, RESIZ } from "./preNs.ts";
/*80--------------------------------------------------------------------------*/

export const global = new class {
  /** @deprecated Use preprocessor */
  testing = false;

  readonly LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
  readonly LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
  readonly LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  serveStatic = false;
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  //jjjj TOCLEANUP
  // vco?: MainWindlBase;
  // // holdindicatr?: [HoldIndicatr, HoldIndicatr, HoldIndicatr];

  mwCap = Promise.withResolvers<HTMLVCo>();
  /**
   * This is actually of type `MainWindlBase | undefined`. Using `HTMLVCo` here
   * is to prevent from importing `MainWindlBase`, which will further  import
   * many "premsys codes", which is bad for subprojects like "commonmark.ts",
   * "set.ts".
   *
   * This can be regarded as decoupling point between outer "premsys codes" and
   * inner "buffer codes".
   */
  mw: HTMLVCo | undefined;
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** @deprecated */
  has_ResizeObserver = false;
  /** @deprecated */
  can_touchstart = false;

  pointer = Pointer.none;
  anyPointer = Pointer.none;
  #mockTouch: boolean | undefined;
  get can_touch() {
    return this.#mockTouch ??
      (navigator.maxTouchPoints > 0 &&
        (this.anyPointer === Pointer.coarse || "ontouchstart" in globalThis));
  }

  hover = Hover.none;
  anyHover = Hover.none;
  #mockHover: boolean | undefined;
  get can_hover() {
    return this.#mockHover ??
      this.anyHover === Hover.hover;
  }

  @out((self: typeof global) => {
    assert(self.can_touch);
    assert(!self.can_hover);
  })
  mockTouch() {
    this.#mockTouch = true;
    this.#mockHover = false;
  }

  // /* For testing only */
  // #_touch: Pointer | undefined;
  // set _touch(b_x: boolean | undefined) {
  //   this.#_touch ??= this.anyPointer;
  //   if (b_x === undefined) {
  //     global.anyPointer = this.#_touch;
  //   } else {
  //     if (b_x) {
  //       global.anyPointer = Pointer.coarse;
  //     } else {
  //       global.anyPointer = Pointer.fine;
  //     }
  //   }
  // }

  // #_hover: Hover | undefined;
  // set _hover(b_x: boolean | undefined) {
  //   this.#_hover ??= this.anyHover;
  //   if (b_x === undefined) {
  //     global.anyHover = this.#_hover;
  //   } else {
  //     if (b_x) {
  //       global.anyHover = Hover.hover;
  //     } else {
  //       global.anyHover = Hover.none;
  //     }
  //   }
  // }
  // /* ~ */
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  /** OPFS root directory handle */
  opfs!: FileSystemDirectoryHandle;

  locl: {
    bk: "bk-dev" | "bk-dev-t";
  } = {
    bk: /*#static*/ CYPRESS ? "bk-dev-t" : "bk-dev",
  };
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON() {
    return {
      serveStatic: this.serveStatic,

      can_touch: this.can_touch,
      can_hover: this.can_hover,

      locl: this.locl,
    };
  }
}();

global.mwCap.promise.then((mw) => global.mw = mw);
/*80--------------------------------------------------------------------------*/

//jjjj TOCLEANUP
// // export const g_getRootVCo: () => HTMLVCo | undefined = () => global.vco as any;
// export const g_getRootVCo = () => global.vco as HTMLVCo | undefined;

export const g_onresize = () => {
  /*#static*/ if (_TRACE && RESIZ) {
    console.log(
      `%c${trace.indent}>>>>>>> window.on("resize") >>>>>>>`,
      "color:#ffcd4a",
    );
  }
  /*#static*/ if (_TRACE && RESIZ) {
    console.log(
      `${trace.dent}w:${document.documentElement.clientWidth}, h:${document.documentElement.clientHeight}`,
    );
    trace.outdent;
  }
};

export const g_onerror = (evt_x: ErrorEvent) => {
  const mw_ = global.mw;
  if (mw_) mw_.el.style.backgroundColor = "#61bed4";

  /*#static*/ if (!AUTOTEST) {
    mw_?.ci.reportError?.(evt_x.error);
  }
};

export const g_onunhandledrejection = (evt_x: PromiseRejectionEvent) => {
  const mw_ = global.mw;
  if (mw_) mw_.el.style.backgroundColor = "#b6d361";

  /*#static*/ if (!AUTOTEST) {
    mw_?.ci.reportError?.(evt_x.reason);
  }
};
/*80--------------------------------------------------------------------------*/

/*
Before runtimes support it natively...

Ref. https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management
*/
(Symbol as any).dispose ??= Symbol("Symbol.dispose");
(Symbol as any).asyncDispose ??= Symbol("Symbol.asyncDispose");
/*80--------------------------------------------------------------------------*/
