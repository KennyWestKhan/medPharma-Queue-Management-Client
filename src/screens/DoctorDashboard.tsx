import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useQueue } from "../context/QueueContext";
import { useSocket } from "../context/SocketContext";
import { API_ENDPOINTS, getCurrentConfig } from "../config/config";

type DoctorDashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DoctorDashboard"
>;
type DoctorDashboardRouteProp = RouteProp<
  RootStackParamList,
  "DoctorDashboard"
>;

interface Props {
  navigation: DoctorDashboardNavigationProp;
  route: DoctorDashboardRouteProp;
}

const DoctorDashboard: React.FC<Props> = ({ navigation, route }) => {
  const { doctorId } = route.params;
  const [doctorName, setDoctorName] = useState("");
  const { queue, updateQueueStatus, removeFromQueue } = useQueue();
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  const [loading, setLoading] = useState(false);
  const [doctorQueue, setDoctorQueue] = useState<any[]>([]);

  const { socket, isConnected } = useSocket();
  const hasJoinedRoom = useRef(false);

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
      fetchDoctorQueue();
    }

    return () => {
      setIsRoomJoined(false);
      if (socket) {
        socket.off("doctorRoomJoined");
      }
    };
  }, [isConnected, socket, doctorId]);

  useEffect(() => {
    if (socket) {
      const events = [
        "queueChanged",
        "doctorRoomJoined",
        "error",
        "connect",
        "disconnect",
      ];

      events.forEach((event) => {
        socket.on(event, (data) => {
          console.log(`[SOCKET EVENT: ${event}]`, data);
        });
      });

      return () => {
        events.forEach((event) => socket.off(event));
      };
    }
  }, [socket]);

  const setupSocketEventListeners = () => {
    if (!socket) return;

    cleanupSocketListeners();

    socket.on("error", (error) => {
      console.error("Socket error received:", error);
      if (error.code === "START_CONSULTATION_ERROR") {
        Alert.alert("Error", error.message);
        // If unauthorized, rejoin the room
        if (error.message.includes("Unauthorized")) {
          console.log("Rejoining doctor room due to authorization error");
          socket.emit("joinDoctorRoom", { doctorId });
        }
      }
    });

    // Listen for queue updates in doctor's private room
    socket.on("queueChanged", ({ queue }) => {
      console.log("Queue changed event received:", queue);
      if (Array.isArray(queue)) {
        setDoctorQueue(queue);
        updateStats(queue);
      }
    });

    // Listen for patient-specific events
    socket.on("consultationStarted", ({ patient, doctor }) => {
      console.log("Consultation started:", { patient, doctor });
      if (doctor.id === doctorId) {
        setDoctorQueue((prev) =>
          prev.map((p) =>
            p.id === patient.id ? { ...p, status: "consulting" } : p
          )
        );
      }
    });

    socket.on("consultationCompleted", ({ patient, doctor }) => {
      console.log("Consultation completed:", { patient, doctor });
      if (doctor.id === doctorId) {
        setDoctorQueue((prev) => prev.filter((p) => p.id !== patient.id));
      }
    });

    socket.on("patientRemoved", (data) => {
      console.log("Patient removed event:", data);
      const { patient } = data;
      setDoctorQueue((prev) => prev.filter((p) => p.id !== patient.id));

      Alert.alert(
        "Patient Removed",
        `${patient.name} has been removed from the queue`
      );
    });

    socket.on("removePatientFromQueueResponse", (response) => {
      if (response.success) {
        console.log("Patient removal confirmed by server");
      } else {
        Alert.alert("Error", response.message || "Failed to remove patient");
      }
    });

    // Listen for connection events
    socket.on("connect", () => {
      console.log("Socket connected, refreshing data");
      if (hasJoinedRoom.current) {
        fetchDoctorQueue();
      }
    });

    // Listen for error events
    socket.on("error", ({ message, code }) => {
      console.error("Socket error:", { message, code });
      Alert.alert("Error", message);
      if (code === "JOIN_ROOM_ERROR") {
        // Attempt to rejoin room
        hasJoinedRoom.current = false;
        socket.emit("joinDoctorRoom", { doctorId });
      }
    });
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    socket.off("queueChanged");
    socket.off("consultationStarted");
    socket.off("consultationCompleted");
    socket.off("patientRemoved");
    socket.off("removePatientFromQueueResponse");
    socket.off("connect");
    socket.off("error");
  };

  const [specialization, setSpecialization] = useState("");
  const [averageConsultationTime, setAverageConsultationTime] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    consulting: 0,
    completed: 0,
    averageWaitTime: 0,
  });

  const updateStats = (queue: any[]) => {
    const waitingCount = queue.filter((p) => p.status === "waiting").length;
    const consultingCount = queue.filter(
      (p) => p.status === "consulting"
    ).length;
    const completedCount = queue.filter((p) => p.status === "completed").length;

    setStats({
      total: queue.length,
      waiting: waitingCount,
      consulting: consultingCount,
      completed: completedCount,
      averageWaitTime: 0,
    });
  };

  const fetchDoctorQueue = async () => {
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

      const data = result.data || {};

      if (data.doctor) {
        setDoctorName(data.doctor.name || "");
        setSpecialization(data.doctor.specialization || "");
        setAverageConsultationTime(data.doctor.averageConsultationTime || 0);
      }

      setDoctorQueue(Array.isArray(data.queue) ? data.queue : []);

      if (data.statistics) {
        setStats({
          total: data.statistics.totalPatients || 0,
          waiting: data.statistics.waitingPatients || 0,
          consulting: data.statistics.consultingPatients || 0,
          completed: data.statistics.completedPatients || 0,
          averageWaitTime: data.statistics.averageWaitTime || 0,
        });
      }

      if (data.queueSummary) {
        setStats({
          total: data.queueSummary.total || 0,
          waiting: data.queueSummary.waiting || 0,
          consulting: data.queueSummary.consulting || 0,
          completed: data.queueSummary.completed || 0,
          averageWaitTime: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch doctor queue:", err);
      setDoctorQueue([]);
      setDoctorName("");
      setSpecialization("");
      setAverageConsultationTime(0);
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
  };

  const handleStartConsultation = async (patientId: string) => {
    try {
      setLoading(true);

      if (!isRoomJoined) {
        Alert.alert("Please wait", "Connecting to server...");
        return;
      }

      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      console.log("Socket state before emit:", {
        socketId: socket.id,
        connected: socket.connected,
        doctorId,
        patientId,
      });

      socket.emit("startConsultation", { patientId, doctorId });

      // Update local state through context
      updateQueueStatus(patientId, "consulting");
    } catch (error) {
      console.error("Error starting consultation:", error);
      Alert.alert("Error", "Failed to start consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteConsultation = async (patientId: string) => {
    try {
      setLoading(true);
      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      socket.emit("completeConsultation", { patientId, doctorId });

      // Update local state through context
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

  const handleRemovePatient = (patientId: string) => {
    Alert.alert(
      "Remove Patient",
      "Are you sure you want to remove this patient from the queue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              console.log("=== STARTING PATIENT REMOVAL ===");
              console.log("Remove patient - Connection check:", {
                socketExists: !!socket,
                isConnected,
                socketId: socket?.id,
                connected: socket?.connected,
                userType: socket?.userType || "unknown",
                doctorId,
                patientId,
                timestamp: new Date().toISOString(),
              });

              if (!socket) {
                throw new Error("Socket not available");
              }

              if (!isConnected) {
                throw new Error("Socket not connected to server");
              }

              if (!socket.connected) {
                throw new Error("Socket connection is not active");
              }

              const removePromise = new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  console.log("TIMEOUT: Remove operation timed out");
                  socket.off("removePatientFromQueueResponse", responseHandler);
                  reject(
                    new Error("Remove operation timed out after 15 seconds")
                  );
                }, 15000);

                const responseHandler = (response: any) => {
                  console.log("RESPONSE RECEIVED:", response);
                  clearTimeout(timeout);
                  socket.off("removePatientFromQueueResponse", responseHandler);

                  if (response.success) {
                    console.log("SUCCESS: Patient removal confirmed");
                    resolve(response);
                  } else {
                    console.log(
                      "ERROR: Server reported failure:",
                      response.message
                    );
                    reject(
                      new Error(response.message || "Failed to remove patient")
                    );
                  }
                };

                console.log("Setting up response listener...");
                socket.on("removePatientFromQueueResponse", responseHandler);
              });

              console.log("Emitting removePatientFromQueue event...");
              socket.emit("removePatientFromQueue", {
                patientId,
                doctorId,
                reason: "Removed by doctor from dashboard",
              });

              console.log("Waiting for server response...");
              await removePromise;

              console.log("Updating local state...");
              removeFromQueue(patientId);

              console.log("=== PATIENT REMOVAL COMPLETED SUCCESSFULLY ===");
            } catch (error: any) {
              console.error("=== ERROR IN PATIENT REMOVAL ===", error);
              Alert.alert("Error", error.message || "Failed to remove patient");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "#f59e0b";
      case "consulting":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Waiting";
      case "consulting":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const renderPatientItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientTime}>
            Joined:{" "}
            {item.joined_at
              ? new Date(item.joined_at).toLocaleTimeString()
              : "N/A"}
          </Text>
        </View>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{index + 1}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <Text
          style={[styles.statusText, { color: getStatusColor(item.status) }]}
        >
          {getStatusText(item.status)} ({item.waitingTime} mins)
        </Text>
      </View>

      <View style={styles.actionButtons}>
        {item.status === "waiting" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleStartConsultation(item.id)}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {item.status === "consulting" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCompleteConsultation(item.id)}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemovePatient(item.id)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const waitingCount = stats.waiting;
  const inProgressCount = stats.consulting;
  const completedCount = stats.completed;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {loading ? "Loading..." : doctorName}
            </Text>

            {!loading && (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? "#10b981" : "#ef4444" },
                ]}
              />
            )}
          </View>
          <Text style={styles.subtitle}>{specialization}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{waitingCount}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>Patient Queue</Text>
          <Text style={styles.queueSubtitle}>
            {doctorQueue.length} total patients
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading doctor profile...</Text>
            <Text style={styles.emptyStateSubtext}>
              Please wait while we fetch the latest queue and doctor details.
            </Text>
          </View>
        ) : doctorQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No patients in queue</Text>
            <Text style={styles.emptyStateSubtext}>
              Patients will appear here when they book consultations
            </Text>
          </View>
        ) : (
          <FlatList
            data={doctorQueue}
            renderItem={renderPatientItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.queueList}
          />
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            console.log("Socket debug info:", {
              hasSocket: !!socket,
              isConnected,
              socketId: socket?.id,
              socketConnected: socket?.connected,
              hasJoinedRoom: hasJoinedRoom.current,
            });

            // Test emit
            if (socket) {
              socket.emit("test", { message: "Test from React Native" });
            }
          }}
        >
          <Text>Debug Socket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionText: {
    fontSize: 12,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  queueHeader: {
    marginBottom: 16,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  queueSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  queueList: {
    paddingBottom: 20,
  },
  patientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  patientTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  positionBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#059669",
  },
  completeButton: {
    backgroundColor: "#2563eb",
  },
  removeButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DoctorDashboard;
