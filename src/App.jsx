import React, { useState, useEffect } from 'react';
import { db } from './db';
import './App.css';
import SpillerRute from './components/SpillerRute';
import SpillerAdminModal from "./components/SpillerAdminModal";
import StatistikkModal from './components/StatistikkModal';
import SettingsModal from './components/SettingsModal';
import { finnFørsteLedigePosisjon, kategoriLabels, spillerFarger, hentStatistikk, avg } from './utils';

export default function App() {
  // STATE
  const [spillere, setSpillere] = useState([]);
  const [statistikkPerSett, setStatistikkPerSett] = useState([{}]);
  const [settNr, settSettNr] = useState(0); // 0-basert index
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsTable, setShowStatsTable] = useState(false);
  const [statsTab, setStatsTab] = useState(0);
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirstIdx, setSwapFirstIdx] = useState(null);
  const [ønsketInn, setØnsketInn] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // HENT SPILLERE & STATISTIKK FOR NÅVÆRENDE SETT
  useEffect(() => {
    db.spillere.toArray().then(setSpillere);
    loadStatistikk();
    // eslint-disable-next-line
  }, []);

  async function loadStatistikk() {
    // Finn høyeste settNr brukt, slik at reload fungerer også etter reload med flere sett
    let maxSettNr = 0;
    const alleStats = await db.statistikk.toArray();
    if (alleStats.length > 0) {
      maxSettNr = Math.max(...alleStats.map(row => row.settNr ?? 0));
    }
    const perSett = [];
    for (let i = 0; i <= maxSettNr; i++) {
      // For hvert sett: stats fra statistikk-tabellen hvor settNr = i
      const stats = await hentStatistikk(db, i);
      perSett[i] = stats;
    }
    // Hvis det ikke finnes noen sett, start med ett
    setStatistikkPerSett(perSett.length === 0 ? [{}] : perSett);
    settSettNr(0);
  }

  // ---- LEGG TIL/REDIGER/SLETT SPILLER ----
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
    setStatistikkPerSett([{}]);
    settSettNr(0);
  }
  async function resetAlleStatistikk() {
    await db.statistikk.clear();
    setStatistikkPerSett([{}]);
    settSettNr(0);
  }
  async function redigerSpiller(spiller) {
    const navn = prompt('Nytt navn:', spiller.navn);
    const nummer = prompt('Nytt draktnummer:', spiller.nummer);
    if (!navn || !nummer) return;
    await db.spillere.update(spiller.id, { navn, nummer });
    setSpillere(await db.spillere.toArray());
  }
  async function slettSpiller(spiller) {
    if (!window.confirm(`Slett ${spiller.navn}?`)) return;
    await db.spillere.delete(spiller.id);
    setSpillere(await db.spillere.toArray());
  }

  // ---- SCORING OG STATISTIKK ----
  async function onScore(spiller, kategori, score) {
    await db.statistikk.add({
      spillerId: spiller.id,
      type: kategori,
      score,
      tidspunkt: new Date(),
      settNr // legger til hvilket sett denne scoringen er fra
    });
    await loadStatistikk();
  }

  // ---- SWAP/INNBYTTER LOGIKK ----
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

  // ---- SETT-NAVIGASJON ----
  function fullforSett() {
    if (statistikkPerSett.length < 5) {
      setStatistikkPerSett([...statistikkPerSett, {}]);
      settSettNr(statistikkPerSett.length); // gå til neste
    }
  }

  // ---- RENDER ----
  return (
    <div className="app-main">

      {showAdminModal && (
        <SpillerAdminModal
          spillere={spillere}
          onClose={() => setShowAdminModal(false)}
          onRediger={redigerSpiller}
          onSlett={slettSpiller}
        />
      )}


      {/* --- ØNSKET INN BYTTEVARSEL --- */}
      {ønsketInn && (
        <div className="onsket-inn-varsel">
          Klikk på spilleren du vil bytte ut for å sette inn <b>{ønsketInn.navn}</b>!
          <button className="onsket-inn-avbryt" onClick={() => setØnsketInn(null)}>Avbryt</button>
        </div>
      )}

      {/* --- BANEN / GRID --- */}
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

      {/* --- BENKEN --- */}
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
                title="Bytt inn spiller"
                style={{
                  fontSize: "1.35em",
                  padding: "0.15em 0.55em",
                  borderRadius: "50%",
                  marginLeft: "8px",
                  fontWeight: 700
                }}
              >
                ⇄
              </button>
            </div>
          ))}
      </div>

      {/* --- SETT-NAVIGASJON UNDER BENKEN --- */}
      <div className="sett-navigasjon">
        <button
          className="sett-arrow"
          onClick={() => settSettNr(n => Math.max(0, n - 1))}
          disabled={settNr === 0}
          title="Forrige sett"
        >←</button>
        <span style={{ fontWeight: 500, margin: "0 0.6em" }}>
          <b>Sett:</b> Sett {settNr + 1} av {statistikkPerSett.length}
        </span>
        <button
          className="sett-arrow"
          onClick={() => settSettNr(n => Math.min(statistikkPerSett.length - 1, n + 1))}
          disabled={settNr === statistikkPerSett.length - 1}
          title="Neste sett"
        >→</button>
        <button
          className="sett-ferdig-mini"
          onClick={fullforSett}
          disabled={statistikkPerSett.length >= 5}
          title="Fullfør sett"
          style={{ marginLeft: 10 }}
        >✔️ Sett ferdig</button>
      </div>

      {/* --- INNSTILLINGS-MODAL --- */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        handleSwapMode={handleSwapMode}
        swapMode={swapMode}
        leggTilSpillerFraModal={leggTilSpillerFraModal}
        setShowAdminModal={setShowAdminModal}
        setShowStatsTable={setShowStatsTable}
        resetAlleStatistikk={resetAlleStatistikk}
        slettAlleSpillere={slettAlleSpillere}
      />

      {/* --- STATISTIKK-TABELL-MODAL --- */}
      <StatistikkModal
        open={showStatsTable}
        onClose={() => setShowStatsTable(false)}
        statsTab={statsTab}
        setStatsTab={setStatsTab}
        settNr={settNr}
        statistikkPerSett={statistikkPerSett}
        spillere={spillere}
      />

      {/* Statistikk-kompakt nederst */}
      <h2>Statistikk – Sett {settNr + 1}</h2>
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
                {statistikkPerSett[settNr]?.[spiller.id]?.[kat.toLowerCase()]?.join(', ') || '-'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
