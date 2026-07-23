import type { RestTimerState } from '../types';
import { supabase } from './supabase';

function decodeVapidKey(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const decoded = atob((value + padding).replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

export function canEnableRestNotifications(): boolean {
  return Boolean(supabase && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && import.meta.env.VITE_VAPID_PUBLIC_KEY);
}

export async function enableRestNotifications(memberId: string): Promise<NotificationPermission | 'unsupported'> {
  if (!canEnableRestNotifications()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });
  const { error } = await supabase!.from('push_subscriptions').upsert({
    member_id: memberId,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) throw error;
  return permission;
}

export async function syncRestNotificationJob(memberId: string, timer: RestTimerState): Promise<void> {
  if (!supabase || !timer.notificationJobId || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (timer.cancelledNotificationJobId && timer.cancelledNotificationJobId !== timer.notificationJobId) {
    const { error } = await supabase.from('rest_notification_jobs').update({ status: 'cancelled' })
      .eq('id', timer.cancelledNotificationJobId).eq('member_id', memberId).in('status', ['pending', 'processing']);
    if (error) throw error;
  }
  if (timer.active && timer.deadlineAt) {
    const { error } = await supabase.from('rest_notification_jobs').upsert({
      id: timer.notificationJobId,
      member_id: memberId,
      deadline_at: new Date(timer.deadlineAt).toISOString(),
      next_set_label: timer.nextSetLabel,
      status: 'pending',
    });
    if (error) throw error;
  } else if (timer.paused || timer.endedBy === 'dismissed') {
    const { error } = await supabase.from('rest_notification_jobs').update({ status: 'cancelled' })
      .eq('id', timer.notificationJobId).eq('member_id', memberId).in('status', ['pending', 'processing']);
    if (error) throw error;
  }
}
