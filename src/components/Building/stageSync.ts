/**
 * Scroll positions for the building's scrubbed parts, measured from the page layout rather than
 * guessed from percentages. Sheets stack with `position: sticky`, so an element's live rect is not
 * its place in the scroll; its natural place is the heights of the sheets before it plus its
 * offset inside its own sheet.
 */
function sheets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.sheet-stack > .sheet')];
}

/** Natural document top of a sheet (sum of the heights of the sheets before it). */
export function sheetTop(sheet: HTMLElement): number {
  let top = 0;
  for (const s of sheets()) {
    if (s === sheet) return top;
    top += s.offsetHeight;
  }
  return top;
}

/** Natural document top of any element inside a sheet. */
function naturalTop(el: HTMLElement): number {
  const sheet = el.closest<HTMLElement>('.sheet');
  if (!sheet) return el.getBoundingClientRect().top + window.scrollY;
  return sheetTop(sheet) + (el.getBoundingClientRect().top - sheet.getBoundingClientRect().top);
}

/** Where the eye rests: the viewport centre, or the centre of the area under the phone band. */
function readingCentre(): number {
  const win = document.querySelector<HTMLElement>('.building-site-window');
  const band = window.matchMedia('(width < 1024px)').matches && win ? win.offsetHeight : 0;
  return band + (window.innerHeight - band) / 2;
}

/** Scroll position at which the element's box is centred in the reading area. */
export function centreScroll(el: HTMLElement): number {
  return naturalTop(el) + el.offsetHeight / 2 - readingCentre();
}

/** Scroll position at which the element's sheet has been scrolled fully and pins. */
export function sheetEndScroll(el: HTMLElement): number {
  const sheet = el.closest<HTMLElement>('.sheet') ?? el;
  return sheetTop(sheet) + sheet.offsetHeight - window.innerHeight;
}
