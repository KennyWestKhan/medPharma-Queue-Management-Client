import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useQueue } from "../context/QueueContext";

type PatientQueueScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PatientQueue"
>;
type PatientQueueScreenRouteProp = RouteProp<
  RootStackParamList,
  "PatientQueue"
>;

interface Props {
  navigation: PatientQueueScreenNavigationProp;
  route: PatientQueueScreenRouteProp;
}

const PatientQueueScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    patientId,
    doctorId,
    patientName,
    doctorName,
    positionInQueue,
    estimatedWaitTime: initialEstimatedWaitTime,
  } = route.params;
  const { queue, removeFromQueue } = useQueue();

  const [position, setPosition] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(
    initialEstimatedWaitTime || 0
  );

  useEffect(() => {
    updateQueuePosition();
    const interval = setInterval(updateQueuePosition, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [queue]);

  const updateQueuePosition = () => {
    const doctorQueue = queue
      .filter((item) => item.doctorId === doctorId && item.status === "waiting")
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const patientIndex = doctorQueue.findIndex((item) => item.id === patientId);
    if (patientIndex !== -1) {
      setPosition(patientIndex + 1);
      // Only update estimated wait time if no initial value was provided from backend
      if (!initialEstimatedWaitTime) {
        setEstimatedWaitTime((patientIndex + 1) * 15); // 15 minutes per patient
      }
    }
  };

  const handleLeaveQueue = () => {
    Alert.alert("Leave Queue", "Are you sure you want to leave the queue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          removeFromQueue(patientId);
          navigation.navigate("RoleSelection");
        },
      },
    ]);
  };

  const getStatusColor = () => {
    if (position === 1) return "#059669"; // Green for next
    if (position <= 3) return "#d97706"; // Orange for soon
    return "#6b7280"; // Gray for waiting
  };

  const getStatusText = () => {
    if (position === 1) return "You are next!";
    if (position <= 3) return "You will be called soon";
    return "Please wait for your turn";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Queue Status</Text>
          <Text style={styles.subtitle}>Hello, {patientName}</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.positionContainer}>
            <Text style={styles.positionNumber}>{positionInQueue}</Text>
            <Text style={styles.positionLabel}>Position in Queue</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Wait:</Text>
              <Text style={styles.infoValue}>
                {estimatedWaitTime > 0
                  ? `${estimatedWaitTime} minutes`
                  : "Calculating..."}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doctor:</Text>
              <Text style={styles.infoValue}>{doctorName || "Unknown"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={updateQueuePosition}
          >
            <Text style={styles.refreshButtonText}>Refresh Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveQueue}
          >
            <Text style={styles.leaveButtonText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.queueInfo}>
          <Text style={styles.queueInfoTitle}>Queue Information</Text>
          <Text style={styles.queueInfoText}>
            • Please stay in the waiting area{"\n"}• You will be called when
            it's your turn{"\n"}• Estimated times may vary{"\n"}• You can
            refresh to see updates
          </Text>
        </View>
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
    marginBottom: 32,
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
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  positionContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  positionNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  leaveButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  queueInfo: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  queueInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 12,
  },
  queueInfoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
});

export default PatientQueueScreen;
