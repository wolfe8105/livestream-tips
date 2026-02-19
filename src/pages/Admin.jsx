import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import db from '../services/database.js';
import { STATE_NAMES } from '../data/constants.js';
import { timeAgo } from '../services/helpers.js';

const STATUS_CONFIG = {
  pending_review: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
  approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '✅' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('pending_review');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const data = db.seedReviewQueue();
    setQueue(data);
  }, []);

  function refreshQueue() {
    setQueue(db.getReviewQueue());
  }

  function approveSubmission(id) {
    const item = queue.find(q => q.id === id);
    if (!window.confirm(`Approve ${item.identity.legalFirstName} ${item.identity.legalLastName}?\n\nThis will grant them the 🛡️ Verified badge.`)) return;
    db.updateReviewItem(id, {
      status: 'approved',
      reviewedAt: Date.now(),
      reviewedBy: user?.email || 'admin',
      rejectionReason: null,
    });
    refreshQueue();
    setExpandedId(null);
  }

  function rejectSubmission(id) {
    if (!rejectReason.trim()) { alert('Please provide a rejection reason.'); return; }
    db.updateReviewItem(id, {
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewedBy: user?.email || 'admin',
      rejectionReason: rejectReason.trim(),
    });
    refreshQueue();
    setRejectingId(null);
    setRejectReason('');
    setExpandedId(null);
  }

  function toggleVenueConfirmed(id) {
    const item = queue.find(q => q.id === id);
    db.updateReviewItem(id, {
      venue: { ...item.venue, venueConfirmed: !item.venue.venueConfirmed },
    });
    refreshQueue();
  }

  function reopenSubmission(id) {
    db.updateReviewItem(id, {
      status: 'pending_review',
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    });
    refreshQueue();
  }

  // Calculate age from DOB
  function getAge(dob) {
    if (!dob) return '?';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  }

  const filtered = queue.filter(q => filter === 'all' || q.status === filter);
  const counts = {
    pending_review: queue.filter(q => q.status === 'pending_review').length,
    approved: queue.filter(q => q.status === 'approved').length,
    rejected: queue.filter(q => q.status === 'rejected').length,
  };

  return (
    <div className="page-pad" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>Admin Review Panel</h1>
      </div>
      <p className="text-dim" style={{ fontSize: 12, marginBottom: 20 }}>Verification submissions from performers</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '12px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              background: filter === key ? cfg.bg : 'var(--surface)',
              border: filter === key ? `1.5px solid ${cfg.color}` : '1px solid var(--border)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color }}>{counts[key]}</div>
            <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.icon} {cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {[
          { key: 'pending_review', label: `Pending (${counts.pending_review})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` },
          { key: 'all', label: `All (${queue.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setExpandedId(null); }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === tab.key ? 'var(--accent)' : 'var(--surface)',
              border: filter === tab.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: filter === tab.key ? '#fff' : 'var(--muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue */}
      {filtered.length === 0 ? (
        <div className="card card-surface" style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div className="text-muted">No submissions in this category</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.sort((a, b) => b.submittedAt - a.submittedAt).map(item => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_review;
            const isExpanded = expandedId === item.id;
            const age = getAge(item.identity.dateOfBirth);

            return (
              <div key={item.id} className="card card-surface" style={{ borderColor: isExpanded ? cfg.color : 'var(--border)', transition: 'border-color 0.2s' }}>
                {/* Summary row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cfg.bg, fontSize: 18,
                    }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{item.identity.legalFirstName} {item.identity.legalLastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {item.identity.stageNames ? `"${item.identity.stageNames.split(',')[0].trim()}"` : ''} • {item.venue.clubName}, {item.venue.clubState} • Age {age}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--dim)' }}>{timeAgo(item.submittedAt)}</div>
                    <div style={{ fontSize: 16, color: 'var(--muted)', marginTop: 4 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>

                    {/* Identity Section */}
                    <DetailSection title="🪪 Identity" color="var(--accent)">
                      <DetailRow label="Legal Name" value={`${item.identity.legalFirstName} ${item.identity.legalLastName}`} />
                      <DetailRow label="Date of Birth" value={`${item.identity.dateOfBirth} (age ${age})`} flag={age < 18 ? 'UNDERAGE — DO NOT APPROVE' : age < 21 ? 'Under 21' : null} flagColor={age < 18 ? '#ef4444' : '#f59e0b'} />
                      <DetailRow label="Stage Names" value={item.identity.stageNames || 'None listed'} />
                      <DetailRow label="ID Type" value={item.identity.idType} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <DocBadge uploaded={item.identity.idUploaded} label="ID Photo" />
                        <DocBadge uploaded={item.identity.selfieUploaded} label="Selfie w/ ID" />
                      </div>
                      {/* In production: thumbnail previews of ID and selfie would go here */}
                      <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', fontSize: 11, color: 'var(--dim)', textAlign: 'center' }}>
                        📷 ID & selfie preview would display here in production
                      </div>
                    </DetailSection>

                    {/* Venue Section */}
                    <DetailSection title="🏢 Venue" color="var(--gold)">
                      <DetailRow label="Venue" value={`${item.venue.clubName}`} />
                      <DetailRow label="State" value={STATE_NAMES[item.venue.clubState] || item.venue.clubState} />
                      <DetailRow label="Manager" value={item.venue.managerName} />
                      <DetailRow label="Manager Email" value={item.venue.managerEmail || '—'} copyable />
                      <DetailRow label="Manager Phone" value={item.venue.managerPhone || '—'} copyable />
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVenueConfirmed(item.id); }}
                          style={{
                            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                            background: item.venue.venueConfirmed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                            border: item.venue.venueConfirmed ? '1.5px solid #22c55e' : '1.5px solid var(--border)',
                            color: item.venue.venueConfirmed ? '#22c55e' : 'var(--muted)',
                          }}
                        >
                          {item.venue.venueConfirmed ? '✅ Venue Confirmed' : '⬜ Mark Venue Confirmed'}
                        </button>
                        {!item.venue.venueConfirmed && (
                          <span style={{ fontSize: 11, color: 'var(--dim)' }}>Contact manager to confirm</span>
                        )}
                      </div>
                    </DetailSection>

                    {/* Compliance Section */}
                    <DetailSection title="⚖️ 2257 Compliance" color="#a855f7">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                        <ComplianceCheck ok={item.compliance.ageConfirmed} label="Age confirmed (18+)" />
                        <ComplianceCheck ok={item.compliance.custodianAcknowledged} label="Custodian of Records acknowledged" />
                        <ComplianceCheck ok={item.compliance.termsAccepted} label="Terms of Service accepted" />
                        <ComplianceCheck ok={item.identity.idUploaded} label="Government ID on file" />
                        <ComplianceCheck ok={item.identity.selfieUploaded} label="Verification selfie on file" />
                        <ComplianceCheck ok={age >= 18} label={`DOB verification: age ${age}`} critical={age < 18} />
                      </div>
                    </DetailSection>

                    {/* Review History */}
                    {item.reviewedAt && (
                      <DetailSection title="📋 Review History" color="var(--muted)">
                        <DetailRow label="Reviewed By" value={item.reviewedBy || 'Unknown'} />
                        <DetailRow label="Reviewed At" value={new Date(item.reviewedAt).toLocaleString()} />
                        <DetailRow label="Decision" value={item.status === 'approved' ? '✅ Approved' : '❌ Rejected'} />
                        {item.rejectionReason && (
                          <DetailRow label="Reason" value={item.rejectionReason} />
                        )}
                      </DetailSection>
                    )}

                    {/* Actions */}
                    {item.status === 'pending_review' && (
                      <div style={{ marginTop: 16 }}>
                        {rejectingId === item.id ? (
                          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Rejection Reason *</div>
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Explain what needs to be corrected (performer will see this)..."
                              rows={3}
                              style={{
                                width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                                background: 'var(--surface)', color: 'var(--text)', fontSize: 13, resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                              >Cancel</button>
                              <button
                                onClick={() => rejectSubmission(item.id)}
                                style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                              >❌ Confirm Reject</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => { setRejectingId(item.id); setRejectReason(''); }}
                              style={{
                                flex: 1, padding: 12, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#ef4444',
                              }}
                            >❌ Reject</button>
                            <button
                              onClick={() => approveSubmission(item.id)}
                              style={{
                                flex: 2, padding: 12, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)', color: '#22c55e',
                              }}
                            >✅ Approve & Verify</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reopen for approved/rejected */}
                    {(item.status === 'approved' || item.status === 'rejected') && (
                      <div style={{ marginTop: 16 }}>
                        <button
                          onClick={() => reopenSubmission(item.id)}
                          style={{
                            width: '100%', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                            background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
                          }}
                        >🔄 Reopen for Review</button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Notes */}
      <div className="card card-surface" style={{ marginTop: 24, padding: 16, borderColor: 'rgba(168,85,247,0.2)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: '#a855f7' }}>📝 Admin Notes</h3>
        <p style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}>Internal notes — not visible to performers</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="e.g., Waiting on callback from Sapphire LV manager re: Jessica M..."
          rows={3}
          style={{
            width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontSize: 13, resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => {
            localStorage.setItem('sts_admin_notes', noteText);
            alert('✅ Notes saved');
          }}
          style={{ marginTop: 8, padding: '6px 16px', borderRadius: 8, border: 'none', background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >💾 Save Notes</button>
      </div>

      {/* Review Checklist */}
      <div className="card card-surface" style={{ marginTop: 16, padding: 16, borderColor: 'rgba(245,158,11,0.2)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: 'var(--gold)' }}>📋 Review Checklist</h3>
        <div style={{ fontSize: 12, lineHeight: 2, color: 'var(--muted)' }}>
          <div>1. ✅ Verify ID photo is clear, not expired, and matches stated name/DOB</div>
          <div>2. ✅ Verify selfie matches ID photo — same person, holding the actual ID</div>
          <div>3. ✅ Confirm performer is 18+ (calculate from DOB)</div>
          <div>4. ✅ Contact venue manager to confirm performer affiliation</div>
          <div>5. ✅ Mark "Venue Confirmed" after manager callback</div>
          <div>6. ✅ Check all stage names are listed (2257 requirement)</div>
          <div>7. ✅ Approve only after all checks pass</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function DetailSection({ title, color, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{title}</h4>
      {children}
    </div>
  );
}

function DetailRow({ label, value, flag, flagColor, copyable }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--dim)', minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
        {flag && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: flagColor, background: `${flagColor}15`, padding: '2px 6px', borderRadius: 4 }}>{flag}</span>}
        {copyable && value !== '—' && (
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); }}
            style={{ marginLeft: 6, background: 'none', border: 'none', color: 'var(--dim)', fontSize: 10, cursor: 'pointer' }}
            title="Copy"
          >📋</button>
        )}
      </span>
    </div>
  );
}

function DocBadge({ uploaded, label }) {
  return (
    <div style={{
      flex: 1, padding: 8, borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 600,
      background: uploaded ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
      border: `1px solid ${uploaded ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      color: uploaded ? '#22c55e' : '#ef4444',
    }}>
      {uploaded ? '✅' : '❌'} {label}
    </div>
  );
}

function ComplianceCheck({ ok, label, critical }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
      color: critical ? '#ef4444' : ok ? 'var(--muted)' : '#ef4444',
      fontWeight: critical ? 800 : 400,
    }}>
      <span>{ok && !critical ? '✅' : '❌'}</span>
      <span>{label}</span>
      {critical && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>⚠️ CRITICAL</span>}
    </div>
  );
}
