import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotebookItem {
    id: string;
    title: string;
    body: string;
    type: 'note' | 'task';
    isDone: boolean;
    createdAt: string;
    updatedAt: string;
}

interface NotesState {
    items: NotebookItem[];
    addItem: (item: Pick<NotebookItem, 'title' | 'body' | 'type'>) => void;
    updateItem: (id: string, updates: Partial<Pick<NotebookItem, 'title' | 'body' | 'type' | 'isDone'>>) => void;
    toggleTask: (id: string) => void;
    deleteItem: (id: string) => void;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (item) => {
                const now = new Date().toISOString();
                set((state) => ({
                    items: [
                        {
                            id: createId(),
                            title: item.title.trim(),
                            body: item.body.trim(),
                            type: item.type,
                            isDone: false,
                            createdAt: now,
                            updatedAt: now,
                        },
                        ...state.items,
                    ],
                }));
            },
            updateItem: (id, updates) => {
                const now = new Date().toISOString();
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id
                            ? {
                                ...item,
                                ...updates,
                                title: updates.title?.trim() ?? item.title,
                                body: updates.body?.trim() ?? item.body,
                                updatedAt: now,
                            }
                            : item
                    ),
                }));
            },
            toggleTask: (id) => {
                const now = new Date().toISOString();
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, isDone: !item.isDone, updatedAt: now } : item
                    ),
                }));
            },
            deleteItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },
        }),
        {
            name: 'gym-notebook',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
