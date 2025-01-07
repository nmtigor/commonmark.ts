/** 80**************************************************************************
 * @module lib/editor/Selec
 * @license BSD-3-Clause
 ******************************************************************************/

import { DEV } from "../../global.ts";
import type { id_t, uint } from "../alias.ts";
import type { Cssc } from "../color/alias.ts";
import { Pale } from "../color/Pale.ts";
import { span } from "../dom.ts";
import { HTMLVuu } from "../cv.ts";
import { Factory } from "../util/Factory.ts";
import {
  Ovlap_passive_z,
  Ovlap_proactive_z,
  Selec_passive_z,
  Selec_proactive_z,
} from "./alias.ts";
import type { EdtrBase, EdtrBaseScrolr } from "./EdtrBase.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
class Selec extends HTMLVuu<EdtrBase, HTMLSpanElement> {
  static #ID = 0 as id_t;
  override readonly id = ++Selec.#ID as id_t;

  /* Pale */
  #proactiveBgSelec_p = Pale.get("lib.editor.Selec.proactiveBgSelec");
  #proactiveBgOvlap_p = Pale.get("lib.editor.Selec.proactiveBgOvlap");
  #passiveBgSelec_p = Pale.get("lib.editor.Selec.passiveBgSelec");
  #passiveBgOvlap_p = Pale.get("lib.editor.Selec.passiveBgOvlap");
  #onProactiveBgCssc = (_x: Cssc) => {
    if (this.proactive_$) {
      this.el$.style.backgroundColor = _x;
    }
  };
  #onPassiveBgCssc = (_x: Cssc) => {
    if (!this.proactive_$) {
      this.el$.style.backgroundColor = _x;
    }
  };
  override observeTheme() {
    this.#proactiveBgSelec_p.registCsscHandler(this.#onProactiveBgCssc);
    this.#proactiveBgOvlap_p.registCsscHandler(this.#onProactiveBgCssc);
    this.#passiveBgSelec_p.registCsscHandler(this.#onPassiveBgCssc);
    this.#passiveBgOvlap_p.registCsscHandler(this.#onPassiveBgCssc);
  }
  override unobserveTheme() {
    this.#proactiveBgSelec_p.removeCsscHandler(this.#onProactiveBgCssc);
    this.#proactiveBgOvlap_p.removeCsscHandler(this.#onProactiveBgCssc);
    this.#passiveBgSelec_p.removeCsscHandler(this.#onPassiveBgCssc);
    this.#passiveBgOvlap_p.removeCsscHandler(this.#onPassiveBgCssc);
  }
  /* ~ */

  /* proactive_$ */
  proactive_$ = false;
  get #bgSelecCssc() {
    return this.proactive_$
      ? this.#proactiveBgSelec_p.cssc
      : this.#passiveBgSelec_p.cssc;
  }
  get #bgOvlapCssc() {
    return this.proactive_$
      ? this.#proactiveBgOvlap_p.cssc
      : this.#passiveBgOvlap_p.cssc;
  }
  get #zSelecCssc() {
    return this.proactive_$ ? Selec_proactive_z : Selec_passive_z;
  }
  get #zOvlapCssc() {
    return this.proactive_$ ? Ovlap_proactive_z : Ovlap_passive_z;
  }
  /* ~ */

  /** @headconst @param coo_x */
  private constructor(coo_x: EdtrBase) {
    super(coo_x, span());

    this.assignStylo({
      display: "none",
      position: "absolute",
      // top: `5px`,
      // left: `10px`,

      // width: `5px`,
      // height: `20px`,
    });
  }
  static create(coo_x: EdtrBase) {
    return new Selec(coo_x).reuse();
  }

  reuse(): this {
    /*#static*/ if (DEV) this.observeTheme();
    return this;
  }
  reset(): this {
    /*#static*/ if (DEV) this.unobserveTheme();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @const @param x_x
   * @const @param y_x
   * @const @param w_x
   * @const @param h_x
   * @const @param ovlap_x
   */
  draw_$(
    x_x: number,
    y_x: number,
    w_x: number,
    h_x: number,
    ovlap_x = false,
  ): this {
    this.assignStylo({
      top: `${y_x}px`,
      left: `${x_x}px`,
      zIndex: ovlap_x ? this.#zOvlapCssc : this.#zSelecCssc,

      width: `${w_x}px`,
      height: `${h_x}px`,
      backgroundColor: ovlap_x ? this.#bgOvlapCssc : this.#bgSelecCssc,
    });
    return this;
  }

  hide_$(): this {
    this.el$.style.display = "none";
    return this;
  }
}

/** @final */
export class SelecFac extends Factory<Selec> {
  readonly #edtr: EdtrBase;

  #proactive = false;
  set proactive_$(_x: boolean) {
    if (_x === this.#proactive) return;

    for (const selec of this) {
      selec.proactive_$ = _x;
    }
    this.#proactive = _x;
  }

  /** @headconst @param edtr_x */
  constructor(edtr_x: EdtrBase) {
    super();
    this.#edtr = edtr_x;
  }

  // override init(hard_x?: "hard") {
  //   if (hard_x) {
  //     for (let i = this.val_a$.length; i--;) {
  //       this.val_a$[i].el.remove();
  //     }
  //     this.val_a$.length = 0;
  //   } else {
  //     this.produce(0);
  //   }
  // }

  /** @implement */
  protected createVal$() {
    const ret = Selec.create(this.#edtr);
    this.#edtr.ci.scrolr.el.append(ret.el);
    ret.proactive_$ = this.#proactive;
    return ret;
  }

  protected override resetVal$(i_x: uint) {
    return this.get(i_x).reset().hide_$();
  }
  protected override reuseVal$(i_x: uint) {
    const ret = this.get(i_x).reuse();
    ret.proactive_$ = this.#proactive;
    return ret;
  }

  showAll() {
    for (const selec of this) {
      selec.el.style.display = "unset";
    }
  }
}
/*80--------------------------------------------------------------------------*/
