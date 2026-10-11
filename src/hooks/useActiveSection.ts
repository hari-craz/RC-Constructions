import { useScroll } from './useScroll';

export function useActiveSection(): string {
  const { activeSection } = useScroll();
  return activeSection;
}
