import { useState } from "react";
import { Alert } from "react-native";
import { useQueue } from "../context/QueueContext";

interface UseQueueOperationsProps {
  socket: any;
  isConnected: boolean;
  isRoomJoined: boolean;
  doctorId: string;
}

export const useQueueOperations = ({
  socket,
  isConnected,
  isRoomJoined,
  doctorId,
}: UseQueueOperationsProps) => {
  const [loading, setLoading] = useState(false);
  const { updateQueueStatus, removeFromQueue } = useQueue();

  const startConsultation = async (patientId: string) => {
    try {
      setLoading(true);

      if (!isRoomJoined) {
        Alert.alert("Please wait", "Connecting to server...");
        return;
      }

      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      console.log("Starting consultation:", { doctorId, patientId });
      socket.emit("startConsultation", { patientId, doctorId });
      updateQueueStatus(patientId, "consulting");
    } catch (error) {
      console.error("Error starting consultation:", error);
      Alert.alert("Error", "Failed to start consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeConsultation = async (patientId: string) => {
    try {
      setLoading(true);
      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      socket.emit("completeConsultation", { patientId, doctorId });
      updateQueueStatus(patientId, "completed");
    } catch (error) {
      console.error("Error completing consultation:", error);
      Alert.alert(
        "Error",
        "Failed to complete consultation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const removePatient = (patientId: string) => {
    Alert.alert(
      "Remove Patient",
      "Are you sure you want to remove this patient from the queue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleRemovePatient(patientId),
        },
      ]
    );
  };

  const handleRemovePatient = async (patientId: string) => {
    try {
      setLoading(true);

      if (!socket?.connected) {
        throw new Error("Socket connection is not active");
      }

      const removePromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.off("removePatientFromQueueResponse", responseHandler);
          reject(new Error("Remove operation timed out after 15 seconds"));
        }, 15000);

        const responseHandler = (response: any) => {
          clearTimeout(timeout);
          socket.off("removePatientFromQueueResponse", responseHandler);

          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || "Failed to remove patient"));
          }
        };

        socket.on("removePatientFromQueueResponse", responseHandler);
      });

      socket.emit("removePatientFromQueue", {
        patientId,
        doctorId,
        reason: "Removed by doctor from dashboard",
      });

      await removePromise;
      removeFromQueue(patientId);
    } catch (error: any) {
      console.error("Error removing patient:", error);
      Alert.alert("Error", error.message || "Failed to remove patient");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    startConsultation,
    completeConsultation,
    removePatient,
  };
};
