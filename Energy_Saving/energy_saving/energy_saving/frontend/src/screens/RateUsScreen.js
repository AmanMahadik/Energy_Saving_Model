import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking, // Import Linking
    Animated,
    Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const RateUsScreen = () => {
    const navigation = useNavigation();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");

    // Animated value for scaling the stars and fade-in effect
    const starAnimation = new Animated.Value(1); // Scale effect
    const fadeInAnimation = new Animated.Value(0); // Fade-in effect

    // Function to scale the stars when pressed
    const handleStarPress = (selectedRating) => {
        setRating(selectedRating);
        // Animate star scaling when pressed
        Animated.sequence([
            Animated.timing(starAnimation, {
                toValue: 1.3, // Scale up
                duration: 150,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
            Animated.timing(starAnimation, {
                toValue: 1, // Scale back
                duration: 150,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Function to send feedback email
    const sendFeedbackEmail = (feedbackText) => {
        const recipient = "energysavingmodel43@gmail.com"; // Your email
        const subject = "User Feedback";
        const body = `Feedback: ${feedbackText}`;

        const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
            subject
        )}&body=${encodeURIComponent(body)}`;

        Linking.openURL(mailtoUrl).catch((err) =>
            Alert.alert("Error", "Could not send email. Please try again.")
        );
    };

    // Handle feedback submission
    const handleSubmitFeedback = () => {
        if (rating === 0) {
            Alert.alert("Please Rate Us", "Tap on the stars to give a rating.");
            return;
        }

        const feedbackToSend = `Rating: ${rating}\nFeedback: ${feedback}`;

        sendFeedbackEmail(feedbackToSend);
        Alert.alert(
            "Thank You!",
            "Your feedback has been submitted.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        setRating(0);
        setFeedback("");
    };

    // Trigger fade-in animation on component mount
    React.useEffect(() => {
        Animated.timing(fadeInAnimation, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                {/* Title and Subtitle */}
                <Text style={styles.title}>Rate Our App</Text>
                <Text style={styles.subtitle}>Tell us what you think!</Text>

                {/* Animated Rating (Stars) */}
                <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                            <Animated.View
                                style={{ transform: [{ scale: starAnimation }] }}
                            >
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={40}
                                    color="#FFD700"
                                    style={styles.star}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Feedback Input */}
                <TextInput
                    style={styles.feedbackInput}
                    placeholder="Share your feedback here..."
                    multiline
                    value={feedback}
                    onChangeText={setFeedback}
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: "center",
    },
    backButton: {
        position: "absolute",
        top: 20,
        left: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    backButtonText: {
        marginLeft: 5,
        fontSize: 16,
        color: "#333",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 60,
        marginBottom: 10,
        color: "#333",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
    },
    ratingContainer: {
        flexDirection: "row",
        marginBottom: 30,
    },
    star: {
        marginHorizontal: 5,
    },
    feedbackInput: {
        width: "100%",
        minHeight: 100,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        textAlignVertical: "top",
        backgroundColor: "#fff",
    },
    submitButton: {
        backgroundColor: "#007bff",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: "center",
    },
    submitButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default RateUsScreen;
