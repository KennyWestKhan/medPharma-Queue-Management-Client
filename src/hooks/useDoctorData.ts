import { useState, useCallback } from "react";
import { API_ENDPOINTS, getCurrentConfig } from "../config/config";
import { Doctor, Patient, QueueStats, DoctorQueueResponse } from "../types";

export const useDoctorData = (doctorId: string) => {
  const [doctor, setDoctor] = useState<Doctor>({
    id: doctorId,
    name: "",
    specialization: "",
    averageConsultationTime: 0,
  });
  const [queue, setQueue] = useState<Patient[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    waiting: 0,
    consulting: 0,
    completed: 0,
    averageWaitTime: 0,
  });

  //   // Wrapper to track all calls to setStats
  //   const setStats = useCallback((newStats: QueueStats) => {
  //     console.log('🔄 STATS UPDATE - Called from:', new Error().stack?.split('\n')[2]?.trim());
  //     console.log('🔄 Previous stats:', stats);
  //     console.log('🔄 New stats:', newStats);
  //     setStatsRaw(newStats);
  //   }, [stats]);

  const [loading, setLoading] = useState(false);

  const updateStats = useCallback((queueData: Patient[]) => {
    const waitingCount = queueData.filter(
      (p) => p.status === "waiting" || p.status === "late"
    ).length;
    const consultingCount = queueData.filter(
      (p) => p.status === "consulting"
    ).length;
    const completedCount = queueData.filter(
      (p) => p.status === "completed"
    ).length;

    // DEBUG: Log the calculated stats
    console.log("=== STATS CALCULATION DEBUG ===");
    console.log("Queue length:", queueData.length);
    console.log("Waiting count (including late):", waitingCount);
    console.log("Consulting count:", consultingCount);
    console.log("Completed count:", completedCount);
    console.log(
      "All statuses:",
      queueData.map((p) => p.status)
    );

    const newStats = {
      total: queueData.length,
      waiting: waitingCount,
      consulting: consultingCount,
      completed: completedCount,
      averageWaitTime: 0,
    };

    console.log("Setting stats to:", newStats);
    setStats(newStats);
  }, []);

  const fetchDoctorQueue = useCallback(async () => {
    try {
      setLoading(true);
      const config = getCurrentConfig();
      const response = await fetch(
        `${config.baseURL}${API_ENDPOINTS.doctors}/${doctorId}/queue`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data: DoctorQueueResponse = result.data || {};

      // DEBUG: Log the entire API response
      console.log("=== API RESPONSE DEBUG ===");
      console.log("Full result:", JSON.stringify(result, null, 2));
      console.log("Data object:", JSON.stringify(data, null, 2));

      if (data.doctor) {
        setDoctor(data.doctor);
      }

      const queueData = Array.isArray(data.queue) ? data.queue : [];
      setQueue(queueData);

      // DEBUG: Log queue data and patient statuses
      console.log("Queue data length:", queueData.length);
      console.log(
        "Patient statuses:",
        queueData.map((p) => ({ name: p.name, status: p.status }))
      );

      if (data.statistics || data.queueSummary) {
        const statsData = data.queueSummary!;
        console.log("Using API stats:", JSON.stringify(statsData, null, 2));
        const apiStats = {
          total: statsData.total || 0,
          waiting: statsData.waiting || 0,
          consulting: statsData.consulting || 0,
          completed: statsData.completed || 0,
          averageWaitTime: statsData.averageWaitTime || 0,
        };
        console.log("Setting API stats to:", apiStats);
        setStats(apiStats);
      } else {
        console.log("No API stats found, calculating from queue data...");
        updateStats(queueData);
      }
    } catch (err) {
      console.error("Failed to fetch doctor queue:", err);
      setQueue([]);
      setDoctor({
        id: doctorId,
        name: "",
        specialization: "",
        averageConsultationTime: 0,
      });
      setStats({
        total: 0,
        waiting: 0,
        consulting: 0,
        completed: 0,
        averageWaitTime: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [doctorId, updateStats]);

  const updateQueue = useCallback(
    (newQueue: Patient[]) => {
      console.log("📝 updateQueue called with:", newQueue.length, "patients");
      console.log(
        "📝 Queue statuses:",
        newQueue.map((p) => ({ name: p.name, status: p.status }))
      );
      setQueue(newQueue);
      updateStats(newQueue);
    },
    [updateStats]
  );

  const updatePatientStatus = useCallback(
    (patientId: string, status: Patient["status"]) => {
      setQueue((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, status } : p))
      );
    },
    []
  );

  const removePatient = useCallback((patientId: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  return {
    doctor,
    queue,
    stats,
    loading,
    fetchDoctorQueue,
    updateQueue,
    updatePatientStatus,
    removePatient,
  };
};
