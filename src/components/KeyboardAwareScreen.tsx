import React, { ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
    findNodeHandle,
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleProp,
    StyleSheet,
    TextInput,
    UIManager,
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
    extraScrollHeight?: number;
    enableAutomaticScroll?: boolean;
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
    extraScrollHeight = 28,
    enableAutomaticScroll = true,
}: KeyboardAwareScreenProps) {
    const internalScrollRef = useRef<ScrollView | null>(null);
    const contentHostRef = useRef<View | null>(null);
    const scrollYRef = useRef(0);
    const scrollHeightRef = useRef(0);
    const [footerHeight, setFooterHeight] = useState(0);

    const setScrollNode = useCallback((node: ScrollView | null) => {
        internalScrollRef.current = node;

        if (scrollRef) {
            scrollRef.current = node;
        }
    }, [scrollRef]);

    const getFocusedHandle = useCallback(() => {
        const textInputState = (TextInput as any).State;
        const focusedInput = textInputState?.currentlyFocusedInput?.();

        if (!focusedInput) return null;
        return typeof focusedInput === 'number' ? focusedInput : findNodeHandle(focusedInput);
    }, []);

    const scrollFocusedInputIntoView = useCallback(() => {
        if (!enableAutomaticScroll) return;

        InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
                const focusedHandle = getFocusedHandle();
                const contentHandle = findNodeHandle(contentHostRef.current);
                const scrollNode = internalScrollRef.current;

                if (!focusedHandle || !contentHandle || !scrollNode || scrollHeightRef.current <= 0) {
                    return;
                }

                UIManager.measureLayout(
                    focusedHandle,
                    contentHandle,
                    () => undefined,
                    (_x, y, _width, height) => {
                        const currentScrollY = scrollYRef.current;
                        const visibleTop = currentScrollY;
                        const visibleBottom = currentScrollY + scrollHeightRef.current;
                        const focusedTop = y - extraScrollHeight;
                        const focusedBottom = y + height + extraScrollHeight;

                        if (focusedBottom > visibleBottom) {
                            scrollNode.scrollTo({
                                y: Math.max(0, focusedBottom - scrollHeightRef.current),
                                animated: true,
                            });
                            return;
                        }

                        if (focusedTop < visibleTop) {
                            scrollNode.scrollTo({
                                y: Math.max(0, focusedTop),
                                animated: true,
                            });
                        }
                    }
                );
            });
        });
    }, [enableAutomaticScroll, extraScrollHeight, getFocusedHandle]);

    useEffect(() => {
        if (!enableAutomaticScroll) return undefined;

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const didShow = Keyboard.addListener(showEvent, () => {
            scrollFocusedInputIntoView();
        });
        const didChangeFrame = Keyboard.addListener('keyboardDidChangeFrame', () => {
            scrollFocusedInputIntoView();
        });

        return () => {
            didShow.remove();
            didChangeFrame.remove();
        };
    }, [enableAutomaticScroll, scrollFocusedInputIntoView]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
    }, []);

    const handleScrollLayout = useCallback((event: LayoutChangeEvent) => {
        scrollHeightRef.current = event.nativeEvent.layout.height;
    }, []);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={[styles.container, style]}
        >
            <ScrollView
                ref={setScrollNode}
                style={[styles.scroll, scrollViewStyle]}
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                onScroll={handleScroll}
                onLayout={handleScrollLayout}
                onMomentumScrollEnd={handleScroll}
                onScrollEndDrag={handleScroll}
                scrollEventThrottle={16}
            >
                <View ref={contentHostRef} onTouchEnd={scrollFocusedInputIntoView}>
                    {children}
                </View>
                {footer ? <View style={{ height: footerHeight + extraScrollHeight }} /> : null}
            </ScrollView>
            {footer ? (
                <View
                    style={styles.footerHost}
                    onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                >
                    {footer}
                </View>
            ) : null}
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
