/**
 * Scroll positions for the building's scrubbed parts, measured from the page layout rather than
 * guessed from percentages. Sheets stack with `position: sticky`, so an element's live rect is not
 * its place in the scroll; its natural place is the heights of the sheets before it plus its
 * offset inside its own sheet.
 */
import { MOTION } from '../../lib/motion';

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

/**
 * Where the eye rests. Desktop: the viewport centre. Below 1024 px the building is a fixed
 * full-screen layer and the text is read in its upper part, with the building below it.
 */
function readingCentre(): number {
  const narrow = window.matchMedia('(width < 1024px)').matches;
  return window.innerHeight * (narrow ? MOTION.stageLayer.readingShare : 0.5);
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
