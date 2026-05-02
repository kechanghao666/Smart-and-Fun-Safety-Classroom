import { Redirect } from 'expo-router';
import React from 'react';

import { LoadingState } from '@/components/common/StateViews';
import { useAuth } from '@/store/authStore';

export default function HomeScreen() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return <LoadingState label="正在恢复登录状态..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={session.role === 'student' ? '/student' : '/teacher'} />;
}
