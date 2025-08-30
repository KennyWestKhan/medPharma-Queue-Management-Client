import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useQueue } from "../context/QueueContext";
import { getCurrentConfig, API_ENDPOINTS } from "../config/config";

type BookingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Booking"
>;
type BookingScreenRouteProp = RouteProp<RootStackParamList, "Booking">;

interface Doctor {
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

interface Props {
  navigation: BookingScreenNavigationProp;
  route: BookingScreenRouteProp;
}

const BookingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userType } = route.params;
  const { addToQueue } = useQueue();

  const [patientName, setPatientName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
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
      console.error("Error fetching doctors:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!patientName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!selectedDoctor) {
      Alert.alert("Error", "Please select a doctor");
      return;
    }

    const doctor = doctors.find((d) => d.id === selectedDoctor);
    if (!doctor) return;

    try {
      // Show loading state
      setLoading(true);

      const config = getCurrentConfig();
      const response = await fetch(
        `${config.baseURL}${API_ENDPOINTS.patients}/add-patient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: patientName.trim(),
            doctorId: selectedDoctor,
            estimatedDuration: doctor.averageConsultationTime || 30, // Use doctor's average time or default to 30
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        // Add to local queue context for immediate UI update
        addToQueue({
          patientId: result.data.patient.id,
          patientName: patientName.trim(),
          doctorId: selectedDoctor,
          doctorName: result.data.patient.doctor_name || doctor.name,
          status: result.data.patient.status || "waiting",
        });

        navigation.navigate("PatientQueue", {
          patientId: result.data.patient.id,
          doctorId: selectedDoctor,
          patientName: patientName.trim(),
          doctorName: result.data.patient.doctor_name || doctor.name,
          estimatedWaitTime: result.data.estimatedWaitTime,
          positionInQueue: result.data.patient?.positionInQueue || 0,
        });
      } else {
        throw new Error("Failed to add patient to queue");
      }
    } catch (err) {
      console.error("Error adding patient to queue:", err);
      Alert.alert(
        "Booking Error",
        err instanceof Error
          ? err.message
          : "Failed to book consultation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={fetchDoctors} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          { alignItems: "flex-start", justifyContent: "flex-start" },
        ]}
      >
        <Text style={styles.title}>Book Consultation</Text>
        <Text style={styles.subtitle}>
          Select a doctor and enter your details
        </Text>

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Select Doctor</Text>
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
                onPress={() => setSelectedDoctor(doctor.id)}
                disabled={!doctor.isAvailable}
              >
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialization}>
                    {doctor.specialization}
                  </Text>
                  <Text style={styles.doctorDetails}>
                    Fee: ₵{doctor.consultationFee} •{" "}
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

          <TouchableOpacity
            style={[
              styles.bookButton,
              (!patientName.trim() || !selectedDoctor || loading) &&
                styles.bookButtonDisabled,
            ]}
            onPress={handleBooking}
            disabled={!patientName.trim() || !selectedDoctor || loading}
          >
            {loading ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.bookButtonText}>Booking...</Text>
              </View>
            ) : (
              <Text style={styles.bookButtonText}>Book Consultation</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  formContent: {
    gap: 16,
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#374151",
  },
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
  doctorInfo: {
    flex: 1,
  },
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
  doctorSpecialization: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  doctorDetails: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 4,
  },
  doctorStatus: {
    fontSize: 13,
    color: "#4b5563",
  },
  availableText: {
    color: "#27ae60",
  },
  unavailableText: {
    color: "#e74c3c",
  },
  capacityText: {
    color: "#f39c12",
  },
  checkmark: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noDoctorsText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 20,
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
  retryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  bookButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BookingScreen;
