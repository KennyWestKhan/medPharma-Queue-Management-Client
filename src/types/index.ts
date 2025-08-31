export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  averageConsultationTime: number;
}

export interface Patient {
  id: string;
  name: string;
  status: "waiting" | "consulting" | "completed" | "late";
  joined_at: string;
  waitingTime: number;
}

export interface QueueStats {
  total: number;
  waiting: number;
  consulting: number;
  completed: number;
  averageWaitTime: number;
}

export interface DoctorQueueResponse {
  doctor: Doctor;
  queue: Patient[];
  statistics?: QueueStats;
  queueSummary?: QueueStats;
}
