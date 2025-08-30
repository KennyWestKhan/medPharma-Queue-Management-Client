import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSocket } from "./SocketContext";

interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: "waiting" | "in-progress" | "completed";
  timestamp: Date;
}

interface QueueContextType {
  queue: QueueItem[];
  addToQueue: (item: Omit<QueueItem, "id" | "timestamp">) => void;
  updateQueueStatus: (id: string, status: QueueItem["status"]) => void;
  removeFromQueue: (id: string) => void;
  joinPatientRoom: (patientId: string) => void;
  joinDoctorRoom: (doctorId: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};

interface QueueProviderProps {
  children: ReactNode;
}

export const QueueProvider: React.FC<QueueProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const {
    socket,
    isConnected,
    joinPatientRoom: socketJoinPatientRoom,
    joinDoctorRoom: socketJoinDoctorRoom,
  } = useSocket();

  const addToQueue = (item: Omit<QueueItem, "id" | "timestamp">) => {
    const newItem: QueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setQueue((prev) => [...prev, newItem]);
  };

  const updateQueueStatus = (id: string, status: QueueItem["status"]) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const joinPatientRoom = (patientId: string) => {
    if (isConnected) {
      socketJoinPatientRoom(patientId);
    }
  };

  const joinDoctorRoom = (doctorId: string) => {
    if (isConnected) {
      socketJoinDoctorRoom(doctorId);
    }
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Listen for queue updates from backend
    socket.on("queueUpdate", (data) => {
      console.log("Queue update from backend:", data);
      // Handle queue updates from backend
    });

    // Listen for queue changes from backend
    socket.on("queueChanged", (data) => {
      console.log("Queue changed from backend:", data);
      // Handle queue changes from backend
    });

    return () => {
      socket.off("queueUpdate");
      socket.off("queueChanged");
    };
  }, [socket]);

  const value: QueueContextType = {
    queue,
    addToQueue,
    updateQueueStatus,
    removeFromQueue,
    joinPatientRoom,
    joinDoctorRoom,
  };

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
};
