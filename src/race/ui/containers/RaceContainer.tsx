import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { RACE_JUMPS, RACE_LIMIT_MS, wikipediaPorts } from '../../composition/container'
import { dayIdAt } from '../../domain/DailyChallenge'
import { dailyResultFor } from '../../domain/PlayerRecord'
import { elapsedMs, jumps as countJumps } from '../../domain/Race'
import { TimeBar } from '../components/molecules/TimeBar'
import { ArticleViewer } from '../components/organisms/ArticleViewer'
import { RaceHud } from '../components/organisms/RaceHud'
import { ResultPanel } from '../components/organisms/ResultPanel'
import { StartScreen } from '../components/organisms/StartScreen'
import { useCountdown } from '../hooks/useCountdown'
import { useRace } from '../hooks/useRace'

const OPTIONS = { jumps: RACE_JUMPS, limitMs: RACE_LIMIT_MS }

/**
 * The calendar is an external, mutable source, and this is the hook React
 * provides for reading one. There is nothing to subscribe to: the value changes
 * once a day, and the snapshot is a string, so React compares it by value and
 * only re-renders on the day it actually changes.
 */
const noSubscription = () => () => undefined
const readToday = () => dayIdAt(Date.now())

export function RaceContainer() {
  const { state, start, navigate, giveUp, expire, goHome } = useRace(wikipediaPorts, OPTIONS)
  const { phase, race, article, loadingArticle, error, bestPath, resolvingBestPath } = state
  const { record, brokenStreak } = state

  const remaining = useCountdown(race?.startedAt ?? null, OPTIONS.limitMs, race?.finishedAt ?? null)

  // Stable across the countdown's five renders a second, so the memoised article
  // is not rebuilt underneath the player's cursor.
  const handleNavigate = useCallback(
    (title: string) => {
      void navigate(title)
    },
    [navigate],
  )

  const today = useSyncExternalStore(noSubscription, readToday)

  const startDaily = useCallback(() => {
    void start(readToday())
  }, [start])

  const startRandom = useCallback(() => {
    void start(null)
  }, [start])

  useEffect(() => {
    if (phase === 'racing' && remaining === 0) expire()
  }, [phase, remaining, expire])

  // Only the very first race goes through the start screen. Later ones are
  // built while the finished race is still on screen.
  if (race === null || article === null) {
    return (
      <StartScreen
        preparing={phase === 'preparing'}
        error={error}
        jumps={OPTIONS.jumps}
        limitMs={OPTIONS.limitMs}
        record={record}
        dailyResult={dailyResultFor(record, today)}
        dayId={today}
        onStartDaily={startDaily}
        onStartRandom={startRandom}
      />
    )
  }

  return (
    <div className="race">
      <TimeBar remainingMs={remaining} limitMs={OPTIONS.limitMs} />

      <RaceHud
        target={race.target}
        path={race.path}
        jumps={countJumps(race)}
        remainingMs={remaining}
        streak={record.streak}
        dayId={race.dayId}
        onGiveUp={giveUp}
      />

      {error !== null && <p className="race__error">{error}</p>}

      <ArticleViewer article={article} loading={loadingArticle} onNavigate={handleNavigate} />

      {race.outcome !== null && (
        <div className="race__result-backdrop">
          <ResultPanel
            race={race}
            bestPath={bestPath}
            resolvingBestPath={resolvingBestPath}
            elapsedMs={elapsedMs(race)}
            streak={record.streak}
            bestStreak={record.bestStreak}
            brokenStreak={brokenStreak}
            preparingNext={phase === 'preparing'}
            onPlayAgain={startRandom}
            onGoHome={goHome}
          />
        </div>
      )}
    </div>
  )
}
