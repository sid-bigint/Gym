import React from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { ExerciseSelector } from './ExerciseSelector';
import { Exercise } from '../types';
import { useTheme } from '../store/useTheme';

interface ExercisePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (exercises: Exercise[]) => void;
    multiSelect?: boolean;
    initialSelected?: number[];
}

export const ExercisePicker = ({ visible, onClose, onSelect, multiSelect, initialSelected }: ExercisePickerProps) => {
    const { colors } = useTheme();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet" // Nice card effect on iOS
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
                <ExerciseSelector
                    onClose={onClose}
                    onSelect={onSelect}
                    multiSelect={multiSelect}
                    initialSelected={initialSelected}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
