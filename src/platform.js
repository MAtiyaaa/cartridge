// Which build this is. The Android build (vite --mode android) sets MODE to 'android';
// in the desktop build IS_ANDROID is a constant false and Android-only code is dropped.
export const IS_ANDROID = import.meta.env.MODE === 'android';
// The phone remote page (vite --mode remote): images come from the connected device over the network
export const IS_REMOTE = import.meta.env.MODE === 'remote';

// URL of an image served by the backend's romimg protocol (query without the leading '?')
export function romimg(query) {
  return IS_ANDROID || IS_REMOTE ? window.cart.img(query) : 'romimg://img/?' + query;
}
