import { render, screen } from '@testing-library/react';
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

  // Du kan teste at SimpleYFormasjon vises ved å teste på en knapp:
  it('viser Serve-knappen', () => {
    const spiller = { navn: 'A', nummer: '3' };
    render(<SpillerRute spiller={spiller} idx={1} />);
    expect(screen.getByText(/Serve/)).toBeInTheDocument();
  });
});
