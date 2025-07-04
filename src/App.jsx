import React, { useState, useEffect } from 'react';
import { db } from './db';
import './App.css';
import SpillerRute from './components/SpillerRute';
import { finnFørsteLedigePosisjon, kategoriLabels, spillerFarger, hentStatistikk, avg } from './utils';

export default function App() {
  // --- STATE ---
  const [spillere, setSpillere] = useState([]);
  const [statistikk, setStatistikk] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsTable, setShowStatsTable] = useState(false);
  const [statsTab, setStatsTab] = useState(0);
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirstIdx, setSwapFirstIdx] = useState(null);
  const [ønsketInn, setØnsketInn] = useState(null);
  const [gjeldendeSett, setGjeldendeSett] = useState(1);
  const [valgtSett, setValgtSett] = useState('alle');
  const [showSpillerAdmin, setShowSpillerAdmin] = useState(false);

  // --- INIT ---
  useEffect(() => {
    db.spillere.toArray().then(setSpillere);
    hentOgSettStatistikk();
    // eslint-disable-next-line
  }, []);

  async function hentOgSettStatistikk() {
    const stats = await hentStatistikk(db);
    setStatistikk(stats);
  }

  // --- SPILLERLOGIKK ---

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
    setGjeldendeSett(1);
  }

  async function resetKunStatistikk() {
    await db.statistikk.clear();
    setStatistikk({});
    setGjeldendeSett(1);
  }

  async function onScore(spiller, kategori, score) {
    await db.statistikk.add({
      spillerId: spiller.id,
      type: kategori,
      score,
      tidspunkt: new Date(),
      settNummer: gjeldendeSett
    });
    hentOgSettStatistikk();
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

  // --- Setthåndtering ---
  function settFerdigOgStartNeste() {
    setGjeldendeSett(s => s + 1);
  }

  // --- SpillerAdmin: Redigere/Slette spillere ---
  async function oppdaterSpiller(id, felt, verdi) {
    await db.spillere.update(id, { [felt]: verdi });
    setSpillere(await db.spillere.toArray());
  }
  async function slettSpiller(id) {
    await db.spillere.delete(id);
    setSpillere(await db.spillere.toArray());
  }

  // --- Filtrering på sett ---
  const alleStatistikkRader = statistikk.__logg || [];
  const settnumre = Array.from(new Set(alleStatistikkRader.map(r => r.settNummer))).filter(Boolean).sort((a,b)=>a-b);
  const aktivtSett = valgtSett === "alle" ? null : Number(valgtSett);

  // Hjelpefunksjon for å hente stats for valgt sett eller alle
  function statsFor(spillerId, kategori) {
    const arr = alleStatistikkRader
      .filter(row => row.spillerId === spillerId && (aktivtSett ? row.settNummer === aktivtSett : true) && row.type === kategori)
      .map(row => row.score);
    return arr;
  }

  // --- RENDER ---
  return (
    <div className="app-main">
      {/* Ønsker å bytte inn spiller */}
      {ønsketInn && (
        <div className="onsket-inn-varsel">
          Klikk på spilleren du vil bytte ut for å sette inn <b>{ønsketInn.navn}</b>!
          <button className="onsket-inn-avbryt" onClick={() => setØnsketInn(null)}>Avbryt</button>
        </div>
      )}

      {/* "Sett ferdig"-knapp */}
      <div style={{ marginBottom: 10, marginTop: 2 }}>
        <button onClick={settFerdigOgStartNeste}>
          Sett ferdig (Gå til sett {gjeldendeSett + 1})
        </button>
        <span style={{ marginLeft: 18, color: "#888", fontWeight: 500 }}>
          Nåværende sett: {gjeldendeSett}
        </span>
      </div>

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

      {/* BENKEN */}
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
          <div className="modal" style={{ marginTop: "4vh", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <h2>Innstillinger</h2>
            <button onClick={leggTilSpillerFraModal}>Legg til spiller</button>
            <button onClick={resetKunStatistikk}>Nullstill kun statistikk</button>
            <button onClick={slettAlleSpillere}>Slett alle spillere/statistikk</button>
            <button onClick={() => setShowStatsTable(true)}>Vis statistikk</button>
            <button
              className={`swap-mode-btn${swapMode ? " aktiv" : ""}`}
              onClick={handleSwapMode}
            >
              {swapMode ? "Avslutt bytt posisjon" : "Bytt posisjon på spillere"}
            </button>
            <button onClick={() => setShowSpillerAdmin(true)}>
              Spilleradministrasjon
            </button>
            <button onClick={() => setShowSettings(false)}>Lukk</button>
          </div>
        </div>
      )}

      {/* --- MODAL: SPILLERADMIN --- */}
      {showSpillerAdmin && (
        <div className="modal-bg" onClick={() => setShowSpillerAdmin(false)}>
          <div className="modal" style={{ marginTop: "3vh", maxHeight: "89vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h2>Spilleradministrasjon</h2>
            <table className="spilleradmin-tabell">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Navn</th>
                  <th>Draktnummer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {spillere.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: "#bbb" }}>Ingen spillere</td>
                  </tr>
                )}
                {spillere.map(spiller => (
                  <tr key={spiller.id} style={{ height: 34 }}>
                    <td>
                      <input
                        style={{ width: 30, fontSize: 15 }}
                        value={spiller.nummer}
                        onChange={e => oppdaterSpiller(spiller.id, "nummer", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        style={{ width: 95, fontSize: 15 }}
                        value={spiller.navn}
                        onChange={e => oppdaterSpiller(spiller.id, "navn", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        style={{ fontSize: 15, padding: "0.25em 0.7em", background: "#f5d2d2", color: "#941d1d" }}
                        onClick={() => slettSpiller(spiller.id)}
                      >
                        Slett
                      </button>
                    </td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={{ marginTop: 12 }} onClick={() => setShowSpillerAdmin(false)}>Lukk</button>
          </div>
        </div>
      )}

      {/* --- MODAL: STATISTIKK --- */}
      {showStatsTable && (
        <div className="modal-bg" onClick={() => setShowStatsTable(false)}>
          <div className="modal" style={{ marginTop: "4vh", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h2>Statistikk</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <select value={valgtSett} onChange={e => setValgtSett(e.target.value)}>
                <option value="alle">Alle sett</option>
                {settnumre.map(nr => (
                  <option key={nr} value={nr}>Sett {nr}</option>
                ))}
              </select>
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
                  {spillere.map((spiller, idx) => (
                    <tr key={spiller.id}>
                      <td>{spiller.nummer}</td>
                      <td>{spiller.navn}</td>
                      <td>{avg(statsFor(spiller.id, 'serve'))}</td>
                      <td>{avg(statsFor(spiller.id, 'pass'))}</td>
                      <td>{avg(statsFor(spiller.id, 'attack'))}</td>
                    </tr>
                  ))}
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
                  {spillere.map((spiller, idx) => (
                    <tr key={spiller.id}>
                      <td>{spiller.nummer}</td>
                      <td>{spiller.navn}</td>
                      <td>{(statsFor(spiller.id, 'serve') || []).join(' ') || '-'}</td>
                      <td>{(statsFor(spiller.id, 'pass') || []).join(' ') || '-'}</td>
                      <td>{(statsFor(spiller.id, 'attack') || []).join(' ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setShowStatsTable(false)} className="lukk-btn" style={{ marginTop: 10 }}>
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
                {statsFor(spiller.id, kat.toLowerCase())?.join(', ') || '-'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
