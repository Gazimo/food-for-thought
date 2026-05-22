export async function register() {
  // Node.js 22+ provides globalThis.localStorage as a Web Storage stub,
  // but without --localstorage-file the methods are undefined, causing
  // "localStorage.getItem is not a function" during SSR. Replace with a
  // no-op so server renders don't crash — client-side code still gets
  // the real browser localStorage.
  if (
    typeof (globalThis as Record<string, unknown>).localStorage !== "undefined" &&
    typeof (globalThis.localStorage as Storage).getItem !== "function"
  ) {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
}
