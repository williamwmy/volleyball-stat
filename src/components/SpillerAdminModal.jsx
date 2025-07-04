// src/components/SpillerAdminModal.jsx
import React from "react";

export default function SpillerAdminModal({ spillere, onClose, onRediger, onSlett }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal admin-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '88vh', top: '4vh', overflowY: 'auto' }}
      >
        <h2>Spilleradministrasjon</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Navn</th>
              <th>Aktiv?</th>
              <th>Rediger</th>
              <th>Slett</th>
            </tr>
          </thead>
          <tbody>
            {spillere.map(spiller => (
              <tr key={spiller.id} style={{ fontSize: "1em", height: "32px" }}>
                <td>{spiller.nummer}</td>
                <td>{spiller.navn}</td>
                <td>{spiller.active ? "Ja" : "Nei"}</td>
                <td>
                  <button onClick={() => onRediger(spiller)} style={{ fontSize: "1em", padding: "0.18em 0.6em" }}>Endre</button>
                </td>
                <td>
                  <button onClick={() => onSlett(spiller)} style={{ fontSize: "1em", padding: "0.18em 0.6em" }}>Slett</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={{ marginTop: 12 }} onClick={onClose}>Lukk</button>
      </div>
    </div>
  );
}
