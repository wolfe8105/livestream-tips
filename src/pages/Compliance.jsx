import React from 'react';

/**
 * 2257 COMPLIANCE PAGE
 * ====================
 * Federal law requires this page to be publicly accessible.
 * It must display:
 *   1. The Custodian of Records name and business address
 *   2. A statement of compliance with 18 U.S.C. § 2257
 *   3. Must be linked from every page containing sexually explicit content
 *
 * PRODUCTION SETUP:
 *   - Replace placeholder Custodian info with your actual designated person
 *   - The Custodian must be a real person at a real address
 *   - Records must be physically available at the listed address for inspection
 *   - Consult an attorney specializing in adult entertainment law
 */

// ============================================
// CUSTODIAN OF RECORDS — UPDATE FOR PRODUCTION
// ============================================
const CUSTODIAN = {
  name: '[Custodian Name — To Be Designated]',
  company: 'StreamToStage LLC',
  address1: '[Street Address]',
  address2: '[City, State ZIP]',
  email: 'compliance@streamtostage.com',
  // Hours when records are available for inspection (required by law)
  inspectionHours: 'Monday – Friday, 10:00 AM – 4:00 PM EST',
};

export default function Compliance() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>LEGAL</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            18 U.S.C. § 2257 Record-Keeping Requirements
          </h1>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>
            Compliance Statement
          </h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Custodian of Records */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 24,
          background: 'rgba(225,29,72,0.05)', border: '1.5px solid rgba(225,29,72,0.2)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'var(--accent)' }}>
            Custodian of Records
          </h3>
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700 }}>{CUSTODIAN.name}</div>
            <div>{CUSTODIAN.company}</div>
            <div>{CUSTODIAN.address1}</div>
            <div>{CUSTODIAN.address2}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
              <strong>Records available for inspection:</strong><br />
              {CUSTODIAN.inspectionHours}
            </div>
          </div>
        </div>

        {/* Compliance Statement */}
        <Section title="Compliance Statement">
          <p>
            All visual content appearing on StreamToStage (streamtostage.com and associated subdomains) 
            that constitutes an "actual sexually explicit performance" as defined in 18 U.S.C. § 2257 
            is subject to the record-keeping requirements of 18 U.S.C. § 2257 and its implementing 
            regulations, 28 C.F.R. Part 75.
          </p>
          <p>
            The Custodian of Records designated above maintains all records required by 18 U.S.C. § 2257 
            and 28 C.F.R. Part 75 with respect to all content produced by StreamToStage or for which 
            StreamToStage acts as a secondary producer.
          </p>
          <p>
            All performers appearing in any visual depiction of actual sexually explicit conduct appearing 
            on or otherwise contained in this website were over the age of eighteen (18) years at the time 
            of the creation of such depictions. Records required to be maintained pursuant to 18 U.S.C. 
            § 2257 are kept by the Custodian of Records at the address listed above.
          </p>
        </Section>

        {/* What Records We Maintain */}
        <Section title="Records Maintained">
          <p>
            In compliance with 18 U.S.C. § 2257 and 28 C.F.R. Part 75, the following records are 
            maintained for each performer appearing in sexually explicit content on this platform:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>The performer's legal name and date of birth</li>
            <li>All stage names, screen names, aliases, and other names used by the performer</li>
            <li>A copy of a valid, government-issued photo identification document verifying the performer's identity and age</li>
            <li>The date on which the performer's age was verified</li>
            <li>A cross-reference system linking each performer's legal name to all content in which they appear</li>
          </ul>
        </Section>

        {/* Secondary Producer Status */}
        <Section title="Producer Designation">
          <p>
            StreamToStage operates as both a primary and secondary producer of content as defined under 
            18 U.S.C. § 2257. As a platform enabling live streaming by independent performers:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Primary producer responsibilities</strong> are fulfilled by requiring all performers 
            to complete identity verification and age confirmation prior to streaming any content on the platform.</li>
            <li><strong>Secondary producer responsibilities</strong> are fulfilled by maintaining records 
            received from performers, cross-referencing content to performer identities, and designating 
            a Custodian of Records as required by law.</li>
          </ul>
        </Section>

        {/* Venue Verification */}
        <Section title="Venue Verification Program">
          <p>
            In addition to the federally mandated identity and age verification, StreamToStage operates 
            a Venue Verification Program. All performers must be associated with a licensed adult 
            entertainment venue. Venue managers are contacted directly to confirm each performer's 
            employment or affiliation.
          </p>
          <p>
            Performers who complete both identity verification and venue verification receive a 
            "🛡️ Verified" designation visible to all users. This program is designed to provide an 
            additional layer of authenticity beyond the minimum requirements of 18 U.S.C. § 2257, 
            ensuring viewers can trust that they are watching real, verified individuals performing 
            from legitimate establishments.
          </p>
        </Section>

        {/* Inspection */}
        <Section title="Inspection of Records">
          <p>
            The records required by 18 U.S.C. § 2257 with respect to content appearing on this website 
            are available for inspection during regular business hours by the Attorney General (or their 
            designee) at the address of the Custodian of Records listed above.
          </p>
          <p>
            Inspection hours: {CUSTODIAN.inspectionHours}
          </p>
        </Section>

        {/* Reporting */}
        <Section title="Reporting Concerns">
          <p>
            If you have concerns about any content appearing on this platform, including but not limited 
            to suspected violations of 18 U.S.C. § 2257 or suspected underage individuals, please contact 
            us immediately:
          </p>
          <div style={{
            padding: 14, borderRadius: 10, marginTop: 10,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div><strong>Email:</strong> {CUSTODIAN.email}</div>
              <div><strong>NCMEC CyberTipline:</strong> www.missingkids.org/gethelpnow/cybertipline</div>
            </div>
          </div>
        </Section>

        {/* Disclaimer */}
        <Section title="Legal Notice">
          <p>
            This compliance statement is provided for informational purposes and to fulfill the disclosure 
            requirements of 18 U.S.C. § 2257 and 28 C.F.R. § 75.6. StreamToStage reserves the right to 
            update this statement as necessary to maintain compliance with applicable law.
          </p>
          <p>
            Nothing in this statement shall be construed as an admission that any content on this website 
            constitutes "sexually explicit conduct" as defined in 18 U.S.C. § 2256(2), except to the extent 
            that records are maintained as a precautionary measure to ensure full compliance.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </Section>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a
            href="#/"
            style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'underline' }}
          >
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
      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
        {children}
      </div>
    </div>
  );
}
