/** 80**************************************************************************
 * For moving the caret forward/backward by visual ordering more efficiently
 *
 * * Ref. https://github.com/lojjic/bidi-js
 *   * Add types
 *
 * * Ref. [Unicode Bidirectional Algorithm, Unicode 15.0.0](http://www.unicode.org/reports/tr9/)
 *
 * @module lib/Bidi
 * @license MIT
 ******************************************************************************/

import { INOUT } from "../global.ts";
import type { id_t, loff_t, UChr, uint, uint8 } from "./alias.ts";
import { BufrDir, ChrTyp } from "./alias.ts";
import { canonicalOf, chrTypOf, closingOf, openingOf } from "./loadBidi.ts";
import { assert } from "./util/trace.ts";
/*80--------------------------------------------------------------------------*/

const ISOLATE_INIT = ChrTyp.LRI | ChrTyp.RLI | ChrTyp.FSI;
type ISOLATE_INIT = ChrTyp.LRI | ChrTyp.RLI | ChrTyp.FSI;
const ISOLATE = ISOLATE_INIT | ChrTyp.PDI;
type ISOLATE = ISOLATE_INIT | ChrTyp.PDI;
const STRONG = ChrTyp.L | ChrTyp.R | ChrTyp.AL;
const NAMED_NEUTRAL = ChrTyp.B | ChrTyp.S | ChrTyp.WS;
type NAMED_NEUTRAL = ChrTyp.B | ChrTyp.S | ChrTyp.WS;
const NEUTRAL = NAMED_NEUTRAL | ChrTyp.ON;
type NEUTRAL = NAMED_NEUTRAL | ChrTyp.ON;
const NEUTRAL_ISOLATE = NEUTRAL | ISOLATE;
type NEUTRAL_ISOLATE = NEUTRAL | ISOLATE;
const EMBEDDING_INIT = ChrTyp.RLE | ChrTyp.LRE;
const OVERRIDE_INIT = ChrTyp.RLO | ChrTyp.LRO;
const BN_LIKE = ChrTyp.BN | EMBEDDING_INIT | OVERRIDE_INIT | ChrTyp.PDF;
const TRAILING = NAMED_NEUTRAL | ISOLATE | BN_LIKE;

type EmbedLevel = uint8;
type Paragraph = { start: uint; end: uint; level: EmbedLevel };
type GetEmbeddingLevelsResult = {
  paragraphs: Paragraph[];
  levels: Uint8Array;
};

const enum OverrideStatus {
  /** Neutral */
  N = 0,
  /** Left-to-right */
  L = ChrTyp.L,
  /** Right-to-left */
  R = ChrTyp.R,
}
type Status = {
  _level: EmbedLevel;
  _override: OverrideStatus;
  _isolate: boolean;
  _isolInitIndex?: uint;
};

type LevelRun = {
  _start: uint;
  _end: uint;
  _level: EmbedLevel;
  _startsWithPDI: boolean;
  _endsWithIsolInit: boolean;
};

type IsolRunSeq = {
  _seqIndices: uint[];
  _sosType: ChrTyp.R | ChrTyp.L;
  _eosType: ChrTyp.R | ChrTyp.L;
};

/**
 * Ref. https://github.com/lojjic/bidi-js/blob/main/src/embeddingLevels.js
 *
 * This function applies the Bidirectional Algorithm to a string, returning the
 * resolved embedding levels in a single Uint8Array plus a list of objects
 * holding each paragraph's start and end indices and resolved base embedding
 * level.
 *
 * @const @param string_x The input string
 * @const @param baseDirection_x Use "ltr" or "rtl" to force a base paragraph
 *   direction, otherwise a direction will be chosen automatically from each
 *   paragraph's contents.
 */
function getEmbeddingLevels(
  string_x: string,
  baseDirection_x: "ltr" | "rtl" | "auto",
): GetEmbeddingLevelsResult {
  const MAX_DEPTH = 125;
  const IN_LEN = string_x.length;

  // Start by mapping all characters to their unicode type, as a bitmask integer
  const charTypes = new Uint32Array(IN_LEN);
  for (let i = 0; i < IN_LEN; i++) {
    charTypes[i] = chrTypOf(string_x[i]);
  }

  /** will be cleared at start of each paragraph */
  const charTypeCounts = new Map<ChrTyp | NEUTRAL_ISOLATE, uint>();
  function changeCharType(i_y: uint, type_y: ChrTyp) {
    const oldType: ChrTyp = charTypes[i_y];
    charTypes[i_y] = type_y;

    charTypeCounts.set(oldType, charTypeCounts.get(oldType)! - 1);
    if (oldType & NEUTRAL_ISOLATE) {
      charTypeCounts.set(
        NEUTRAL_ISOLATE,
        charTypeCounts.get(NEUTRAL_ISOLATE)! - 1,
      );
    }
    charTypeCounts.set(type_y, (charTypeCounts.get(type_y) || 0) + 1);
    if (type_y & NEUTRAL_ISOLATE) {
      charTypeCounts.set(
        NEUTRAL_ISOLATE,
        (charTypeCounts.get(NEUTRAL_ISOLATE) || 0) + 1,
      );
    }
  }

  const embedLevels = new Uint8Array(IN_LEN);
  /** init->pdi and pdi->init */
  const isolationPairs = new Map<uint, uint>();

  // === 3.3.1 The Paragraph Level ===

  /*
  3.3.1 P1. Split the text into paragraphs
   */
  const paragraphs: Paragraph[] = [];
  let paragraph_: Paragraph | undefined;
  for (let i = 0; i < IN_LEN; i++) {
    if (!paragraph_) {
      paragraphs.push(
        paragraph_ = {
          start: i,
          end: IN_LEN - 1,
          /*
          3.3.1 P2-P3. Determine the paragraph level
           */
          level: baseDirection_x === "rtl"
            ? 1
            : baseDirection_x === "ltr"
            ? 0
            : determineAutoEmbedLevel(i, false),
        },
      );
    }
    if (charTypes[i] & ChrTyp.B) {
      paragraph_!.end = i;
      paragraph_ = undefined;
    }
  }

  const FORMATTING = EMBEDDING_INIT | OVERRIDE_INIT | ChrTyp.PDF | ISOLATE |
    ChrTyp.B;
  const nextEven = (n: EmbedLevel) => n + ((n & 1) ? 1 : 2);
  const nextOdd = (n: EmbedLevel) => n + ((n & 1) ? 2 : 1);

  // Everything from here on will operate per paragraph.
  for (const paragraph of paragraphs) {
    const statusStack: Status[] = [{
      _level: paragraph.level,
      _override: OverrideStatus.N,
      _isolate: false,
    }];
    let stackTop: Status;
    let overflowIsolateCount = 0;
    let overflowEmbeddingCount = 0;
    let validIsolateCount = 0;
    charTypeCounts.clear();

    // === 3.3.2 Explicit Levels and Directions ===
    for (let i = paragraph.start, iI = paragraph.end; i <= iI; i++) {
      let charType = charTypes[i];
      stackTop = statusStack.at(-1)!;

      // Set initial counts
      charTypeCounts.set(charType, (charTypeCounts.get(charType) || 0) + 1);
      if (charType & NEUTRAL_ISOLATE) {
        charTypeCounts.set(
          NEUTRAL_ISOLATE,
          (charTypeCounts.get(NEUTRAL_ISOLATE) || 0) + 1,
        );
      }

      // Explicit Embeddings: 3.3.2 X2 - X3
      if (charType & FORMATTING) { // prefilter all formatters
        if (charType & EMBEDDING_INIT) {
          embedLevels[i] = stackTop._level; // 5.2
          const level = (charType === ChrTyp.RLE ? nextOdd : nextEven)(
            stackTop._level,
          );
          if (
            level <= MAX_DEPTH &&
            overflowIsolateCount === 0 &&
            overflowEmbeddingCount === 0
          ) {
            statusStack.push({
              _level: level,
              _override: OverrideStatus.N,
              _isolate: false,
            });
          } else if (!overflowIsolateCount) {
            overflowEmbeddingCount++;
          }
        } //
        // Explicit Overrides: 3.3.2 X4 - X5
        else if (charType & OVERRIDE_INIT) {
          embedLevels[i] = stackTop._level; // 5.2
          const level = (charType === ChrTyp.RLO ? nextOdd : nextEven)(
            stackTop._level,
          );
          if (
            level <= MAX_DEPTH &&
            overflowIsolateCount === 0 &&
            overflowEmbeddingCount === 0
          ) {
            statusStack.push({
              _level: level,
              _override: (charType & ChrTyp.RLO)
                ? OverrideStatus.R
                : OverrideStatus.L,
              _isolate: false,
            });
          } else if (!overflowIsolateCount) {
            overflowEmbeddingCount++;
          }
        } //
        // Isolates: 3.3.2 X5a - X5c
        else if (charType & ISOLATE_INIT) {
          /*
          X5c. FSI becomes either RLI or LRI
           */
          if (charType & ChrTyp.FSI) {
            charType = determineAutoEmbedLevel(i + 1, true) === 1
              ? ChrTyp.RLI
              : ChrTyp.LRI;
          }

          embedLevels[i] = stackTop._level;
          if (stackTop._override) {
            changeCharType(i, stackTop._override as unknown as ChrTyp);
          }
          const level = (charType === ChrTyp.RLI ? nextOdd : nextEven)(
            stackTop._level,
          );
          if (
            level <= MAX_DEPTH &&
            overflowIsolateCount === 0 &&
            overflowEmbeddingCount === 0
          ) {
            validIsolateCount++;
            statusStack.push({
              _level: level,
              _override: OverrideStatus.N,
              _isolate: true,
              _isolInitIndex: i,
            });
          } else {
            overflowIsolateCount++;
          }
        } //
        // Terminating Isolates: 3.3.2 X6a
        else if (charType & ChrTyp.PDI) {
          if (overflowIsolateCount > 0) {
            overflowIsolateCount--;
          } else if (validIsolateCount > 0) {
            overflowEmbeddingCount = 0;
            while (!statusStack.at(-1)!._isolate) {
              statusStack.pop();
            }
            // Add to isolation pairs bidirectional mapping:
            const isolInitIndex = statusStack.at(-1)!._isolInitIndex;
            if (isolInitIndex != undefined) {
              isolationPairs.set(isolInitIndex, i);
              isolationPairs.set(i, isolInitIndex);
            }
            statusStack.pop();
            validIsolateCount--;
          }
          stackTop = statusStack.at(-1)!;
          embedLevels[i] = stackTop._level;
          if (stackTop._override) {
            changeCharType(i, stackTop._override as unknown as ChrTyp);
          }
        } //
        // Terminating Embeddings and Overrides: 3.3.2 X7
        else if (charType & ChrTyp.PDF) {
          if (overflowIsolateCount === 0) {
            if (overflowEmbeddingCount > 0) {
              overflowEmbeddingCount--;
            } else if (!stackTop._isolate && statusStack.length > 1) {
              statusStack.pop();
              stackTop = statusStack.at(-1)!;
            }
          }
          embedLevels[i] = stackTop._level; // 5.2
        } //
        // End of Paragraph: 3.3.2 X8
        else if (charType & ChrTyp.B) {
          embedLevels[i] = paragraph.level;
        }
      } //
      // Non-formatting characters: 3.3.2 X6
      else {
        embedLevels[i] = stackTop._level;
        /*
        NOTE: This exclusion of BN seems to go against what section 5.2 says,
          but is required for test passage.
         */
        if (stackTop._override && charType !== ChrTyp.BN) {
          changeCharType(
            i,
            stackTop._override as unknown as ChrTyp,
          );
        }
      }
    }

    // === 3.3.3 Preparations for Implicit Processing ===

    /*
    Remove all RLE, LRE, RLO, LRO, PDF, and BN characters: 3.3.3 X9
    NOTE: Due to section 5.2, we won't remove them, but we'll use the BN_LIKE
      bitset to easily ignore them all from here on out.
     */

    /*
    3.3.3 X10. Compute the set of isolating run sequences as specified by BD13
     */
    const levelRuns: LevelRun[] = [];
    let currentRun: LevelRun | undefined;
    for (let i = paragraph.start, iI = paragraph.end; i <= iI; i++) {
      const charType = charTypes[i];
      if (charType & BN_LIKE) continue;

      const lvl = embedLevels[i];
      const isIsolInit = !!(charType & ISOLATE_INIT);
      const isPDI = charType === ChrTyp.PDI;
      if (currentRun && lvl === currentRun._level) {
        currentRun._end = i;
        currentRun._endsWithIsolInit = isIsolInit;
      } else {
        levelRuns.push(
          currentRun = {
            _start: i,
            _end: i,
            _level: lvl,
            _startsWithPDI: isPDI,
            _endsWithIsolInit: isIsolInit,
          },
        );
      }
    }
    const isolatingRunSeqs: IsolRunSeq[] = [];
    for (let runIdx = 0; runIdx < levelRuns.length; runIdx++) {
      const run = levelRuns[runIdx];
      if (
        !run._startsWithPDI ||
        (run._startsWithPDI && !isolationPairs.has(run._start))
      ) {
        const seqRuns = [currentRun = run];
        for (
          let pdiIndex;
          currentRun?._endsWithIsolInit &&
          (pdiIndex = isolationPairs.get(currentRun._end)) !== undefined;
        ) {
          for (let i = runIdx + 1; i < levelRuns.length; i++) {
            if (levelRuns[i]._start === pdiIndex) {
              seqRuns.push(currentRun = levelRuns[i]);
              break;
            }
          }
        }
        // build flat list of indices across all runs:
        const seqIndices: uint[] = [];
        for (let i = 0; i < seqRuns.length; i++) {
          const run = seqRuns[i];
          for (let j = run._start; j <= run._end; j++) {
            seqIndices.push(j);
          }
        }
        // determine the sos/eos types:
        let firstLevel = embedLevels[seqIndices[0]];
        let prevLevel = paragraph.level;
        for (let i = seqIndices[0] - 1; i >= 0; i--) {
          if (!(charTypes[i] & BN_LIKE)) { // 5.2
            prevLevel = embedLevels[i];
            break;
          }
        }
        const lastIndex = seqIndices.at(-1)!;
        let lastLevel = embedLevels[lastIndex];
        let nextLevel = paragraph.level;
        if (!(charTypes[lastIndex] & ISOLATE_INIT)) {
          for (let i = lastIndex + 1; i <= paragraph.end; i++) {
            if (!(charTypes[i] & BN_LIKE)) { // 5.2
              nextLevel = embedLevels[i];
              break;
            }
          }
        }
        isolatingRunSeqs.push({
          _seqIndices: seqIndices,
          _sosType: Math.max(prevLevel, firstLevel) % 2 ? ChrTyp.R : ChrTyp.L,
          _eosType: Math.max(nextLevel, lastLevel) % 2 ? ChrTyp.R : ChrTyp.L,
        });
      }
    }

    // The next steps are done per isolating run sequence
    for (
      const {
        _seqIndices: seqIndices,
        _sosType: sosType,
        _eosType: eosType,
      } of isolatingRunSeqs
    ) {
      const embedLevel = embedLevels[seqIndices[0]];
      const embedDirection = (embedLevel & 1) ? ChrTyp.R : ChrTyp.L;

      // === 3.3.4 Resolving Weak Types ===

      /*
      W1 + 5.2. Search backward from each NSM to the first character in the
        isolating run sequence whose bidirectional type is not BN, and set the
        NSM to ON if it is an isolate initiator or PDI, and to its type
        otherwise. If the NSM is the first non-BN character, change the NSM to
        the type of sos.
       */
      if (charTypeCounts.get(ChrTyp.NSM)) {
        for (let si = 0, siI = seqIndices.length; si < siI; si++) {
          const i = seqIndices[si];
          if (charTypes[i] & ChrTyp.NSM) {
            let prevType = sosType;
            for (let sj = si - 1; sj >= 0; sj--) {
              // 5.2 scan back to first non-BN
              if (!(charTypes[seqIndices[sj]] & BN_LIKE)) {
                prevType = charTypes[seqIndices[sj]];
                break;
              }
            }
            changeCharType(
              i,
              (prevType & (ISOLATE_INIT | ChrTyp.PDI)) ? ChrTyp.ON : prevType,
            );
          }
        }
      }

      /*
      W2. Search backward from each instance of a European number until the
        first strong type (R, L, AL, or sos) is found. If an AL is found, change
        the type of the European number to Arabic number.
       */
      if (charTypeCounts.get(ChrTyp.EN)) {
        for (let si = 0, siI = seqIndices.length; si < siI; si++) {
          const i = seqIndices[si];
          if (charTypes[i] & ChrTyp.EN) {
            for (let sj = si - 1; sj >= -1; sj--) {
              const prevCharType = sj === -1
                ? sosType
                : charTypes[seqIndices[sj]];
              if (prevCharType & STRONG) {
                if (prevCharType === ChrTyp.AL) {
                  changeCharType(i, ChrTyp.AN);
                }
                break;
              }
            }
          }
        }
      }

      /*
      W3. Change all ALs to R
       */
      if (charTypeCounts.get(ChrTyp.AL)) {
        for (const i of seqIndices) {
          if (charTypes[i] & ChrTyp.AL) {
            changeCharType(i, ChrTyp.R);
          }
        }
      }

      /*
      W4. A single European separator between two European numbers changes to a
        European number. A single common separator between two numbers of the
        same type changes to that type.
       */
      if (charTypeCounts.get(ChrTyp.ES) || charTypeCounts.get(ChrTyp.CS)) {
        for (let si = 1, siI = seqIndices.length; si < siI - 1; si++) {
          const i = seqIndices[si];
          if (charTypes[i] & (ChrTyp.ES | ChrTyp.CS)) {
            let prevType = 0, nextType = 0;
            for (let sj = si - 1; sj >= 0; sj--) {
              prevType = charTypes[seqIndices[sj]];
              if (!(prevType & BN_LIKE)) { // 5.2
                break;
              }
            }
            for (let sj = si + 1; sj < siI; sj++) {
              nextType = charTypes[seqIndices[sj]];
              if (!(nextType & BN_LIKE)) { // 5.2
                break;
              }
            }
            if (
              prevType === nextType &&
              (charTypes[i] === ChrTyp.ES
                ? prevType === ChrTyp.EN
                : (prevType & (ChrTyp.EN | ChrTyp.AN)))
            ) {
              changeCharType(i, prevType);
            }
          }
        }
      }

      /*
      W5. A sequence of European terminators adjacent to European numbers
        changes to all European numbers.
       */
      if (charTypeCounts.get(ChrTyp.EN)) {
        for (let si = 0, siI = seqIndices.length; si < siI; si++) {
          const i = seqIndices[si];
          if (charTypes[i] & ChrTyp.EN) {
            for (
              let sj = si - 1;
              sj >= 0 &&
              (charTypes[seqIndices[sj]] & (ChrTyp.ET | BN_LIKE));
              sj--
            ) {
              changeCharType(seqIndices[sj], ChrTyp.EN);
            }
            for (
              si++;
              si < siI &&
              (charTypes[seqIndices[si]] &
                (ChrTyp.ET | BN_LIKE | ChrTyp.EN));
              si++
            ) {
              if (charTypes[seqIndices[si]] !== ChrTyp.EN) {
                changeCharType(seqIndices[si], ChrTyp.EN);
              }
            }
          }
        }
      }

      /*
      W6. Otherwise, separators and terminators change to Other Neutral.
       */
      if (
        charTypeCounts.get(ChrTyp.ET) || charTypeCounts.get(ChrTyp.ES) ||
        charTypeCounts.get(ChrTyp.CS)
      ) {
        for (let si = 0, siI = seqIndices.length; si < siI; si++) {
          const i = seqIndices[si];
          if (charTypes[i] & (ChrTyp.ET | ChrTyp.ES | ChrTyp.CS)) {
            changeCharType(i, ChrTyp.ON);
            // 5.2 transform adjacent BNs too:
            for (
              let sj = si - 1;
              sj >= 0 && (charTypes[seqIndices[sj]] & BN_LIKE);
              sj--
            ) {
              changeCharType(seqIndices[sj], ChrTyp.ON);
            }
            for (
              let sj = si + 1;
              sj < seqIndices.length &&
              (charTypes[seqIndices[sj]] & BN_LIKE);
              sj++
            ) {
              changeCharType(seqIndices[sj], ChrTyp.ON);
            }
          }
        }
      }

      /*
      W7. Search backward from each instance of a European number until the
        first strong type (R, L, or sos) is found. If an L is found, then change
        the type of the European number to L.
      NOTE: implemented in single forward pass for efficiency
       */
      if (charTypeCounts.get(ChrTyp.EN)) {
        for (
          let si = 0, siI = seqIndices.length, prevStrongType = sosType;
          si < siI;
          si++
        ) {
          const i = seqIndices[si];
          const type = charTypes[i];
          if (type & ChrTyp.EN) {
            if (prevStrongType === ChrTyp.L) {
              changeCharType(i, ChrTyp.L);
            }
          } else if (type & STRONG) {
            prevStrongType = type;
          }
        }
      }

      // === 3.3.5 Resolving Neutral and Isolate Formatting Types ===

      if (charTypeCounts.get(NEUTRAL_ISOLATE)) {
        /*
        N0. Process bracket pairs in an isolating run sequence sequentially in
          the logical order of the text positions of the opening paired brackets
          using the logic given below. Within this scope, bidirectional types EN
          and AN are treated as R.
         */
        const R_TYPES_FOR_N_STEPS = ChrTyp.R | ChrTyp.EN | ChrTyp.AN;
        const STRONG_TYPES_FOR_N_STEPS = R_TYPES_FOR_N_STEPS | ChrTyp.L;

        /*
        * Identify the bracket pairs in the current isolating run sequence
          according to BD16.
         */
        const bracketPairs: [uint, uint][] = [];
        {
          const openerStack: { char: UChr; seqIndex: uint }[] = [];
          for (let si = 0, siI = seqIndices.length; si < siI; si++) {
            /*
            NOTE: For any potential bracket character we also test that it still
              carries a NI type, as that may have been changed earlier.
              This doesn't seem to be explicitly called out in the spec, but is
              required for passage of certain tests.
             */
            if (charTypes[seqIndices[si]] & NEUTRAL_ISOLATE) {
              const char = string_x[seqIndices[si]];
              let oppositeBracket;
              // Opening bracket
              if (closingOf(char) !== undefined) {
                if (openerStack.length < 63) {
                  openerStack.push({ char, seqIndex: si });
                } else {
                  break;
                }
              } //
              // Closing bracket
              else if (
                (oppositeBracket = openingOf(char)) !== undefined
              ) {
                for (
                  let stackIdx = openerStack.length - 1;
                  stackIdx >= 0;
                  stackIdx--
                ) {
                  const stackChar = openerStack[stackIdx].char;
                  if (
                    stackChar === oppositeBracket ||
                    stackChar === openingOf(canonicalOf(char)) ||
                    closingOf(canonicalOf(stackChar)) === char
                  ) {
                    bracketPairs.push([openerStack[stackIdx].seqIndex, si]);
                    // pop the matching bracket and all following
                    openerStack.length = stackIdx;
                    break;
                  }
                }
              }
            }
          }
          bracketPairs.sort((a, b) => a[0] - b[0]);
        }
        /*
         * For each bracket-pair element in the list of pairs of text positions
         */
        for (let pairIdx = 0; pairIdx < bracketPairs.length; pairIdx++) {
          const [openSeqIdx, closeSeqIdx] = bracketPairs[pairIdx];
          /*
          a. Inspect the bidirectional types of the characters enclosed within
             the bracket pair.
          b. If any strong type (either L or R) matching the embedding direction
             is found, set the type for both brackets in the pair to match the
             embedding direction.
           */
          let foundStrongType = false;
          let useStrongType: 0 | ChrTyp.L | ChrTyp.R = 0;
          for (let si = openSeqIdx + 1; si < closeSeqIdx; si++) {
            const i = seqIndices[si];
            if (charTypes[i] & STRONG_TYPES_FOR_N_STEPS) {
              foundStrongType = true;
              const lr = (charTypes[i] & R_TYPES_FOR_N_STEPS)
                ? ChrTyp.R
                : ChrTyp.L;
              if (lr === embedDirection) {
                useStrongType = lr;
                break;
              }
            }
          }
          /*
          c. Otherwise, if there is a strong type it must be opposite the
             embedding direction. Therefore, test for an established context
             with a preceding strong type by checking backwards before the
             opening paired bracket until the first strong type (L, R, or
             sos) is found.
             1. If the preceding strong type is also opposite the embedding
                direction, context is established, so set the type for both
                brackets in the pair to that direction.
             2. Otherwise set the type for both brackets in the pair to the
                embedding direction.
           */
          if (foundStrongType && !useStrongType) {
            useStrongType = sosType;
            for (let si = openSeqIdx - 1; si >= 0; si--) {
              const i = seqIndices[si];
              if (charTypes[i] & STRONG_TYPES_FOR_N_STEPS) {
                useStrongType = (charTypes[i] & R_TYPES_FOR_N_STEPS)
                  ? ChrTyp.R
                  : ChrTyp.L;
                break;
              }
            }
          }
          if (useStrongType) {
            charTypes[seqIndices[openSeqIdx]] =
              charTypes[seqIndices[closeSeqIdx]] =
                useStrongType;
            /*
            * Any number of characters that had original bidirectional character
              type NSM prior to the application of W1 that immediately follow a
              paired bracket which changed to L or R under N0 should change to
              match the type of their preceding bracket.
             */
            for (let si = openSeqIdx + 1; si < seqIndices.length; si++) {
              if (!(charTypes[seqIndices[si]] & BN_LIKE)) {
                if (chrTypOf(string_x[seqIndices[si]]) & ChrTyp.NSM) {
                  charTypes[seqIndices[si]] = useStrongType;
                }
                break;
              }
            }
            for (let si = closeSeqIdx + 1; si < seqIndices.length; si++) {
              if (!(charTypes[seqIndices[si]] & BN_LIKE)) {
                if (chrTypOf(string_x[seqIndices[si]]) & ChrTyp.NSM) {
                  charTypes[seqIndices[si]] = useStrongType;
                }
                break;
              }
            }
          }
        }

        /*
        N1. A sequence of NIs takes the direction of the surrounding strong
          text if the text on both sides has the same direction.
        N2. Any remaining NIs take the embedding direction.
         */
        for (let si = 0, siI = seqIndices.length; si < siI; si++) {
          if (!(charTypes[seqIndices[si]] & NEUTRAL_ISOLATE)) {
            continue;
          }

          let niRunStart = si, niRunEnd = si;
          let prevType = sosType;
          for (let si2 = si - 1; si2 >= 0; si2--) {
            if (charTypes[seqIndices[si2]] & BN_LIKE) {
              niRunStart = si2; // 5.2 treat BNs adjacent to NIs as NIs
            } else {
              prevType = (charTypes[seqIndices[si2]] & R_TYPES_FOR_N_STEPS)
                ? ChrTyp.R
                : ChrTyp.L;
              break;
            }
          }
          let nextType = eosType;
          for (let si2 = si + 1; si2 < siI; si2++) {
            if (
              charTypes[seqIndices[si2]] & (NEUTRAL_ISOLATE | BN_LIKE)
            ) {
              niRunEnd = si2;
            } else {
              nextType = (charTypes[seqIndices[si2]] & R_TYPES_FOR_N_STEPS)
                ? ChrTyp.R
                : ChrTyp.L;
              break;
            }
          }
          for (let sj = niRunStart; sj <= niRunEnd; sj++) {
            charTypes[seqIndices[sj]] = prevType === nextType
              ? prevType
              : embedDirection;
          }
          si = niRunEnd;
        }
      }
    }

    // === 3.3.6 Resolving Implicit Levels ===

    for (let i = paragraph.start, iI = paragraph.end; i <= iI; i++) {
      const level = embedLevels[i];
      const type = charTypes[i];
      /*
      I2. For all characters with an odd (right-to-left) embedding level, those
        of type L, EN or AN go up one level.
       */
      if (level & 1) {
        if (type & (ChrTyp.L | ChrTyp.EN | ChrTyp.AN)) {
          embedLevels[i]++;
        }
      } //
      /*
      I1. For all characters with an even (left-to-right) embedding level, those
        of type R go up one level and those of type AN or EN go up two levels.
       */
      else {
        if (type & ChrTyp.R) {
          embedLevels[i]++;
        } else if (type & (ChrTyp.AN | ChrTyp.EN)) {
          embedLevels[i] += 2;
        }
      }

      /*
      5.2: Resolve any LRE, RLE, LRO, RLO, PDF, or BN to the level of the
        preceding character if there is one, and otherwise to the base level.
       */
      if (type & BN_LIKE) {
        embedLevels[i] = i === 0 ? paragraph.level : embedLevels[i - 1];
      }

      /*
      3.4 L1.1-4: Reset the embedding level of segment/paragraph separators, and
        any sequence of whitespace or isolate formatting characters preceding
        them or the end of the paragraph, to the paragraph level.
      NOTE: this will also need to be applied to each individual line ending
        after line wrapping occurs.
       */
      if (
        i === paragraph.end || chrTypOf(string_x[i]) & (ChrTyp.S | ChrTyp.B)
      ) {
        for (
          let j = i;
          j >= 0 && (chrTypOf(string_x[j]) & TRAILING);
          j--
        ) {
          embedLevels[j] = paragraph.level;
        }
      }
    }
  }

  /*
  DONE! The resolved levels can then be used, after line wrapping, to flip runs
  of characters according to section 3.4 Reordering Resolved Levels
   */
  return {
    levels: embedLevels,
    paragraphs,
  };

  function determineAutoEmbedLevel(start_y: uint, isFSI_y: boolean): 0 | 1 {
    // 3.3.1 P2 - P3
    for (let i = start_y; i < IN_LEN; i++) {
      const charType = charTypes[i];
      if (charType & (ChrTyp.R | ChrTyp.AL)) {
        return 1;
      }
      if (
        (charType & (ChrTyp.B | ChrTyp.L)) ||
        (isFSI_y && charType === ChrTyp.PDI)
      ) {
        return 0;
      }
      if (charType & ISOLATE_INIT) {
        const pdi = indexOfMatchingPDI(i);
        i = pdi === -1 ? IN_LEN : pdi;
      }
    }
    return 0;
  }

  function indexOfMatchingPDI(isolateStart: uint): uint | -1 {
    // 3.1.2 BD9
    let isolationLevel: EmbedLevel = 1;
    for (let i = isolateStart + 1; i < IN_LEN; i++) {
      const charType = charTypes[i];
      if (charType & ChrTyp.B) {
        break;
      }
      if (charType & ChrTyp.PDI) {
        if (--isolationLevel === 0) {
          return i;
        }
      } else if (charType & ISOLATE_INIT) {
        isolationLevel++;
      }
    }
    return -1;
  }
}

type Segment = [uint, uint];

/**
 * Given a start and end denoting a single line within a string, and a set of
 * precalculated bidi embedding levels, produce a list of segments whose
 * ordering should be flipped, in sequence.
 *
 * @const @param string_x the full input string
 * @const @param embeddingLevelsResult_x the result object from getEmbeddingLevels
 * @param start_x first character in a subset of the full string
 * @param end_x last character in a subset of the full string
 * @return the list of start/end segments that should be flipped, in order.
 */
function getReorderSegments(
  string_x: string,
  embeddingLevelsResult_x: GetEmbeddingLevelsResult,
  start_x?: uint,
  end_x?: uint,
): Segment[] {
  const IN_LEN = string_x.length;
  start_x = Math.max(0, start_x ?? 0);
  end_x = Math.min(IN_LEN - 1, end_x ?? IN_LEN - 1);

  const segments: Segment[] = [];
  for (const paragraph of embeddingLevelsResult_x.paragraphs) {
    const lineStart = Math.max(start_x!, paragraph.start);
    const lineEnd = Math.min(end_x!, paragraph.end);
    if (lineStart >= lineEnd) continue;

    // Local slice for mutation
    const lineLevels = embeddingLevelsResult_x.levels.slice(
      lineStart,
      lineEnd + 1,
    );

    /*
    3.4 L1. 4. Reset any sequence of whitespace characters and/or isolate
      formatting characters at the end of the line to the paragraph level.
     */
    for (
      let i = lineEnd;
      i >= lineStart && (chrTypOf(string_x[i]) & TRAILING);
      i--
    ) {
      lineLevels[i] = paragraph.level;
    }

    /*
    L2. From the highest level found in the text to the lowest odd level on each
      line, including intermediate levels not actually present in the text,
      reverse any contiguous sequence of characters that are at that level or
      higher.
     */
    let maxLevel = paragraph.level;
    let minOddLevel = Infinity;
    for (let i = 0, iI = lineLevels.length; i < iI; i++) {
      const level = lineLevels[i];
      if (level > maxLevel) maxLevel = level;
      if (level < minOddLevel) minOddLevel = level | 1;
    }
    for (let lvl = maxLevel; lvl >= minOddLevel; lvl--) {
      for (let i = 0, iI = lineLevels.length; i < iI; i++) {
        if (lineLevels[i] < lvl) continue;

        const segStart = i;
        while (i + 1 < lineLevels.length && lineLevels[i + 1] >= lvl) {
          i++;
        }
        if (i > segStart) {
          segments.push([segStart + lineStart!, i + lineStart!]);
        }
      }
    }
  }
  return segments;
}

/**
 * @const @param string_x
 * @const @param embedLevelsResult_x
 * @const @param iStrt_x
 * @const @param iStop_x
 * @headconst @param indices
 * @return an array with character indices in their new bidi order
 */
function getReorderedIndices(
  string_x: string,
  embedLevelsResult_x: GetEmbeddingLevelsResult,
  iStrt_x = 0,
  iStop_x = string_x.length,
  indices = new Array<uint>(iStop_x),
): uint[] {
  /*#static*/ if (INOUT) {
    assert(0 <= iStrt_x && iStrt_x < iStop_x && iStop_x <= string_x.length);
    assert(iStop_x <= indices.length);
  }
  const segments = getReorderSegments(
    string_x,
    embedLevelsResult_x,
    iStrt_x,
    iStop_x - 1,
  );
  for (let i = iStrt_x; i < iStop_x; i++) {
    indices[i] = i;
  }
  // Reverse each segment in order
  segments.forEach(([start_y, end_y]) => {
    const slice = indices.slice(start_y, end_y + 1);
    for (let i = slice.length; i--;) {
      indices[end_y - i] = slice[i];
    }
  });
  return indices;
}
/*80--------------------------------------------------------------------------*/

/** @final */
export class Bidi {
  static #ID = 0 as id_t;
  readonly id = ++Bidi.#ID as id_t;

  #text!: string;
  #dir!: "ltr" | "rtl";

  /* #wrap_a */
  #wrap_a!: loff_t[];
  #rowN: uint | undefined;
  get rowN() {
    return this.#rowN ??= this.#wrap_a.length;
  }

  /**
   * [ 0, #wrap_a.length )
   */
  #lastRow: uint | -1 = -1;
  // get _lastRow() {
  //   return this.#lastRow;
  // }
  /**
   * `#lastRow` could be changed
   * @const @param l_x [ 0, #text.length ]
   * @return `#lastRow`
   */
  rowOf(l_x: loff_t) {
    let ret: uint;
    for (let r = 0; r < this.rowN; ++r) {
      if (l_x < this.#wrap_a[r]) {
        ret = r;
        break;
      }
      if (l_x === this.#wrap_a[r]) {
        ret = r + 1 === this.#lastRow ? r + 1 : r;
        break;
      }
    }
    /*#static*/ if (INOUT) {
      assert(0 <= ret! && ret! < this.rowN);
    }
    return this.#lastRow = ret!;
  }

  /**
   * `in( 0 <= row_x && row_x < this.rowN)`
   */
  #rowStrtOf(row_x: uint): loff_t {
    return row_x === 0 ? 0 : this.#wrap_a[row_x - 1];
  }
  /* ~ */

  /* #embedLevels */
  #embedLevels: GetEmbeddingLevelsResult | undefined;
  get embedLevels() {
    return this.#embedLevels ??= getEmbeddingLevels(this.#text, this.#dir);
  }

  /**
   * `in( this.#embedLevels )`
   */
  #lrOf(l_x: loff_t): ChrTyp.R | ChrTyp.L {
    return (this.#embedLevels!.levels[l_x] & 1) ? ChrTyp.R : ChrTyp.L;
  }
  get _lr_a() {
    if (!this.#embedLevels) this.validate();

    const ret = new Array<ChrTyp.R | ChrTyp.L>(this.#text.length);
    for (let i = this.#text.length; i--;) {
      ret[i] = this.#lrOf(i);
    }
    return ret;
  }
  /* ~ */

  #visul_a: loff_t[] | undefined;
  get _visul_a() {
    return this.#visul_a;
  }
  /**
   * One logal could map to one or two visul. In case of two, `#lastVisul`
   * specifies the one if it's one of thw two.\
   * [ 0, #text.length ]
   */
  #lastVisul: loff_t | -1 = -1;
  // get _lastVisul() {
  //   return this.#lastVisul;
  // }
  /**
   * `#lastVisul` could be changed
   * @const @param l_x [ 0, #text.length ]
   * @const @param row_x
   * @return `#lastVisul`
   */
  #visulOf(l_x: loff_t, row_x: uint): loff_t {
    if (!this.#visul_a) this.validate();

    const b_0 = this.#rowStrtOf(row_x), b_1 = this.#wrap_a[row_x];
    /*#static*/ if (INOUT) {
      assert(b_0 <= l_x && l_x <= b_1);
    }
    let v_0: loff_t, v_1: loff_t;
    if (l_x === b_1) {
      if (l_x > b_0) {
        v_1 = this.#visul_a![l_x - 1] +
          (this.#lrOf(l_x - 1) === ChrTyp.R ? 0 : 1);
      } else {
        v_1 = b_0;
      }
      v_0 = v_1;
    } else {
      v_0 = this.#visul_a![l_x] + (this.#lrOf(l_x) === ChrTyp.R ? 1 : 0);
      if (l_x > b_0) {
        v_1 = this.#visul_a![l_x - 1] +
          (this.#lrOf(l_x - 1) === ChrTyp.R ? 0 : 1);
      } else {
        v_1 = v_0;
      }
    }
    if (v_0 === v_1) {
      this.#lastVisul = v_0;
    } else if (v_0 !== this.#lastVisul && v_1 !== this.#lastVisul) {
      // The right one takes the precedence
      this.#lastVisul = Math.max(v_0, v_1);
    }
    return this.#lastVisul;
  }

  #logal_a: loff_t[] | undefined;
  get _logal_a() {
    return this.#logal_a;
  }
  get valid() {
    return !!this.#logal_a;
  }
  /**
   * `#lastLogal` will not be changed
   * @const @param l_x [ 0, #text.length ]
   * @const @param row_x
   * @return [ logal of (0), logal of (1) ] in the visual "x ](0) [(1) x",
   */
  #logalOf(v_x: loff_t, row_x: uint): [loff_t, loff_t] {
    if (!this.#logal_a) this.validate();

    const ret = new Array(2) as [loff_t, loff_t];
    const b_0 = this.#rowStrtOf(row_x), b_1 = this.#wrap_a[row_x];
    /*#static*/ if (INOUT) {
      assert(b_0 <= v_x && v_x <= b_1);
    }
    let l_: loff_t;
    if (v_x === b_1) {
      if (v_x > b_0) {
        l_ = this.#logal_a![v_x - 1];
        ret[0] = l_ + (this.#lrOf(l_) === ChrTyp.R ? 0 : 1);
      } else {
        ret[0] = b_0;
      }
      ret[1] = ret[0];
    } else {
      l_ = this.#logal_a![v_x];
      ret[1] = l_ + (this.#lrOf(l_) === ChrTyp.R ? 1 : 0);
      if (v_x > b_0) {
        l_ = this.#logal_a![v_x - 1];
        ret[0] = l_ + (this.#lrOf(l_) === ChrTyp.R ? 0 : 1);
      } else {
        ret[0] = ret[1];
      }
    }
    return ret;
  }

  /**
   * One visul could map to one or two logal. In case of two, `#lastLogal`
   * specifies the one if it's one of thw two.\
   * [ 0, #text.length ]
   */
  #lastLogal: loff_t | -1 = -1;
  get lastLogal() {
    return this.#lastLogal;
  }

  get _lastVL() {
    return [this.#lastVisul, this.#lastLogal];
  }
  get _lastRVL() {
    return [this.#lastRow, this.#lastVisul, this.#lastLogal];
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  reset(
    text_x: string,
    dir_x: BufrDir,
    wrap_a_x = [text_x.length],
    embedLevels_x?: GetEmbeddingLevelsResult,
  ) {
    this.#text = text_x;
    this.#dir = dir_x === BufrDir.ltr ? "ltr" : "rtl";
    // console.log({ dir_x });
    this.#wrap_a = wrap_a_x;
    this.#embedLevels = embedLevels_x;

    this.#rowN = undefined;
    this.#visul_a = undefined;
    this.#logal_a = undefined;
  }

  validate(): this {
    // /*#static*/ if (_TRACE) {
    //   console.log(`${global.indent}>>>>>>> Bidi.validate() >>>>>>>`);
    // }
    if (this.valid) {
      // /*#static*/ if (_TRACE) global.outdent;
      return this;
    }

    const LEN = this.#wrap_a.at(-1)!;
    /*#static*/ if (INOUT) {
      assert(LEN === this.#text.length);
    }
    this.#embedLevels ??= getEmbeddingLevels(this.#text, this.#dir);
    this.#logal_a = new Array(LEN);
    this.#visul_a = new Array(LEN);
    if (LEN) {
      let i_ = 0;
      for (const iI of this.#wrap_a) {
        /*#static*/ if (INOUT) {
          assert(i_ < iI);
        }
        getReorderedIndices(
          this.#text,
          this.#embedLevels,
          i_,
          iI,
          this.#logal_a,
        );
        for (let j = i_; j < iI; ++j) {
          this.#visul_a[this.#logal_a![j]] = j;
        }
        i_ = iI;
      }
    }
    // /*#static*/ if (_TRACE) {
    //   console.log(`${global.dent}`, [...this.#text]);
    //   // console.log(`${global.dent}[${this.#wrap_a}]`);
    //   // console.log(
    //   //   `${global.dent}#embedLevels.levels = [${this.#embedLevels.levels}]`,
    //   // );
    //   // console.log(`${global.dent}[${this._lr_a}]`);
    //   // console.log(`${global.dent}#visul_a = [${this.#visul_a}]`);
    //   // console.log(`${global.dent}#logal_a = [${this.#logal_a}]`);
    //   global.outdent;
    // }
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * Set `#lastVisul`, `#lastLogal`
   * @const @param v_x [ 0, #text.length ]
   * @const @param row_x
   * @rreturn `#lastLogal`
   */
  #visulFar(v_x: loff_t, row_x: uint): loff_t {
    this.#lastVisul = v_x;
    const [l_0, l_1] = this.#logalOf(v_x, row_x);
    if (l_0 === l_1) {
      this.#lastLogal = l_0;
    } else if (l_0 !== this.#lastLogal && l_1 !== this.#lastLogal) {
      // The right one takes the precedence
      this.#lastLogal = Math.max(l_0, l_1);
    }
    return this.#lastLogal;
  }
  /**
   * Set `#lastRow`, `#lastVisul`, `#lastLogal`
   * @const @param row_x
   * @rreturn `#lastLogal`
   */
  visulFarleften(row_x = this.#dir === "rtl" ? this.rowN - 1 : 0): loff_t {
    this.#lastRow = row_x;
    return this.#visulFar(this.#rowStrtOf(row_x), row_x);
  }
  /** @see {@linkcode visulFarleften()} */
  visulFarrigten(row_x = this.#dir === "rtl" ? 0 : this.rowN - 1): loff_t {
    this.#lastRow = row_x;
    return this.#visulFar(this.#wrap_a[row_x], row_x);
  }

  /**
   * Set `#lastRow`, `#lastVisul`, `#lastLogal`
   * @const @param l_x
   * @return effective or not
   *    Not to checking whether `#lastLogal`, `#lastVisul`, `#lastRow` are
   *    changed, because there are effective cases that all of them are
   *    unchanged.
   */
  visulLeften(l_x: loff_t): boolean {
    const row = this.rowOf(l_x);
    this.#visulOf(l_x, row);
    if (this.#lastVisul === this.#rowStrtOf(row)) {
      if (this.#dir === "rtl") {
        if (row === this.rowN - 1) {
          // this.visulFarleften();
          return false;
        } else {
          this.visulFarrigten(row + 1);
          return true;
        }
      } else {
        if (row === 0) {
          // this.visulFarleften();
          return false;
        } else {
          this.visulFarrigten(row - 1);
          return true;
        }
      }
    }

    let [l_0, l_1] = this.#logalOf(this.#lastVisul, row);
    if (l_0 === l_1 || l_0 === this.#lastLogal) {
      this.#lastVisul -= 1;
      [l_0, l_1] = this.#logalOf(this.#lastVisul, row);
      this.#lastLogal = l_1;
    } else {
      this.#lastLogal = l_0;
    }
    return true;
  }
  /** @see {@linkcode visulLeften()} */
  visulRigten(l_x: loff_t): boolean {
    const row = this.rowOf(l_x);
    this.#visulOf(l_x, row);
    if (this.#lastVisul === this.#wrap_a[row]) {
      if (this.#dir === "rtl") {
        if (row === 0) {
          // this.visulFarrigten();
          return false;
        } else {
          this.visulFarleften(row - 1);
          return true;
        }
      } else {
        if (row === this.rowN - 1) {
          // this.visulFarrigten();
          return false;
        } else {
          this.visulFarleften(row + 1);
          return true;
        }
      }
    }

    let [l_0, l_1] = this.#logalOf(this.#lastVisul, row);
    if (l_0 === l_1 || l_1 === this.#lastLogal) {
      this.#lastVisul += 1;
      [l_0, l_1] = this.#logalOf(this.#lastVisul, row);
      this.#lastLogal = l_0;
    } else {
      this.#lastLogal = l_1;
    }
    return true;
  }
}
/*80--------------------------------------------------------------------------*/
