import { useState, useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useQueue } from "../context/QueueContext";
import { API_ENDPOINTS, getCurrentConfig } from "../config/config";

export const usePatientQueue = (
  patientId: string,
  doctorId: string,
  initialPosition?: number
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | undefined>(initialPosition);
  const { queue, removeFromQueue } = useQueue();
  const hasInitialized = useRef(false);

  const config = getCurrentConfig();

  const fetchEstimatedWaitTime = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch(
        `${config.baseURL}${API_ENDPOINTS.doctors}/${doctorId}/estimated-wait-time`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Estimated wait time result:", result);

        if (result.success) {
          return result.data.estimatedWaitTime || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error("Error fetching estimated wait time:", error);
      return 0;
    }
  }, [config.baseURL, doctorId]);

  const updateQueuePosition = useCallback(() => {
    // Only update position if we have queue data
    if (queue.length > 0) {
      const doctorQueue = queue
        .filter(
          (item) => item.doctorId === doctorId && item.status === "waiting"
        )
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const patientIndex = doctorQueue.findIndex(
        (item) => item.id === patientId
      );
      if (patientIndex !== -1) {
        const newPosition = patientIndex + 1;
        setPosition(newPosition);
      }
    } else if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [queue, doctorId, patientId, initialPosition]);

  const updatePosition = useCallback((newPosition: number) => {
    hasInitialized.current = true;
    setPosition(newPosition);
  }, []);

  const leaveQueue = useCallback(
    async (reason: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        console.log("Removing patient from queue:", patientId);
        const response = await fetch(
          `${config.baseURL}${API_ENDPOINTS.patients}/${patientId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reason ? { reason } : {}),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log("Successfully removed from queue:", data);
          removeFromQueue(patientId);
          return true;
        } else {
          console.warn("Error removing from queue:", data);
          Alert.alert(
            "Failed to remove you from queue",
            `${data?.message} Please try again later`,
            [{ text: "OK" }]
          );
          return false;
        }
      } catch (error) {
        console.error("Error removing patient:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to remove from queue";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [config.baseURL, patientId, removeFromQueue]
  );

  // Update position when queue changes, but only if we haven't received a socket update
  useEffect(() => {
    if (!hasInitialized.current && queue.length > 0) {
      updateQueuePosition();
    }
  }, [queue, updateQueuePosition]);

  console.log({
    initialPosition,
    position,
    hasInitialized: hasInitialized.current,
  });
  return {
    position,
    loading,
    error,
    updatePosition,
    updateQueuePosition,
    fetchEstimatedWaitTime,
    leaveQueue,
  };
};
