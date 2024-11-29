import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createAccount, createUserProfile } from '../services/appwrite';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { PROFILE_TYPES, SAVING_GOALS } from '../services/ProfileService';

const { width, height } = Dimensions.get('window');

function RegisterScreen({ navigation }) {
    // User Authentication State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Basic Profile State
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [profileType, setProfileType] = useState(PROFILE_TYPES.PERSONAL);

    // Financial Goals State
    const [savingGoal, setSavingGoal] = useState(SAVING_GOALS.EMERGENCY);
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState(new Date());
    const [riskTolerance, setRiskTolerance] = useState('medium');
    const [preferredBudgetInterval, setPreferredBudgetInterval] = useState('monthly');

    // Bank Connection State
    const [connectedBanks, setConnectedBanks] = useState([]);
    const [isConnectingBank, setIsConnectingBank] = useState(false);

    // UI State
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateBasicInfo = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!age) newErrors.age = 'Age is required';
        else if (isNaN(age) || parseInt(age) < 18) newErrors.age = 'Must be at least 18 years old';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateFinancialInfo = () => {
        const newErrors = {};

        if (!monthlyIncome) newErrors.monthlyIncome = 'Monthly income is required';
        else if (isNaN(monthlyIncome) || parseFloat(monthlyIncome) <= 0) {
            newErrors.monthlyIncome = 'Please enter a valid income amount';
        }

        if (!targetAmount) newErrors.targetAmount = 'Target amount is required';
        else if (isNaN(targetAmount) || parseFloat(targetAmount) <= 0) {
            newErrors.targetAmount = 'Please enter a valid target amount';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const simulateBankConnection = async (bankName) => {
        setIsConnectingBank(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newBank = {
                id: Date.now().toString(),
                name: bankName,
                balance: Math.floor(Math.random() * 10000) + 1000,
                accountType: 'Checking',
                accountNumber: '*'.repeat(8) + Math.floor(Math.random() * 1000)
            };

            setConnectedBanks(prev => [...prev, newBank]);
            Alert.alert('Success', `Connected to ${bankName} successfully!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to bank. Please try again.');
        } finally {
            setIsConnectingBank(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !validateBasicInfo()) return;
        if (currentStep === 2 && !validateFinancialInfo()) return;
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateBasicInfo() || !validateFinancialInfo()) return;

        setIsLoading(true);
        try {
            // Create user account
            const userAccount = await createAccount(email, password, name);

            // Calculate initial available balance from connected bank accounts
            const initialBalance = connectedBanks.reduce((total, bank) => total + bank.balance, 0);

            // Calculate budget limits based on monthly income
            const monthlyBudgetLimit = parseFloat(monthlyIncome) * 0.8; // 80% of income
            const weeklyBudgetLimit = monthlyBudgetLimit / 4;
            const dailyBudgetLimit = weeklyBudgetLimit / 7;

            const connectedAccounts = JSON.stringify(connectedBanks);
            if (connectedAccounts.length > 2000) {
                throw new Error('Connected accounts data exceeds the maximum allowed length of 200 characters.');
            }

            // Create user profile
            const profileData = {
                userId: userAccount.$id,
                name,
                age: parseInt(age),
                profileType,
                monthlyIncome: parseFloat(monthlyIncome),
                savingGoals: savingGoal,
                targetAmount: parseFloat(targetAmount),
                targetDate: targetDate.toISOString(),
                currentBalance: initialBalance,
                riskTolerance,
                preferredBudgetInterval,
                connectedAccounts,
                dailyBudgetLimit,
                weeklyBudgetLimit,
                monthlyBudgetLimit
            };

            await createUserProfile(profileData);

            // Updated navigation code
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: 'MainApp',
                        params: {
                            screen: 'HomeTab',
                            params: {
                                message: 'Account created successfully! Welcome to your dashboard.'
                            }
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderBasicInfoStep = () => (
        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                        style={[styles.input, errors.name && styles.inputError]}
                    />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        style={[styles.input, errors.email && styles.inputError]}
                    />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Create a strong password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={[styles.input, errors.password && styles.inputError]}
                    />
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="cake" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Enter your age"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        style={[styles.input, errors.age && styles.inputError]}
                    />
                </View>
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>
        </View>
    );

    const renderFinancialInfoStep = () => (
        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Monthly Income</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="attach-money" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Enter your monthly income"
                        value={monthlyIncome}
                        onChangeText={setMonthlyIncome}
                        keyboardType="numeric"
                        style={[styles.input, errors.monthlyIncome && styles.inputError]}
                    />
                </View>
                {errors.monthlyIncome && <Text style={styles.errorText}>{errors.monthlyIncome}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Choose Your First Saving Goal</Text>
                <View style={styles.goalOptions}>
                    {Object.values(SAVING_GOALS).map((goal) => (
                        <TouchableOpacity
                            key={goal}
                            style={[
                                styles.goalOption,
                                savingGoal === goal && styles.selectedGoal
                            ]}
                            onPress={() => setSavingGoal(goal)}
                        >
                            <Text style={[
                                styles.goalText,
                                savingGoal === goal && styles.selectedGoalText
                            ]}>
                                {goal.charAt(0).toUpperCase() + goal.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Amount</Text>
                <View style={styles.inputWrapper}>
                    <MaterialIcons name="flag" size={20} color="#666" style={styles.inputIcon} />
                    <CustomInput
                        placeholder="Enter target amount"
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        keyboardType="numeric"
                        style={[styles.input, errors.targetAmount && styles.inputError]}
                    />
                </View>
                {errors.targetAmount && <Text style={styles.errorText}>{errors.targetAmount}</Text>}
            </View>
        </View>
    );

    const renderBankConnectionStep = () => (
        <View style={styles.formContainer}>
            <View style={styles.bankSection}>
                <Text style={styles.sectionTitle}>Connect Your Banks</Text>
                <Text style={styles.sectionDescription}>
                    Connect your bank accounts to get personalized insights and automatic expense tracking
                </Text>

                {connectedBanks.map(bank => (
                    <View key={bank.id} style={styles.connectedBank}>
                        <MaterialIcons name="account-balance" size={24} color="#1976D2" />
                        <View style={styles.bankInfo}>
                            <Text style={styles.bankName}>{bank.name}</Text>
                            <Text style={styles.accountNumber}>Account: {bank.accountNumber}</Text>
                        </View>
                        <Text style={styles.bankBalance}>${bank.balance.toLocaleString()}</Text>
                    </View>
                ))}

                <View style={styles.bankButtons}>
                    <TouchableOpacity
                        style={styles.bankButton}
                        onPress={() => simulateBankConnection('CIBC')}
                        disabled={isConnectingBank}
                    >
                        <MaterialIcons name="add" size={24} color="#1976D2" />
                        <Text style={styles.bankButtonText}>CIBC</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bankButton}
                        onPress={() => simulateBankConnection('ECAB')}
                        disabled={isConnectingBank}
                    >
                        <MaterialIcons name="add" size={24} color="#1976D2" />
                        <Text style={styles.bankButtonText}>ECAB</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bankButton}
                        onPress={() => simulateBankConnection('ACB')}
                        disabled={isConnectingBank}
                    >
                        <MaterialIcons name="add" size={24} color="#1976D2" />
                        <Text style={styles.bankButtonText}>ACB</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => currentStep > 1 ? handlePrevStep() : navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color="#1976D2" />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Create Profile</Text>
                            <Text style={styles.subtitle}>Step {currentStep} of 3</Text>
                        </View>
                    </View>

                    <View style={styles.progressBar}>
                        {[1, 2, 3].map(step => (
                            <View
                                key={step}
                                style={[
                                    styles.progressStep,
                                    currentStep >= step && styles.progressStepActive,
                                ]}
                            />
                        ))}
                    </View>

                    {currentStep === 1 && renderBasicInfoStep()}
                    {currentStep === 2 && renderFinancialInfoStep()}
                    {currentStep === 3 && renderBankConnectionStep()}

                    <View style={styles.buttonContainer}>
                        {currentStep < 3 ? (
                            <CustomButton
                                title="Next Step"
                                onPress={handleNextStep}
                                style={styles.actionButton}
                            />
                        ) : (
                            <CustomButton
                                title={isLoading ? "Creating Profile..." : "Complete Setup"}
                                onPress={handleSubmit}
                                style={styles.actionButton}
                                disabled={isLoading}
                            />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    titleContainer: {
        marginLeft: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    progressBar: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
    },
    progressStep: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
        borderRadius: 2,
    },
    progressStepActive: {
        backgroundColor: '#1976D2',
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: '#ff5252',
        fontSize: 12,
        marginTop: 4,
    },
    bankSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    connectedBank: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 12,
    },
    bankInfo: {
        flex: 1,
        marginLeft: 12,
    },
    bankName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    accountNumber: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    bankBalance: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
    },
    bankButtons: {
        marginTop: 16,
    },
    bankButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1976D2',
        marginBottom: 12,
    },
    bankButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#1976D2',
        fontWeight: '600',
    },
    goalOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    goalOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        marginBottom: 8,
    },
    selectedGoal: {
        backgroundColor: '#1976D2',
    },
    goalText: {
        color: '#666',
    },
    selectedGoalText: {
        color: '#fff',
    },
    buttonContainer: {
        padding: 20,
    },
    actionButton: {
        backgroundColor: '#1976D2',
        height: 56,
        borderRadius: 28,
    },
});

export default RegisterScreen;