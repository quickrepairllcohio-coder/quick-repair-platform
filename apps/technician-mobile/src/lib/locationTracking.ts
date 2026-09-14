import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';

export const TECHNICIAN_LOCATION_TASK = 'quick-repair-technician-location';
const ACTIVE_JOB_KEY = 'quick-repair-active-location-job';

async function recordLocation(jobId: string, location: Location.LocationObject) {
  const { coords } = location;
  await supabase.rpc('record_technician_location', {
    p_job_id: jobId,
    p_latitude: coords.latitude,
    p_longitude: coords.longitude,
    p_accuracy: coords.accuracy ?? null,
    p_speed: coords.speed ?? null,
    p_heading: coords.heading ?? null,
  });
}

TaskManager.defineTask(TECHNICIAN_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const locations = (data as { locations?: Location.LocationObject[] }).locations || [];
  const jobId = await AsyncStorage.getItem(ACTIVE_JOB_KEY);
  if (!jobId) return;
  for (const location of locations) {
    try {
      await recordLocation(jobId, location);
    } catch {
      // Keep the task resilient; the next OS sample retries.
    }
  }
});

let foregroundSubscription: Location.LocationSubscription | null = null;
let activeJobId: string | null = null;

export async function startTechnicianLocationTracking(jobId: string) {
  if (activeJobId === jobId) return;
  await stopTechnicianLocationTracking();

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('Location services are disabled on this device.');

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission is required while working this job.');
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Background location permission is required so customer tracking continues while the technician uses navigation.');
  }

  activeJobId = jobId;
  await AsyncStorage.setItem(ACTIVE_JOB_KEY, jobId);

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(TECHNICIAN_LOCATION_TASK);
  if (!alreadyStarted) {
    await Location.startLocationUpdatesAsync(TECHNICIAN_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 25,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'Quick Repair location active',
        notificationBody: 'Your location is shared with Quick Repair while this job is active.',
        notificationColor: '#000000',
      },
    });
  }

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 25,
      mayShowUserSettingsDialog: true,
    },
    async (location) => {
      if (!activeJobId) return;
      try {
        await recordLocation(activeJobId, location);
      } catch {
        // Background task/next foreground sample retries later.
      }
    },
  );
}

export async function stopTechnicianLocationTracking() {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  const registered = await Location.hasStartedLocationUpdatesAsync(TECHNICIAN_LOCATION_TASK).catch(() => false);
  if (registered) await Location.stopLocationUpdatesAsync(TECHNICIAN_LOCATION_TASK).catch(() => undefined);
  activeJobId = null;
  await AsyncStorage.removeItem(ACTIVE_JOB_KEY);
}
