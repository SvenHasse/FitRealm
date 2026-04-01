export type AnimalFit = 'perfect' | 'good' | 'possible';
interface FitInfo { fit: AnimalFit; bonus: string; speedMultiplier: number; }

export const ANIMAL_FIT: Record<string, Record<string, FitInfo>> = {
  desert: {
    llama:  { fit: 'perfect', bonus: 'Kennt trockene Böden — findet 2× mehr Ressourcen', speedMultiplier: 1.0 },
    horse:  { fit: 'good', bonus: 'Schneller Läufer — kommt 30% früher zurück', speedMultiplier: 1.3 },
    pig:    { fit: 'possible', bonus: 'Findet sich irgendwie durch...', speedMultiplier: 0.9 },
    pug:    { fit: 'possible', bonus: 'Tapfer aber nicht ideal für die Hitze', speedMultiplier: 0.8 },
    sheep:  { fit: 'possible', bonus: 'Mag eigentlich grüne Wiesen', speedMultiplier: 0.85 },
    cow:    { fit: 'good', bonus: 'Robust und ausdauernd', speedMultiplier: 1.0 },
    zebra:  { fit: 'perfect', bonus: 'Wie zu Hause in offenem Gelände', speedMultiplier: 1.2 },
  },
  mountains: {
    horse:  { fit: 'perfect', bonus: 'Bergpferde sind unschlagbar — findet Geheimwege', speedMultiplier: 1.2 },
    sheep:  { fit: 'perfect', bonus: 'Klettert wie ein Profi — findet versteckte Höhlen', speedMultiplier: 1.0 },
    cow:    { fit: 'good', bonus: 'Sturdy mountain cow', speedMultiplier: 1.0 },
    llama:  { fit: 'good', bonus: 'Gebirgstier aus Südamerika', speedMultiplier: 1.1 },
    pig:    { fit: 'possible', bonus: 'Keucht ein bisschen beim Aufstieg', speedMultiplier: 0.8 },
    pug:    { fit: 'possible', bonus: 'Sehr mutig für seine Größe', speedMultiplier: 0.75 },
    zebra:  { fit: 'possible', bonus: 'Bevorzugt flaches Gelände', speedMultiplier: 0.85 },
  },
};

export function getFitColor(fit: AnimalFit): string {
  return { perfect: '#4CAF50', good: '#FF9800', possible: '#9E9E9E' }[fit];
}
export function getFitLabel(fit: AnimalFit): string {
  return { perfect: 'Perfekt', good: 'Gut', possible: 'Geht so' }[fit];
}
