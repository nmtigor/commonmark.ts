/** 80**************************************************************************
 * @module lib/util/dom
 * @license BSD-3-Clause
 ******************************************************************************/

import { scrollO } from "../alias.ts";
import "../dom.ts";
/*80--------------------------------------------------------------------------*/
/* Event */

export const stopPropagation = (evt_x: Event) => {
  evt_x.stopPropagation();
};

/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export const noContextMenu = (evt_x: MouseEvent) => {
  evt_x.preventDefault();
};

export const onWheel = (el_x: Element) => {
  return (evt_x: WheelEvent) => {
    scrollO.top = evt_x.deltaY >= 0 ? 50 : -50;
    scrollO.left = 0;
    el_x.scrollBy(scrollO);
  };
};
/*80--------------------------------------------------------------------------*/

export const domParser = new DOMParser();
//jjjj TOCLEANUP
// const backslashOrAmp_re_ = /[\\&]/;
// export const unescapeStr = (s_x: string) =>
//   backslashOrAmp_re_.test(s_x)
//     ? domParser.parseFromString(s_x, "text/html").textContent ?? ""
//     : s_x;
/*80--------------------------------------------------------------------------*/
