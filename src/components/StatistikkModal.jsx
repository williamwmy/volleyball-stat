import React from "react";
import { avg } from "../utils"; // Husk denne!
import "../App.css"; // hvis du trenger css her

export default function StatistikkModal({
  open,
  onClose,
  statsTab,
  setStatsTab,
  settNr,
  statistikkPerSett,
  spillere
}) {
  if (!open) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Statistikk – Sett {settNr + 1}</h2>
        <div className="stats-tab-row">
          <button
            className={statsTab === 0 ? "tab-btn aktiv" : "tab-btn"}
            onClick={() => setStatsTab(0)}
          >
            Snitt
          </button>
          <button
            className={statsTab === 1 ? "tab-btn aktiv" : "tab-btn"}
            onClick={() => setStatsTab(1)}
          >
            Alle forsøk
          </button>
        </div>
        {statsTab === 0 && (
          <table className="statistikk-tabell">
            <thead>
              <tr>
                <th>#</th>
                <th>Navn</th>
                <th>Serve</th>
                <th>Mottak</th>
                <th>Angrep</th>
              </tr>
            </thead>
            <tbody>
              {spillere.length === 0 && (
                <tr>
                  <td colSpan={5} className="tom-tekst">
                    Ingen spillere
                  </td>
                </tr>
              )}
              {spillere.map((spiller, idx) => {
                const stats = statistikkPerSett[settNr]?.[spiller.id] || {};
                return (
                  <tr key={spiller.id}>
                    <td>{spiller.nummer}</td>
                    <td>{spiller.navn}</td>
                    <td>{avg(stats.serve)}</td>
                    <td>{avg(stats.pass)}</td>
                    <td>{avg(stats.attack)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {statsTab === 1 && (
          <table className="statistikk-tabell">
            <thead>
              <tr>
                <th>#</th>
                <th>Navn</th>
                <th>Serve</th>
                <th>Mottak</th>
                <th>Angrep</th>
              </tr>
            </thead>
            <tbody>
              {spillere.length === 0 && (
                <tr>
                  <td colSpan={5} className="tom-tekst">
                    Ingen spillere
                  </td>
                </tr>
              )}
              {spillere.map((spiller, idx) => {
                const stats = statistikkPerSett[settNr]?.[spiller.id] || {};
                return (
                  <tr key={spiller.id}>
                    <td>{spiller.nummer}</td>
                    <td>{spiller.navn}</td>
                    <td>{(stats.serve || []).join(' ') || '-'}</td>
                    <td>{(stats.pass || []).join(' ') || '-'}</td>
                    <td>{(stats.attack || []).join(' ') || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <button onClick={onClose} className="lukk-btn">
          Lukk
        </button>
      </div>
    </div>
  );
}
