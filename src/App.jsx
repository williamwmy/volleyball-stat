import React, { useState, useEffect } from 'react';
import { db } from './db';
import './App.css';
import SpillerRute from './components/SpillerRute';
import { finnFørsteLedigePosisjon } from './utils';

const kategoriLabels = ['Serve', 'Pass', 'Attack'];
const spillerFarger = [
  { navn: '#ff9500', knapp: '#fffbe5' },
  { navn: '#5fd6ff', knapp: '#e6fbff' },
  { navn: '#cabfff', knapp: '#f7f1ff' },
  { navn: '#a5ffe3', knapp: '#edfff8' },
  { navn: '#ffe066', knapp: '#fffbe5' },
  { navn: '#d0ffc5', knapp: '#f5fff2' },
  { navn: '#ffecb3', knapp: '#fff8e1' },
];

export default function App() {
  const [spillere, setSpillere] = useState([]);
  const [statistikk, setStatistikk] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsTable, setShowStatsTable] = useState(false);
  const [statsTab, setStatsTab] = useState(0);
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirstIdx, setSwapFirstIdx] = useState(null);
  const [ønsketInn, setØnsketInn] = useState(null);

  useEffect(() => {
    db.spillere.toArray().then(setSpillere);
    hentStatistikk();
    // eslint-disable-next-line
  }, []);

  async function hentStatistikk() {
    const stats = await db.statistikk.toArray();
    const spillereList = await db.spillere.toArray();
    const spillereMap = Object.fromEntries(spillereList.map(s => [s.id, s]));
    const oppsummert = {};
    stats.forEach(({ spillerId, type, score }) => {
      if (!oppsummert[spillerId]) oppsummert[spillerId] = {};
      if (!oppsummert[spillerId][type]) oppsummert[spillerId][type] = [];
      oppsummert[spillerId][type].push(score);
    });
    oppsummert.__logg = stats.map(row => ({
      ...row,
      navn: spillereMap[row.spillerId]?.navn || "",
      nummer: spillereMap[row.spillerId]?.nummer || "",
    }));
    setStatistikk(oppsummert);
  }

  async function leggTilSpillerFraModal() {
    const navn = prompt('Navn på spiller?');
    const nummer = prompt('Draktnummer?');
    if (!navn || !nummer) return;
    const alleSpillere = await db.spillere.toArray();
    const aktive = alleSpillere.filter(s => s.active === true);
    let posisjon = finnFørsteLedigePosisjon(aktive);
    let active = posisjon !== null;
    if (!active) {
      const antallInactive = alleSpillere.filter(s => s.active === false).length;
      posisjon = aktive.length + antallInactive;
    }
    await db.spillere.add({ navn, nummer, posisjon, active });
    setSpillere(await db.spillere.toArray());
  }

  async function leggTilSpillerPåPosisjon(posisjon) {
    const navn = prompt('Navn på spiller?');
    const nummer = prompt('Draktnummer?');
    if (navn && nummer) {
      await db.spillere.add({ navn, nummer, posisjon, active: true });
      setSpillere(await db.spillere.toArray());
    }
  }

  async function slettAlleSpillere() {
    await db.spillere.clear();
    await db.statistikk.clear();
    setSpillere([]);
    setStatistikk({});
  }

  // NY: Slett bare statistikk
  async function slettStatistikk() {
    await db.statistikk.clear();
    setStatistikk({});
  }

  async function onScore(spiller, kategori, score) {
    await db.statistikk.add({
      spillerId: spiller.id,
      type: kategori,
      score,
      tidspunkt: new Date()
    });
    hentStatistikk();
  }

  // SWAP LOGIKK
  const aktiveSpillere = spillere
    .filter(s => s.active)
    .sort((a, b) => (a.posisjon ?? 0) - (b.posisjon ?? 0))
    .slice(0, 7);

  // Fyll ut til 7 ruter
  const ruter = [];
  for (let i = 0; i < 7; i++) {
    const spiller = aktiveSpillere.find(s => s.posisjon === i);
    ruter.push(spiller || null);
  }

  function handleSwapMode() {
    setSwapMode(!swapMode);
    setSwapFirstIdx(null);
  }
  async function handleSwapClick(idx) {
    if (!swapMode || !ruter[idx]) return;
    if (swapFirstIdx === null) {
      setSwapFirstIdx(idx);
    } else if (swapFirstIdx !== idx) {
      const spiller1 = ruter[swapFirstIdx];
      const spiller2 = ruter[idx];
      const pos1 = spiller1.posisjon ?? swapFirstIdx;
      const pos2 = spiller2.posisjon ?? idx;
      await db.spillere.update(spiller1.id, { posisjon: pos2 });
      await db.spillere.update(spiller2.id, { posisjon: pos1 });
      setSwapFirstIdx(null);
      setSwapMode(false);
      setTimeout(() => db.spillere.toArray().then(setSpillere), 300);
    }
  }

  async function byttInnSpiller(benkespiller) {
    const aktive = spillere.filter(s => s.active);
    const ledigPos = finnFørsteLedigePosisjon(aktive);
    if (ledigPos !== null) {
      await db.spillere.update(benkespiller.id, { active: true, posisjon: ledigPos });
      setSpillere(await db.spillere.toArray());
    } else {
      setØnsketInn(benkespiller);
    }
  }

  async function byttUtOgInn(utSpiller, innSpiller) {
    const benk = spillere.filter(s => !s.active && s.id !== innSpiller.id);
    const nyBenkPos = (benk.length > 0 ? Math.max(...benk.map(s => s.posisjon ?? 0)) + 1 : 0);
    await db.spillere.update(innSpiller.id, { active: true, posisjon: utSpiller.posisjon });
    await db.spillere.update(utSpiller.id, { active: false, posisjon: nyBenkPos });
    setSpillere(await db.spillere.toArray());
    setØnsketInn(null);
  }

  return (
    <div className="app-main">
      {ønsketInn && (
        <div className="onsket-inn-varsel">
          Klikk på spilleren du vil bytte ut for å sette inn <b>{ønsketInn.navn}</b>!
          <button className="onsket-inn-avbryt" onClick={() => setØnsketInn(null)}>Avbryt</button>
        </div>
      )}
      <div className="grid-container">
        {ruter.map((spiller, idx) =>
          spiller ? (
            <SpillerRute
              key={`spiller-${spiller.id}-${idx}`}
              spiller={spiller}
              onScore={onScore}
              idx={idx}
              swapMode={swapMode || ønsketInn !== null}
              onSwap={() => {
                if (swapMode) handleSwapClick(idx);
                else if (ønsketInn) byttUtOgInn(spiller, ønsketInn);
              }}
              selectedForSwap={swapMode && swapFirstIdx === idx}
            />
          ) : (
            <div
              className="spiller-rute tom"
              key={`tom-${idx}`}
              onClick={swapMode || ønsketInn ? undefined : () => leggTilSpillerPåPosisjon(idx)}
            >
              <span className="pluss-ikon" aria-label="Pluss ikon">+</span>
            </div>
          )
        )}
        <div className="spiller-rute settings" onClick={() => setShowSettings(true)}>
          <div className="innstillinger-ikon">⚙️</div>
          <div className="innstillinger-label">Innstillinger</div>
        </div>
      </div>

      <div className="benk-container">
        {spillere.filter(s => !s.active).length === 0 && (
          <div className="benk-tom">Ingen på benken</div>
        )}
        {spillere
          .filter(s => !s.active)
          .sort((a, b) => (a.posisjon ?? 0) - (b.posisjon ?? 0))
          .map((spiller, idx) => (
            <div className="benk-spiller-chip" key={spiller.id}>
              #{spiller.nummer} {spiller.navn}
              <button
                className="swap-btn"
                onClick={() => byttInnSpiller(spiller)}
                disabled={!!ønsketInn}
              >
                Bytt inn
              </button>
            </div>
          ))}
      </div>

      {/* --- MODAL: INNSTILLINGER --- */}
      {showSettings && (
        <div className="modal-bg" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Innstillinger</h2>
            <button onClick={leggTilSpillerFraModal}>Legg til spiller</button>
            <button onClick={slettStatistikk}>Nullstill all statistikk</button>
            <button onClick={slettAlleSpillere}>Slett alle spillere/statistikk</button>
            <button onClick={() => setShowStatsTable(true)}>Vis statistikk</button>
            <button
              className={`swap-mode-btn${swapMode ? " aktiv" : ""}`}
              onClick={handleSwapMode}
            >
              {swapMode ? "Avslutt bytt posisjon" : "Bytt posisjon på spillere"}
            </button>
            <button onClick={() => setShowSettings(false)}>Lukk</button>
          </div>
        </div>
      )}

      {/* --- MODAL: STATISTIKK --- */}
      {showStatsTable && (
        <div className="modal-bg" onClick={() => setShowStatsTable(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Statistikk</h2>
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
                    const stats = statistikk[spiller.id] || {};
                    function avg(arr) {
                      return arr && arr.length
                        ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
                        : '-';
                    }
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
                    const stats = statistikk[spiller.id] || {};
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
            <button onClick={() => setShowStatsTable(false)} className="lukk-btn">
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* Statistikk-kompakt nederst */}
      <h2>Statistikk</h2>
      <div>
        {spillere.map((spiller, idx) => (
          <div key={`stats-${spiller.id}`}>
            <b className={`statistikk-spillernavn farge${idx % spillerFarger.length}`}>
              {spiller.nummer} {spiller.navn}
            </b>
            :
            {kategoriLabels.map(kat => (
              <span key={`kat-${spiller.id}-${kat}`} className="statistikk-kategori">
                {kat}:
                {statistikk[spiller.id]?.[kat.toLowerCase()]?.join(', ') || '-'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
