import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RoleSelection"
>;

interface Props {
  navigation: RoleSelectionScreenNavigationProp;
}

const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const handleRoleSelection = (userType: "patient" | "doctor") => {
    if (userType === "patient") {
      navigation.navigate("Booking", { userType: "patient" });
    } else {
      navigation.navigate("DoctorSelect", { userType: "doctor" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MedPharma</Text>
        <Text style={styles.subtitle}>Patient Queue Management</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, styles.patientButton]}
            onPress={() => handleRoleSelection("patient")}
          >
            <Text style={styles.roleButtonText}>I'm a Patient</Text>
            <Text style={styles.roleButtonSubtext}>Book a consultation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, styles.doctorButton]}
            onPress={() => handleRoleSelection("doctor")}
          >
            <Text style={styles.roleButtonText}>I'm a Doctor</Text>
            <Text style={styles.roleButtonSubtext}>Manage patient queue</Text>
          </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 48,
    textAlign: "center",
  },
  roleContainer: {
    width: "100%",
    gap: 20,
  },
  roleButton: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientButton: {
    backgroundColor: "#2563eb",
  },
  doctorButton: {
    backgroundColor: "#059669",
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  roleButtonSubtext: {
    fontSize: 14,
    color: "#e2e8f0",
  },
});

export default RoleSelectionScreen;
