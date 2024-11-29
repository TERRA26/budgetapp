import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { databases, account } from '../services/appwrite';
import { Query } from 'appwrite';
import { AppointmentCalendar, UserInfoForm } from './AppointmentComponents';
import {
    fetchAvailableSlots,
    scheduleAppointment,
} from './appointmentUtils';

const API_KEY = 'AIzaSyCn_znKDE8OF2LHS1jpB1xWm6Mtn_GlQds';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const DATABASE_ID = 'budgetease';
const PROFILES_COLLECTION = 'profiles';
const TRANSACTIONS_COLLECTION = 'transactions';
const BUDGETS_COLLECTION = 'budgets';

const ChatbotScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollViewRef = useRef();

    // Appointment scheduling states
    const [showCalendar, setShowCalendar] = useState(false);
    const [availableSlots, setAvailableSlots] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isCollectingInfo, setIsCollectingInfo] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchUserData();

        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    const fetchUserData = async () => {
        try {
            const user = await account.get();
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROFILES_COLLECTION,
                [Query.equal('userId', user.$id)]
            );

            if (response.documents.length > 0) {
                const profile = response.documents[0];
                setUserProfile(profile);
                setUserName(profile.name || '');
                setUserEmail(profile.email || user.email || '');

                const welcomeMessage = {
                    id: '1',
                    text: `Hi ${profile.name}! I'm your BudgetEase assistant. I can help you with:

1. Managing your finances - Your current balance is $${profile.currentBalance.toFixed(2)} with a monthly income of $${profile.monthlyIncome.toFixed(2)}.
2. Setting up meetings with our team - Just ask to schedule a consultation.

How can I assist you today?`,
                    sender: 'bot',
                };
                setMessages([welcomeMessage]);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleSchedulingRequest = async () => {
        setIsLoading(true);
        try {
            const slots = await fetchAvailableSlots();
            setAvailableSlots(slots);
            setShowCalendar(true);
            setIsCollectingInfo(true);

            const schedulingMessage = {
                text: "I'll help you schedule an appointment with our team. Please select a date and time that works best for you.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, schedulingMessage]);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            const errorMessage = {
                text: "I'm having trouble accessing the scheduling system. Please try again later.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    const handleAppointmentScheduling = async () => {
        if (!selectedSlot) {
            const missingInfoMessage = {
                text: "Please select a time slot for your appointment.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, missingInfoMessage]);
            return;
        }

        setIsLoading(true);
        try {
            const result = await scheduleAppointment(selectedSlot, userEmail, userName, messages);

            const confirmationMessage = {
                text: `Great! Your appointment is confirmed for ${result.startDate} EST. You'll receive a confirmation email at ${userEmail} with the details. Is there anything else I can help you with?`,
                sender: 'bot'
            };
            setMessages(prev => [...prev, confirmationMessage]);

            // Reset scheduling states
            setShowCalendar(false);
            setIsCollectingInfo(false);
            setSelectedSlot(null);
            setSelectedDate(null);

        } catch (error) {
            const errorMessage = {
                text: "I apologize, but we're experiencing technical difficulties with scheduling. Please try again or contact our support team.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    const formatAIResponse = (text) => {
        // Remove asterisks and clean up formatting
        return text
            .replace(/\*/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\.(?=\S)/g, '. ')
            .trim();
    };

    const sendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
        };

        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Check for scheduling-related keywords
            if (inputText.toLowerCase().includes('schedule') ||
                inputText.toLowerCase().includes('appointment') ||
                inputText.toLowerCase().includes('book a time') ||
                inputText.toLowerCase().includes('meet') ||
                inputText.toLowerCase().includes('consultation')) {
                await handleSchedulingRequest();
                setIsLoading(false);
                return;
            }

            // Fetch recent transactions and budgets
            let recentTransactionsSummary = '';
            let budgetsSummary = '';

            try {
                const user = await account.get();

                const transactionsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    TRANSACTIONS_COLLECTION,
                    [
                        Query.equal('userId', user.$id),
                        Query.orderDesc('date'),
                        Query.limit(5)
                    ]
                );

                if (transactionsResponse.documents.length > 0) {
                    recentTransactionsSummary = transactionsResponse.documents
                        .map(t => `${t.date.split('T')[0]}: ${t.description} - $${t.amount}`)
                        .join('\n');
                }

                const budgetsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    BUDGETS_COLLECTION,
                    [Query.equal('userId', user.$id)]
                );

                if (budgetsResponse.documents.length > 0) {
                    budgetsSummary = budgetsResponse.documents
                        .map(b => `${b.category}: $${b.allocated} (${b.spent ? ((b.spent/b.allocated) * 100).toFixed(1) : 0}% used)`)
                        .join('\n');
                }
            } catch (error) {
                console.error('Error fetching financial data:', error);
            }

            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a dual-purpose AI assistant for BudgetEase (a Theta company):

1. Budget Planning Assistant for ${userProfile?.name || 'the user'}:
Current financial status:
- Current balance: $${userProfile?.currentBalance || 0}
- Monthly income: $${userProfile?.monthlyIncome || 0}
- Total savings: $${userProfile?.totalSavings || 0}

Recent transactions:
${recentTransactionsSummary || 'No recent transactions available'}

Current budgets:
${budgetsSummary || 'No budget categories set up yet'}

2. Customer Service:
- You can help schedule consultations with the BudgetEase team
- You represent Theta, the parent company of BudgetEase

Previous messages: ${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}
User message: ${inputText}

Provide clear, specific advice without using asterisks. Reference actual numbers from their financial data when relevant. Be encouraging but realistic.`
                        }]
                    }]
                }),
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const botMessage = {
                    id: (Date.now() + 1).toString(),
                    text: formatAIResponse(data.candidates[0].content.parts[0].text),
                    sender: 'bot',
                };
                setMessages(prevMessages => [...prevMessages, botMessage]);
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, but I'm having trouble connecting right now. Please try again.",
                sender: 'bot',
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }

        setIsLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <LinearGradient
                    colors={['#4834DF', '#6C63FF']}
                    style={styles.header}
                >
                    <Text style={styles.headerText}>BudgetEase Assistant</Text>
                </LinearGradient>

                <ScrollView
                    ref={scrollViewRef}
                    style={[
                        styles.messagesContainer,
                        { marginBottom: keyboardHeight > 0 ? 60 : 0 }
                    ]}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageBubble,
                                message.sender === 'user'
                                    ? styles.userBubble
                                    : styles.botBubble,
                            ]}
                        >
                            {message.sender === 'bot' && (
                                <View style={styles.botIconContainer}>
                                    <Ionicons name="chatbubble-ellipses" size={24} color="#4834DF" />
                                </View>
                            )}
                            <View style={[
                                styles.messageContent,
                                message.sender === 'user' ? styles.userMessageContent : styles.botMessageContent
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    message.sender === 'user' ? styles.userText : styles.botText
                                ]}>
                                    {message.text}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4834DF" />
                        </View>
                    )}

                    {showCalendar && (
                        <View style={styles.schedulingContainer}>
                            <AppointmentCalendar
                                availableSlots={availableSlots}
                                selectedDate={selectedDate}
                                selectedSlot={selectedSlot}
                                onDateSelect={setSelectedDate}
                                onSlotSelect={setSelectedSlot}
                            />
                            {isCollectingInfo && (
                                <View>
                                    <UserInfoForm
                                        email={userEmail}
                                        name={userName}
                                        onEmailChange={setUserEmail}
                                        onNameChange={setUserName}
                                    />
                                    <TouchableOpacity
                                        style={[
                                            styles.scheduleButton,
                                            !selectedSlot && styles.scheduleButtonDisabled
                                        ]}
                                        onPress={handleAppointmentScheduling}
                                        disabled={!selectedSlot || isLoading}
                                    >
                                        <Text style={styles.scheduleButtonText}>
                                            Schedule Appointment
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={[
                    styles.inputContainer,
                    { bottom: keyboardHeight }
                ]}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask me anything..."
                        placeholderTextColor="#666"
                        multiline
                        maxHeight={100}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 0 : 16,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 80,
    },
    messageBubble: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botBubble: {
        alignSelf: 'flex-start',
    },
    botIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageContent: {
        padding: 12,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        flex: 1,
    },
    userMessageContent: {
        backgroundColor: '#4834DF',
    },
    botMessageContent: {
        backgroundColor: '#FFFFFF',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    userText: {
        color: '#FFFFFF',
    },
    botText: {
        color: '#2C3E50',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
    },
    input: {
        flex: 1,
        backgroundColor: '#F8F9FB',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 12,
        fontSize: 16,
        color: '#2C3E50',
        maxHeight: 100,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    sendButton: {
        backgroundColor: '#4834DF',
        borderRadius: 25,
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sendButtonDisabled: {
        backgroundColor: '#95A5A6',
        opacity: 0.7,
    },
    loadingContainer: {
        padding: 8,
        alignItems: 'center',
    },
    schedulingContainer: {
        margin: 16,
        backgroundColor: '#F8F9FB',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    scheduleButton: {
        backgroundColor: '#4834DF',
        borderRadius: 25,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    scheduleButtonDisabled: {
        backgroundColor: '#95A5A6',
        opacity: 0.7,
    },
    scheduleButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default ChatbotScreen;