import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const BudgetProgressCard = ({ budget, onUpdateSavings }) => {
    const { progress, remaining, monthlyRequired, isCompleted } = budget.progress || {};

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.categoryContainer}>
                    <MaterialIcons
                        name="savings"
                        size={24}
                        color="#1976D2"
                    />
                    <Text style={styles.categoryText}>{budget.category}</Text>
                </View>
                <Text style={styles.periodText}>{budget.period}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                            isCompleted && styles.progressCompleted
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {progress?.toFixed(1)}% Saved
                </Text>
            </View>

            {/* Amount Details */}
            <View style={styles.amountContainer}>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Goal:</Text>
                    <Text style={styles.amountValue}>
                        ${budget.savingsGoal?.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Saved:</Text>
                    <Text style={styles.amountValue}>
                        ${budget.currentSaved?.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Remaining:</Text>
                    <Text style={styles.amountValue}>
                        ${remaining?.toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* Monthly Target */}
            <View style={styles.targetContainer}>
                <MaterialIcons name="timeline" size={20} color="#666" />
                <Text style={styles.targetText}>
                    Monthly Target: ${monthlyRequired?.toFixed(2)}
                </Text>
            </View>

            {/* Update Button */}
            <TouchableOpacity
                style={styles.updateButton}
                onPress={() => onUpdateSavings(budget.$id)}
            >
                <MaterialIcons name="add" size={20} color="#FFF" />
                <Text style={styles.updateButtonText}>Add Savings</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
        color: '#1976D2',
    },
    periodText: {
        fontSize: 14,
        color: '#666',
        textTransform: 'capitalize',
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBackground: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1976D2',
        borderRadius: 4,
    },
    progressCompleted: {
        backgroundColor: '#4CAF50',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    amountContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    amountLabel: {
        fontSize: 14,
        color: '#666',
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    targetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    targetText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1976D2',
        borderRadius: 8,
        padding: 12,
    },
    updateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default BudgetProgressCard;