import { NEW_PLAYER, type DailyResult, type PlayerRecord } from '../../domain/PlayerRecord'
import type { PlayerStore } from '../../domain/ports/PlayerStore'

const KEY = 'wikisaltos.player'

/**
 * The stored shape carries its own version from day one. The moment anything is
 * written to a player's machine it is a format that has to be read back forever,
 * and without a version the first change silently breaks everyone who already
 * played.
 */
const VERSION = 1

interface StoredRecord extends PlayerRecord {
  readonly version: number
}

/**
 * Records kept in the browser, with no account and no server.
 *
 * Two things make this less trivial than it looks. Writing can throw — Safari in
 * private mode and a blocked-cookies setting both refuse — and losing a record
 * is never worth crashing a finished race over. And the contents belong to the
 * player, who can edit them: everything read back is checked, and anything that
 * does not look right is treated as a fresh start rather than trusted.
 */
export class LocalStoragePlayerStore implements PlayerStore {
  load(): PlayerRecord {
    try {
      const raw = window.localStorage.getItem(KEY)
      return raw === null ? NEW_PLAYER : parseRecord(JSON.parse(raw))
    } catch {
      return NEW_PLAYER
    }
  }

  save(record: PlayerRecord): void {
    try {
      const stored: StoredRecord = { ...record, version: VERSION }
      window.localStorage.setItem(KEY, JSON.stringify(stored))
    } catch {
      // Storage disabled or full. The race still counts on screen; it just will
      // not survive a reload.
    }
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const counter = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0

function parseRecord(value: unknown): PlayerRecord {
  if (!isObject(value) || value['version'] !== VERSION) return NEW_PLAYER
  const streak = counter(value['streak'])
  return {
    streak,
    // A hand-edited file could claim a best lower than the current run.
    bestStreak: Math.max(counter(value['bestStreak']), streak),
    played: counter(value['played']),
    won: Math.min(counter(value['won']), counter(value['played'])),
    daily: parseDaily(value['daily']),
  }
}

function parseDaily(value: unknown): DailyResult | null {
  if (!isObject(value)) return null
  const { dayId, outcome, origin, target, bestJumps } = value
  if (typeof dayId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) return null
  if (outcome !== 'won' && outcome !== 'surrendered' && outcome !== 'timeout') return null
  if (typeof origin !== 'string' || typeof target !== 'string') return null

  return {
    dayId,
    outcome,
    jumps: counter(value['jumps']),
    elapsedMs: counter(value['elapsedMs']),
    bestJumps: typeof bestJumps === 'number' && bestJumps >= 0 ? bestJumps : null,
    origin,
    target,
  }
}
