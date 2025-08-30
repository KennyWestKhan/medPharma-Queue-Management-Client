import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import DoctorSelector from "../components/DoctorSelector";

import { StackNavigationProp } from "@react-navigation/stack";

type DoctorProfileScreenProps = {
  navigation: StackNavigationProp<any, any>;
};

const DoctorProfileScreen = ({ navigation }: DoctorProfileScreenProps) => {
  const [selectedDoctor, setSelectedDoctor] = useState("");

  const handleContinue = () => {
    if (selectedDoctor) {
      navigation.navigate("DoctorDashboard", {
        doctorId: selectedDoctor,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Doctor Profile</Text>
        <DoctorSelector
          selectedDoctor={selectedDoctor}
          onSelectDoctor={setSelectedDoctor}
        />
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedDoctor && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedDoctor}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 24 },
  continueButton: {
    marginTop: 32,
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonDisabled: { backgroundColor: "#d1d5db" },
  continueButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default DoctorProfileScreen;
