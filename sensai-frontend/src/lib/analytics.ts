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
  | { type: 'voice_command'; text: string; success: boolean; timestamp: number }
  | { type: 'help_request'; text: string; timestamp: number }
  | { type: 'task_complete'; taskId: number | string; title: string; taskType?: string; timestamp: number }
  | { type: 'milestone_complete'; milestoneId: number | string; title: string; timestamp: number }
  | { type: 'course_complete'; courseId?: string; title?: string; timestamp: number }
  | { type: 'message'; role: 'assistant' | 'user'; text: string; timestamp: number };

const CONV_KEY = 'sensai_conversation_buffer_v1';
const LAST_ANALYTICS_KEY = 'sensai_last_analytics_response_v1';

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

export async function flushConversationBuffer(): Promise<any | void> {
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

  const eventLines = list
    .filter(e => e.type !== 'message')
    .map(e => {
      switch (e.type) {
        case 'repeat':
          return `event: repeat | ts=${e.timestamp}`;
        case 'switch':
          return `event: interest_switch | ts=${e.timestamp}`;
        case 'voice_command':
          return `event: voice_command | success=${e.success} | text=${e.text} | ts=${e.timestamp}`;
        case 'help_request':
          return `event: help_request | text=${e.text} | ts=${e.timestamp}`;
        case 'task_complete':
          return `event: task_complete | id=${e.taskId} | title=${e.title} | type=${e.taskType ?? ''} | ts=${e.timestamp}`;
        case 'milestone_complete':
          return `event: milestone_achievement | id=${e.milestoneId} | title=${e.title} | ts=${e.timestamp}`;
        case 'course_complete':
          return `event: course_completion | id=${e.courseId ?? ''} | title=${e.title ?? ''} | ts=${e.timestamp}`;
        default:
          return `event: ${e.type} | ts=${(e as any).timestamp}`;
      }
    });

  const conversation = `repeat_count: ${repeatCount}\ninterest_switch: ${switchCount}\nEvents:\n${eventLines.join('\n')}\nConversation:\n${messages.join('\n')}`;

  try {
    const response = await fetch('http://192.168.137.218:8000/analytics/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });
    let data: any = null;
    try { data = await response.json(); } catch {}
    const payload = { status: response.status, data };
    console.log('Analytics (conversation) response:', payload);
    if (response.ok) {
      safeLocalStorage.setItem(CONV_KEY, JSON.stringify([]));
    }
    // Cache last analytics regardless of status if data is present, so page can re-show later
    if (data && data.analytics) {
      try { safeLocalStorage.setItem(LAST_ANALYTICS_KEY, JSON.stringify(payload)); } catch {}
    }
    return payload;
  } catch (error) {
    console.error('Failed to send conversation analytics:', error);
  }
}

// Legacy numeric analytics removed in favor of conversation endpoint

export function getLastAnalytics(): any | null {
  try {
    const raw = safeLocalStorage.getItem(LAST_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
