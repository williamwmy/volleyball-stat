// components/SpillerRute.jsx
import React, { useState } from "react";
import SimpleYFormasjon from "./SimpleYFormasjon";

// Hent fra App.jsx hvis du har det der
const spillerFarger = [
  { navn: '#ff9500', knapp: '#fffbe5' },
  { navn: '#5fd6ff', knapp: '#e6fbff' },
  { navn: '#cabfff', knapp: '#f7f1ff' },
  { navn: '#a5ffe3', knapp: '#edfff8' },
  { navn: '#ffe066', knapp: '#fffbe5' },
  { navn: '#d0ffc5', knapp: '#f5fff2' },
  { navn: '#ffecb3', knapp: '#fff8e1' },
];

export default function SpillerRute({ spiller, onScore, idx, swapMode, onSwap, selectedForSwap }) {
  const farge = spillerFarger[idx % spillerFarger.length];
  const [feedback, setFeedback] = useState(null);

  async function handleScore(kategori, score) {
    await onScore(spiller, kategori, score);
    setFeedback(score);
    setTimeout(() => setFeedback(null), 600);
  }

  return (
    <div
      className={`spiller-rute${swapMode ? ' swap-mode' : ''}${selectedForSwap ? ' swap-selected' : ''}`}
      style={{
        '--spiller-navn-farge': farge.navn,
        '--spiller-knapp-farge': farge.knapp,
      }}
      onClick={swapMode ? onSwap : undefined}
      title={swapMode ? 'Klikk for å velge spiller å bytte plass med' : undefined}
    >
      <div className="spiller-navn-rotated">
        <span>{spiller.nummer} {spiller.navn}</span>
      </div>
      <SimpleYFormasjon
        onScore={handleScore}
        knappFarge={farge.knapp}
        navnFarge={farge.navn}
      />
      {feedback !== null && (
        <div className="score-feedback">
          +{feedback}
        </div>
      )}
      {swapMode && (
        <span className={`swap-indikator${selectedForSwap ? ' valgt' : ''}`}>
          {selectedForSwap ? "✓" : "⇄"}
        </span>
      )}
    </div>
  );
}
