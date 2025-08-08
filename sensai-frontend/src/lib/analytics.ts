import { safeLocalStorage } from "@/lib/utils/localStorage";
export interface AnalyticsPayload {
  interest_switch: string | number;
  repeat_audio: string | number;
  llm_response: string;
}

// Store analytics locally only (no network). Use defaults for missing values.
export function bufferAnalytics(payload: Partial<AnalyticsPayload>): void {
  try {
    const key = 'sensai_analytics_buffer_v1';
    const existingRaw = safeLocalStorage.getItem(key);
    const existing: AnalyticsPayload[] = existingRaw ? JSON.parse(existingRaw) : [];
    const normalized: AnalyticsPayload = {
      interest_switch: payload.interest_switch !== undefined && String(payload.interest_switch).trim() !== ''
        ? String(payload.interest_switch)
        : 'N/A',
      repeat_audio: payload.repeat_audio !== undefined && String(payload.repeat_audio).trim() !== ''
        ? String(payload.repeat_audio)
        : 'N/A',
      llm_response: payload.llm_response !== undefined && String(payload.llm_response).trim() !== ''
        ? String(payload.llm_response)
        : 'N/A',
    };
    existing.push(normalized);
    safeLocalStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to buffer analytics locally:', e);
  }
}

// Conversation analytics (new API expects a single string)
export type ConversationEvent =
  | { type: 'repeat'; timestamp: number }
  | { type: 'switch'; timestamp: number }
  | { type: 'message'; role: 'assistant' | 'user'; text: string; timestamp: number };

const CONV_KEY = 'sensai_conversation_buffer_v1';

export function bufferConversationEvent(event: ConversationEvent): void {
  try {
    const raw = safeLocalStorage.getItem(CONV_KEY);
    const list: ConversationEvent[] = raw ? JSON.parse(raw) : [];
    list.push(event);
    safeLocalStorage.setItem(CONV_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to buffer conversation event:', e);
  }
}

export async function flushConversationBuffer(): Promise<void> {
  const raw = safeLocalStorage.getItem(CONV_KEY);
  if (!raw) return;
  let list: ConversationEvent[] = [];
  try { list = JSON.parse(raw); } catch { return; }
  if (!list.length) return;

  const repeatCount = list.filter(e => e.type === 'repeat').length;
  const switchCount = list.filter(e => e.type === 'switch').length;
  const messages = list
    .filter((e): e is Extract<ConversationEvent, { type: 'message' }> => e.type === 'message')
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(e => `${e.role === 'assistant' ? 'Assistant' : 'User'}: ${e.text}`);

  const conversation = `repeat_count: ${repeatCount}\ninterest_switch: ${switchCount}\nConversation:\n${messages.join('\n')}`;

  try {
    const response = await fetch('http://192.168.137.218:8000/analytics/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });
    let data: unknown = null;
    try { data = await response.json(); } catch {}
    console.log('Analytics (conversation) response:', { status: response.status, data });
    if (response.ok) {
      safeLocalStorage.setItem(CONV_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Failed to send conversation analytics:', error);
  }
}

// Legacy numeric analytics removed in favor of conversation endpoint

