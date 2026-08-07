import { fractionOf, pickStable, sampleStable } from '../../../shared/deterministic'

/**
 * How a race makes its choices. Every decision that shapes a race — which seed,
 * which link, which candidate endings — goes through one of these, so the whole
 * generator becomes deterministic just by handing it a different one.
 */
export interface RaceChoices {
  fraction(salt: string): number
  pick(items: readonly string[], salt: string): string | undefined
  sample(items: readonly string[], salt: string, size: number): string[]
}

const identity = (title: string) => title

const randomChoices: RaceChoices = {
  fraction: () => Math.random(),
  pick: (items) => items[Math.floor(Math.random() * items.length)],
  sample: (items, _salt, size) => {
    const remaining = [...items]
    const picked: string[] = []
    while (picked.length < size && remaining.length > 0) {
      const [taken] = remaining.splice(Math.floor(Math.random() * remaining.length), 1)
      if (taken !== undefined) picked.push(taken)
    }
    return picked
  },
}

/**
 * Same seed, same race — even if Wikipedia was edited in between, because
 * nothing here picks by position. See `shared/deterministic`.
 */
function seededChoices(seed: string): RaceChoices {
  return {
    fraction: (salt) => fractionOf(`${seed} ${salt}`),
    pick: (items, salt) => pickStable(items, `${seed} ${salt}`, identity),
    sample: (items, salt, size) => sampleStable(items, `${seed} ${salt}`, identity, size),
  }
}

export function choicesFor(seed: string | null): RaceChoices {
  return seed === null ? randomChoices : seededChoices(seed)
}
