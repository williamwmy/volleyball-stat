import Dexie from 'dexie';

export const db = new Dexie('volleyballstat');
db.version(3).stores({
    spillere: '++id, navn, nummer, active, posisjon',
    statistikk: '++id, spillerId, type, score, tidspunkt, settNummer'
  });
  