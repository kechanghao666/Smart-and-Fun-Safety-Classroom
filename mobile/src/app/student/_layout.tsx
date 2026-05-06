import { Stack } from "expo-router";
import React from "react";

import { RoleGuard } from "@/screens/common/RouteGuard";

export default function StudentLayout() {
  return (
    <RoleGuard role="student">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
