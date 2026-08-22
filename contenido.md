# Krone — Notas para hablar del proyecto en entrevista

Este documento no es documentación técnica (para eso está `context.md` y
los `CLAUDE.md`). Es una narrativa pensada para responder la pregunta de
entrevista de "hablame de un proyecto en el que hayas trabajado" — los
retos reales, cómo los resolví, y qué decisiones vale la pena defender si
alguien pregunta "¿por qué lo hiciste así?".

---

## El proyecto en una frase

Krone es una aplicación de finanzas personales de un solo usuario —
ingresos, gastos, deudas y metas de ahorro, con un motor de recurrencia
financiera (mensual, quincenal, semanal) y un dashboard que calcula balance,
alertas y proyecciones en tiempo real. Backend en Express + Prisma +
PostgreSQL, frontend en Next.js 16 con React Query y Recharts.

Lo interesante del proyecto no es el CRUD — eso es lo fácil. Lo interesante
es todo lo que pasa alrededor de "¿cuánto vale esto en términos mensuales?"
cuando el dinero entra y sale en ritmos distintos.

---

## El reto técnico que más me gusta explicar: el plan de ahorro por frecuencia de ingreso

El problema me lo trajo el propio usuario del sistema (yo mismo, usándolo):
tengo un ingreso fuerte semanal, pero una deuda que se paga mensualmente.
¿Cuánto debería apartar de cada pago semanal para no llegar corto el día
que toca pagar la cuota?

La respuesta ingenua es "divide la cuota entre cuatro" — pero eso solo
funciona si *todo* tu ingreso es semanal. En la vida real la gente combina
ingresos: un salario quincenal, un ingreso extra mensual, tal vez algo
semanal. Repartir la cuota de forma pareja entre esas fuentes sin
considerar cuánto pesa cada una en tu ingreso total te da un número que no
tiene relación con tu flujo de caja real.

Lo resolví con lo que en finanzas se llama un *sinking fund* (fondo de
amortización): en vez de inventar una fórmula nueva, me di cuenta de que ya
tenía la pieza que necesitaba. Para resolver la recurrencia (cuánto vale un
ingreso quincenal "en términos mensuales") ya existía una tabla de
multiplicadores — mensual cuenta una vez, quincenal dos veces, semanal
cuatro veces al mes. Esa misma tabla, usada al revés, me daba exactamente
el reparto proporcional que necesitaba:

1. Normalizo cada ingreso activo a su equivalente mensual.
2. Calculo qué porcentaje del ingreso mensual total representa cada
   frecuencia (peso).
3. Ese mismo porcentaje de la cuota de la deuda se le asigna a esa
   frecuencia.
4. Divido esa porción entre cuántas veces al mes llega ese ingreso, para
   saber cuánto apartar *en cada pago individual*.

El resultado: si el 70% de tu ingreso mensual viene de tu sueldo semanal y
el 30% de un ingreso mensual aparte, el sistema te dice "aparta esto cada
semana de tu sueldo, y esto otro cada mes de tu ingreso extra" — y ambos
números, sumados, dan exactamente la cuota completa.

Lo que más me gusta de esta solución es que es **matemática pura, cero
inteligencia artificial, cero heurísticas**. No necesité un modelo para
"sugerir" un monto — necesité entender bien el problema financiero y
reutilizar una estructura de datos que ya existía. Es un buen ejemplo de
que no todo problema que suena a "sugerencia inteligente" necesita IA
detrás; a veces necesita una regla de tres bien pensada.

---

## Modelar recurrencia financiera sin fecha de fin (y sin dolores de cabeza con zonas horarias)

Otro reto fue decidir cómo saber si un ingreso o gasto recurrente "cuenta"
para un mes específico, sin que eso se convirtiera en un infierno de
comparación de fechas. La solución fue reducir cada período a un solo
entero comparable: `year * 12 + month`. Un gasto de marzo 2026 es `24315`;
uno de agosto 2026 es `24320`. Comparar si un registro recurrente "ya
empezó" para un mes dado se vuelve una simple comparación numérica, sin
tocar el objeto `Date` de JavaScript ni preocuparme por husos horarios —
que es una fuente clásica de bugs sutiles en cualquier app financiera (un
registro guardado a medianoche puede aparecer "un día antes" según el huso
horario del servidor).

---

## Migrar un schema en producción sin perder datos reales

Cuando agregué la frecuencia semanal, tuve que tocar dos cosas a la vez: un
nuevo valor de enum (`WEEKLY`) y una columna nueva en la tabla de deudas
que depende de ese enum. La tentación es meter todo en una sola migración.
No lo hice, y por una razón concreta: PostgreSQL no permite usar un valor
de enum recién agregado (`ALTER TYPE ... ADD VALUE`) dentro de la misma
transacción en la que se agregó, y Prisma ejecuta cada migración dentro de
una transacción. Si hubiera puesto ambos cambios en el mismo archivo, la
migración habría fallado a mitad de camino — contra una base de datos que
ya tenía meses de datos reales que el usuario había estado ingresando a
mano.

Separé el cambio en dos migraciones (primero el enum, después la columna) y
además tuve que escribir el SQL de la migración a mano en vez de dejar que
Prisma lo generara automáticamente, porque estaba renombrando una columna
(`monthlyPayment` → `paymentAmount`) y el generador de diffs de Prisma no
detecta renombres — genera un `DROP COLUMN` seguido de un `ADD COLUMN`, lo
que hubiera borrado silenciosamente los datos existentes en esa columna.

---

## Depurar sin poder ver la pantalla

Una situación real durante el proyecto: el usuario reportó que el dashboard
no mostraba datos, justo después de que yo le pasara el enlace de la app.
No tenía acceso al navegador en ese momento (la integración con Chrome no
estaba conectada), así que tuve que descartar capas una por una usando
solo la terminal: confirmé con `curl` que el backend devolvía datos reales
y correctos para el mes actual, revisé que el preflight de CORS respondiera
bien, y verifiqué que el HTML inicial del frontend se sirviera sin errores.
Todo estaba bien — la causa real terminó siendo timing: `next dev` con
Turbopack tarda varios segundos en aceptar la primera conexión después de
arrancar, y el usuario probablemente abrió la pestaña justo en esa ventana.
No era un bug de código, era un problema de "cuándo" preguntar, no de
"qué" preguntar — y sin poder ver el navegador, la única forma de
comprobarlo con confianza fue aislar cada capa por separado en vez de
adivinar.

---

## Un bug de concurrencia real, encontrado leyendo logs

Durante el mismo trabajo de la frecuencia semanal, encontré en los logs del
servidor un error real que había ocurrido minutos antes: `Argument
paymentAmount is missing`. No era un bug que yo estuviera buscando —
apareció como efecto colateral de mi propio proceso de refactor. Lo que
pasó: `tsx watch` recarga el servidor automáticamente cada vez que guardo
un archivo. En el momento en que terminé de renombrar la columna en el
schema de Prisma y regeneré el cliente, todavía no había terminado de
actualizar el controller que la usaba — así que por una fracción de
segundo, el código viejo (que seguía usando el nombre de columna anterior)
corrió contra el cliente de Prisma ya actualizado, que exigía el nombre
nuevo. El resultado fue que una edición real que el usuario intentó hacer
en ese instante exacto falló silenciosamente. No perdió datos — la edición
simplemente no se guardó — pero fue un buen recordatorio de que el
hot-reload no es atómico, y de la importancia de leer los logs después de
un cambio de schema en vez de asumir que "si no hay error ahora, no pasó
nada".

---

## Una decisión de arquitectura menos técnica, pero igual de importante

Cuando llegó el momento de documentar reglas de trabajo para el proyecto,
tenía como referencia los `CLAUDE.md` de dos proyectos anteriores —
completamente distintos en dominio (restaurantes, con WhatsApp, bilingüe,
pagos). La tentación fácil era copiar la estructura completa, incluyendo
arquitectura "ideal" (capas de validación, service layer para todo,
autenticación JWT ya funcionando). No lo hice: documenté el estado *real*
del código de Krone —sin Zod, sin service layer genérico, sin auth activa—
y dejé explícito en qué momento cada una de esas ausencias deja de ser
aceptable (por ejemplo, el día que el backend deje de correr solo en
`localhost`). Prefiero un documento de reglas que describa la verdad y
señale la deuda técnica con honestidad, a uno que imponga un ideal que el
código todavía no cumple — porque ese segundo tipo de documento se vuelve
mentira al segundo día.

---

## Lo que me llevo de este proyecto

Que un problema que suena a "necesito que el sistema me sugiera algo
inteligente" casi siempre tiene una solución determinista si uno entiende
bien la estructura del problema — el plan de ahorro por frecuencia de
ingreso es el ejemplo que más me gusta contar, porque llegó de una
necesidad real, no de un ejercicio académico, y se resolvió con aritmética
que cualquiera puede auditar a mano. Y que mantener un backlog vivo
(`mejoras.md`) con las cosas que faltan, en vez de fingir que un proyecto
está "terminado", es parte del trabajo — no un anexo opcional.
