import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Dimensions
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { createTransaction, getUserProfile, getBudgets } from '../services/appwrite';

const HomeScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const monthlyExpenseData = {
        labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        datasets: [{
            data: [2100, 1950, 2300, 2800, 2600, 3000]
        }]
    };

    // Simulated transactions data
    const simulateTransactions = () => {
        const currentDate = new Date('2024-11-12');
        const transactions = [];
        const categories = ['Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Bills'];

        for (let i = 0; i < 20; i++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i);

            transactions.push({
                id: i,
                amount: Math.floor(Math.random() * 200) + 10,
                category: categories[Math.floor(Math.random() * categories.length)],
                date: date.toISOString(),
                type: Math.random() > 0.7 ? 'income' : 'expense',
                description: `Transaction ${i + 1}`
            });
        }
        return transactions;
    };


    const fetchData = async () => {
        try {
            const userProfile = await getUserProfile();
            const userBudgets = await getBudgets();
            setProfile(userProfile);
            setBudgets(userBudgets.documents);
            setTransactions(simulateTransactions());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const formatCurrency = (amount) => {
        return `$${amount.toFixed(2)}`;
    };

    const getTransactionIcon = (category) => {
        const icons = {
            'Groceries': 'cart',
            'Transportation': 'car',
            'Entertainment': 'film',
            'Shopping': 'bag',
            'Bills': 'document-text'
        };
        return icons[category] || 'cash';
    };

    const handleAddTransaction = async (type) => {
        try {
            const amount = Math.floor(Math.random() * 200) + 10;
            const categories = ['Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Bills'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const date = new Date().toISOString();
            const description = `Random ${type} transaction`;

            await createTransaction({
                amount,
                category,
                date,
                type,
                description
            });

            setTransactions([
                ...transactions,
                {
                    id: transactions.length,
                    amount,
                    category,
                    date,
                    type,
                    description
                }
            ]);
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    const handlePositiveTransaction = async (type) => {
        try {
            const amount = Math.floor(Math.random() * 200) + 10;
            const categories = ['Freelance', 'Investments', 'Refunds', 'Deposits'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const date = new Date().toISOString();
            const description = `Random ${type} transaction`;

            await createTransaction({
                amount,
                category,
                date,
                type,
                description
            });

            setTransactions([
                ...transactions,
                {
                    id: transactions.length,
                    amount,
                    category,
                    date,
                    type,
                    description
                }
            ]);
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.welcomeText}>
                    Welcome back, {profile?.name || 'User'}
                </Text>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>
                        {formatCurrency(profile?.currentBalance || 0)}
                    </Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AddTransaction')}
                >
                    <Ionicons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.actionText}>Add Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => navigation.navigate('Budgets')}
                >
                    <Ionicons name="pie-chart" size={24} color="#fff" />
                    <Text style={styles.actionText}>View Budgets</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleAddTransaction('expense')}
                >
                    <Ionicons name="trending-down" size={24} color="#fff" />
                    <Text style={styles.actionText}>Add Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handlePositiveTransaction('income')}
                >
                    <Ionicons name="trending-up" size={24} color="#fff" />
                    <Text style={styles.actionText}>Add Income</Text>
                </TouchableOpacity>
            </View>

            {/* Budget Overview Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Expense Overview</Text>
                <LineChart
                    data={monthlyExpenseData}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsContainer}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {transactions.slice(0, 5).map((transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                        <View style={styles.transactionIcon}>
                            <Ionicons
                                name={getTransactionIcon(transaction.category)}
                                size={24}
                                color="#5196F4"
                            />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionCategory}>
                                {transaction.category}
                            </Text>
                            <Text style={styles.transactionDate}>
                                {new Date(transaction.date).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[
                            styles.transactionAmount,
                            { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
                        ]}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Connected Accounts */}
            <View style={styles.connectedAccountsContainer}>
                <Text style={styles.sectionTitle}>Connected Accounts</Text>
                <View style={styles.accountsList}>
                    {/* Simulated connected accounts */}
                    <View style={styles.accountItem}>
                        <Ionicons name="card" size={24} color="#5196F4" />
                        <Text style={styles.accountName}>Main Checking</Text>
                        <Text style={styles.accountBalance}>{formatCurrency(4500)}</Text>
                    </View>
                    <View style={styles.accountItem}>
                        <Ionicons name="savings" size={24} color="#4CAF50" />
                        <Text style={styles.accountName}>Savings</Text>
                        <Text style={styles.accountBalance}>{formatCurrency(12000)}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#5196F4',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    welcomeText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    balanceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 15,
    },
    balanceLabel: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.8,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        marginTop: -30,
    },
    actionButton: {
        backgroundColor: '#5196F4',
        padding: 15,
        borderRadius: 12,
        width: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    actionText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '600',
    },
    chartContainer: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
    },
    sectionTitle: {
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
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#f0f7ff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionDetails: {
        flex: 1,
        marginLeft: 12,
    },
    transactionCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    transactionDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    connectedAccountsContainer: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
        marginBottom: 30,
    },
    accountsList: {
        gap: 10,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
    },
    accountName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    accountBalance: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5196F4',
    },
});

export default HomeScreen;