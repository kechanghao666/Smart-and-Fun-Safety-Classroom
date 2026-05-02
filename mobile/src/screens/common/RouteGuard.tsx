import { Redirect } from "expo-router";
import React from "react";

import { LoadingState } from "@/components/common/StateViews";
import { useAuth } from "@/store/authStore";

export function RoleGuard({
  role,
  children,
}: {
  role: "student" | "teacher";
  children: React.ReactNode;
}) {
  const { status, session } = useAuth();

  if (status === "loading") {
    return <LoadingState label="正在恢复登录状态..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== role) {
    return <Redirect href={session.role === "student" ? "/student" : "/teacher"} />;
  }

  return <>{children}</>;
}
