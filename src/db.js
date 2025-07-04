import Dexie from 'dexie';

export const db = new Dexie('volleyballstat');
db.version(2).stores({
  spillere: '++id, navn, nummer, active, posisjon', // aktive + posisjon må være indeksert
  statistikk: '++id, spillerId, type, score, tidspunkt'
});
