import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ScrollView,
} from 'react-native';
import { formatTimeSlot } from './appointmentUtils';

export const AppointmentCalendar = ({ availableSlots, selectedDate, selectedSlot, onDateSelect, onSlotSelect }) => {
    return (
        <View style={styles.calendarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.entries(availableSlots).map(([date, dayData]) => (
                    <TouchableOpacity
                        key={date}
                        style={[
                            styles.dateButton,
                            selectedDate === date && styles.selectedDateButton
                        ]}
                        onPress={() => onDateSelect(date)}
                    >
                        <Text style={[
                            styles.dateText,
                            selectedDate === date && styles.selectedDateText
                        ]}>
                            {dayData.dayName}
                        </Text>
                        <Text style={[
                            styles.dateSubText,
                            selectedDate === date && styles.selectedDateText
                        ]}>
                            {new Date(date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {selectedDate && availableSlots[selectedDate]?.slots.length > 0 && (
                <View style={styles.timeSlotContainer}>
                    <Text style={styles.sectionTitle}>Available Times</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availableSlots[selectedDate].slots.map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.timeSlot,
                                    selectedSlot === slot.time.toISOString() && styles.selectedTimeSlot
                                ]}
                                onPress={() => onSlotSelect(slot.time.toISOString())}
                            >
                                <Text style={[
                                    styles.timeText,
                                    selectedSlot === slot.time.toISOString() && styles.selectedTimeText
                                ]}>
                                    {formatTimeSlot(slot.time)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export const UserInfoForm = ({ email, name, onEmailChange, onNameChange }) => {
    return (
        <View style={styles.formContainer}>
            <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={name}
                onChangeText={onNameChange}
                placeholderTextColor="#666"
            />
            <TextInput
                style={styles.input}
                placeholder="Your Email"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
                editable={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    dateButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        marginRight: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    selectedDateButton: {
        backgroundColor: '#4834DF',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    dateSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    selectedDateText: {
        color: '#FFFFFF',
    },
    timeSlotContainer: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 8,
    },
    timeSlot: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        marginRight: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    selectedTimeSlot: {
        backgroundColor: '#4834DF',
    },
    timeText: {
        fontSize: 16,
        color: '#2C3E50',
    },
    selectedTimeText: {
        color: '#FFFFFF',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#F8F9FB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        color: '#2C3E50',
    },
});