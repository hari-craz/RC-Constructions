import site from '../config/site.json';

/**
 * Every fact that must come from the company lives here, and nowhere else.
 *
 * Rules:
 * - A value of `null` means "not supplied yet". Components hide that element (see `hasContent`)
 *   instead of showing a placeholder. Never invent a value to fill a gap.
 * - `contact.isSample` is true while the phone, WhatsApp, email, address and hours below are
 *   made-up samples. They MUST be replaced before real visitors see the site
 *   (docs/BEFORE-GOING-LIVE.md lists them first). Set `isSample` to false only after replacing.
 * - docs/CONTENT-INTAKE.md maps each questionnaire line to a field in this file.
 */

/** The one canonical site URL (src/config/site.json). Used by meta tags, sitemap, robots, security.txt and JSON-LD. */
export const SITE_URL: string = site.siteUrl.replace(/\/$/, '');

export function hasContent<T>(value: T | null | undefined | ''): value is T {
  return value !== null && value !== undefined && value !== '';
}

export const COMPANY = {
  name: 'RC Constructions',
  legalName: null as string | null, // e.g. "RC Constructions Private Limited"

  // Supplied by the company (business card, 2026-10-25). `isSample` is true only while any of these
  // is a made-up sample.
  contact: {
    isSample: false,
    phoneDisplay: '+91 99658 79171',
    phoneRaw: '+919965879171',
    /** A second number from the card; null hides it. */
    phoneSecondaryDisplay: '+91 97906 77767' as string | null,
    phoneSecondaryRaw: '+919790677767' as string | null,
    whatsappRaw: null as string | null, // null hides the WhatsApp channel (not supplied)
    email: 'rcconstructions2016@gmail.com',
    address: '6/161, Poomandanvalasu, Mangalapatti (Po.), Muthur Via, Tiruppur - 638105',
    workingHours: null as string | null, // not supplied: the row is hidden
  },

  /** Facts about the business. null = not supplied; the page hides the element. */
  facts: {
    foundedYear: null as number | null,
    licenceOrRegistration: null as string | null, // e.g. "Class I contractor, licence no. ..."
    yearsInBusiness: null as number | null,
    projectsCompleted: null as number | null,
    areaBuiltSqFt: null as number | null,
    onTimeHandoverPercent: null as number | null,
  },

  founder: {
    name: 'Gokul',
    surname: 'Kumar' as string | null, // the card reads "Er. R.C. Gokul Kumar, B.E., Proprietor"
    role: 'Founder',
    quote: null as string | null, // a quote the founder has approved, or null
    experienceNote: null as string | null, // e.g. "Site practice since 2008"
    /** Set true only after /images/founder-gokul.webp and .jpg are committed. */
    photoAvailable: false,
    photoAlt: 'Portrait of Gokul, founder of RC Constructions',
    photoNote: 'Portrait of Gokul, founder',
  },

  legal: {
    /** Plain-language retention period shown in the privacy notice. SAMPLE until the company decides. */
    retentionPeriod: '12 months after the enquiry is closed',
    retentionIsSample: true,
    /** Governing law line for the terms, e.g. "the laws of India and the courts at Chennai". */
    governingLaw: null as string | null,
    /** Who handles privacy requests; defaults to the contact email. */
    privacyContactEmail: null as string | null,
  },
};

export const CONTACT_EMAIL: string = COMPANY.legal.privacyContactEmail ?? COMPANY.contact.email;
