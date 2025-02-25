// Imports
import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, ScrollView, StyleSheet, Animated, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import BottomNav from "../components/BottomNav";
import TopNav from "../components/TopNav";
import { ThemeContext } from "../context/ThemeContext";
import axios from "axios";
import { BASE_URL } from "../context/requiredIP";

// Constants
const CIRCLE_RADIUS = 45;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Theme Configuration
const cardColors = {
  light: {
    temperature: '#FFF3E0',
    moisture: '#E1F5FE',
    methane: '#F3E5F5',
    reservoir: '#E8F5E9'
  },
  dark: {
    temperature: '#2D1E12',
    moisture: '#0D2B3A',
    methane: '#2A1B2D',
    reservoir: '#1A2E1C'
  }
};

// Card Configuration
const getCardConfig = (type, dashboardData, isDarkMode) => {
  const configs = {
    temperature: {
      icon: "thermometer",
      label: "Temperature",
      value: dashboardData.temperature,
      color: isDarkMode ? cardColors.dark.temperature : cardColors.light.temperature,
      textColor: isDarkMode ? '#FFB74D' : '#E65100'
    },
    moisture: {
      icon: "water-percent",
      label: "Moisture",
      value: dashboardData.humidity,
      color: isDarkMode ? cardColors.dark.moisture : cardColors.light.moisture,
      textColor: isDarkMode ? '#4FC3F7' : '#0277BD'
    },
    methane: {
      icon: "cloud",
      label: "Methane",
      value: dashboardData.ch4_ppm,
      color: isDarkMode ? cardColors.dark.methane : cardColors.light.methane,
      textColor: isDarkMode ? '#CE93D8' : '#7B1FA2'
    }
  };
  return configs[type];
};

// StatCard Component
const StatCard = ({ icon, label, value, color, textColor, isDarkMode, styles }) => (
  <Card style={[styles.statCard, { backgroundColor: color }]}>
    <View style={styles.statRow}>
      <MaterialCommunityIcons name={icon} size={24} color={textColor} />
      <Text style={[styles.statLabel, { color: textColor }]}>{label}</Text>
    </View>
    <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
  </Card>
);

// SwitchCard Component
const SwitchCard = ({ label, value, onValueChange, color, textColor, isDarkMode, styles }) => (
  <Card style={[styles.statCard, { backgroundColor: color }]}>
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: textColor }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange} // This will now call the toggleFan or togglePump function
        trackColor={{
          false: isDarkMode ? "#767577" : "#b3b3b3",
          true: isDarkMode ? "#81b0ff" : "#4CAF50",
        }}
        thumbColor={
          value
            ? isDarkMode
              ? "#f5dd4b"
              : "#f4f3f4"
            : isDarkMode
              ? "#f4f3f4"
              : "#f4f3f4"
        }
      />
    </View>
  </Card>
);

// Main Dashboard Component
const Dashboard = ({ navigation }) => {
  // State Management
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useContext(ThemeContext);
  const [dashboardData, setDashboardData] = useState({});
  const [sensorDataBuffer, setSensorDataBuffer] = useState([]);
  const [predictedDays, setPredictedDays] = useState(null);
  const [elapsedDays, setElapsedDays] = useState(0);
  const [isWaterControlEnabled, setIsWaterControlEnabled] = useState(false);
  const [isAirControlEnabled, setIsAirControlEnabled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const wsRef = useRef(null);


  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Helper Functions
  const getProgressPercentage = () => {
    if (!predictedDays) return 0;
    const percentage = (elapsedDays / predictedDays) * 100;
    return Math.min(percentage, 100);
  };

  const getRemainingDays = () => {
    if (!predictedDays) return 0;
    const remaining = predictedDays - elapsedDays;
    return Math.max(remaining, 0);
  };

  // WebSocket Connection
  const connectWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${BASE_URL}/api/v1/users/getCurrentUser`, {
        headers: { Authorization: `Bearer ${token} `}
      });

      const userId = response.data.data.user._id;
      const wsUrl = BASE_URL.replace("http", "ws");
      
      // Close any existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Create new connection
      const ws = new WebSocket(`${wsUrl}/ws?userid=${userId}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setSensorDataBuffer(prevBuffer => [...prevBuffer, data].slice(-5));
        setDashboardData(prevData => ({
          ...prevData,
          temperature: data.temperature ? `${data.temperature}°C `: prevData.temperature,
          humidity: data.humidity ? `${data.humidity}%` : prevData.humidity,
          ch4_ppm: data.ch4_ppm ?` ${data.ch4_ppm} ppm `: prevData.ch4_ppm,
        }));
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };
      
      // Store in ref for component-wide access
      wsRef.current = ws;
      
      return ws;
    } catch (error) {
      console.error("WebSocket Connection Error:", error);
      return null;
    }
  };

  // WebSocket Connection initialization
  useEffect(() => {
    // Connect when component mounts
    connectWebSocket();
    
    // Cleanup when component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Function to send control messages
  const sendMessageToSocket = async (message) => {
    // Check if WebSocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected, attempting to reconnect...");
      await connectWebSocket();
    }
    
    // Try to send the message
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is still not connected after reconnection attempt.");
    }
  };

  // Toggle Mode (Manual/Automatic)
  const toggleMode = () => {
    //open socket connection
    // const ws = new WebSocket("ws://
    setIsManualMode((prevMode) => {
      const newMode = !prevMode;
      sendMessageToSocket({
        type: "mode",
        mode: newMode ? "manual" : "automatic",
      });
      return newMode;
    });
  };

  // Toggle Fan Control
  const toggleFan = () => {
    setIsAirControlEnabled(prevState => {
      const newState = !prevState;
      sendMessageToSocket({
        type: "control",
        device: "fan",
        mode:"manual",
        action: newState ? "on" : "off",
      });
      return newState;
    });
    // console.log("Fan Control Enabled:", newState);
  };

  // Toggle Pump Control
  const togglePump = () => {
    setIsWaterControlEnabled(prevState => {
      const newState = !prevState;
      sendMessageToSocket({
        type: "control",
        device: "pump",
        mode:"manual",
        action: newState ? "on" : "off",
      });
      return newState;
    });
    // console.log("Pump Control Enabled:", newState);
  };


  // Prediction API Integration
  useEffect(() => {
    const fetchPrediction = async () => {
      if (sensorDataBuffer.length === 1) {
        const latestData = sensorDataBuffer[0];
        try {
          const response = await axios.post("http://192.168.1.68:5000/predict", {
            "Temperature (°C)": latestData.temperature,
            "Humidity (%)": latestData.humidity,
          });
          setPredictedDays(response.data.predicted_days);

          const storedElapsedDays = await AsyncStorage.getItem('compostElapsedDays');
          setElapsedDays(storedElapsedDays ? parseFloat(storedElapsedDays) : 0);
        } catch (error) {
          console.error("Prediction API Error:", error);
        }
      }
    };

    fetchPrediction();
  }, [sensorDataBuffer]);

  // Animation Effects
  useEffect(() => {
    const progressPercentage = getProgressPercentage();

    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: progressPercentage / 100,
        duration: 1000,
        useNativeDriver: true,
      })
    ];

    Animated.parallel(animations).start();

    cardAnimations.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.spring(anim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, progressAnim, cardAnimations]);

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "rgba(247, 255, 244, 0.95)",

    },
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "rgba(247, 255, 244, 0.95)",

    },
    mainContainer: {
      flex: 1,

    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 90, // Add padding to account for bottom navigation
    },
    title: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 6,
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    subText: {
      fontSize: 14,
      color: isDarkMode ? "#A0A0A0" : "gray",
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 12,
      color: isDarkMode ? "#FFFFFF" : "darkgreen",
    },
    progressContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 16,
      position: "relative",
    },
    progressText: {
      fontSize: 36,
      fontWeight: "bold",
      position: "absolute",
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    progressSubText: {
      fontSize: 14,
      position: "absolute",
      bottom: -30,
      color: isDarkMode ? "#A0A0A0" : "gray",
    },
    cardContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 5,
    },
    card: {
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f2f2f2',
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      marginTop: 8,
    },
    statCard: {
      width: "100%",
      padding: 14,
      marginBottom: 12,
      borderRadius: 10,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 6,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      marginBottom: 50
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      marginLeft: 10,
    },
    checkboxLabel: {
      fontSize: 16,
      marginLeft: 8,
      color: isDarkMode ? '#FFFFFF' : '#000000',
      fontWeight: '600',
    },
    bottomNavContainer: {
      position: 'positive',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? "#121212" : "rgba(247, 255, 244, 0.95)",
    },
  });

  // Animated Circle Component
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const progressPercentage = getProgressPercentage();

  // Render
  return (
    <View style={styles.container}>
      {/* Fixed Top Navigation */}
      <TopNav navigation={navigation} />

      {/* Scrollable Content */}
      <View style={styles.mainContainer}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContainer}
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Compost Readiness Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Compost Readiness</Text>
            <Text style={styles.subText}>
              {predictedDays
                ?` ${getRemainingDays().toFixed(1)} days remaining`
                : "Getting stable data..."}
            </Text>

            <View style={styles.progressContainer}>
              <Svg width="140" height="140" viewBox="0 0 100 100">
                <Circle
                  cx="50"
                  cy="50"
                  r={CIRCLE_RADIUS}
                  stroke={isDarkMode ? "#333333" : "lightgray"}
                  strokeWidth="5"
                  fill="none"
                />
                <AnimatedCircle
                  cx="50"
                  cy="50"
                  r={CIRCLE_RADIUS}
                  stroke={isDarkMode ? "#4CAF50" : "green"}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`}
                  strokeDashoffset={progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [CIRCLE_CIRCUMFERENCE, 0],
                  })}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <Text style={styles.progressText}>
                {Math.round(progressPercentage)}%
              </Text>
              <Text style={styles.progressSubText}>
                Day {elapsedDays.toFixed(0) + 1} of {predictedDays ? predictedDays.toFixed(0) : '--'}
              </Text>
            </View>
          </View>
          {/* Stat Cards */}
          <View style={styles.cardContainer}>
            {['temperature', 'moisture', 'methane'].map((type, index) => {
              const config = getCardConfig(type, dashboardData, isDarkMode);
              return (
                <Animated.View
                  key={index}
                  style={{
                    width: "48%",
                    opacity: cardAnimations[index],
                    transform: [
                      {
                        translateY: cardAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                      {
                        scale: cardAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <StatCard
                    icon={config.icon}
                    label={config.label}
                    value={config.value}
                    color={config.color}
                    textColor={config.textColor}
                    isDarkMode={isDarkMode}
                    styles={styles}
                  />
                </Animated.View>
              );
            })}
          </View>

          {/* Manual Mode Checkbox */}
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={isManualMode ? 'checked' : 'unchecked'}
              onPress={toggleMode} // Call toggleMode instead of directly setting state
              color={isDarkMode ? '#4CAF50' : '#1B5E20'}
            />
            <Text style={styles.checkboxLabel}>Manual</Text>
          </View>

          {/* Water and Air Control Cards - Only visible in manual mode */}
          {isManualMode && (
            <View style={styles.cardContainer}>
              <Animated.View
                style={{
                  width: "48%",
                  opacity: cardAnimations[3],
                  transform: [
                    {
                      translateY: cardAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: cardAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <SwitchCard
                  label="Water Control"
                  value={isWaterControlEnabled}
                  onValueChange={togglePump} // Call togglePump function
                  color={isDarkMode ? cardColors.dark.reservoir : cardColors.light.reservoir}
                  textColor={isDarkMode ? '#4CAF50' : '#1B5E20'}
                  isDarkMode={isDarkMode}
                  styles={styles}
                />
              </Animated.View>
              <Animated.View
                style={{
                  width: "48%",
                  opacity: cardAnimations[3],
                  transform: [
                    {
                      translateY: cardAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: cardAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <SwitchCard
                  label="Air Control"
                  value={isAirControlEnabled}
                  onValueChange={toggleFan} // Call toggleFan function
                  color={isDarkMode ? cardColors.dark.methane : cardColors.light.methane}
                  textColor={isDarkMode ? '#CE93D8' : '#7B1FA2'}
                  isDarkMode={isDarkMode}
                  styles={styles}
                />
              </Animated.View>
            </View>
          )}
        </Animated.ScrollView>
      </View>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <BottomNav navigation={navigation} />
      </View>
    </View>
  );
};

export default Dashboard;