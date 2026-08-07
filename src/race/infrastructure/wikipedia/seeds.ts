/**
 * Starting points for a race. Every title was checked against es.wikipedia, so
 * no race wastes a request following a redirect.
 *
 * The list leans Argentine on purpose: the origin sets the cultural territory,
 * and three random link jumps from Gardel or Boca land somewhere the player has
 * a chance of recognising. The international entries keep it from turning into
 * a quiz about one country.
 *
 * The interface never advertises this. Three random jumps routinely leave the
 * country behind, and promising an Argentine race the game cannot guarantee
 * reads as a broken promise the first time it ends up in Bangladesh.
 *
 * Openings are the only bottleneck the variety of the game actually has: the
 * pool of endings runs into the thousands, while this list is finite and a
 * player notices a repeat here. Growing it is the cheapest improvement
 * available, so new entries are welcome — just verify them first.
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
  'Sui Generis (banda)',
  'Almendra',
  'Serú Girán',
  'Virus (banda)',
  'Sumo (banda)',
  'Los Fabulosos Cadillacs',
  'Divididos',
  'Babasónicos',
  'León Gieco',
  'Horacio Guarany',
  'Los Chalchaleros',
  'Cuarteto Zupay',
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
  'Selección de rugby de Argentina',
  'Selección de básquetbol de Argentina',
  'Gabriela Sabatini',
  'Juan Martín del Potro',
  'Luciana Aymar',
  'Carlos Reutemann',
  'Pato (deporte)',
  'Turismo Carretera',
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
  'El Eternauta',
  'Héctor Germán Oesterheld',
  'Francisco Solano López (historietista)',
  'Roberto Fontanarrosa',
  'Inodoro Pereyra',
  'Patoruzú',
  'Manuel García Ferré',
  'Alberto Olmedo',
  'Antonio Gasalla',
  'Ricardo Darín',
  'Luis Puenzo',
  'El secreto de sus ojos',
  'Nueve reinas',
  'Relatos salvajes',
  'Titanes en el Ring',
  // Ciencia y técnica
  'René Favaloro',
  'Bernardo Houssay',
  'Luis Federico Leloir',
  'César Milstein',
  'Comisión Nacional de Energía Atómica',
  'INVAP',
  'ARSAT-1',
  'Instituto Balseiro',
  // Comida
  'Asado',
  'Mate (infusión)',
  'Empanada',
  'Dulce de leche',
  'Alfajor',
  'Malbec',
  'Locro',
  'Humita',
  'Choripán',
  'Fernet con coca',
  'Milanesa',
  'Vino de Argentina',
  'Ilex paraguariensis',
  'Chimichurri',
  // Lugares
  'Buenos Aires',
  'Patagonia',
  'Cataratas del Iguazú',
  'Córdoba (Argentina)',
  'Rosario (Argentina)',
  'Mendoza (Argentina)',
  'Río de la Plata',
  'Cordillera de los Andes',
  'San Carlos de Bariloche',
  'Ushuaia',
  'Salta',
  'Quebrada de Humahuaca',
  'Ischigualasto',
  'Mar del Plata',
  'La Plata',
  'San Miguel de Tucumán',
  'Puerto Madryn',
  'Archipiélago de Tierra del Fuego',
  // Historia y sociedad
  'Eva Perón',
  'Juan Domingo Perón',
  'Manuel Belgrano',
  'José de San Martín',
  'Revolución de Mayo',
  'Guerra de las Malvinas',
  'Che Guevara',
  'Francisco (papa)',
  'Domingo Faustino Sarmiento',
  'Hipólito Yrigoyen',
  'Raúl Alfonsín',
  'Juicio a las Juntas',
  'Madres de Plaza de Mayo',
  'Inmigración en Argentina',
  'Reforma Universitaria de 1918',
] as const

const INTERNATIONAL_SEEDS = [
  // Música
  'The Beatles',
  'Michael Jackson',
  'Queen',
  'Freddie Mercury',
  'David Bowie',
  'Ludwig van Beethoven',
  'Wolfgang Amadeus Mozart',
  'Bob Dylan',
  'Pink Floyd',
  'Nirvana (banda)',
  'Aretha Franklin',
  'Jazz',
  'Ópera',
  // Arte y letras
  'Vincent van Gogh',
  'Pablo Picasso',
  'Leonardo da Vinci',
  'Frida Kahlo',
  'William Shakespeare',
  'Miguel de Cervantes',
  'Gabriel García Márquez',
  'Jane Austen',
  'Fiódor Dostoyevski',
  'Salvador Dalí',
  'Claude Monet',
  'Miguel Ángel',
  'Museo del Louvre',
  // Ciencia
  'Albert Einstein',
  'Marie Curie',
  'Nikola Tesla',
  'Charles Darwin',
  'Isaac Newton',
  'Galileo Galilei',
  'Ada Lovelace',
  'Alan Turing',
  'Stephen Hawking',
  'Sistema solar',
  'Ácido desoxirribonucleico',
  'Evolución biológica',
  // Deporte
  'Real Madrid Club de Fútbol',
  'Fútbol Club Barcelona',
  'Pelé',
  'Copa Mundial de Fútbol',
  'Juegos Olímpicos',
  'Ajedrez',
  // Cultura popular
  'Star Wars',
  'Nintendo',
  'Internet',
  'Netflix',
  'Cine',
  'Los Simpson',
  'El Señor de los Anillos',
  'Harry Potter',
  'Studio Ghibli',
  'Super Mario',
  'Minecraft',
  'Videojuego',
  // Países y ciudades
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
  'Egipto',
  'India',
  'República Popular China',
  'Australia',
  'Canadá',
  'Grecia',
  'Portugal',
  'Amazonas',
  'Himalaya',
  'Antártida',
  // Comida
  'Pizza',
  'Sushi',
  'Café',
  'Chocolate',
  'Taco',
  'Ramen',
  'Paella',
  'Queso',
  'Vino',
  'Helado',
  // Historia
  'Imperio romano',
  'Antiguo Egipto',
  'Revolución francesa',
  'Segunda Guerra Mundial',
  'Apolo 11',
] as const

/** Roughly two out of three races start on Argentine ground. */
const ARGENTINE_SHARE = 2 / 3

export interface SeedChoice {
  /** A number in [0, 1) for the given salt. */
  readonly fraction: (salt: string) => number
  readonly pick: (items: readonly string[], salt: string) => string | undefined
  /**
   * Left out for the daily challenge on purpose: filtering by what *this*
   * player saw recently would hand two people different races on the same day.
   */
  readonly wasRecentlyUsed?: (title: string) => boolean
}

export function pickSeed(choice: SeedChoice): string {
  const pool: readonly string[] =
    choice.fraction('pool') < ARGENTINE_SHARE ? ARGENTINE_SEEDS : INTERNATIONAL_SEEDS
  const skip = choice.wasRecentlyUsed ?? (() => false)
  const available = pool.filter((title) => !skip(title))
  return choice.pick(available.length > 0 ? available : pool, 'origin') ?? 'Buenos Aires'
}

/** Exposed so a test can prove the list holds no duplicates and no empty entries. */
export const ALL_SEEDS: readonly string[] = [...ARGENTINE_SEEDS, ...INTERNATIONAL_SEEDS]
