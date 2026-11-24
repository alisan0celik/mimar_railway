import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../../../shared/i18n";
import { spacing, typography } from "../../../shared/theme";
import { ReportPhoto, type ReportPhotoSource } from "./ReportPhoto";

type PhotoViewerProps = {
  photos: ReportPhotoSource[];
  /** Açılacak fotoğraf; `null` iken görüntüleyici kapalı. */
  startIndex: number | null;
  token: string | null;
  onClose: () => void;
};

/** Fotoğrafları tam ekranda, kaydırarak gösterir. */
export function PhotoViewer({ photos, startIndex, token, onClose }: PhotoViewerProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(startIndex ?? 0);

  // Açılışta dokunulan fotoğrafa git.
  useEffect(() => {
    if (startIndex === null) return;
    setIndex(startIndex);
    const timer = setTimeout(
      () => scrollRef.current?.scrollTo({ x: startIndex * width, animated: false }),
      0,
    );
    return () => clearTimeout(timer);
  }, [startIndex, width]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={startIndex !== null}>
      <View style={styles.backdrop}>
        <ScrollView
          horizontal
          onMomentumScrollEnd={(event) =>
            setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          pagingEnabled
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
        >
          {photos.map((photo) => (
            <ReportPhoto
              key={photo.uri}
              resizeMode="contain"
              source={photo}
              style={{ width, height, backgroundColor: "#000000" }}
              token={token}
            />
          ))}
        </ScrollView>

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Text style={styles.counter}>
            {t("fieldReports.photoOf", { current: index + 1, total: photos.length })}
          </Text>
          <Pressable
            accessibilityLabel={t("fieldReports.close")}
            hitSlop={12}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="close" size={26} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Fotoğraf görüntüleyici her temada koyu zeminde açılır; fotoğraflar en
// iyi koyu arka planda okunuyor.
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000000" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  counter: { ...typography.bodySmall, color: "#FFFFFF", fontWeight: "700" },
  closeBtn: { padding: spacing.xs },
});
