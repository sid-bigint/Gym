import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';

interface LongPressMenuProps {
    visible: boolean;
    onClose: () => void;
    options: {
        label: string;
        icon: any;
        onPress: () => void;
        variant?: 'danger' | 'primary';
    }[];
    title?: string;
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({ visible, onClose, options, title }) => {
    const { colors } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={[styles.content, { backgroundColor: colors.background.elevated }]}>
                    {title && (
                        <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                            <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
                        </View>
                    )}
                    <View style={styles.options}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.option,
                                    index < options.length - 1 && { borderBottomColor: colors.border.secondary, borderBottomWidth: 1 }
                                ]}
                                onPress={() => {
                                    option.onPress();
                                    onClose();
                                }}
                            >
                                <Ionicons 
                                    name={option.icon} 
                                    size={20} 
                                    color={option.variant === 'danger' ? colors.accent.warning : colors.text.primary} 
                                />
                                <Text style={[
                                    styles.optionLabel, 
                                    { color: option.variant === 'danger' ? colors.accent.warning : colors.text.primary }
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background.card }]} onPress={onClose}>
                        <Text style={[styles.cancelText, { color: colors.text.secondary }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    options: {
        paddingVertical: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    cancelBtn: {
        padding: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
