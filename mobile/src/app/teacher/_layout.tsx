import { Stack } from "expo-router";
import React from "react";

import { RoleGuard } from "@/screens/common/RouteGuard";

export default function TeacherLayout() {
  return (
    <RoleGuard role="teacher">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
