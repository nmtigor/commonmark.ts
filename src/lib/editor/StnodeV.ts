/** 80**************************************************************************
 * @module lib/editor/StnodeV
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Line } from "@fe-cpl/Line.ts";
import { CYPRESS, INOUT } from "../../global.ts";
import type { id_t, ldt_t, loff_t, uint } from "../alias.ts";
import type { BaseTok } from "../compiling/BaseTok.ts";
import type { Stnode } from "../compiling/Stnode.ts";
import type { Token } from "../compiling/Token.ts";
import type { Tok } from "../compiling/alias.ts";
import { HTMLVuu } from "../cv.ts";
import { $loff, $vuu } from "../symbols.ts";
import { assert } from "../util/trace.ts";
import { CtorRest, type ReplRest } from "./CtorRest.ts";
import type { ELineBase } from "./ELineBase.ts";
import type { EdtrBase, EdtrBaseCI } from "./EdtrBase.ts";
import * as Is from "../util/is.ts";
/*80--------------------------------------------------------------------------*/

/** "Code" mode */
export abstract class StnodeV<
  T extends Tok = BaseTok,
  CI extends EdtrBaseCI = EdtrBaseCI,
  E extends HTMLElement = HTMLElement,
> extends HTMLVuu<EdtrBase<CI>, E> {
  static #ID = 0 as id_t;
  /** @final */
  override readonly id = ++StnodeV.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  static readonly ctorRest = new CtorRest();

  abstract get eline_$(): ELineBase<CI>;
  /** @final */
  get bline_$(): Line {
    return this.eline_$.bline_$;
  }
  // get initBLidx_$() {
  //   return this.eline_$.initBLidx_$;
  // }

  protected strtLoff$!: loff_t;
  get strtLoff_$(): loff_t {
    return this.strtLoff$;
  }
  protected stopLoff$!: loff_t;
  /** @final */
  get stopLoff_$(): loff_t {
    return this.stopLoff$;
  }
  translate_$(ldt_x: ldt_t) {
    this.strtLoff$ += ldt_x;
    this.stopLoff$ += ldt_x;
    for (const subNd of this.el$.childNodes) {
      if (subNd.isText) {
        (subNd as Text)[$loff] += ldt_x;
      } else {
        (subNd[$vuu] as StnodeV | undefined)?.translate_$(ldt_x);
      }
    }
  }

  // protected initRanval$: Ranval | undefined;
  // /** @final */
  // get initRanval_$() {
  //   return this.initRanval$ ??= new Ranval(
  //     this.initBLidx_$,
  //     this.strtLoff$,
  //     this.initBLidx_$,
  //     this.stopLoff$,
  //   );
  // }

  //llll review: should be frstToken?
  /**
   * kkkk (really? example?)
   * Notice, `strtToken$.sntFrstLine` could be after `bline_$`, in which case
   * there is no token on `bline_$`. //jjjj and `this.strtToken$ === this.stopToken$`.
   */
  protected strtToken$!: Token<T>;
  /** @final */
  get strtToken_$(): Token<T> {
    return this.strtToken$;
  }
  //llll review: should be lastToken?
  protected stopToken$!: Token<T>;
  /** @final */
  get stopToken_$(): Token<T> {
    return this.stopToken$;
  }

  protected abstract snt$: Stnode<T> | Token<T>;

  /* broken$ */
  protected broken$ = false;
  /** @final */
  get broken_$() {
    return this.broken$;
  }

  /**
   * Set `broken$`.
   * @final
   * @headconst @param subV_x
   * @return `subV_x.stopToken$`
   */
  brokenBy_$(subV_x: StnodeV<T, CI, E>): Token<T> {
    const ret = subV_x.stopToken$;
    if (this.snt$.sntStopLoc.posSE(ret.sntStrtLoc)) {
      /* `ret` is after `snt$`, so `subV_x` corresponds to the last sub-Stnode
      of `snt$`. */
      this.broken$ ||= subV_x.broken$;
    } else {
      /*
      `ret` is in `snt$`, so `subV_x` corresponds to a non-last sub-Stnode of
      `snt$`.
      For the case `!subV_x.broken$`, consider the second line of
      [
        '   a "b',
        '"  ',
      ]
      '"b\n"' is not broken at second line, but it's `frstLine` is before
      `bline_$, so `this` is also broken.
      */
      this.broken$ ||= subV_x.broken$ ||
        !subV_x.broken$ && ret.sntFrstLine !== this.bline_$;
    }
    return ret;
  }
  /* ~ */

  //kkkk
  protected rich$?: unknown;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @const @param loff_x
   */
  caretNodeAt(loff_x: loff_t): HTMLElement | Text {
    let ret;
    let loff = 0, loff_1 = 0;
    for (const subNd of this.el$.childNodes) {
      if (subNd.isText) {
        loff = (subNd as Text)[$loff] ?? 0;
        loff_1 = loff + (subNd as Text).length;
        if (loff <= loff_x && loff_x < loff_1) {
          ret = subNd as Text;
          break;
        }
      } else {
        /*#static*/ if (INOUT) {
          assert(subNd[$vuu] instanceof StnodeV);
        }
        loff = (subNd[$vuu] as StnodeV).strtLoff_$;
        loff_1 = (subNd[$vuu] as StnodeV).stopLoff_$;
        if (loff <= loff_x && loff_x < loff_1) {
          ret = (subNd[$vuu] as StnodeV).caretNodeAt(loff_x);
          break;
        }
      }
    }
    return ret!;
  }

  /** Helper */
  protected readonly replRest$: ReplRest = [undefined];
  /**
   * @final
   * @const @param i_x exclusive
   * @const @param ldt_x
   */
  protected setReplRest$(i_x: uint, ldt_x: ldt_t) {
    const subV = this.el$.childNodes[i_x][$vuu] as StnodeV<T, CI, E>;
    /*#static*/ if (INOUT) {
      assert(subV instanceof StnodeV);
    }
    if (StnodeV.ctorRest.inuse) {
      /*#static*/ if (INOUT) {
        assert(i_x === this.el$.childNodes.length - 1);
        assert(ldt_x === 0);
      }
      const rest = StnodeV.ctorRest.replRest_$!;
      let nd_i: Node | undefined;
      for (let i = 0, iI = rest.length - 1; i < iI; ++i) {
        nd_i = rest[i] as Node;
        this.el$.append(nd_i);
        /*#static*/ if (CYPRESS) {
          nd_i["cy.use"] += 1;
        }
      }
      /*#static*/ if (INOUT) {
        assert(!nd_i || nd_i[$vuu] instanceof StnodeV);
      }

      const v_ = nd_i ? (nd_i[$vuu] as StnodeV<T, CI, E>) : subV;
      this.stopLoff$ = v_.stopLoff_$;
      this.broken$ = false;
      this.stopToken$ = v_.stopToken$;
    } else {
      this.replRest$.length = 1;
      this.replRest$[0] = undefined;
      for (let j = this.el$.childNodes.length; j-- && j > i_x;) {
        const nd_j = this.el$.childNodes[j];
        if (subV.broken_$ || this.eline_$.removed) {
          nd_j.remove();
          this.replRest$.unshift(nd_j);
        }
        if (nd_j.isText) {
          (nd_j as Text)[$loff] += ldt_x; //!
        } else {
          (nd_j[$vuu] as StnodeV | undefined)?.translate_$(ldt_x);
        }
      }

      StnodeV.ctorRest.unshift(this.replRest$);

      if (subV.broken$) {
        this.stopLoff$ = subV.stopLoff_$;
        this.broken$ = true;
        this.stopToken$ = subV.stopToken$;
      } else {
        this.stopLoff$ += ldt_x;
      }
    }
  }

  /**
   * Also set `stopLoff$`, `stopToken$`.
   * @final
   */
  protected shortcut$(): boolean {
    const rest = StnodeV.ctorRest.replRest_$;
    const r0_ = rest?.[0];
    if (!rest || r0_ === undefined || Is.array(r0_)) return false;

    for (let i = 0, iI = rest.length - 1; i < iI; ++i) {
      this.el$.append(rest[i] as Node);
      /*#static*/ if (CYPRESS) {
        (rest[i] as Node)["cy.use"] += 1;
      }
    }

    let nd_ = rest.at(-2) as Node;
    if (nd_.isText) {
      this.stopLoff$ = (nd_ as Text).stopLoff;
    } else {
      /*#static*/ if (INOUT) {
        assert(nd_[$vuu] instanceof StnodeV);
      }
      this.stopLoff$ = (nd_[$vuu] as StnodeV<T, CI, E>).stopLoff$;
    }

    /*#static*/ if (INOUT) {
      assert(!this.broken$);
    }

    for (let i = rest.length - 1; i--;) {
      nd_ = rest[i] as Node;
      if (nd_[$vuu] instanceof StnodeV) {
        this.stopToken$ = nd_[$vuu].stopToken$;
        break;
      }
    }
    /*#static*/ if (INOUT) {
      assert(this.stopToken$);
    }
    return true;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  get _info_(): string {
    return `[${this.strtLoff$})${this.stopLoff$} ` +
      `[${this.strtToken$})` +
      `${this.stopToken$ === this.strtToken$ ? "" : this.stopToken$}` +
      `${this.broken$ ? " BROKEN" : ""}`;
  }
}
/*80--------------------------------------------------------------------------*/
