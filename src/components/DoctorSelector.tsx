import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getCurrentConfig, API_ENDPOINTS } from "../config/config";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  isAvailable: boolean;
  averageConsultationTime: number;
  maxDailyPatients: number;
  consultationFee: number;
  bio?: string;
  profileImageUrl?: string;
  currentPatientCount: number;
  waitingPatientCount: number;
  isAtCapacity: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DoctorSelectorProps {
  selectedDoctor: string;
  onSelectDoctor: (doctorId: string) => void;
}

const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  selectedDoctor,
  onSelectDoctor,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      const config = getCurrentConfig();
      const response = await fetch(`${config.baseURL}${API_ENDPOINTS.doctors}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.doctors) {
        setDoctors(result.data.doctors);
      } else {
        throw new Error("Failed to fetch doctors data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchDoctors} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {doctors.length === 0 ? (
        <Text style={styles.noDoctorsText}>No doctors available</Text>
      ) : (
        doctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={[
              styles.doctorOption,
              selectedDoctor === doctor.id && styles.doctorOptionSelected,
              !doctor.isAvailable && styles.doctorOptionDisabled,
            ]}
            onPress={() => onSelectDoctor(doctor.id)}
            disabled={!doctor.isAvailable}
          >
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialization}>
                {doctor.specialization}
              </Text>
              <Text style={styles.doctorDetails}>
                Fee: ₵{doctor.consultationFee} • Average Consultation Time:{" "}
                {doctor.averageConsultationTime} min
              </Text>
              <Text style={styles.doctorStatus}>
                {doctor.isAvailable ? (
                  <Text style={styles.availableText}>Available</Text>
                ) : (
                  <Text style={styles.unavailableText}>Unavailable</Text>
                )}
                {doctor.isAtCapacity && (
                  <Text style={styles.capacityText}> • At Capacity</Text>
                )}
              </Text>
            </View>
            {selectedDoctor === doctor.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  doctorOption: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doctorOptionDisabled: {
    opacity: 0.7,
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  doctorInfo: { flex: 1 },
  doctorOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  doctorSpecialization: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  doctorDetails: { fontSize: 13, color: "#4b5563", marginBottom: 4 },
  doctorStatus: { fontSize: 13, color: "#4b5563" },
  availableText: { color: "#27ae60" },
  unavailableText: { color: "#e74c3c" },
  capacityText: { color: "#f39c12" },
  checkmark: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  noDoctorsText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 20,
  },
  loadingContainer: { alignItems: "center", marginTop: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#7f8c8d" },
  errorContainer: { alignItems: "center", marginTop: 20 },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  retryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});

export default DoctorSelector;
