import { BiomeId } from './types';

// Notification scheduling - uses expo-notifications if available
// For now, just a stub that can be connected later
export async function scheduleScoutReturnNotification(
  biomeId: BiomeId,
  _animalType: string,
  returnTime: number
): Promise<void> {
  // TODO: Connect to expo-notifications when available
  // For now, the store's checkReturnedScouts handles this on app foreground
  console.log(`Scout notification scheduled: returns from ${biomeId} at ${new Date(returnTime).toISOString()}`);
}

export async function cancelScoutNotification(biomeId: BiomeId): Promise<void> {
  console.log(`Scout notification cancelled for ${biomeId}`);
}
