/**
 * Estimación de comida SIN conexión (demostración): suma raciones típicas a partir de la descripción.
 * En la app real la hace la IA con la foto (supabase/functions/food-estimate) y siempre es editable.
 */
import type { FoodEstimate } from '../services/backend';

const FOODS: { re: RegExp; name: string; portion: string; carbs: number; protein: number }[] = [
  { re: /pasta|macarr|espagu/, name: 'Pasta', portion: '1 plato (80 g en crudo)', carbs: 60, protein: 10 },
  { re: /arroz|paella/, name: 'Arroz', portion: '1 plato (70 g en crudo)', carbs: 55, protein: 5 },
  { re: /pan|bocadillo|tostada/, name: 'Pan', portion: '2 rebanadas', carbs: 30, protein: 5 },
  { re: /patata|patatas/, name: 'Patata', portion: '1 mediana', carbs: 30, protein: 3 },
  { re: /pizza/, name: 'Pizza', portion: '2 porciones', carbs: 60, protein: 20 },
  { re: /lentej|garban|alubia|legumbre/, name: 'Legumbres', portion: '1 plato', carbs: 35, protein: 15 },
  { re: /pollo|pavo/, name: 'Pollo', portion: '1 filete (120 g)', carbs: 0, protein: 32 },
  { re: /pescado|merluza|salmon|atun/, name: 'Pescado', portion: '1 filete (120 g)', carbs: 0, protein: 26 },
  { re: /huevo|tortilla/, name: 'Huevos', portion: '2 huevos', carbs: 1, protein: 12 },
  { re: /ensalada|verdura|brocoli/, name: 'Verdura', portion: '1 plato', carbs: 8, protein: 3 },
  { re: /fruta|manzana|platano|naranja/, name: 'Fruta', portion: '1 pieza', carbs: 18, protein: 1 },
  { re: /yogur/, name: 'Yogur', portion: '1 unidad', carbs: 6, protein: 8 },
];

export function demoFoodEstimate(description: string, hasPhoto: boolean): FoodEstimate {
  const s = description.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let found = FOODS.filter((f) => f.re.test(s));
  if (!found.length && hasPhoto) found = [FOODS[0], FOODS[6], FOODS[9]]; // demo: "pasta con pollo y ensalada"
  return {
    items: found.map((f) => ({ name: f.name, portion: f.portion })),
    carbs_g: found.reduce((a, f) => a + f.carbs, 0),
    protein_g: found.reduce((a, f) => a + f.protein, 0),
    confidence: found.length ? 'media' : 'baja',
    note: 'Estimación de demostración: revísala y ajústala si hace falta.',
  };
}
