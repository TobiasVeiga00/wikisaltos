/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NEW_PLAYER, type PlayerRecord } from '../../src/race/domain/PlayerRecord'
import { LocalStoragePlayerStore } from '../../src/race/infrastructure/storage/LocalStoragePlayerStore'

const KEY = 'wikisaltos.player'
const store = new LocalStoragePlayerStore()

const lleno: PlayerRecord = {
  streak: 3,
  bestStreak: 7,
  played: 20,
  won: 12,
  daily: {
    dayId: '2026-08-07',
    outcome: 'won',
    jumps: 2,
    elapsedMs: 45_000,
    bestJumps: 2,
    origin: 'Maradona',
    target: 'Pizza',
  },
}

beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('ida y vuelta', () => {
  it('devuelve lo mismo que guardó', () => {
    store.save(lleno)
    expect(store.load()).toEqual(lleno)
  })

  it('un jugador nuevo empieza en cero', () => {
    expect(store.load()).toEqual(NEW_PLAYER)
  })
})

// El contenido es del jugador y lo puede editar. Nada de lo que salga de ahí se
// da por bueno: lo que no tiene sentido se trata como empezar de cero.
describe('datos manipulados o corruptos', () => {
  it.each([
    ['texto que no es JSON', 'no soy json {{'],
    ['JSON que no es un objeto', '"hola"'],
    ['objeto sin versión', '{"streak":5}'],
    ['versión de otro formato', '{"version":99,"streak":5}'],
  ])('%s se lee como jugador nuevo', (_caso, crudo) => {
    window.localStorage.setItem(KEY, crudo)
    expect(store.load()).toEqual(NEW_PLAYER)
  })

  it('descarta contadores negativos o que no son números', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, streak: -4, bestStreak: 'diez', played: 1.5, won: null }),
    )
    expect(store.load()).toMatchObject({ streak: 0, bestStreak: 0, played: 0, won: 0 })
  })

  it('no deja que las ganadas superen a las jugadas', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, played: 3, won: 999 }))
    expect(store.load().won).toBe(3)
  })

  it('no deja una mejor racha menor que la actual', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, streak: 9, bestStreak: 2 }))
    expect(store.load().bestStreak).toBe(9)
  })

  it.each([
    ['fecha inventada', { dayId: 'ayer', outcome: 'won', origin: 'a', target: 'b' }],
    [
      'resultado inexistente',
      { dayId: '2026-08-07', outcome: 'hackeado', origin: 'a', target: 'b' },
    ],
    ['sin títulos', { dayId: '2026-08-07', outcome: 'won' }],
  ])('descarta un desafío diario con %s', (_caso, daily) => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, daily }))
    expect(store.load().daily).toBeNull()
  })
})

// Safari en incógnito y las cookies bloqueadas hacen que escribir lance
// excepción. Perder el registro nunca puede costar la partida terminada.
describe('cuando el almacenamiento falla', () => {
  it('guardar no lanza excepción', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => {
      store.save(lleno)
    }).not.toThrow()
  })

  it('leer devuelve un jugador nuevo en vez de romper', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('acceso denegado')
    })
    expect(store.load()).toEqual(NEW_PLAYER)
  })
})
