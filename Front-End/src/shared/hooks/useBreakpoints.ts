import { useWindowSize } from './useWindowSize'

export function useBreakpoints() {
  const { width } = useWindowSize()
  return {
    isTiny: width < 480,
    isMobile: width < 768,
    isCompact: width < 640,
    isTablet: width >= 768 && width < 1024,
    isCompactTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  }
}
