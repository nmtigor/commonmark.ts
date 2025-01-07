/** 80**************************************************************************
 * @module lib/editor/ELineBase
 * @license BSD-3-Clause
 ******************************************************************************/

import { LOG_cssc } from "../../alias.ts";
import { _TRACE, CYPRESS, DEV, global, INOUT, RESIZ } from "../../global.ts";
import type { id_t, loff_t, ts_t } from "../alias.ts";
import { WritingMode } from "../alias.ts";
import { Bidi } from "../Bidi.ts";
import type { Bidir } from "../compiling/alias.ts";
import type { Line } from "../compiling/Line.ts";
import { g_ranval_fac } from "../compiling/Ranval.ts";
import { HTMLVuu, Vuu } from "../cv.ts";
import { div, textnode } from "../dom.ts";
import "../jslang.ts";
import { $tail_ignored, $vuu } from "../symbols.ts";
import { count } from "../util/performance.ts";
import { assert } from "../util/trace.ts";
import type { EdtrBase, EdtrBaseCI } from "./EdtrBase.ts";
import { g_eran_fac } from "./ERan.ts";
import { StnodeV } from "./StnodeV.ts";
import { TextV } from "./TextV.ts";
import type { BlockOf, Sameline } from "./util.ts";
import { sameline_bot, sameline_left, sameline_rigt } from "./util.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TailV extends TextV {
  constructor(host_x: ELineBase) {
    super(host_x, "|", host_x.bline_$.uchrLen);

    this.assignStylo({
      // display: "inline-block",
      // overflow: "hidden",

      // maxWidth: 0,

      color: "transparent",
    });

    (this.el$.firstChild as Text)[$tail_ignored] = true;
  }
}

export abstract class ELineBase<CI extends EdtrBaseCI = EdtrBaseCI>
  extends HTMLVuu<EdtrBase<CI>, HTMLDivElement>
  implements Bidir {
  static #ID = 0 as id_t;
  override readonly id = ++ELineBase.#ID as id_t;

  bline_$: Line;
  /** To be consistent with `StnodeV.eline_$` */
  eline_$ = this;

  /** `bidi$.valid` if there is wrapping. Otherwise, use `bline_$.bidi`. */
  protected readonly bidi$ = new Bidi();
  /** @final @implement */
  get bidi(): Bidi {
    return this.bidi$.valid ? this.bidi$ : this.bline_$.bidi;
  }

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

    /*#static*/ if (CYPRESS) {
      this.el$.cyName = this._type_id;
    }
    this.assignStylo({});

    new ResizeObserver(this.#onResiz).observe(this.el$);
  }

  /** @final */
  protected reset$() {
    this.el$.removeAllChild();
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @final */
  refreshPlain(): this {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id}.refreshPlain() >>>>>>>`,
    //   );
    // }
    this.reset$();

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

    /*#static*/ if (DEV) {
      ++count.newVuu;
    }
    // /*#static*/ if (INOUT) {
    //   assert(this.el$.childNodes.length === 2 && this.el$.firstChild!.isText);
    // }
    // /*#static*/ if (_TRACE) global.outdent;
    return this;
  }

  /** Helper */
  #wrap_a: loff_t[] = [];
  /**
   * `in( this.el$.isConnected )`
   * @final
   */
  // @traceOut(_TRACE)
  protected setBidi$(): void {
    // /*#static*/ if (_TRACE) {
    //   console.log(
    //     `${global.indent}>>>>>>> ${this._type_id}.setBidi$() >>>>>>>`,
    //   );
    // }
    const edtr = this.coo;
    const bln = this.bline_$;
    using rv_ = g_ranval_fac.oneMore().reset(bln.lidx_1, 0);
    using eran = g_eran_fac.oneMore();
    let rec = edtr._scrolr.anchrRecOf_$(rv_, eran);
    const LEN = bln.uchrLen;
    this.#wrap_a.length = 0;
    const impl_ = (blockOf_y: BlockOf, sameline_y: Sameline) => {
      let block_0 = blockOf_y(rec);
      // const _a_ = [];
      for (let i = 1; i < LEN; ++i) {
        rv_.anchrLoff = i;
        rec = edtr._scrolr.anchrRecOf_$(rv_, eran);
        // _a_.push(rec.top.fixTo(1));
        if (sameline_y(rec, block_0)) continue;

        this.#wrap_a.push(rv_.anchrLoff);
        block_0 = blockOf_y(rec);
      }
    };
    /* final switch */ ({
      [WritingMode.htb]: () => {
        impl_((rec_z) => rec_z.bottom, sameline_bot);
      },
      [WritingMode.vrl]: () => {
        impl_((rec_z) => rec_z.left, sameline_left);
      },
      [WritingMode.vlr]: () => {
        impl_((rec_z) => rec_z.right, sameline_rigt);
      },
    }[edtr._writingMode])();
    this.#wrap_a.push(LEN);
    // console.log(this.#wrap_a);
    // console.log(_a_);

    this.bidi$.reset(
      bln.text,
      edtr._scrolr.bufrDir,
      this.#wrap_a,
      bln.bidi.embedLevels,
    );
    if (this.#wrap_a.length > 1) this.bidi$.validate();
  }

  #onResiz = () => {
    if (!this.el$.isConnected) return;

    /*#static*/ if (_TRACE && RESIZ) {
      console.log(
        `%c${global.indent}>>>>>>> ${this._type_id}.#onResiz() (${this.bline_$._type_id}) >>>>>>>`,
        `color:${LOG_cssc.resiz}`,
      );
    }
    this.setBidi$();
    this.bline_$.bufr?.updateLastViewTs(); //!
    /*#static*/ if (_TRACE && RESIZ) global.outdent;
    return;
  };

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
          //   `loff: ${loff}, strtLoff_$: ${(subNd[$vuu] as StnodeV).strtLoff_$}`,
          // );
          assert(
            subNd[$vuu] instanceof StnodeV && loff === subNd[$vuu].strtLoff_$,
          );
        }
        if (subNd[$vuu] instanceof TailV) {
          ret = subNd.firstChild as Text;
          break;
        }

        loff_1 = (subNd[$vuu] as StnodeV).stopLoff_$;
        if (loff <= loff_x && loff_x < loff_1) {
          ret = (subNd[$vuu] as StnodeV).caretNodeAt(loff_x);
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
