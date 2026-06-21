import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';
import { ChatMessage } from '../../core/store/AppContext';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

/**
 * Single chat message bubble.
 * User messages: right-aligned, ABB blue tint.
 * AI messages: left-aligned, white card.
 * Supports text + link block types.
 */
export default function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatarTag}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {message.blocks?.map((block, i) => {
          if (block.type === 'text') {
            return (
              <Text key={i} style={[styles.text, isUser && styles.textUser]}>
                {block.content}
              </Text>
            );
          }
          if (block.type === 'link') {
            return (
              <View key={i} style={styles.linkBlock}>
                <Text style={styles.linkText}>{'>'} {block.label}</Text>
              </View>
            );
          }
          return null;
        }) ?? (
          <Text style={[styles.text, isUser && styles.textUser]}>
            {message.content}
          </Text>
        )}

        {isStreaming && (
          <View style={styles.typingRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, gap: Spacing.sm },
  rowUser: { flexDirection: 'row-reverse' },
  avatarTag: {
    width: 28, height: 28, borderRadius: 4,
    backgroundColor: Colors.abbBlue,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    flexShrink: 0,
  },
  avatarText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bubbleAI: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  bubbleUser: {
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  text:     { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  textUser: { color: Colors.info },
  linkBlock: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  linkText:  { fontSize: Typography.sizes.xs, color: Colors.abbBlue, fontWeight: Typography.weights.semibold },
  typingRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
});
