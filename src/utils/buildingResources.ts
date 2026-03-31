// buildingResources.ts
// Utility helpers for building → resource type mapping, icons and colours.
// Uses the existing ResourceType enum and buildingProducesResource() from types.ts
// so there is a single source of truth for the mapping.

import { BuildingType, ResourceType, buildingProducesResource } from '../models/types';

export { ResourceType };

/** Returns the ResourceType produced by a building (ResourceType.none for non-producers). */
export function getBuildingResourceType(type: BuildingType): ResourceType {
  return buildingProducesResource(type);
}

/** MaterialCommunityIcons icon name for each resource type. */
export function getResourceIcon(resource: ResourceType): string {
  switch (resource) {
    case ResourceType.wood:        return 'tree';
    case ResourceType.stone:       return 'diamond';
    case ResourceType.food:        return 'leaf';
    case ResourceType.protein:     return 'flask';
    case ResourceType.muskelmasse: return 'dumbbell';
    default:                       return 'circle-outline';
  }
}

/** Accent colour for each resource type. */
export function getResourceColor(resource: ResourceType): string {
  switch (resource) {
    case ResourceType.wood:        return '#FF9800';   // orange
    case ResourceType.stone:       return '#B0BEC5';   // cool grey
    case ResourceType.food:        return '#66BB6A';   // green
    case ResourceType.protein:     return '#26C6DA';   // teal
    case ResourceType.muskelmasse: return '#FFD700';   // gold
    default:                       return '#FFFFFF';
  }
}
