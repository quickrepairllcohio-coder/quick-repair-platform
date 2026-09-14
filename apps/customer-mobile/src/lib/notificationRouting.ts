import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export function routeFromNotification(data: any) {
  if (!data) return;
  const type = String(data.type || '');
  const jobId = data.job_id ? String(data.job_id) : '';
  const requestId = data.request_id ? String(data.request_id) : '';
  if (jobId && type.startsWith('job_')) {
    router.push({ pathname: '/(customer)/jobs/[id]', params: { id: jobId } });
    return;
  }
  if (requestId) {
    router.push('/(customer)/history');
  }
}

export function attachNotificationRouting() {
  const received = Notifications.addNotificationResponseReceivedListener(response => {
    routeFromNotification(response.notification.request.content.data);
  });
  Notifications.getLastNotificationResponseAsync().then(response => {
    if (response) routeFromNotification(response.notification.request.content.data);
  }).catch(() => undefined);
  return () => received.remove();
}
