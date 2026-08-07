import type { PlayerRecord } from '../PlayerRecord'

export interface PlayerStore {
  /** Never throws and never returns garbage: an unreadable store reads as a new player. */
  load(): PlayerRecord
  /** Never throws either. Storage can be full or disabled, and a lost record is not worth a crash. */
  save(record: PlayerRecord): void
}
