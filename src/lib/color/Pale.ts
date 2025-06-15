/** 80**************************************************************************
 * @module lib/color/Pale
 * @license BSD-3-Clause
 ******************************************************************************/

import { z } from "@zod";
import { INOUT } from "../../global.ts";
import { Boor, Moo, type MooHandler } from "../Moo.ts";
import type { id_t } from "../alias.ts";
import { assert, warn } from "../util/trace.ts";
import type { PaleCoorRaw, PaleName } from "./PaleCoor.ts";
import { createPaleCoorRaw, PaleCoor, zPaleCoorRaw } from "./PaleCoor.ts";
import { Theme } from "./Theme.ts";
import type { CsscHexNorm } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

export type PaleCidx = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PaleRaw = {
  coors: PaleCoorRaw[];
  cidx: PaleCidx;
};
export const zPaleRaw = z.object({
  coors: z.array(zPaleCoorRaw).nonempty(),
  cidx: z.number().int().min(-1).max(7),
});
/*64----------------------------------------------------------*/

export type PaleColr = [PaleName, PaleCidx];

// export type p_t = PaleColr | null;
// type PNHandler = MooHandler<p_t>;

// /** @final */
// class PMoo extends Moo<p_t> {
//   constructor(p_x: p_t) {
//     super(p_x, (a, b) => a === b || Is.array(a) && a.eq(b));
//   }

//   dup() {
//     return new PMoo(this.val);
//   }
// }
/*64----------------------------------------------------------*/

/** @final */
export class Pale {
  static #ID = 0 as id_t;
  readonly id = ++Pale.#ID as id_t;
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // #constructing = false;

  // readonly #raw: { /* m?:number,  */ [key: string]: any };
  // get palt(): PaleType {
  //   return this.#raw.t;
  // }
  // get name(): PaleName {
  //   return this.#raw.n;
  // }
  // get desc() {
  //   return this.#raw.d;
  // }
  #_name_: PaleName;

  // #lUpd: string | undefined;
  // readonly #l_mo: Moo<string>;
  // get label() {
  //   return this.#l_mo.val;
  // }
  // registLHandler(handler: MooHandler<string>) {
  //   this.#l_mo.registHandler(handler);
  // }
  // removeLHandler(handler: MooHandler<string>) {
  //   this.#l_mo.removeHandler(handler);
  // }
  // /**
  //  * @const @param newl
  //  */
  // setL(newl: string) {
  //   this.#l_mo.val = newl;

  //   const rawl = <string | undefined> this.#raw.l ?? "";
  //   if (newl === rawl) {
  //     this.#lUpd = undefined;
  //   } else this.#lUpd = newl;

  //   this.modified = this.modified;
  // }

  // readonly #pm_a: (PMoo | undefined)[]; // `undefined` means newly created
  // registPiHandler(cidx: PaleCidx, handler: PNHandler) {
  //   this.pm(cidx).registHandler(handler);
  // }
  // removePiHandler(cidx: PaleCidx, handler: PNHandler) {
  //   this.pm(cidx).removeHandler(handler);
  // }
  // readonly #pmUpd_a: (PMoo | undefined)[];

  // readonly #cnm_a: (ColrNodeMo | undefined)[]; // `undefined` means newly created
  // // resetCiHandler( cidx ) { return this.#cnm_a[cidx].reset(); }
  // registCiHandler(cidx: PaleCidx, handler: CNHandler) {
  //   this.cnm(cidx).registHandler(handler);
  // }
  // removeCiHandler(cidx: PaleCidx, handler: CNHandler) {
  //   this.cnm(cidx).removeHandler(handler);
  // }
  // readonly #cnmUpd_a: (ColrNodeMo | undefined)[];
  // get clen() {
  //   return this.#cnmUpd_a.length;
  // }

  // readonly #c_mo: Moo<
  //   number
  // >; /** `-2`: cnm(2) is deleted; `3`: cnm(3) is added  */
  // // resetCHandler() { return this.#c_mo.reset(); }
  // registCHandler(handler: MooHandler<number>) {
  //   this.#c_mo.registHandler(handler);
  // }
  // removeCHandler(handler: MooHandler<number>) {
  //   this.#c_mo.removeHandler(handler);
  // }

  readonly coor_a: PaleCoor[] = [];
  readonly cidx_mo = new Moo<PaleCidx>({ val: 0 });
  get cidx() {
    return this.cidx_mo.val;
  }
  get coor() {
    return this.coor_a[this.cidx];
  }

  readonly modified_br_Pale = new Boor({
    val: false,
    _name_: `Pale_${this.id}.modified_br`,
  });
  // /** For `coor_a` and `#cidx`. Not for elements of `coor_a`. */
  // #modified = false;
  // get modified() {
  //   // return this.#lUpd !== undefined ||
  //   //   this.#cnmUpd_a.length !== this.#raw.c.length ||
  //   //   this.#cnmUpd_a.some((cnm) => cnm !== undefined) ||
  //   //   this.#pmUpd_a.some((pm) => pm !== undefined);
  //   this.#modified ||= this.coor_a.some((coor) => coor.modified);
  //   return this.#modified;
  // }
  // /**
  //  * @const @param modified_x
  //  */
  // set modified(modified_x: boolean) {
  //   // if( modified_x ) this.#raw.m = Date.now();
  //   if (modified_x === this.#modified) return;

  //   this.#modified = modified_x;

  //   const modified_pale_m = document[$theme_modified].pale_m;
  //   if (modified_x) {
  //     modified_pale_m.set(this.name, this);
  //   } else modified_pale_m.delete(this.name);

  //   document[$theme_modified].modified_mo.val = modified_pale_m.size !== 0;
  // }

  /* @hex_mo */
  readonly #hex_mo = new Moo<CsscHexNorm>({
    val: "#ff0000",
    active: true,
    _name_: `Pale_${this.id}.#hex_mo`,
  });
  get cssc() {
    return this.#hex_mo.val;
  }

  // resetCssHandler() { return this.#hex_mo.reset(); }
  registCsscHandler(h_x: MooHandler<CsscHexNorm>) {
    this.#hex_mo.registHandler(h_x);
  }
  removeCsscHandler(h_x: MooHandler<CsscHexNorm>) {
    this.#hex_mo.removeHandler(h_x);
  }

  /**
   * After changing cidx, to make sure to trigger the chain reaction, `#hex_mo`
   * needs to set `#forcingOnce` explicitly.
   */
  forceHex(): this {
    this.#hex_mo.force();
    return this;
  }
  /* ~ */

  /**
   * @const @param raw_x
   * @const @param name_x For debugging only
   */
  private constructor(raw_x: PaleRaw, name_x: PaleName = "") {
    // /*#static*/ if (INOUT) {
    //   assert(!this.#constructing);
    // }
    // this.#raw = Theme.instance.theme_o[name_x];

    // this.#l_mo = new Moo(<string | undefined> this.#raw.l ?? "");

    // // this.bupd_; /** @member { String | undefined } */
    // // // this.bmoo_ = new Moo( this.#raw.b ); /** @member */
    // // // this.b_mo_ = new Moo( false ); /** @member */
    // // this.subna_ts_ = 0; /** @member { Number } */
    // // this.subna_; /** @member { Pale[] } */
    // // this.depth_ts_ = 0; /** @member { Number } */
    // // this.depth_ = -1; /** @member { Number } */

    // const CLEN = this.#raw.c.length;
    // this.#constructing = true;
    // const rawp = this.#raw.p;
    // if (rawp) {
    //   this.#pm_a = rawp.map((pi_y: p_t) => new PMoo(pi_y));
    //   this.#cnm_a = this.#raw.c.map((ci_y: c_t, i_y: PaleCidx) =>
    //     new ColrNodeMo(ci_y, [name_x, i_y], ColrNodeMo.getBy(rawp[i_y]))
    //   );
    // } else {
    //   this.#pm_a = new Array(CLEN).fill(new PMoo(null));
    //   this.#cnm_a = this.#raw.c.map((c_y: c_t, i_y: PaleCidx) =>
    //     new ColrNodeMo(c_y, [name_x, i_y])
    //   );
    // }
    // this.#constructing = false;
    this.#_name_ = name_x;

    // this.#pmUpd_a = new Array(CLEN).fill(undefined);
    // this.#cnmUpd_a = new Array(CLEN).fill(undefined);

    // this.#c_mo = new Moo<number>(0, undefined, "force");

    // this.#cidx = Pale.loadCidxOf(this);
    this.cidx_mo.set_Moo(raw_x.cidx);
    for (const coor of raw_x.coors) {
      const coor_ = new PaleCoor(coor, this.#_name_);
      this.coor_a.push(coor_);
      coor_.addFn(this.#onCoor);
      coor_.modified_br_PaleCoor.onTru(this.#onCoorModified);
    }

    this.cidx_mo.registHandler((n_y) => {
      this.modified_br_Pale.val = true;
      this.#hex_mo.val = this.coor_a[n_y].mapped_c.hex;
    });

    if (this.cidx < 0 || this.coor_a.length <= this.cidx) {
      this.cidx_mo.val = 0;
    }
    this.coor.run();

    // // this.#pmUpd_a = new Array( this.#raw.r.length ); /** @member { (Number[2]|undefined)[] } */
    // // this.rmoo_ = this.#raw.r.map( r => new Moo(r,(a,b)=>a.eq(b)) ); /** @member { Map[] } */
    // // this.r_mo_ = new Moo( false ); /** @member */

    // /* out */ {
    //   assert(this.#raw);
    //   assert(0 <= this.cidx && this.cidx < this.clen);
    // }
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  readonly #onCoor = ((_: unknown, _1: unknown, _2: unknown, _x: PaleCoor) => {
    if (this.coor_a.indexOf(_x) === this.cidx) {
      this.#hex_mo.val = _x.mapped_c.hex;
    }
  }) as MooHandler<true, unknown, PaleCoor>;
  readonly #onCoorModified = (_x: boolean) => {
    this.modified_br_Pale.val = _x;
  };

  addCoor() {
    const coor_ = new PaleCoor(createPaleCoorRaw(), this.#_name_);
    this.coor_a.push(coor_);
    coor_.addFn(this.#onCoor);
    coor_.modified_br_PaleCoor.onTru(this.#onCoorModified);

    this.modified_br_Pale.val = true;
  }

  deleteCoor(_x: PaleCidx): boolean {
    /*#static*/ if (INOUT) {
      assert(2 <= this.coor_a.length);
      assert(0 <= _x && _x < this.coor_a.length);
    }
    let recidx = false;
    // ! coor_a[_x]` should not be shared, so no need to dismantle handlers
    this.coor_a.splice(_x, 1);

    if (_x < this.cidx) {
      this.cidx_mo.set_Moo(this.cidx - 1 as PaleCidx);
    } else if (_x === this.cidx) {
      if (_x >= this.coor_a.length) _x = this.coor_a.length - 1 as PaleCidx;
      this.cidx_mo.force().val = _x;
      recidx = true;
    }
    this.modified_br_Pale.val = true;

    return recidx;
  }

  // // get basename() {
  // //   let ret = this.bupd_;
  // //   if (ret === undefined) ret = this.#raw.b;
  // //   return ret;
  // // }
  // // get isRoot() { return !this.basename; }

  // // /**
  // //  * Including `this`
  // //  * @return { Pale[] }
  // //  */
  // // get supa1()
  // // {
  // //   const ret = [ this ];
  // //   let name0 = this.basename;
  // //   if ( name0 )
  // //   {
  // //     let pale0;
  // //     let valve = 100+1;
  // //     while( name0 && --valve )
  // //     {
  // //       pale0 = Pale.get( name0 );
  // //       ret.push( pale0 );
  // //       name0 = pale0.basename;
  // //     }
  // //     assert(valve);
  // //   }
  // //   return ret;
  // // }

  // // /**
  // //  * @return { String[] }
  // //  */
  // // get subna1()
  // // {
  // //   if( this.subna_ts_ > document[$theme_modified].struct_ts
  // //    && this.subna_
  // //   ) return this.subna_;

  // //   this.subna_ = [];
  // //   const theme_o = Theme.instance.theme_o;
  // //   const thisname = this.name;
  // //   for( let palename in theme_o )
  // //   {
  // //     if( Pale.get(palename).basename === thisname )
  // //       this.subna_.push( palename );
  // //   }

  // //   this.subna_ts_ = Date.now();
  // //   return this.subna_;
  // // }

  // // /**
  // //  * @return { Number }
  // //  */
  // // get depth1()
  // // {
  // //   if( this.depth_ts_ > document[$theme_modified].struct_ts
  // //    && this.depth_ >= 0
  // //   ) return this.depth_;

  // //   this.depth_ = 0;
  // //   let name0 = this.basename;
  // //   if( name0 )
  // //   {
  // //     let pale0;
  // //     let valve = 100+1;
  // //     while( name0 && --valve )
  // //     {
  // //       pale0 = Pale.get( name0 );
  // //       ++this.depth_;
  // //       name0 = pale0.basename;
  // //     }
  // //     assert(valve);
  // //   }

  // //   this.depth_ts_ = Date.now();
  // //   return this.depth_;
  // // }

  // // /**
  // //  * @const @param { String } newb
  // //  */
  // // setBModified_( newb )
  // // {
  // //   if( newb === this.#raw.b )
  // //   {
  // //     this.bupd_ = undefined;
  // //     this.modified = this.modified;
  // //   }
  // //   else {
  // //     this.bupd_ = newb;
  // //     this.modified = true;
  // //   }

  // //   document[$theme_modified].struct_ts = Date.now(); //!
  // // }

  // // /**
  // //  * @const @param { String } b_x
  // //  * @return { Boolean } - set or not
  // //  */
  // // setBlue( b_x )
  // // {
  // //   /* in */ {
  // //     assert( b_x !== this.basename );
  // //   }

  // //   if( !b_x )
  // //   {
  // //     this.#pmUpd_a.reset();
  // //     this.setBModified_( b_x );
  // //     return true;
  // //   }

  // //   const MAXDEPTH = 30;
  // //   let palename = b_x;
  // //   let valve = MAXDEPTH+1;
  // //   while( palename && palename !== this.name && --valve )
  // //   {
  // //     palename = Pale.get(palename).basename;
  // //   }
  // //   if( palename === this.name )
  // //   {
  // //     console.warn("Recursive dependency!");
  // //     return false;
  // //   }
  // //   if( !valve )
  // //   {
  // //     console.warn(`Depth of dependency tree exceeds ${MAXDEPTH}!`);
  // //     return false;
  // //   }

  // //   this.#pmUpd_a.reset();
  // //   for( let i1 = this.clen; i1--; )
  // //   {
  // //     for( let i0 = Pale.get(b_x).clen; i0--; )
  // //     {
  // //       this.#pmUpd_a.add( [i0,i1] );
  // //     }
  // //   }
  // //   this.setBModified_( b_x );
  // //   return true;
  // // }
  // /*49-----------------------------------------*/

  // /**
  //  * `in( 0 <= this.cidx && this.cidx < this.clen )`
  //  * `out( ret; ret && !ret.deleted$_ )`
  //  * @const @param cidx
  //  */
  // cnm(cidx: PaleCidx): ColrNodeMo {
  //   let ret = this.#cnmUpd_a[cidx];
  //   if (ret === undefined || ret.deleted$_) {
  //     ret = this.#cnm_a[cidx];
  //   }
  //   return <ColrNodeMo> ret;
  // }
  // get curcnm() {
  //   return this.cnm(this.#cidx);
  // }

  // // #rawp = ( cidx:PaleCidx ):p_t =>
  // // {
  // //   if( this.#raw.p )
  // //   {
  // //     const ret = this.#raw.p[ cidx ];
  // //     if( ret === undefined )
  // //          return null;
  // //     else return ret;
  // //   }
  // //   else return null;
  // // }
  // pm(cidx: PaleCidx): PMoo {
  //   let ret = this.#pmUpd_a[cidx];
  //   ret ??= this.#pm_a[cidx];
  //   return <PMoo> ret;
  // }
  // get curpm() {
  //   return this.pm(this.#cidx);
  // }

  // /** Helper */
  // forEach_cnm(cb: (v: ColrNodeMo, i: PaleCidx) => void) {
  //   for (let i = 0, LEN = this.clen; i < LEN; i++) {
  //     cb(this.cnm(i), i);
  //   }
  // }
  // forEach_pm(cb: (v: PMoo, i: PaleCidx) => void) {
  //   for (let i = 0, LEN = this.clen; i < LEN; i++) {
  //     cb(this.pm(i), i);
  //   }
  // }
  // /*49-----------------------------------------*/

  // /**
  //  * @const @param cidx
  //  */
  // #select_impl = (cidx: PaleCidx) => {
  //   // console.log( `"${this.name}".#select_impl( ${cidx} )` );
  //   this.#cidx = cidx;
  //   this.#hex_mo.val = this.curcnm.cssc1();
  // };
  // #select_up = (cidx: PaleCidx, valve = 100) => {
  //   /*#static*/ if (INOUT) {
  //     assert(valve, "Loop 100 times. Check if `#construcing` works correctly");
  //   }
  //   const pi = this.pm(cidx).val;
  //   if (!pi) return;

  //   const pale0 = Pale.get(pi[0]);
  //   const cidx0 = pi[1];
  //   // const cidx0_a = this.#pmUpd_a.val1_0a$_(cidx);
  //   // const j = cidx0_a.indexOf(pale0.#cidx);
  //   // const cidx0 = j < 0 ? cidx0_a[0] : cidx0_a[j];
  //   // let cidx0;
  //   // if( j < 0 || j === cidx0_a.length-1 )
  //   //      cidx0 = cidx0_a[ 0 ];
  //   // else cidx0 = cidx0_a[ j + 1 ];

  //   pale0.#select_up(cidx0, valve - 1);
  //   pale0.#select_impl(cidx0);
  // };
  // #select_dn = (valve = 100) => {
  //   /*#static*/ if (INOUT) {
  //     assert(
  //       valve,
  //       "Loop too many times. Check if `#construcing` works correctly",
  //     );
  //   }
  //   for (const subcnm of this.curcnm.child_sa) {
  //     /**
  //      * Although the same Pale could appears many times (in which case, the last
  //      * ColrNodeMo wins), but it should be rare, and is harmless.
  //      */
  //     const pale1 = Pale.get(subcnm.palename);
  //     pale1.#select_impl(subcnm.palecidx);
  //     pale1.#select_dn(valve - 1);
  //   }

  //   // this.subna1.forEach( name1 => {
  //   //   const pale1 = Pale.get(name1);
  //   //   const cidx1_a = pale1.#pmUpd_a.val0_1a$_(cidx);
  //   //   const j = cidx1_a.indexOf(pale1.#cidx);
  //   //   const cidx1 = j < 0 ? cidx1_a[0] : cidx1_a[j];

  //   //   pale1.#select_impl( cidx1 );
  //   //   pale1.#select_dn( valve-1 );
  //   // });
  // };
  // select(cidx: PaleCidx, force = false) {
  //   /*#static*/ if (INOUT) {
  //     assert(0 <= cidx && cidx < this.clen);
  //   }
  //   if (cidx === this.#cidx && !force) return;

  //   this.#select_up(cidx);
  //   this.#select_impl(cidx);
  //   // this.#ctrastep_a = undefined; //!
  //   // this.#cidx = cidx;
  //   // this.#hex_mo.val = this.#cssc_impl();
  //   this.#select_dn();
  // }
  // /*49-----------------------------------------*/

  // /**
  //  * @const @param newc
  //  */
  // #set_cnm = (newc: c_t, cidx?: PaleCidx) => {
  //   // console.log( `Pale.#set_cnm( ${newc}, ${cidx} ):` );
  //   cidx ??= this.#cidx;
  //   assert(0 <= cidx && cidx < this.clen);
  //   if (newc === this.cnm(cidx).val) return;

  //   this.#cnmUpd_a[cidx] ??= this.#cnm_a[cidx]!.dup();
  //   if (this.#cnmUpd_a[cidx]!.deleted$_) {
  //     this.#cnmUpd_a[cidx]!.copy(<ColrNodeMo> this.#cnm_a[cidx]);
  //   }
  //   this.#cnmUpd_a[cidx]!.val = newc;

  //   if (newc === this.#cnm_a[cidx]?.val) {
  //     this.#cnmUpd_a[cidx]!.deleted$_ = true;
  //   }
  // };
  // /**
  //  * @const @param newp
  //  */
  // #set_pm = (newp: p_t, cidx?: PaleCidx) => {
  //   cidx ??= this.#cidx;
  //   assert(0 <= cidx && cidx < this.clen);
  //   if (newp === this.pm(cidx).val) return;

  //   this.#pmUpd_a[cidx] ??= this.#pm_a[cidx]!.dup();
  //   this.#pmUpd_a[cidx]!.val = newp;

  //   if (newp === this.#pm_a[cidx]?.val) this.#pmUpd_a[cidx] = undefined;
  // };
  // #cssc_dn = (cidx?: PaleCidx) => {
  //   // console.log( `>>>>>>> Pale.#cssc_dn() >>>>>>>` );
  //   cidx ??= this.#cidx;
  //   for (const subcnm of this.cnm(cidx).child_sa) {
  //     subcnm.cssc$_ = undefined; // force recalc in `subcnm.cssc1()`
  //     const pale1 = Pale.get(subcnm.palename);
  //     if (pale1.cidx === subcnm.palecidx) { // if `subcnm.palecidx` is the current one, invoke callbacks immediately
  //       pale1.#hex_mo.val = subcnm.cssc1();
  //     }
  //     pale1.#cssc_dn(subcnm.palecidx); //! force recalc further even not current
  //   }
  // };
  // /**
  //  * Do not touch `#cidx`
  //  * @const @param newc
  //  * @const @param newp
  //  */
  // setCP(newc?: c_t, newp?: p_t) {
  //   // console.log( `"${this.name}".setCP( ${c_x}, ${ctrastep_a} )` );
  //   if (newc !== undefined) this.#set_cnm(newc);
  //   if (newp !== undefined) this.#set_pm(newp);
  //   this.curcnm.parnt = ColrNodeMo.getBy(this.curpm.val); //!
  //   /* Callbacks before here can not rely on the dependence graph of ColrNodeMo's */

  //   this.curcnm.cssc$_ = undefined; // force recalc in `curcnm.cssc1()`
  //   this.#hex_mo.val = this.curcnm.cssc1();
  //   this.#cssc_dn();

  //   this.modified = this.modified;
  // }
  // setC(newc: c_t) {
  //   this.setCP(newc);
  // }
  // setP(newp: p_t) {
  //   this.setCP(undefined, newp);
  // }
  // // refresh() { this.setCP( this.curcnm ); }

  // addC() {
  //   // // #if _TRACE
  //   //   console.log(`>>>>>>> Pale.addC(${cidx}) >>>>>>>`);
  //   // // #endif
  //   const cidx = this.#cnmUpd_a.length;
  //   const newcnm = new ColrNodeMo("#ccc", [this.name, cidx]);
  //   this.#cnmUpd_a.push(newcnm);
  //   this.#cnm_a.push(undefined);

  //   this.#pmUpd_a.push(new PMoo(null));
  //   this.#pm_a.push(undefined);

  //   this.#c_mo.val = cidx;
  // }

  // /**
  //  * @const @param cidx
  //  */
  // delC(cidx: PaleCidx) {
  //   // // #if _TRACE
  //   //   console.log(`>>>>>>> Pale.delC(${cidx}) >>>>>>>`);
  //   // // #endif
  //   /*#static*/ if (INOUT) {
  //     assert(this.clen > 1);
  //     assert(0 <= cidx && cidx < this.clen);
  //   }
  //   if (this.#cidx === this.clen - 1) this.select(this.#cidx - 1); //!

  //   const cnm = this.cnm(cidx);
  //   cnm.parnt = null;
  //   for (const subcnm of cnm.child_sa) subcnm.parnt = null;

  //   for (
  //     let i = cidx + 1, LEN = this.#cnm_a.length;
  //     i < LEN && this.#cnm_a[i];
  //     ++i
  //   ) {
  //     this.#cnm_a[i]!.palecidx = i - 1;
  //   }
  //   this.#cnm_a.splice(cidx, 1);
  //   // If `#cnmUpd_a[i]` and `#cnm_a[i]` both are not `undefined`, then
  //   // `#palecolr` should be shared. So no need to adjust `palecidx` twice.
  //   // If either is `undefined`, the other's `palecidx` should be adjusted.
  //   // Here adjust both `palecidx` anyway just for simplicity.
  //   for (let i = cidx + 1, LEN = this.#cnmUpd_a.length; i < LEN; ++i) {
  //     if (this.#cnmUpd_a[i]) {
  //       this.#cnmUpd_a[i]!.palecidx = i - 1;
  //     }
  //   }
  //   this.#cnmUpd_a.splice(cidx, 1);

  //   this.#pmUpd_a.splice(cidx, 1);
  //   this.#pm_a.splice(cidx, 1);

  //   // console.log( this.cidx );
  //   this.#c_mo.val = -cidx;
  // }
  // /*49-----------------------------------------*/

  // // /**
  // //  * @const @param { Number } ridx
  // //  */
  // // r( ridx ) { return this.#pmUpd_a.at( ridx ); }
  // // r( ridx )
  // // {
  // //   // const out = ret => {
  // //   //   assert( ret && ret.length === 2 );
  // //   // }

  // //   let ret = this.#pmUpd_a[ ridx ];
  // //   if( ret === undefined ) ret = this.#raw.r[ ridx ];
  // //   // out( ret );
  // //   return ret;
  // // }
  // // get rlen() { return this.#pmUpd_a.len; }

  // // /** Helper */
  // // forEach_r( cb )
  // // {
  // //   for( let i=0, LEN=this.rlen; i < LEN; i++ )
  // //   {
  // //     cb( this.r(i), i );
  // //   }
  // // }

  // // /**
  // //  * @const @param { Number } cidx0
  // //  */
  // // addR( cidx0 )
  // // {
  // //   this.#pmUpd_a.add( [cidx0,this.#cidx] );

  // //   this.modified = this.modified; //!
  // // }

  // // /**
  // //  * @const @param { Number } cidx0
  // //  * @return { Number } - return `-1` if not delete
  // //  */
  // // delR( cidx0 )
  // // {
  // //   let ret = -1;
  // //   if( this.#pmUpd_a.count0$_(cidx0) > 1
  // //    && this.#pmUpd_a.count1$_(this.#cidx) > 1
  // //   ) ret = this.#pmUpd_a.del( [cidx0,this.#cidx] );

  // //   this.modified = this.modified; //!

  // //   return ret;
  // // }

  // // /**
  // //  * @return { Number[] } - return array of indexes of `c`
  // //  */
  // // get cidx0a1() { return this.#pmUpd_a.val1_0a$_(this.#cidx); }
  // /*49-----------------------------------------*/

  // // /**
  // //  * `in( 0 <= this.cidx && this.cidx < this.clen )`
  // //  * Based on `name_`, `#raw`jjjj
  // //  * Do not touch `#cidx`, `#hex_mo`
  // //  */
  // // #cssc_impl = ():Cssc =>
  // // {
  // //   // console.log( `>>>>>>> Pale.#cssc_impl() >>>>>>>` );
  // //   if( this.cidx < 0 )
  // //   {
  // //     this.#cidx = Pale.loadCidxOf( this );
  // //     if( this.#cidx < 0 ) this.#cidx = 0;
  // //     // if( this.#cidx < 0 )
  // //     //   this.#cidx = Number.getRandom( this.clen-1 );
  // //     // console.log( this.clen );
  // //     // console.log( this.#cidx );
  // //   }

  // //   if( this.curcnm.typ === "absolute" ) return this.curcnm.val;

  // //   let ret;
  // //   const pale0 = Pale.get( name0 );
  // //   if( this.#cidx < 0 )
  // //   {
  // //     assert( pale0.#cidx >= 0 );
  // //     // if( pale0.#cidx < 0 )
  // //     // {
  // //     //   assert(0,`run here`);
  // //     //   pale0.#cssc_impl();
  // //     // }
  // //     // console.log(pale0.#cidx);
  // //     const cidx_a = this.#pmUpd_a.val0_1a$_( pale0.#cidx );
  // //     // console.log({cidx_a});
  // //     assert( cidx_a.length );
  // //     this.#cidx = Pale.loadCidxOf( this );
  // //     if( this.#cidx < 0
  // //      || cidx_a.every( cidx_y => cidx_y !== this.#cidx )
  // //     ) this.#cidx = cidx_a[ Number.getRandom(cidx_a.length-1) ];
  // //     // console.log( this.#cidx );
  // //   }
  // //   // console.log(this.#cidx);

  // //   ret = this.curcnm;
  // //   // console.log( ret );
  // //   if( !ret )
  // //   {
  // //     ret = pale0.cssc;
  // //   }
  // //   else if( ColrNodeMo.isCtra(ret) )
  // //   {
  // //     Pale.colr_.setByCssc(pale0.cssc);
  // //     // console.log( Pale.colr_ );
  // //     if( !this.#ctrastep_a ) this.#ctrastep_a = przCtra( ret );
  // //     assert( this.#ctrastep_a );
  // //     this.#ctrastep_a.forEach( step => {
  // //       const fna = ctraabbr_m.find( fna => fna[1] === step[0] );
  // //       // console.log( fna );
  // //       if( fna ) Pale.colr_[fna[0]]( step[1] );
  // //     });
  // //     // console.log( Pale.colr_ );
  // //     ret = Pale.colr_.cssc;
  // //     // console.log( ret );
  // //   }
  // //   // console.log( this.#ctrastep_a );

  // //   // console.log( ret );
  // //   return ret;
  // // }

  // flush() {
  //   this.#raw.l = this.label;
  //   this.#lUpd = undefined;

  //   this.forEach_pm((pm, i) => {
  //     this.#raw.p[i] = pm.val;
  //     this.#cnmUpd_a[i] = undefined;
  //   });
  //   if (this.#raw.p.every((p: p_t) => p === null)) this.#raw.p = undefined;

  //   this.#raw.c.length = this.clen;
  //   this.forEach_cnm((cnm, i) => {
  //     this.#raw.c[i] = cnm.val;
  //     this.#cnmUpd_a[i] = undefined;
  //   });

  //   this.modified = false;
  // }

  // restore() {
  //   console.log(`Pale.restore(): ${this.name}`);
  //   //jjjj

  //   this.modified = false;
  // }

  static #createUndefined() {
    return new Pale({
      coors: [{
        "qm_a": [
          [null, "red"],
        ],
      }],
      cidx: 0,
    });
  }

  static readonly #creating_a: PaleName[] = [];
  /** @const @param name_x */
  static get(name_x: PaleName): Pale {
    const theme = Theme.instance;
    // let ret = Theme.instance.pale_modified_m.get(name_x);
    // if (ret) return ret;
    let ret = theme.pale_m.get(name_x);
    if (ret) return ret;

    const raw = theme.raw_o[name_x];
    if (!raw) {
      warn(`Pale "${name_x}" not found`);
      return Pale.#createUndefined();
    }

    if (Pale.#creating_a.includes(name_x)) {
      console.error(`"name_x" depends indirectly on itself!`);
      return Pale.#createUndefined();
    }

    Pale.#creating_a.push(name_x);
    ret = new Pale(raw, name_x);
    theme.pale_m.set(name_x, ret);
    /* `false` of `Pale.modified_br_Pale` won't have effects. */
    ret.modified_br_Pale.onTru((n_y) => {
      theme.modified_br_Theme.val = n_y;
    });
    /*#static*/ if (INOUT) {
      assert(Pale.#creating_a.at(-1) === name_x);
    }
    Pale.#creating_a.pop();
    return ret;
  }

  // /**
  //  * @headconst @param pale
  //  * @return return <0 if not exist or not valid
  //  */
  // static loadCidxOf(pale: Pale): PaleCidx | -1 {
  //   let ret;
  //   const itm = localStorage.getItem(pale.name);
  //   // console.log( typeof itm );
  //   if (itm === null) ret = -1;
  //   else {
  //     ret = Number(itm);
  //     if (ret >= pale.clen) ret = -1;
  //   }
  //   return ret;
  // }

  // /**
  //  * @const @param all_x
  //  */
  // static collectForSave(all_x = false): ThemeTsRaw {
  //   // console.log( "Pale.collectForSave():" );
  //   const ret = Object.create(null);
  //   ret.theme_ts = Theme.instance.theme_ts;
  //   ret.theme_o = Object.create(null);
  //   const theme_o = Theme.instance.theme_o;
  //   const modified_pale_m = document[$theme_modified].pale_m;
  //   for (let palename in theme_o) {
  //     const pale_o = ret.theme_o[palename] = Object.create(null);
  //     const pale = modified_pale_m.get(palename);
  //     // console.log( pale );
  //     if (pale) {
  //       pale_o.g = pale.#raw.g;
  //       pale_o.t = pale.palt;
  //       pale_o.n = pale.name;
  //       pale_o.d = pale.desc;

  //       pale_o.l = pale.label;
  //       if (!pale_o.l) pale_o.l = undefined;

  //       pale_o.p = [];
  //       pale.forEach_pm((pm) => pale_o.p.push(pm.val));
  //       if (pale_o.p.every((p: p_t) => p === null)) pale_o.p = undefined;

  //       pale_o.c = [];
  //       pale.forEach_cnm((cnm) => pale_o.c.push(cnm.val));
  //     } else {
  //       const pale0_o = theme_o[palename];
  //       pale_o.t = pale0_o.t;
  //       pale_o.g = pale0_o.g;
  //       pale_o.n = pale0_o.n;
  //       pale_o.d = pale0_o.d;
  //       if (pale0_o.l) pale_o.l = pale0_o.l;
  //       if (pale0_o.p) pale_o.p = pale0_o.p;
  //       pale_o.c = pale0_o.c;
  //     }
  //   }

  //   if (all_x) {
  //     for (let palename in THEME_DEFAULT) {
  //       if (!(palename in theme_o)) {
  //         ret.theme_o[palename] = THEME_DEFAULT[palename];
  //       }
  //     }
  //   }

  //   // console.log( ret );
  //   return ret;
  // }

  // static flush() {
  //   for (let pale of document[$theme_modified].pale_m.values()) {
  //     pale.flush();
  //   }
  //   assert(document[$theme_modified].pale_m.size === 0);
  //   assert(document[$theme_modified].modified_mo.val === false);
  // }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  toJSON(): PaleRaw {
    this.modified_br_Pale.set_Boor(false); //!
    return {
      coors: this.coor_a.map((coor) => coor.toJSON()),
      cidx: this.cidx,
    };
  }
}
/*80--------------------------------------------------------------------------*/

// class SortedR extends SortedArray
// {
//   /**
//    * @const @param { Number[2][] } initdata
//    */
//   constructor( initdata=[] )
//   {
//     super( (a,b) => a[0]<b[0] || a[0]===b[0] && a[1]<b[1] );

//     initdata.forEach( val => this.add(val) );
//   }

//   get val_a() { return this.val_a$; }

//   /**
//    * @const @param { Number[2][] } rhs
//    * @return { Boolean }
//    */
//   eq$_( rhs ) { return this.val_a$.eq(rhs); }

//   /**
//    * @const
//    * @const @param { Number } val0_x
//    * @return { Number[] } - in order
//    */
//   val0_1a$_( val0_x )
//   {
//     let ret = [];
//     for (let i = 0, LEN = this.len; i < LEN; i++) {
//       const val0 = this.val_a$[i][0];
//       if (val0 > val0_x) break;

//       if (val0 === val0_x) ret.push(this.val_a$[i][1]);
//     }
//     return ret;
//   }
//   /**
//    * @const
//    * @const @param { Number } val1_x
//    * @return { Number[] } - in order
//    */
//   val1_0a$_( val1_x )
//   {
//     let ret = [];
//     for (let i = 0, LEN = this.len; i < LEN; i++) {
//       const val1 = this.val_a$[i][1];
//       // if( val1 > val1_x ) break;

//       if (val1 === val1_x) ret.push(this.val_a$[i][0]);
//     }
//     return ret;
//   }
//   // /**
//   //  * @const
//   //  * @const @param { Number } val0_x
//   //  * @return { Number[] } - array of index in order
//   //  */
//   // val0_ia_( val0_x )
//   // {
//   //   let ret = [];
//   //   for( let i=0,LEN=this.len; i < LEN; i++ )
//   //   {
//   //     const val0 = this.val_a$[i][0];
//   //     if( val0 > val0_x ) break;

//   //     if( val0 === val0_x ) ret.push( i );
//   //   }
//   //   return ret;
//   // }
//   // /**
//   //  * @const
//   //  * @const @param { Number } val1_x
//   //  * @return { Number[] } array of index in order
//   //  */
//   // val1_ia_( val1_x )
//   // {
//   //   let ret = [];
//   //   for( let i=0,LEN=this.len; i < LEN; i++ )
//   //   {
//   //     const val1 = this.val_a$[i][1];
//   //     // if( val1 > val1_x ) break;

//   //     if( val1 === val1_x ) ret.push( i );
//   //   }
//   //   return ret;
//   // }
//   /**
//    * @const
//    * @const @param { Number } val0_x
//    * @return { Number }
//    */
//   count0$_( val0_x )
//   {
//     let ret = 0;
//     for (let i = this.len; i--;) {
//       const val0 = this.val_a$[i][0];
//       if (val0 < val0_x) break;

//       if (val0 === val0_x)++ret;
//     }
//     return ret;
//   }
//   /**
//    * @const
//    * @const @param { Number } val1_x
//    * @return { Number }
//    */
//   count1$_( val1_x )
//   {
//     let ret = 0;
//     for (let i = this.len; i--;) {
//       const val1 = this.val_a$[i][1];
//       // if( val1 < val1_x ) break;

//       if (val1 === val1_x)++ret;
//     }
//     return ret;
//   }

//   /**
//    * @const
//    * @const @param { Number } val0_x
//    * @return { Boolean } - can delete all possible or not some
//    */
//   canDel0$_( val0_x )
//   {
//     const val0_1a = this.val0_1a$_(val0_x);
//     if (val0_1a.length
//       && val0_1a.some(v1 => this.count1$_(v1) <= 1)
//     ) return false;

//     return true;
//   }
//   /**
//    * @const
//    * @const @param { Number } val1_x
//    * @return { Boolean } - can delete all possible or not some
//    */
//   canDel1$_( val1_x )
//   {
//     const val1_0a = this.val1_0a$_(val1_x);
//     if (val1_0a.length
//       && val1_0a.some(v0 => this.count0$_(v0) <= 1)
//     ) return false;

//     return true;
//   }

//   /**
//    * @const @param { Number } val0_x
//    */
//   del0$_( val0_x )
//   {
//     for (let i = this.len; i--;) {
//       const val0 = this.val_a$[i][0];
//       if (val0 < val0_x) break;

//       if (val0 > val0_x)--this.val_a$[i][0]; //!
//       else if (val0 === val0_x) this.val_a$.splice(i, 1);
//     }
//   }
//   /**
//    * @const @param { Number } val1_x
//    */
//   del1$_( val1_x )
//   {
//     for (let i = this.len; i--;) {
//       const val1 = this.val_a$[i][1];
//       // if( val1 < val1_x ) break;

//       if (val1 > val1_x)--this.val_a$[i][1]; //!
//       else if (val1 === val1_x) this.val_a$.splice(i, 1);
//     }
//   }
// }
/*80--------------------------------------------------------------------------*/
