import React from 'react';

/**
 * TERMS OF SERVICE
 * ================
 * PRODUCTION: Must be reviewed and approved by an attorney
 * specializing in adult entertainment law before launch.
 *
 * Placeholders marked with [PLACEHOLDER] require real business info.
 */

const COMPANY = {
  name: 'StreamToStage LLC',
  address: '[Business Address — To Be Determined]',
  email: 'legal@streamtostage.com',
  state: '[Governing State — To Be Determined]',
};

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>LEGAL</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Terms of Service</h1>
          <p style={{ fontSize: 12, color: 'var(--dim)' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        <Notice text="These Terms of Service are a working draft and must be reviewed by an attorney before StreamToStage accepts real users or payments." />

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using StreamToStage (the "Platform"), operated by {COMPANY.name} ("Company," "we," "us,"
            or "our"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do
            not agree to these Terms, you must immediately leave the Platform and discontinue use.
          </p>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Platform after changes
            constitutes acceptance of the updated Terms. Material changes will be communicated via email or a
            prominent notice on the Platform.
          </p>
        </Section>

        <Section title="2. Eligibility & Age Verification">
          <p>
            You must be at least <strong>eighteen (18) years of age</strong>, or the age of majority in your
            jurisdiction (whichever is greater), to access or use this Platform. By using the Platform, you represent
            and warrant that you meet this age requirement.
          </p>
          <p>
            We implement age verification measures as required by applicable federal and state law. Providing false
            age information is a violation of these Terms and may result in immediate account termination and
            reporting to relevant authorities.
          </p>
          <p>
            Access to this Platform may be restricted in jurisdictions where age verification laws impose requirements
            we have not yet implemented. It is your responsibility to ensure that accessing this Platform is legal in
            your jurisdiction.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p>
            To use certain features, you must create an account with accurate, complete, and current information.
            You are responsible for maintaining the confidentiality of your login credentials and for all activities
            that occur under your account.
          </p>
          <p>
            You agree to: (a) provide truthful registration information; (b) maintain the security of your password;
            (c) promptly notify us of any unauthorized use of your account; and (d) accept responsibility for all
            activities under your account.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, contain false information,
            or are used for fraudulent activity.
          </p>
        </Section>

        <Section title="4. User Conduct">
          <p>You agree NOT to:</p>
          <ul style={styles.list}>
            <li>Use the Platform if you are under 18 years of age</li>
            <li>Upload, share, or transmit content depicting minors in any context</li>
            <li>Record, download, screenshot, or redistribute any live stream content without the performer's written consent</li>
            <li>Harass, threaten, stalk, or intimidate any performer or user</li>
            <li>Solicit or offer in-person sexual services through the Platform</li>
            <li>Engage in or facilitate sex trafficking, prostitution, or exploitation of any kind</li>
            <li>Impersonate another person or misrepresent your identity</li>
            <li>Circumvent age verification, geo-restrictions, or access controls</li>
            <li>Use automated tools, bots, or scripts to interact with the Platform</li>
            <li>Attempt to reverse-engineer, decompile, or access non-public areas of the Platform</li>
            <li>Engage in money laundering or use the Platform for any illegal financial activity</li>
            <li>Violate any applicable local, state, national, or international law</li>
          </ul>
        </Section>

        <Section title="5. Token Economy & Payments">
          <p>
            The Platform uses a virtual token system for tipping and transactions. Tokens have no cash value
            outside the Platform and are not redeemable for cash by viewers. Token purchases are final and
            non-refundable except as required by law.
          </p>
          <p>
            Token pricing, performer payout rates, and platform fees are set by the Company and may change at any
            time with reasonable notice. Current rates are displayed on the Platform at the time of purchase.
          </p>
          <p>
            <strong>[PLACEHOLDER — Payment Processor Terms]:</strong> Payments are processed by
            [CCBill / payment processor name]. Your use of payment services is also subject to the payment
            processor's terms of service and privacy policy.
          </p>
          <p>
            <strong>[PLACEHOLDER — Refund Policy]:</strong> [Define specific refund policy — e.g., no refunds on
            token purchases except for billing errors; refund requests must be submitted within X days.]
          </p>
        </Section>

        <Section title="6. Performer Terms">
          <p>
            Performers using the Platform are independent contractors, not employees of {COMPANY.name}. Performers
            are solely responsible for:
          </p>
          <ul style={styles.list}>
            <li>The content they create and broadcast on the Platform</li>
            <li>Complying with all applicable laws, including obscenity laws in their jurisdiction</li>
            <li>Maintaining accurate identity and venue verification information</li>
            <li>Reporting all income to the appropriate tax authorities</li>
            <li>Obtaining any necessary permits or licenses required in their jurisdiction</li>
          </ul>
          <p>
            Performers must complete identity verification and venue verification before streaming. Verified
            performers receive a "🛡️ Verified" badge indicating their association with a licensed adult entertainment
            venue. Misrepresentation of identity or venue affiliation will result in immediate account termination.
          </p>
          <p>
            The Company issues tax forms (1099-NEC or 1099-K) as required by the IRS for performer payouts exceeding
            applicable thresholds.
          </p>
        </Section>

        <Section title="7. Content Ownership & Licensing">
          <p>
            Performers retain ownership of the content they create and broadcast on the Platform. By using the
            Platform to stream, performers grant {COMPANY.name} a limited, non-exclusive, worldwide, royalty-free
            license to transmit, display, and temporarily store their live stream content for the purpose of
            delivering the streaming service.
          </p>
          <p>
            This license terminates when the performer deletes their account, except for any content that has been
            lawfully recorded or archived as permitted under these Terms.
          </p>
          <p>
            Viewers do not acquire any ownership or license rights to stream content. Unauthorized recording,
            downloading, screenshotting, or redistribution of stream content is strictly prohibited and may result
            in legal action under applicable copyright and privacy laws.
          </p>
        </Section>

        <Section title="8. DMCA & Copyright">
          <p>
            We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA).
            If you believe content on the Platform infringes your copyright, please submit a takedown notice as
            described in our <a href="#/dmca" style={{ color: 'var(--gold)' }}>DMCA Policy</a>.
          </p>
          <p>
            Repeat infringers will have their accounts terminated in accordance with the DMCA's repeat infringer
            policy.
          </p>
        </Section>

        <Section title="9. Privacy">
          <p>
            Your use of the Platform is also governed by our{' '}
            <a href="#/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy</a>, which describes how we collect,
            use, and protect your personal information. By using the Platform, you consent to the collection and use
            of your information as described in the Privacy Policy.
          </p>
        </Section>

        <Section title="10. Prohibited Content">
          <p>The following content is strictly prohibited on the Platform:</p>
          <ul style={styles.list}>
            <li>Any depiction of minors (real or simulated) in a sexual context</li>
            <li>Non-consensual sexual content or "revenge" content</li>
            <li>Content depicting or promoting sexual violence, coercion, or trafficking</li>
            <li>Content depicting bestiality or zoophilia</li>
            <li>Content that would be considered legally obscene under the Miller Test</li>
            <li>Content that violates applicable obscenity laws of any U.S. state</li>
            <li>Content promoting illegal drug use during a live stream</li>
            <li>Content that incites violence, hatred, or discrimination</li>
          </ul>
          <p>
            We reserve the right to remove any content and terminate any account that violates these prohibitions,
            and to report violations to law enforcement where required.
          </p>
        </Section>

        <Section title="11. Reporting & Safety">
          <p>
            Users can report content or behavior through the in-stream report function. Report categories include
            suspected underage performers, trafficking, non-consensual content, harassment, and illegal activity.
          </p>
          <p>
            If you suspect sex trafficking or exploitation of a minor, please report immediately to:
          </p>
          <div style={styles.infoBox}>
            <div><strong>NCMEC CyberTipline:</strong> www.missingkids.org/gethelpnow/cybertipline</div>
            <div><strong>National Human Trafficking Hotline:</strong> 1-888-373-7888</div>
            <div><strong>Email us:</strong> {COMPANY.email}</div>
          </div>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY.name.toUpperCase()} AND ITS OFFICERS, DIRECTORS,
            EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
            DATA, OR GOODWILL.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE AMOUNT
            YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>
          <p>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED.
          </p>
        </Section>

        <Section title="13. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless {COMPANY.name}, its officers, directors, employees,
            and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorney's
            fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation
            of any third-party rights; or (d) any content you submit or transmit through the Platform.
          </p>
        </Section>

        <Section title="14. Dispute Resolution">
          <p>
            <strong>[PLACEHOLDER — Arbitration Clause]:</strong> [Attorney to draft: binding arbitration vs.
            litigation, class action waiver, governing jurisdiction, venue selection, small claims exception.]
          </p>
          <p>
            These Terms are governed by the laws of the State of {COMPANY.state}, without regard to conflict of law
            principles.
          </p>
        </Section>

        <Section title="15. Termination">
          <p>
            We may suspend or terminate your account at any time, with or without cause, with or without notice.
            Upon termination: (a) your right to use the Platform ceases immediately; (b) any unused tokens in your
            account are forfeited unless required otherwise by law; (c) performer payout obligations for earned
            tokens will be honored per the performer payout schedule.
          </p>
        </Section>

        <Section title="16. Severability">
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
            continue in full force and effect. The invalid provision will be modified to the minimum extent necessary
            to make it valid and enforceable.
          </p>
        </Section>

        <Section title="17. Contact">
          <p>For questions about these Terms, contact us at:</p>
          <div style={styles.infoBox}>
            <div><strong>{COMPANY.name}</strong></div>
            <div>{COMPANY.address}</div>
            <div>{COMPANY.email}</div>
          </div>
        </Section>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="#/" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'underline' }}>
            ← Return to StreamToStage
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: 'var(--gold)' }}>{title}</h3>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>{children}</div>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div style={{
      padding: 16, borderRadius: 12, marginBottom: 24,
      background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.25)',
      fontSize: 12, lineHeight: 1.7, color: 'var(--gold)', fontWeight: 600,
    }}>
      ⚠️ {text}
    </div>
  );
}

const styles = {
  list: { paddingLeft: 20, lineHeight: 2, fontSize: 13 },
  infoBox: {
    padding: 14, borderRadius: 10, marginTop: 10,
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
    fontSize: 13, lineHeight: 1.8,
  },
};
