/** 80**************************************************************************
 * @module lib/util/general
 * @license BSD-3-Clause
 ******************************************************************************/

export {};
/*80--------------------------------------------------------------------------*/

/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x: BlobPart) => new Blob([_x]).size;
/*80--------------------------------------------------------------------------*/

// /**
//  * Ref. [[pdf.js]/src/shared/util.js](https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js)
//  */
// export const hexNumbers = Array.from(
//   Array(256).keys(),
//   (n) => n.toString(16).padStart(2, "0"),
// );
/*80--------------------------------------------------------------------------*/
/* async */

/**
 * Ref. [What is the JavaScript version of sleep()?](https://stackoverflow.com/a/39914235)
 *
 * @const @param ms time in milliseconds
 */
export const wait = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export const g_abortr = new AbortController();
/*80--------------------------------------------------------------------------*/
/* Ref. [The most important function in my codebase](https://youtu.be/Y6jT-IkV0VM) */

type Success_<T> = { data: T; error: null };
type Failure_<E> = { data: null; error: E };
type Result<T, E = Error> = Success_<T> | Failure_<E>;

export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
/*80--------------------------------------------------------------------------*/
