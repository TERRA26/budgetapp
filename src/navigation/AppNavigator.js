import React from 'react';
import { Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatbotScreen from '../screens/ChatbotScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

// Linking configuration
const linking = {
    prefixes: ['myapp://', 'https://myapp.com'],
    config: {
        screens: {
            Welcome: 'welcome',
            Login: 'login',
            Register: 'register',
            MainApp: {
                screens: {
                    HomeTab: 'home',
                    Chatbot: 'chatbot',
                    Profile: 'profile',
                },
            },
        },
    },
};

// Tab icon mapping
const TAB_ICONS = {
    HomeTab: ['home', 'home-outline'],
    Chatbot: ['chatbubble', 'chatbubble-outline'],
    Profile: ['person', 'person-outline'],
};

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const [focusedIcon, unfocusedIcon] = TAB_ICONS[route.name] || ['alert-circle', 'alert-circle-outline'];
                    return (
                        <Ionicons
                            name={focused ? focusedIcon : unfocusedIcon}
                            size={size}
                            color={color}
                        />
                    );
                },
                tabBarActiveTintColor: '#5196F4',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5E5',
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    height: Platform.OS === 'ios' ? 85 : 65,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: Platform.OS === 'ios' ? 0 : 5,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
            <Tab.Screen
                name="Chatbot"
                component={ChatbotScreen}
                options={{ title: 'AI Assistant' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                    },
                    headerTitleStyle: {
                        fontSize: 17,
                        color: '#000000',
                    },
                }}
            />
        </Tab.Navigator>
    );
};

const RootNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FFFFFF' },
                animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
                name="MainApp"
                component={TabNavigator}
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
        </Stack.Navigator>
    );
};

const LoadingFallback = () => (
    <ActivityIndicator
        size="large"
        color="#5196F4"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    />
);

const AppNavigator = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer
                ref={navigationRef}
                linking={linking}
                fallback={<LoadingFallback />}
            >
                <RootNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default AppNavigator;