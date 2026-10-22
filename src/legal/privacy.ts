/*
 * REVIEW BY COMPANY ADVISER
 * Plain-language privacy notice, written from facts in the code and from the providers'
 * published documents (Formspree privacy policy, last updated 24 April 2022; Vercel Web Analytics
 * privacy documentation). It is a draft, not legal advice. Open questions for the company's
 * adviser are listed in docs/FORM-AND-DOMAIN.md.
 */
import { COMPANY, CONTACT_EMAIL, hasContent } from '../content/company';
import { escapeHtml } from './html';

export const PRIVACY_TITLE = 'Privacy notice';

export function renderPrivacy(): string {
  const who = escapeHtml(COMPANY.legalName ?? COMPANY.name);
  const email = escapeHtml(CONTACT_EMAIL);
  const retention = escapeHtml(COMPANY.legal.retentionPeriod);
  const address = hasContent(COMPANY.contact.address)
    ? ` Our address is ${escapeHtml(COMPANY.contact.address)}.`
    : '';
  return `<h1>Privacy notice</h1>
<p class="legal-draft">Draft, pending legal review.</p>
<p>This notice explains what happens to the details you send through the enquiry form on this website. It is written to be read, not to impress.</p>

<h2>Who is responsible</h2>
<p>${who} is responsible for the details you send us. You can reach us at <a href="mailto:${email}">${email}</a>.${address}</p>

<h2>What the form collects</h2>
<p>The form asks for your name, your phone number, your email address (optional), the type of project, the project location (optional) and a message describing the project.</p>

<h2>Why we use it</h2>
<p>We use these details to reply to your enquiry about building work. We do not use them to send marketing.</p>

<h2>Who else handles it</h2>
<p>The form is run by Formspree (Formspree, Inc.), a form service provider. Formspree receives what you submit and forwards it to us by email. Formspree's privacy policy, as last updated on 24 April 2022 when we read it, says it uses personal information in the United States and any other country where it operates, so your details may be handled outside India. Formspree's own policy governs its copy of your details.</p>

<h2>How long we keep it</h2>
<p>We keep enquiry details for ${retention}${COMPANY.legal.retentionIsSample ? ' (a sample period, to be confirmed by the company)' : ''}.</p>

<h2>Cookies and analytics</h2>
<p>This website does not set cookies. It keeps one small flag in your browser's session storage so the opening line animation plays once per visit; the browser clears it when you close the tab. We use Vercel Web Analytics to count visits. Vercel's documentation says it works without cookies and records visits anonymously, without identifying individual visitors. We do not use advertising cookies or trackers.</p>

<h2>Your choices</h2>
<p>You can write to <a href="mailto:${email}">${email}</a> to ask for a copy of your details, to ask us to correct them, or to ask us to delete them. This notice is written with India's Digital Personal Data Protection Act, 2023 in mind.</p>

<h2>If you are not happy</h2>
<p>Write to us again at the same address and ask for your request to be looked at again.</p>`;
}
