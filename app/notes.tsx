import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { useTheme } from '../src/store/useTheme';
import { NotebookItem, useNotesStore } from '../src/store/useNotesStore';
import { shadows, spacing } from '../src/constants/theme';

type FilterType = 'all' | 'note' | 'task';

export default function NotesScreen() {
    const { colors, mode } = useTheme();
    const { items, addItem, toggleTask, deleteItem } = useNotesStore();
    const [type, setType] = useState<'note' | 'task'>('note');
    const [filter, setFilter] = useState<FilterType>('all');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');

    const filteredItems = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter((item) => item.type === filter);
    }, [filter, items]);

    const taskStats = useMemo(() => {
        const tasks = items.filter((item) => item.type === 'task');
        const done = tasks.filter((item) => item.isDone).length;
        return { done, total: tasks.length };
    }, [items]);

    const handleAdd = () => {
        const safeTitle = title.trim();
        const safeBody = body.trim();

        if (!safeTitle && !safeBody) return;

        addItem({
            title: safeTitle || (type === 'task' ? 'Untitled task' : 'Untitled note'),
            body: safeBody,
            type,
        });
        setTitle('');
        setBody('');
    };

    const confirmDelete = (item: NotebookItem) => {
        Alert.alert('Delete item?', item.title, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
        ]);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background.primary }]}
        >
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.background.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={[styles.eyebrow, { color: colors.text.tertiary }]}>NOTEBOOK</Text>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Notes & Tasks</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.accent.primary + '18' }]}>
                    <Text style={[styles.statPillText, { color: colors.accent.primary }]}>
                        {taskStats.done}/{taskStats.total}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.composer, { backgroundColor: colors.background.card }]}>
                    <View style={styles.segment}>
                        {(['note', 'task'] as const).map((itemType) => (
                            <TouchableOpacity
                                key={itemType}
                                style={[
                                    styles.segmentButton,
                                    type === itemType && { backgroundColor: colors.accent.primary },
                                ]}
                                onPress={() => setType(itemType)}
                            >
                                <Ionicons
                                    name={itemType === 'note' ? 'document-text-outline' : 'checkbox-outline'}
                                    size={17}
                                    color={type === itemType ? 'white' : colors.text.secondary}
                                />
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: type === itemType ? 'white' : colors.text.secondary },
                                    ]}
                                >
                                    {itemType === 'note' ? 'Note' : 'Task'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={[styles.titleInput, { color: colors.text.primary, borderBottomColor: colors.border.secondary }]}
                        placeholder={type === 'task' ? 'Task title' : 'Note title'}
                        placeholderTextColor={colors.text.disabled}
                        value={title}
                        onChangeText={setTitle}
                    />
                    <TextInput
                        style={[styles.bodyInput, { color: colors.text.primary, backgroundColor: colors.background.elevated }]}
                        placeholder={type === 'task' ? 'Add details, reps, habits, reminders...' : 'Write workout thoughts, ideas, cues...'}
                        placeholderTextColor={colors.text.disabled}
                        value={body}
                        onChangeText={setBody}
                        multiline
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.accent.primary }]}
                        onPress={handleAdd}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add to Notebook</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    {(['all', 'note', 'task'] as const).map((filterType) => (
                        <TouchableOpacity
                            key={filterType}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: filter === filterType ? colors.text.primary : colors.background.card,
                                    borderColor: colors.border.secondary,
                                },
                            ]}
                            onPress={() => setFilter(filterType)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: filter === filterType ? colors.background.primary : colors.text.secondary },
                                ]}
                            >
                                {filterType === 'all' ? 'All' : filterType === 'note' ? 'Notes' : 'Tasks'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {filteredItems.map((item) => (
                    <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.background.card }]}>
                        <View style={styles.itemTop}>
                            <TouchableOpacity
                                disabled={item.type !== 'task'}
                                style={[
                                    styles.itemIcon,
                                    {
                                        backgroundColor:
                                            item.type === 'task'
                                                ? item.isDone
                                                    ? colors.accent.success
                                                    : colors.accent.primary + '18'
                                                : colors.accent.secondary + '18',
                                    },
                                ]}
                                onPress={() => toggleTask(item.id)}
                            >
                                <Ionicons
                                    name={item.type === 'task' ? (item.isDone ? 'checkmark' : 'square-outline') : 'document-text-outline'}
                                    size={20}
                                    color={item.type === 'task' && item.isDone ? 'white' : colors.accent.primary}
                                />
                            </TouchableOpacity>
                            <View style={styles.itemBody}>
                                <Text
                                    style={[
                                        styles.itemTitle,
                                        {
                                            color: colors.text.primary,
                                            textDecorationLine: item.isDone ? 'line-through' : 'none',
                                        },
                                    ]}
                                >
                                    {item.title}
                                </Text>
                                <Text style={[styles.itemMeta, { color: colors.text.tertiary }]}>
                                    {item.type === 'task' ? 'Task' : 'Note'} · {format(new Date(item.updatedAt), 'MMM d, h:mm a')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteButton}>
                                <Ionicons name="trash-outline" size={19} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        {!!item.body && (
                            <Text style={[styles.itemContent, { color: colors.text.secondary }]}>{item.body}</Text>
                        )}
                    </View>
                ))}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={48} color={colors.text.disabled} />
                        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No notebook items yet</Text>
                        <Text style={[styles.emptyCopy, { color: colors.text.tertiary }]}>
                            Add notes, reminders, task lists, or workout cues here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 18 : 58,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 2,
    },
    statPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    statPillText: {
        fontWeight: '900',
        fontSize: 13,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 40,
    },
    composer: {
        borderRadius: 24,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    segment: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    segmentButton: {
        flex: 1,
        height: 42,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '800',
    },
    titleInput: {
        fontSize: 18,
        fontWeight: '800',
        paddingVertical: 12,
        borderBottomWidth: 1,
        marginBottom: spacing.md,
    },
    bodyInput: {
        minHeight: 110,
        borderRadius: 18,
        padding: spacing.md,
        fontSize: 15,
        lineHeight: 21,
        marginBottom: spacing.md,
    },
    addButton: {
        height: 52,
        borderRadius: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    filterRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '800',
    },
    itemCard: {
        borderRadius: 22,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    itemTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    itemIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemBody: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 3,
    },
    itemMeta: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 42,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginTop: spacing.md,
    },
    emptyCopy: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
