# send-expo-push

Internal staff-only push sender. It verifies the caller's Supabase JWT and permits only admin/dispatcher/super_admin roles. It reads enabled Expo tokens from `user_devices` and sends them through Expo Push Service.

For fully automatic technician/customer event notifications, wire this function to the existing notification/event pipeline before production launch.
