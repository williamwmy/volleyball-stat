import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import './App.css';

const kategoriLabels = ['Serve', 'Pass', 'Attack'];
const dragScoreMap = { up: 3, right: 2, down: 1, left: 0 };
const dragDirections = [
  { key: 'up', dx: 0, dy: -90, label: 3 },
  { key: 'right', dx: 90, dy: 0, label: 2 },
  { key: 'down', dx: 0, dy: 90, label: 1 },
  { key: 'left', dx: -90, dy: 0, label: 0 },
];

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

function DragOverlay({ visible, start, parentRect, kategori, dragPos }) {
  if (!visible || !start) return null;
  const svgSize = 240;
  const center = svgSize / 2;

  // Finn retning under drag hvis dragPos finnes
  let highlight = null;
  if (dragPos && start) {
    highlight = getDirection(
      { x: start.x, y: start.y },
      { x: dragPos.x, y: dragPos.y }
    );
  }

  // Midt-label for handling
  let handlingNavn = '';
  if (kategori === 'serve') handlingNavn = 'Serve';
  else if (kategori === 'pass') handlingNavn = 'Pass';
  else if (kategori === 'attack') handlingNavn = 'Attack';

  return (
    <div
      className="drag-overlay"
      style={{
        top: (parentRect?.top ?? 0) - (svgSize / 2 - (parentRect?.height ?? 0) / 2),
        left: (parentRect?.left ?? 0) - (svgSize / 2 - (parentRect?.width ?? 0) / 2),
        width: svgSize,
        height: svgSize,
      }}
    >
      <svg width={svgSize} height={svgSize} style={{ pointerEvents: 'none' }}>
        {/* Animasjon (fade/scale) */}
        <g className="drag-anim">
          {/* Sirkler/streker */}
          {dragDirections.map((dir) => (
            <g key={dir.key}>
              {/* Linje */}
              <line
                x1={center}
                y1={center}
                x2={center + dir.dx}
                y2={center + dir.dy}
                stroke={highlight === dir.key ? "#ff9500" : "#246c8e"}
                strokeWidth={highlight === dir.key ? 9 : 6}
                strokeLinecap="round"
                opacity={highlight === dir.key ? 1 : 0.8}
                style={{ transition: 'all 0.18s' }}
              />
              {/* Sirkel */}
              <circle
                cx={center + dir.dx}
                cy={center + dir.dy}
                r="28"
                fill={highlight === dir.key ? "#ffeb99" : "#ffe066"}
                stroke={highlight === dir.key ? "#ff9500" : "#246c8e"}
                strokeWidth={highlight === dir.key ? 6 : 4}
                opacity="1"
                style={{ transition: 'all 0.18s' }}
              />
              {/* Tall */}
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
          {/* Handling-label i midten */}
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            fontSize="1.35rem"
            fontWeight="bold"
            fill="#194e62"
            opacity="0.82"
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

function SimpleYFormasjon({ onScore }) {
  // Drag state
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

  React.useEffect(() => {
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
        style={{ touchAction: 'none' }}
      >
        Serve
      </button>
      <div className="simple-y-bottom">
        <button
          className="simple-y-btn left"
          ref={btnRefs.pass}
          onMouseDown={e => handleStart(e, 'pass')}
          onTouchStart={e => handleStart(e, 'pass')}
          style={{ touchAction: 'none' }}
        >
          Pass
        </button>
        <button
          className="simple-y-btn right"
          ref={btnRefs.attack}
          onMouseDown={e => handleStart(e, 'attack')}
          onTouchStart={e => handleStart(e, 'attack')}
          style={{ touchAction: 'none' }}
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
      />
    </div>
  );
}

function SpillerRute({ spiller, onScore }) {
  // For feedback: score pop
  const [feedback, setFeedback] = useState(null);

  async function handleScore(kategori, score) {
    await onScore(spiller, kategori, score);
    setFeedback(score);
    setTimeout(() => setFeedback(null), 600);
  }

  return (
    <div className="spiller-rute">
      <div className="spiller-navn">
        {spiller.nummer} {spiller.navn}
      </div>
      <SimpleYFormasjon onScore={handleScore} />
      {/* Score-feedback skal ligge ETTER SimpleYFormasjon, ikke INNI */}
      {feedback !== null && (
        <div className="score-feedback">
          +{feedback}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [spillere, setSpillere] = useState([]);
  const [statistikk, setStatistikk] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    db.spillere.toArray().then(setSpillere);
    hentStatistikk();
    // eslint-disable-next-line
  }, []);

  async function hentStatistikk() {
    const stats = await db.statistikk.toArray();
    // Oppsummer per spiller og kategori
    const oppsummert = {};
    stats.forEach(({ spillerId, type, score }) => {
      if (!oppsummert[spillerId]) oppsummert[spillerId] = {};
      if (!oppsummert[spillerId][type]) oppsummert[spillerId][type] = [];
      oppsummert[spillerId][type].push(score);
    });
    setStatistikk(oppsummert);
  }

  async function leggTilSpiller() {
    const navn = prompt('Navn på spiller?');
    const nummer = prompt('Draktnummer?');
    if (navn && nummer) {
      await db.spillere.add({ navn, nummer });
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

  // 2x4 grid, siste rute er innstillinger
  const ruter = [...spillere.slice(0, 7)];
  while (ruter.length < 7) ruter.push(null);

  return (
    <div className="app-main">
      <div className="grid-container">
        {ruter.map((spiller, idx) =>
          spiller ? (
            <SpillerRute
              key={`spiller-${spiller.id}-${idx}`}
              spiller={spiller}
              onScore={onScore}
            />
          ) : (
            <div className="spiller-rute tom" key={`tom-${idx}`}></div>
          )
        )}
        {/* Siste rute: Innstillinger */}
        <div className="spiller-rute settings" onClick={() => setShowSettings(true)}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>⚙️</div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>Innstillinger</div>
        </div>
      </div>

      {showSettings && (
        <div className="modal-bg" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Innstillinger</h2>
            <button onClick={leggTilSpiller}>Legg til spiller</button>
            <button onClick={slettAlleSpillere}>Slett alle spillere/statistikk</button>
            <button onClick={() => setShowSettings(false)}>Lukk</button>
          </div>
        </div>
      )}

      <h2>Statistikk</h2>
      <div>
        {spillere.map(spiller => (
          <div key={`stats-${spiller.id}`}>
            <b>{spiller.nummer} {spiller.navn}</b>:
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
