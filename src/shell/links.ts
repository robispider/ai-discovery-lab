/** URL of a page from the previous plain-HTML lab, which is served unchanged from public/legacy/. */
export function legacyUrl(path: string): string {
  return `${import.meta.env.BASE_URL}legacy/${path}`;
}
