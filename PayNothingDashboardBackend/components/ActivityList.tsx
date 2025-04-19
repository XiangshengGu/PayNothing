import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ActivityItem {
  id: string;
  type: 'user' | 'video' | 'message' | 'match';
  title: string;
  description: string;
  timestamp: Date;
}

interface ActivityListProps {
  activities: ActivityItem[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const renderItem = ({ item }: { item: ActivityItem }) => (
    <ThemedView style={styles.item}>
      <View style={styles.contentContainer}>
        <ThemedText type="defaultSemiBold" style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      </View>
      <ThemedText style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleDateString()}
      </ThemedText>
    </ThemedView>
  );

  if (activities.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No recent activity</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
  },
  timestamp: {
    fontSize: 12,
    color: '#636366',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#636366',
    fontSize: 14,
  },
}); 