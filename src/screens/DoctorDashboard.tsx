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
  const { doctorId, doctorName } = route.params;
  const { queue, updateQueueStatus, removeFromQueue } = useQueue();

  const [doctorQueue, setDoctorQueue] = useState<any[]>([]);

  useEffect(() => {
    updateDoctorQueue();
  }, [queue, doctorId]);

  const updateDoctorQueue = () => {
    const filteredQueue = queue
      .filter((item) => item.doctorId === doctorId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setDoctorQueue(filteredQueue);
  };

  const handleStartConsultation = (patientId: string) => {
    updateQueueStatus(patientId, "in-progress");
    Alert.alert(
      "Consultation Started",
      "Patient consultation is now in progress."
    );
  };

  const handleCompleteConsultation = (patientId: string) => {
    updateQueueStatus(patientId, "completed");
    Alert.alert(
      "Consultation Completed",
      "Patient consultation has been completed."
    );
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
          onPress: () => {
            removeFromQueue(patientId);
            Alert.alert(
              "Patient Removed",
              "Patient has been removed from the queue."
            );
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "#f59e0b";
      case "in-progress":
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
      case "in-progress":
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
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.patientTime}>
            Joined: {item.timestamp.toLocaleTimeString()}
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
          {getStatusText(item.status)}
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

        {item.status === "in-progress" && (
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

  const waitingCount = doctorQueue.filter(
    (item) => item.status === "waiting"
  ).length;
  const inProgressCount = doctorQueue.filter(
    (item) => item.status === "in-progress"
  ).length;
  const completedCount = doctorQueue.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Doctor Dashboard</Text>
          <Text style={styles.subtitle}>{doctorName}</Text>
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

        {doctorQueue.length === 0 ? (
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
