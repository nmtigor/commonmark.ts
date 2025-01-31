/** 80**************************************************************************
 * @module lib/util/Factory
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "../../global.ts";
import type { int, uint } from "../alias.ts";
import { assert } from "./trace.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Factory<V> {
  protected val_a$: V[] = [];
  get val_a() {
    return this.val_a$;
  }

  protected nUsed$: uint = 0;
  get nUsed() {
    return this.nUsed$;
  }

  get(i_x: uint): V {
    return this.val_a$[i_x];
  }
  at(i_x: int): V | undefined {
    return this.val_a$.at(i_x);
  }

  // constructor()
  // {
  //   this.init();
  // }

  init(hard_x?: "hard") {
    // if( this.nUsed$ )
    // {
    //   assert( this.nUsed$ <= this.val_a$.length );
    //   for( let i = this.nUsed$; i--; )
    //   {
    //     this.resetVal$( i );
    //   }
    // }
    // this.nUsed$ = 0;
    this.produce(0);

    if (hard_x) this.val_a$.length = 0;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Create and use
   */
  protected abstract createVal$(i_x: uint): V;

  /**
   * `in( this.val_a$[i] )`
   * @param i_x index of `val_a$`
   */
  protected resetVal$(i_x: uint): V {
    return this.get(i_x);
  }
  /**
   * `in( this.val_a$[i] )`
   * @param i_x index of `val_a$`
   */
  protected reuseVal$(i_x: uint): V {
    return this.get(i_x);
  }

  /**
   * @final
   * @const @param ret_x
   */
  produce(ret_x: uint): uint {
    const n_ = Math.min(ret_x, this.val_a$.length);
    for (let i = this.nUsed$; i < n_; ++i) {
      this.reuseVal$(i);
    }
    if (ret_x > this.val_a$.length) {
      for (let i = this.val_a$.length; i < ret_x; ++i) {
        this.val_a$.push(this.createVal$(i));
      }
    } else if (ret_x < this.nUsed$) {
      for (let i = ret_x; i < this.nUsed$; ++i) {
        this.resetVal$(i);
      }
    }
    this.nUsed$ = ret_x;
    /*#static*/ if (INOUT) {
      assert(this.nUsed$ === ret_x && ret_x <= this.val_a$.length);
    }
    return ret_x;
  }

  /** @final */
  produceMore(n_x: uint) {
    return this.produce(this.nUsed$ + n_x);
  }
  /** @final */
  oneMore(): V {
    const n = this.produceMore(1);
    return this.get(n - 1);
  }

  /** @final */
  produceLess(n_x: uint): uint {
    return this.produce(Math.max(this.nUsed$ - n_x, 0));
  }

  /** @final */
  [Symbol.iterator](): Iterator<V> {
    let i_ = 0;
    return {
      next: () =>
        i_ < this.nUsed$
          ? { value: this.val_a$[i_++] }
          : { value: undefined, done: true },
    };
  }

  lastIndexOf(v_x: V): uint | -1 {
    for (let i = this.nUsed$; i--;) {
      if (v_x === this.get(i)) return i;
    }
    return -1;
  }

  /**
   * Keep the order
   * @final
   */
  revoke(val_x: V): this {
    let i_ = this.lastIndexOf(val_x);
    if (0 <= i_) {
      const v_ = this.resetVal$(i_);
      for (let j = i_ + 1, LEN = this.nUsed$; j < LEN; ++j) {
        this.val_a$[j - 1] = this.get(j);
      }
      this.val_a$[this.nUsed$ - 1] = v_;
      this.nUsed$ -= 1;
    }
    return this;
  }

  /**
   * Keep the order
   * @final
   */
  gcWith(cb_x: (val_y: V) => boolean): this {
    for (let i = this.nUsed$; i--;) {
      const v_ = this.get(i);
      if (cb_x(v_)) {
        this.resetVal$(i);
        for (let j = i + 1, LEN = this.nUsed$; j < LEN; ++j) {
          this.val_a$[j - 1] = this.get(j);
        }
        this.val_a$[this.nUsed$ - 1] = v_;
        this.nUsed$ -= 1;
      }
    }
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** For testing only */
  toString() {
    return `${this.nUsed$}/${this.val_a$.length}`;
  }
  // /**
  //  * @const @param rhs_x
  //  */
  // _toString_eq(rhs_x: string) {
  //   console.assert(this.toString() === rhs_x);
  //   return this;
  // }
}
/*80--------------------------------------------------------------------------*/
