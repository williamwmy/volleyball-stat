import React from "react";
import "../App.css";

export default function SettingsModal({
  open,
  onClose,
  handleSwapMode,
  swapMode,
  leggTilSpillerFraModal,
  setShowAdminModal,
  setShowStatsTable,
  resetAlleStatistikk,
  slettAlleSpillere
}) {
  if (!open) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Innstillinger</h2>
        <h3>Bytter & Posisjoner</h3>
        <button onClick={handleSwapMode} style={{marginBottom: 8}}>
          {swapMode ? "Avslutt bytt posisjon" : "Bytt posisjon på spillere"}
        </button>
        <h3>Spilleradministrasjon</h3>
        <button onClick={leggTilSpillerFraModal}>Legg til spiller</button>
        <button onClick={() => {
            onClose();
            setTimeout(() => setShowAdminModal(true), 0);
            }}>
            Administrer spillere
            </button>

        <h3>Statistikk</h3>
        <button onClick={() => {
            onClose();
            setTimeout(() => setShowStatsTable(true), 0);
            }}>
            Vis statistikk
        </button>
        <button onClick={resetAlleStatistikk}>Nullstill statistikk (behold spillere)</button>
        <h3>Andre handlinger</h3>
        <button onClick={slettAlleSpillere} >Slett alle spillere og statistikk</button>
        <button onClick={onClose} style={{marginTop:'18px'}}>Lukk</button>
      </div>
    </div>
  );
}
