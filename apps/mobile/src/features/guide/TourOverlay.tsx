import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { useTranslation } from "../../shared/i18n";
import { radius, spacing, typography } from "../../shared/theme";
import { useThemedStyles, type AppColors } from "../../shared/theme";
import { useThemeColors } from "../../shared/theme/ThemeProvider";
import { AppButton } from "../../shared/ui";
import {
  finishActiveTour,
  goToStep,
  markStepDisplayed,
  useGuideStore,
  type GuideQueueItem,
} from "./guide-store";
import { getTourTarget, measureNode, type TargetRect } from "./tour-targets";

const SPOTLIGHT_PADDING = 6;
const SPOTLIGHT_RADIUS = 14;
const CARD_GAP = 12;
const CARD_MAX_WIDTH = 380;
/** Alt sekme çubuğu ve kartın sığması için hedefin altında bırakılan pay. */
const BOTTOM_RESERVE = 96;
const SCROLL_SETTLE_MS = 380;

type TourItem = Extract<GuideQueueItem, { kind: "tour" }>;

type Layout = { x: number; y: number; width: number; height: number };

function roundedHolePath(width: number, height: number, hole: TargetRect): string {
  const x = hole.x - SPOTLIGHT_PADDING;
  const y = hole.y - SPOTLIGHT_PADDING;
  const w = hole.width + SPOTLIGHT_PADDING * 2;
  const h = hole.height + SPOTLIGHT_PADDING * 2;
  const r = Math.min(SPOTLIGHT_RADIUS, w / 2, h / 2);
  return [
    `M0 0 H${width} V${height} H0 Z`,
    `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`,
  ].join(" ");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function TourOverlay() {
  const active = useGuideStore((s) => s.active);
  const index = useGuideStore((s) => s.activeIndex);
  if (!active || active.kind !== "tour") return null;
  return <TourStepOverlay index={index} key={active.id} tour={active} />;
}

function TourStepOverlay({ tour, index }: { tour: TourItem; index: number }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [readyIndex, setReadyIndex] = useState<number | null>(null);
  const rootRef = useRef<View>(null);
  const previousIndexRef = useRef(index);

  const step = tour.steps[index];
  const total = tour.steps.length;

  useEffect(() => {
    if (!layout || !step) return;
    let cancelled = false;
    const direction = index >= previousIndexRef.current ? 1 : -1;
    previousIndexRef.current = index;

    const skip = () => {
      if (cancelled) return;
      // Geri giderken başa ulaşıldıysa ileri doğru devam edilir.
      const nextIndex = index + direction;
      goToStep(nextIndex < 0 ? index + 1 : nextIndex);
    };

    const show = (target: TargetRect | null) => {
      if (cancelled) return;
      setRect(target);
      setReadyIndex(index);
      markStepDisplayed();
    };

    const resolveStep = async () => {
      if (!step.target || step.ignoreTarget) {
        show(null);
        return;
      }
      const registered = getTourTarget(step.target);
      if (!registered) {
        skip();
        return;
      }
      let measured = await measureNode(registered.node);
      if (!measured) {
        skip();
        return;
      }

      const visibleTop = insets.top + spacing.md;
      const visibleBottom = layout.y + layout.height - insets.bottom - BOTTOM_RESERVE;
      const outOfView = measured.y < visibleTop || measured.y + measured.height > visibleBottom;
      if (outOfView && registered.scroll) {
        registered.scroll.scrollBy(measured.y - layout.y - layout.height * 0.3);
        await wait(SCROLL_SETTLE_MS);
        if (cancelled) return;
        measured = await measureNode(registered.node);
        if (!measured) {
          skip();
          return;
        }
      }

      show({
        x: measured.x - layout.x,
        y: measured.y - layout.y,
        width: measured.width,
        height: measured.height,
      });
    };

    void resolveStep();
    return () => {
      cancelled = true;
    };
  }, [index, layout, step, insets.top, insets.bottom]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const node = rootRef.current;
    if (!node) return;
    node.measureInWindow((x, y) => {
      setLayout({ x: x || 0, y: y || 0, width, height });
    });
  };

  const ready = readyIndex === index && layout !== null;
  const isLast = index >= total - 1;
  const cardWidth = layout ? Math.min(layout.width - spacing.lg * 2, CARD_MAX_WIDTH) : CARD_MAX_WIDTH;

  let cardPosition: { top?: number; bottom?: number } = {};
  if (layout && rect) {
    const targetCenter = rect.y + rect.height / 2;
    if (targetCenter < layout.height / 2) {
      cardPosition = { top: rect.y + rect.height + SPOTLIGHT_PADDING + CARD_GAP };
    } else {
      cardPosition = { bottom: layout.height - rect.y + SPOTLIGHT_PADDING + CARD_GAP };
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={finishActiveTour}
      statusBarTranslucent
      transparent
      visible
    >
      <View onLayout={handleLayout} ref={rootRef} style={styles.root}>
        {layout ? (
          <Svg height={layout.height} style={StyleSheet.absoluteFill} width={layout.width}>
            {ready && rect ? (
              <>
                <Path d={roundedHolePath(layout.width, layout.height, rect)} fill={colors.overlay} fillRule="evenodd" />
                <Rect
                  fill="transparent"
                  height={rect.height + SPOTLIGHT_PADDING * 2}
                  rx={SPOTLIGHT_RADIUS}
                  stroke={colors.primaryLight}
                  strokeWidth={2}
                  width={rect.width + SPOTLIGHT_PADDING * 2}
                  x={rect.x - SPOTLIGHT_PADDING}
                  y={rect.y - SPOTLIGHT_PADDING}
                />
              </>
            ) : (
              <Rect fill={colors.overlay} height={layout.height} width={layout.width} x={0} y={0} />
            )}
          </Svg>
        ) : null}

        {ready && step ? (
          <View
            style={[
              styles.cardSlot,
              rect
                ? cardPosition
                : [styles.cardCentered, { paddingTop: insets.top, paddingBottom: insets.bottom }],
            ]}
            pointerEvents="box-none"
          >
            <View accessibilityViewIsModal style={[styles.card, { width: cardWidth }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.counter}>
                  {t("guide.controls.counter", { current: index + 1, total })}
                </Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={finishActiveTour}>
                  <Text style={styles.skip}>{t("guide.controls.skip")}</Text>
                </Pressable>
              </View>
              <Text style={styles.title}>{t(step.titleKey)}</Text>
              <Text style={styles.body}>{t(step.bodyKey)}</Text>
              <View style={styles.actions}>
                {index > 0 ? (
                  <AppButton
                    onPress={() => goToStep(index - 1)}
                    size="sm"
                    style={styles.actionBtn}
                    title={t("guide.controls.back")}
                    variant="secondary"
                  />
                ) : null}
                <AppButton
                  onPress={() => goToStep(index + 1)}
                  size="sm"
                  style={styles.actionBtn}
                  title={isLast ? t("guide.controls.finish") : t("guide.controls.next")}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    cardSlot: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    cardCentered: {
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      padding: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 12,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    counter: { ...typography.caption, color: colors.primaryLight, fontWeight: "700" },
    skip: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600" },
    title: { ...typography.sectionTitle, color: colors.text, fontWeight: "700" },
    body: {
      ...typography.bodySmall,
      color: colors.textSoft,
      marginTop: spacing.xs,
      lineHeight: 21,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionBtn: { minWidth: 96 },
  });
}
