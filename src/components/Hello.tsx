const HELLOS = [
  "Hallo",
  "Hi",
  "Привет",
  "Hej",
  "Hæ",
  "Bom dia",
  "Bonjour",
  "Cześć",
  "Olá",
];

export function Hello() {
  const hello = HELLOS[Math.floor(Math.random() * HELLOS.length)];
  return <span>{hello}</span>;
}
