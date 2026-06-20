import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [averageConsumption, setAverageConsumption] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    startSpinner();
  }, []);

  const startSpinner = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const triggerEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        setError('You need to login to view the leaderboard');
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchLeaderboardData(parsedUser);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      setError('Failed to authenticate. Please log in again.');
      setLoading(false);
    }
  };

  const fetchLeaderboardData = async (userData) => {
    if (!userData || !userData.token) {
      setError('Authentication error. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const headers = {
        'x-auth-token': userData.token,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${API_URL}/energy/leaderboard`, { headers });

      setLeaderboardData(response.data.leaderboard || []);
      setAverageConsumption(response.data.averageConsumption || 0);
      setLoading(false);
      setRefreshing(false);

      triggerEntranceAnimation();
    } catch (error) {
      console.error('Error fetching leaderboard data:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load leaderboard. Please try again later.');
      }

      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'Energy Champion': return <Ionicons name="trophy" size={20} color="#FFD700" />;
      case 'Energy Master': return <Ionicons name="medal" size={20} color="#C0C0C0" />;
      case 'Energy Expert': return <Ionicons name="medal" size={20} color="#CD7F32" />;
      case 'Energy Saver': return <Ionicons name="leaf" size={20} color="#10B981" />;
      default: return <Ionicons name="person-outline" size={16} color="#64748B" />;
    }
  };

  const getRankBadgeColor = (index) => {
    if (index === 0) return '#FEF3C7'; // Gold
    if (index === 1) return '#F1F5F9'; // Silver
    if (index === 2) return '#FFE4E6'; // Bronze
    return 'transparent';
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = user && item.username === user.username;
    return (
      <Animated.View
        style={[
          styles.tableRow,
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
          isCurrentUser ? styles.currentUserRow : null,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={[styles.rankBadge, { backgroundColor: getRankBadgeColor(index) }]}>
          <Text style={[styles.rankCell, index < 3 ? styles.topRankText : null]}>{index + 1}</Text>
        </View>
        
        <View style={styles.userCell}>
          <Text style={[styles.usernameText, isCurrentUser ? styles.currentUserText : null]}>
            {item.username} {isCurrentUser ? '(You)' : ''}
          </Text>
          <View style={styles.badgeContainer}>
            {getBadgeIcon(item.badge)}
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        </View>
        
        <View style={styles.statsCell}>
          <Text style={styles.savingsText}>
            {item.savingsPercentage || 0}% saved
          </Text>
          <Text style={styles.savedEnergyText}>
            {(Number(item.energySaved) || 0).toFixed(1)} kWh
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderTableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.rankCellHeader, styles.headerText]}>Rank</Text>
      <Text style={[styles.userHeaderCell, styles.headerText]}>Energy Champion</Text>
      <Text style={[styles.statsHeaderCell, styles.headerText]}>Energy Saved</Text>
    </View>
  );

  if (loading) {
    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="refresh-circle" size={64} color="#4F46E5" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading energy champions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryBtnText}>Retry Fetch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isWeb = Platform.OS === 'web' && Dimensions.get('window').width > 768;

  if (isWeb) {
    // --- RESPONSIVE WEB LEADERBOARD LAYOUT ---
    return (
      <View style={styles.webContainer}>
        {/* Header Title Section */}
        <View style={styles.webLeaderboardHeader}>
          <View>
            <Text style={styles.webTitle}>Champions Leaderboard</Text>
            <Text style={styles.webSubtitle}>See who is saving the most energy across our platform</Text>
          </View>
          <TouchableOpacity style={styles.webRefreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.webRefreshText}>Refresh Standings</Text>
          </TouchableOpacity>
        </View>

        {/* Global Summary Info Stats Row */}
        <View style={styles.webInfoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.webInfoText}>
            Our community average energy consumption is <Text style={{ fontWeight: 'bold' }}>{(Number(averageConsumption) || 0).toFixed(2)} kWh</Text> per month. Add and optimize your appliances to save more and climb the leaderboard!
          </Text>
        </View>

        {leaderboardData.length === 0 ? (
          <View style={styles.webEmptyCard}>
            <Ionicons name="leaf-outline" size={64} color="#10B981" />
            <Text style={styles.webEmptyText}>No Champions Yet</Text>
            <Text style={styles.webEmptySub}>Be the first to calculate energy savings and claim the crown!</Text>
          </View>
        ) : (
          <View style={styles.webTableCard}>
            {/* Custom Web Header */}
            <View style={styles.webTableHeader}>
              <Text style={styles.webColRank}>RANK</Text>
              <Text style={styles.webColUser}>CHAMPION</Text>
              <Text style={styles.webColBadge}>SAVINGS BADGE</Text>
              <Text style={styles.webColSavings}>SAVINGS PERCENTAGE</Text>
              <Text style={styles.webColKwh}>ENERGY SAVED</Text>
            </View>

            {/* Custom Web Table Row List */}
            <ScrollView style={{ flex: 1 }}>
              {leaderboardData.map((item, index) => {
                const isCurrentUser = user && item.username === user.username;
                return (
                  <View 
                    key={`web-user-${index}`} 
                    style={[
                      styles.webRow, 
                      index % 2 === 0 ? styles.webRowEven : styles.webRowOdd,
                      isCurrentUser ? styles.webRowCurrent : null
                    ]}
                  >
                    <View style={styles.webColRank}>
                      <View style={[styles.webRankBadge, { backgroundColor: getRankBadgeColor(index) }]}>
                        <Text style={[styles.webRankNum, index < 3 ? styles.topRankText : null]}>{index + 1}</Text>
                      </View>
                    </View>
                    <Text style={[styles.webColUserVal, isCurrentUser ? styles.webUserCurrentText : null]}>
                      {item.username} {isCurrentUser ? '(You)' : ''}
                    </Text>
                    <View style={styles.webColBadgeVal}>
                      {getBadgeIcon(item.badge)}
                      <Text style={styles.webBadgeLabel}>{item.badge}</Text>
                    </View>
                    <Text style={styles.webColSavingsVal}>{item.savingsPercentage || 0}%</Text>
                    <Text style={styles.webColKwhVal}>{(Number(item.energySaved) || 0).toFixed(1)} kWh/m</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // --- SLEEK MOBILE LAYOUT ---
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>Energy Champions</Text>
          <Text style={styles.subtitleText}>Rankings by savings percentage</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          Average monthly use: {(Number(averageConsumption) || 0).toFixed(1)} kWh. Save more to rank higher!
        </Text>
      </View>

      {leaderboardData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>Be the first energy champion!</Text>
          <Text style={styles.emptySubText}>Save your appliances on the dashboard to rank</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={leaderboardData}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item, index) => `user-${index}`}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F1F5F9',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCard: {
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  infoText: {
    color: '#475569',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#4F46E5',
    borderBottomWidth: 2,
    borderBottomColor: '#3730A3',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankCell: {
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 13,
  },
  rankCellHeader: {
    width: 40,
    textAlign: 'center',
  },
  topRankText: {
    color: '#92400E',
  },
  userCell: {
    flex: 3,
    justifyContent: 'center',
  },
  userHeaderCell: {
    flex: 3,
    paddingLeft: 12,
  },
  statsCell: {
    flex: 2,
    alignItems: 'flex-end',
  },
  statsHeaderCell: {
    flex: 2,
    textAlign: 'right',
  },
  usernameText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#334155',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  savingsText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#10B981',
  },
  savedEnergyText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  evenRow: {
    backgroundColor: '#FCFDFE',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  currentUserRow: {
    backgroundColor: '#EEF2F6',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  currentUserText: {
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // --- WEB STYLES ---
  webContainer: {
    flex: 1,
    padding: 40,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    backgroundColor: '#F1F5F9',
  },
  webLeaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
  },
  webTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  webSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  webRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  webRefreshText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  webInfoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  webInfoText: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  webEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 64,
    alignItems: 'center',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
  },
  webEmptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
  },
  webEmptySub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  webTableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  webTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  webColRank: {
    width: 80,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
  },
  webColUser: {
    flex: 2,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
  },
  webColBadge: {
    flex: 1.5,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
  },
  webColSavings: {
    flex: 1.5,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
  },
  webColKwh: {
    flex: 1.2,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'right',
  },
  webRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  webRowEven: {
    backgroundColor: '#FCFDFE',
  },
  webRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  webRowCurrent: {
    backgroundColor: '#EEF2F6',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  webRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webRankNum: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#475569',
  },
  webColUserVal: {
    flex: 2,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  webUserCurrentText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  webColBadgeVal: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBadgeLabel: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
  },
  webColSavingsVal: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
  },
  webColKwhVal: {
    flex: 1.2,
    fontSize: 14,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '500',
  },
});

export default LeaderboardScreen;
