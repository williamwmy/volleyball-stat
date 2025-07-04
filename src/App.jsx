import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import './App.css';

// --- KONFIG --
const kategoriLabels = ['Serve', 'Pass', 'Attack'];
const dragScoreMap = { up: 3, right: 2, down: 1, left: 0 };
const dragDirections = [
  { key: 'up', dx: 0, dy: -62, label: 3 },
  { key: 'right', dx: 62, dy: 0, label: 2 },
  { key: 'down', dx: 0, dy: 62, label: 1 },
  { key: 'left', dx: -62, dy: 0, label: 0 },
];
const spillerFarger = [
  { navn: '#ff9500', knapp: '#fffbe5' },
  { navn: '#5fd6ff', knapp: '#e6fbff' },
  { navn: '#cabfff', knapp: '#f7f1ff' },
  { navn: '#a5ffe3', knapp: '#edfff8' },
  { navn: '#ffe066', knapp: '#fffbe5' },
  { navn: '#d0ffc5', knapp: '#f5fff2' },
  { navn: '#ffecb3', knapp: '#fff8e1' },
];

// --- Finn første ledige posisjon (0–6) ---
function finnFørsteLedigePosisjon(aktive) {
  for (let i = 0; i < 7; i++) {
    if (!aktive.some(s => s.posisjon === i)) return i;
  }
  return null;
}

function getDirection(start, end) {
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) return 'right';
    if (dx < -30) return 'left';
  } else {
    if (dy > 30) return 'down';
    if (dy < -30) return 'up';
  }
  return null;
}

function DragOverlay({ visible, start, parentRect, kategori, dragPos, knappFarge, navnFarge }) {
  if (!visible || !start) return null;
  const svgSize = 240;
  const center = svgSize / 2;

  const top = (parentRect?.top ?? 0) + (parentRect?.height ?? 0) / 2 - center;
  const left = (parentRect?.left ?? 0) + (parentRect?.width ?? 0) / 2 - center;

  let highlight = null;
  if (dragPos && start) {
    highlight = getDirection(
      { x: start.x, y: start.y },
      { x: dragPos.x, y: dragPos.y }
    );
  }

  let handlingNavn = '';
  if (kategori === 'serve') handlingNavn = 'Serve';
  else if (kategori === 'pass') handlingNavn = 'Pass';
  else if (kategori === 'attack') handlingNavn = 'Attack';

  return (
    <div
      className="drag-overlay"
      style={{
        top,
        left,
        width: svgSize,
        height: svgSize,
      }}
    >
      <svg width={svgSize} height={svgSize} style={{ pointerEvents: 'none' }}>
        <g className="drag-anim">
          {dragDirections.map((dir) => (
            <g key={dir.key}>
              <line
                x1={center}
                y1={center}
                x2={center + dir.dx}
                y2={center + dir.dy}
                stroke={highlight === dir.key ? navnFarge : "#246c8e"}
                strokeWidth={highlight === dir.key ? 9 : 6}
                strokeLinecap="round"
                opacity={highlight === dir.key ? 1 : 0.8}
                style={{ transition: 'all 0.18s' }}
              />
              <circle
                cx={center + dir.dx}
                cy={center + dir.dy}
                r="24"
                fill={highlight === dir.key ? knappFarge : "#ffe066"}
                stroke={highlight === dir.key ? navnFarge : "#246c8e"}
                strokeWidth={highlight === dir.key ? 6 : 4}
                opacity="1"
                style={{ transition: 'all 0.18s' }}
              />
              <text
                x={center + dir.dx}
                y={center + dir.dy + 8}
                textAnchor="middle"
                fontSize="2rem"
                fontWeight="bold"
                fill="#246c8e"
              >
                {dir.label}
              </text>
            </g>
          ))}
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            fontSize="1.35rem"
            fontWeight="bold"
            fill={navnFarge}
            opacity="0.88"
            style={{
              letterSpacing: "0.08em",
              textShadow: "0 2px 6px #fff7"
            }}
          >
            {handlingNavn}
          </text>
        </g>
      </svg>
    </div>
  );
}

function SimpleYFormasjon({ onScore, knappFarge, navnFarge }) {
  const [dragState, setDragState] = useState(null);
  const btnRefs = {
    serve: useRef(null),
    pass: useRef(null),
    attack: useRef(null),
  };

  function handleStart(e, kategori) {
    const evt = e.touches ? e.touches[0] : e;
    const rect = btnRefs[kategori].current.getBoundingClientRect();
    setDragState({
      kategori,
      start: { x: evt.clientX, y: evt.clientY },
      parentRect: rect,
      dragPos: null
    });
  }

  function handleMove(e) {
    if (!dragState) return;
    const evt = e.touches ? e.touches[0] : e;
    setDragState(ds => ds && { ...ds, dragPos: { x: evt.clientX, y: evt.clientY } });
  }

  function handleEnd(e) {
    if (!dragState) return;
    const evt = e.changedTouches ? e.changedTouches[0] : e;
    const dir = getDirection(dragState.start, { x: evt.clientX, y: evt.clientY });
    if (dir && dragScoreMap.hasOwnProperty(dir) && dragState.kategori) {
      onScore(dragState.kategori, dragScoreMap[dir]);
    }
    setDragState(null);
  }

  function handleCancel() {
    setDragState(null);
  }

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleCancel);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('touchcancel', handleCancel);
      };
    }
  });

  return (
    <div className="simple-y">
      <button
        className="simple-y-btn top"
        ref={btnRefs.serve}
        onMouseDown={e => handleStart(e, 'serve')}
        onTouchStart={e => handleStart(e, 'serve')}
        style={{
          touchAction: 'none',
          background: knappFarge,
          color: '#194e62',
          borderColor: '#ffe066',
        }}
      >
        Serve
      </button>
      <div className="simple-y-bottom">
        <button
          className="simple-y-btn left"
          ref={btnRefs.pass}
          onMouseDown={e => handleStart(e, 'pass')}
          onTouchStart={e => handleStart(e, 'pass')}
          style={{
            touchAction: 'none',
            background: knappFarge,
            color: '#194e62',
            borderColor: '#ffe066',
          }}
        >
          Pass
        </button>
        <button
          className="simple-y-btn right"
          ref={btnRefs.attack}
          onMouseDown={e => handleStart(e, 'attack')}
          onTouchStart={e => handleStart(e, 'attack')}
          style={{
            touchAction: 'none',
            background: knappFarge,
            color: '#194e62',
            borderColor: '#ffe066',
          }}
        >
          Attack
        </button>
      </div>
      <DragOverlay
        visible={!!dragState}
        start={dragState?.start}
        parentRect={dragState?.parentRect}
        kategori={dragState?.kategori}
        dragPos={dragState?.dragPos}
        knappFarge={knappFarge}
        navnFarge={navnFarge}
      />
    </div>
  );
}

function SpillerRute({ spiller, onScore, idx, swapMode, onSwap, selectedForSwap }) {
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
        border: swapMode ? '2.2px dashed #ffe066' : undefined,
        boxShadow: selectedForSwap ? '0 0 0 5px #ff950033' : undefined,
        cursor: swapMode ? 'pointer' : undefined,
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
        <span style={{
          position: "absolute", top: 12, right: 12, fontSize: "1.2rem",
          color: selectedForSwap ? "#ff9500" : "#ffe066", fontWeight: 700,
        }}>{selectedForSwap ? "✓" : "⇄"}</span>
      )}
    </div>
  );
}

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

  // --- SPILLER AKTIVITET ---

  // Legg til spiller fra modal (automatisk ledig posisjon)
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

  // Legg til spiller på valgt posisjon (fra pluss-knapp)
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

  // Swap handling
  function handleSwapMode() {
    setSwapMode(!swapMode);
    setSwapFirstIdx(null);
  }
  async function handleSwapClick(idx) {
    if (!swapMode || !ruter[idx]) return;
    if (swapFirstIdx === null) {
      setSwapFirstIdx(idx);
    } else if (swapFirstIdx !== idx) {
      // Bytt posisjon
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

  // Bytt inn spiller fra benk
  async function byttInnSpiller(benkespiller) {
    const aktive = spillere.filter(s => s.active);
    const ledigPos = finnFørsteLedigePosisjon(aktive);
    if (ledigPos !== null) {
      // Ledig plass: bare sett aktiv og gi posisjon
      await db.spillere.update(benkespiller.id, { active: true, posisjon: ledigPos });
      setSpillere(await db.spillere.toArray());
    } else {
      // Ikke ledig: be bruker velge hvem som skal ut
      setØnsketInn(benkespiller);
    }
  }

  // Bytt ut en aktiv spiller med benkespiller
  async function byttUtOgInn(utSpiller, innSpiller) {
    // Finn posisjon for utSpiller, og første ledige benk-posisjon for ut-spiller
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
          <button onClick={() => setØnsketInn(null)}>Avbryt</button>
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
              style={{
                cursor: swapMode || ønsketInn ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
              title="Legg til spiller"
            >
              <span className="pluss-ikon" aria-label="Pluss ikon">+</span>
            </div>
          )
        )}
        {/* Siste rute: Innstillinger */}
        <div className="spiller-rute settings" onClick={() => setShowSettings(true)}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>⚙️</div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>Innstillinger</div>
        </div>
      </div>

      {/* BENKEN */}
      <div className="benk-container">
        {spillere.filter(s => !s.active).length === 0 && (
          <div style={{ color: "#bbb" }}>Ingen på benken</div>
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
            <button onClick={slettAlleSpillere}>Slett alle spillere/statistikk</button>
            <button onClick={() => setShowStatsTable(true)}>Vis statistikk</button>
            <button onClick={handleSwapMode} style={{ background: swapMode ? "#f5f6fa" : undefined, fontWeight: swapMode ? 700 : undefined }}>
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <button
                onClick={() => setStatsTab(0)}
                style={{
                  fontWeight: statsTab === 0 ? "bold" : undefined,
                  textDecoration: statsTab === 0 ? "underline" : undefined,
                  marginRight: 7,
                }}
              >
                Snitt
              </button>
              <button
                onClick={() => setStatsTab(1)}
                style={{
                  fontWeight: statsTab === 1 ? "bold" : undefined,
                  textDecoration: statsTab === 1 ? "underline" : undefined,
                  marginLeft: 7,
                }}
              >
                Alle forsøk
              </button>
            </div>
            {statsTab === 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.4rem', fontSize: "1.06rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>#</th>
                    <th>Navn</th>
                    <th>Serve</th>
                    <th>Mottak</th>
                    <th>Angrep</th>
                  </tr>
                </thead>
                <tbody>
                  {spillere.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#bbb" }}>
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
                      <tr key={spiller.id} style={{ background: idx % 2 ? "#f5f6fa" : "white" }}>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: "1rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>#</th>
                    <th>Navn</th>
                    <th>Serve</th>
                    <th>Mottak</th>
                    <th>Angrep</th>
                  </tr>
                </thead>
                <tbody>
                  {spillere.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#bbb" }}>
                        Ingen spillere
                      </td>
                    </tr>
                  )}
                  {spillere.map((spiller, idx) => {
                    const stats = statistikk[spiller.id] || {};
                    return (
                      <tr key={spiller.id} style={{ background: idx % 2 ? "#fafafb" : "white" }}>
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
            <button onClick={() => setShowStatsTable(false)} style={{ marginTop: 10 }}>
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
            <b style={{ color: spillerFarger[idx % spillerFarger.length].navn }}>
              {spiller.nummer} {spiller.navn}
            </b>
            :
            {kategoriLabels.map(kat => (
              <span key={`kat-${spiller.id}-${kat}`} style={{ marginLeft: 12 }}>
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
