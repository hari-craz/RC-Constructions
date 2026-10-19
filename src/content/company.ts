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

  // SAMPLE CONTACT DETAILS: replace before launch, then set isSample to false.
  contact: {
    isSample: true,
    phoneDisplay: '+91 (0) 44 2847 0000',
    phoneRaw: '+914428470000',
    whatsappRaw: '+914428470000' as string | null, // null hides the WhatsApp channel
    email: 'build@rcconstructions.com',
    address: 'Survey Plot 104, Industrial Corridor, Chennai',
    workingHours: 'Monday to Saturday, 08:00 to 18:00 IST',
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
    surname: null as string | null,
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
