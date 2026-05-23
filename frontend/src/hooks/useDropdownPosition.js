import { useEffect, useRef, useState } from 'react';

/**
 * Hook per calcolare la posizione ottimale di un dropdown (sopra o sotto l'elemento trigger)
 * Previene lo scroll della pagina posizionando il dropdown dove c'è più spazio
 */
export const useDropdownPosition = (isOpen) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, isAbove: false });
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) {
      return;
    }

    const calculatePosition = () => {
      if (!triggerRef.current || !dropdownRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Spazio disponibile sopra e sotto l'elemento trigger
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Ottieni le dimensioni reali del dropdown
      const dropdownWidth = dropdownRef.current.offsetWidth || 250;
      const dropdownHeight = dropdownRef.current.offsetHeight || 300;

      // Margin di sicurezza
      const SAFETY_MARGIN = 16;

      // Decidi se posizionare sopra o sotto
      const isAbove = spaceBelow < dropdownHeight + SAFETY_MARGIN && spaceAbove > dropdownHeight + SAFETY_MARGIN;

      // Calcola la posizione verticale
      let topPosition;
      if (isAbove) {
        topPosition = triggerRect.top - dropdownHeight - 8;
      } else {
        topPosition = triggerRect.bottom + 8;
      }

      // Calcola la posizione orizzontale allineata a destra del trigger
      // Usa window.pageXOffset per considerare lo scroll orizzontale
      let leftPosition = triggerRect.right - dropdownWidth;

      // Assicura che il dropdown resti visibile nel viewport
      if (leftPosition < SAFETY_MARGIN) {
        leftPosition = SAFETY_MARGIN;
      } else if (leftPosition + dropdownWidth > viewportWidth - SAFETY_MARGIN) {
        leftPosition = viewportWidth - dropdownWidth - SAFETY_MARGIN;
      }

      setPosition({
        top: topPosition,
        left: leftPosition,
        isAbove,
      });
    };

    // Calcola posizione iniziale
    calculatePosition();

    // Ricalcola on resize
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);

    // Ricalcola on scroll con debounce per evitare jitter
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        calculatePosition();
      }, 0);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isOpen]);

  return { triggerRef, dropdownRef, position };
};
