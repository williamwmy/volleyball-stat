// src/utils.js
export function finnFørsteLedigePosisjon(aktive) {
    for (let i = 0; i < 7; i++) {
      if (!aktive.some(s => s.posisjon === i)) return i;
    }
    return null;
  }
  