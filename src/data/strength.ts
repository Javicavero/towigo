/**
 * Rutinas de fuerza cortas (10 min, sin material) para proteger el músculo mientras se pierde peso.
 * Contenido educativo general; el equipo puede adaptarlo. Nada de esto es una pauta clínica.
 */
export type Exercise = { id: string; reps: string };
export type Routine = { id: string; minutes: number; level: 1 | 2; exercises: Exercise[] };

export const ROUTINES: Routine[] = [
  {
    id: 'base',
    minutes: 10,
    level: 1,
    exercises: [
      { id: 'chairSquat', reps: '3 × 10' },
      { id: 'wallPush', reps: '3 × 10' },
      { id: 'calfRaise', reps: '3 × 15' },
      { id: 'bridge', reps: '3 × 10' },
    ],
  },
  {
    id: 'legs',
    minutes: 10,
    level: 1,
    exercises: [
      { id: 'chairSquat', reps: '3 × 12' },
      { id: 'stepUp', reps: '3 × 8 por pierna' },
      { id: 'sideLeg', reps: '3 × 10 por lado' },
      { id: 'calfRaise', reps: '3 × 15' },
    ],
  },
  {
    id: 'upper',
    minutes: 10,
    level: 2,
    exercises: [
      { id: 'wallPush', reps: '3 × 12' },
      { id: 'bottleRow', reps: '3 × 12' },
      { id: 'bottlePress', reps: '3 × 10' },
      { id: 'plank', reps: '3 × 20 s' },
    ],
  },
];

/** Raciones habituales con su proteína aproximada (g). */
export const PROTEIN_FOODS: { id: string; g: number }[] = [
  { id: 'eggs', g: 12 },
  { id: 'yogurt', g: 10 },
  { id: 'chicken', g: 30 },
  { id: 'fish', g: 25 },
  { id: 'legumes', g: 15 },
  { id: 'cheese', g: 12 },
];
