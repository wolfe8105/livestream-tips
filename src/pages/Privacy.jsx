import React from 'react';

/**
 * PRIVACY POLICY
 * ==============
 * PRODUCTION: Must be reviewed by an attorney for CCPA, GDPR,
 * and state-specific privacy law compliance before launch.
 *
 * Placeholders marked with [PLACEHOLDER] require real business info.
 */

const COMPANY = {
  name: 'StreamToStage LLC',
  address: '[Business Address — To Be Determined]',
  email: 'privacy@streamtostage.com',
  dpo: '[Data Protection Contact — To Be Designated]',
};

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>LEGAL</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Privacy Policy</h1>
          <p style={{ fontSize: 12, color: 'var(--dim)' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        <Notice text="This Privacy Policy is a working draft and must be reviewed by an attorney for CCPA, GDPR, and applicable state privacy law compliance before launch." />

        <Section title="1. Introduction">
          <p>
            {COMPANY.name} ("Company," "we," "us," or "our") operates the StreamToStage platform (the "Platform").
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when
            you visit or use our Platform.
          </p>
          <p>
            By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree
            with this Policy, please do not use the Platform.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <h4 style={styles.sub}>2a. Information You Provide</h4>
          <ul style={styles.list}>
            <li><strong>Account information:</strong> Email address, password (hashed), chosen display name, user role (viewer or performer)</li>
            <li><strong>Age verification data:</strong> Confirmation that you are 18 or older; in jurisdictions requiring it, government-issued ID may be verified through a third-party provider</li>
            <li><strong>Performer identity data:</strong> Legal name, date of birth, government-issued photo ID, selfie with ID, stage names, venue affiliation (collected under 18 U.S.C. § 2257)</li>
            <li><strong>Payment information:</strong> Token purchase history; payment card details are processed by our third-party payment processor and are not stored on our servers</li>
            <li><strong>Performer payout data:</strong> Wallet addresses (for crypto payouts), W-9/tax information</li>
            <li><strong>Communications:</strong> Chat messages in stream rooms, support requests, report submissions</li>
          </ul>

          <h4 style={styles.sub}>2b. Information Collected Automatically</h4>
          <ul style={styles.list}>
            <li><strong>Device information:</strong> Browser type, operating system, device type</li>
            <li><strong>Usage data:</strong> Pages visited, features used, stream viewing history, tip history</li>
            <li><strong>Log data:</strong> IP address, access times, referring URLs</li>
            <li><strong>Cookies and local storage:</strong> Session data, preferences, authentication tokens (see Section 8)</li>
          </ul>

          <h4 style={styles.sub}>2c. Information from Third Parties</h4>
          <ul style={styles.list}>
            <li><strong>Payment processors:</strong> Transaction confirmation, fraud detection results</li>
            <li><strong>Age verification providers:</strong> Age confirmation result (pass/fail — we do not receive or store your ID documents from third-party verification)</li>
            <li><strong>Venue managers:</strong> Confirmation of performer affiliation with a licensed club</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use collected information for the following purposes:</p>
          <ul style={styles.list}>
            <li>Providing, maintaining, and improving the Platform</li>
            <li>Processing transactions (token purchases, performer payouts)</li>
            <li>Verifying performer identity and age as required by 18 U.S.C. § 2257</li>
            <li>Verifying viewer age as required by applicable state laws</li>
            <li>Enforcing our Terms of Service and preventing fraud, abuse, and illegal activity</li>
            <li>Complying with legal obligations including tax reporting (1099 forms), AML requirements, and law enforcement requests</li>
            <li>Communicating with you about your account, transactions, and Platform updates</li>
            <li>Analyzing usage patterns to improve Platform features and performance</li>
            <li>Protecting the safety and security of our users</li>
          </ul>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul style={styles.list}>
            <li><strong>Payment processors:</strong> To process token purchases and performer payouts</li>
            <li><strong>Age verification providers:</strong> To verify user ages where required by law</li>
            <li><strong>Law enforcement:</strong> When required by law, subpoena, court order, or to report suspected illegal activity (including reports to NCMEC)</li>
            <li><strong>Tax authorities:</strong> IRS and state tax agencies as required for performer income reporting</li>
            <li><strong>Service providers:</strong> Hosting, streaming infrastructure, anti-fraud services — bound by confidentiality agreements</li>
            <li><strong>Legal proceedings:</strong> To enforce our Terms, protect our rights, or defend against legal claims</li>
          </ul>
          <p>
            <strong>Public information:</strong> Your display name, profile icon, tips, and chat messages are visible
            to other users in stream rooms. Performer stage names, verification badges, and club affiliations are
            publicly displayed on the Platform.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <ul style={styles.list}>
            <li><strong>Account data:</strong> Retained as long as your account is active, then deleted within 30 days of account closure (except as required by law)</li>
            <li><strong>2257 records (performer identity):</strong> Retained for five (5) years after the performer's last appearance on the Platform, as required by federal law</li>
            <li><strong>Transaction records:</strong> Retained for seven (7) years for tax and financial reporting compliance</li>
            <li><strong>Chat messages:</strong> Retained for 90 days for moderation and safety review, then deleted</li>
            <li><strong>IP and access logs:</strong> Retained for 12 months for security and fraud prevention</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <h4 style={styles.sub}>All Users</h4>
          <ul style={styles.list}>
            <li>Access your personal information we hold about you</li>
            <li>Correct inaccurate personal information</li>
            <li>Delete your account and associated data (subject to legal retention requirements)</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h4 style={styles.sub}>California Residents (CCPA/CPRA)</h4>
          <p>Under the California Consumer Privacy Act, you have the right to:</p>
          <ul style={styles.list}>
            <li>Know what personal information we collect and how it is used</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of the sale of your personal information (we do not sell personal information)</li>
            <li>Non-discrimination for exercising your privacy rights</li>
          </ul>

          <h4 style={styles.sub}>European Users (GDPR)</h4>
          <p>If you are located in the European Economic Area, you have additional rights including:</p>
          <ul style={styles.list}>
            <li>Right to data portability</li>
            <li>Right to restrict processing</li>
            <li>Right to object to processing</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>

          <p>To exercise any of these rights, contact us at: <strong>{COMPANY.email}</strong></p>
        </Section>

        <Section title="7. Data Security">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information,
            including:
          </p>
          <ul style={styles.list}>
            <li>Encryption in transit (TLS/SSL) and at rest</li>
            <li>Hashed and salted passwords</li>
            <li>Access controls limiting employee access to personal data</li>
            <li>Regular security assessments</li>
            <li>Secure storage of 2257 records with restricted access</li>
          </ul>
          <p>
            No method of transmission over the Internet is 100% secure. While we strive to protect your information,
            we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="8. Cookies & Local Storage">
          <p>We use the following types of cookies and local storage:</p>
          <ul style={styles.list}>
            <li><strong>Essential (required):</strong> Authentication tokens, age verification status, session data — these are necessary for the Platform to function</li>
            <li><strong>Functional:</strong> User preferences (display name, theme settings, notification preferences) — stored locally for your convenience</li>
            <li><strong>Analytics:</strong> [PLACEHOLDER — Define if analytics tools like Google Analytics, Plausible, etc. will be used]</li>
          </ul>
          <p>
            You can clear local storage at any time through your browser settings or the "Clear All Local Data"
            option in your Dashboard.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            This Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal
            information from anyone under 18. If we learn that we have collected information from a minor, we will
            delete that information immediately and terminate the associated account.
          </p>
          <p>
            If you believe a minor has provided us with personal information, please contact us immediately at{' '}
            <strong>{COMPANY.email}</strong>.
          </p>
        </Section>

        <Section title="10. International Data Transfers">
          <p>
            The Platform is operated from the United States. If you access the Platform from outside the United States,
            your information may be transferred to and processed in the United States, where data protection laws may
            differ from those in your jurisdiction.
          </p>
          <p>
            <strong>[PLACEHOLDER — International Transfer Mechanisms]:</strong> [Attorney to specify: Standard
            Contractual Clauses, adequacy decisions, or other GDPR-compliant transfer mechanisms if EU users are
            expected.]
          </p>
        </Section>

        <Section title="11. Third-Party Links">
          <p>
            The Platform may contain links to third-party websites or services. We are not responsible for the
            privacy practices of these third parties. We encourage you to read the privacy policies of any
            third-party sites you visit.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting
            the updated Policy on this page with a new "Last Updated" date. Continued use of the Platform after
            changes constitutes acceptance.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>For questions about this Privacy Policy or to exercise your data rights:</p>
          <div style={styles.infoBox}>
            <div><strong>{COMPANY.name}</strong></div>
            <div>Data Protection Contact: {COMPANY.dpo}</div>
            <div>{COMPANY.address}</div>
            <div>Email: {COMPANY.email}</div>
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
  sub: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 14, marginBottom: 6 },
  list: { paddingLeft: 20, lineHeight: 2, fontSize: 13 },
  infoBox: {
    padding: 14, borderRadius: 10, marginTop: 10,
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
    fontSize: 13, lineHeight: 1.8,
  },
};
