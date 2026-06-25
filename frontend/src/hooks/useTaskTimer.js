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
  const onTimerCompleteRef = useRef(onTimerComplete);
  const activeTaskIdRef = useRef('');
  const activeTaskRef = useRef(null);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const pauseStartTimeRef = useRef(null);
  const totalDurationRef = useRef(0);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0); // secondi visualizzati (aggiornati in tempo reale)

  // Calcola i secondi rimanenti basandosi sul tempo reale trascorso
  const calculateRemainingSeconds = (now = Date.now()) => {
    if (!startTimeRef.current || !totalDurationRef.current) return 0;

    const elapsedUntil = isRunningRef.current
      ? now
      : pauseStartTimeRef.current ?? now;
    const elapsed = elapsedUntil - startTimeRef.current - pausedTimeRef.current;
    const remaining = Math.ceil((totalDurationRef.current * 1000 - elapsed) / 1000);
    return Math.max(0, remaining);
  };

  const clearTimerInterval = () => {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resetTimingRefs = () => {
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    totalDurationRef.current = 0;
  };

  const resetTimerState = () => {
    clearTimerInterval();
    resetTimingRefs();
    setActiveTaskId('');
    setIsRunning(false);
    setDisplaySeconds(0);
  };

  const completeTimer = () => {
    const currentActiveTaskId = activeTaskIdRef.current;

    if (!currentActiveTaskId || completedSoundForRef.current === currentActiveTaskId) {
      resetTimerState();
      return;
    }

    playAlarm();
    completedSoundForRef.current = currentActiveTaskId;

    const currentActiveTask = activeTaskRef.current;
    if (currentActiveTask && !currentActiveTask.completed) {
      onTimerCompleteRef.current?.(currentActiveTaskId);
    }

    resetTimerState();
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
    onTimerCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);

  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (activeTaskId && !taskMap[activeTaskId]) {
      // Se il task attivo sparisce o cambia gruppo, azzeriamo il timer in sicurezza.
      resetTimerState();
    }
  }, [activeTaskId, taskMap]);

  useEffect(() => {
    if (!activeTask) {
      return;
    }

    if (activeTask.completed) {
      resetTimerState();
      return;
    }

    const nextMax = getDurationSeconds(activeTask.timer);
    const currentRemaining = calculateRemainingSeconds();
    if (currentRemaining > nextMax) {
      // Reset del timer se la durata è cambiata a un valore minore
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      totalDurationRef.current = nextMax;
      setDisplaySeconds(nextMax);
    }
  }, [activeTask]);

  // Aggiorniamo il display al ritmo dei secondi mostrati a schermo
  // per evitare re-render inutilmente frequenti dell'intera dashboard.
  useEffect(() => {
    if (!activeTaskId || !isRunning) {
      clearTimerInterval();

      const remaining = calculateRemainingSeconds();
      setDisplaySeconds((current) => (current === remaining ? current : remaining));

      // Se il timer scade mentre siamo fuori dal loop, completiamolo comunque.
      if (activeTaskId && remaining === 0) {
        completeTimer();
      }

      return;
    }

    // Il timer mostra solo mm:ss: un tick al secondo e` sufficiente.
    const tick = () => {
      const remaining = calculateRemainingSeconds();
      setDisplaySeconds((current) => (current === remaining ? current : remaining));

      // Quando il timer arriva a zero, triggeriamo il completamento
      if (remaining <= 0) {
        clearTimerInterval();
        setDisplaySeconds(0);
        completeTimer();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    intervalRef.current = intervalId;

    return () => {
      window.clearInterval(intervalId);

      if (intervalRef.current === intervalId) {
        intervalRef.current = null;
      }
    };
  }, [activeTaskId, isRunning]);

  const startTimer = (task) => {
    const durationSeconds = getDurationSeconds(task.timer);

    if (!durationSeconds || task.completed) {
      return;
    }

    // Quando si passa a un nuovo task il conto riparte dalla durata pianificata.
    completedSoundForRef.current = '';

    if (activeTaskId !== task.id) {
      clearTimerInterval();
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      totalDurationRef.current = durationSeconds;
      setActiveTaskId(task.id);
      setDisplaySeconds(durationSeconds);
      setIsRunning(true);
      return;
    }

    // Se era in pausa, riprendiamo
    if (!isRunning && pauseStartTimeRef.current !== null) {
      const now = Date.now();
      pausedTimeRef.current += now - pauseStartTimeRef.current;
      pauseStartTimeRef.current = null;
    }

    setIsRunning(true);
  };

  const pauseTimer = () => {
    clearTimerInterval();
    pauseStartTimeRef.current = Date.now();
    setDisplaySeconds(calculateRemainingSeconds(pauseStartTimeRef.current));
    setIsRunning(false);
  };

  const resetTimer = (task) => {
    const durationSeconds = getDurationSeconds(task.timer);

    if (!durationSeconds || task.completed) {
      return;
    }

    clearTimerInterval();
    completedSoundForRef.current = '';
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    totalDurationRef.current = durationSeconds;
    setActiveTaskId(task.id);
    setDisplaySeconds(durationSeconds);
    setIsRunning(false);
  };

  const extendTimer = (task, minutesToAdd = 30) => {
    if (!task || task.id !== activeTaskIdRef.current || task.completed) {
      return;
    }

    const additionalSeconds = Math.max(0, Number(minutesToAdd) || 0) * 60;

    if (!additionalSeconds) {
      return;
    }

    const remaining = calculateRemainingSeconds();

    if (remaining <= 0) {
      return;
    }

    totalDurationRef.current += additionalSeconds;
    setDisplaySeconds(remaining + additionalSeconds);
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
    extendTimer,
    getTaskRemainingSeconds,
  };
};
