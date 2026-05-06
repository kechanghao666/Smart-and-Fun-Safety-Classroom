import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { chatWithStudentAi } from "@/api/student";
import { AppButton } from "@/components/common/AppButton";
import { AppCard } from "@/components/common/AppCard";
import { Screen } from "@/components/common/Screen";
import { appColors, spacing } from "@/constants/appTheme";
import { useAuth } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "过马路前要先观察什么？",
  "公交车盲区为什么危险？",
  "乘车为什么要系安全带？",
];

export function StudentAiScreen() {
  const { session } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages, submitting]);

  async function ask(nextPrompt?: string) {
    const nextQuestion = (nextPrompt ?? question).trim();
    if (!nextQuestion || !session?.token || submitting) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: nextQuestion }]);
    setQuestion("");
    setError(null);
    setSubmitting(true);

    try {
      const response = await chatWithStudentAi(session.token, {
        scene: "qa",
        message: nextQuestion,
      });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
    } catch (requestError) {
      setError(`AI 暂时没有回答成功：${getErrorMessage(requestError)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      bottomNavActive="ai"
      keyboardAvoiding
      title="AI 助手"
      subtitle="把问题说出来，小助手会用短句回答你。"
      contentStyle={styles.screenContent}>
      <AppCard style={styles.quickCard}>
        <Text style={styles.cardTitle}>可以先问这些安全问题</Text>
        <View style={styles.quickPromptGrid}>
          {QUICK_PROMPTS.map((prompt) => (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              key={prompt}
              onPress={() => ask(prompt)}
              style={({ pressed }) => [styles.quickPrompt, pressed && styles.pressed]}>
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.chatCard}>
        <View style={styles.chatHeader}>
          <Text style={styles.cardTitle}>对话区</Text>
          {submitting && (
            <View style={styles.sendingBadge}>
              <ActivityIndicator color={appColors.primary} size="small" />
              <Text style={styles.sendingText}>发送中</Text>
            </View>
          )}
        </View>

        <ScrollView
          nestedScrollEnabled
          ref={messagesRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.messageContent}>
          {messages.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>还没有对话</Text>
              <Text style={styles.emptyText}>
                你可以问道路安全、乘车安全、盲区识别等问题，也可以点上面的推荐提问开始。
              </Text>
            </View>
          ) : (
            messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[styles.bubble, message.role === "user" && styles.userBubble]}>
                <Text
                  style={[
                    styles.messageRole,
                    message.role === "user" && styles.userMessageRole,
                  ]}>
                  {message.role === "user" ? "我" : "AI 小助手"}
                </Text>
                <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>
                  {message.text}
                </Text>
              </View>
            ))
          )}
          {submitting && (
            <View style={styles.bubble}>
              <Text style={styles.messageRole}>AI 小助手</Text>
              <Text style={styles.messageText}>正在思考，马上回答你...</Text>
            </View>
          )}
        </ScrollView>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.composer}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="例如：过马路为什么要先看左边和右边？"
            placeholderTextColor={appColors.textMuted}
            multiline
            maxLength={300}
            style={styles.input}
          />
          <AppButton
            title="发送问题"
            onPress={() => ask()}
            loading={submitting}
            disabled={!question.trim()}
          />
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: spacing.xl * 2,
  },
  quickCard: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  quickPromptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickPrompt: {
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickPromptText: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
  chatCard: {
    gap: spacing.md,
  },
  chatHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  sendingBadge: {
    alignItems: "center",
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendingText: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  messageScroll: {
    maxHeight: 360,
  },
  messageContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptyBox: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    gap: spacing.xs,
    padding: spacing.md,
  },
  emptyTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    maxWidth: "92%",
    padding: spacing.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: appColors.primary,
  },
  messageRole: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },
  userMessageRole: {
    color: "#dff8f1",
  },
  messageText: {
    color: appColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#ffffff",
  },
  errorText: {
    backgroundColor: "#fff3f1",
    borderColor: "#ffd8d2",
    borderRadius: 14,
    borderWidth: 1,
    color: appColors.danger,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.sm,
  },
  composer: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    color: appColors.text,
    fontSize: 15,
    lineHeight: 22,
    padding: spacing.md,
    textAlignVertical: "top",
  },
});
