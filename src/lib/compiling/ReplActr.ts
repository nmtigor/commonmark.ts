/** 80**************************************************************************
 * @module lib/compiling/ReplActr
 * @license BSD-3-Clause
 ******************************************************************************/

import { createActor, setup } from "@xstate";
import { INOUT } from "../../global.ts";
import { assert } from "../util/trace.ts";
import type { Bufr } from "./Bufr.ts";
import { Lexr } from "./Lexr.ts";
import { Pazr } from "./Pazr.ts";
import { Tfmr } from "./Tfmr.ts";
import type { TokRan } from "./TokRan.ts";
import { BufrReplState } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class ReplActr {
  readonly #bufr;
  #lexr!: Lexr<any>;
  #pazr: Pazr<any> | undefined;
  #tfmr: Tfmr | undefined;

  /* "states" use literal names "idle", "prerepl", ... rather then
  `BufrReplState[BufrReplState.idle]`, ..., because otherwise xstate graph can
  not show correctly.
  Need to manually keep these literal names consistent with `BufrReplState`! */
  #actr = createActor(
    /** @xstate-layout N4IgpgJg5mDOIC5QCUwAcA2BBAxgFwCcA6ASwgzAGIAVAeQAI0CxnMBtABgF1FQ0B7WCTwl+AO14gAHogCMHAExEAHLIUBWAMwLZANg4c9WgDQgAnnIAssorPXLlW2QE5L6gOyaOmgL4-TqJi4hERMLOgYNAywAK4AZqwYnDxIIAJCIuKSMgialhxEmmrqskUKuuXusqYWuRzOhequHLraypaWzhyWfgERwcSxCRFR9EOJAPqQhMmS6cKiEqk57USW7pV5lgqeero1iJ3KRArbssru3mp5O70ggdj4g-GT0wSjZBSzqfOZS6A5AC08l0RHcHXc7n0rU69gOuW0RA4yg47g8TWRmhRuj8-hAYn4EDgkgeAzmggWWWWiGB6ksYIhUJaeWccPMiC0Kk0TU0zl0fI49iqd1JT1I5DA5Iyi2yiA48I0ChF-TFYUSUsp-2kiB0Sna6m6umUXXszmq7IQiuVQTF4wiGr+sstahUbkNxsFHv2FusmhUht0rTsXjNvjxopCdswUwghAdMupCGBNmsO10dhayiK629tV9-ssgaDWnqpVxPiAA */
    setup({
      types: {} as {
        events: {
          type: `TO ${keyof typeof BufrReplState}`;
        };
      },
    }).createMachine({
      id: "ReplActr",
      states: {
        "idle": {
          on: {
            "TO prerepl": {
              actions: () => {
                /*#static*/ if (INOUT) {
                  assert(this.#bufr.oldRan_a_$.at(0));
                }
                this.#lexr
                  .markLexRegion_$(this.#bufr.oldRan_a_$[0] as TokRan<any>);
                this.#pazr?.markPazRegion_$();
                this.#tfmr?.markTfmRegion_$(this.#bufr.oldRan_a_$[0]);
              },
              target: "prerepl",
            },
          },
        },
        "prerepl": {
          on: {
            ["TO sufrepl"]: {
              actions: () => {
                /*#static*/ if (INOUT) {
                  assert(this.#bufr.newRan_a_$.at(0));
                }
                this.#lexr
                  .adjust_$(this.#bufr.newRan_a_$[0] as TokRan<any>).lex();
                this.#pazr?.paz();
                this.#tfmr?.adjust_$(this.#bufr.newRan_a_$[0]).tfm();
              },
              target: "sufrepl",
            },
          },
        },
        "sufrepl": {
          on: {
            ["TO sufrepl_edtr"]: {
              target: "sufrepl_edtr",
            },
          },
        },
        "sufrepl_edtr": {
          on: {
            ["TO idle"]: {
              target: "idle",
            },
          },
        },
      },
      initial: "idle",
    }),
  );

  #inited = false;

  constructor(bufr_x: Bufr) {
    this.#bufr = bufr_x;
  }

  init(lexr_x: Lexr<any>, pazr_x?: Pazr<any>, tfmr_x?: Tfmr) {
    /*#static*/ if (INOUT) {
      assert(!this.#inited);
      assert(lexr_x.bufr === this.#bufr);
      assert(!pazr_x || pazr_x.lexr === lexr_x);
      assert(!tfmr_x || tfmr_x.bufr === this.#bufr);
    }
    this.#lexr = lexr_x;
    this.#pazr = pazr_x;
    this.#tfmr = tfmr_x;

    this.#actr.start();

    this.#inited = true;
  }

  fina() {
    this.#lexr = undefined as any;
    this.#pazr = undefined;
    this.#tfmr = undefined;

    this.#actr.stop();

    this.#inited = false;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * If called multiple times with the same `_x`, it will only run once.
   */
  to(_x: BufrReplState) {
    this.#actr.send({
      type: `TO ${BufrReplState[_x] as keyof typeof BufrReplState}`,
    });
    // debugger;
  }
}
/*80--------------------------------------------------------------------------*/
