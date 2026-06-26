import { ref } from 'vue'

const supported = 'Notification' in globalThis
const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied')

async function requestPermission(): Promise<NotificationPermission> {
  if (!supported) return 'denied'
  if (permission.value !== 'default') return permission.value
  try {
    permission.value = await Notification.requestPermission()
  } catch {
    // Some browsers reject the non-promise form; treat as no decision.
  }
  return permission.value
}

function notify(title: string, body: string): void {
  if (!supported || permission.value !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/favicon.svg',
      tag: 'pomodoro-phase',
    })
  } catch {
    // Construction can throw on platforms that require the SW Notification API.
  }
}

export function useNotifications() {
  return { requestPermission, notify }
}
