import React, { useState } from 'react';
import {
  View, TextInput, Pressable, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';

const QUICK_PROMPTS = [
  'Why is pump1 critical?',
  'Pump2 status',
  'Show alert summary',
  'Help',
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View style={styles.container}>
      {/* Quick prompt chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {QUICK_PROMPTS.map(prompt => (
          <Pressable
            key={prompt}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onSend(prompt)}
            disabled={disabled}
          >
            <Text style={styles.chipText}>{prompt}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ask anything about your cluster..."
          placeholderTextColor={Colors.abbGray3}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!disabled}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.borderCard, paddingBottom: 4 },
  chipsRow:   { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  chip: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
  },
  chipPressed: { backgroundColor: Colors.infoBg },
  chipText:    { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.abbRed,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.borderPrimary },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
