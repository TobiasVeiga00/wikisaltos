/**
 * Starting points for a race. Titles are the canonical ones — every entry was
 * checked against es.wikipedia so no race wastes a request on a redirect.
 *
 * The list leans Argentine on purpose: the origin sets the cultural territory,
 * and three random link jumps from Gardel or Boca land somewhere the player has
 * a chance of recognising. The international entries keep it from turning into
 * a quiz about one country.
 *
 * The interface never advertises this. Three random jumps routinely leave the
 * country behind, and promising an Argentine race the game cannot guarantee
 * reads as a broken promise the first time it ends up in Bangladesh.
 */
const ARGENTINE_SEEDS = [
  // Música
  'Carlos Gardel',
  'Tango',
  'Mercedes Sosa',
  'Charly García',
  'Gustavo Cerati',
  'Soda Stereo',
  'Luis Alberto Spinetta',
  'Fito Páez',
  'Andrés Calamaro',
  'Astor Piazzolla',
  'Atahualpa Yupanqui',
  'Rock de Argentina',
  'Bandoneón',
  'Cuarteto (música)',
  'Patricio Rey y sus Redonditos de Ricota',
  // Deporte
  'Diego Maradona',
  'Lionel Messi',
  'Club Atlético Boca Juniors',
  'Club Atlético River Plate',
  'Selección de fútbol de Argentina',
  'Juan Manuel Fangio',
  'Guillermo Vilas',
  'Manu Ginóbili',
  'Copa Mundial de Fútbol de 1986',
  'Copa Mundial de Fútbol de 1978',
  'Primera División de Argentina',
  // Letras y pantalla
  'Jorge Luis Borges',
  'Julio Cortázar',
  'Mafalda',
  'Quino',
  'Literatura de Argentina',
  'Cine de Argentina',
  'Historieta en la Argentina',
  'El Gaucho Martín Fierro',
  'Gaucho',
  'Teatro Colón',
  // Comida
  'Asado',
  'Mate (infusión)',
  'Empanada',
  'Dulce de leche',
  'Alfajor',
  'Malbec',
  // Lugares e historia
  'Buenos Aires',
  'Patagonia',
  'Cataratas del Iguazú',
  'Córdoba (Argentina)',
  'Rosario (Argentina)',
  'Mendoza (Argentina)',
  'Río de la Plata',
  'Cordillera de los Andes',
  'Eva Perón',
  'Juan Domingo Perón',
  'Manuel Belgrano',
  'José de San Martín',
  'Revolución de Mayo',
  'Guerra de las Malvinas',
  'Che Guevara',
  'Francisco (papa)',
  'San Carlos de Bariloche',
  'Ushuaia',
  'Salta',
] as const

const INTERNATIONAL_SEEDS = [
  'The Beatles',
  'Michael Jackson',
  'Queen',
  'Freddie Mercury',
  'David Bowie',
  'Vincent van Gogh',
  'Pablo Picasso',
  'Leonardo da Vinci',
  'Frida Kahlo',
  'William Shakespeare',
  'Real Madrid Club de Fútbol',
  'Fútbol Club Barcelona',
  'Pelé',
  'Copa Mundial de Fútbol',
  'Juegos Olímpicos',
  'Ajedrez',
  'Japón',
  'Italia',
  'Francia',
  'Brasil',
  'España',
  'México',
  'Nueva York',
  'Roma',
  'París',
  'Tokio',
  'Pizza',
  'Sushi',
  'Café',
  'Chocolate',
  'Star Wars',
  'Nintendo',
  'Internet',
  'Netflix',
  'Albert Einstein',
  'Marie Curie',
  'Nikola Tesla',
  'Cine',
] as const

/** Roughly two out of three races start on Argentine ground. */
const ARGENTINE_SHARE = 2 / 3

/**
 * There are only about a hundred seeds, so picking blind means seeing the same
 * opening article again within a dozen races. Recently used ones are skipped
 * unless that would leave nothing to choose from.
 */
export function pickSeed(
  wasRecentlyUsed: (title: string) => boolean = () => false,
  random: () => number = Math.random,
): string {
  const pool: readonly string[] = random() < ARGENTINE_SHARE ? ARGENTINE_SEEDS : INTERNATIONAL_SEEDS
  const available = pool.filter((title) => !wasRecentlyUsed(title))
  const choices = available.length > 0 ? available : pool
  return choices[Math.floor(random() * choices.length)] ?? 'Buenos Aires'
}
