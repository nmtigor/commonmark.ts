/** 80**************************************************************************
 * @module lib/compiling/uri/util
 * @license BSD-3-Clause
 ******************************************************************************/

import { INOUT } from "@fe-src/global.ts";
import {
  isASCIILetter,
  isDecimalDigit,
  isHexDigit,
} from "../../util/string.ts";
import { assert } from "../../util/trace.ts";
import type { Loc, LocInfo } from "../Loc.ts";
import type { uint, uint16 } from "../../alias.ts";
import { frstNon } from "../util.ts";
import { Err } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Ref. "pct-encoded" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @primaryconst @param loc_x
 */
const peekPctEncoded_ = (loc_x: Loc): 0 | 3 => {
  return (loc_x.ucod === /* "%" */ 0x25 &&
      isHexDigit(loc_x.peek_ucod(1)) &&
      isHexDigit(loc_x.peek_ucod(2)))
    ? 3
    : 0;
};

/**
 * Ref. "gen-delims" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 */
const GenDelims_ = /* deno-fmt-ignore */ [
  /* ":" */ 0x3A, /* "/" */ 0x2F, /* "?" */ 0x3F, /* "#" */ 0x23,
  /* "[" */ 0x5B, /* "]" */ 0x5D, /* "@" */ 0x40,
];
/** @const @param ucod_x */
const isGenDelims_ = (ucod_x: uint16): boolean => GenDelims_.includes(ucod_x);
/** @const @param ucod_x */
const peekGenDelim_ = (ucod_x: uint16): 0 | 1 => {
  return isGenDelims_(ucod_x) ? 1 : 0;
};

/**
 * Ref. "sub-delims" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 */
const SubDelims_ = /* deno-fmt-ignore */ [
  /* "!" */ 0x21, /* "$" */ 0x24, /* "&" */ 0x26, /* "'" */ 0x27, 
  /* "(" */ 0x28, /* ")" */ 0x29, /* "*" */ 0x2A, /* "+" */ 0x2B,
  /* "," */ 0x2C, /* ";" */ 0x3B, /* "=" */ 0x3D,
];
/** @const @param ucod_x */
const isSubDelims_ = (ucod_x: uint16): boolean => SubDelims_.includes(ucod_x);
/** @const @param ucod_x */
const peekSubDelim_ = (ucod_x: uint16): 0 | 1 => {
  return isSubDelims_(ucod_x) ? 1 : 0;
};

/**
 * Ref. "unreserved" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @const @param ucod_x
 */
const isUnreserved_ = (ucod_x: uint16): boolean => {
  return isASCIILetter(ucod_x) || isDecimalDigit(ucod_x) ||
    ucod_x === /* "-" */ 0x2D || ucod_x === /* "." */ 0x2E ||
    ucod_x === /* "_" */ 0x5F || ucod_x === /* "~" */ 0x7E;
};
/** @const @param ucod_x */
const peekUnreserved_ = (ucod_x: uint16): 0 | 1 => {
  return isUnreserved_(ucod_x) ? 1 : 0;
};
/**
 * Ref. "ucschar" in [2.2. ABNF for IRI References and IRIs](https://datatracker.ietf.org/doc/html/rfc3987#section-2.2)
 * @const @param codp_x
 */
const isUCSChar_ = (codp_x: uint): boolean => {
  return 0x0_A0 <= codp_x && codp_x <= 0x0_D7FF ||
    0x0_F900 <= codp_x && codp_x <= 0x0_FDCF ||
    0x0_FDF0 <= codp_x && codp_x <= 0x0_FFEF ||
    0x1_0000 <= codp_x && codp_x <= 0x1_FFFD ||
    0x2_0000 <= codp_x && codp_x <= 0x2_FFFD ||
    0x3_0000 <= codp_x && codp_x <= 0x3_FFFD ||
    0x4_0000 <= codp_x && codp_x <= 0x4_FFFD ||
    0x5_0000 <= codp_x && codp_x <= 0x5_FFFD ||
    0x6_0000 <= codp_x && codp_x <= 0x6_FFFD ||
    0x7_0000 <= codp_x && codp_x <= 0x7_FFFD ||
    0x8_0000 <= codp_x && codp_x <= 0x8_FFFD ||
    0x9_0000 <= codp_x && codp_x <= 0x9_FFFD ||
    0xA_0000 <= codp_x && codp_x <= 0xA_FFFD ||
    0xB_0000 <= codp_x && codp_x <= 0xB_FFFD ||
    0xC_0000 <= codp_x && codp_x <= 0xC_FFFD ||
    0xD_0000 <= codp_x && codp_x <= 0xD_FFFD ||
    0xE_1000 <= codp_x && codp_x <= 0xE_FFFD;
};
/**
 * Ref. "iunreserved" in [2.2. ABNF for IRI References and IRIs](https://datatracker.ietf.org/doc/html/rfc3987#section-2.2)
 * @const @param li_x
 */
const peekIUnreserved_ = (li_x: LocInfo): 0 | 1 | 2 => {
  /*#static*/ if (INOUT) {
    assert(!li_x.isSurTral);
  }
  if (isUnreserved_(li_x.ucod)) return 1;
  if (isUCSChar_(li_x.codp)) return li_x.isSurLead ? 2 : 1;
  return 0;
};

/**
 * Ref. "iprivate" in [2.2. ABNF for IRI References and IRIs](https://datatracker.ietf.org/doc/html/rfc3987#section-2.2)
 * @const @param li_x
 */
export const peekIPrivate = (li_x: LocInfo): 0 | 1 | 2 => {
  /*#static*/ if (INOUT) {
    assert(!li_x.isSurTral);
  }
  const cp_ = li_x.codp;
  if (
    0x0_E000 <= cp_ && cp_ <= 0x0_F8FF ||
    0xF_0000 <= cp_ && cp_ <= 0xF_FFFD || 0x10_0000 <= cp_ && cp_ <= 0x10_FFFD
  ) {
    return li_x.isSurLead ? 2 : 1;
  }

  return 0;
};
/*49-------------------------------------------*/

/**
 * unreserved / sub-delims / ":"
 * @const @param ucod_x
 */
const peekUSC_ = (ucod_x: uint16): 0 | 1 => {
  let n_ = peekUnreserved_(ucod_x);
  if (n_ > 0) return n_;

  n_ = peekSubDelim_(ucod_x);
  if (n_ > 0) return n_;

  return ucod_x === /* ":" */ 0x3A ? 1 : 0;
};
/**
 * iunreserved / sub-delims
 * @const @param li_x
 */
const peekIUS_ = (li_x: LocInfo): 0 | 1 | 2 => {
  let n_ = peekIUnreserved_(li_x);
  if (n_ > 0) return n_;

  n_ = peekSubDelim_(li_x.ucod);
  return n_;
};
/**
 * iunreserved / pct-encoded / sub-delims
 * @primaryconst @param loc_x
 */
const peekIUPS_ = (loc_x: Loc): 0 | 1 | 2 | 3 => {
  const li_ = loc_x.info_1;
  let n_: 0 | 1 | 2 | 3 = peekIUS_(li_);
  if (n_ > 0) return n_;

  n_ = peekPctEncoded_(loc_x);
  return n_;
};
/**
 * iunreserved / pct-encoded / sub-delims / ":"
 * @primaryconst @param loc_x
 */
const peekIUPSC_ = (loc_x: Loc): 0 | 1 | 2 | 3 => {
  const n_ = peekIUPS_(loc_x);
  if (n_ > 0) return n_;

  return loc_x.ucod === /* ":" */ 0x3A ? 1 : 0;
};
/**
 * iunreserved / pct-encoded / sub-delims / "@"
 * @primaryconst @param loc_x
 */
const peekIUPSA_ = (loc_x: Loc): 0 | 1 | 2 | 3 => {
  const n_ = peekIUPS_(loc_x);
  if (n_ > 0) return n_;

  return loc_x.ucod === /* "@" */ 0x40 ? 1 : 0;
};
/**
 * ipchar = iunreserved / pct-encoded / sub-delims / ":" / "@"
 * @primaryconst @param loc_x
 */
export const peekIUPSCA = (loc_x: Loc): 0 | 1 | 2 | 3 => {
  const n_ = peekIUPSC_(loc_x);
  if (n_ > 0) return n_;

  return loc_x.ucod === /* "@" */ 0x40 ? 1 : 0;
};
/*49-------------------------------------------*/

/**
 * scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
 * @const @param loc_x
 */
export const peekScheme = (loc_x: Loc): uint => {
  if (!isASCIILetter(loc_x.ucod)) return 0;

  using poc = loc_x.usingDup().forw();
  let ret = 1;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const uc_ = poc.ucod;
    if (
      !isASCIILetter(uc_) && !isDecimalDigit(uc_) &&
      uc_ !== /* "+" */ 0x2B && uc_ !== /* "-" */ 0x2D && uc_ !== /* "." */ 0x2E
    ) break;

    poc.loff_$ += 1;
    ret += 1;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};

/**
 * *( iunreserved / pct-encoded / sub-delims )
 * @const @param loc_x
 */
export const peekSeqIUPS = (loc_x: Loc): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const n_ = peekIUPS_(poc);
    if (n_ === 0) break;

    poc.loff_$ += n_;
    ret += n_;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};

/**
 * *( iunreserved / pct-encoded / sub-delims / ":" )
 * @const @param loc_x
 */
export const peekSeqIUPSC = (loc_x: Loc): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const n_ = peekIUPSC_(poc);
    if (n_ === 0) break;

    poc.loff_$ += n_;
    ret += n_;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};

/**
 * *( unreserved / sub-delims / ":" )
 * @const @param loc_x
 */
const peekSeqUSC_ = (loc_x: Loc): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const n_ = peekUSC_(poc.ucod);
    if (n_ === 0) break;

    poc.loff_$ += n_;
    ret += n_;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};

/**
 * *( iunreserved / pct-encoded / sub-delims / "@" )
 * @const @param loc_x
 */
export const peekSeqIUPSA = (loc_x: Loc): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const n_ = peekIUPSA_(poc);
    if (n_ === 0) break;

    poc.loff_$ += n_;
    ret += n_;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};

/**
 * isegment = *ipchar = *( iunreserved / pct-encoded / sub-delims / ":" / "@" )
 * @const @param loc_x
 */
export const peekSeqIUPSCA = (loc_x: Loc): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  const VALVE = 1_000;
  let valve = VALVE;
  while (--valve) {
    const n_ = peekIUPSCA(poc);
    if (n_ === 0) break;

    poc.loff_$ += n_;
    ret += n_;
  }
  assert(valve, `Loop ${VALVE}±1 times`);
  return ret;
};
/*64----------------------------------------------------------*/

/**
 * Ref. "dec-octet" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @primaryconst @param loc_x
 * @out @param err_a_x
 */
const peekH8_ = (loc_x: Loc, err_a_x: Err[]): 0 | 1 | 2 | 3 => {
  const loff_1 = frstNon(isDecimalDigit, loc_x.line_$, loc_x.loff_$);
  const n_ = loff_1 - loc_x.loff_$;
  if (n_ === 0 || n_ > 3) return 0;

  if (n_ === 1) return n_;

  if (n_ === 2) {
    if (loc_x.ucod === /* "0" */ 0x30) {
      err_a_x.push(Err.ipv4_leading_0);
    }
    return n_;
  }

  /* `n_ === 3` */
  const uc_2 = loc_x.ucod;
  if (uc_2 === /* "0" */ 0x30) {
    err_a_x.push(Err.ipv4_leading_0);
    return 3;
  }
  if (uc_2 === /* "1" */ 0x31) return 3;
  if (uc_2 === /* "2" */ 0x32) {
    const uc_1 = loc_x.peek_ucod(1);
    if (/* "0" */ 0x30 <= uc_1 && uc_1 <= /* "4" */ 0x34) return 3;
    if (uc_1 === /* "5" */ 0x35) {
      const uc_0 = loc_x.peek_ucod(2);
      if (/* "0" */ 0x30 <= uc_0 && uc_0 <= /* "5" */ 0x35) return 3;
    }
  }
  err_a_x.push(Err.ipv4_exceed_255);
  return 3;
};
/**
 * Ref. "h16" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @primaryconst @param loc_x
 */
const peekH16_ = (loc_x: Loc): 0 | 1 | 2 | 3 | 4 => {
  let uc_ = loc_x.ucod;
  if (!isHexDigit(uc_)) return 0;

  uc_ = loc_x.peek_ucod(1);
  if (!isHexDigit(uc_)) return 1;

  uc_ = loc_x.peek_ucod(2);
  if (!isHexDigit(uc_)) return 2;

  uc_ = loc_x.peek_ucod(3);
  if (!isHexDigit(uc_)) return 3;

  return 4;
};
/**
 * Ref. "ls32" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @const @param loc_x
 * @out @param err_a_x
 */
const peekH32_ = (loc_x: Loc, err_a_x: Err[]): uint => {
  using poc = loc_x.usingDup();
  let n_ = peekH16_(poc);
  if (n_ > 0) {
    if (poc.forwn(n_).ucod === /* ":" */ 0x3A) {
      poc.loff_$ += 1;
      const ret = n_ + 1;
      n_ = peekH16_(poc);
      if (n_ > 0) return ret + n_;
    }
  }

  return peekIPv4(loc_x, err_a_x);
};

/**
 * Ref. "IPv4address" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @const @param loc_x
 * @out @param err_a_x
 */
export const peekIPv4 = (loc_x: Loc, err_a_x: Err[]): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  let n_: uint, uc_: uint16;
  for (let i = 0; i < 3; ++i) {
    n_ = peekH8_(poc, err_a_x);
    if (n_ === 0) {
      ret = 0;
      break;
    }

    uc_ = poc.forwn(n_).ucod;
    if (uc_ !== /* "." */ 0x2E) {
      ret = 0;
      break;
    }

    poc.loff_$ += 1;
    ret += n_ + 1;
  }
  n_ = peekH8_(poc, err_a_x);
  if (n_ === 0) ret = 0;
  else ret += n_;

  if (ret === 0) {
    let i_ = err_a_x.length;
    for (; i_--;) {
      const err_i = err_a_x[i_];
      if (err_i !== Err.ipv4_leading_0 && err_i !== Err.ipv4_exceed_255) break;
    }
    err_a_x.length = i_ + 1;
  }
  return ret;
};

/**
 * Ref. "IPv6address" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @const @param loc_x
 * @out @param err_a_x
 */
export const peekIPv6 = (loc_x: Loc, err_a_x: Err[]): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  if (poc.ucod === /* "[" */ 0x5B) {
    poc.loff_$ += 1;
    ret += 1;
  } else {
    err_a_x.push(Err.ip_no_open_bracket);
  }

  const peekCloz_ = (): uint => {
    if (poc.ucod === /* "]" */ 0x5D) ret += 1;
    else err_a_x.push(Err.ip_no_cloz_bracket);
    return ret;
  };

  let n_: uint;
  /**
   * Start from "::" (inclusive)
   * @const @param n_h16c_y
   */
  const peekTail_ = (n_h16c_y: uint | -1): uint => {
    if (poc.ucod !== /* ":" */ 0x3A) return 0;

    poc.loff_$ += 1;
    ret += 1;
    if (poc.ucod === /* ":" */ 0x3A) {
      poc.loff_$ += 1;
      ret += 1;
    } else {
      err_a_x.push(Err.ipv6_no_2nd_colon);
    }

    /* "::" "]" */
    if (poc.ucod === /* "]" */ 0x5D) return ret + 1;

    if (n_h16c_y < 0) return 0;

    for (let i = 0; i < n_h16c_y; ++i) {
      n_ = peekH16_(poc);
      if (n_ === 0) break;

      poc.loff_$ += n_;
      ret += n_;
      if (poc.ucod === /* ":" */ 0x3A) {
        poc.loff_$ += 1;
        ret += 1;
        continue;
      }
      /* "::" *`n_h16c_y-1`( h16 ":" ) h16 "]" */
      return peekCloz_();
    }
    n_ = peekH32_(poc, err_a_x);
    if (n_ > 0) {
      poc.loff_$ += n_;
      ret += n_;
      /*
        "::" *`n_h16c_y-1`( h16 ":" ) IPv4address "]"
      / "::" `n_h16c_y`( h16 ":" ) ls32 "]"
      */
      return peekCloz_();
    }

    n_ = peekH16_(poc);
    if (n_ > 0) {
      poc.loff_$ += n_;
      ret += n_;
    } else {
      err_a_x.push(Err.ipv6_no_h16);
    }

    /* "::" `n_h16c_y`( h16 ":" ) h16 "]" */
    return peekCloz_();
  };
  if (poc.ucod === /* ":" */ 0x3A) {
    return peekTail_(5);
  } else {
    /** count of ( h16 ":" ) */
    let n_h16c = 0;
    for (; n_h16c < 6; ++n_h16c) {
      n_ = peekH16_(poc);
      if (n_ === 0) break;

      poc.loff_$ += n_;
      ret += n_;
      if (poc.ucod !== /* ":" */ 0x3A) {
        poc.backn(n_);
        ret -= n_;
        break;
      }

      poc.loff_$ += 1;
      ret += 1;
      if (poc.ucod === /* ":" */ 0x3A && poc.peek_ucod(1) !== /* ":" */ 0x3A) {
        poc.backn(n_ + 1);
        ret -= n_ + 1;
        break;
      }
    }
    if (n_h16c === 6) {
      n_ = peekH32_(poc, err_a_x);
      if (n_ > 0) {
        poc.loff_$ += n_;
        ret += n_;
        /* "[" 6( h16 ":" ) ls32 "]" */
        return peekCloz_();
      }

      n_ = peekH16_(poc);
      if (n_ > 0) {
        poc.loff_$ += n_;
        ret += n_;
      } else {
        err_a_x.push(Err.ipv6_no_h16);
      }

      if (poc.ucod === /* ":" */ 0x3A) {
        poc.loff_$ += 1;
        ret += 1;
        if (poc.ucod === /* ":" */ 0x3A) {
          poc.loff_$ += 1;
          ret += 1;
        } else {
          err_a_x.push(Err.ipv6_no_2nd_colon);
        }
      } else {
        err_a_x.push(Err.ipv6_no_enough_h16);
      }

      /* "[" 6( h16 ":" ) h16 "::" "]" */
      return peekCloz_();
    } else {
      n_ = peekH16_(poc);
      if (n_ > 0) {
        poc.loff_$ += n_;
        ret += n_;
      } else {
        err_a_x.push(Err.ipv6_no_h16);
      }

      return peekTail_(4 - n_h16c);
    }
  }
};

/**
 * Ref. "IPvFuture" in [Appendix A. Collected ABNF for URI](https://datatracker.ietf.org/doc/html/rfc3986#appendix-A)
 * @const @param loc_x
 * @out @param err_a_x
 */
export const peekIPv7 = (loc_x: Loc, err_a_x: Err[]): uint => {
  using poc = loc_x.usingDup();
  let ret = 0;
  if (poc.ucod === /* "[" */ 0x5B) {
    poc.loff_$ += 1;
    ret += 1;
  } else {
    err_a_x.push(Err.ip_no_open_bracket);
  }

  if (poc.ucod !== /* "v" */ 0x76) return 0;

  poc.loff_$ += 1;
  ret += 1;
  const loff_1 = frstNon(isHexDigit, poc.line_$, poc.loff_$);
  if (poc.loff_$ === loff_1) return 0;

  ret += loff_1 - poc.loff_$;
  poc.loff = loff_1;
  if (poc.ucod !== /* "." */ 0x2E) return 0;

  poc.loff_$ += 1;
  ret += 1;
  const n_ = peekSeqUSC_(poc);
  if (n_ === 0) return 0;

  poc.loff_$ += n_;
  ret += n_;
  if (poc.ucod === /* "]" */ 0x5D) ret += 1;
  else err_a_x.push(Err.ip_no_cloz_bracket);
  return ret;
};
/*80--------------------------------------------------------------------------*/

/** @borrow @primaryconst @param loc_x */
export const isURIHead = (loc_x: Loc): boolean => {
  const uc_ = loc_x.ucod;
  if (
    isUnreserved_(uc_) || isSubDelims_(uc_) ||
    uc_ === /* "%" */ 0x25 || uc_ === /* "@" */ 0x40 ||
    uc_ === /* "/" */ 0x2F ||
    uc_ === /* "?" */ 0x3F || uc_ === /* "#" */ 0x23
  ) return true;

  return isUCSChar_(loc_x.info_1.codp);
};
/*80--------------------------------------------------------------------------*/
