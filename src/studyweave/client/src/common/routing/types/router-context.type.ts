export interface NavigateOptions {
  replace?: boolean;
}

export interface RouterContextValue {
  pathname: string;
  navigate: (path: string, options?: NavigateOptions) => void;
}
