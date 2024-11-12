// src/components/CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

function CustomButton({ title, onPress, style, textStyle, icon }) {
    const isOutlined = style?.backgroundColor === '#fff' || style?.backgroundColor === 'white';

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[
                    styles.buttonText,
                    isOutlined && styles.outlinedButtonText,
                    textStyle
                ]}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    outlinedButtonText: {
        color: '#2196F3',
    },
    iconContainer: {
        marginRight: 10,
    },
});

export default CustomButton;