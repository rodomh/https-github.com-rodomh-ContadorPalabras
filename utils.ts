export const isChrome = (): boolean => {
  // This is a common way to detect Chrome specifically.
  // We check for the presence of window.chrome, which is true in Chromium-based browsers,
  // then we exclude browsers that are also Chromium-based but not Chrome itself (like Opera, Edge).
  const isChromium = !!(window as any).chrome;
  const isOpera = navigator.userAgent.indexOf("OPR") > -1;
  const isEdge = navigator.userAgent.indexOf("Edg") > -1;
  const isVivaldi = navigator.userAgent.indexOf("Vivaldi") > -1;
  // Fix: Cast navigator to 'any' to access the non-standard 'brave' property.
  const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave;

  // It's considered Chrome if it's Chromium-based but not one of the others.
  return isChromium && !isOpera && !isEdge && !isVivaldi && !isBrave;
};
