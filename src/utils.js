// src/utils.js

// --- KONSTANTER ---
export const kategoriLabels = ['Serve', 'Pass', 'Attack'];

export const spillerFarger = [
  { navn: '#ff9500', knapp: '#fffbe5' },
  { navn: '#5fd6ff', knapp: '#e6fbff' },
  { navn: '#cabfff', knapp: '#f7f1ff' },
  { navn: '#a5ffe3', knapp: '#edfff8' },
  { navn: '#ffe066', knapp: '#fffbe5' },
  { navn: '#d0ffc5', knapp: '#f5fff2' },
  { navn: '#ffecb3', knapp: '#fff8e1' },
];

// --- FUNKSJONER ---

// Finn første ledige posisjon (0–6) blant aktive spillere
export function finnFørsteLedigePosisjon(aktive) {
  for (let i = 0; i < 7; i++) {
    if (!aktive.some(s => s.posisjon === i)) return i;
  }
  return null;
}

// Hent og summer statistikk (brukes i App.jsx)
export async function hentStatistikk(db) {
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
  return oppsummert;
}

// Kalkuler snitt av en array (med 2 desimaler), eller '-'
export function avg(arr) {
  return arr && arr.length
    ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
    : '-';
}

export function getDirection(start, end) {
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