/** 80**************************************************************************
 * @module lib/util/Visitor
 * @license BSD-3-Clause
 ******************************************************************************/

export {};
/*80--------------------------------------------------------------------------*/

export interface Visitor {
  visit(visitable: Visitable): void;
}

export abstract class Visitable {
  // /** @final */
  // accept(visitor: Visitor) {
  //   visitor.visit(this);
  // }
}
/*80--------------------------------------------------------------------------*/
