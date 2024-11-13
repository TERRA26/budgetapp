import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert, Modal, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Query } from 'appwrite';
import { databases, account } from '../services/appwrite';
import {LinearGradient} from "expo-linear-gradient";

const DATABASE_ID = 'budgetease';
const PROFILES_COLLECTION_ID = 'profiles';
const TRANSACTIONS_COLLECTION_ID = 'transactions';
const BUDGETS_COLLECTION_ID = 'budgets';

const HomeScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expenseData, setExpenseData] = useState(null);
    const [isNewBudgetModalVisible, setIsNewBudgetModalVisible] = useState(false);
    const [isNewTransactionModalVisible, setIsNewTransactionModalVisible] = useState(false);
    const [newBudget, setNewBudget] = useState({
        category: '',
        amount: '',
        period: 'monthly'
    });

    // Fetch user profile from Appwrite
    const fetchUserProfile = async (userId) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                [Query.equal('userId', userId)]
            );
            if (response.documents.length > 0) {
                setProfile(response.documents[0]);
                return response.documents[0];
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to fetch profile data');
        }
    };

    const handleCreateBudget = async () => {
        if (!newBudget.category || !newBudget.amount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await createOrUpdateBudget({
                category: newBudget.category,
                amount: parseFloat(newBudget.amount),
                period: newBudget.period,
            });

            setIsNewBudgetModalVisible(false);
            setNewBudget({ category: '', amount: '', period: 'monthly' });
            fetchData();
            Alert.alert('Success', 'Budget created successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to create budget');
        }
    };

    // Fetch budgets from Appwrite
    const fetchBudgets = async (userId) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                BUDGETS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            );
            setBudgets(response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching budgets:', error);
            Alert.alert('Error', 'Failed to fetch budget data');
        }
    };

    // Fetch transactions from Appwrite
    const fetchTransactions = async (userId) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('date'),
                    Query.limit(100)
                ]
            );
            setTransactions(response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            Alert.alert('Error', 'Failed to fetch transactions');
        }
    };

    // Generate simulated historical data
    const generateHistoricalData = (monthlyIncome) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        // Generate random monthly expenses (60-90% of monthly income)
        const monthlyExpenses = months.map((_, index) => {
            if (index <= currentMonth) {
                const randomPercentage = 0.6 + Math.random() * 0.3; // 60-90%
                return monthlyIncome * randomPercentage;
            }
            return 0;
        });

        // Budget line (80% of monthly income)
        const budgetLine = monthlyIncome * 0.8;

        return {
            expenses: monthlyExpenses,
            budgetLine: budgetLine
        };
    };

    // Generate expense data for chart
    const generateExpenseData = (transactionsData, profile) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyIncome = profile?.monthlyIncome || 5000; // Default to 5000 if not set

        const historicalData = generateHistoricalData(monthlyIncome);
        const budgetLine = historicalData.budgetLine;

        const chartData = {
            labels: months,
            datasets: [
                {
                    data: historicalData.expenses,
                    color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: Array(12).fill(budgetLine),
                    color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                    strokeWidth: 2,
                    dashPattern: [5, 5]
                }
            ],
            legend: ['Expenses', 'Budget Limit']
        };

        setExpenseData(chartData);
    };

    // Create a new transaction
    const createTransaction = async (transactionData) => {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'unique()',
                {
                    userId: profile.userId,
                    ...transactionData,
                    createdAt: new Date().toISOString()
                }
            );
            return response;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    };

    // Create or update budget
    const createOrUpdateBudget = async (budgetData) => {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                BUDGETS_COLLECTION_ID,
                'unique()',
                {
                    userId: profile.userId,
                    ...budgetData,
                    createdAt: new Date().toISOString()
                }
            );
            return response;
        } catch (error) {
            console.error('Error managing budget:', error);
            throw error;
        }
    };

    // Update user profile
    const updateUserProfile = async (updates) => {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                profile.$id,
                updates
            );
            setProfile(response);
            return response;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    // Simulate transactions
    const simulateTransactions = async () => {
        const categories = ['Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Bills'];
        const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Bonus'];

        try {
            setLoading(true);
            const currentProfile = await fetchUserProfile(profile.userId);
            const monthlyIncome = currentProfile?.monthlyIncome || 5000;

            // Generate 10 random transactions
            for (let i = 0; i < 10; i++) {
                const isExpense = Math.random() > 0.3;
                const amount = isExpense
                    ? Math.floor(Math.random() * (monthlyIncome * 0.2))
                    : Math.floor(Math.random() * (monthlyIncome * 0.5));

                const category = isExpense
                    ? categories[Math.floor(Math.random() * categories.length)]
                    : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];

                const transactionDate = new Date();
                transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 30));

                const transactionData = {
                    amount: amount,
                    type: isExpense ? 'expense' : 'income',
                    category: category,
                    description: `Simulated ${category} ${isExpense ? 'expense' : 'income'}`,
                    date: transactionDate.toISOString()
                };

                await createTransaction(transactionData);

                // Update balance
                const newBalance = currentProfile.currentBalance + (isExpense ? -amount : amount);
                await updateUserProfile({ currentBalance: newBalance });
            }

            // Refresh data
            await fetchData();
            Alert.alert('Success', 'Successfully retrieved transactions!');
        } catch (error) {
            Alert.alert('Error', 'Failed to simulate transactions');
        } finally {
            setLoading(false);
        }
    };

    // Handle refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } catch (error) {
            console.error('Error refreshing data:', error);
            Alert.alert('Error', 'Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Fetch all data
    const fetchData = async () => {
        try {
            const user = await account.get();
            const profileData = await fetchUserProfile(user.$id);
            const transactionsData = await fetchTransactions(user.$id);
            const budgetsData = await fetchBudgets(user.$id);

            generateExpenseData(transactionsData, profileData);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        fetchData();
    }, []);

    // Focus effect
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const formatCurrency = (amount) => {
        return `$${amount.toFixed(2)}`;
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#5196F4']}
                />
            }
        >
            {/* Redesigned Header Section */}
            <LinearGradient
                colors={['#6C63FF', '#4834DF']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>
                        Hello, {profile?.name || 'User'} 👋
                    </Text>
                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={styles.balanceAmount}>
                            {formatCurrency(profile?.currentBalance || 0)}
                        </Text>
                        <View style={styles.incomeContainer}>
                            <Text style={styles.monthlyIncome}>
                                Monthly Income: {formatCurrency(profile?.monthlyIncome || 0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsNewBudgetModalVisible(true)}
                >
                    <Ionicons name="wallet-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={simulateTransactions}
                    disabled={loading}
                >
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Expense Chart */}
            {expenseData && (
                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Expense Overview</Text>
                    <LineChart
                        data={expenseData}
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
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: '#5196F4'
                            }
                        }}
                        bezier
                        style={styles.chart}
                        legend={['Expenses', 'Budget Limit']}
                        withDots={false}
                    />
                </View>
            )}

            {/* Recent Transactions */}
            <View style={styles.transactionsContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Transactions')}
                        style={styles.viewAllButton}
                    >
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                {transactions.slice(0, 5).map((transaction) => (
                    <View key={transaction.$id} style={styles.transactionItem}>
                        <View style={[styles.transactionIcon, {
                            backgroundColor: transaction.type === 'income' ? '#E8F5E9' : '#FFEBEE'
                        }]}>
                            <Ionicons
                                name={transaction.type === 'income' ? 'trending-up' : 'trending-down'}
                                size={24}
                                color={transaction.type === 'income' ? '#4CAF50' : '#F44336'}
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

            {/* New Budget Modal */}
            <Modal
                visible={isNewBudgetModalVisible}
                animationType="slide"
                transparent={true}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Budget</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Category"
                            placeholderTextColor={'#999'}
                            value={newBudget.category}
                            onChangeText={(text) => setNewBudget({...newBudget, category: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
                            placeholderTextColor={'#999'}
                            keyboardType="numeric"
                            value={newBudget.amount}
                            onChangeText={(text) => setNewBudget({...newBudget, amount: text})}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsNewBudgetModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleCreateBudget}
                            >
                                <Text style={styles.buttonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Budgets List */}
            <View style={styles.budgetsContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Budgets</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setIsNewBudgetModalVisible(true)}
                    >
                        <Text style={styles.addButtonText}>+ Add Budget</Text>
                    </TouchableOpacity>
                </View>
                {budgets.map((budget) => (
                    <View key={budget.$id} style={styles.budgetItem}>
                        <View style={styles.budgetHeader}>
                            <Text style={styles.budgetCategory}>{budget.category}</Text>
                            <Text style={styles.budgetAmount}>
                                {formatCurrency(budget.amount)}
                            </Text>
                        </View>
                        <View style={styles.budgetProgress}>
                            {/* Calculate spent amount from transactions */}
                            {(() => {
                                const spent = transactions
                                    .filter(t =>
                                        t.category === budget.category &&
                                        t.type === 'expense' &&
                                        new Date(t.date).getMonth() === new Date().getMonth()
                                    )
                                    .reduce((sum, t) => sum + t.amount, 0);
                                const percentage = Math.min((spent / budget.amount) * 100, 100);

                                return (
                                    <>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${percentage}%` },
                                                { backgroundColor: percentage > 90 ? '#F44336' : '#4CAF50' }
                                            ]}
                                        />
                                        <Text style={styles.budgetSpent}>
                                            Spent: {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                                        </Text>
                                    </>
                                );
                            })()}
                        </View>
                    </View>
                ))}
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
        padding: 65,
        backgroundColor: '#5196F4',
        marginTop: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
    },
    welcomeText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 40,
        marginLeft: -35,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    balanceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        marginRight: 125,
        marginLeft: -40,
        marginTop: -20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    balanceLabel: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.8,
        fontWeight: '600',
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
        letterSpacing: 1,
    },
    quickActions: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: 10,
        marginTop: -190,
        marginLeft: 280,
        marginRight: -100,
        zIndex: 1,
    },
    actionButton: {
        padding: 15,
        borderRadius: 100,
        width: '25%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.1)',

    },
    chartContainer: {
        backgroundColor: 'white',
        marginTop: 30,
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    },
    budgetLineContainer: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 10,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    },
    budgetLineTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    budgetLineInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    budgetLineText: {
        fontSize: 14,
        color: '#666',
    },
    budgetLineAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5196F4',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        letterSpacing: 0.5,
    },
    chart: {
        marginVertical: 3,
        borderRadius: 16,
        marginLeft: -15,
    },
    transactionsContainer: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
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
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionCategory: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    transactionDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    budgetProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    addBudgetButton: {
        backgroundColor: '#5196F4',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    addBudgetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#F44336',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    refreshButton: {
        backgroundColor: '#5196F4',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: -40,
        marginBottom: 20,
    },
    viewAllButton: {
        padding: 5,
    },
    viewAllText: {
        color: '#5196F4',
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        width: '80%',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#F44336',
        padding: 15,
        borderRadius: 15,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 15,
    },
    incomeContainer: {
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 15,

    },
    budgetsContainer: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    },
    budgetItem: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    budgetCategory: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    budgetAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5196F4',
    },
    budgetProgress: {
        height: 30,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        position: 'absolute',
        left: 0,
    },
    budgetSpent: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        lineHeight: 30,
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: '#5196F4',
        padding: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default HomeScreen;