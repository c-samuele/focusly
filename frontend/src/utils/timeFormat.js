// Utility di formattazione delle durate.
// Converte minuti o ore in stringhe leggibili in formato sessantesimale.
const roundMinutes = (value) => Math.max(0, Math.round(Number(value) || 0));

export const formatMinutes = (value) => {
  const totalMinutes = roundMinutes(value);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

export const hoursToMinutes = (value) => roundMinutes((Number(value) || 0) * 60);
