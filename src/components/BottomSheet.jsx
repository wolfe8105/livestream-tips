import React from 'react';

export default function BottomSheet({ open, onClose, title, subtitle, children }) {
  return (
    <>
      <div
        className={`overlay ${open ? 'visible' : ''}`}
        onClick={onClose}
      />
      <div className={`bottom-sheet ${open ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          {subtitle && <div className="sheet-subtitle">{subtitle}</div>}
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}
