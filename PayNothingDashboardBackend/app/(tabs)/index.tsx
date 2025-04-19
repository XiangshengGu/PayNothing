import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatCard } from '@/components/StatCard';
import { ActivityList } from '@/components/ActivityList';
import { VideoUploadChart } from '@/components/VideoUploadChart';
import { MessageVolumeChart } from '@/components/MessageVolumeChart';
import { MatchVolumeChart } from '@/components/MatchVolumeChart';
import { DAUChart } from '@/components/DAUChart';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  getTotalUsers,
  getTotalVideos,
  getTotalMessages,
  getTotalMatches,
  getRecentUsers,
  getRecentVideos,
  getRecentMessages,
  getRecentMatches,
  getVideoUploadStats,
  getMessageVolumeStats,
  getMatchVolumeStats,
  getDailyActiveUsersStats,
  getUserSignupStats,
} from '@/config/firebase';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  // Core totals
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Comparative stats
  const [weeklyNewUsers, setWeeklyNewUsers] = useState(0);
  const [avgVideosPerDay, setAvgVideosPerDay] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [activeUsers24h, setActiveUsers24h] = useState(0);

  // Time-series data
  const [videoStats, setVideoStats] = useState([]);
  const [messageStats, setMessageStats] = useState([]);
  const [matchStats, setMatchStats] = useState([]);
  const [dauStats, setDauStats] = useState([]);

  // Activities
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Chart toggle
  const chartOptions = ['Videos', 'Messages', 'Matches', 'ActiveUsers'];
  const [selectedChartIndex, setSelectedChartIndex] = useState(0);

  const [userStats, setUserStats] = useState<UploadStats[]>([]);

  // Growth rates
  const [userGrowth, setUserGrowth] = useState<number|null>(null);
  const [videoGrowth, setVideoGrowth] = useState<number|null>(null);
  const [messageGrowth, setMessageGrowth] = useState<number|null>(null);
  const [matchGrowth, setMatchGrowth] = useState<number|null>(null);

  const loadData = async () => {
    try {
      // Totals + series
      const [users, videos, messages, matches, signupSeries, vStats, mStats, mtStats, dau] = await Promise.all([
        getTotalUsers(),
        getTotalVideos(),
        getTotalMessages(),
        getTotalMatches(),
        getUserSignupStats(),
        getVideoUploadStats(),
        getMessageVolumeStats(),
        getMatchVolumeStats(),
        getDailyActiveUsersStats(),
      ]);

      setTotalUsers(users);
      setTotalVideos(videos);
      setTotalMessages(messages);
      setTotalMatches(matches);

      setUserStats(signupSeries);
      setVideoStats(vStats);
      setMessageStats(mStats);
      setMatchStats(mtStats);
      setDauStats(dau);

      // compute 7d sums
      const sumLast7 = (arr: UploadStats[]) => arr.slice(-7).reduce((s,d) => s + d.count, 0);
      const sumPrev7 = (arr: UploadStats[]) => arr.slice(-14, -7).reduce((s,d) => s + d.count, 0);

      const u7c = sumLast7(signupSeries);
      const u7p = sumPrev7(signupSeries);
      const v7c = sumLast7(vStats);
      const v7p = sumPrev7(vStats);
      const m7c = sumLast7(mStats);
      const m7p = sumPrev7(mStats);
      const mt7c = sumLast7(mtStats);
      const mt7p = sumPrev7(mtStats);

      // percent change helper
      const pct = (current: number, prev: number) =>
        prev > 0 ? ((current - prev) / prev) * 100 : (current) * 100;

      setUserGrowth(pct(u7c, u7p));
      setVideoGrowth(pct(v7c, v7p));
      setMessageGrowth(pct(m7c, m7p));
      setMatchGrowth(pct(mt7c, mt7p));

      // Comparative
      setWeeklyNewUsers(u7c);
      setAvgVideosPerDay(
        vStats.length
          ? parseFloat(
              (vStats.reduce((sum, d) => sum + d.count, 0) / vStats.length).toFixed(1)
            )
          : 0
      );
      const today = new Date().toISOString().slice(0, 10);
      setMessagesToday(
        mStats.find(d => d.date === today)?.count ?? 0
      );
      setActiveUsers24h(dau.find(d => d.date === today)?.count ?? 0);

      // Recent activity
      const [recentUsers, recentVideos, recentMessages, recentMatches] = await Promise.all([
        getRecentUsers(),
        getRecentVideos(),
        getRecentMessages(),
        getRecentMatches(),
      ]);

      const formatted = [
        ...recentUsers.map(u => ({ id: u.id, type: 'user', title: 'New User', description: `User ${u.id} joined`, timestamp: u.createdAt })),
        ...recentVideos.map(v => ({ id: v.id, type: 'video', title: 'New Video', description: v.title ? `Video "${v.title}" posted` : 'Video posted', timestamp: v.createdAt })),
        ...recentMessages.map(m => ({ id: m.id, type: 'message', title: 'New Message', description: 'Message sent', timestamp: m.timestamp })),
        ...recentMatches.map(m => ({ id: m.id, type: 'match', title: 'New Match', description: 'Match created', timestamp: m.createdAt })),
      ].sort((a, b) => b.timestamp - a.timestamp);
      setActivities(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderChart = () => {
    switch (selectedChartIndex) {
      case 0:
        return <VideoUploadChart data={videoStats} />;
      case 1:
        return <MessageVolumeChart data={messageStats} />;
      case 2:
        return <MatchVolumeChart data={matchStats} />;
      case 3:
        return <DAUChart data={dauStats} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
      </ThemedView>

      {/* Core Metrics */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Core Metrics
      </ThemedText>
      <View style={styles.metricsGrid}>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Users"
            value={totalUsers}
            icon={<IconSymbol name="person.2.fill" size={28} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Videos"
            value={totalVideos}
            icon={<IconSymbol name="film.fill" size={28} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Messages"
            value={totalMessages}
            icon={<IconSymbol name="message.fill" size={28} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Matches"
            value={totalMatches}
            icon={<IconSymbol name="heart.fill" size={28} color={tintColor} />}
          />
        </View>
      </View>

      {/* Trends */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Trends (Last 7d)
      </ThemedText>
      <View style={styles.metricsGrid}>
        <View style={styles.cardWrapper}>
          <StatCard
            title="New Users (7d)"
            value={weeklyNewUsers}
            icon={<IconSymbol name="person.crop.circle.badge.plus" size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Avg Videos/Day"
            value={avgVideosPerDay}
            icon={<IconSymbol name="chart.bar.doc.horizontal.fill" size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Messages Today"
            value={messagesToday}
            icon={<IconSymbol name="message.circle.fill" size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Active Users (24h)"
            value={activeUsers24h}
            icon={<IconSymbol name="eye.fill" size={24} color={tintColor} />}
          />
        </View>
      </View>

      {/* Time-Series Charts */}
      <View style={styles.chartBox}>
        <SegmentedControl
          values={chartOptions}
          selectedIndex={selectedChartIndex}
          onChange={e => setSelectedChartIndex(e.nativeEvent.selectedSegmentIndex)}
          style={styles.segmentControl}
        />
        <ScrollView style={styles.chartScroll}>{renderChart()}</ScrollView>
      </View>

      {/* Growth Rates */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Growth Rates (7d vs prior 7d)
      </ThemedText>
      <View style={styles.metricsGrid}>
        <View style={styles.cardWrapper}>
          <StatCard
            title="User Growth"
            value={userGrowth != null ? `${userGrowth.toFixed(1)}%` : '—'}
            icon={<IconSymbol name={userGrowth! >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Video Growth"
            value={videoGrowth != null ? `${videoGrowth.toFixed(1)}%` : '—'}
            icon={<IconSymbol name={videoGrowth! >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Message Growth"
            value={messageGrowth != null ? `${messageGrowth.toFixed(1)}%` : '—'}
            icon={<IconSymbol name={messageGrowth! >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={24} color={tintColor} />}
          />
        </View>
        <View style={styles.cardWrapper}>
          <StatCard
            title="Match Growth"
            value={matchGrowth != null ? `${matchGrowth.toFixed(1)}%` : '—'}
            icon={<IconSymbol name={matchGrowth! >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={24} color={tintColor} />}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <ThemedView style={styles.activityHeader}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
        </ThemedView>
        <ThemedView style={styles.activityContainer}>
          <ActivityList activities={activities} />
        </ThemedView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  sectionTitle: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8, color: '#888' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 },
  cardWrapper: { width: '45%', maxWidth: 180, marginBottom: 12 },
  chartBox: { height: 300, margin: 16, backgroundColor: '#1C1C1E', borderRadius: 12, overflow: 'hidden' },
  segmentControl: { margin: 12 },
  chartScroll: { flex: 1, paddingHorizontal: 16 },
  activitySection: { marginTop: 8 },
  activityHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  activityContainer: { backgroundColor: '#1C1C1E', borderRadius: 12, margin: 16, padding: 8 },
});
