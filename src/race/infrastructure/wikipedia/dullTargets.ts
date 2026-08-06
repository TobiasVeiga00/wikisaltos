import type { ArticleSummary } from '../../domain/Article'

/**
 * Articles that pass every quality check and still make a miserable target.
 *
 * Identifiers, standards and units of measure are linked from the infobox or
 * the authority-control footer of nearly every article, so a random walk lands
 * on them far more often than their interest deserves. They have a thumbnail
 * and a description, which is why the recognisability filter waves them
 * through. Measured over 149 generated races, the only two targets that came up
 * twice were "International Standard Name Identifier" and "Idioma inglés", and
 * the sample also produced "ISO 639-3" and "Kilómetro cuadrado".
 *
 * Matching on the description rather than the title is deliberate: Wikipedia's
 * short descriptions name the category directly ("unidad de superficie"),
 * whereas titles vary wildly.
 */
const DULL_DESCRIPTION =
  /(identificador|código\s+(iso|de\s+idioma|de\s+país)|norma\s+(iso|internacional)|estándar\s+(iso|internacional)|unidad\s+de\s+(medida|longitud|superficie|masa|volumen|tiempo|energía)|sistema\s+de\s+clasificación|base\s+de\s+datos\s+bibliográfica|catálogo\s+de\s+autoridades)/i

const DULL_TITLE = /^(iso|isbn|issn|doi|orcid|vi?af)\b|identifier\b|^anexo:/i

export function isDullTarget(summary: ArticleSummary): boolean {
  return DULL_TITLE.test(summary.title) || DULL_DESCRIPTION.test(summary.description ?? '')
}
