import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Patient } from "../types";

interface PatientCardProps {
  patient: Patient;
  index: number;
  onStartConsultation: (patientId: string) => void;
  onCompleteConsultation: (patientId: string) => void;
  onRemovePatient: (patientId: string) => void;
  loading: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  index,
  onStartConsultation,
  onCompleteConsultation,
  onRemovePatient,
  loading,
}) => {
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

  return (
    <View style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientTime}>
            Joined:{" "}
            {patient.joined_at
              ? new Date(patient.joined_at).toLocaleTimeString()
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
            { backgroundColor: getStatusColor(patient.status) },
          ]}
        />
        <Text
          style={[styles.statusText, { color: getStatusColor(patient.status) }]}
        >
          {getStatusText(patient.status)} ({patient.waitingTime} mins)
        </Text>
      </View>

      <View style={styles.actionButtons}>
        {patient.status === "waiting" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => onStartConsultation(patient.id)}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {patient.status === "consulting" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onCompleteConsultation(patient.id)}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => onRemovePatient(patient.id)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  patientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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
