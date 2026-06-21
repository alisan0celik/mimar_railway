import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const IMG_W = SCREEN_W * 1.4;
const DURATION_MS = 12000;

export function ParallaxBackground() {
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(offset, {
          toValue: -(IMG_W - SCREEN_W),
          duration: DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [offset]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: offset }] }]}>
      <Image
        source={require("../assets/arch-bg.jpg")}
        style={{ width: IMG_W, height: "100%" }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}
