import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databases, account, logout } from '../services/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = 'budgetease';
const PROFILES_COLLECTION_ID = 'profiles';

const ProfileScreen = ({ navigation }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const user = await account.get();
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                [Query.equal('userId', user.$id)]
            );

            if (response.documents.length > 0) {
                setUserProfile(response.documents[0]);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    onPress: async () => {
                        try {
                            await logout();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Welcome' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const ProfileCard = ({ title, value, icon }) => (
        <View style={styles.profileCard}>
            <View style={styles.cardIcon}>
                <Ionicons name={icon} size={24} color="#4834DF" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4834DF', '#6C63FF']}
                style={styles.header}
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarBackground}>
                        <Text style={styles.avatarText}>
                            {userProfile?.name?.charAt(0) || 'U'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{userProfile?.email || ''}</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            ${userProfile?.currentBalance?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={styles.statLabel}>Balance</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            ${userProfile?.totalSavings?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={styles.statLabel}>Savings</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            ${userProfile?.monthlyIncome?.toFixed(2) || '0.00'}
                        </Text>
                        <Text style={styles.statLabel}>Income</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>
                    <ProfileCard
                        title="Member Since"
                        value={formatDate(userProfile?.createdAt || new Date())}
                        icon="calendar-outline"
                    />
                    <ProfileCard
                        title="Account Status"
                        value={userProfile?.isActive ? 'Active' : 'Inactive'}
                        icon="checkmark-circle-outline"
                    />
                    <ProfileCard
                        title="Last Updated"
                        value={formatDate(userProfile?.updatedAt || new Date())}
                        icon="time-outline"
                    />
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
        paddingTop: Platform.OS === 'android' ? 20 : -55,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    avatarContainer: {
        marginVertical: 20,
    },
    avatarBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        fontSize: 40,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    content: {
        flex: 1,
        padding: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 15,
        marginHorizontal: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4834DF',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666666',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 15,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#4834DF',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    logoutButton: {
        backgroundColor: '#E74C3C',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default ProfileScreen;