import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useWaitTimer } from "../hooks/useWaitTimer";
import { usePatientSocket } from "../hooks/usePatientSocket";
import { usePatientQueue } from "../hooks/usePatientQueue";
import { PatientStatusCard } from "../components/PatientStatusCard";
import {
  PatientQueueParams,
  QueuePosition,
  SocketDoctor,
} from "../types/patient";

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
  }: PatientQueueParams = route.params;

  const [currentStatus, setCurrentStatus] = useState("waiting");
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(
    initialEstimatedWaitTime || 0
  );

  const {
    position,
    loading,
    error,
    updatePosition,
    updateQueuePosition,
    fetchEstimatedWaitTime,
    leaveQueue,
  } = usePatientQueue(patientId, doctorId, positionInQueue);

  const { waitTime, startTimer } = useWaitTimer(
    estimatedWaitTime,
    currentStatus === "waiting"
  );

  const handleQueueUpdate = useCallback(
    (data: QueuePosition) => {
      console.log("Handling queue update:", data);
      updatePosition(data.position);
      if (typeof data.estimatedWaitTime === "number") {
        setEstimatedWaitTime(data.estimatedWaitTime);
        startTimer(data.estimatedWaitTime);
      }
    },
    [updatePosition, startTimer]
  );

  const handleStatusUpdate = useCallback((status: string) => {
    setCurrentStatus(status);
  }, []);

  const handleConsultationStarted = useCallback((doctor: SocketDoctor) => {
    console.log("Consultation started with:", doctor.name);
  }, []);

  const handleConsultationCompleted = useCallback(
    (doctor: SocketDoctor) => {
      navigation.replace("ConsultationComplete", {
        doctorName: doctor.name,
        patientName,
      });
    },
    [navigation, patientName]
  );

  const handlePatientRemoved = useCallback(
    (doctor: SocketDoctor, reason?: string) => {
      navigation.reset({
        index: 0,
        routes: [{ name: "RoleSelection" }],
      });
    },
    [navigation]
  );

  const handleConnectionIssue = useCallback(() => {
    Alert.alert(
      "Connection Issue 📡",
      "We're having trouble maintaining a live connection to update your queue status. " +
        "Don't worry - you haven't lost your place! You can:\n\n" +
        "• Stay on this screen - we'll keep trying to reconnect\n" +
        "• Use the Refresh button to check your status\n" +
        "• We'll still call your name when it's your turn",
      [
        { text: "Got it", style: "default" },
        { text: "Refresh Now", onPress: handleRefresh, style: "cancel" },
      ]
    );
  }, []);

  usePatientSocket({
    patientId,
    doctorId,
    patientName,
    onQueueUpdate: handleQueueUpdate,
    onStatusUpdate: handleStatusUpdate,
    onConsultationStarted: handleConsultationStarted,
    onConsultationCompleted: handleConsultationCompleted,
    onPatientRemoved: handlePatientRemoved,
    onConnectionIssue: handleConnectionIssue,
  });

  const handleRefresh = useCallback(async () => {
    console.log("Refreshing patient queue data...");
    const newWaitTime = await fetchEstimatedWaitTime();
    setEstimatedWaitTime(newWaitTime);
    startTimer(newWaitTime);
    updateQueuePosition();
  }, [fetchEstimatedWaitTime, startTimer, updateQueuePosition]);

  const handleLeaveQueue = useCallback(() => {
    Alert.alert("Leave Queue", "Are you sure you want to leave the queue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const success = await leaveQueue("Left by user");
          if (success) {
            console.log("Successfully left queue");
            navigation.reset({
              index: 0,
              routes: [{ name: "RoleSelection" }],
            });
          } else {
            console.warn("Failed to leave queue");
          }
        },
      },
    ]);
  }, [leaveQueue, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Removing you from queue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Queue Status</Text>
          <Text style={styles.subtitle}>Hello, {patientName}</Text>
        </View>

        <PatientStatusCard
          position={position}
          status={currentStatus}
          waitTime={waitTime}
          doctorName={doctorName}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
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
            it's your turn{"\n"}• Wait time decreases every minute{"\n"}• Tap
            refresh to update from server
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
  loadingContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
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
