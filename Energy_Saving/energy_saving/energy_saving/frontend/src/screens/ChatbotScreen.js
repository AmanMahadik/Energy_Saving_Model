import React, { useState, useCallback, useRef } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const ChatbotScreen = () => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);

    // Animation refs
    const typingAnimation = useRef(new Animated.Value(0)).current;
    const messageAnimation = useRef(new Animated.Value(0)).current;

    const energySavingTips = [
        "Turn off lights when you leave a room.",
        "Unplug electronics and chargers when not in use.",
        "Use energy-efficient light bulbs (LEDs).",
        "Wash clothes in cold water whenever possible.",
        "Air dry clothes instead of using a dryer.",
        "Seal windows and doors to prevent drafts.",
        "Lower your thermostat in the winter and raise it in the summer.",
        "Use fans to circulate air instead of relying solely on air conditioning.",
        "Cook efficiently by using the right-sized burner and covering pots.",
        "Reduce the preheating time of your oven.",
        "Clean the lint filter of your dryer after each use.",
        "Insulate your home properly to reduce heating and cooling needs.",
        "Consider using smart power strips to eliminate vampire energy.",
        "Opt for energy-efficient appliances when making new purchases.",
        "Use a programmable thermostat to automatically adjust the temperature.",
    ];

    const appliancePowerData = {
        "samsung tv": { typical: "50-200", unit: "watts" },
        "lg refrigerator": { typical: "100-200", unit: "watts" },
        "whirlpool washing machine": { typical: "300-500", unit: "watts (during wash cycle)" },
        "samsung refrigerator": { typical: "120-180", unit: "watts" },
        "lg tv": { typical: "40-180", unit: "watts" },
        "whirlpool microwave": { typical: "700-1200", unit: "watts" },
        "fan": { typical: "60-100", unit: "watts" },
        "laptop": { typical: "50-100", unit: "watts" },
        "desktop computer": { typical: "150-300", unit: "watts" },
        "incandescent bulb": { typical: "60-100", unit: "watts" },
        "led bulb": { typical: "7-15", unit: "watts" },
    };

    const articleLink = "https://www.bajajfinserv.in/average-electricity-usage-by-appliances";
    const mahavitranLink = "https://wss.mahadiscom.in/wss/wss?uiActionName=getHome&Lang=English";
    const supportEmail = "energysavingmodel43@gmail.com";

    const handleLinkPress = useCallback(async (url) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Can't open the link", `Cannot open the URL: ${url}`);
        }
    }, []);

    const getRandomTip = useCallback(() => {
        const index = Math.floor(Math.random() * energySavingTips.length);
        return energySavingTips[index];
    }, [energySavingTips]);

    const getBotResponse = useCallback((userMessage) => {
        const lowerUserMessage = userMessage.toLowerCase().trim();
    
        const includesAny = (keywords) =>
            keywords.some((word) => lowerUserMessage.includes(word));
    
        const currentHour = new Date().getHours();
        const timeGreeting =
            currentHour < 12
                ? "🌅 Good morning!"
                : currentHour < 18
                ? "🌇 Good afternoon!"
                : "🌙 Good evening!";
    
        if (includesAny(["hi", "hello", "hey", "नमस्ते", "good morning", "good evening"])) {
            return `${timeGreeting} I'm your Energy Assistant ⚡. Ask me about saving tips, appliance power, bill calculations, or payments.`;
        }
    
        if (includesAny(["help", "features", "what can you do", "commands"])) {
            return "🛠️ I can assist with:\n• Energy-saving tips\n• Appliance power usage\n• Energy usage calculations\n• Electricity bill info\n• Bill payment\n• Comparisons\n• IoT and smart home info\n• Renewable energy info\n• Reporting issues\nTry asking: 'calculate energy for fan with 75 watts for 8 hours'";
        }
    
        if (includesAny(["tip", "advice", "suggest"])) {
            return getRandomTip();
        }
    
        if (includesAny(["calculate energy"])) {
            const parts = lowerUserMessage.split("calculate energy")[1]?.trim();
            if (
                parts &&
                parts.includes("for") &&
                (parts.includes("watts") || parts.includes("watt")) &&
                parts.includes("hours")
            ) {
                const forPart = parts.split("for")[1]?.trim();
                const appliance = forPart?.split("with")[0]?.trim() || "appliance";
                const wattsMatch = forPart?.match(/(\d+(\.\d+)?)\s*(watts|watt)/);
                const hoursMatch = forPart?.match(/(\d+(\.\d+)?)\s*hours/);
    
                if (wattsMatch && hoursMatch) {
                    const watts = parseFloat(wattsMatch[1]);
                    const hours = parseFloat(hoursMatch[1]);
                    const energyKWh = (watts * hours) / 1000;
                    return `⚙️ The energy used by your ${appliance} is approximately ${energyKWh.toFixed(2)} kWh.`;
                }
            }
            return "❌ Use the format: `calculate energy for fan with 75 watts for 8 hours`.";
        }
    
        if (includesAny(["convert", "conversion", "watts to kilowatts", "kw", "kwh to watt"])) {
            return "🔄 Example conversion:\n1000 watts = 1 kilowatt\n1 kWh = 1000 watt-hours\nUse this format: 'convert 2000 watts to kilowatts'";
        }
    
        if (includesAny(["what is kwh", "kwh meaning"])) {
            return "kWh (kilowatt-hour) is a unit of energy equal to using 1,000 watts for 1 hour. It’s the standard unit used on your electricity bill to measure your energy consumption.";
        }
    
        if (includesAny(["power of", "wattage of"])) {
            const parts = lowerUserMessage.split(/power of|wattage of/);
            if (parts.length > 1) {
                const query = parts[1].trim();
                for (const key in appliancePowerData) {
                    if (query.includes(key)) {
                        return `🔌 Typical power usage for ${key}: ${appliancePowerData[key].typical} ${appliancePowerData[key].unit}.`;
                    }
                }
                handleLinkPress(articleLink);
                return `❓ Info not found for '${query}'. Redirecting to more details...`;
            } else {
                handleLinkPress(articleLink);
                return `❗ Example: 'power of LG TV'. Redirecting for more info...`;
            }
        }
    
        if (includesAny(["bill", "electricity", "energy cost"])) {
            return "💡 Your electricity bill is calculated by multiplying total energy (in kWh) by the rate (₹/kWh). Example: 100 kWh × ₹7 = ₹700.";
        }
    
        if (includesAny(["pay", "payment", "bill pay", "mahavitran","pay my bill","pay bill"])) {
            handleLinkPress(mahavitranLink);
            return "💳 Redirecting you to the Mahavitran online payment portal...";
        }
    
        if (includesAny(["profile", "account"])) {
            navigation.navigate("Profile");
            return "👤 Taking you to your profile screen...";
        }
    
        if (includesAny(["clear", "reset chat"])) {
            setMessages([]);
            return "✅ Chat history cleared.";
        }
    
        if (includesAny(["thank", "thanks", "dhanyavad"])) {
            return "You're welcome! 😊 If you have more questions, feel free to ask.";
        }
    
        if (includesAny(["renewable", "solar", "wind", "green energy"])) {
            return "🌱 Renewable energy like solar and wind can reduce costs and environmental impact. Explore rooftop solar or green plans!";
        }
    
        if (includesAny(["smart home", "automation", "iot"])) {
            return "🏠 Smart home devices help optimize energy use. Use smart plugs, thermostats, and motion-sensor lights for efficiency.";
        }
    
        if (includesAny(["compare", "vs"])) {
            const [appliance1, appliance2] = lowerUserMessage.split("vs").map((s) => s.trim());
            const data1 = appliancePowerData[appliance1];
            const data2 = appliancePowerData[appliance2];
    
            if (data1 && data2) {
                return `📊 Comparison:\n${appliance1}: ${data1.typical} ${data1.unit}\n${appliance2}: ${data2.typical} ${data2.unit}`;
            } else if (data1) {
                return `📊 ${appliance1}: ${data1.typical} ${data1.unit}. No info on ${appliance2}`;
            } else if (data2) {
                return `📊 ${appliance2}: ${data2.typical} ${data2.unit}. No info on ${appliance1}`;
            } else {
                return `❓ Couldn't find info for both '${appliance1}' and '${appliance2}'`;
            }
        }
    
        if (includesAny(["problem", "issue", "bug", "error", "fix", "support"])) {
            const emailLink = `mailto:${supportEmail}?subject=App%20Issue%20Report&body=${encodeURIComponent(
                userMessage
            )}`;
            handleLinkPress(emailLink);
            return `📧 Opening email app to report to our team at ${supportEmail}`;
        }
    
        if (includesAny(["challenge", "goal", "save more", "reduce bill"])) {
            return "🎯 Join our Energy Saving Challenge! Track your usage and aim to reduce it each week. Earn badges and move up the leaderboard!";
        }
    
        if (includesAny(["fun fact", "joke", "funny", "lighten mood"])) {
            return "⚡ Fun Fact: A single lightning bolt is about 5 times hotter than the surface of the sun! ☀️⚡";
        }
    
        return "🤖 I'm still learning! Try asking about energy tips, appliance power, bill calculations, or smart home advice.";
    }, [
        appliancePowerData,
        articleLink,
        energySavingTips,
        getRandomTip,
        handleLinkPress,
        mahavitranLink,
        navigation,
        supportEmail,
        setMessages,
    ]);
    

    const handleSendMessage = useCallback(() => {
        if (inputText.trim() === "") return;

        const userMessage = {
            text: inputText,
            sender: "user",
            id: Date.now(),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);

        setInputText("");
        setIsBotTyping(true);

        // Animate the message
        Animated.spring(messageAnimation, {
            toValue: 1,
            useNativeDriver: true,
        }).start();

        // Simulate bot response
        setTimeout(() => {
            const botResponse = getBotResponse(inputText);

            const botMessage = {
                text: botResponse,
                sender: "bot",
                id: Date.now() + 1,
            };

            setMessages((prevMessages) => [...prevMessages, botMessage]);

            setIsBotTyping(false);

            // Animate typing
            Animated.spring(typingAnimation, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }, 1000);
    }, [inputText, messageAnimation, typingAnimation, getBotResponse]);

    const renderMessage = ({ item }) => (
        <View style={[styles.message, item.sender === "user" ? styles.userMessage : styles.botMessage]}>
            <Text>{item.text}</Text>
        </View>
    );

    const renderFooter = () => (
        isBotTyping && (
            <Animated.View
                style={[styles.typingIndicator, { opacity: typingAnimation }]}
            >
                <ActivityIndicator size="small" color="#0000ff" />
                <Text>Bot is typing...</Text>
            </Animated.View>
        )
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                style={styles.messageList}
                ListFooterComponent={renderFooter}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Ionicons name="send" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: "space-between",
    },
    messageList: {
        padding: 10,
    },
    message: {
        padding: 12, // Increased padding for better readability
        marginVertical: 8, // Slightly more space between messages
        borderRadius: 12, // Increased border radius for a more modern look
        maxWidth: "70%",
    },
    userMessage: {
        backgroundColor: "#d3f8e2",
        alignSelf: "flex-end",
        fontSize: 16, // Increased font size for user messages
        color: "#333", // Darker color for better readability
    },
    botMessage: {
        backgroundColor: "#e1e1e1",
        alignSelf: "flex-start",
        fontSize: 16, // Increased font size for bot messages
        color: "#333", // Darker color for better readability
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12, // Slightly more padding for the input area
        borderTopWidth: 1,
        borderColor: "#ccc",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 25, // More rounded input field
        padding: 12,
        marginRight: 12,
        fontSize: 16, // Increased font size for the input field
    },
    sendButton: {
        backgroundColor: "#4CAF50",
        padding: 12, // Increased padding for better touch area
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonText: {
        fontSize: 18, // Larger text for the send button
        color: "white",
        fontWeight: "bold",
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    typingText: {
        fontSize: 16, // Increased font size for typing indicator
        marginLeft: 8,
        color: "#666",
        fontStyle: "italic",
    },
});

export default ChatbotScreen;
