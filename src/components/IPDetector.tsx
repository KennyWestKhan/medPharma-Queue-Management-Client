import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Button } from "react-native";
import Constants from "expo-constants";

interface IPDetectorProps {
  onIPDetected?: (ip: string) => void;
}

const IPDetector: React.FC<IPDetectorProps> = ({ onIPDetected }) => {
  const [detectedIP, setDetectedIP] = useState<string | null>(null);
  const [detectionMethods, setDetectionMethods] = useState<string[]>([]);

  const detectIP = () => {
    const methods: string[] = [];
    let ip: string | null = null;

    // Method 1: Expo hostUri
    if (Constants.expoConfig?.hostUri) {
      const host = Constants.expoConfig.hostUri.split(":")[0];
      methods.push(`hostUri: ${host}`);
      if (!ip) ip = host;
    }

    // Method 2: debuggerHost
    if (Constants.expoConfig?.debuggerHost) {
      const host = Constants.expoConfig.debuggerHost.split(":")[0];
      methods.push(`debuggerHost: ${host}`);
      if (!ip) ip = host;
    }

    // Method 3: linkingUri
    if (Constants.linkingUri) {
      try {
        const url = new URL(Constants.linkingUri);
        methods.push(`linkingUri: ${url.hostname}`);
        if (!ip && url.hostname !== "localhost") ip = url.hostname;
      } catch (e) {
        methods.push(`linkingUri: failed to parse`);
      }
    }

    // Method 4: manifest URL (legacy)
    if (Constants.manifest?.debuggerHost) {
      const host = Constants.manifest.debuggerHost.split(":")[0];
      methods.push(`manifest.debuggerHost: ${host}`);
      if (!ip) ip = host;
    }

    setDetectionMethods(methods);

    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      setDetectedIP(ip);
      onIPDetected?.(ip);
    } else {
      setDetectedIP(null);
    }
  };

  const showAllMethods = () => {
    Alert.alert(
      "Detection Methods",
      detectionMethods.join("\n\n") || "No methods found",
      [{ text: "OK" }]
    );
  };

  const manualIPInput = () => {
    Alert.prompt(
      "Enter Server IP",
      "Enter your computer's IP address manually:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: (ip) => {
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
              setDetectedIP(ip);
              onIPDetected?.(ip);
            } else {
              Alert.alert("Invalid IP", "Please enter a valid IP address");
            }
          },
        },
      ],
      "plain-text",
      "192.168.1.100"
    );
  };

  useEffect(() => {
    detectIP();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IP Detection</Text>

      {detectedIP ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Detected IP: {detectedIP}</Text>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Could not auto-detect IP</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Retry Detection" onPress={detectIP} />
        <Button title="Show Methods" onPress={showAllMethods} />
        <Button title="Manual Input" onPress={manualIPInput} />
      </View>

      <Text style={styles.debugInfo}>
        Debug Info:
        {"\n"}hostUri: {Constants.expoConfig?.hostUri || "N/A"}
        {"\n"}debuggerHost: {Constants.expoConfig?.debuggerHost || "N/A"}
        {"\n"}linkingUri: {Constants.linkingUri || "N/A"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f8f9fa",
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  successContainer: {
    backgroundColor: "#d4edda",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  successText: {
    color: "#155724",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#f8d7da",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  errorText: {
    color: "#721c24",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  debugInfo: {
    fontSize: 10,
    color: "#6c757d",
    backgroundColor: "#e9ecef",
    padding: 8,
    borderRadius: 4,
  },
});

export default IPDetector;
