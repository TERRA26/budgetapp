import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    RefreshControl,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
    LineChart,
    BarChart,
    ProgressChart,
} from 'react-native-chart-kit';
import CustomButton from '../components/CustomButton';
import {
    logout,
    getUserProfile,
    account,
    getBudgets,
} from '../services/appwrite';

const { width } = Dimensions.get('window');

function HomeScreen({ navigation }) {
    // State for user data
    const [userData, setUserData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data
    const fetchUserData = async () => {
        try {
            const user = await account.get();
            const userProfile = await getUserProfile(user.$id);
            const userBudgets = await getBudgets();

            setUserData(user);
            setProfile(userProfile);
            setBudgets(userBudgets.documents);
            setError(null);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
            Alert.alert(
                'Error',
                'Failed to load your profile data. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchUserData();
    }, []);

    // Refresh control
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    }, []);

    // Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    // Calculate budget statistics
    const calculateBudgetStats = () => {
        if (!profile) return { budget: 0, spent: 0, remaining: 0 };

        const monthlyBudget = profile.monthlyBudgetLimit || 0;
        const spent = monthlyBudget * 0.6; // This should be replaced with actual spending data
        const remaining = monthlyBudget - spent;

        return {
            budget: monthlyBudget,
            spent: spent,
            remaining: remaining
        };
    };

    // Format spending data based on selected period
    const getSpendingData = () => {
        // This should be replaced with actual transaction data
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                data: [
                    profile?.monthlyBudgetLimit * 0.7,
                    profile?.monthlyBudgetLimit * 0.8,
                    profile?.monthlyBudgetLimit * 0.6,
                    profile?.monthlyBudgetLimit * 0.9,
                    profile?.monthlyBudgetLimit * 0.75,
                    profile?.monthlyBudgetLimit * 0.85,
                ].map(val => val || 0),
            }]
        };
    };

    // Calculate budget progress
    const getBudgetProgress = () => {
        if (!profile?.categories) return { labels: [], data: [] };

        const categories = profile.categories.slice(0, 3);
        return {
            labels: categories.map(cat => cat.name),
            data: categories.map(cat =>
                (cat.budget > 0 ? cat.spent / cat.budget : 0) || 0
            )
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
        );
    }

    const budgetStats = calculateBudgetStats();
    const spendingData = getSpendingData();
    const budgetProgress = getBudgetProgress();

    // Component render
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {profile?.name || 'User'}</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.profileButton}
                    >
                        <MaterialIcons name="person" size={24} color="#1976D2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <MaterialIcons name="logout" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Stats Cards */}
                <View style={styles.quickStatsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                        <MaterialIcons name="account-balance-wallet" size={24} color="#1976D2" />
                        <Text style={styles.statAmount}>
                            ${budgetStats.budget.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Monthly Budget</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialIcons name="trending-down" size={24} color="#43A047" />
                        <Text style={styles.statAmount}>
                            ${budgetStats.spent.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Spent</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                        <MaterialIcons name="savings" size={24} color="#EF6C00" />
                        <Text style={styles.statAmount}>
                            ${budgetStats.remaining.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Remaining</Text>
                    </View>
                </View>

                {/* Saving Goal Progress */}
                {profile?.savingGoals && (
                    <View style={styles.savingGoalCard}>
                        <View style={styles.savingGoalHeader}>
                            <Text style={styles.savingGoalTitle}>
                                {profile.savingGoals.charAt(0).toUpperCase() +
                                    profile.savingGoals.slice(1)} Goal
                            </Text>
                            <Text style={styles.savingGoalAmount}>
                                ${profile.targetAmount?.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.savingGoalProgress}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${(budgetStats.spent / profile.targetAmount * 100) || 0}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.savingGoalDate}>
                            Target Date: {new Date(profile.targetDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'week' && styles.selectedPeriod]}
                        onPress={() => setSelectedPeriod('week')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'week' && styles.selectedPeriodText
                        ]}>Week</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'month' && styles.selectedPeriodText
                        ]}>Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriod]}
                        onPress={() => setSelectedPeriod('year')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === 'year' && styles.selectedPeriodText
                        ]}>Year</Text>
                    </TouchableOpacity>
                </View>

                {/* Spending Chart */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Spending Overview</Text>
                    <LineChart
                        data={spendingData}
                        width={width - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: "#1976D2"
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* Budget Progress */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Budget Progress</Text>
                    <ProgressChart
                        data={budgetProgress}
                        width={width - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                            style: { borderRadius: 16 }
                        }}
                        style={styles.chart}
                    />
                </View>
                <View style={styles.transactionsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Transactions')}
                            style={styles.seeAllButton}
                        >
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Replace with actual transactions data */}
                    <TransactionItem
                        icon="restaurant"
                        category="Food"
                        title="Grocery Store"
                        amount="-$85.50"
                        date="Today"
                    />
                    <TransactionItem
                        icon="local-taxi"
                        category="Transport"
                        title="Uber Ride"
                        amount="-$12.99"
                        date="Yesterday"
                    />
                    <TransactionItem
                        icon="shopping-bag"
                        category="Shopping"
                        title="Amazon"
                        amount="-$145.20"
                        date="Mar 28"
                    />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <QuickActionButton
                            icon="add"
                            title="Add Transaction"
                            onPress={() => navigation.navigate('AddTransaction')}
                        />
                        <QuickActionButton
                            icon="bar-chart"
                            title="View Reports"
                            onPress={() => navigation.navigate('Reports')}
                        />
                        <QuickActionButton
                            icon="account-balance"
                            title="Budgets"
                            onPress={() => navigation.navigate('Budgets')}
                        />
                        <QuickActionButton
                            icon="settings"
                            title="Settings"
                            onPress={() => navigation.navigate('Settings')}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Transaction Item Component
const TransactionItem = ({ icon, category, title, amount, date }) => (
    <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
            <MaterialIcons name={icon} size={24} color="#1976D2" />
        </View>
        <View style={styles.transactionInfo}>
            <View>
                <Text style={styles.transactionTitle}>{title}</Text>
                <Text style={styles.transactionCategory}>{category}</Text>
            </View>
            <View>
                <Text style={[
                    styles.transactionAmount,
                    { color: amount.startsWith('-') ? '#ff5252' : '#4caf50' }
                ]}>{amount}</Text>
                <Text style={styles.transactionDate}>{date}</Text>
            </View>
        </View>
    </View>
);

// Quick Action Button Component
const QuickActionButton = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <View style={styles.quickActionIcon}>
            <MaterialIcons name={icon} size={24} color="#1976D2" />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        marginRight: 16,
        padding: 8,
    },
    logoutButton: {
        padding: 8,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    quickStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    statCard: {
        width: '31%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    savingGoalCard: {
        margin: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    savingGoalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    savingGoalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    savingGoalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    savingGoalProgress: {
        height: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#1976D2',
        borderRadius: 4,
    },
    savingGoalDate: {
        fontSize: 12,
        color: '#666',
    },
    // ... (previous styles remain the same)
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    seeAllButton: {
        padding: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: '#1976D2',
        fontWeight: '600',
    },
    periodSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    periodButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedPeriod: {
        backgroundColor: '#1976D2',
        elevation: 2,
        shadowColor: '#1976D2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    periodButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedPeriodText: {
        color: '#fff',
        fontWeight: '600',
    },
    chartContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        marginHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    transactionsContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    transactionCategory: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'right',
    },
    quickActionsContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    quickActionButton: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    quickActionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    quickActionTitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },
    refreshButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    noTransactionsContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noTransactionsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    addTransactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    addTransactionButtonText: {
        color: '#1976D2',
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default HomeScreen;