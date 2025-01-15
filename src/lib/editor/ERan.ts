/** 80**************************************************************************
 * @module lib/editor/ERan
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { INOUT, PRF } from "../../global.ts";
import type { id_t, loff_t, uint } from "../alias.ts";
import { Endpt } from "./alias.ts";
import { $facil_node, $ovlap } from "../symbols.ts";
import { Factory } from "../util/Factory.ts";
import { assert, fail } from "../util/trace.ts";
import { ELoc } from "./ELoc.ts";
/*80--------------------------------------------------------------------------*/

declare global {
  interface Node {
    [$facil_node]: boolean;
    [$ovlap]: boolean;
  }
}

/**
 * Wrapper of two `Range`s: `#endpt`, `#range`\
 * Like `Range`, `ERan` has no visual effects. `Caret` has visual effects.
 *
 * Should sync with `EdtrScrolr`s modification as soon as possible.
 *
 * @final
 */
export class ERan {
  static #ID = 0 as id_t;
  readonly id = ++ERan.#ID as id_t;

  /* #anchrELoc */
  readonly #anchrELoc: ELoc;
  get anchrELoc() {
    return this.#anchrELoc;
  }
  get anchrCtnr(): Node {
    return this.#anchrELoc.ctnr_$!;
  }
  get anchrOffs(): uint {
    return this.#anchrELoc.offs_$;
  }
  get anchrLoff(): loff_t {
    return this.#anchrELoc.loff;
  }
  /* ~ */

  /* #focusELoc */
  readonly #focusELoc: ELoc;
  get focusELoc() {
    return this.#focusELoc;
  }
  get focusCtnr(): Node {
    return this.#focusELoc.ctnr_$;
  }
  get focusOffs(): uint {
    return this.#focusELoc.offs_$;
  }
  get focusLoff(): loff_t {
    return this.#focusELoc.loff;
  }
  /* ~ */

  /** @const */
  get collapsed() {
    return this.#anchrELoc.posE(this.#focusELoc);
  }

  readonly #endpt = new Range();
  // get focusRect() { return this.#endpt.getBoundingClientRect(); }

  readonly #range = new Range();
  // get rangeRect() { return this.#range.getBoundingClientRect(); }

  // bran$_:TokRan|null = null;

  // dp_$ = Edran_DP.none; /** used by Caret.#drawFocus() */

  /**
   * @headconst @param focusELoc_x [COPIED]
   * @headconst @param anchrELoc_x [COPIED]
   */
  constructor(focusELoc_x: ELoc, anchrELoc_x?: ELoc) {
    this.#focusELoc = focusELoc_x;
    this.#anchrELoc = anchrELoc_x ?? focusELoc_x.dup();
    /*#static*/ if (INOUT) {
      assert(this.#focusELoc !== this.#anchrELoc);
    }
  }

  /** @const */
  becomeERan(rhs_x: ERan): this {
    this.#focusELoc.ctnr_$ = rhs_x.focusCtnr;
    this.#focusELoc.offs_$ = rhs_x.focusOffs;
    this.#anchrELoc.ctnr_$ = rhs_x.anchrCtnr;
    this.#anchrELoc.offs_$ = rhs_x.anchrOffs;
    return this;
  }

  [Symbol.dispose]() {
    g_eran_fac.revoke(this);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // drop$_()
  // {
  //   this.#anchrELoc = null;
  // }
  // rise$_()
  // {
  //   if( !this.#anchrELoc )
  //     this.#anchrELoc = new ELoc(
  //       this.focusCtnr, this.focusOffs );
  // }

  /** @const */
  posE(rhs_x?: ERan): boolean {
    if (this === rhs_x) return true;
    if (!rhs_x) return false;

    // if (rhs_x.#focusELoc.posE(this.#focusELoc)) {
    //   if (this.collapsed) {
    //     return rhs_x.collapsed;
    //   } else if (!rhs_x.collapsed) {
    //     return rhs_x.#anchrELoc.posE(this.#anchrELoc);
    //   }
    // }
    // return false;
    return rhs_x.#focusELoc.posE(this.#focusELoc) &&
      rhs_x.#anchrELoc.posE(this.#anchrELoc);
  }

  /** @return reversed or not */
  reverse_$(): boolean {
    if (this.collapsed) return false;

    const ctnr = this.focusCtnr;
    const offs = this.focusOffs;
    this.#focusELoc.ctnr_$ = this.anchrCtnr;
    this.#focusELoc.offs_$ = this.anchrOffs;
    this.#anchrELoc.ctnr_$ = ctnr;
    this.#anchrELoc.offs_$ = offs;
    return true;
  }

  /** @return `DOMRect` of synchronized `#endpt` */
  getRecSync_$(_x = Endpt.focus): DOMRect {
    let ret;
    // assert(this.focusCtnr);
    const ctnr = /* final switch */ {
      [Endpt.focus]: this.focusCtnr,
      [Endpt.anchr]: this.anchrCtnr,
    }[_x];
    const offs = /* final switch */ {
      [Endpt.focus]: this.focusOffs,
      [Endpt.anchr]: this.anchrOffs,
    }[_x];
    if (ctnr.isText) {
      this.#endpt.setEnd(ctnr, offs);
      this.#endpt.collapse();
      ret = this.#endpt.getBoundingClientRect();
    } else {
      //jjjj TOCHECK
      let subNd: Node | undefined;
      let i = 0, j = 0;
      const iI = ctnr.childNodes.length;
      for (; i < iI; ++i) {
        if (!ctnr.childNodes[i][$facil_node]) {
          subNd = ctnr.childNodes[i];
          if (j++ === offs) break;
        }
      }
      /*#static*/ if (INOUT) {
        assert(subNd);
      }
      this.#endpt.selectNode(subNd!);
      ret = this.#endpt.getBoundingClientRect();
      if (i === iI) ret.x = ret.right; //!
      ret.width = 0;
    }
    ret[$ovlap] = ctnr[$ovlap]; //!
    // console.log( ret );
    return ret;
  }

  /**
   * ! Range's start is always ahead of end, otherwise `collapsed`.
   * @return synchronized `#range`
   */
  syncRange_$(): Range {
    const ctnr = this.anchrCtnr;
    const offs = this.anchrOffs;
    if (this.collapsed) {
      // assert( this.focusCtnr );
      // this.#range.collapse();

      if (ctnr.isText) {
        this.#range.setEnd(ctnr, offs);
        this.#range.collapse();
      } else {
        this.#range.selectNode(
          ctnr.childNodes[offs],
        );
      }
    } else {
      // assert( this.anchrCtnr );
      // assert( this.focusCtnr );
      this.#range.setStart(ctnr, offs);
      this.#range.setEnd(this.focusCtnr, this.focusOffs);
      if (this.#range.collapsed) {
        this.#range.setEnd(this.anchrCtnr, this.anchrOffs);
      }
    }
    return this.#range;
  }

  /** @const @param ct_x */
  collapse_$(ct_x = EdranCollapseTo.focus) {
    if (this.collapsed) return;

    if (ct_x === EdranCollapseTo.focus) {
      this.#anchrELoc.ctnr_$ = this.focusCtnr;
      this.#anchrELoc.offs_$ = this.focusOffs;
    } else if (ct_x === EdranCollapseTo.anchr) {
      this.#focusELoc.ctnr_$ = this.anchrCtnr;
      this.#focusELoc.offs_$ = this.anchrOffs;
    } else {
      const range = this.syncRange_$();
      if (ct_x === EdranCollapseTo.rangeStrt) {
        this.#focusELoc.ctnr_$ = range.startContainer;
        this.#focusELoc.offs_$ = range.startOffset;
      } else if (ct_x === EdranCollapseTo.rangeStop) {
        this.#focusELoc.ctnr_$ = range.endContainer;
        this.#focusELoc.offs_$ = range.endOffset;
      } else fail();
      this.#anchrELoc.ctnr_$ = this.focusCtnr;
      this.#anchrELoc.offs_$ = this.focusOffs;
    }
  }
}

const enum EdranCollapseTo {
  focus = 1,
  anchr,
  rangeStrt,
  rangeStop,
}
/*64----------------------------------------------------------*/

class ERanFac_ extends Factory<ERan> {
  /** @implement */
  protected createVal$() {
    /*#static*/ if (PRF) {
      console.log(
        `%c# of cached ERan instances: ${this.val_a$.length + 1}`,
        `color:${LOG_cssc.performance}`,
      );
    }
    return new ERan(new ELoc(document, 0));
  }

  protected override resetVal$(i_x: uint) {
    const ret = this.get(i_x);
    ret.focusELoc.ctnr_$ = document;
    ret.focusELoc.offs_$ = 0;
    ret.collapse_$();
    return ret;
  }
}
export const g_eran_fac = new ERanFac_();
/*80--------------------------------------------------------------------------*/
