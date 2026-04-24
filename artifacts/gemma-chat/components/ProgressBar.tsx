import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  progress: number; // 0..1
  height?: number;
  trackColor?: string;
  fillColor?: string;
};

export function ProgressBar({ progress, height = 8, trackColor, fillColor }: Props) {
  const colors = useColors();
  const safe = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: trackColor ?? colors.muted,
          height,
          borderRadius: height / 2,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${safe * 100}%`,
            backgroundColor: fillColor ?? colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
