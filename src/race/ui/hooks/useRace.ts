import { useCallback, useEffect, useReducer, useRef } from 'react'
import { navigateTo } from '../../application/navigateTo'
import { resolveBestPath } from '../../application/resolveBestPath'
import { startRace } from '../../application/startRace'
import {
  NEW_PLAYER,
  recordDailyBest,
  recordRace,
  streakBrokenBy,
  type PlayerRecord,
} from '../../domain/PlayerRecord'
import type { ArticleContent, ArticleReader } from '../../domain/ports/ArticleReader'
import type { PathFinder } from '../../domain/ports/PathFinder'
import type { PlayerStore } from '../../domain/ports/PlayerStore'
import type { RaceGenerator, RaceProgress, RaceRequest } from '../../domain/ports/RaceGenerator'
import { finish, type Race, type RaceOutcome } from '../../domain/Race'

/** What the hook needs from the outside world, named by the consumer that needs it. */
export interface RacePorts {
  readonly generator: RaceGenerator
  readonly reader: ArticleReader
  readonly finder: PathFinder
  readonly records: PlayerStore
}

type RacePhase = 'idle' | 'preparing' | 'racing' | 'finished'

export interface RaceState {
  readonly phase: RacePhase
  readonly race: Race | null
  readonly article: ArticleContent | null
  readonly loadingArticle: boolean
  readonly error: string | null
  readonly bestPath: readonly string[] | null
  readonly resolvingBestPath: boolean
  /** Everything that outlives the session: streaks, totals, today's result. */
  readonly record: PlayerRecord
  /** How long the streak this race just ended was. Worth saying once, then gone. */
  readonly brokenStreak: number | null
  /** How far along the race being built is, or null when nothing is being built. */
  readonly progress: RaceProgress | null
}

export type RaceAction =
  | { type: 'PREPARING' }
  | { type: 'PROGRESS'; progress: RaceProgress }
  | { type: 'STARTED'; race: Race; article: ArticleContent }
  | { type: 'MOVED'; race: Race; article: ArticleContent }
  | { type: 'LOADING_ARTICLE' }
  | { type: 'FAILED'; message: string }
  | { type: 'FINISHED'; race: Race }
  | { type: 'RESOLVING_BEST_PATH' }
  | { type: 'BEST_PATH'; path: readonly string[] }
  | { type: 'HOME' }

export const INITIAL_RACE_STATE: RaceState = {
  phase: 'idle',
  race: null,
  article: null,
  loadingArticle: false,
  error: null,
  bestPath: null,
  resolvingBestPath: false,
  record: NEW_PLAYER,
  brokenStreak: null,
  progress: null,
}

/** What survives leaving a race behind, whether for the menu or for the next one. */
const kept = (state: RaceState) => ({ record: state.record, brokenStreak: null, progress: null })

export function raceReducer(state: RaceState, action: RaceAction): RaceState {
  switch (action.type) {
    // The previous race stays on screen while the next one is built, so asking
    // for another race never bounces the player back to the start menu.
    case 'PREPARING':
      return { ...state, phase: 'preparing', error: null, progress: null }
    case 'PROGRESS':
      return { ...state, progress: action.progress }
    case 'STARTED':
      return {
        ...INITIAL_RACE_STATE,
        ...kept(state),
        phase: 'racing',
        race: action.race,
        article: action.article,
      }
    case 'LOADING_ARTICLE':
      return { ...state, loadingArticle: true, error: null }
    // The record moves on the two actions that can end a race, and only there,
    // so it is counted exactly once no matter how the race finished.
    case 'MOVED':
      return {
        ...state,
        ...applyOutcome(state, action.race),
        phase: action.race.outcome === null ? 'racing' : 'finished',
        race: action.race,
        article: action.article,
        loadingArticle: false,
        error: null,
      }
    case 'FAILED':
      return {
        ...state,
        phase: state.race === null ? 'idle' : state.phase,
        loadingArticle: false,
        error: action.message,
      }
    case 'FINISHED':
      return {
        ...state,
        ...applyOutcome(state, action.race),
        phase: 'finished',
        race: action.race,
        loadingArticle: false,
      }
    case 'RESOLVING_BEST_PATH':
      return { ...state, resolvingBestPath: true }
    // The shortest path lands a moment after the race ended, so today's result
    // gets its minimum here rather than being written incomplete forever.
    case 'BEST_PATH':
      return {
        ...state,
        bestPath: action.path,
        resolvingBestPath: false,
        record:
          state.race?.dayId == null
            ? state.record
            : recordDailyBest(state.record, state.race.dayId, action.path.length - 1),
      }
    // Going back to the menu is navigation, not a result: the record survives it.
    case 'HOME':
      return { ...INITIAL_RACE_STATE, ...kept(state) }
  }
}

/**
 * A race enters the record once, when it stops being unfinished. Both actions
 * that can end one are allowed to arrive, so the guard lives here rather than
 * trusting every caller to check first.
 */
function applyOutcome(state: RaceState, race: Race): Pick<RaceState, 'record' | 'brokenStreak'> {
  const unchanged = { record: state.record, brokenStreak: state.brokenStreak }
  if (race.outcome === null) return unchanged
  if (state.race !== null && state.race.outcome !== null) return unchanged
  return {
    record: recordRace(state.record, race, null),
    brokenStreak: streakBrokenBy(state.record, race.outcome),
  }
}

interface UseRaceOptions {
  readonly jumps: number
  readonly limitMs: number
}

const restore = (store: PlayerStore): RaceState => ({ ...INITIAL_RACE_STATE, record: store.load() })

export function useRace(ports: RacePorts, options: UseRaceOptions) {
  const [state, dispatch] = useReducer(raceReducer, ports.records, restore)
  const abortRef = useRef<AbortController | null>(null)
  /** Guards against a slow response from a race the player already abandoned. */
  const runRef = useRef(0)
  /**
   * The last jump asked for wins. Clicking a second link while the first is
   * still loading used to be dropped in silence, and since the article is
   * replaced wholesale when it arrives, a click aimed at the old page could land
   * on an element that no longer exists. Either way the player just saw a click
   * do nothing.
   */
  const jumpRef = useRef<AbortController | null>(null)
  const jumpSeqRef = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = useCallback(
    async (request: Omit<RaceRequest, 'jumps'>) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      runRef.current += 1
      const run = runRef.current
      const { signal } = controller

      dispatch({ type: 'PREPARING' })
      try {
        const { race, article } = await startRace(
          ports.generator,
          ports.reader,
          { ...request, jumps: options.jumps },
          options.limitMs,
          Date.now,
          {
            signal,
            onProgress: (progress) => {
              if (run === runRef.current) dispatch({ type: 'PROGRESS', progress })
            },
          },
        )
        if (run !== runRef.current) return
        dispatch({ type: 'STARTED', race, article })
      } catch (error) {
        if (run !== runRef.current || signal.aborted) return
        dispatch({ type: 'FAILED', message: messageOf(error) })
      }
    },
    [ports.generator, ports.reader, options.jumps, options.limitMs],
  )

  const navigate = useCallback(
    async (title: string) => {
      const current = state.race
      if (current === null || current.outcome !== null) return

      // Cancelling the previous jump is not just tidiness: every request shares
      // one serialized queue, so an abandoned fetch would keep the new one
      // waiting behind it.
      jumpRef.current?.abort()
      const jump = new AbortController()
      jumpRef.current = jump
      jumpSeqRef.current += 1
      const seq = jumpSeqRef.current
      const run = runRef.current

      const raceSignal = abortRef.current?.signal
      const signal = raceSignal ? AbortSignal.any([raceSignal, jump.signal]) : jump.signal

      dispatch({ type: 'LOADING_ARTICLE' })
      try {
        const next = await navigateTo(ports.reader, current, title, Date.now(), signal)
        if (run !== runRef.current || seq !== jumpSeqRef.current) return
        dispatch({ type: 'MOVED', race: next.race, article: next.article })
      } catch (error) {
        if (run !== runRef.current || seq !== jumpSeqRef.current || signal.aborted) return
        dispatch({ type: 'FAILED', message: messageOf(error) })
      }
    },
    [ports.reader, state.race],
  )

  const stop = useCallback(
    (outcome: Exclude<RaceOutcome, 'won'>) => {
      const current = state.race
      if (current === null || current.outcome !== null) return
      dispatch({ type: 'FINISHED', race: finish(current, outcome, Date.now()) })
    },
    [state.race],
  )

  const giveUp = useCallback(() => {
    stop('surrendered')
  }, [stop])

  const expire = useCallback(() => {
    stop('timeout')
  }, [stop])

  const goHome = useCallback(() => {
    abortRef.current?.abort()
    runRef.current += 1
    dispatch({ type: 'HOME' })
  }, [])

  // Once the race is over, work out the shortest path so the player can compare.
  const { phase, race, bestPath, resolvingBestPath } = state
  useEffect(() => {
    if (phase !== 'finished' || race === null || bestPath !== null || resolvingBestPath) return
    const run = runRef.current
    const signal = abortRef.current?.signal
    dispatch({ type: 'RESOLVING_BEST_PATH' })
    void resolveBestPath(ports.finder, race, signal).then((path) => {
      if (run !== runRef.current) return
      dispatch({ type: 'BEST_PATH', path })
    })
  }, [phase, race, bestPath, resolvingBestPath, ports.finder])

  /**
   * Writing is a side effect, so it happens here and not in the reducer. The ref
   * starts on the record that was just loaded, which is why a fresh session does
   * not immediately write back what it only just read.
   */
  const savedRef = useRef(state.record)
  const { record } = state
  useEffect(() => {
    if (record === savedRef.current) return
    savedRef.current = record
    ports.records.save(record)
  }, [record, ports.records])

  return { state, start, navigate, giveUp, expire, goHome }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo salió mal cargando Wikipedia.'
}
