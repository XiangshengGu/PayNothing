import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface UploadStats {
  date: string;
  count: number;
}

interface VideoUploadChartProps {
  data: UploadStats[];
}

export const VideoUploadChart: React.FC<VideoUploadChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Video Uploads Over Time</ThemedText>
      <View style={styles.content}>
        {data.map((item, index) => (
          <View key={index} style={styles.row}>
            <ThemedText>{formatDate(item.date)}: </ThemedText>
            <ThemedText>{item.count} uploads</ThemedText>
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