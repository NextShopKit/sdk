export interface FilterValue {
  id: string;
  label: string;
  count: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  values: FilterValue[];
}
