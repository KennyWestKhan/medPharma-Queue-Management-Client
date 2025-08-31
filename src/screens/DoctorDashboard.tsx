import React, { useState, useEffect } from "react";
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

  const [loading, setloading] = useState(false);
  const [doctorQueue, setDoctorQueue] = useState<any[]>([]);

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected && socket) {
      // Join doctor's room
      socket.emit("joinDoctorRoom", { doctorId });

      // Listen for queue updates in doctor's private room
      socket.on("queueChanged", ({ queue }) => {
        if (Array.isArray(queue)) {
          setDoctorQueue(queue);
          updateStats(queue);
        }
      });

      // Listen for patient-specific events
      socket.on("consultationStarted", ({ patient, doctor }) => {
        if (doctor.id === doctorId) {
          const updatedQueue = doctorQueue.map((p) =>
            p.id === patient.id ? { ...p, status: "consulting" } : p
          );
          setDoctorQueue(updatedQueue);
          updateStats(updatedQueue);
        }
      });

      socket.on("consultationCompleted", ({ patient, doctor }) => {
        if (doctor.id === doctorId) {
          setDoctorQueue((prev) => prev.filter((p) => p.id !== patient.id));
          updateStats(doctorQueue.filter((p) => p.id !== patient.id));
        }
      });

      // Listen for consultation events
      socket.on("consultationStarted", (data) => {
        const { patient, doctor } = data;
        setDoctorQueue((currentQueue) =>
          currentQueue.map((p) =>
            p.id === patient.id ? { ...p, status: "consulting" } : p
          )
        );
      });

      socket.on("consultationCompleted", (data) => {
        const { patient, doctor } = data;
        setDoctorQueue((currentQueue) =>
          currentQueue.map((p) =>
            p.id === patient.id ? { ...p, status: "completed" } : p
          )
        );
      });

      socket.on("patientRemoved", (data) => {
        const { patient, reason } = data;
        setDoctorQueue((currentQueue) =>
          currentQueue.filter((p) => p.id !== patient.id)
        );
      });

      // Listen for connection events
      socket.on("connect", () => {
        console.log("Socket connected");
        fetchDoctorQueue(); // Refresh data on reconnect
      });

      socket.on("reconnected", ({ attemptNumber }) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        fetchDoctorQueue(); // Refresh data on reconnect
      });

      // Listen for error events
      socket.on("error", ({ message, code }) => {
        Alert.alert("Error", message);
        if (code === "JOIN_ROOM_ERROR") {
          // Attempt to rejoin room
          socket.emit("joinDoctorRoom", { doctorId });
        }
      });

      // Initial fetch
      fetchDoctorQueue();

      // Cleanup function
      return () => {
        socket.off("queueChanged");
        socket.off("consultationStarted");
        socket.off("consultationCompleted");
        socket.off("patientRemoved");
        socket.off("connect");
        socket.off("reconnected");
        socket.off("error");
        socket.emit("leaveRoom", { roomId: `doctor:${doctorId}` });
      };
    }

    Alert.alert("Error", "Socket not connected or not available");
  }, [doctorId, isConnected]);

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
      setloading(true);
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
      setloading(false);
    }
  };

  const handleStartConsultation = async (patientId: string) => {
    try {
      setloading(true);
      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      socket.emit("startConsultation", { patientId, doctorId });

      // Update local state through context
      updateQueueStatus(patientId, "consulting");
    } catch (error) {
      console.error("Error starting consultation:", error);
      Alert.alert("Error", "Failed to start consultation. Please try again.");
    } finally {
      setloading(false);
    }
  };

  const handleCompleteConsultation = async (patientId: string) => {
    try {
      setloading(true);
      if (!socket || !isConnected) {
        throw new Error("No socket connection available");
      }

      socket.emit("completeConsultation", { patientId, doctorId });

      // Update local state through context
      updateQueueStatus(patientId, "completed");
      // await fetchDoctorQueue();
    } catch (error) {
      console.error("Error completing consultation:", error);
      Alert.alert(
        "Error",
        "Failed to complete consultation. Please try again."
      );
    } finally {
      setloading(false);
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
              setloading(true);
              if (!socket || !isConnected) {
                throw new Error("No socket connection available");
              }

              socket.emit("removePatient", {
                patientId,
                doctorId,
                reason: "Removed by doctor from dashboard",
              });

              // Local state will be updated through socket events
              removeFromQueue(patientId);
            } catch (error) {
              console.error("Error removing patient:", error);
              Alert.alert(
                "Error",
                "Failed to remove patient from the queue. Please try again."
              );
            } finally {
              setloading(false);
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
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {item.status === "consulting" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCompleteConsultation(item.id)}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemovePatient(item.id)}
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
          <Text style={styles.title}>
            {loading ? "Loading..." : doctorName}
          </Text>
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
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
