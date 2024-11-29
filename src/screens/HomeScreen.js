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
import {databases, account, updateBudgetSavings} from '../services/appwrite';
import {LinearGradient} from "expo-linear-gradient";
import { calculateBudgetProgress } from '../services/BudgetService';
import BudgetProgressCard from "../components/BudgetProgressCard";

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
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    const [savingsAmount, setSavingsAmount] = useState('');
    const [isSavingsModalVisible, setIsSavingsModalVisible] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState(null);
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

    const fetchBudgets = async (userId) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                BUDGETS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            );

            const processedBudgets = response.documents.map(budget => ({
                ...budget,
                progress: calculateBudgetProgress(budget)
            }));

            setBudgets(processedBudgets);
            return processedBudgets;
        } catch (error) {
            console.error('Error fetching budgets:', error);
            Alert.alert('Error', 'Failed to fetch budget data');
        }
    };

    const handleUpdateSavings = async () => {
        try {
            if (!selectedBudget) {
                throw new Error('No budget selected');
            }

            const numAmount = parseFloat(savingsAmount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (numAmount > profile.currentBalance) {
                throw new Error('Insufficient available balance');
            }

            console.log(`Updating budget savings for budget ID: ${selectedBudget.$id} with amount: ${numAmount}`);
            await updateBudgetSavings(selectedBudget.$id, numAmount);

            const budgetsResponse = await databases.listDocuments(
                DATABASE_ID,
                BUDGETS_COLLECTION_ID,
                [Query.equal('userId', profile.userId)]
            );

            const totalSavings = budgetsResponse.documents.reduce((sum, budget) =>
                sum + (parseFloat(budget.currentSaved) || 0), 0);

            console.log(`Updating user profile with new balance: ${profile.currentBalance - numAmount} and total savings: ${totalSavings}`);
            const updatedProfile = await updateUserProfile({
                currentBalance: profile.currentBalance - numAmount,
                totalSavings: totalSavings
            });

            setProfile(updatedProfile);
            setIsSavingsModalVisible(false);
            setSavingsAmount('');
            setSelectedBudget(null);

            fetchBudgets(profile.userId);

            Alert.alert('Success', 'Savings updated successfully');
        } catch (error) {
            console.error('Error updating savings:', error);
            Alert.alert('Error', error.message || 'Failed to update savings');
        }
    };

    const submitSavingsUpdate = async () => {
        if (!savingsAmount || isNaN(savingsAmount)) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        try {
            await updateBudgetSavings(selectedBudgetId, parseFloat(savingsAmount));
            await fetchBudgets(user.$id);
            setIsModalVisible(false);
            setSavingsAmount('');
            Alert.alert('Success', 'Savings updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update savings');
        }
    };

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
                    ? Math.floor(Math.random() * (monthlyIncome * 0.5))
                    : Math.floor(Math.random() * (monthlyIncome * 0.7));

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
                        <Text style={styles.balanceLabel}>Available Balance</Text>
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

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Savings Overview</Text>
                        <Text style={styles.summarySubtitle}>
                            Track your progress towards financial goals
                        </Text>
                        <View style={styles.balanceCard1}>
                            <Text style={styles.balanceLabel1}>Total Savings</Text>
                            <Text style={styles.balanceAmount1}>
                                {formatCurrency((profile?.totalSavings || 0))}
                            </Text>
                        </View>
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
                                <View style={styles.savingsInfo}>
                                    <Text>Saved: {formatCurrency(budget.currentSaved || 0)}</Text>
                                    <Text>Goal: {formatCurrency(budget.amount)}</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(
                                                    ((budget.currentSaved || 0) / budget.amount) * 100,
                                                    100
                                                )}%`,
                                                backgroundColor: '#4CAF50',
                                            },
                                        ]}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.addSavingsButton}
                                    onPress={() => {
                                        setSelectedBudget(budget);
                                        setIsSavingsModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.addSavingsButtonText}>Add to Savings</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                </ScrollView>

                {/* Update Savings Modal */}
                <Modal
                    visible={isModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Update Savings</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter amount"
                                keyboardType="decimal-pad"
                                value={savingsAmount}
                                onChangeText={setSavingsAmount}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setIsModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.submitButton]}
                                    onPress={submitSavingsUpdate}
                                >
                                    <Text style={styles.submitButtonText}>Update</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
            <Modal
                visible={isSavingsModalVisible}
                animationType="slide"
                transparent={true}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add to Savings</Text>
                        <Text style={styles.budgetName}>
                            {selectedBudget?.category || ''} Savings Goal
                        </Text>
                        <Text style={styles.currentSavings}>
                            Current Savings: {formatCurrency(selectedBudget?.currentSaved || 0)}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount to save"
                            placeholderTextColor={'#999'}
                            keyboardType="numeric"
                            value={savingsAmount}
                            onChangeText={setSavingsAmount}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setIsSavingsModalVisible(false);
                                    setSavingsAmount('');
                                    setSelectedBudget(null);
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleUpdateSavings}
                            >
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fb',
    },
    headerGradient: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        padding: 25,
        paddingTop: Platform.OS === 'ios' ? 60 : 25,
        paddingBottom: 35,
    },
    welcomeText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    balanceContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 20,
        borderRadius: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    balanceLabel: {
        color: '#fff',
        fontSize: 18,
        opacity: 0.9,
        fontWeight: '600',
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    monthlyIncome: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
        marginTop: 10,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        marginTop: -35,
        marginRight: 15,
        zIndex: 1,
    },
    actionButton: {
        backgroundColor: '#5196F4',
        padding: 12,
        borderRadius: 50,
        marginLeft: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    chartContainer: {
        backgroundColor: '#fff',
        margin: 15,
        marginTop: 25,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 15,
        color: '#2c3e50',
    },
    transactionsContainer: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#f8f9fb',
        borderRadius: 15,
    },
    transactionIcon: {
        width: 45,
        height: 45,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionCategory: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: '600',
    },
    budgetItem: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 25,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: '45%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 25,
    },
    input: {
        backgroundColor: '#f8f9fb',
        padding: 15,
        borderRadius: 15,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
    },
    createButton: {
        backgroundColor: '#2ecc71',
    },
    summaryContainer: {
        margin: 15,
        marginTop: 25,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    summarySubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 15,
    },
    balanceCard1: {
        backgroundColor: '#ecf0f1',
        padding: 20,
        borderRadius: 15,
        marginTop: 10,
    },
    balanceLabel1: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    balanceAmount1: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2980b9',
    },
    budgetProgress: {
        marginTop: 15,
    },
    savingsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 15,
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
    },
    addSavingsButton: {
        backgroundColor: '#27ae60',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    addSavingsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen;