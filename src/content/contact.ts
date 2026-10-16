import { COMPANY, hasContent } from './company';

interface ContactChannel {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

export interface ContactContent {
  readonly sectionId: string;
  readonly headline: string;
  readonly subhead: string;
  readonly channels: readonly ContactChannel[];
  readonly privacyNotice: string;
  readonly privacyLink: FooterLink;
  readonly footer: {
    readonly companyName: string;
    readonly builtBy: string;
    readonly backToTopLabel: string;
    readonly links: readonly FooterLink[];
  };
}

/** Contact facts come from company.ts (currently SAMPLE values, see docs/BEFORE-GOING-LIVE.md). */
export const CONTACT_CONFIG = {
  rawPhone: COMPANY.contact.phoneRaw,
  displayPhone: COMPANY.contact.phoneDisplay,
  email: COMPANY.contact.email,
  address: COMPANY.contact.address,
  workingHours: COMPANY.contact.workingHours,
} as const;

const whatsapp = COMPANY.contact.whatsappRaw;

export const CONTACT_CONTENT: ContactContent = {
  sectionId: 'contact',
  headline: 'Tell us what you want to build.',
  subhead:
    'We read each enquiry ourselves and reply with questions about the site and a first idea of the schedule.',
  channels: [
    {
      id: 'phone',
      label: 'Phone',
      value: CONTACT_CONFIG.displayPhone,
      href: `tel:${CONTACT_CONFIG.rawPhone}`,
    },
    ...(hasContent(whatsapp)
      ? [
          {
            id: 'whatsapp',
            label: 'WhatsApp',
            value: 'Send a message',
            href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
          },
        ]
      : []),
    {
      id: 'email',
      label: 'Email',
      value: CONTACT_CONFIG.email,
      href: `mailto:${CONTACT_CONFIG.email}`,
    },
    {
      id: 'address',
      label: 'Office and yard',
      value: CONTACT_CONFIG.address,
    },
    {
      id: 'hours',
      label: 'Working hours',
      value: CONTACT_CONFIG.workingHours,
    },
  ],
  privacyNotice: 'We use your details only to reply to this enquiry.',
  privacyLink: { label: 'Read the privacy notice', href: '/privacy' },
  footer: {
    companyName: COMPANY.name,
    builtBy: 'Built by UnitaryX',
    backToTopLabel: 'Back to top',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
};
