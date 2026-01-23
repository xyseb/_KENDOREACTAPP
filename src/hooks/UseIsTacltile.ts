import { useState, useEffect } from "react";

/**
 * useIsTactile
 * Détecte si le navigateur dispose d'au moins un point tactile actif.
 * Réagit aux changements dynamiques (ex. PC qui passe en mode tactile ou écran tactile branché).
 */
export function useIsTactile(): boolean {
  const getTouchStatus = () => navigator.maxTouchPoints > 0;

  const [isTactile, setIsTactile] = useState(getTouchStatus);

  useEffect(() => {
    let animationFrame: number;

    const checkTouchPoints = () => {
      const current = getTouchStatus();
      setIsTactile(prev => (prev !== current ? current : prev));
      animationFrame = requestAnimationFrame(checkTouchPoints);
    };

    animationFrame = requestAnimationFrame(checkTouchPoints);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return isTactile;
}

