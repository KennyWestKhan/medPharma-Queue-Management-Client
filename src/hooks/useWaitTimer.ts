import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";

export const useWaitTimer = (initialWaitTime: number, isWaiting: boolean) => {
  const [waitTime, setWaitTime] = useState(initialWaitTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showTimesUpAlert = useCallback(() => {
    Alert.alert(
      "Time's Up! 🔔",
      "Your estimated wait time has elapsed. You should be called soon!",
      [{ text: "OK" }]
    );
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (newWaitTime: number) => {
      stopTimer();
      setWaitTime(newWaitTime);

      if (newWaitTime > 0 && isWaiting) {
        timerRef.current = setInterval(() => {
          setWaitTime((prevTime) => {
            const newTime = prevTime - 1;

            if (newTime <= 0) {
              showTimesUpAlert();
              stopTimer();
              return 0;
            }

            return newTime;
          });
        }, 60000);
      }
    },
    [isWaiting, showTimesUpAlert, stopTimer]
  );

  // Auto-start timer on mount with initial time
  useEffect(() => {
    if (initialWaitTime > 0 && isWaiting) {
      startTimer(initialWaitTime);
    }

    return () => {
      stopTimer();
    };
  }, []);

  // Stop timer when not waiting
  useEffect(() => {
    if (!isWaiting) {
      stopTimer();
    }
  }, [isWaiting, stopTimer]);

  return {
    waitTime,
    startTimer,
    stopTimer,
  };
};
