import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface MatchStats {
  date: string;
  count: number;
}

interface MatchVolumeChartProps {
  data: MatchStats[];
}

export const MatchVolumeChart: React.FC<MatchVolumeChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Matches Over Time</ThemedText>
      <View style={styles.content}>
        {data.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <ThemedText>{formatDate(item.date)}: </ThemedText>
            <ThemedText>{item.count} matches</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MatchVolumeChart;