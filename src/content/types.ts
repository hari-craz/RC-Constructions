export interface ProjectItem {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly year: number;
  readonly location: string;
  readonly summary: string;
  readonly specs: readonly string[];
}

export interface MetricItem {
  readonly label: string;
  readonly value: string;
}

export interface SectionContent {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
}

export interface SiteContent {
  readonly siteTitle: string;
  readonly tagline: string;
  readonly projects: readonly ProjectItem[];
  readonly metrics: readonly MetricItem[];
}
