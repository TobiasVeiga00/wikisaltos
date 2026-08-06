const ENDPOINT = 'https://es.wikipedia.org/w/api.php'

/**
 * Wikimedia answers 429 to bursts, not to sustained volume. Measured against
 * es.wikipedia: firing requests in parallel got cut off after ~9 calls, while
 * the same calls serialized 250 ms apart went 10/10 clean. So every request in
 * the app funnels through one throttled queue.
 */
const MIN_GAP_MS = 250

/**
 * Every request goes through one chained queue, so a `fetch` that never settles
 * would block every request behind it — permanently, with no error and no way
 * back except reloading the page. The deadline is what keeps one bad connection
 * from freezing the whole game.
 */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * Wikimedia's limiter clears on its own after a few seconds, so a 429 is a pause
 * rather than a failure. Retrying turns what used to be a dead end with an error
 * message into a slightly slower race the player never notices.
 */
const RATE_LIMIT_RETRIES = 2
const RATE_LIMIT_BACKOFF_MS = 2_500

interface ApiParams {
  readonly [key: string]: string | number
}

export class WikipediaApiClient {
  private queue: Promise<unknown> = Promise.resolve()
  private lastCallAt = 0

  request<T>(params: ApiParams, signal?: AbortSignal): Promise<T> {
    const run = () => this.execute<T>(params, signal)
    const result = this.queue.then(run, run)
    // Keep the chain alive even when a call rejects, otherwise one failure
    // would poison every later request.
    this.queue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  private async execute<T>(params: ApiParams, signal?: AbortSignal, attempt = 0): Promise<T> {
    const gap = Date.now() - this.lastCallAt
    if (gap < MIN_GAP_MS) await delay(MIN_GAP_MS - gap, signal)
    this.lastCallAt = Date.now()

    const url = new URL(ENDPOINT)
    const merged: ApiParams = { format: 'json', formatversion: 2, origin: '*', ...params }
    for (const [key, value] of Object.entries(merged)) {
      url.searchParams.set(key, String(value))
    }

    const deadline = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    const response = await fetch(url, {
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
    }).catch((cause: unknown) => {
      if (deadline.aborted) throw new Error('Wikipedia tardó demasiado en responder.')
      throw cause
    })

    if (response.status === 429) {
      if (attempt >= RATE_LIMIT_RETRIES) {
        throw new Error('Wikipedia está limitando las peticiones. Probá de nuevo en un momento.')
      }
      await delay(RATE_LIMIT_BACKOFF_MS * (attempt + 1), signal)
      return this.execute<T>(params, signal, attempt + 1)
    }
    if (!response.ok) throw new Error(`Wikipedia respondió ${response.status}`)

    const body = (await response.json()) as T & { error?: { info?: string } }
    if (body.error) throw new Error(body.error.info ?? 'Error de la API de Wikipedia')
    return body
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal))
      return
    }
    const onAbort = () => {
      window.clearTimeout(id)
      reject(abortReason(signal))
    }
    const id = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** An abort without a reason would reject with `undefined` and lose the cause. */
function abortReason(signal?: AbortSignal): Error {
  const reason: unknown = signal?.reason
  return reason instanceof Error ? reason : new DOMException('Cancelado', 'AbortError')
}
