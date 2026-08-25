import type { ComponentType, ReactNode } from 'react';

export type RouteLayout = ComponentType<{ children: ReactNode }>;

export interface RouteDefinition {
  path: string;
  title: string;
  component: ComponentType;
  layout: RouteLayout;
}
