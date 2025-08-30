import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { getCurrentConfig, SOCKET_CONFIG } from "../config/config";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinPatientRoom: (patientId: string) => void;
  joinDoctorRoom: (doctorId: string) => void;
  leaveRoom: (roomId: string) => void;
  updatePatientStatus: (patientId: string, status: string) => void;
  updateDoctorAvailability: (doctorId: string, isAvailable: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    if (socket?.connected) return;

    const config = getCurrentConfig();
    const newSocket = io(config.socketURL, SOCKET_CONFIG);

    console.log({ configURL: config.socketURL });

    newSocket.on("connect", () => {
      console.log("Connected to MedPharma backend server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from MedPharma backend server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("queueUpdate", (data) => {
      console.log("Queue update received:", data);
    });

    newSocket.on("queueChanged", (data) => {
      console.log("Queue changed:", data);
    });

    // Listen for errors
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const joinPatientRoom = (patientId: string) => {
    if (socket && isConnected) {
      socket.emit("joinPatientRoom", { patientId });
    }
  };

  const joinDoctorRoom = (doctorId: string) => {
    if (socket && isConnected) {
      socket.emit("joinDoctorRoom", { doctorId });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit("leaveRoom", { roomId });
    }
  };

  const updatePatientStatus = (patientId: string, status: string) => {
    if (socket && isConnected) {
      socket.emit("updatePatientStatus", { patientId, status });
    }
  };

  const updateDoctorAvailability = (doctorId: string, isAvailable: boolean) => {
    if (socket && isConnected) {
      socket.emit("updateDoctorAvailability", { doctorId, isAvailable });
    }
  };

  useEffect(() => {
    // Auto-connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
    joinPatientRoom,
    joinDoctorRoom,
    leaveRoom,
    updatePatientStatus,
    updateDoctorAvailability,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
