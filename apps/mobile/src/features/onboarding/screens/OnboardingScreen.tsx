import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { markOnboardingSeen } from "../../../services/auth/onboarding-storage";

import { onboardingSlides } from "../data/onboardingSlides";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";

const MAX_MOBILE_WIDTH = 430;
// Pixels to crop from the top of the PNG to hide the embedded status bar artwork
const STATUS_BAR_CROP = 50;

export function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const colors = useThemeColors();

  const frameWidth =
    Platform.OS === "web" ? Math.min(width, MAX_MOBILE_WIDTH) : width;
  const frameHeight = height;

  const [activeIndex, setActiveIndex] = useState(0);
  // Ref mirrors state so callbacks never hold a stale activeIndex
  const activeIndexRef = useRef(0);
  const listRef = useRef<FlatList>(null);

  const updateIndex = useCallback((idx: number) => {
    activeIndexRef.current = idx;
    setActiveIndex(idx);
  }, []);

  const goToLogin = useCallback(async () => {
    try {
      await markOnboardingSeen();
    } catch {
      // Ignore storage errors
    }
    router.replace("/(auth)/login");
  }, []);

  // Always reads from ref — safe against FlatList's renderItem closure caching
  const goNext = useCallback(() => {
    const current = activeIndexRef.current;
    if (current >= onboardingSlides.length - 1) {
      goToLogin();
      return;
    }
    const nextIndex = current + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    updateIndex(nextIndex);
  }, [goToLogin, updateIndex]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      updateIndex(Math.round(offsetX / frameWidth));
    },
    [frameWidth, updateIndex]
  );

  return (
    <View style={[styles.webRoot, { backgroundColor: colors.background }]}>
      <View style={[styles.mobileFrame, { width: frameWidth, height: frameHeight, backgroundColor: colors.background }]}>
        <FlatList
          ref={listRef}
          data={onboardingSlides}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          extraData={activeIndex}
          getItemLayout={(_, index) => ({
            length: frameWidth,
            offset: frameWidth * index,
            index,
          })}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item, index }) => (
            <View style={[styles.slide, { width: frameWidth, height: frameHeight, backgroundColor: colors.background }]}>
              <View
                style={[
                  styles.cropContainer,
                  { width: frameWidth, height: frameHeight },
                ]}
              >
                <Image
                  source={item.image}
                  resizeMode="cover"
                  style={{
                    width: frameWidth,
                    height: frameHeight + STATUS_BAR_CROP,
                    position: "absolute",
                    top: -STATUS_BAR_CROP,
                    left: 0,
                  }}
                />
              </View>

              <Pressable style={styles.primaryHitArea} onPress={goNext} />

              {index === 0 ? (
                <Pressable style={styles.secondaryHitArea} onPress={goToLogin} />
              ) : null}

              {index === 1 ? (
                <View style={[styles.secondSlideOverlay, { backgroundColor: colors.background }]} />
              ) : null}

              {index === onboardingSlides.length - 1 ? (
                <View style={[styles.thirdSlideOverlay, { backgroundColor: colors.background }]} />
              ) : null}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileFrame: {
    flex: 1,
    maxWidth: MAX_MOBILE_WIDTH,
    overflow: "hidden",
  },
  slide: {
    position: "relative",
  },
  cropContainer: {
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Primary button zone in the PNG (large rounded button near bottom)
  primaryHitArea: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 76,
    height: 64,
    borderRadius: 22,
  },
  // Secondary link zone ("Geç") below the button — only slides 1 & 2
  secondaryHitArea: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
    width: 160,
    height: 44,
  },
  // Covers any "Giriş Yap" text embedded inside onboard3.png
  thirdSlideOverlay: {
    position: "absolute",
    alignSelf: "center",
    bottom: 16,
    width: 220,
    height: 56,
  },
  secondSlideOverlay: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
    width: 180,
    height: 44,
  },
});


