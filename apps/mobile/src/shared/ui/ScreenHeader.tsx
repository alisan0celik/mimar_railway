import { AppHeader, type AppHeaderProps } from "./AppHeader";

export type ScreenHeaderProps = AppHeaderProps;

export function ScreenHeader(props: ScreenHeaderProps) {
  return <AppHeader {...props} />;
}
