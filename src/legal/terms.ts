/*
 * REVIEW BY COMPANY ADVISER
 * Short website terms. A draft, not legal advice. The governing law line appears only once the
 * company supplies it in src/content/company.ts (legal.governingLaw).
 */
import { COMPANY, CONTACT_EMAIL, hasContent } from '../content/company';
import { escapeHtml } from './html';

export const TERMS_TITLE = 'Terms of use';

export function renderTerms(): string {
  const who = escapeHtml(COMPANY.legalName ?? COMPANY.name);
  const email = escapeHtml(CONTACT_EMAIL);
  const law = hasContent(COMPANY.legal.governingLaw)
    ? `\n<h2>Governing law</h2>\n<p>These terms are governed by ${escapeHtml(COMPANY.legal.governingLaw)}.</p>`
    : '';
  return `<h1>Terms of use</h1>
<p>These terms apply to your use of this website. By using it you accept them.</p>

<h2>Information on this site</h2>
<p>The pages describe the kind of work ${who} does. The information is general and may change. Some content, including the sample projects, is there to show how the site works and does not describe a real client.</p>

<h2>No offer or contract</h2>
<p>Nothing on this site is an offer or forms a contract. A quote is valid only when we give it to you in writing.</p>

<h2>Our content</h2>
<p>The text, drawings and design of this site belong to ${who} or the people who licensed them to us. Please do not copy them without asking.</p>

<h2>Links</h2>
<p>This site links to other places, such as WhatsApp and email. We do not control those services and are not responsible for them.</p>

<h2>Liability</h2>
<p>To the extent the law allows, ${who} is not liable for loss that comes from using this website or relying on its general information.</p>${law}

<h2>Changes</h2>
<p>We may change these terms. The version on this page is the current one.</p>

<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:${email}">${email}</a>.</p>`;
}
