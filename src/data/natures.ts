export interface Nature {
  name: string;
  up?: string;
  down?: string;
}

export const NATURES: Nature[] = [
  { name: "Adamant", up: "Atk", down: "SpA" },
  { name: "Bashful" },
  { name: "Bold", up: "Def", down: "Atk" },
  { name: "Brave", up: "Atk", down: "Spe" },
  { name: "Calm", up: "SpD", down: "Atk" },
  { name: "Careful", up: "SpD", down: "SpA" },
  { name: "Docile" },
  { name: "Gentle", up: "SpD", down: "Def" },
  { name: "Hardy" },
  { name: "Hasty", up: "Spe", down: "Def" },
  { name: "Impish", up: "Def", down: "SpA" },
  { name: "Jolly", up: "Spe", down: "SpA" },
  { name: "Lax", up: "Def", down: "SpD" },
  { name: "Lonely", up: "Atk", down: "Def" },
  { name: "Mild", up: "SpA", down: "Def" },
  { name: "Modest", up: "SpA", down: "Atk" },
  { name: "Naive", up: "Spe", down: "SpD" },
  { name: "Naughty", up: "Atk", down: "SpD" },
  { name: "Quiet", up: "SpA", down: "Spe" },
  { name: "Quirky" },
  { name: "Rash", up: "SpA", down: "SpD" },
  { name: "Relaxed", up: "Def", down: "Spe" },
  { name: "Sassy", up: "SpD", down: "Spe" },
  { name: "Serious" },
  { name: "Timid", up: "Spe", down: "Atk" },
];
