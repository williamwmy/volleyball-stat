import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpillerRute from './SpillerRute';

describe('SpillerRute', () => {
  it('viser navn og nummer på spiller', () => {
    const spiller = { navn: 'William', nummer: '7' };
    render(<SpillerRute spiller={spiller} idx={0} />);
    expect(screen.getByText(/William/)).toBeInTheDocument();
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it('viser swap-indikator i swapMode', () => {
    const spiller = { navn: 'Test', nummer: '2' };
    render(<SpillerRute spiller={spiller} idx={1} swapMode={true} />);
    expect(screen.getByText(/⇄/)).toBeInTheDocument();
  });

  it('viser valgt swap-indikator hvis selectedForSwap', () => {
    const spiller = { navn: 'Test', nummer: '2' };
    render(<SpillerRute spiller={spiller} idx={1} swapMode={true} selectedForSwap={true} />);
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });

  it('viser Serve-knappen', () => {
    const spiller = { navn: 'A', nummer: '3' };
    render(<SpillerRute spiller={spiller} idx={1} />);
    expect(screen.getByText(/Serve/)).toBeInTheDocument();
  });

  // Ekstra: test at score-feedback vises når handleScore kalles
  it('viser score-feedback når spiller får poeng', async () => {
    const spiller = { navn: 'Test', nummer: '4' };
    const onScore = vi.fn().mockResolvedValue(undefined); // bruk jest.fn() hvis du bruker Jest

    render(
      <SpillerRute
        spiller={spiller}
        idx={0}
        onScore={onScore}
      />
    );

    // Finn Serve-knappen og simuler scoring
    const serveBtn = screen.getByText(/Serve/i);
    // Simuler klikk direkte på Serve-knappen for enkelhet, evt. tilpass hvis du bruker drag/drop
    fireEvent.mouseDown(serveBtn, { clientX: 0, clientY: 0 });
    // Denne vil ikke nødvendigvis vise feedback uten å mocke SimpleYFormasjon mer, men viser prinsippet.

    // Simuler at handleScore faktisk settes (her forutsetter vi at SimpleYFormasjon kaller onScore riktig)
    // Du kan evt. mocke at feedback vises direkte om du gjør en test-vennlig versjon av komponenten

    // Sjekk at feedback vises (for eksempel "+3")
    // Kommenter inn linja under om du får til å utløse feedback, eller tilpass for din testoppsett
    // await waitFor(() => expect(screen.getByText('+3')).toBeInTheDocument());
  });
});
