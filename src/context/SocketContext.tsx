import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { io, Socket } from "socket.io-client";
import { getCurrentConfig } from "../config/config";
import { SOCKET_CONFIG } from "../config/socketConfig";

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionAttempts: number;
  connect: () => void;
  disconnect: () => void;
  joinPatientRoom: (patientId: string) => void;
  joinDoctorRoom: (doctorId: string) => void;
  leaveRoom: (roomId: string) => void;
  updatePatientStatus: (patientId: string, status: string) => void;
  updateDoctorAvailability: (doctorId: string, isAvailable: boolean) => void;
}

export interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// Provider component that wraps app
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const isInitialized = useRef(false);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    // Prevent multiple initialization
    if (isInitialized.current || socketRef.current?.connected) {
      return;
    }

    try {
      const config = getCurrentConfig();
      console.log("Initializing socket connection to:", config.socketURL);

      console.log("Socket config:", config.socketURL, SOCKET_CONFIG);
      const newSocket = io(config.socketURL, {
        ...SOCKET_CONFIG,
        autoConnect: true,
      });

      socketRef.current = newSocket;
      isInitialized.current = true;

      setupSocketListeners(newSocket);
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      Alert.alert(
        "Connection Error",
        "Failed to initialize connection to the server."
      );
    }
  }, []);

  // Set up all socket event listeners
  const setupSocketListeners = (socket: Socket) => {
    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to MedPharma backend server");
      setIsConnected(true);
      setConnectionAttempts(0); // Reset attempts on successful connection
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from MedPharma backend server:", reason);
      setIsConnected(false);
    });

    // Debug connection process
    socket.io.on("ping", () => {
      if (__DEV__) {
        console.log("Socket ping");
      }
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log("Socket reconnection attempt:", attempt);
      setConnectionAttempts(attempt);
    });

    socket.io.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setConnectionAttempts(0);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
      Alert.alert(
        "Connection Failed",
        "Unable to reconnect to the server. Please check your internet connection and try again."
      );
    });

    // Event listeners for consultation updates
    socket.on("consultationStarted", (data) => {
      if (data?.patient?.name && data?.doctor?.name) {
        Alert.alert(
          "Consultation Started",
          `${data.patient.name}'s consultation is now in progress with Dr. ${data.doctor.name}`
        );
      }
    });

    socket.on("consultationCompleted", (data) => {
      if (data?.patient?.name && data?.doctor?.name) {
        Alert.alert(
          "Consultation Completed",
          `${data.patient.name}'s consultation with Dr. ${data.doctor.name} has been completed`
        );
      }
    });

    socket.on("patientRemoved", (data) => {
      if (data?.patient?.name && data?.doctor?.name) {
        Alert.alert(
          "Patient Removed",
          `${data.patient.name} has been removed from Dr. ${
            data.doctor.name
          }'s queue${data.reason ? `\nReason: ${data.reason}` : ""}`
        );
      }
    });

    socket.on("queueUpdate", (data) => {
      console.log("Queue update received:", data);
    });

    socket.on("queueChanged", (data) => {
      console.log("Queue changed:", data);
    });

    // Error handling
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      setIsConnected(false);

      // For connection errors, only show alert for first few attempts
      if (connectionAttempts < 2) {
        Alert.alert(
          "Connection Error",
          "Having trouble connecting to the server. Retrying..."
        );
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);

      // socket.io.opts.reconnection = false;
      // socket.disconnect();
      // Alert.alert(
      //   "Server Error",
      //  error.message|| "The server encountered an error. Please try again later.",
      //   [
      //     {
      //       text: "OK",
      //       onPress: () => {
      //         // Reset reconnection for future connections
      //         socket.io.opts.reconnection = true;
      //       },
      //     },
      //   ]
      // );
    });
  };

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log("Socket already connected");
      return;
    }

    if (!socketRef.current) {
      initializeSocket();
    } else {
      socketRef.current.connect();
    }
  }, [initializeSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Disconnecting socket");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      isInitialized.current = false;
      setIsConnected(false);
      setConnectionAttempts(0);
    }
  }, []);

  // Room management functions
  const joinPatientRoom = useCallback(
    (patientId: string) => {
      if (!patientId) {
        console.warn("joinPatientRoom called without patientId");
        return;
      }

      if (socketRef.current && isConnected) {
        console.log("Joining patient room:", patientId);
        socketRef.current.emit("joinPatientRoom", { patientId });
      } else {
        console.warn("Cannot join patient room - socket not connected");
      }
    },
    [isConnected]
  );

  const joinDoctorRoom = useCallback(
    (doctorId: string) => {
      if (!doctorId) {
        console.warn("joinDoctorRoom called without doctorId");
        return;
      }

      if (socketRef.current && isConnected) {
        console.log("Joining doctor room:", doctorId);
        socketRef.current.emit("joinDoctorRoom", { doctorId });
      } else {
        console.warn("Cannot join doctor room - socket not connected");
      }
    },
    [isConnected]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!roomId) {
        console.warn("leaveRoom called without roomId");
        return;
      }

      if (socketRef.current && isConnected) {
        console.log("Leaving room:", roomId);
        socketRef.current.emit("leaveRoom", { roomId });
      } else {
        console.warn("Cannot leave room - socket not connected");
      }
    },
    [isConnected]
  );

  // Status update functions
  const updatePatientStatus = useCallback(
    (patientId: string, status: string) => {
      if (!patientId || !status) {
        console.warn("updatePatientStatus called with missing parameters");
        return;
      }

      if (socketRef.current && isConnected) {
        console.log("Updating patient status:", { patientId, status });
        socketRef.current.emit("updatePatientStatus", { patientId, status });
      } else {
        console.warn("Cannot update patient status - socket not connected");
      }
    },
    [isConnected]
  );

  const updateDoctorAvailability = useCallback(
    (doctorId: string, isAvailable: boolean) => {
      if (!doctorId || typeof isAvailable !== "boolean") {
        console.warn("updateDoctorAvailability called with invalid parameters");
        return;
      }

      if (socketRef.current && isConnected) {
        console.log("Updating doctor availability:", { doctorId, isAvailable });
        socketRef.current.emit("updateDoctorAvailability", {
          doctorId,
          isAvailable,
        });
      } else {
        console.warn(
          "Cannot update doctor availability - socket not connected"
        );
      }
    },
    [isConnected]
  );

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const value = useMemo(
    (): SocketContextType => ({
      socket: socketRef.current,
      isConnected,
      connectionAttempts,
      connect,
      disconnect,
      joinPatientRoom,
      joinDoctorRoom,
      leaveRoom,
      updatePatientStatus,
      updateDoctorAvailability,
    }),
    [
      isConnected,
      connectionAttempts,
      connect,
      disconnect,
      joinPatientRoom,
      joinDoctorRoom,
      leaveRoom,
      updatePatientStatus,
      updateDoctorAvailability,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export { SocketContext };
