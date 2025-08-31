import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useSocket } from "../context/SocketContext";
import { Patient, Doctor } from "../types";

interface UseSocketConnectionProps {
  doctorId: string;
  onQueueChanged: (queue: Patient[]) => void;
  onConsultationStarted: (data: { patient: Patient; doctor: Doctor }) => void;
  onConsultationCompleted: (data: { patient: Patient; doctor: Doctor }) => void;
  onPatientRemoved: (data: { patient: Patient }) => void;
  onInitialDataFetch: () => void;
}

export const useSocketConnection = ({
  doctorId,
  onQueueChanged,
  onConsultationStarted,
  onConsultationCompleted,
  onPatientRemoved,
  onInitialDataFetch,
}: UseSocketConnectionProps) => {
  const { socket, isConnected } = useSocket();
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const hasJoinedRoom = useRef(false);

  const setupSocketEventListeners = () => {
    if (!socket) return;

    cleanupSocketListeners();

    // Error handling
    socket.on("error", (error: any) => {
      console.error("Socket error received:", error);
      if (error.code === "START_CONSULTATION_ERROR") {
        Alert.alert("Error", error.message);
        if (error.message.includes("Unauthorized")) {
          console.log("Rejoining doctor room due to authorization error");
          socket.emit("joinDoctorRoom", { doctorId });
        }
      }
    });

    // Queue updates
    socket.on("queueChanged", ({ queue }: { queue: Patient[] }) => {
      console.log("Queue changed event received:", queue);
      if (Array.isArray(queue)) {
        onQueueChanged(queue);
      }
    });

    // Consultation events
    socket.on("consultationStarted", onConsultationStarted);
    socket.on("consultationCompleted", onConsultationCompleted);
    socket.on("patientRemoved", onPatientRemoved);

    // Remove patient response
    socket.on("removePatientFromQueueResponse", (response: any) => {
      if (!response.success) {
        Alert.alert("Error", response.message || "Failed to remove patient");
      }
    });

    socket.on("connect", () => {
      console.log("Socket connected, refreshing data");
      if (hasJoinedRoom.current) {
        onInitialDataFetch();
      }
    });
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    const events = [
      "error",
      "queueChanged",
      "consultationStarted",
      "consultationCompleted",
      "patientRemoved",
      "removePatientFromQueueResponse",
      "connect",
    ];

    events.forEach((event) => socket.off(event));
  };

  useEffect(() => {
    if (isConnected && socket && !hasJoinedRoom.current) {
      console.log("Setting up room join for doctor:", doctorId);

      const handleRoomJoined = (data: any) => {
        console.log("Doctor room join confirmed:", data);
        setIsRoomJoined(true);
      };

      socket.once("doctorRoomJoined", handleRoomJoined);
      setupSocketEventListeners();
      socket.emit("joinDoctorRoom", { doctorId });
      hasJoinedRoom.current = true;

      onInitialDataFetch();
    }

    return () => {
      setIsRoomJoined(false);
      cleanupSocketListeners();
    };
  }, [isConnected, socket, doctorId, onInitialDataFetch]);

  useEffect(() => {
    hasJoinedRoom.current = false;
  }, [doctorId]);

  return {
    socket,
    isConnected,
    isRoomJoined,
    setupSocketEventListeners,
    cleanupSocketListeners,
  };
};
