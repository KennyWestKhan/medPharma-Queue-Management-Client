import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { QueueProvider } from "./src/context/QueueContext";
import { SocketProvider } from "./src/context/SocketContext";

// Screens
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import PatientQueueScreen from "./src/screens/PatientQueueScreen";
import DoctorDashboard from "./src/screens/DoctorDashboard";
import BookingScreen from "./src/screens/BookingScreen";

export interface RootStackParamList {
  RoleSelection: undefined;
  Booking: { userType: "patient" | "doctor"; doctorId?: string };
  PatientQueue: {
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    estimatedWaitTime?: number;
    positionInQueue: number;
  };
  DoctorDashboard: { doctorId: string; doctorName: string };
  [key: string]: object | undefined;
}

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <SocketProvider>
        <QueueProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="RoleSelection"
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#2563eb",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "bold",
                },
              }}
            >
              <Stack.Screen
                name="RoleSelection"
                component={RoleSelectionScreen}
                options={{ title: "MedPharma - Queue Management" }}
              />
              <Stack.Screen
                name="Booking"
                component={BookingScreen}
                options={{ title: "Book Consultation" }}
              />
              <Stack.Screen
                name="PatientQueue"
                component={PatientQueueScreen}
                options={{ title: "Your Queue Status" }}
              />
              <Stack.Screen
                name="DoctorDashboard"
                component={DoctorDashboard}
                options={{ title: "Doctor Dashboard" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </QueueProvider>
      </SocketProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
