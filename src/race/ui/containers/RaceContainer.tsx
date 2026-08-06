import { useCallback, useEffect } from 'react'
import { RACE_JUMPS, RACE_LIMIT_MS, wikipediaPorts } from '../../composition/container'
import { elapsedMs, jumps as countJumps } from '../../domain/Race'
import { TimeBar } from '../components/molecules/TimeBar'
import { ArticleViewer } from '../components/organisms/ArticleViewer'
import { RaceHud } from '../components/organisms/RaceHud'
import { ResultPanel } from '../components/organisms/ResultPanel'
import { StartScreen } from '../components/organisms/StartScreen'
import { useCountdown } from '../hooks/useCountdown'
import { useRace } from '../hooks/useRace'

const OPTIONS = { jumps: RACE_JUMPS, limitMs: RACE_LIMIT_MS }

export function RaceContainer() {
  const { state, start, navigate, giveUp, expire, goHome } = useRace(wikipediaPorts, OPTIONS)
  const { phase, race, article, loadingArticle, error, bestPath, resolvingBestPath, streak } = state

  const remaining = useCountdown(race?.startedAt ?? null, OPTIONS.limitMs, race?.finishedAt ?? null)

  // Stable across the countdown's five renders a second, so the memoised article
  // is not rebuilt underneath the player's cursor.
  const handleNavigate = useCallback(
    (title: string) => {
      void navigate(title)
    },
    [navigate],
  )

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
        streak={streak.count}
        onStart={() => void start()}
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
        streak={streak.count}
        onGiveUp={giveUp}
      />

      {error !== null && <p className="race__error">{error}</p>}

      <ArticleViewer article={article} loading={loadingArticle} onNavigate={handleNavigate} />

      {race.outcome !== null && (
        <div className="race__result-backdrop">
          <ResultPanel
            outcome={race.outcome}
            playerPath={race.path}
            bestPath={bestPath}
            resolvingBestPath={resolvingBestPath}
            elapsedMs={elapsedMs(race)}
            streak={streak}
            preparingNext={phase === 'preparing'}
            onPlayAgain={() => void start()}
            onGoHome={goHome}
          />
        </div>
      )}
    </div>
  )
}
