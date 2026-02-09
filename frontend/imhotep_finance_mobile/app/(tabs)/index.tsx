import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import NetWorthCard from '@/components/NetWorthCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import api from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// const Logo = require('@/assets/images/react-logo.png'); // Placeholder or use actual logo if available
// Assuming existing logo might be used or just text for now as I don't see the logo file in the file list clearly, 
// strictly speaking user said "shows the networth... exactly like the react app".
// I'll try to use a text logo or an icon for now to avoid missing asset issues.

export default function Dashboard() {
  const { user } = useAuth();
  const [networth, setNetworth] = useState('0');
  const [favoriteCurrency, setFavoriteCurrency] = useState('USD');
  const [score, setScore] = useState<number | null>(null);
  const [scoreTxt, setScoreTxt] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'withdraw'>('deposit');

  const fetchData = async () => {
    try {
      // 1. Fetch Networth
      const networthRes = await api.get('/api/finance-management/get-networth/');
      setNetworth(networthRes.data.networth || '0');
      if (networthRes.data.favorite_currency) {
        setFavoriteCurrency(networthRes.data.favorite_currency);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNetworth('0');
      } else {
        console.warn('Networth fetch error:', err);
      }
    }

    try {
      // 2. Fetch Favorite Currency (redundant but good backup)
      const favRes = await api.get('/api/get-fav-currency/');
      setFavoriteCurrency(favRes.data.favorite_currency || favoriteCurrency || 'USD');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn('Favorite currency fetch error:', err);
      }
    }

    try {
      // 3. Fetch Target Score
      const scoreRes = await api.get('/api/finance-management/target/get-score/');
      if (scoreRes.data.score_txt) {
        setScore(scoreRes.data.score);
        setScoreTxt(scoreRes.data.score_txt);
        setTarget(scoreRes.data.target);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setScore(null);
        setScoreTxt('');
        setTarget('');
      } else {
        console.warn('Target score fetch error:', err);
      }
    }

    // 4. Update Last Login (fire and forget)
    api.post('/api/update-last-login/').catch(() => { });

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    // Also trigger Apply Scheduled Trans
    const today = new Date().toISOString().slice(0, 10);
    // Simple check without local storage for now or could implement AsyncStorage check
    api.post('/api/finance-management/scheduled-trans/apply-scheduled-trans/').catch(() => { });
  };

  const getScoreColor = () => {
    if (score === null) return ['#f59e0b', '#d97706'] as const; // Default/Neutral
    if (score > 0) return ['#10b981', '#059669'] as const; // Positive
    if (score < 0) return ['#ef4444', '#dc2626'] as const; // Negative
    return ['#f59e0b', '#d97706'] as const; // Neutral
  };

  const scoreColors = getScoreColor();

  return (
    <View style={styles.container}>
      {/* Background Decorative Elements - Simulated with simple Views as specific blurs are heavy on RN without Expo Blur */}
      <View style={[styles.orb, { top: 50, left: -50, backgroundColor: 'rgba(54, 108, 107, 0.2)' }]} />
      <View style={[styles.orb, { top: 100, right: -50, backgroundColor: 'rgba(54, 108, 107, 0.2)' }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#366c6b" />
        }
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              {/* <Image source={Logo} style={styles.logo} resizeMode="contain" /> */}
              <Ionicons name="pie-chart" size={30} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandName}>Imhotep Finance</Text>
              <Text style={styles.brandSubtitle}>Manage your finances</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, {user?.first_name || user?.username}!</Text>
        </View>

        {/* Net Worth */}
        <NetWorthCard
          networth={networth}
          favoriteCurrency={favoriteCurrency}
          loading={loading && !refreshing && networth === '0'}
        />

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setInitialType('deposit');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="arrow-up" size={24} color="#059669" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Add Income</Text>
              <Text style={styles.actionSubtitle}>Record earnings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setInitialType('withdraw');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="arrow-down" size={24} color="#dc2626" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Add Expense</Text>
              <Text style={styles.actionSubtitle}>Track spending</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly Target Status */}
        {scoreTxt ? (
          <LinearGradient
            colors={scoreColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <View style={styles.scoreHeader}>
              <Ionicons
                name={score && score > 0 ? "trending-up" : score && score < 0 ? "trending-down" : "remove-circle"}
                size={32}
                color="white"
              />
              <Text style={styles.scoreTitle}>Monthly Target Status</Text>
            </View>
            <Text style={styles.scoreText}>{scoreTxt}</Text>

            <View style={styles.scoreStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>{target} {favoriteCurrency}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={styles.statValue}>{score && score > 0 ? '+' : ''}{score?.toFixed(0)} {favoriteCurrency}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>{score && score > 0 ? 'Above' : score && score < 0 ? 'Below' : 'On Target'}</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.getStartedCard}>
            <View style={styles.getStartedIcon}>
              <Ionicons name="rocket-outline" size={32} color="#366c6b" />
            </View>
            <Text style={styles.getStartedTitle}>Get Started</Text>
            <Text style={styles.getStartedText}>Set a monthly target in your profile to track your progress.</Text>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.getStartedButtonText}>Set Target</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Links Grid */}
        <View style={styles.linksGrid}>
          <QuickLink icon="list" title="Transactions" subtitle="View All" color="blue" href="/show_trans" />
          <QuickLink icon="calendar" title="Scheduled" subtitle="Recurring" color="indigo" href="/show_scheduled_trans" />
          <QuickLink icon="pie-chart" title="Net Worth" subtitle="Details" color="purple" href="/show_networth_details" />
          <QuickLink icon="bar-chart" title="Reports" subtitle="Analysis" color="emerald" href="/reports" />
          <QuickLink icon="person" title="Manage Target" subtitle="Goals" color="green" href="/profile" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchData();
        }}
      />
    </View>
  );
}

const QuickLink = ({ icon, title, subtitle, color, href }: any) => {
  // Mapping colors to hex
  const colorMap: any = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    purple: '#9333ea',
    emerald: '#059669',
    green: '#16a34a'
  };
  const bgMap: any = {
    blue: '#dbeafe',
    indigo: '#e0e7ff',
    purple: '#f3e8ff',
    emerald: '#d1fae5',
    green: '#dcfce7'
  };

  return (
    <TouchableOpacity
      style={styles.linkCard}
      onPress={() => {
        // Check if route exists or just navigate to profile for now if unsure
        // In a real app we would ensure these routes exist.
        // For now, only profile exists.
        if (href === '/profile') {
          router.push('/(tabs)/profile');
        } else {
          Alert.alert('Coming Soon', 'This feature is under construction for mobile.');
          // router.push(href); // Uncomment when routes exist
        }
      }}
    >
      <View style={[styles.linkIcon, { backgroundColor: bgMap[color] }]}>
        <Ionicons name={icon} size={24} color={colorMap[color]} />
      </View>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60, // Space for status bar
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: -1,
  },
  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#366c6b',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#366c6b',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  scoreCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  getStartedCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  getStartedIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#eaf6f6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  getStartedText: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#366c6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  linkCard: {
    width: (width - 48) / 2, // 2 columns with gaps
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  linkSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
});
