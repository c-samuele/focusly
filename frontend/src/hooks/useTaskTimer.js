// Hook che gestisce il timer di focus per i task.
// Mantiene un solo timer attivo alla volta e notifica con un suono alla fine.
import { useEffect, useMemo, useRef, useState } from 'react';

const getDurationSeconds = (minutes) => Math.max(0, Number(minutes) || 0) * 60;

const playAlarm = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const startAt = audioContext.currentTime;

  // Generiamo un breve segnale audio sintetico via Web Audio API
  // per evitare asset esterni e mantenere il progetto autosufficiente.
  [0, 0.22, 0.44].forEach((offset, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, startAt + offset);
    gainNode.gain.setValueAtTime(0.0001, startAt + offset);
    gainNode.gain.exponentialRampToValueAtTime(0.16, startAt + offset + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt + offset);
    oscillator.stop(startAt + offset + 0.2);
  });

  window.setTimeout(() => {
    audioContext.close().catch(() => {});
  }, 900);
};

export const useTaskTimer = (tasks, onTimerComplete) => {
  const intervalRef = useRef(null);
  const completedSoundForRef = useRef('');
  const [activeTaskId, setActiveTaskId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  // Usiamo timestamp per un timer preciso basato sul tempo reale
  const [startTime, setStartTime] = useState(null); // quando il timer è iniziato
  const [pausedTime, setPausedTime] = useState(0); // tempo totale in pausa (millisecondi)
  const [pauseStartTime, setPauseStartTime] = useState(null); // quando è iniziata la pausa corrente
  const [totalDuration, setTotalDuration] = useState(0); // durata totale del timer in secondi
  const [displaySeconds, setDisplaySeconds] = useState(0); // secondi visualizzati (aggiornati in tempo reale)

  // Calcola i secondi rimanenti basandosi sul tempo reale trascorso
  const calculateRemainingSeconds = () => {
    if (!startTime || !totalDuration) return 0;
    
    const now = Date.now();
    const elapsed = now - startTime - pausedTime;
    const remaining = Math.ceil((totalDuration * 1000 - elapsed) / 1000);
    return Math.max(0, remaining);
  };

  const taskMap = useMemo(
    () =>
      tasks.reduce((accumulator, task) => {
        accumulator[task.id] = task;
        return accumulator;
      }, {}),
    [tasks]
  );

  const activeTask = activeTaskId ? taskMap[activeTaskId] ?? null : null;

  useEffect(() => {
    if (activeTaskId && !taskMap[activeTaskId]) {
      // Se il task attivo sparisce o cambia gruppo, azzeriamo il timer in sicurezza.
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setActiveTaskId('');
      setIsRunning(false);
      setStartTime(null);
      setPausedTime(0);
      setPauseStartTime(null);
      setTotalDuration(0);
      setDisplaySeconds(0);
    }
  }, [activeTaskId, taskMap]);

  useEffect(() => {
    if (!activeTask) {
      return;
    }

    const nextMax = getDurationSeconds(activeTask.timer);
    const currentRemaining = calculateRemainingSeconds();
    if (currentRemaining > nextMax) {
      // Reset del timer se la durata è cambiata a un valore minore
      setStartTime(Date.now());
      setPausedTime(0);
      setPauseStartTime(null);
      setTotalDuration(nextMax);
      setDisplaySeconds(nextMax);
    }
  }, [activeTask]);

  // Effect che gestisce il timer aggiornando displaySeconds per triggerizzare re-render
  useEffect(() => {
    if (!activeTaskId || !isRunning) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;

      const remaining = calculateRemainingSeconds();
      setDisplaySeconds(remaining);
      
      // Il suono viene emesso una sola volta per completamento.
      if (activeTaskId && remaining === 0 && completedSoundForRef.current !== activeTaskId) {
        playAlarm();
        completedSoundForRef.current = activeTaskId;
        setIsRunning(false);

        if (activeTask && !activeTask.completed) {
          onTimerComplete?.(activeTaskId);
        }

        setActiveTaskId('');
        setStartTime(null);
        setPausedTime(0);
        setPauseStartTime(null);
        setTotalDuration(0);
        setDisplaySeconds(0);
      }

      return;
    }

    // Aggiorniamo il display ogni 100ms per un aggiornamento fluido
    intervalRef.current = window.setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setDisplaySeconds(remaining);
      
      // Quando il timer arriva a zero, triggeriamo il completamento
      if (remaining <= 0) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setDisplaySeconds(0);
        
        if (completedSoundForRef.current !== activeTaskId) {
          playAlarm();
          completedSoundForRef.current = activeTaskId;
          setIsRunning(false);

          if (activeTask && !activeTask.completed) {
            onTimerComplete?.(activeTaskId);
          }

          setActiveTaskId('');
          setStartTime(null);
          setPausedTime(0);
          setPauseStartTime(null);
          setTotalDuration(0);
        }
      }
    }, 100);

    return () => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [activeTask, activeTaskId, isRunning, onTimerComplete, startTime, pausedTime, totalDuration]);

  const startTimer = (task) => {
    const durationSeconds = getDurationSeconds(task.timer);

    if (!durationSeconds) {
      return;
    }

    // Quando si passa a un nuovo task il conto riparte dalla durata pianificata.
    completedSoundForRef.current = '';

    if (activeTaskId !== task.id) {
      setActiveTaskId(task.id);
      setTotalDuration(durationSeconds);
      setStartTime(Date.now());
      setPausedTime(0);
      setPauseStartTime(null);
      setDisplaySeconds(durationSeconds);
      setIsRunning(true);
      return;
    }

    // Se era in pausa, riprendiamo
    if (!isRunning && pauseStartTime !== null) {
      const now = Date.now();
      setPausedTime(prev => prev + (now - pauseStartTime));
      setPauseStartTime(null);
    }
    
    setIsRunning(true);
  };

  const pauseTimer = () => {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPauseStartTime(Date.now());
    setIsRunning(false);
  };

  const resetTimer = (task) => {
    const durationSeconds = getDurationSeconds(task.timer);

    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    completedSoundForRef.current = '';

    if (activeTaskId === task.id) {
      setTotalDuration(durationSeconds);
      setStartTime(Date.now());
      setPausedTime(0);
      setPauseStartTime(null);
      setDisplaySeconds(durationSeconds);
      setIsRunning(false);
    }
  };

  const getTaskRemainingSeconds = (task) => {
    if (task.id === activeTaskId) {
      return displaySeconds || calculateRemainingSeconds();
    }

    return getDurationSeconds(task.timer);
  };

  return {
    activeTask,
    activeTaskId,
    isRunning,
    remainingSeconds: displaySeconds || calculateRemainingSeconds(),
    startTimer,
    pauseTimer,
    resetTimer,
    getTaskRemainingSeconds,
  };
};
