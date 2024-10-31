/** 80**************************************************************************
 * @module lib/compiling/mdtext/MdextTok
 * @license BSD-3-Clause
 ******************************************************************************/

import { BaseTok } from "../BaseTok.ts";
/*80--------------------------------------------------------------------------*/

enum MdextTok_ {
  chunk = 400, // Need to further `lex()` and `paz()` context-relatedly

  bracket_open, // [
  // angle_bracket_open, // <
  // angle_bracket_cloz, // >
  // html_head, // <pre, <script, <style, <textarea, <!--, <?, <![CDATA[, ...
  // html_tail, // </pre>, </script>, </style>, </textarea>, -->, ?>, ]]>, ...
  // tag_open, // <abc, </abc
  // tag_cloz, // >, />
  // attribute_name,
  // eq_, // =
  // attribute_value,
  // comment_open, // <!--
  // comment_cloz, // -->
  // processing_instruction_open, // <?
  // processing_instruction_cloz, // ?>
  // declaration_open, // <!
  // declaration_cloz, // >
  // cdata_section_open, // <![CDATA[
  // cdata_section_cloz, // ]]>

  /* Leaf block tokens */
  thematic_break, // ***, ---, ___
  atx_heading, // ##
  setext_heading, // ==, --
  code_fence, // ```, ~~~
  // html_block_head, // <pre, <!--, <?, <!a, <![CDATA[, <table>, <a>
  // html_block_tail, // /pre>, -->, ?>, >, ]]>
  /* ~ */

  /* Container block tokens */
  block_quote_marker, // >
  bullet_list_marker, // -, +, *
  ordered_list_marker, // 1., 1)
  /* ~ */

  /* Inline tokens */
  backtick_string, // ``
  emphasis_delimiter, // _, *
  bracket_colon, // ]:
  bracket_paren, // ](
  link_dest_head, // <
  link_dest_tail, // >
  // bracket_bracket, // ][
  bang_bracket, // ![
  bracket_cloz, // ]
  paren_cloz, // )
  // absolute_uri, // <http://abc>
  email_address, // <abc@xyz>
  backslash, // \
  escaped, // \]
  entity,
  text,
  /* ~ */

  _max,
}
console.assert(MdextTok_._max <= 500);

export type MdextTok = BaseTok | MdextTok_;
export const MdextTok = { ...BaseTok, ...MdextTok_ };
/*80--------------------------------------------------------------------------*/
