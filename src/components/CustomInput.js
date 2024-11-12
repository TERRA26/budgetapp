import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

function CustomInput({ style, ...props }) {
    return (
        <TextInput
            style={[styles.input, style]}
            placeholderTextColor="#999"
            autoCapitalize="none"
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        fontSize: 16,
        color: '#333',
    },
});

export default CustomInput;