/** 80**************************************************************************
 * @module lib/compiling/uri/URITok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum URITok_ {
  scheme = 300, // https:
  twoslash, // //
  userinfo, // admin@
  IPv4, // 127.0.0.1
  IPv6, // [::1]
  IPv7, // [v7.:]
  regname, // premsys.org
  port, // :3701

  path_abempty,
  path_absolute,
  path_noscheme,
  path_rootless,

  query, // ?xyz
  fragment, // #xyz

  _max,
}
console.assert(URITok_._max <= 400);

export type URITok = BaseTok | URITok_;
export const URITok = { ...BaseTok, ...URITok_ };
/*80--------------------------------------------------------------------------*/
