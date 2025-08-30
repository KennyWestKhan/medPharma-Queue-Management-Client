// components/ConnectionTest.tsx
import React from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { useSocket } from "../context/SocketContext";
import { getCurrentConfig } from "../config/config";

const ConnectionTest: React.FC = () => {
  const { isConnected, connect, disconnect, socket } = useSocket();
  const config = getCurrentConfig();

  const testConnection = async () => {
    try {
      const response = await fetch(`${config.baseURL}/health`);
      const data = await response.text();
      Alert.alert("HTTP Test", `Server responded: ${data}`);
    } catch (error: any) {
      Alert.alert("HTTP Test Failed", `Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Status</Text>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: isConnected ? "#28a745" : "#dc3545",
            },
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? "Connected" : "Disconnected"}
        </Text>
      </View>

      <Text style={styles.configText}>Server: {config.socketURL}</Text>

      {socket && <Text style={styles.socketId}>Socket ID: {socket.id}</Text>}

      {/* {connectionError && (
        <Text style={styles.errorText}>Error: {connectionError}</Text>
      )} */}

      <View style={styles.buttonContainer}>
        <Button title="Connect" onPress={connect} disabled={isConnected} />
        <Button
          title="Disconnect"
          onPress={disconnect}
          disabled={!isConnected}
        />
        <Button title="Test HTTP" onPress={testConnection} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
  },
  configText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  socketId: {
    fontSize: 12,
    color: "#007bff",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginBottom: 15,
    backgroundColor: "#f8d7da",
    padding: 10,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default ConnectionTest;
