import { useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useSocket } from "../context/SocketContext";
import { QueuePosition, SocketPatient, SocketDoctor } from "../types/patient";

interface UsePatientSocketProps {
  patientId: string;
  doctorId: string;
  patientName: string;
  onQueueUpdate: (data: QueuePosition) => void;
  onStatusUpdate: (status: string) => void;
  onConsultationStarted: (doctor: SocketDoctor) => void;
  onConsultationCompleted: (doctor: SocketDoctor) => void;
  onPatientRemoved: (doctor: SocketDoctor, reason?: string) => void;
  onConnectionIssue: () => void;
}

export const usePatientSocket = ({
  patientId,
  doctorId,
  patientName,
  onQueueUpdate,
  onStatusUpdate,
  onConsultationStarted,
  onConsultationCompleted,
  onPatientRemoved,
  onConnectionIssue,
}: UsePatientSocketProps) => {
  const { socket, isConnected } = useSocket();
  const hasJoinedRoom = useRef(false);

  const setupSocketListeners = useCallback(() => {
    if (!socket) return;

    cleanupSocketListeners();

    // Queue position updates
    socket.on("queueUpdate", (data: QueuePosition) => {
      console.log("Queue update received:", data);
      if (data && data.position !== undefined) {
        onQueueUpdate(data);
      }
    });

    // Consultation started
    socket.on(
      "consultationStarted",
      ({
        patient,
        doctor,
      }: {
        patient: SocketPatient;
        doctor: SocketDoctor;
      }) => {
        if (patient.id === patientId) {
          onStatusUpdate("consulting");
          onConsultationStarted(doctor);
          Alert.alert(
            "Consultation Starting",
            `Dr. ${doctor.name} is ready to see you now.`
          );
        }
      }
    );

    // Patient status updates
    socket.on(
      "patientStatusUpdated",
      ({
        patient,
        doctor,
        status,
        reason,
      }: {
        patient: SocketPatient;
        doctor: SocketDoctor;
        status: string;
        reason?: string;
      }) => {
        if (patient.id !== patientId) return;

        onStatusUpdate(status);

        let title: string, message: string;
        const doctorName = doctor.name || "";

        if (status === "next") {
          title = "Please get ready";
          message = `Walk to the door. You're next to see ${doctorName}.`;
        } else if (status === "late") {
          title = "Schedule Update";
          message = `${doctorName} has informed us of a slight delay: ${reason}. We appreciate your patience.`;
        } else {
          title = "Queue Update";
          message = `${doctorName} has begun your consultation`;
        }

        Alert.alert(title, message);
      }
    );

    // Consultation completed
    socket.on(
      "consultationCompleted",
      ({
        patient,
        doctor,
      }: {
        patient: SocketPatient;
        doctor: SocketDoctor;
      }) => {
        if (patient.id === patientId) {
          onStatusUpdate("completed");
          onConsultationCompleted(doctor);
          Alert.alert(
            "Consultation Completed",
            `Your consultation with Dr. ${doctor.name} has been completed.`
          );
        }
      }
    );

    // Patient removed
    socket.on(
      "patientRemoved",
      ({
        patient,
        doctor,
        reason,
      }: {
        patient: SocketPatient;
        doctor: SocketDoctor;
        reason?: string;
      }) => {
        if (patient.id === patientId) {
          onStatusUpdate("removed");
          onPatientRemoved(doctor, reason);
          Alert.alert(
            "Removed from Queue",
            `You have been removed from Dr. ${doctor.name}'s queue${
              reason ? `\nReason: ${reason}` : ""
            }`
          );
        }
      }
    );
  }, [
    socket,
    patientId,
    onQueueUpdate,
    onStatusUpdate,
    onConsultationStarted,
    onConsultationCompleted,
    onPatientRemoved,
  ]);

  const cleanupSocketListeners = useCallback(() => {
    if (!socket) return;

    const events = [
      "queueUpdate",
      "consultationStarted",
      "patientStatusUpdated",
      "consultationCompleted",
      "patientRemoved",
    ];

    events.forEach((event) => socket.off(event));
  }, [socket]);

  useEffect(() => {
    if (isConnected && socket && !hasJoinedRoom.current) {
      console.log("Joining patient room:", { patientId, doctorId });
      socket.emit("joinPatientRoom", { patientId, doctorId });
      setupSocketListeners();
      hasJoinedRoom.current = true;
    } else if (!isConnected) {
      onConnectionIssue();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [
    isConnected,
    socket,
    patientId,
    doctorId,
    setupSocketListeners,
    cleanupSocketListeners,
    onConnectionIssue,
  ]);

  // Reset hasJoinedRoom when patientId changes
  useEffect(() => {
    hasJoinedRoom.current = false;
  }, [patientId]);

  return {
    isConnected,
    socket,
  };
};
