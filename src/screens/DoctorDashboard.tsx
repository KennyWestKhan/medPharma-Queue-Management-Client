import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useDoctorData } from "../hooks/useDoctorData";
import { useQueueOperations } from "../hooks/useQueueOperations";
import { StatsSection } from "../components/StatsSection";
import { PatientCard } from "../components/PatientCard";
import { Patient, Doctor } from "../types";

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

  const {
    doctor,
    queue,
    stats,
    loading: dataLoading,
    fetchDoctorQueue,
    updateQueue,
    updatePatientStatus,
    removePatient: removePatientFromState,
  } = useDoctorData(doctorId);

  const handleQueueChanged = (newQueue: Patient[]) => {
    updateQueue(newQueue);
  };

  const handleConsultationStarted = ({
    patient,
    doctor: consultingDoctor,
  }: {
    patient: Patient;
    doctor: Doctor;
  }) => {
    if (consultingDoctor.id === doctorId) {
      updatePatientStatus(patient.id, "consulting");
    }
  };

  const handleConsultationCompleted = ({
    patient,
    doctor: consultingDoctor,
  }: {
    patient: Patient;
    doctor: Doctor;
  }) => {
    if (consultingDoctor.id === doctorId) {
      removePatientFromState(patient.id);
    }
  };

  const handlePatientRemoved = ({ patient }: { patient: Patient }) => {
    removePatientFromState(patient.id);
    Alert.alert(
      "Patient Removed",
      `${patient.name} has been removed from the queue`
    );
  };

  const { socket, isConnected, isRoomJoined } = useSocketConnection({
    doctorId,
    onQueueChanged: handleQueueChanged,
    onConsultationStarted: handleConsultationStarted,
    onConsultationCompleted: handleConsultationCompleted,
    onPatientRemoved: handlePatientRemoved,
    onInitialDataFetch: fetchDoctorQueue,
  });

  const {
    loading: operationLoading,
    startConsultation,
    completeConsultation,
    removePatient,
  } = useQueueOperations({
    socket,
    isConnected,
    isRoomJoined,
    doctorId,
  });

  // useEffect(() => {
  //   if (isRoomJoined) {
  //     fetchDoctorQueue();
  //   }
  // }, [isRoomJoined, fetchDoctorQueue]);

  const renderPatientItem = ({
    item,
    index,
  }: {
    item: Patient;
    index: number;
  }) => (
    <PatientCard
      patient={item}
      index={index}
      onStartConsultation={startConsultation}
      onCompleteConsultation={completeConsultation}
      onRemovePatient={removePatient}
      loading={operationLoading}
    />
  );

  const loading = dataLoading || operationLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {loading ? "Loading..." : doctor.name}
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
          <Text style={styles.subtitle}>{doctor.specialization}</Text>
        </View>

        <StatsSection stats={stats} />

        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>Patient Queue</Text>
          <Text style={styles.queueSubtitle}>
            {queue.length} total patients
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading doctor profile...</Text>
            <Text style={styles.emptyStateSubtext}>
              Please wait while we fetch the latest queue and doctor details.
            </Text>
          </View>
        ) : queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No patients in queue</Text>
            <Text style={styles.emptyStateSubtext}>
              Patients will appear here when they book consultations
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
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
});

export default DoctorDashboard;
