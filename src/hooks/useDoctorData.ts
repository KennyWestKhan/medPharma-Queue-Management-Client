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
  const [loading, setLoading] = useState(false);

  const updateStats = useCallback((queueData: Patient[]) => {
    const waitingCount = queueData.filter((p) => p.status === "waiting").length;
    const consultingCount = queueData.filter(
      (p) => p.status === "consulting"
    ).length;
    const completedCount = queueData.filter(
      (p) => p.status === "completed"
    ).length;

    setStats({
      total: queueData.length,
      waiting: waitingCount,
      consulting: consultingCount,
      completed: completedCount,
      averageWaitTime: 0,
    });
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

      if (data.doctor) {
        setDoctor(data.doctor);
      }

      const queueData = Array.isArray(data.queue) ? data.queue : [];
      setQueue(queueData);

      if (data.statistics || data.queueSummary) {
        const statsData = data.statistics || data.queueSummary!;
        setStats({
          total: statsData.total || 0,
          waiting: statsData.waiting || 0,
          consulting: statsData.consulting || 0,
          completed: statsData.completed || 0,
          averageWaitTime: statsData.averageWaitTime || 0,
        });
      } else {
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
