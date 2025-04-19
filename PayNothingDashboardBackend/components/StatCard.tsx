import { StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText type="title" style={styles.value}>{value}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.title}>{title}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    flex: 1,
    minWidth: 150,
    maxWidth: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  value: {
    fontSize: 32,
    marginBottom: 8,
    fontWeight: '600',
    color: '#fff',
  },
  title: {
    fontSize: 15,
    textAlign: 'center',
    color: '#8E8E93',
  },
}); 