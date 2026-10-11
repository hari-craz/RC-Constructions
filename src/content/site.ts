interface NavItem {
  readonly label: string;
  readonly href: string;
}

interface SiteConfig {
  readonly companyName: string;
  readonly tagline: string;
  readonly cta: {
    readonly label: string;
    readonly href: string;
  };
  readonly nav: readonly NavItem[];
  readonly contact: {
    readonly email: string;
    readonly phone: string;
    readonly address: string;
  };
}

export const SITE: SiteConfig = {
  companyName: 'RC Constructions',
  // PLACEHOLDER: Tagline to be replaced with official client marketing statement
  tagline: 'We build homes, offices, factories and roads.',
  cta: {
    // PLACEHOLDER: Primary button CTA copy
    label: 'Request a quote',
    // PLACEHOLDER: Anchor destination for hero CTA
    href: '#contact',
  },
  nav: [
    {
      // PLACEHOLDER: Navigation action label
      label: 'Enquire',
      href: '#contact',
    },
  ],
  contact: {
    // PLACEHOLDER: Official inquiry email
    email: 'build@rcconstructions.com',
    // PLACEHOLDER: Office telephone number
    phone: '+91 (0) 44 2847 0000',
    // PLACEHOLDER: Physical office address
    address: 'Survey Plot 104, Industrial Corridor, Chennai',
  },
} as const;
