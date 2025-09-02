export interface PatientQueueParams {
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  positionInQueue?: number;
  estimatedWaitTime?: number;
}

export interface QueuePosition {
  position: number;
  estimatedWaitTime: number;
}

export interface SocketPatient {
  id: string;
  name: string;
}

export interface SocketDoctor {
  id: string;
  name: string;
}
