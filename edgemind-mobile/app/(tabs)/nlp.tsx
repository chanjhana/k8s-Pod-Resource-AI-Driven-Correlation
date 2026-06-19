import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView,
  Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatHistory, useChatLoading, useApp, ChatMessage } from '../../core/store/AppContext';
import ChatBubble from '../../components/nlp/ChatBubble';
import ChatInput from '../../components/nlp/ChatInput';
import { sendChatMessage } from '../../core/api/useChatAPI';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';

let msgIdCounter = 0;
function newId() { return `msg-${++msgIdCounter}-${Date.now()}`; }

export default function NLPScreen() {
  const chatHistory = useChatHistory();
  const isLoading   = useChatLoading();
  const { dispatch } = useApp();
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  async function handleSend(text: string) {
    if (isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHAT_MSG', payload: userMsg });
    dispatch({ type: 'SET_CHAT_LOADING', payload: true });

    // Placeholder AI message for streaming
    const aiMsgId = newId();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      blocks: [],
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHAT_MSG', payload: aiMsg });
    scrollToBottom();

    // Collect blocks locally to avoid stale closure
    const collectedBlocks: any[] = [];

    try {
      await sendChatMessage(
        {
          message: text,
          context: { active_page: 'nlp' },
          history: chatHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
        },
        (chunk) => {
          if (chunk.type === 'done') return;
          collectedBlocks.push(chunk);
          dispatch({
            type: 'UPDATE_LAST_CHAT_MSG',
            payload: {
              blocks: [...collectedBlocks],
              content: collectedBlocks.filter(b => b.type === 'text').map(b => b.content || '').join(''),
            },
          });
          scrollToBottom();
        },
        true, // USE_MOCK — set false when connecting to real backend
      );
    } catch (err) {
      dispatch({
        type: 'UPDATE_LAST_CHAT_MSG',
        payload: { content: 'Sorry, I encountered an error. Please try again.' },
      });
    } finally {
      dispatch({ type: 'SET_CHAT_LOADING', payload: false });
    }
  }

  function handleClear() {
    dispatch({ type: 'CLEAR_CHAT' });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        {/* Welcome state */}
        {chatHistory.length === 0 && (
          <View style={styles.welcome}>
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeBadgeText}>AI</Text>
            </View>
            <Text style={styles.welcomeTitle}>EdgeMind Assistant</Text>
            <Text style={styles.welcomeSub}>Ask me anything about your pump station cluster — alerts, root causes, sensor trends.</Text>
          </View>
        )}

        {/* Clear button */}
        {chatHistory.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear chat</Text>
          </Pressable>
        )}

        {/* Message list */}
        <FlatList
          ref={listRef}
          data={chatHistory}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.msgList}
          renderItem={({ item, index }) => (
            <ChatBubble
              message={item}
              isStreaming={isLoading && index === chatHistory.length - 1 && item.role === 'assistant'}
            />
          )}
          onContentSizeChange={scrollToBottom}
        />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgSurface },
  kav:      { flex: 1 },
  welcome:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xxl },
  welcomeBadge: {
    width: 56, height: 56, borderRadius: 8,
    backgroundColor: Colors.abbBlue,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeBadgeText: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  welcomeTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  welcomeSub:   { fontSize: Typography.sizes.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  clearBtn: {
    alignSelf: 'flex-end', marginRight: Spacing.base, marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: Colors.bgSurface, borderRadius: Radius.full,
  },
  clearBtnText: { fontSize: Typography.sizes.xs, color: Colors.textTertiary },
  msgList: { padding: Spacing.base, paddingBottom: Spacing.md },
});
