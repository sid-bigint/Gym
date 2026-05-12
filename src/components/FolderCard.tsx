import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useTheme';

interface FolderCardProps {
    folder: { id: number, name: string };
    count: number;
    isExpanded: boolean;
    onToggle: (id: number) => void;
    onDelete?: (id: number) => void;
    onRename?: (id: number, currentName: string) => void;
}

export function FolderCard({ folder, count, isExpanded, onToggle, onDelete, onRename }: FolderCardProps) {
    const { colors } = useTheme();

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={() => onToggle(folder.id)}
            activeOpacity={0.7}
        >
            <View style={styles.leftContent}>
                <Ionicons name={isExpanded ? "folder-open" : "folder"} size={24} color={colors.accent.primary} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.name, { color: colors.text.primary }]}>{folder.name}</Text>
                    <Text style={[styles.count, { color: colors.text.tertiary }]}>{count} routines</Text>
                </View>
            </View>

            <View style={styles.rightContent}>
                {onRename && (
                    <TouchableOpacity onPress={() => onRename(folder.id, folder.name)} style={{ padding: 8, marginRight: 4 }}>
                        <Ionicons name="pencil" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity onPress={() => onDelete(folder.id)} style={{ padding: 8, marginRight: 8 }}>
                        <Ionicons name="trash" size={18} color={colors.status.error} />
                    </TouchableOpacity>
                )}
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    count: {
        fontSize: 13,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
