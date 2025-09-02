import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PatientStatusCardProps {
  position: number;
  status: string;
  waitTime: number;
  doctorName: string;
}

export const PatientStatusCard: React.FC<PatientStatusCardProps> = ({
  position,
  status,
  waitTime,
  doctorName,
}) => {
  const getStatusText = () => {
    switch (status) {
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
    switch (status) {
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
    if (status !== "waiting") return getStatusColor();
    if (waitTime <= 0) return "#059669"; // Green when time is up
    if (waitTime <= 5) return "#dc2626"; // Red for last 5 minutes
    if (waitTime <= 10) return "#d97706"; // Orange for last 10 minutes
    return "#374151"; // Default gray
  };

  const getWaitTimeText = () => {
    if (waitTime > 0) {
      return `${waitTime} minute${waitTime !== 1 ? "s" : ""}`;
    } else if (waitTime === 0) {
      return "You should be called soon!";
    } else {
      return "Calculating...";
    }
  };

  return (
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
            {getWaitTimeText()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Doctor:</Text>
          <Text style={styles.infoValue}>{doctorName || "Unknown"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
});
