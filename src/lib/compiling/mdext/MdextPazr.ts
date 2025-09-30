/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextPazr
 * @license BSD-3-Clause
 ******************************************************************************/

import { assert, fail, out } from "@fe-lib/util.ts";
import { INOUT } from "@fe-src/preNs.ts";
import { Pazr } from "../Pazr.ts";
import type { MdextLexr } from "./MdextLexr.ts";
import type { MdextTok } from "./MdextTok.ts";
import { Block } from "./stnode/Block.ts";
import { Document } from "./stnode/Document.ts";
import { ListItem } from "./stnode/ListItem.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class MdextPazr extends Pazr<MdextTok> {
  protected override root$: Document | undefined = undefined;
  override get root(): Document {
    return this.root$ ??= new Document();
  }
  get _root() {
    return this.root$;
  }

  override get drtSn(): Block {
    this.drtSn_$ ??= this.root;
    return this.drtSn_$ as Block;
  }

  /**
   * Only invoked in `MdextLexr.create()`
   * @package
   */
  constructor(Lexr_x: MdextLexr) {
    super(Lexr_x);
  }

  override reset_Pazr(): this {
    this.reset_Pazr$(this.lexr$);
    this.root$ = undefined;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  @out((self: MdextPazr) => {
    assert(!self.drtSn_$ || self.drtSn_$ instanceof Block);
  })
  protected override sufpazmrk$(): void {
    let drtSn = this.drtSn_$;
    if (drtSn) {
      if (!(drtSn instanceof Block)) {
        let sn_ = drtSn.parent_$;
        const VALVE = 100;
        let valve = VALVE;
        while (sn_ && --valve) {
          if (sn_ instanceof Block) break;
          sn_ = sn_.parent_$;
        }
        assert(valve, `Loop ${VALVE}±1 times`);
        /*#static*/ if (INOUT) {
          assert(sn_);
        }
        this.enlargeBdriesTo_$(sn_!);
        drtSn = this.drtSn_$!;
      }
      if (drtSn.parent_$ instanceof ListItem) {
        this.enlargeBdriesTo_$(drtSn.parent_$);
      }
      //jjjj TOCLEANUP
      // } else {
      //   this.#pazr.maximizeBdries_$();
    }

    const drtStopLoc = this.tailBdryClrTk_$!.sntStrtLoc;
    for (let i = this.unrelSn_sa_$.length; i--;) {
      if (drtStopLoc.posE(this.unrelSn_sa_$[i].sntStrtLoc)) {
        /* Reusability of Stnode is checked by `sntStrtLoc`. In case of this
        branch, current Stnode can not be reused (see 3144). Deleting it from
        `unrelSn_sa_$` makes its Token be able to be gathered by
        `#gathrUnrelSntIn()`. */
        this.unrelSn_sa_$.deleteByIndex(i);
      }
    }
  }

  /** @implement */
  protected paz_impl$(): void {
    fail("Disabled");
  }
}
/*80--------------------------------------------------------------------------*/
