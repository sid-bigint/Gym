import React, { ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareModalProps {
    children: ReactNode;
    overlayStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    keyboardVerticalOffset?: number;
}

export function KeyboardAwareModal({
    children,
    overlayStyle,
    contentStyle,
    keyboardVerticalOffset = 0,
}: KeyboardAwareModalProps) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={[styles.overlay, overlayStyle]}
        >
            <View style={contentStyle}>
                {children}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
});
