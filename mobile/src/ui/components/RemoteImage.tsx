import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AppTheme } from "@/ui/theme/AppTheme";

export type RemoteImageVariant = "theme" | "level-1" | "level-2" | "level-3" | "default";

interface RemoteImageProps {
  uri?: string | null;
  label?: string;
  variant?: RemoteImageVariant;
  style?: ViewStyle;
}

export function RemoteImage({ uri, label = "学习场景", style, variant = "default" }: RemoteImageProps) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return <SceneFallback label={label} style={style} variant={variant} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        accessibilityLabel={label}
        contentFit="cover"
        onError={() => {
          setFailed(true);
          setLoading(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        transition={180}
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={AppTheme.colors.primary} />
        </View>
      )}
    </View>
  );
}

function SceneFallback({
  label,
  style,
  variant,
}: {
  label: string;
  style?: ViewStyle;
  variant: RemoteImageVariant;
}) {
  const isRoute = variant === "level-2";
  const isGuardian = variant === "level-3";
  const isTheme = variant === "theme";

  return (
    <View accessibilityLabel={label} accessibilityRole="image" style={[styles.placeholder, style]}>
      <View style={styles.skyOrb} />
      <View style={styles.sun} />
      <View style={styles.cloudOne} />
      <View style={styles.cloudTwo} />
      <View style={styles.ground} />

      {isRoute ? <RouteScene /> : isGuardian ? <GuardianScene /> : <CrosswalkScene />}

      {isTheme && (
        <View style={styles.themeFlag}>
          <Text style={styles.themeFlagText}>道路安全</Text>
        </View>
      )}
      <View style={styles.captionPill}>
        <Text numberOfLines={1} style={styles.captionText}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function CrosswalkScene() {
  return (
    <>
      <View style={styles.road} />
      <View style={[styles.crossStripe, { left: "15%" }]} />
      <View style={[styles.crossStripe, { left: "27%" }]} />
      <View style={[styles.crossStripe, { left: "39%" }]} />
      <View style={[styles.crossStripe, { left: "51%" }]} />
      <View style={styles.trafficPole} />
      <View style={styles.trafficLight}>
        <View style={[styles.lightDot, { backgroundColor: "#EF4444" }]} />
        <View style={[styles.lightDot, { backgroundColor: "#F59E0B" }]} />
        <View style={[styles.lightDot, { backgroundColor: "#22C55E" }]} />
      </View>
      <View style={styles.signPost} />
      <View style={styles.signBoard}>
        <View style={styles.signPerson} />
      </View>
    </>
  );
}

function RouteScene() {
  return (
    <>
      <View style={styles.mapCard} />
      <View style={[styles.routeSegment, styles.routeSegmentOne]} />
      <View style={[styles.routeSegment, styles.routeSegmentTwo]} />
      <View style={[styles.routeSegment, styles.routeSegmentThree]} />
      <View style={[styles.routePin, { left: "18%", top: "62%" }]} />
      <View style={[styles.routePin, { left: "40%", top: "46%" }]} />
      <View style={[styles.routePin, { left: "65%", top: "31%" }]} />
      <View style={[styles.routePin, styles.routePinHome]} />
      <View style={styles.schoolBlock} />
      <View style={styles.homeBlock} />
    </>
  );
}

function GuardianScene() {
  return (
    <>
      <View style={styles.busBody}>
        <View style={styles.busWindow} />
        <View style={[styles.busWindow, { left: 52 }]} />
        <View style={styles.busDoor} />
      </View>
      <View style={[styles.busWheel, { left: "24%" }]} />
      <View style={[styles.busWheel, { right: "22%" }]} />
      <View style={styles.safetyLine} />
      <View style={styles.helmet}>
        <View style={styles.helmetBand} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppTheme.colors.surfaceSoft,
    borderRadius: AppTheme.radius.xl,
    minHeight: 148,
    overflow: "hidden",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.58)",
    justifyContent: "center",
  },
  placeholder: {
    backgroundColor: "#DFF7F4",
    borderColor: "rgba(20, 184, 166, 0.24)",
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    minHeight: 148,
    overflow: "hidden",
    position: "relative",
  },
  skyOrb: {
    backgroundColor: "rgba(59, 130, 246, 0.18)",
    borderRadius: 999,
    height: 126,
    position: "absolute",
    right: -22,
    top: -34,
    width: 126,
  },
  sun: {
    backgroundColor: "#FDE68A",
    borderRadius: 999,
    height: 30,
    left: "11%",
    position: "absolute",
    top: "15%",
    width: 30,
  },
  cloudOne: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 999,
    height: 18,
    left: "27%",
    position: "absolute",
    top: "18%",
    width: 64,
  },
  cloudTwo: {
    backgroundColor: "rgba(255,255,255,0.64)",
    borderRadius: 999,
    height: 14,
    position: "absolute",
    right: "18%",
    top: "30%",
    width: 50,
  },
  ground: {
    backgroundColor: "#8DE6C8",
    bottom: 0,
    height: "36%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  road: {
    backgroundColor: "#334155",
    borderRadius: 22,
    bottom: "12%",
    height: "26%",
    left: "8%",
    position: "absolute",
    right: "8%",
    transform: [{ rotate: "-4deg" }],
  },
  crossStripe: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 5,
    bottom: "20%",
    height: "15%",
    position: "absolute",
    transform: [{ rotate: "-4deg" }],
    width: "8%",
  },
  trafficPole: {
    backgroundColor: "#475569",
    bottom: "36%",
    height: "32%",
    position: "absolute",
    right: "19%",
    width: 5,
  },
  trafficLight: {
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    gap: 3,
    padding: 5,
    position: "absolute",
    right: "15%",
    top: "16%",
  },
  lightDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  signPost: {
    backgroundColor: "#475569",
    bottom: "34%",
    height: "25%",
    left: "20%",
    position: "absolute",
    width: 4,
  },
  signBoard: {
    alignItems: "center",
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    left: "15%",
    position: "absolute",
    top: "26%",
    width: 42,
  },
  signPerson: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  mapCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    borderWidth: 1,
    bottom: "10%",
    left: "8%",
    position: "absolute",
    right: "8%",
    top: "14%",
  },
  routeSegment: {
    backgroundColor: "#14B8A6",
    borderRadius: 999,
    height: 5,
    position: "absolute",
  },
  routeSegmentOne: {
    left: "21%",
    top: "59%",
    transform: [{ rotate: "-28deg" }],
    width: "25%",
  },
  routeSegmentTwo: {
    left: "42%",
    top: "44%",
    transform: [{ rotate: "-22deg" }],
    width: "27%",
  },
  routeSegmentThree: {
    left: "62%",
    top: "34%",
    transform: [{ rotate: "20deg" }],
    width: "20%",
  },
  routePin: {
    backgroundColor: "#FFFFFF",
    borderColor: "#14B8A6",
    borderRadius: 999,
    borderWidth: 4,
    height: 20,
    position: "absolute",
    width: 20,
  },
  routePinHome: {
    backgroundColor: "#FDE68A",
    left: "78%",
    top: "39%",
  },
  schoolBlock: {
    backgroundColor: "#60A5FA",
    borderRadius: 8,
    bottom: "18%",
    height: 28,
    left: "14%",
    position: "absolute",
    width: 42,
  },
  homeBlock: {
    backgroundColor: "#FB923C",
    borderRadius: 8,
    height: 30,
    position: "absolute",
    right: "12%",
    top: "48%",
    width: 38,
  },
  busBody: {
    backgroundColor: "#38BDF8",
    borderRadius: 18,
    bottom: "24%",
    height: 62,
    left: "12%",
    position: "absolute",
    right: "14%",
  },
  busWindow: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 8,
    height: 22,
    left: 18,
    position: "absolute",
    top: 12,
    width: 28,
  },
  busDoor: {
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    borderRadius: 8,
    height: 44,
    position: "absolute",
    right: 18,
    top: 10,
    width: 24,
  },
  busWheel: {
    backgroundColor: "#0F172A",
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 4,
    bottom: "17%",
    height: 26,
    position: "absolute",
    width: 26,
  },
  safetyLine: {
    backgroundColor: "#FDE68A",
    borderRadius: 999,
    bottom: "10%",
    height: 5,
    left: "15%",
    position: "absolute",
    right: "15%",
  },
  helmet: {
    backgroundColor: "#22C55E",
    borderRadius: 999,
    height: 38,
    position: "absolute",
    right: "10%",
    top: "12%",
    width: 50,
  },
  helmetBand: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 999,
    bottom: 8,
    height: 7,
    left: 8,
    position: "absolute",
    right: 8,
  },
  themeFlag: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: AppTheme.radius.pill,
    left: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
    position: "absolute",
    top: AppTheme.spacing.sm,
  },
  themeFlagText: {
    color: AppTheme.colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  captionPill: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: AppTheme.radius.pill,
    bottom: AppTheme.spacing.sm,
    left: AppTheme.spacing.sm,
    maxWidth: "72%",
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xxs,
    position: "absolute",
  },
  captionText: {
    color: AppTheme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
});
