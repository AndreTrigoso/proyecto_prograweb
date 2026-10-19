export const cx = (...partes) => partes.filter(Boolean).join(' ');

export const mmss = (segundos) =>
  `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
