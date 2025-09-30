/** 80**************************************************************************
 * @module lib/editor/ELineBase
 * @license BSD-3-Clause
 ******************************************************************************/

import { _TRACE, CYPRESS, DEBUG, INOUT } from "../../preNs.ts";
import type { id_t, lnum_t, loff_t } from "../alias.ts";
import { WritingMode } from "../alias.ts";
import { Bidi, type Bidir } from "../Bidi.ts";
import type { Line } from "../compiling/Line.ts";
import { g_ranval_fac } from "../compiling/Ranval.ts";
import { HTMLVuu, Vuu } from "../cv.ts";
import { div, textnode } from "../dom.ts";
import "../jslang.ts";
import { $tail_ignored, $vuu } from "../symbols.ts";
import { assert } from "../util.ts";
import { trace, traceOut } from "../util/trace.ts";
import type { EdtrBase, EdtrBaseCI } from "./EdtrBase.ts";
import { StnodeV } from "./StnodeV.ts";
import { TextV } from "./TextV.ts";
import type { BlockOf, SameRow } from "./util.ts";
import { samerow_bot, samerow_left, samerow_rigt } from "./util.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TailV extends TextV {
  /** @headconst @param host_x  */
  constructor(host_x: ELineBase) {
    super(host_x, "|", host_x.bline_$.uchrLen);

    this.assignStylo({
      // display: "inline-block",
      // overflow: "hidden",

      // maxWidth: 0,

      color: "transparent",
    });

    this.text[$tail_ignored] = true;
  }
}

/**
 * A non-generic base s.t. many related uses (e.g. Caret) can be non-generic.
 */
export abstract class ELineBase<CI extends EdtrBaseCI = EdtrBaseCI>
  extends HTMLVuu<EdtrBase<CI>, HTMLDivElement>
  implements Bidir {
  static #ID = 0 as id_t;
  override readonly id = ++ELineBase.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  bline_$;
  get lidx_1(): lnum_t {
    return this.bline_$.lidx_1;
  }
  //jjjj TOCLEANUP
  // get bline_$(): Line {
  //   return this.#bline;
  // }
  // setBLine_$(_x: Line) {
  //   this.bline_$ = _x;
  //   _x.eline = this;
  // }

  /** To be consistent with `StnodeV.eline_$` */
  eline_$ = this;

  /* #bidi */
  //jjjj TOCLEANUP
  // /** `#bidi.valid` if there is wrapping. Otherwise, use `bline_$.bidi`. */
  readonly #bidi = new Bidi();

  /** @final @implement */
  get bidi(): Bidi {
    if (
      this.#bidi.bidiLastCont_ts <
        Math.max(this.bline_$.lineLastCont_ts, this.coo$.lastSize_ts)
    ) {
      this.setBidi$();
    }
    //jjjj TOCLEANUP
    // return this.#bidi.valid ? this.#bidi : this.bline_$.bidi;
    return this.#bidi;
  }
  /* ~ */

  // protected empty$ = true;
  /** @final */
  get empty() {
    return !this.bline_$.text.length;
  }

  /**
   * @headconst @param coo_x
   * @headconst @param bln_x
   */
  constructor(coo_x: EdtrBase<CI>, bln_x: Line) {
    super(coo_x, div());
    this.bline_$ = bln_x;

    /*#static*/ if (CYPRESS || DEBUG) {
      this.el$.hint = this._type_id_;
    }
    // this.assignStylo({});

    //jjjj TOCLEANUP
    // new ResizeObserver(this.#onResiz).observe(this.el$);
  }

  /** @final */
  protected reset_ELineBase$() {
    this.el$.removeAllChild();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  // @traceOut(_TRACE)
  refreshPlain(): this {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${trace.indent}>>>>>>> ${this._type_id_}.refreshPlain() >>>>>>>`,
    //   );
    // }
    this.reset_ELineBase$();

    if (!this.empty) {
      this.el$.append(textnode(this.bline_$.text));
    }
    this.el$.append(new TailV(this).el);

    /* Not invoke `setBidi$()` here because maybe not `el$.isConnected` yet!
    setBidi$()` requires `el$.isConnected`. */
    // this.setBidi$();

    // if (/^\s*$/.test(bln.text)) {
    //   const text = bln.text + "|";
    //   // const text = new Array(bln.text.length + 1).fill("|", 0).join("");
    //   this.el$.append(textnode(text, undefined, true));
    //   this.el$.style.color = "transparent";
    // } else {
    //   this.el$.append(bln.text);
    //   this.el$.style.color = "unset";
    // }

    // const ran = new TokRan( new TokLoc(bln,this.indent_),
    //   this.empty$ ? new TokLoc(bln,this.indent_) : new TokLoc(bln) );
    // this.el$.firstChild[ ranseq_sym ] = new Ranseq( [ran] );

    // /*#static*/ if (DEBUG) {
    //   ++g_count.newVuu;
    // }
    // /*#static*/ if (INOUT) {
    //   assert(this.el$.childNodes.length === 2 && this.el$.firstChild!.isText);
    // }
    return this;
  }

  /** Helper */
  #wrap_a: loff_t[] = [];
  /** @final */
  @traceOut(_TRACE)
  protected setBidi$(): void {
    /*#static*/ if (_TRACE) {
      console.log(
        `${trace.indent}>>>>>>> ${this._type_id_}.setBidi$() >>>>>>>`,
      );
    }
    /*#static*/ if (INOUT) {
      assert(this.el$.isConnected);
    }
    const bln = this.bline_$;
    const LEN = bln.uchrLen;
    //jjjj TOCLEANUP
    // const wrap_a_0 = this.#wrap_a.slice();
    this.#wrap_a.length = 0;
    const edtr = this.coo$;
    if (edtr._scrolr.wrap) {
      using rv_u = g_ranval_fac.oneMore().setRanval(bln.lidx_1, 0);
      let fsrec = edtr._scrolr.anchrRecOf_$(rv_u);
      const impl_ = (blockOf_y: BlockOf, samerow_y: SameRow) => {
        let block_0 = blockOf_y(fsrec.fat);
        // const _a_ = [];
        for (let i = 1; i < LEN; ++i) {
          rv_u.anchrLoff = i;
          fsrec = edtr._scrolr.anchrRecOf_$(rv_u);
          // _a_.push(fsrec.top.fixTo(1));
          if (samerow_y(fsrec.fat, block_0)) continue;

          this.#wrap_a.push(rv_u.anchrLoff);
          block_0 = blockOf_y(fsrec.fat);
        }
      };
      /* final switch */ ({
        [WritingMode.htb]: () => {
          impl_((rec_z) => rec_z.bottom, samerow_bot);
        },
        [WritingMode.vrl]: () => {
          impl_((rec_z) => rec_z.left, samerow_left);
        },
        [WritingMode.vlr]: () => {
          impl_((rec_z) => rec_z.right, samerow_rigt);
        },
      }[edtr._writingMode_])();
    }
    this.#wrap_a.push(LEN);
    // console.log(this.#wrap_a);
    // console.log(_a_);

    this.#bidi.reset_Bidi(
      bln.text,
      edtr._scrolr.bufrDir,
      this.#wrap_a,
      bln.bidi.embedLevels, //!
    );
    //jjjj TOCLEANUP
    // if (!this.#wrap_a.eql(wrap_a_0)) this.#bidi.validate();
  }

  //jjjj TOCLEANUP
  // #onResiz = () => {
  //   if (!this.el$.isConnected) return;

  //   /*#static*/ if (_TRACE && RESIZ) {
  //     console.log(
  //       `%c${trace.indent}>>>>>>> ${this._type_id_}.#onResiz() (${this.bline_$._type_id_}) >>>>>>>`,
  //       `color:${LOG_cssc.resiz}`,
  //     );
  //   }
  //   //jjjj TOCLEANUP because width of `el$` is always same as size of `main_el`
  //   // this.coo$.updateLastSizeTs(); //!
  //   this.setBidi$();
  //   /*#static*/ if (PRF) {
  //     console.log(
  //       `%c${trace.dent}Have passed ${
  //         ((performance.now() - g_count.hr_0) / 1000).toFixed(1)
  //       } seconds`,
  //       `color:${LOG_cssc.performance}`,
  //     );
  //   }
  //   /*#static*/ if (_TRACE && RESIZ) trace.outdent;
  //   return;
  // };

  /** @final */
  get removed() {
    return !this.el$.parentNode;
  }

  /**
   * @final
   * @const @param loff_x
   */
  caretNodeAt(loff_x: loff_t): HTMLElement | Text {
    let ret;
    // loff_x = Math.clamp(0, loff_x, this.bline_$.uchrLen - 1);
    let loff = 0, loff_1 = 0;
    for (const subNd of this.el$.childNodes) {
      if (subNd.isText) {
        loff_1 = loff + (subNd as Text).length;
        if (loff <= loff_x && loff_x < loff_1) {
          ret = subNd as Text;
          break;
        }
      } else {
        /*#static*/ if (INOUT) {
          // console.log(
          //   `loff: ${loff}, strtLoff_$: ${(subNd.vuu as StnodeV).strtLoff_$}`,
          // );
          assert(
            subNd.vuu instanceof StnodeV && loff === subNd.vuu.strtLoff_$,
          );
        }
        if (subNd.vuu instanceof TailV) {
          ret = subNd.vuu.text;
          break;
        }

        loff_1 = (subNd.vuu as StnodeV).stopLoff_$;
        if (loff <= loff_x && loff_x < loff_1) {
          ret = (subNd.vuu as StnodeV).caretNodeAt(loff_x);
          break;
        }
      }
      loff = loff_1;
    }
    return ret!;
  }
  /**
   * `in( !this.empty$ )`
   * @final
   */
  get frstCaretNode(): HTMLElement | Text {
    return this.caretNodeAt(0);
  }
  /**
   * `in( !this.empty$ )`
   * @final
   */
  get lastCaretNode(): HTMLElement | Text {
    return this.caretNodeAt(this.bline_$.uchrLen);
  }

  /**
   * According to `bline_$`, which is updated in `EdtrScrolr.resetELine_$()`\
   * `in( this.el$.isConnected )`
   *
   * jjjj@return false if `newSn` is not used
   */
  abstract replace_$(...a_x: any[]): any;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @final
   * @headconst @param node_x
   */
  static getELine(node_x: Node): ELineBase {
    const v_ = Vuu.of(node_x) as StnodeV | ELineBase;
    return v_.eline_$;
  }

  /**
   * @final
   * @headconst @param node_x
  //jjjj TOCLEANUP
  //  * @out @param ozrInfo_x
   */
  static getBLine(
    node_x: Node,
    //jjjj TOCLEANUP
    // ozrInfo_x?: BLineInfo,
  ): Line {
    // /*#static*/ if (INOUT) {
    //   assert(node_x.parentNode);
    // }
    // let ret;

    // let np = NodeInELine.unknown;
    // const pa_el = node_x.parentNode as Element;
    const v_ = Vuu.of(node_x) as StnodeV | ELineBase;
    return v_.bline_$;

    // if( node_x.isText )
    // {
    //   // v_ = pa_el[ $indent_blockline ];
    //   // if( v_ )
    //   // {
    //   //   np = NodeInELine.indent;
    //   //   ret = v_.bline_$;
    //   // }
    // }
    // if( !ret )
    // {
    //   v_ = HTMLVuu.of( node_x );
    //   if( v_ instanceof PlainELine )
    //   {
    //     np = NodeInELine.text;
    //     ret = v_.bline_$;
    //   }
    //   else assert(0);
    // }

    // let eline;
    //jjjj TOCLEANUP
    // if (ozrInfo_x) {
    //   // ozrInfo_x.pa_el = pa_el;
    //   ozrInfo_x.eline = v_.eline_$;

    //   // eline = v_;
    //   // ozrInfo_x.eline = <PlainELine>eline;
    // }

    // const out = ( np_y:NodeInELine, vuu_y:any, eline_y:any ) =>
    // {
    //   assert( ret );

    //   switch( np_y )
    //   {
    //   case NodeInELine.text:
    //     assert( vuu_y instanceof PlainELine );
    //     break;
    //   case NodeInELine.indent:
    //     assert( vuu_y instanceof PlainELine );
    //     break;
    //   default: assert(0);
    //   }

    //   if( ozrInfo_x ) assert( eline_y instanceof PlainELine );
    // }
    // out(np,v_,eline);
    //jjjj TOCLEANUP
    // return ret;
  }
}

//jjjj TOCLEANUP
// export type BLineInfo = {
//   // nodeInELine: NodeInELine = NodeInELine.unknown;
//   // pa_el?: Element;
//   // pa_el:Node | null = null;
//   eline: ELineBase;
//   // eline?:PlainELine;
// };

export const enum NodeInELine {
  unknown = 1,
  text,
  span,
  indent,
}
/*80--------------------------------------------------------------------------*/
