export interface PathFinder {
  /**
   * The shortest route between two articles, or null when none is short enough
   * to find. Implementations are expected to be bounded: an exhaustive search of
   * Wikipedia's link graph is not something a player can wait for.
   */
  findShortPath(
    origin: string,
    target: string,
    signal?: AbortSignal,
  ): Promise<readonly string[] | null>
}
