import React from 'react';

/**
 * DMCA POLICY — PUBLIC TAKEDOWN PROCEDURE
 * ========================================
 * Required for DMCA safe harbor protection under 17 U.S.C. § 512.
 * Must be publicly accessible and describe how copyright holders
 * can submit takedown requests.
 *
 * PRODUCTION:
 *   - Register a DMCA agent with the U.S. Copyright Office
 *   - Fill in real agent name and contact info
 *   - Attorney review recommended
 */

const AGENT = {
  name: '[DMCA Agent — To Be Designated]',
  company: 'StreamToStage LLC',
  address: '[Business Address — To Be Determined]',
  email: 'dmca@streamtostage.com',
  phone: '[Phone Number — To Be Determined]',
};

export default function DMCAPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>LEGAL</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>DMCA Takedown Policy</h1>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>
            Digital Millennium Copyright Act — 17 U.S.C. § 512
          </h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        <Notice text="DMCA Agent must be registered with the U.S. Copyright Office before this policy is legally effective. Register at: https://www.copyright.gov/dmca-directory/" />

        {/* Designated Agent */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 24,
          background: 'rgba(225,29,72,0.05)', border: '1.5px solid rgba(225,29,72,0.2)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'var(--accent)' }}>
            Designated DMCA Agent
          </h3>
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700 }}>{AGENT.name}</div>
            <div>{AGENT.company}</div>
            <div>{AGENT.address}</div>
            <div style={{ marginTop: 4 }}>Email: {AGENT.email}</div>
            <div>Phone: {AGENT.phone}</div>
          </div>
        </div>

        <Section title="1. Overview">
          <p>
            StreamToStage respects the intellectual property rights of others and expects our users to do the same.
            In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly to
            claims of copyright infringement committed using the StreamToStage platform.
          </p>
          <p>
            If you believe that content on our platform infringes your copyright, you may submit a DMCA takedown
            notice to our designated agent listed above.
          </p>
        </Section>

        <Section title="2. Filing a DMCA Takedown Notice">
          <p>
            To file a valid DMCA takedown notice, please provide the following information in writing to our
            designated agent:
          </p>
          <ol style={styles.list}>
            <li>
              <strong>Identification of the copyrighted work:</strong> A description of the copyrighted work you
              claim has been infringed, or a representative list if multiple works are covered.
            </li>
            <li>
              <strong>Identification of the infringing material:</strong> A description of where the infringing
              material is located on our platform, with enough detail for us to find it (e.g., URL, performer name,
              date and time of stream).
            </li>
            <li>
              <strong>Your contact information:</strong> Your name, mailing address, telephone number, and email
              address.
            </li>
            <li>
              <strong>Good faith statement:</strong> A statement that you have a good faith belief that the use of
              the material is not authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              <strong>Accuracy statement:</strong> A statement, under penalty of perjury, that the information in
              your notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.
            </li>
            <li>
              <strong>Signature:</strong> A physical or electronic signature of the copyright owner or authorized
              representative.
            </li>
          </ol>
          <p>
            Send your takedown notice to: <strong>{AGENT.email}</strong>
          </p>
        </Section>

        <Section title="3. Counter-Notification">
          <p>
            If you believe your content was removed or disabled by mistake or misidentification, you may file a
            counter-notification. Your counter-notification must include:
          </p>
          <ol style={styles.list}>
            <li>Your name, address, phone number, and email address</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification</li>
            <li>A statement that you consent to the jurisdiction of the federal court in your district (or, if outside the U.S., any judicial district in which {AGENT.company} may be found)</li>
            <li>A statement that you will accept service of process from the party who filed the original takedown notice</li>
            <li>Your physical or electronic signature</li>
          </ol>
          <p>
            Upon receiving a valid counter-notification, we will forward it to the original complainant. If the
            complainant does not file a court action within 10 business days, we will restore the removed content.
          </p>
        </Section>

        <Section title="4. Repeat Infringer Policy">
          <p>
            In accordance with the DMCA, we maintain a policy of terminating, in appropriate circumstances, the
            accounts of users who are repeat infringers. We consider a "repeat infringer" to be any user who has
            been the subject of more than two valid DMCA takedown notices.
          </p>
          <p>Consequences may include:</p>
          <ul style={styles.list}>
            <li><strong>First notice:</strong> Content removed, written warning issued</li>
            <li><strong>Second notice:</strong> Content removed, 30-day streaming suspension</li>
            <li><strong>Third notice:</strong> Permanent account termination</li>
          </ul>
        </Section>

        <Section title="5. Live Stream Considerations">
          <p>
            Because StreamToStage primarily delivers live streaming content, DMCA takedown procedures apply as follows:
          </p>
          <ul style={styles.list}>
            <li><strong>Active streams:</strong> If a valid notice is received regarding an active live stream, we will terminate the stream immediately upon review.</li>
            <li><strong>Recorded/archived content:</strong> Will be removed within one business day of receiving a valid notice.</li>
            <li><strong>Chat content:</strong> Infringing text or links shared in chat will be removed upon notice.</li>
          </ul>
        </Section>

        <Section title="6. Misrepresentation Warning">
          <p>
            Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is
            infringing, or that material was removed by mistake, may be subject to liability for damages, including
            costs and attorney's fees.
          </p>
          <p>
            Please do not make false claims. Before filing a DMCA notice, consider whether the use of the material
            may qualify as fair use.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>For DMCA-related inquiries:</p>
          <div style={styles.infoBox}>
            <div><strong>DMCA Agent:</strong> {AGENT.name}</div>
            <div><strong>Email:</strong> {AGENT.email}</div>
            <div><strong>Phone:</strong> {AGENT.phone}</div>
            <div><strong>Mail:</strong> {AGENT.company}, {AGENT.address}</div>
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
  list: { paddingLeft: 20, lineHeight: 2.2, fontSize: 13 },
  infoBox: {
    padding: 14, borderRadius: 10, marginTop: 10,
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
    fontSize: 13, lineHeight: 1.8,
  },
};
