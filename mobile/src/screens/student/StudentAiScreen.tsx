import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

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

export function StudentAiScreen() {
  const { session } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function ask() {
    if (!question.trim() || !session?.token) {
      return;
    }

    const nextQuestion = question.trim();
    setMessages((current) => [...current, { role: "user", text: nextQuestion }]);
    setQuestion("");
    setSubmitting(true);

    try {
      const response = await chatWithStudentAi(session.token, {
        scene: "qa",
        message: nextQuestion,
      });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
    } catch (error) {
      Alert.alert("AI 暂时不可用", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="AI 助手" subtitle="把问题说出来，小助手会给你短句回答。">
      <AppCard>
        {messages.length === 0 ? (
          <Text style={styles.empty}>可以先问：过马路前为什么要左右观察？</Text>
        ) : (
          messages.map((message, index) => (
            <View
              key={`${message.role}-${index}`}
              style={[styles.bubble, message.role === "user" && styles.userBubble]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))
        )}
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="输入你的问题"
          placeholderTextColor={appColors.textMuted}
          multiline
          style={styles.input}
        />
        <AppButton title="发送问题" onPress={ask} loading={submitting} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: appColors.textMuted,
    lineHeight: 22,
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
    backgroundColor: "#d7ecff",
  },
  messageText: {
    color: appColors.text,
    lineHeight: 22,
  },
  input: {
    minHeight: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    color: appColors.text,
    padding: spacing.md,
    textAlignVertical: "top",
  },
});
