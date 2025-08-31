import React, { useEffect, useState, useRef } from "react";
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
import { useQueue } from "../context/QueueContext";
import { useSocket } from "../context/SocketContext";
import { API_ENDPOINTS, getCurrentConfig } from "../config/config";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(positionInQueue || 0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(
    initialEstimatedWaitTime || 0
  );

  const waitTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentStatus, setCurrentStatus] = useState("waiting");
  const { socket, isConnected } = useSocket();

  // Socket connection and event listeners
  useEffect(() => {
    if (isConnected && socket) {
      // Join patient's private and doctor-patient rooms
      socket.emit("joinPatientRoom", { patientId });

      // Listen for queue updates in patient's private room
      socket.on("queueUpdate", (data) => {
        if (data && data.position !== undefined) {
          setPosition(data.position);
          setEstimatedWaitTime(data.estimatedWaitTime || 0);
        }
      });

      // Listen for consultation status updates
      socket.on("consultationStarted", ({ patient, doctor }) => {
        if (patient.id === patientId) {
          setCurrentStatus("consulting");
          Alert.alert(
            "Consultation Starting",
            `Dr. ${doctor.name} is ready to see you now.`
          );
        }
      });

      socket.on("consultationCompleted", ({ patient, doctor }) => {
        if (patient.id === patientId) {
          setCurrentStatus("completed");
          Alert.alert(
            "Consultation Completed",
            `Your consultation with Dr. ${doctor.name} has been completed.`
          );
          navigation.replace("ConsultationComplete", {
            doctorName: doctor.name,
            patientName,
          });
        }
      });

      socket.on("patientRemoved", ({ patient, doctor, reason }) => {
        if (patient.id === patientId) {
          setCurrentStatus("removed");
          Alert.alert(
            "Removed from Queue",
            `You have been removed from Dr. ${doctor.name}'s queue${
              reason ? `\nReason: ${reason}` : ""
            }`
          );
          navigation.reset({
            index: 0,
            routes: [{ name: "RoleSelection" }],
          });
        }
      });

      // Cleanup function
      return () => {
        socket.off("queueUpdate");
        socket.off("consultationStarted");
        socket.off("consultationCompleted");
        socket.off("patientRemoved");
      };
    } else {
      Alert.alert(
        "Connection Issue 📡",
        "We're having trouble maintaining a live connection to update your queue status. " +
          "Don't worry - you haven't lost your place! You can:\n\n" +
          "• Stay on this screen - we'll keep trying to reconnect\n" +
          "• Use the Refresh button to check your status\n" +
          "• We'll still call your name when it's your turn",
        [
          {
            text: "Got it",
            style: "default",
          },
          {
            text: "Refresh Now",
            onPress: handleRefresh,
            style: "cancel",
          },
        ]
      );
    }
  }, [isConnected, socket, patientId, doctorId, navigation, patientName]);

  // Start wait time countdown (decreases every minute)
  useEffect(() => {
    updateQueuePosition();

    // Start the countdown timer if there's a wait time
    if (estimatedWaitTime > 0 && currentStatus === "waiting") {
      // Clear any existing interval
      if (waitTimeIntervalRef.current) {
        clearInterval(waitTimeIntervalRef.current);
      }

      // Set up interval to decrease every minute
      waitTimeIntervalRef.current = setInterval(() => {
        setEstimatedWaitTime((prevTime) => {
          const newTime = prevTime - 1;

          if (newTime <= 0) {
            Alert.alert(
              "Time's Up! 🔔",
              "Your estimated wait time has elapsed. You should be called soon!",
              [{ text: "OK" }]
            );

            if (waitTimeIntervalRef.current) {
              clearInterval(waitTimeIntervalRef.current);
              waitTimeIntervalRef.current = null;
            }

            return 0;
          }

          return newTime;
        });
      }, 60000); // 60000ms = 1 minute
    }

    // Cleanup function
    return () => {
      if (waitTimeIntervalRef.current) {
        clearInterval(waitTimeIntervalRef.current);
        waitTimeIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    updateQueuePosition();
  }, [queue]);

  const config = getCurrentConfig();

  const fetchEstimatedWaitTime = async () => {
    try {
      const response = await fetch(
        `${config.baseURL}${API_ENDPOINTS.doctors}/${doctorId}/estimated-wait-time`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newWaitTime = result.data.estimatedWaitTime;
          setEstimatedWaitTime(newWaitTime);

          // Restart the countdown with new time
          if (waitTimeIntervalRef.current) {
            clearInterval(waitTimeIntervalRef.current);
          }

          if (newWaitTime > 0) {
            waitTimeIntervalRef.current = setInterval(() => {
              setEstimatedWaitTime((prevTime) => {
                const newTime = prevTime - 1;

                if (newTime <= 0) {
                  Alert.alert(
                    "Time's Up! 🔔",
                    "Your estimated wait time has elapsed. You should be called soon!",
                    [{ text: "OK" }]
                  );

                  if (waitTimeIntervalRef.current) {
                    clearInterval(waitTimeIntervalRef.current);
                    waitTimeIntervalRef.current = null;
                  }

                  return 0;
                }

                return newTime;
              });
            }, 60000);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching estimated wait time:", error);
    }
  };

  const updateQueuePosition = () => {
    const doctorQueue = queue
      .filter((item) => item.doctorId === doctorId && item.status === "waiting")
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const patientIndex = doctorQueue.findIndex((item) => item.id === patientId);
    if (patientIndex !== -1) {
      const newPosition = patientIndex + 1;
      setPosition(newPosition);
    }
  };

  const handleRefresh = () => {
    updateQueuePosition();
    fetchEstimatedWaitTime();
  };

  const leaveQueue = async (patientId: string, reason: string) => {
    try {
      setLoading(true);
      console.log("i am here making request");
      const response = await fetch(
        `${config.baseURL}${API_ENDPOINTS.patients}/${patientId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reason ? { reason } : {}),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Removed from queue:", data);
        return data;
      } else {
        console.warn("Error:", data);
        Alert.alert(
          "Failed to remove you from queue",
          `${data?.message} Please try again later`,
          [{ text: "OK" }]
        );
        return null;
      }
    } catch (error) {
      console.error("Error removing patient:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch doctors"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = () => {
    Alert.alert("Leave Queue", "Are you sure you want to leave the queue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          // if (waitTimeIntervalRef.current) {
          //   clearInterval(waitTimeIntervalRef.current);
          // }

          const result = await leaveQueue(patientId, "Left by user");

          if (result) {
            console.log("Successfully removed:", result);
            removeFromQueue(patientId);
            console.log("going back");
            navigation.reset({
              index: 0,
              routes: [{ name: "RoleSelection" }],
            });
          } else {
            console.warn("Failed to remove from queue");
          }
        },
      },
    ]);
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case "consulting":
        return "In consultation";
      case "completed":
        return "Consultation completed";
      case "removed":
        return "Removed from queue";
      default:
        if (position === 1) return "You are next!";
        if (position <= 3) return "You will be called soon";
        return "Please wait for your turn";
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case "consulting":
        return "#2563eb"; // Blue
      case "completed":
        return "#059669"; // Green
      case "removed":
        return "#dc2626"; // Red
      default:
        if (position === 1) return "#059669"; // Green for next
        if (position <= 3) return "#d97706"; // Orange for soon
        return "#6b7280"; // Gray for waiting
    }
  };

  const getWaitTimeColor = () => {
    if (currentStatus !== "waiting") return getStatusColor();
    if (estimatedWaitTime <= 0) return "#059669"; // Green when time is up
    if (estimatedWaitTime <= 5) return "#dc2626"; // Red for last 5 minutes
    if (estimatedWaitTime <= 10) return "#d97706"; // Orange for last 10 minutes
    return "#374151"; // Default gray
  };

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

        <View style={styles.statusCard}>
          <View style={styles.positionContainer}>
            <Text style={styles.positionNumber}>{position}</Text>
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
              <Text style={[styles.infoValue, { color: getWaitTimeColor() }]}>
                {estimatedWaitTime > 0
                  ? `${estimatedWaitTime} minute${
                      estimatedWaitTime !== 1 ? "s" : ""
                    }`
                  : estimatedWaitTime === 0
                  ? "You should be called soon!"
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
  loadingContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "center",
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
