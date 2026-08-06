import { titleKey } from './titles'

/**
 * A fixed-size memory of the last titles used, so a session does not serve the
 * same one twice in a row. Origins and endings both need it, and writing the
 * push-and-drop twice would be two places to get the bound wrong.
 */
export class RecentTitles {
  private readonly keys: string[] = []

  constructor(private readonly capacity: number) {}

  remember(title: string): void {
    this.keys.push(titleKey(title))
    if (this.keys.length > this.capacity) this.keys.shift()
  }

  has(title: string): boolean {
    return this.keys.includes(titleKey(title))
  }
}
