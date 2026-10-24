import { useState, useEffect } from 'react';

export function useCountdown(inicial = 45) {
  const [segundos, setSegundos] = useState(inicial);
 
  useEffect(() => {
    if (segundos <= 0) return;
    const id = setTimeout(() => setSegundos(segundos - 1), 1000);
    return () => clearTimeout(id);
  }, [segundos]);
 
  const reiniciar = () => setSegundos(inicial);
 
  return { segundos, reiniciar };
}
 