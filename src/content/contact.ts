/**
 * Phase 7D: Contact section and footer content data model.
 * All phone, email, WhatsApp, and location details are placeholders.
 */

interface ContactChannel {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

export interface ContactContent {
  readonly sectionId: string;
  readonly headline: string;
  readonly subhead: string;
  readonly channels: readonly ContactChannel[];
  readonly privacyNotice: string;
  readonly footer: {
    readonly companyName: string;
    readonly builtBy: string;
    readonly backToTopLabel: string;
  };
}

export const CONTACT_CONFIG = {
  rawPhone: '+914428470000', // PLACEHOLDER: Digits for tel: and https://wa.me/
  displayPhone: '+91 (0) 44 2847 0000', // PLACEHOLDER: Formatted display
  email: 'build@rcconstructions.com', // PLACEHOLDER: Formspree fallback
  address: 'Survey Plot 104, Industrial Corridor, Chennai', // PLACEHOLDER: Site office
  workingHours: 'Monday to Saturday, 08:00 – 18:00 IST', // PLACEHOLDER
} as const;

export const CONTACT_CONTENT: ContactContent = {
  sectionId: 'contact',
  headline: 'Tell us what you want to build.',
  subhead:
    'Every enquiry is reviewed directly by our site team. We respond with initial feasibility notes and estimated mobilization schedules.',
  channels: [
    {
      id: 'phone',
      label: 'Phone',
      value: CONTACT_CONFIG.displayPhone,
      href: `tel:${CONTACT_CONFIG.rawPhone}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: 'Message our site desk',
      href: `https://wa.me/${CONTACT_CONFIG.rawPhone.replace(/\D/g, '')}`,
    },
    {
      id: 'email',
      label: 'Email',
      value: CONTACT_CONFIG.email,
      href: `mailto:${CONTACT_CONFIG.email}`,
    },
    {
      id: 'address',
      label: 'Office & Yard',
      value: CONTACT_CONFIG.address,
    },
    {
      id: 'hours',
      label: 'Working Hours',
      value: CONTACT_CONFIG.workingHours,
    },
  ],
  privacyNotice:
    'We use your details only to respond to this construction enquiry. We do not sell or share your details with third parties for marketing.',
  footer: {
    companyName: 'RC Constructions',
    builtBy: 'Built by UnitaryX',
    backToTopLabel: 'Back to top',
  },
};
