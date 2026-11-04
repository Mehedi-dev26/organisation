/**
 * Push Notification Service for Somoyer Batighor (সময়ের বাতিঘর)
 * Handles browser and mobile web push notifications, permission requests,
 * and alerts for dues reminders, organization notices, and SMS updates.
 */

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

const STORAGE_KEY_PUSH_ENABLED = 'batighor_push_notifications_enabled';
const STORAGE_KEY_LAST_DUES_PUSH = 'batighor_last_dues_push_timestamp';

/**
 * Checks if the browser or mobile device supports Web Push & Notifications
 */
export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Gets the current notification permission state
 */
export const getNotificationPermission = (): PushPermissionStatus => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
};

/**
 * Registers the service worker for background push notifications
 */
export const registerNotificationServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('[Push Notification] Service worker registration failed:', err);
    return null;
  }
};

/**
 * Requests push notification permission from the user
 * and dispatches a confirmation notification when granted
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('[Push Notification] Push notifications are not supported in this browser.');
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      localStorage.setItem(STORAGE_KEY_PUSH_ENABLED, 'true');

      // Register SW
      const registration = await registerNotificationServiceWorker();

      // Show welcome notification immediately to confirm active status
      await showPushNotification({
        title: 'সময়ের বাতিঘর (Somoyer Batighor)',
        body: 'নোটিফিকেশন সফলভাবে চালু হয়েছে! জরুরি নোটিশ ও চাঁদার রিমাইন্ডার এখন থেকে সরাসরি আপনার ফোনে পাবেন।',
        url: '/member/notices',
        tag: 'welcome-notification',
      });

      return true;
    } else {
      localStorage.setItem(STORAGE_KEY_PUSH_ENABLED, 'false');
      return false;
    }
  } catch (err) {
    console.error('[Push Notification] Permission request failed:', err);
    return false;
  }
};

/**
 * Displays a push notification on mobile or desktop browser
 */
export const showPushNotification = async (payload: PushNotificationPayload): Promise<boolean> => {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultIcon = '/favicon.png';
  const defaultBadge = '/favicon.png';

  try {
    // Prefer Service Worker showNotification for native mobile notifications
    if (navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || defaultIcon,
          badge: payload.badge || defaultBadge,
          tag: payload.tag || 'batighor-' + Date.now(),
          vibrate: [150, 70, 150],
          data: {
            url: payload.url || '/member/notices',
            timestamp: Date.now(),
          },
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to standard window Notification
    const notif = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || defaultIcon,
      badge: payload.badge || defaultBadge,
      tag: payload.tag,
    });

    notif.onclick = () => {
      window.focus();
      if (payload.url && typeof window !== 'undefined') {
        window.location.href = payload.url;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('[Push Notification] Failed to display notification:', err);
    return false;
  }
};

/**
 * Dispatches an automated dues reminder push notification
 * (Throttled to once per 24 hours per session to avoid spamming)
 */
export const triggerDuesReminderPush = async (
  unpaidCount: number,
  unpaidAmount: number
): Promise<void> => {
  if (!isPushSupported() || Notification.permission !== 'granted' || unpaidCount <= 0) {
    return;
  }

  const lastPushStr = localStorage.getItem(STORAGE_KEY_LAST_DUES_PUSH);
  const now = Date.now();
  // Throttle to max 1 push every 12 hours
  if (lastPushStr && now - Number(lastPushStr) < 12 * 60 * 60 * 1000) {
    return;
  }

  const title = 'বকেয়া চাঁদা সতর্কতা | সময়ের বাতিঘর';
  const body = `আপনার ${unpaidCount} মাসের চাঁদা (মোট: ৳${unpaidAmount}) বকেয়া রয়েছে। এখনই অনলাইনে সহজে পরিশোধ করুন।`;

  const sent = await showPushNotification({
    title,
    body,
    url: '/member/pay-dues',
    tag: 'dues-reminder-push',
  });

  if (sent) {
    localStorage.setItem(STORAGE_KEY_LAST_DUES_PUSH, String(now));
  }
};

/**
 * Dispatches a push notification when an urgent organization notice is issued
 */
export const triggerNoticePush = async (
  noticeTitle: string,
  noticeSummary?: string
): Promise<void> => {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return;
  }

  await showPushNotification({
    title: `জরুরি নোটিশ: ${noticeTitle}`,
    body: noticeSummary || 'সময়ের বাতিঘর পোর্টাল থেকে বিস্তারিত দেখে নিন।',
    url: '/member/notices',
    tag: 'notice-' + Date.now(),
  });
};

