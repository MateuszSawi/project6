/**
 * Every prefilled WhatsApp link on the site comes from here.
 *
 * The number lived in three files before this one existed, and one of them had
 * been left blank — which does not break a link, it just quietly drops her on
 * WhatsApp's chat list to find me herself, at the exact moment she should have
 * nothing left to do. One constant, so a new message can never be written
 * against no number, and a number that changes changes once.
 */

/**
 * Mine, digits only: country code first, no `+`, no spaces, no dashes. That is
 * the one format wa.me takes — anything else opens WhatsApp on nobody.
 */
export const PHONE = '48690688835';

/**
 * wa.me opens the chat with the message already typed but unsent. She still
 * has to press send, which is the point: the page never speaks for her.
 *
 * Always an `href` on a real anchor, never something opened from a callback —
 * once a database round trip has come back the tap is no longer a tap as far
 * as the browser is concerned, and the window would be a blocked popup.
 */
export function whatsappLink(text: string): string {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}
