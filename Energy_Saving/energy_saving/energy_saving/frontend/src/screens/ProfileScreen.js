import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [energyData, setEnergyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    animateScreen();
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    if (!user || !user.token) return;

    setIsLoading(true);
    try {
      const summaryResponse = await axios.get(`${API_URL}/energy/summary`, {
        headers: {
          'x-auth-token': user.token
        }
      });

      if (summaryResponse.data.summary) {
        setEnergyData(summaryResponse.data.summary);
      }
    } catch (error) {
      console.error('Error fetching energy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start(() => fetchEnergyData());
  };

  const isWeb = Platform.OS === 'web' && Dimensions.get('window').width > 768;

  if (isWeb) {
    // --- RESPONSIVE WEB SETTINGS LAYOUT ---
    return (
      <Animated.View style={[styles.webContainer, { opacity: fadeAnim }]}>
        <View style={styles.webProfileHeader}>
          <Text style={styles.webProfileTitle}>Profile Settings</Text>
          <Text style={styles.webProfileSub}>Manage your account details and view energy stats</Text>
        </View>

        <View style={styles.webProfileGrid}>
          {/* Left Panel: Account Info */}
          <View style={styles.webProfileLeftCol}>
            <View style={styles.webCard}>
              <View style={styles.webAvatarRow}>
                <View style={styles.webAvatarBg}>
                  <Text style={styles.webAvatarText}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.webUsername}>{user?.username || 'User'}</Text>
                  <Text style={styles.webUserRole}>Appliance Manager</Text>
                </View>
              </View>

              <View style={styles.webFieldGroup}>
                <View style={styles.webField}>
                  <Text style={styles.webFieldLabel}>USERNAME</Text>
                  <Text style={styles.webFieldValue}>{user?.username || 'N/A'}</Text>
                </View>
                <View style={styles.webField}>
                  <Text style={styles.webFieldLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.webFieldValue}>{user?.email || 'N/A'}</Text>
                </View>
                <View style={styles.webField}>
                  <Text style={styles.webFieldLabel}>ACCOUNT CREATED</Text>
                  <Text style={styles.webFieldValue}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.webLogoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.webLogoutBtnText}>Log Out Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Panel: Energy Statistics */}
          <View style={styles.webProfileRightCol}>
            <View style={styles.webCard}>
              <View style={styles.webCardHeader}>
                <Text style={styles.webCardTitle}>Saved Consumption Stats</Text>
                <TouchableOpacity style={styles.webRefreshIconBtn} onPress={handleRefreshPress}>
                  <Ionicons name="refresh" size={18} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading consumption data...</Text>
                </View>
              ) : energyData ? (
                <View style={styles.webStatsWrapper}>
                  <View style={styles.webMetricsRow}>
                    <View style={styles.webMetricBox}>
                      <Ionicons name="flash-outline" size={24} color="#4F46E5" />
                      <Text style={styles.webMetricValue}>{energyData.dailyConsumption.toFixed(2)}</Text>
                      <Text style={styles.webMetricLabel}>Daily kWh Use</Text>
                    </View>
                    <View style={styles.webMetricBox}>
                      <Ionicons name="calendar-outline" size={24} color="#10B981" />
                      <Text style={styles.webMetricValue}>{energyData.monthlyConsumption.toFixed(2)}</Text>
                      <Text style={styles.webMetricLabel}>Monthly kWh Use</Text>
                    </View>
                  </View>

                  <View style={styles.webCostSection}>
                    <View style={styles.webCostHeader}>
                      <Ionicons name="wallet-outline" size={20} color="#10B981" />
                      <Text style={styles.webCostTitle}>Calculated Cost (Tiered INR)</Text>
                    </View>
                    <Text style={styles.webCostValue}>
                      ₹{((energyData.dailyConsumption * 30) <= 100 
                        ? (energyData.dailyConsumption * 30) * 3.45 
                        : (energyData.dailyConsumption * 30) <= 300 
                        ? 100 * 3.45 + ((energyData.dailyConsumption * 30) - 100) * 5.5 
                        : 100 * 3.45 + 200 * 5.5 + ((energyData.dailyConsumption * 30) - 300) * 7.5).toFixed(2)}
                    </Text>
                    <Text style={styles.webCostNote}>
                      Uses tiered tariff model: ₹3.45/kWh (first 100), ₹5.50/kWh (101-300), ₹7.50/kWh (>300).
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
                  <Text style={styles.noDataText}>
                    No saved database consumption data found. Update your calculator on the dashboard page.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  // --- SLEEK MOBILE LAYOUT ---
  return (
    <Animated.ScrollView
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileInitial}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.usernameText}>{user?.username || 'User'}</Text>
        <Text style={styles.emailSubText}>{user?.email || ''}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Username</Text>
          <Text style={styles.fieldValue}>{user?.username || 'N/A'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <Text style={styles.fieldValue}>{user?.email || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Energy Usage & Costs</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching database statistics...</Text>
          </View>
        ) : energyData ? (
          <>
            <View style={styles.energyStatsContainer}>
              <View style={styles.energyStat}>
                <Text style={styles.energyValue}>
                  {energyData.dailyConsumption.toFixed(2)}
                </Text>
                <Text style={styles.energyLabel}>kWh/day</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.energyStat}>
                <Text style={styles.energyValue}>
                  {energyData.monthlyConsumption.toFixed(2)}
                </Text>
                <Text style={styles.energyLabel}>kWh/month</Text>
              </View>
            </View>

            <View style={styles.estimateContainer}>
              <Text style={styles.estimateLabel}>Estimated Cost (Tiered INR):</Text>
              <Text style={styles.estimateValue}>
                ₹{((energyData.monthlyConsumption) <= 100 
                  ? (energyData.monthlyConsumption) * 3.45 
                  : (energyData.monthlyConsumption) <= 300 
                  ? 100 * 3.45 + ((energyData.monthlyConsumption) - 100) * 5.5 
                  : 100 * 3.45 + 200 * 5.5 + ((energyData.monthlyConsumption) - 300) * 7.5).toFixed(2)}
              </Text>
              <Text style={styles.estimateNote}>
                Calculated dynamically based on tiered energy slabs
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshPress}>
                <Ionicons name="refresh-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.refreshButtonText}>Refresh Statistics</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No consumption stats saved. Add appliances on the main page to populate.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9'
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5'
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  emailSubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E293B'
  },
  fieldContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  fieldLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  fieldValue: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500'
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  energyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  energyStat: {
    alignItems: 'center',
    flex: 1
  },
  energyValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5'
  },
  energyLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4
  },
  verticalDivider: {
    height: 36,
    width: 1,
    backgroundColor: '#CBD5E1'
  },
  estimateContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  estimateLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4
  },
  estimateValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4
  },
  estimateNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic'
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center'
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#EEF2F6',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 20
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold'
  },

  // --- WEB STYLES ---
  webContainer: {
    padding: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  webProfileHeader: {
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
  },
  webProfileTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  webProfileSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  webProfileGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  webProfileLeftCol: {
    flex: 1,
    marginRight: 24,
  },
  webProfileRightCol: {
    flex: 1.2,
  },
  webCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    height: '100%',
  },
  webAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  webAvatarBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  webAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  webUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  webUserRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  webFieldGroup: {
    marginBottom: 32,
  },
  webField: {
    marginBottom: 20,
  },
  webFieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  webFieldValue: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  webLogoutBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webLogoutBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  webCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  webCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  webRefreshIconBtn: {
    backgroundColor: '#EEF2F6',
    padding: 8,
    borderRadius: 8,
  },
  webStatsWrapper: {
    flex: 1,
  },
  webMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  webMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  webMetricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
  },
  webMetricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  webCostSection: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  webCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  webCostTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
    marginLeft: 8,
  },
  webCostValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  webCostNote: {
    fontSize: 12,
    color: '#047857',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default ProfileScreen;
