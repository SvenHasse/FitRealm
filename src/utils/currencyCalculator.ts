// currencyCalculator.ts
// Converts workout metrics → Muskelmasse + Protein rewards.

export interface RewardInput {
  durationMinutes: number;
  activeCalories: number;
  steps: number;
  avgHeartRate: number;
  minutesAbove70HRmax: number;
}

export interface RewardResult {
  hrMultiplier: number;
  muskelmassFromDuration: number; // minutes × 2 × hrMultiplier
  muskelmassFromCalories: number; // calories ÷ 20
  muskelmassFromSteps: number;    // (steps ÷ 1000) × 3
  totalMuskelmasse: number;
  protein: number;   // ≥20min at ≥70% HRmax → 1+; +1 per additional 15 min
  streakToken: number; // always 1 per workout day
}

export function hrMultiplier(avgHR: number): number {
  if (avgHR < 100) return 1.0;
  if (avgHR < 130) return 1.3;
  if (avgHR < 160) return 1.6;
  return 2.0;
}

export function calculateReward(input: RewardInput): RewardResult {
  const mult = hrMultiplier(input.avgHeartRate);
  const fromDuration = input.durationMinutes * 2 * mult;
  const fromCalories = input.activeCalories / 20;
  const fromSteps = (input.steps / 1000) * 3;
  const totalMuskelmasse = fromDuration + fromCalories + fromSteps;

  let protein = 0;
  if (input.minutesAbove70HRmax >= 20) {
    protein = 1 + Math.floor((input.minutesAbove70HRmax - 20) / 15);
  }

  return {
    hrMultiplier: mult,
    muskelmassFromDuration: fromDuration,
    muskelmassFromCalories: fromCalories,
    muskelmassFromSteps: fromSteps,
    totalMuskelmasse,
    protein,
    streakToken: 1,
  };
}

/** Format a gram value: "22,5g" */
export function formatGrams(value: number): string {
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1).replace('.', ',')}g`;
}
