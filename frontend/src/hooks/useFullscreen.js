// Hook UI per gestire l'ingresso e l'uscita dalla modalità fullscreen.
import { useEffect, useState } from 'react';

export const useFullscreen = () => {
  const getCurrentState = () =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;

  const [isFullscreen, setIsFullscreen] = useState(getCurrentState);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(getCurrentState());
    };

    // Restiamo allineati anche se l'utente esce dal fullscreen con ESC.
    document.addEventListener('fullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') {
      return;
    }

    // Se siamo già in fullscreen usciamo, altrimenti estendiamo tutta la pagina.
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  };

  return {
    isFullscreen,
    toggleFullscreen,
  };
};
