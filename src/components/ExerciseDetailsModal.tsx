import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useTheme';
import { spacing, borderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Carousel = ({ images, colors }: any) => {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= images.length) {
                nextIndex = 0;
            }

            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true
            });
            setCurrentIndex(nextIndex);
        }, 2000);

        return () => clearInterval(interval);
    }, [currentIndex, images]);

    if (!images || images.length === 0) {
        return (
            <View style={[styles.carouselContainer, { backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={48} color={colors.text.tertiary} />
                <Text style={{ marginTop: 8, color: colors.text.tertiary }}>No images available</Text>
            </View>
        );
    }

    return (
        <View style={styles.carouselContainer}>
            <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.carouselItem, { backgroundColor: colors.background.elevated }]}>
                        <Image
                            source={{ uri: item }}
                            style={styles.carouselImage}
                            contentFit="contain"
                            transition={200}
                        />
                    </View>
                )}
                onMomentumScrollEnd={(ev) => {
                    const index = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentIndex(index);
                }}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />
            {images.length > 1 && (
                <View style={styles.dotsContainer}>
                    {images.map((_: any, idx: number) => (
                        <View
                            key={idx}
                            style={[
                                styles.dot,
                                idx === currentIndex ? { backgroundColor: colors.accent.primary } : { backgroundColor: 'rgba(150,150,150,0.5)' }
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export const ExerciseDetailsModal = ({ visible, exercise, onClose }: any) => {
    const { colors } = useTheme();

    if (!exercise) return null;

    return (
        <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeModalButton}>
                        <Ionicons name="close" size={28} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text.primary }]} numberOfLines={1}>{exercise.name}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                    <Carousel images={exercise.images} colors={colors} />

                    <View style={styles.modalContent}>
                        <View style={styles.tagsContainer}>
                            <View style={[styles.modalBadge, { backgroundColor: colors.accent.secondary }]}>
                                <Text style={[styles.modalBadgeText, { color: colors.text.secondary }]}>{exercise.muscleGroup}</Text>
                            </View>
                            <View style={[styles.modalBadge, { backgroundColor: colors.background.elevated }]}>
                                <Text style={[styles.modalBadgeText, { color: colors.text.secondary }]}>{exercise.type}</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>Instructions</Text>
                        {exercise.instructions && exercise.instructions.length > 0 ? (
                            exercise.instructions.map((inst: string, idx: number) => (
                                <View key={idx} style={styles.instructionStep}>
                                    <Text style={[styles.stepNumber, { color: colors.accent.primary }]}>{idx + 1}</Text>
                                    <Text style={[styles.instructionText, { color: colors.text.secondary }]}>{inst}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: colors.text.secondary }}>No instructions provided.</Text>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    closeModalButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    modalScroll: {
        paddingBottom: 40,
    },
    carouselContainer: {
        width: SCREEN_WIDTH,
        height: 300,
        marginBottom: spacing.lg,
        position: 'relative',
    },
    carouselItem: {
        width: SCREEN_WIDTH,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 15,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    modalContent: {
        paddingHorizontal: spacing.xl,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    modalBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: borderRadius.md,
    },
    modalBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: spacing.md,
    },
    instructionStep: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    stepNumber: {
        fontSize: 18,
        fontWeight: '800',
        width: 30,
        marginRight: 8,
    },
    instructionText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    }
});
