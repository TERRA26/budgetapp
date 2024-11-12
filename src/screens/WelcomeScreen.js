import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const { width, height } = Dimensions.get('window');

function WelcomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Decorative Element */}
                <View style={styles.topDecoration}>
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />
                </View>

                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../assets/budget-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>BudgetEase</Text>
                    <Text style={styles.subtitle}>Budgeting with AI</Text>
                    <Text style={styles.description}>Smart financial planning powered by artificial intelligence</Text>
                </View>

                {/* Features Section */}
                <View style={styles.featuresContainer}>
                    <FeatureItem
                        icon="account-balance-wallet"
                        title="AI-Powered Insights"
                        description="Get personalized financial recommendations"
                        color="#4CAF50"
                    />
                    <FeatureItem
                        icon="trending-up"
                        title="Smart Budgeting"
                        description="Automated categorization and tracking"
                        color="#FF9800"
                    />
                    <FeatureItem
                        icon="insert-chart"
                        title="Predictive Analytics"
                        description="Forecast future expenses and savings"
                        color="#2196F3"
                    />
                </View>
            </ScrollView>

            {/* Fixed Button Section */}
            <View style={styles.buttonContainer}>
                <CustomButton
                    title="Get Started"
                    onPress={() => navigation.navigate('Register')}
                    style={styles.registerButton}
                    icon={<MaterialIcons name="arrow-forward" size={20} color="white" />}
                />
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const FeatureItem = ({ icon, title, description, color }) => (
    <View style={styles.featureItem}>
        <View style={[styles.featureIconContainer, { backgroundColor: `${color}15` }]}>
            <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100, // Add padding to prevent content from being hidden behind buttons
    },
    topDecoration: {
        position: 'absolute',
        top: -height * 0.15,
        right: -width * 0.25,
        zIndex: -1,
    },
    circle1: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: '#E3F2FD',
        opacity: 0.5,
    },
    circle2: {
        position: 'absolute',
        top: height * 0.05,
        right: width * 0.1,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: '#BBDEFB',
        opacity: 0.5,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: height * 0.05,
    },
    logoWrapper: {
        width: width * 0.45,
        height: width * 0.45,
        borderRadius: width * 0.225,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    logo: {
        width: width * 0.35,
        height: width * 0.35,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1976D2',
        marginTop: 24,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: 0.3,
        paddingHorizontal: 20,
    },
    featuresContainer: {
        marginTop: height * 0.04,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    registerButton: {
        backgroundColor: '#1976D2',
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#1976D2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    loginText: {
        fontSize: 15,
        color: '#666',
    },
    loginLink: {
        fontSize: 15,
        color: '#1976D2',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default WelcomeScreen;