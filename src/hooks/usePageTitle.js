import { useEffect } from 'react';
 
export function usePageTitle(titulo) {
  useEffect(() => {
    document.title = titulo + ' · Cafeterías del campus';
  }, [titulo]);
}
 