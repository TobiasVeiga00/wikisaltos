# Wikisaltos

Te toca un artículo de Wikipedia y un destino. Tenés que llegar de uno al otro
usando solo los enlaces que aparecen dentro del texto. Un jugador, contrarreloj,
todo en el navegador.

## Cómo se juega

- No hay buscador. La única forma de avanzar es hacer clic en un enlace del artículo.
- Tenés 5 minutos.
- El destino siempre está a 3 saltos o menos, así que la carrera nunca es imposible.
- Cuando termina, el juego te muestra por dónde fuiste y cuál era el camino más corto.
- Ganar encadena una **racha**. Se corta al abandonar o al quedarte sin tiempo, pero no
  al volver al menú: eso es navegación, no una derrota.
- Al ganar podés **seguir desde el destino**: la carrera siguiente arranca donde terminó
  la anterior. Si perdés, la cadena se corta junto con la racha.
- Hay un **desafío del día**: la misma carrera para todo el mundo, y un botón para copiar
  tu resultado y compararlo con quien quieras. Se juega **una sola vez por día**.
- El navegador recuerda tus jugadas, tu racha actual y tu mejor racha histórica.

Se puede jugar entero con el teclado: Tab para moverte entre enlaces, Enter para saltar.

## Correrlo

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

```bash
npm run check           # tipos + linter + tests, todo junto
npm run test:integration # comprueba el desafío diario contra la API real
npm run test       # 158 tests
npm run test:watch # tests en modo continuo
npm run lint       # ESLint
npm run format     # Prettier
npm run build      # bundle de producción en dist/
```

No hace falta ninguna API key ni servidor. Todo corre contra la API pública de
Wikipedia desde el navegador.

Necesita un navegador reciente: Chrome 116+, Firefox 124+ o Safari 17.4+. Es por
`AbortSignal.any`, que es lo que evita que un pedido colgado congele la partida.

## Cómo se arma una carrera

Esta es la decisión central del proyecto, así que vale la pena entenderla.

Lo difícil no es navegar entre artículos: es **saber cuál era el camino más corto**
para poder mostrártelo al final. La API pública de Wikipedia no puede responder eso
para dos artículos cualesquiera. Cada artículo tiene unos 300 enlaces, así que buscar
a tres saltos de distancia necesita cientos de pedidos, y Wikipedia corta cuando
detecta ese volumen.

Por eso el juego **genera la carrera a partir de su propia solución**:

1. Elige un artículo conocido de una lista curada.
2. Sigue 3 enlaces reales al azar.
3. Donde cae, ese es el destino.

Con dos reglas más: no repite el origen dentro de las últimas 20 carreras, y descarta
como destino cualquier artículo que ya esté enlazado desde el origen —si no, la
caminata puede volver sobre sus pasos y la carrera se gana en un solo clic.

Eso regala tres cosas:

- La carrera siempre tiene solución, porque el camino se recorrió antes de ofrecértelo.
- Ya se conoce un camino de 3 saltos antes de que arranque el reloj.
- Solo faltan buscar los caminos **más cortos que ese**, y una búsqueda de 2 saltos
  —barata, unos 6 pedidos— es exactamente lo que puede encontrarlos.

Cuando la carrera termina, esa búsqueda corre una sola vez. Si encuentra algo más
corto, gana. Si no encuentra nada, significa que no existe ningún camino de 1 ni de
2 saltos, y entonces el camino generado **era** el más corto. En los dos casos lo que
te muestra es real. Y si Wikipedia limita la búsqueda por exceso de pedidos, el
camino generado sigue siendo una respuesta válida para mostrarte.

## Cómo se elige el destino

Un destino como "Walberto Caicedo" no te dice nada. Por eso pasan dos cosas:

- Antes de fijar el destino, el juego mira una docena de finales posibles y se queda
  con uno que tenga foto y descripción en Wikipedia. Tener foto es la señal más barata
  de que un artículo es conocido: los esbozos casi nunca tienen una.
- El objetivo se muestra con su miniatura y una línea que dice qué es ("país de Asia
  del Sur"). Si el artículo no tiene descripción corta, se usa la primera frase del
  texto en su lugar.

Las carreras arrancan más seguido en cultura argentina que en otra cosa, porque la
lista de artículos iniciales está armada así. Pero tres saltos al azar se van del país
muy seguido, y eso está bien: el juego no promete lo contrario en ninguna pantalla.

## Arquitectura

Hexagonal, organizada por funcionalidad y no por capa técnica.

```
src/race/
  domain/          entidades y reglas — sin React, sin Wikipedia, sin fetch
    Race.ts        la carrera: ganar, perder, el tiempo
    PlayerRecord.ts lo que sobrevive a la sesión: racha, totales, el diario
    ports/         cuatro interfaces chicas, una por responsabilidad
  application/     casos de uso; cada uno depende solo del puerto que usa
  infrastructure/
    storage/
      LocalStoragePlayerStore.ts  el registro en el navegador
    wikipedia/
      WikiGraph.ts               consultar el grafo de enlaces
      WikipediaRaceGenerator.ts  política de juego: semillas, caminata, destino
      WikipediaPathFinder.ts     búsqueda bidireccional acotada
      WikipediaArticleReader.ts  leer y sanear un artículo
      sanitizeArticle.ts         la frontera de seguridad
  ui/              contenedores, hooks y componentes atómicos
  composition/     el único archivo que conecta adaptadores con puertos
```

`domain` no depende de nada. `application` depende solo de `domain`. Cambiar
es.wikipedia por otro idioma, o por un backend con el grafo precalculado, es tocar
`composition/container.ts` y un adaptador.

Los puertos están separados a propósito: quien solo quiere leer un artículo no debería
depender de cómo se genera una carrera. Y el tipo que los agrupa lo declara el consumidor
(`RacePorts`, en `useRace`), no el proveedor.

### Una regla que parece un detalle y no lo es

`ArticleViewer` está envuelto en `React.memo`, y `onNavigate` viene memoizado desde el
contenedor. **No es una micro-optimización: sin eso el juego pierde clics.**

El cronómetro actualiza cinco veces por segundo. Cada actualización re-renderizaba el
visor y reconstruía los veinte mil elementos del artículo. Un clic son un `mousedown` y un `mouseup`, y el navegador solo lo
considera un clic si ambos caen sobre el mismo elemento: si caen a los lados de una
reconstrucción, el clic nunca existe.

Si algún día agregás una prop al visor, tiene que ser estable entre renders.

## Seguridad

`sanitizeArticle` es lo único entre el jugador y HTML de terceros: nada río abajo vuelve
a revisar lo que devuelve. Por eso funciona con **lista blanca**, no con lista negra:

- Solo sobreviven las etiquetas y atributos permitidos. Una etiqueta desconocida no se
  inyecta: se degrada a su texto, conservando los enlaces de adentro.
- Todos los `href` desaparecen, así que la página no puede navegar a ningún lado.
- Los `src` se aceptan solo si apuntan a Wikimedia; los `style` que puedan salir a la red
  se descartan.

La diferencia importa: una lista negra se rompe el día que la fuente cambia. Una lista
blanca falla cerrada.

## Notas sobre la API de Wikipedia

Todo corre contra `es.wikipedia.org/w/api.php`, que manda
`Access-Control-Allow-Origin: *` y no pide credenciales.

**Los pedidos van todos por una cola serializada, separados 250 ms.** Medido contra la
API real: lanzándolos en paralelo, Wikipedia devuelve HTTP 429 a los nueve pedidos;
los mismos pedidos serializados pasaron 10 de 10. El límite reacciona a las ráfagas,
no al volumen sostenido. Si agregás una llamada nueva, tiene que pasar por esa cola.

Cada pedido tiene 15 segundos de plazo, y un 429 se reintenta dos veces con espera
creciente. El plazo no es cosmético: como la cola es una cadena, un pedido que nunca se
resuelve bloquearía todos los siguientes para siempre, sin error y sin forma de salir.

El sanitizador devuelve un elemento ya armado, no texto: pasar HTML como cadena obliga al
navegador a parsear el artículo por segunda vez, y eso medía alrededor de 150 ms de hilo
principal congelado en cada salto, tiempo durante el cual el juego no responde clics.

El HTML del artículo viene de `action=parse` y se limpia antes de insertarlo: se sacan
los scripts, los manejadores de eventos y **todos** los `href` reales, así la página no
puede navegar a ningún lado. Los enlaces a artículos quedan marcados con
`data-wr-title` y los maneja un único listener delegado.

También se eliminan las cajas de mantenimiento (`table.noprint`). No es cosmético: la
caja de "Escucha este artículo" usa la misma clase `infobox_v2` que el infobox real,
flota al lado y deja el texto en una columna de pocas palabras de ancho.

### El truco del token de continuación

`prop=links` devuelve los enlaces **ordenados alfabéticamente** y como máximo 500 por
pedido. Eso quiere decir que pedir la primera página de un artículo grande no da una
muestra de sus enlaces: da el principio del abecedario. "Buenos Aires" tiene 1247
enlaces y la primera página termina en la letra E, así que durante un tiempo el juego
solo podía saltar a artículos de la A a la E.

Paginar hasta el final arregla el sesgo pero cuesta seis pedidos por salto y hace
saltar el límite de Wikipedia. La salida es que el token de continuación tiene un
formato documentado, `pageid|namespace|título`, así que **se puede fabricar en lugar de
esperarlo**: pidiendo `plcontinue=8739|0|M` los enlaces arrancan en la M.

El juego pide entonces la primera página más una rebanada que empieza en una letra al
azar posterior a donde cortó esa página. Dos pedidos, y el segundo siempre trae
artículos que el primero no podía alcanzar.

## El desafío del día

Todos los que juegan un mismo día reciben exactamente la misma carrera, sin backend: se
deriva de la fecha.

El día se ancla a la hora argentina. No a la de quien juega, porque entonces alguien en
Madrid tendría el desafío de mañana mientras acá todavía es hoy; y tampoco a UTC, que
cambia a las nueve de la noche, justo en las horas en que se juega.

La parte difícil no es que sea determinista, es que **siga siendo el mismo si alguien
edita Wikipedia a mitad del día**. Elegir por posición se rompe con la primera edición:
un enlace agregado corre toda la lista y la carrera pasa a ser otra en silencio.

Por eso nada se elige por índice. Gana el título cuyo hash junto con la semilla del día
sea menor, así que agregar o quitar _otros_ elementos nunca cambia al ganador — solo
quitar al ganador mismo. Es la idea detrás del _rendezvous hashing_, y vive en
`shared/deterministic.ts`.

Dos detalles que parecen menores y no lo son: para el desafío del día se desactivan las
memorias de orígenes y destinos recientes, porque el historial de un jugador no puede
cambiar la carrera que recibe todo el mundo; y si Wikipedia limita las peticiones el
generador **falla cerrado**, tira error en lugar de devolver una carrera distinta.

## Encadenar carreras

Ganar deja el destino como origen de la siguiente. Sale casi gratis porque el generador
nunca supo de dónde venía su artículo de partida: la caminata, el filtrado y la elección
del destino trabajan con un título y nada más.

Lo que sí hubo que agregar es un piso. Un destino se elige por **reconocible** — que tenga
foto y descripción — y eso no dice nada sobre cuántos enlaces **salen** de él. Arrancar una
carrera en un callejón sin salida es peor que cortar la cadena, así que un origen encadenado
con menos de 40 enlaces se descarta y se vuelve a una apertura de la lista curada. El
chequeo es gratis: esos enlaces se piden igual en el primer paso.

El desafío del día nunca encadena. Se deriva de la fecha y tiene que ser el mismo para
todos; si dependiera de tu carrera anterior dejaría de serlo.

## La barra al armar una carrera

Armar una carrera son entre seis y ocho viajes a Wikipedia, y un spinner no distingue
"pensando" de "colgado". La barra cuenta **viajes terminados**, nunca tiempo transcurrido.

El detalle que la hace útil está en los reintentos. Cuando el generador cae en un artículo
flaco lo descarta y prueba otro, y eso puede pasar varias veces seguidas — justo el momento
en que un porcentaje fijo se quedaría quieto y parecería trabado. Un viaje que nadie
planeó sube el numerador **y** el denominador a la vez, así que la fracción siempre avanza
(`done` es menor que `total`, entonces `(d+1)/(t+1)` supera a `d/t`) mientras admite que
falta más de lo que se creía. Nunca retrocede, y hay un test que lo fija.

## Qué se guarda, y qué no

Todo vive en `localStorage`, bajo una sola clave. No hay cuentas, no hay servidor y nada
sale de tu navegador. La contra es real y conviene decirla: el registro está atado a **ese
navegador y ese dominio**. Cambiar de máquina, o borrar los datos del sitio, lo borra.

Tres decisiones que no son obvias:

- **El resultado del día se escribe una vez y no se pisa.** Si una segunda vuelta pudiera
  reemplazarlo, el primer intento no significaría nada, y el desafío dejaría de ser un
  desafío.
- **Todo lo que se lee se valida.** El archivo es del jugador y lo puede editar; cualquier
  cosa que no tenga sentido se trata como empezar de cero, no como dato bueno.
- **Escribir puede fallar.** Safari en incógnito y las cookies bloqueadas tiran excepción.
  Se ignora en silencio: perder el registro nunca vale una partida terminada.

El formato lleva un campo `version` desde el día uno. En el momento en que algo se escribe
en la máquina de alguien, es un formato que hay que poder volver a leer para siempre.

Es honor system: nada impide editar los números a mano. Sin backend no hay otra, y para un
juego de un jugador tampoco hace falta.

## Contribuir

Las contribuciones son bienvenidas. Leé [CONTRIBUTING.md](CONTRIBUTING.md) antes de
escribir código: el proyecto tiene convicciones marcadas sobre arquitectura, seguridad y
cómo se le habla a la API, y saberlas de antemano te ahorra rehacer trabajo.

## Licencia

Wikisaltos junta tres cosas con dueños distintos, y [LICENSE.md](LICENSE.md) las separa:

- **El código** está bajo [PolyForm Noncommercial 1.0.0](LICENSE.md). Usalo, estudialo y
  modificalo libremente sin fines comerciales.
- **Los artículos de Wikipedia** no son míos ni están en este repositorio: se piden en
  vivo y pertenecen a quienes los escribieron, bajo
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es).
- **La tipografía Archivo** es de [Omnibus-Type](https://www.omnibus-type.com/), una
  fundición de Buenos Aires, bajo Open Font License.

Este proyecto no está afiliado a la Fundación Wikimedia.
