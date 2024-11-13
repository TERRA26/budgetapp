import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Query } from 'appwrite';
import { databases, account } from '../services/appwrite';
import { LinearGradient } from 'expo-linear-gradient';

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
    const [newTransaction, setNewTransaction] = useState({
        amount: '',
        category: '',
        description: '',
        type: 'expense'
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

    // Create new budget handler
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

    // Create new transaction handler
    const handleCreateTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.category) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await createTransaction({
                amount: parseFloat(newTransaction.amount),
                category: newTransaction.category,
                description: newTransaction.description || '',
                type: newTransaction.type,
                date: new Date().toISOString()
            });

            setIsNewTransactionModalVisible(false);
            setNewTransaction({
                amount: '',
                category: '',
                description: '',
                type: 'expense'
            });
            fetchData();
            Alert.alert('Success', 'Transaction created successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to create transaction');
        }
    };

    // Modified generateExpenseData to remove dots
    const generateExpenseData = (transactionsData, profile) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyIncome = profile?.monthlyIncome || 5000;
        const historicalData = generateHistoricalData(monthlyIncome);
        const budgetLine = historicalData.budgetLine;

        const chartData = {
            labels: months,
            datasets: [
                {
                    data: historicalData.expenses,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    strokeWidth: 3
                },
                {
                    data: Array(12).fill(budgetLine),
                    color: (opacity = 1) => `rgba(255, 182, 193, ${opacity})`,
                    strokeWidth: 2,
                    dashPattern: [5, 5]
                }
            ],
            legend: ['Expenses', 'Budget Limit']
        };

        setExpenseData(chartData);
    };

    // Rest of your existing functions...

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#6C63FF']}
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
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsNewTransactionModalVisible(true)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>New Transaction</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsNewBudgetModalVisible(true)}
                >
                    <Ionicons name="wallet-outline" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>New Budget</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.simulateButton}
                    onPress={simulateTransactions}
                    disabled={loading}
                >
                    <Ionicons name="refresh" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Simulate</Text>
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
                            backgroundColor: '#1a1a1a',
                            backgroundGradient: {
                                colors: ['#4834DF', '#6C63FF'],
                                start: { x: 0, y: 0 },
                                end: { x: 1, y: 1 },
                            },
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            style: {
                                borderRadius: 16,
                            },
                            propsForDots: {
                                r: '0',
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            )}

            {/* Recent Transactions Section */}
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
                            value={newBudget.category}
                            onChangeText={(text) => setNewBudget({...newBudget, category: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
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

            {/* New Transaction Modal */}
            <Modal
                visible={isNewTransactionModalVisible}
                animationType="slide"
                transparent={true}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Transaction</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Amount"
                            keyboardType="numeric"
                            value={newTransaction.amount}
                            onChangeText={(text) => setNewTransaction({...newTransaction, amount: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Category"
                            value={newTransaction.category}
                            onChangeText={(text) => setNewTransaction({...newTransaction, category: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Description (optional)"
                            value={newTransaction.description}
                            onChangeText={(text) => setNewTransaction({...newTransaction, description: text})}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsNewTransactionModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleCreateTransaction}
                            >
                                <Text style={styles.buttonText}>Create</Text>
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
        backgroundColor: '#f8f9fa',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        padding: 20,
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
        marginTop: 10,
    },
    balanceLabel: {
        color: '#fff',