import React, { useState, useEffect } from "react";
import {
    Modal,
    TouchableOpacity,
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    Alert,
    Linking,
    ActivityIndicator,
    SafeAreaView,
    Image,
    Platform,
    Dimensions
} from "react-native";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ProfileScreen from "./ProfileScreen";
import LeaderboardScreen from "./LeaderboardScreen";
import ChatbotScreen from "./ChatbotScreen";
import RateUsScreen from './RateUsScreen'; 
import { API_URL } from "../config";

const Tab = createBottomTabNavigator();

const HomeScreenContent = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [appliances, setAppliances] = useState([
        { id: 1, name: "Refrigerator", powerConsumption: 150, hours: 24 },
        { id: 2, name: "Air Conditioner", powerConsumption: 1500, hours: 8 },
        { id: 3, name: "Television", powerConsumption: 100, hours: 4 },
        { id: 4, name: "Washing Machine", powerConsumption: 500, hours: 0.5 },
        { id: 5, name: "Microwave", powerConsumption: 1000, hours: 0.0 },
        { id: 6, name: "Light Bulb", powerConsumption: 60, hours: 6 },
        { id: 7, name: "Water Heater", powerConsumption: 2000, hours: 2 },
        { id: 8, name: "Computer", powerConsumption: 300, hours: 5 },
    ]);
    const [energySummary, setEnergySummary] = useState({
        dailyConsumption: 0,
        monthlyConsumption: 0,
        estimatedBill: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [tipModalVisible, setTipModalVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState("Unplug electronics when not in use to avoid 'phantom' energy usage.");
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newApplianceName, setNewApplianceName] = useState("");
    const [newAppliancePower, setNewAppliancePower] = useState("");
    const [newApplianceHours, setNewApplianceHours] = useState("");
    const [nextApplianceId, setNextApplianceId] = useState(9);

    const energySavingTips = [
        "Turn off lights when you leave a room to save up to 15% on your energy bill.",
        "Use LED bulbs which use 75% less energy than incandescent lighting.",
        "Unplug electronics when not in use to avoid 'phantom' energy usage.",
        "Set your thermostat 7-10 degrees lower for 8 hours a day to save up to 10% annually.",
        "Wash clothes in cold water to save up to 90% of the energy used in washing.",
        "Use a programmable thermostat to automatically adjust temperatures when you're away.",
        "Clean or replace air filters regularly to improve efficiency by 5-15%.",
        "Air dry clothes instead of using a dryer to save 700+ pounds of carbon dioxide annually.",
        "Use power strips to easily cut power to multiple devices when not in use.",
        "Keep your refrigerator coils clean to improve efficiency by up to 30%.",
    ];

    const showRandomTip = () => {
        const randomIndex = Math.floor(Math.random() * energySavingTips.length);
        setCurrentTip(energySavingTips[randomIndex]);
        setTipModalVisible(true);
    };

    const nextRandomTipInline = () => {
        const randomIndex = Math.floor(Math.random() * energySavingTips.length);
        setCurrentTip(energySavingTips[randomIndex]);
    };

    useEffect(() => {
        if (user && user.token) fetchUserData();
    }, [user]);

    // Automatically calculate initially
    useEffect(() => {
        calculateEnergyConsumption();
    }, [appliances]);

    const fetchUserData = async () => {
        if (!user || !user.token) return;

        setIsLoading(true);
        try {
            const appliancesResponse = await axios.get(`${API_URL}/energy/appliances`, {
                headers: { "x-auth-token": user.token },
            });
            if (appliancesResponse.data.appliances && appliancesResponse.data.appliances.length > 0) {
                setAppliances(appliancesResponse.data.appliances);
                const maxId = appliancesResponse.data.appliances.reduce(
                    (max, app) => Math.max(max, app.id),
                    0
                );
                setNextApplianceId(maxId + 1);
            }

            const summaryResponse = await axios.get(`${API_URL}/energy/summary`, {
                headers: { "x-auth-token": user.token },
            });
            if (summaryResponse.data.summary) {
                setEnergySummary(summaryResponse.data.summary);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            if (error.response?.status === 401) {
                Alert.alert("Authentication Error", "Please log in again.", [{ text: "OK", onPress: () => logout() }]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateApplianceValue = (id, field, value) => {
        const updatedAppliances = appliances.map((appliance) =>
            appliance.id === id ? { ...appliance, [field]: parseFloat(value) || 0 } : appliance
        );
        setAppliances(updatedAppliances);
    };

    const calculateEnergyConsumption = () => {
        let dailyTotal = 0;

        appliances.forEach((appliance) => {
            const dailyEnergy = (appliance.powerConsumption * appliance.hours) / 1000;
            dailyTotal += dailyEnergy;
        });

        const monthlyTotal = dailyTotal * 30;

        let estimatedBill = 0;
        if (monthlyTotal <= 100) {
            estimatedBill = monthlyTotal * 3.45;
        } else if (monthlyTotal <= 300) {
            estimatedBill = 100 * 3.45 + (monthlyTotal - 100) * 5.5;
        } else {
            estimatedBill = 100 * 3.45 + 200 * 5.5 + (monthlyTotal - 300) * 7.5;
        }

        setEnergySummary({
            dailyConsumption: dailyTotal,
            monthlyConsumption: monthlyTotal,
            estimatedBill,
        });
    };

    const saveApplianceData = async () => {
        if (!user?.token) return Alert.alert("Error", "Please login to save data.");

        setIsSaving(true);
        try {
            const response = await axios.post(
                `${API_URL}/energy/appliances`,
                { appliances },
                { headers: { "x-auth-token": user.token, "Content-Type": "application/json" } }
            );
            if (response.data.success && response.data.summary) {
                setEnergySummary(response.data.summary);
                Alert.alert("Success", "Your energy data has been saved");
            } else {
                Alert.alert("Error", response.data.message || "Failed to save data");
            }
        } catch (error) {
            console.error("Error saving appliances:", error);
            if (error.response?.status === 401) {
                Alert.alert("Session Expired", "Please log in again.", [{ text: "OK", onPress: () => logout() }]);
            } else {
                Alert.alert("Error", "Failed to save your energy data");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAppliance = () => {
        setIsAddModalVisible(true);
        setNewApplianceName("");
        setNewAppliancePower("");
        setNewApplianceHours("");
    };

    const confirmAddAppliance = () => {
        if (!newApplianceName.trim() || isNaN(parseFloat(newAppliancePower)) || isNaN(parseFloat(newApplianceHours))) {
            Alert.alert("Error", "Please enter valid inputs.");
            return;
        }

        const newAppliance = {
            id: nextApplianceId,
            name: newApplianceName.trim(),
            powerConsumption: parseFloat(newAppliancePower),
            hours: parseFloat(newApplianceHours),
        };

        setAppliances([...appliances, newAppliance]);
        setNextApplianceId(nextApplianceId + 1);
        setIsAddModalVisible(false);
    };

    const handleRemoveAppliance = (id) => {
        Alert.alert("Remove Appliance", "Are you sure you want to remove this appliance?", [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: () => setAppliances(appliances.filter((a) => a.id !== id)) },
        ]);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading your energy data...</Text>
            </View>
        );
    }

    const isWeb = Platform.OS === 'web' && Dimensions.get('window').width > 768;

    if (isWeb) {
        // --- RESPONSIVE WEB DASHBOARD LAYOUT ---
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.webContainer}>
                    {/* Welcome Header */}
                    <View style={styles.webHeader}>
                        <View>
                            <Text style={styles.webWelcomeText}>Welcome back,</Text>
                            <Text style={styles.webUsernameText}>{user ? user.username : "Guest"}</Text>
                        </View>
                        <View style={styles.webHeaderActions}>
                            <TouchableOpacity style={styles.webChatbotButton} onPress={() => navigation.navigate("Chatbot")}>
                                <Ionicons name="chatbubbles-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                                <Text style={styles.webChatbotText}>AI Chatbot Assistant</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.webLogoutButton} onPress={logout}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Main Content Grid */}
                    <View style={styles.webGrid}>
                        {/* Left Column: Appliance List and Controls */}
                        <View style={styles.webLeftCol}>
                            <View style={styles.dashboardCard}>
                                <View style={styles.webCardHeader}>
                                    <View>
                                        <Text style={styles.webCardTitle}>Appliance Calculator</Text>
                                        <Text style={styles.webCardSubtitle}>Add and edit appliances to calculate energy draw</Text>
                                    </View>
                                    <TouchableOpacity style={styles.webAddButton} onPress={handleAddAppliance}>
                                        <Ionicons name="add" size={20} color="#fff" />
                                        <Text style={styles.webAddButtonText}>Add New</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.webApplianceGrid}>
                                    {appliances.map((appliance) => (
                                        <View key={appliance.id} style={styles.webApplianceCard}>
                                            <View style={styles.webApplianceHeader}>
                                                <Text style={styles.webApplianceName}>{appliance.name}</Text>
                                                <TouchableOpacity onPress={() => handleRemoveAppliance(appliance.id)}>
                                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.webInputsRow}>
                                                <View style={styles.webInputBox}>
                                                    <Text style={styles.webLabel}>Watts</Text>
                                                    <TextInput
                                                        style={styles.webInput}
                                                        keyboardType="numeric"
                                                        value={appliance.powerConsumption.toString()}
                                                        onChangeText={(val) => updateApplianceValue(appliance.id, "powerConsumption", val)}
                                                    />
                                                </View>
                                                <View style={styles.webInputBox}>
                                                    <Text style={styles.webLabel}>Hours/Day</Text>
                                                    <TextInput
                                                        style={styles.webInput}
                                                        keyboardType="decimal-pad"
                                                        value={appliance.hours.toString()}
                                                        onChangeText={(val) => updateApplianceValue(appliance.id, "hours", val)}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.webActionRow}>
                                    <TouchableOpacity style={styles.webSaveButton} onPress={saveApplianceData}>
                                        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.webSaveText}>Save Configurations</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Right Column: Summaries & Dynamic Tip Panel */}
                        <View style={styles.webRightCol}>
                            {/* Summary Card */}
                            <View style={[styles.dashboardCard, styles.webSummaryBg]}>
                                <Text style={styles.webSummaryTitle}>Energy Overview</Text>
                                <View style={styles.webMetricGrid}>
                                    <View style={styles.webMetricCard}>
                                        <Text style={styles.webMetricVal}>{energySummary.dailyConsumption.toFixed(2)}</Text>
                                        <Text style={styles.webMetricLabel}>Daily kWh</Text>
                                    </View>
                                    <View style={styles.webMetricCard}>
                                        <Text style={styles.webMetricVal}>{energySummary.monthlyConsumption.toFixed(2)}</Text>
                                        <Text style={styles.webMetricLabel}>Monthly kWh</Text>
                                    </View>
                                </View>
                                <View style={styles.webBillSection}>
                                    <Text style={styles.webBillTitle}>Estimated Monthly Cost</Text>
                                    <Text style={styles.webBillVal}>₹ {energySummary.estimatedBill.toFixed(2)}</Text>
                                    <Text style={styles.webBillSub}>Calculated dynamically based on tiered energy slabs</Text>
                                </View>
                            </View>

                            {/* Inline Tips Panel */}
                            <View style={styles.dashboardCard}>
                                <View style={styles.tipHeader}>
                                    <Ionicons name="leaf" size={24} color="#10B981" />
                                    <Text style={styles.tipCardTitle}>Energy Saving Tip</Text>
                                </View>
                                <Text style={styles.tipCardText}>"{currentTip}"</Text>
                                <TouchableOpacity style={styles.tipNextBtn} onPress={nextRandomTipInline}>
                                    <Text style={styles.tipNextBtnText}>Next Tip</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Add Appliance Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isAddModalVisible}
                    onRequestClose={() => setIsAddModalVisible(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.webModalView}>
                            <Text style={styles.modalTitle}>Add New Appliance</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Appliance Name (e.g. Microwave)"
                                value={newApplianceName}
                                onChangeText={setNewApplianceName}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Power Consumption (Watts)"
                                keyboardType="numeric"
                                value={newAppliancePower}
                                onChangeText={setNewAppliancePower}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Average Hours / Day"
                                keyboardType="decimal-pad"
                                value={newApplianceHours}
                                onChangeText={setNewApplianceHours}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsAddModalVisible(false)}>
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalAddButton} onPress={confirmAddAppliance}>
                                    <Text style={styles.modalButtonText}>Add Appliance</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        );
    }

    // --- SLEEK MOBILE LAYOUT ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollViewContent}>
                {/* Header Welcome Box */}
                <View style={styles.mobileWelcomeCard}>
                    <View style={styles.mobileUserRow}>
                        <View>
                            <Text style={styles.mobileGreet}>Welcome back,</Text>
                            <Text style={styles.mobileUsername}>{user ? user.username : "Guest"}</Text>
                        </View>
                        <TouchableOpacity style={styles.mobileChatCircle} onPress={() => navigation.navigate("Chatbot")}>
                            <Ionicons name="chatbubbles" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Consumption Summary Metric Card */}
                <View style={styles.mobileSummaryCard}>
                    <Text style={styles.mobileSummaryTitle}>Power Usage Overview</Text>
                    <View style={styles.mobileMetricsRow}>
                        <View style={styles.mobileMetricItem}>
                            <Text style={styles.mobileMetricValue}>{energySummary.dailyConsumption.toFixed(2)}</Text>
                            <Text style={styles.mobileMetricUnit}>kWh / Day</Text>
                        </View>
                        <View style={styles.mobileDivider} />
                        <View style={styles.mobileMetricItem}>
                            <Text style={styles.mobileMetricValue}>{energySummary.monthlyConsumption.toFixed(2)}</Text>
                            <Text style={styles.mobileMetricUnit}>kWh / Month</Text>
                        </View>
                    </View>
                    <View style={styles.mobileBillWrapper}>
                        <Text style={styles.mobileBillLabel}>Est. Bill Cost: </Text>
                        <Text style={styles.mobileBillVal}>₹ {energySummary.estimatedBill.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Appliances Section */}
                <View style={styles.mobileListCard}>
                    <View style={styles.mobileSectionHeader}>
                        <Text style={styles.mobileSectionTitle}>Appliances Calculator</Text>
                        <TouchableOpacity style={styles.mobileAddBtn} onPress={handleAddAppliance}>
                            <Ionicons name="add-circle" size={22} color="#4F46E5" />
                            <Text style={styles.mobileAddBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mobileApplianceList}>
                        {appliances.map((appliance) => (
                            <View key={appliance.id} style={styles.mobileApplianceItem}>
                                <View style={styles.mobileApplianceInfo}>
                                    <Text style={styles.mobileApplianceName}>{appliance.name}</Text>
                                    <View style={styles.mobileInputGroup}>
                                        <View style={styles.mobileInputSubGroup}>
                                            <Text style={styles.mobileSubLabel}>Watts</Text>
                                            <TextInput
                                                style={styles.mobileSmallInput}
                                                keyboardType="numeric"
                                                value={appliance.powerConsumption.toString()}
                                                onChangeText={(val) => updateApplianceValue(appliance.id, "powerConsumption", val)}
                                            />
                                        </View>
                                        <View style={styles.mobileInputSubGroup}>
                                            <Text style={styles.mobileSubLabel}>Hours</Text>
                                            <TextInput
                                                style={styles.mobileSmallInput}
                                                keyboardType="decimal-pad"
                                                value={appliance.hours.toString()}
                                                onChangeText={(val) => updateApplianceValue(appliance.id, "hours", val)}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.mobileRemoveBtn} onPress={() => handleRemoveAppliance(appliance.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.mobileActionContainer}>
                        <TouchableOpacity style={styles.mobileSaveBtn} onPress={saveApplianceData}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.mobileSaveText}>Save to Supabase Cloud</Text>}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.mobileTipBtn} onPress={showRandomTip}>
                            <Ionicons name="bulb-outline" size={20} color="#4F46E5" />
                            <Text style={styles.mobileTipText}>Show Tip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Tip Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={tipModalVisible}
                onRequestClose={() => setTipModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={styles.modalTipIconBg}>
                            <Ionicons name="leaf" size={36} color="#10B981" />
                        </View>
                        <Text style={styles.tipTitle}>Green Saving Tip</Text>
                        <Text style={styles.tipText}>"{currentTip}"</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setTipModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Great, thanks!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Appliance Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isAddModalVisible}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add New Appliance</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Appliance Name"
                            value={newApplianceName}
                            onChangeText={setNewApplianceName}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Power (Watts)"
                            keyboardType="numeric"
                            value={newAppliancePower}
                            onChangeText={setNewAppliancePower}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Hours / day"
                            keyboardType="decimal-pad"
                            value={newApplianceHours}
                            onChangeText={setNewApplianceHours}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsAddModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalAddButton} onPress={confirmAddAppliance}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const BottomNavigation = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Leaderboard') {
                        iconName = focused ? 'trophy' : 'trophy-outline';
                    } else if (route.name === 'Chatbot') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Rate Us') {
                        iconName = focused ? 'star' : 'star-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4F46E5',
                tabBarInactiveTintColor: 'gray',
                headerShown: Platform.OS !== 'web',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    backgroundColor: '#FFFFFF',
                    height: Platform.OS === 'web' ? 0 : 60, // Hide bottom tab bar on desktop web
                    display: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? 'none' : 'flex'
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreenContent} options={{ headerTitle: 'Energy Saving Hub' }} />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerTitle: 'Profile Settings' }}
            />
            <Tab.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{ headerTitle: 'Champions Leaderboard' }}
            />
            <Tab.Screen
                name="Chatbot"
                component={ChatbotScreen}
                options={{ headerTitle: 'Energy AI Chatbot' }}
            />
            <Tab.Screen
                name="Rate Us"
                component={RateUsScreen}
                options={{ headerTitle: 'Rate Our App' }}
            />
        </Tab.Navigator>
    );
};

const HomeScreen = () => {
    return <BottomNavigation />;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F1F5F9",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#475569",
        fontWeight: "500"
    },
    mainScrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 30,
    },
    
    // --- MOBILE DESIGN STYLES ---
    mobileWelcomeCard: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    mobileUserRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    mobileGreet: {
        color: "#94A3B8",
        fontSize: 14,
    },
    mobileUsername: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 4,
    },
    mobileChatCircle: {
        backgroundColor: "#4F46E5",
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: "center",
        alignItems: "center",
    },
    mobileSummaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mobileSummaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1E293B",
        marginBottom: 16,
    },
    mobileMetricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    mobileMetricItem: {
        flex: 1,
        alignItems: "center",
    },
    mobileMetricValue: {
        fontSize: 26,
        fontWeight: "800",
        color: "#4F46E5",
    },
    mobileMetricUnit: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },
    mobileDivider: {
        width: 1,
        height: 40,
        backgroundColor: "#E2E8F0",
    },
    mobileBillWrapper: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF2F6",
        borderRadius: 10,
        padding: 12,
    },
    mobileBillLabel: {
        fontSize: 14,
        color: "#475569",
    },
    mobileBillVal: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#10B981",
    },
    mobileListCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mobileSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    mobileSectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1E293B",
    },
    mobileAddBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2F6",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    mobileAddBtnText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#4F46E5",
        marginLeft: 4,
    },
    mobileApplianceList: {
        marginBottom: 20,
    },
    mobileApplianceItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    mobileApplianceInfo: {
        flex: 1,
        marginRight: 10,
    },
    mobileApplianceName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
    },
    mobileInputGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    mobileInputSubGroup: {
        flex: 1,
        marginRight: 12,
    },
    mobileSubLabel: {
        fontSize: 10,
        color: "#94A3B8",
        marginBottom: 4,
    },
    mobileSmallInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 13,
        color: "#334155",
        backgroundColor: "#F8FAFC",
    },
    mobileRemoveBtn: {
        padding: 8,
    },
    mobileActionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    mobileSaveBtn: {
        flex: 2,
        backgroundColor: "#4F46E5",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    mobileSaveText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "bold",
    },
    mobileTipBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#4F46E5",
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    mobileTipText: {
        color: "#4F46E5",
        fontSize: 14,
        fontWeight: "bold",
        marginLeft: 4,
    },

    // --- WEB DESIGN STYLES ---
    webContainer: {
        padding: 40,
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
    },
    webHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
    },
    webWelcomeText: {
        fontSize: 16,
        color: "#64748B",
    },
    webUsernameText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1E293B",
    },
    webHeaderActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    webChatbotButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2F6",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginRight: 16,
    },
    webChatbotText: {
        color: "#4F46E5",
        fontWeight: "bold",
        fontSize: 14,
    },
    webLogoutButton: {
        backgroundColor: "#FEE2E2",
        padding: 10,
        borderRadius: 10,
    },
    webGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    webLeftCol: {
        flex: 1.7,
        marginRight: 24,
    },
    webRightCol: {
        flex: 1,
    },
    dashboardCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
    },
    webCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        paddingBottom: 16,
    },
    webCardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1E293B",
    },
    webCardSubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 4,
    },
    webAddButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4F46E5",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    webAddButtonText: {
        color: "#fff",
        fontWeight: "bold",
        marginLeft: 6,
        fontSize: 13,
    },
    webApplianceGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    webApplianceCard: {
        width: "48%",
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    webApplianceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    webApplianceName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#334155",
    },
    webInputsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    webInputBox: {
        flex: 1,
        marginHorizontal: 4,
    },
    webLabel: {
        fontSize: 11,
        color: "#64748B",
        marginBottom: 4,
    },
    webInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        backgroundColor: "#FFFFFF",
    },
    webActionRow: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 16,
        alignItems: "flex-end",
    },
    webSaveButton: {
        backgroundColor: "#4F46E5",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    webSaveText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    webSummaryBg: {
        backgroundColor: "#1E293B",
    },
    webSummaryTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    webMetricGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    webMetricCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 6,
        alignItems: "center",
    },
    webMetricVal: {
        fontSize: 26,
        fontWeight: "800",
        color: "#818CF8",
    },
    webMetricLabel: {
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 6,
    },
    webBillSection: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingTop: 20,
        alignItems: "center",
    },
    webBillTitle: {
        color: "#94A3B8",
        fontSize: 13,
        marginBottom: 6,
    },
    webBillVal: {
        color: "#10B981",
        fontSize: 32,
        fontWeight: "bold",
    },
    webBillSub: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 6,
        fontStyle: "italic",
    },
    tipHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    tipCardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1E293B",
        marginLeft: 8,
    },
    tipCardText: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 22,
        fontStyle: "italic",
        marginBottom: 16,
    },
    tipNextBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
    },
    tipNextBtnText: {
        color: "#4F46E5",
        fontWeight: "bold",
        fontSize: 13,
        marginRight: 4,
    },

    // --- MODAL STYLES ---
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.3)",
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        width: "85%",
        maxWidth: 400,
    },
    webModalView: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        width: 450,
    },
    modalTipIconBg: {
        backgroundColor: "#E8FBF2",
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    tipTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#10B981",
    },
    tipText: {
        fontSize: 15,
        color: "#475569",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
        fontStyle: "italic",
    },
    closeButton: {
        backgroundColor: "#10B981",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        width: "100%",
        alignItems: "center",
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#1E293B",
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        width: "100%",
        fontSize: 15,
        backgroundColor: "#F8FAFC",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 8,
    },
    modalAddButton: {
        flex: 1.2,
        backgroundColor: "#4F46E5",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginLeft: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: "#64748B",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
});

export default HomeScreen;