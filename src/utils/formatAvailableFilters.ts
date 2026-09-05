import { FilterGroup } from "@t";
import { safeParseArray } from "@utils";

export function formatAvailableFilters(rawFilters: any[]): FilterGroup[] {
  return rawFilters.map((group) => ({
    id: group.id,
    label: group.label,
    values: safeParseArray(group.values).map((value: any) => ({
      id: value.id,
      label: value.label,
      count: value.count,
    })),
  }));
}
