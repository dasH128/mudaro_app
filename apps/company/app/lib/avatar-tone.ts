/** Tono del avatar (0..2: tinta, cartón o kraft), estable por identificador. Lo usan las listas con avatares (Equipa, Clientes). */
export function avatarTone(id: string): 0 | 1 | 2 {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return (sum % 3) as 0 | 1 | 2;
}
