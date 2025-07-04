import Dexie from 'dexie';

export const db = new Dexie('volleyballStatistikkDB');
db.version(1).stores({
  spillere: '++id, navn, nummer',
  statistikk: '++id, spillerId, type, score, tidspunkt'
});
