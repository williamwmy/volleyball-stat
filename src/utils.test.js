import { finnFørsteLedigePosisjon } from './utils';

test('finner ledig posisjon når alle er ledige', () => {
  expect(finnFørsteLedigePosisjon([])).toBe(0);
});

test('finner ledig posisjon i midten', () => {
  const aktive = [{ posisjon: 0 }, { posisjon: 2 }];
  expect(finnFørsteLedigePosisjon(aktive)).toBe(1);
});

test('returnerer null når ingen posisjon er ledig', () => {
  const aktive = Array.from({length: 7}, (_, i) => ({ posisjon: i }));
  expect(finnFørsteLedigePosisjon(aktive)).toBe(null);
});
