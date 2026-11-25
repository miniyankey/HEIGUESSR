// Changes page: useHashRoute listens to hashchange and shows the matching view.
// A hash can carry a parameter after a slash, e.g. '#lobby/<gameId>'.
export function goTo(hash) {
  window.location.hash = hash
}

/** Parameter of the current hash: '#lobby/abc' gives 'abc'. */
export function hashParam() {
  return window.location.hash.split('/')[1] ?? null
}
