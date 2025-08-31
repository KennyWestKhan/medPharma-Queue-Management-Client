import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { QueueStats } from "../types";

interface StatsSectionProps {
  stats: QueueStats;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const statCards = [
    { label: "Waiting", value: stats.waiting },
    { label: "In Progress", value: stats.consulting },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <View style={styles.statsContainer}>
      {statCards.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <Text style={styles.statNumber}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
});
