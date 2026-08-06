# Contribuir a Wikisaltos

¡Gracias por querer aportar! Antes de escribir código, leete esto: el proyecto tiene
algunas convicciones bastante marcadas, y saberlas de antemano te ahorra rehacer trabajo.

## Cómo funciona (importante)

- **No se sube nada directo a `main`.** Hacé un fork, trabajá en una rama y mandá un pull
  request.
- **Una idea por pull request.** Un PR que arregla un bug y de paso reordena tres
  archivos es imposible de revisar y de revertir.
- **Todo tiene que pasar `npm run check`** antes de abrir el PR. Eso corre tipos, linter
  y los 95 tests de una sola vez. Si falla, el PR no se mira.
- El juego tiene una dirección de diseño muy marcada. Si tu aporte la cambia (agregar
  puntajes, sonidos, animaciones, un modo nuevo), **abrí un issue primero** y charlémoslo
  antes de que escribas nada.

## Pasos para contribuir

```bash
# 1. Forkeá el repo y clonalo
git clone https://github.com/TU-USUARIO/wikisaltos.git
cd wikisaltos

# 2. Instalá y verificá que arranca en limpio
npm install
npm run check

# 3. Rama nueva
git checkout -b mi-mejora

# 4. Trabajá, y antes de subir
npm run format
npm run check
```

Después abrí el pull request explicando **qué problema resuelve**, no qué archivos
tocaste — eso ya lo muestra el diff.

## Reglas del código

### La arquitectura no es decorativa

El proyecto es hexagonal y las dependencias apuntan siempre hacia adentro:

- **`domain/` no importa nada.** Ni React, ni `fetch`, ni Wikipedia. Si tu cambio le
  agrega un import a un archivo del dominio, está en el lugar equivocado.
- **`application/` depende solo de `domain/`**, y cada caso de uso recibe únicamente el
  puerto que necesita.
- **`infrastructure/` implementa los puertos**, nunca al revés.

Una regla del juego —cómo se corta una racha, cuándo se gana— va en `domain/`. Una regla
de Wikipedia —cuántos enlaces trae un pedido— va en `infrastructure/`.

### Todo pedido a Wikipedia pasa por la cola

`WikipediaApiClient` serializa las peticiones con 250 ms de separación. **No es
paranoia: está medido.** Lanzando pedidos en paralelo, Wikipedia devuelve HTTP 429 a los
nueve; los mismos serializados pasan diez de diez.

Si agregás una llamada nueva y la sacás por fuera de la cola, vas a romper el juego para
todos los que jueguen seguido, y no lo vas a ver en tu máquina probando una partida.

### Al sanitizador se lo toca con tests

`sanitizeArticleHtml` es lo único entre el jugador y HTML de terceros: su salida va a
`dangerouslySetInnerHTML` y React no la vuelve a revisar.

Funciona con **lista blanca**, no con lista negra. Si necesitás permitir una etiqueta o
un atributo nuevo, agregalo a la lista **y sumá el test que demuestra por qué es seguro**.
Un PR que amplíe la lista blanca sin tests no entra.

### No le saques la memoización al visor del artículo

`ArticleViewer` está envuelto en `React.memo` y recibe `onNavigate` ya memoizado. Parece
prescindible y no lo es: el cronómetro re-renderiza cinco veces por segundo, y sin el
memo React reconstruye el artículo entero cada vez. Como un clic exige que el
`mousedown` y el `mouseup` caigan sobre el mismo elemento, el juego empieza a perder
clics de forma aparentemente aleatoria.

Si le agregás una prop, tiene que ser estable entre renders.

### Medí antes de optimizar

Varias decisiones del proyecto salieron de mediciones contra la API real, no de
intuiciones —y en más de un caso la intuición estaba equivocada por dos órdenes de
magnitud. Si proponés un cambio de rendimiento o de variedad, traé el número.

### Sin dependencias nuevas

React, Vite y las herramientas de desarrollo, nada más. Si creés que hace falta una
librería, abrí un issue explicando qué problema resuelve que no se pueda resolver con lo
que ya hay.

### Detalles que se piden siempre

- **Sin código muerto ni duplicado.** Una exportación que nadie usa es una promesa que
  nadie cumple.
- **Los comentarios explican por qué, no qué.** El código ya dice qué hace.
- **El juego se tiene que poder jugar con teclado.** Los enlaces jugables llevan `role` y
  `tabindex` a propósito; si tocás el visor, probalo con Tab y Enter.
- **Los textos de la interfaz van en español rioplatense**, sin prometer cosas que el
  juego no garantiza. Si el generador puede dar menos de tres saltos, la pantalla dice
  "tres o menos".
- El código, los nombres de variables y los comentarios van **en inglés**.

## Bugs e ideas

Abrí un issue. Para un bug conviene incluir:

- Qué artículo de origen y qué destino te tocaron (salen en el panel del final).
- Qué esperabas y qué pasó.
- Si hay error en la consola del navegador, pegalo.

Como cada carrera se genera al azar, sin el par de artículos es muy difícil reproducir
nada.

Las ideas también son bienvenidas, incluso las que terminen descartadas. En `docs/` hay
un roadmap con lo que está pensado y, más útil todavía, con lo que se decidió **no**
hacer y por qué.

## Licencia de tus contribuciones

El proyecto está bajo [PolyForm Noncommercial 1.0.0](LICENSE.md): cualquiera puede usarlo
y modificarlo sin fines comerciales, y el uso comercial queda reservado al autor.

Al mandar un pull request aceptás que tu aporte se distribuya bajo esa misma licencia, y
le otorgás al autor del proyecto el derecho a usarlo también en un eventual uso
comercial. Conservás la autoría de lo que escribiste y el crédito queda en el historial
de git.

En cristiano: podés aportar tranquilo y tu nombre queda, pero si algún día el juego se
comercializa, no genera una obligación económica hacia vos. Si eso no te cierra, mejor
charlarlo en un issue antes de ponerte a escribir.
