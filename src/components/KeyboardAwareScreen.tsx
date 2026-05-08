 import React, { ReactNode, RefObject } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareScreenProps {
    children: ReactNode;
    footer?: ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
    scrollViewStyle?: StyleProp<ViewStyle>;
    scrollRef?: RefObject<ScrollView | null>;
    keyboardVerticalOffset?: number;
    showsVerticalScrollIndicator?: boolean;
}

export function KeyboardAwareScreen({
    children,
    footer,
    style,
    contentContainerStyle,
    scrollViewStyle,
    scrollRef,
    keyboardVerticalOffset = 0,
    showsVerticalScrollIndicator = false,
}: KeyboardAwareScreenProps) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={[styles.container, style]}
        >
            <ScrollView
                ref={scrollRef}
                style={[styles.scroll, scrollViewStyle]}
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            >
                {children}
            </ScrollView>
            {footer ? <View style={styles.footerHost}>{footer}</View> : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    footerHost: {
        flexShrink: 0,
    },
});
