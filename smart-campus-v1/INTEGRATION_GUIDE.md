# Smart Campus · guía de integración

**Fecha:** 8 de octubre de 2026. **Estado:** F0–F10 completadas técnicamente; sin limitaciones técnicas abiertas. **Instrucciones recientes del usuario:** «review the new F6-7-8 and make that 3 fases with subagentes, check the complexity of the task use sonnet 5.5 or opus 5.5» (7 oct, sustituye la instrucción anterior de solo anotar); «fix the known limitations and the review issues» y «update the guide and readme with the results» (8 oct). **Directorio:** `mockups/smart-campus-v1/`.

## Alcance aprobado

Demo local, móvil y en español; Explorar/Asistente/Mi actividad; mapa y planos conceptuales; nueve módulos en catálogo; recorridos completos de biblioteca, gimnasio, laboratorios y asistente; favoritos e historial; cuenta ficticia iniciada; estado en memoria; Poppins/Azul TEC/Material Symbols Rounded; datos y acciones de ejemplo.

Especificación: `../../docs/superpowers/specs/2026-10-07-smart-campus-design.md`. Plan: `../../docs/superpowers/plans/2026-10-07-smart-campus.md`. Referencias: `../../smart-campus.md`, `../../brandstrategy.md`.

## Registro por fase

| Fase | Estado | Evidencia | Siguiente acción |
|---|---|---|---|
| F0 · Base | Completada técnicamente | Diseño/plan, assets y shell; 14 espacios, nueve categorías; 36 pruebas de dominio y cuatro de UI aprobadas; revisiones de especificación y calidad aprobadas. | Disponible para revisión visual. |
| F1 · Explorar | Completada técnicamente | Nueve pines de categoría y lista equivalente; filtros combinados, software y búsqueda sin acentos; checks de equivalencia y persistencia aprobados. | Disponible para revisión visual. |
| F2 · Biblioteca | Completada técnicamente | Cuatro salas y plano; fecha/grupo/bloque, alternativas compartidas, revisión, confirmación y cancelación; liberar y volver a reservar comprobado. | Disponible para revisión visual. |
| F3 · Gimnasios | Completada técnicamente | Profesional/PrepaTec, bloques y recomendaciones; asistencia autocompletada, límite a las 19:00 y duplicados; foco de error y enlace al registro existente comprobados. | Disponible para revisión visual. |
| F4 · Laboratorios/asistente | Completada técnicamente | Equipos, requisitos y procedimiento con área responsable; tres respuestas de ejemplo y acciones que conservan contexto; confirmación explícita y cero operaciones automáticas comprobadas. | Disponible para revisión visual. |
| F5 · Actividad/entrega | Completada técnicamente | Favoritos/historial/operaciones, borrado y reinicio; 376 checks de navegador, 84 estados de accesibilidad, 19 capturas; revisiones cerradas sin hallazgos pendientes. | Disponible para revisión visual. |
| F6 · Reserva en chat | Completada técnicamente · subagente Sonnet 5.5 | Escenario `library-booking`: fecha/hora/grupo interpretados (viernes 9 oct, 11:00, 4 → sala 4); valores ausentes del borrador y fuera de rango explicados; alternativas si no hay sala; «Revisar reserva» prellena sin reservar; `refreshAnswer` evita ofertas obsoletas. 14 pruebas de asistente. | Disponible para revisión visual. |
| F7 · Dominio de llegada | Completada técnicamente · subagente Opus 5.5 | `verifyGymArrival` (QR por gimnasio, ventana de 10 min, un uso), `startGymSession`, `finishGymSession` (manual/tiempo), `syncGymSessions`, presencia; una sola sesión activa (corrige asistencias superpuestas); `registerAttendance` retirado. 41 pruebas de dominio, reloj inyectable. | Disponible para revisión visual. |
| F8 · Cámara/formulario/timer | Completada técnicamente · subagente Opus 5.5 | Gimnasio informativo → Registrar asistencia → escaneo simulado (sin cámara real; QR de otro gimnasio rechazado) → formulario protegido → temporizador (`role=timer`, sin redibujar ni perder foco) → Finalizar / fin por tiempo / control de demo; Mi actividad «En curso»/«Finalizada». | Disponible para revisión visual. |
| F9 · Verificación/entrega | Completada técnicamente · coordinador | Cierre 7 oct: Node 60/60; 441 checks de navegador, 22 capturas, cero errores; 108 estados de accesibilidad y foco en 7 rutas; capturas revisadas; CONTRACT/README actualizados. | Superada por F10. |
| F10 · Correcciones | Completada técnicamente · coordinador (8 oct) | Limitaciones F6–F8 y hallazgos de la revisión corregidos con pruebas: búsqueda con acentos (IME), diálogo de finalizar al terminar el tiempo, caducidad de la llegada en vivo, «Tu reserva», `role="group"`, «1,5 horas», etiqueta de la ficha del gimnasio, insignia «En curso», formateador de hora único. Node 63/63; 455 checks de navegador, 22 capturas, cero errores; 108 estados de accesibilidad. | Revisión visual del usuario. |

## Anotaciones del usuario · 7 de octubre de 2026

**Estado:** implementadas en F6–F8 y verificadas en F9 (antes solo anotadas por indicación del usuario). Decisiones tomadas: escaneo totalmente simulado sin permiso de cámara; ventana de llegada de 10 min y QR de un solo uso; sin control de horario de apertura al llegar (el reloj real varía en presentaciones); control «Demo · simular fin del tiempo» para mostrar el cierre por tiempo; la asistencia ya no se planifica por bloque futuro y el asistente ofrece «Ver gimnasio».

### Caso de uso del chat de IA

- Añadir una consulta como: **«Necesito una sala en la biblioteca el viernes 9 de octubre a las 11:00 para 4 personas»**.
- El chat debe responder con una opción de reserva que respete fecha, hora y cantidad de personas, usando la disponibilidad de las salas.
- Mostrar el resumen de la opción y permitir revisar/confirmar la reserva; la propuesta del chat no debe crearla automáticamente.

### Flujo del gimnasio corregido

1. El estudiante llega al gimnasio **Profesional o PrepaTec** y abre ese gimnasio en la app.
2. La app muestra la información general del gimnasio: horarios, recursos, requisitos y disponibilidad.
3. Una acción **Registrar asistencia** abre la cámara para escanear un **QR en la entrada del gimnasio**. Esta opción fue confirmada por el usuario; en la demo se simulará el escaneo.
4. Después de verificar la llegada, mostrar el formulario con el perfil autocompletado, duración y tipo de entrenamiento.
5. Al pulsar **Registrar**, iniciar un temporizador con la duración elegida.
6. Permitir **Finalizar entrenamiento** antes de que termine el tiempo; al llegar a cero, finalizar la sesión por tiempo.
7. La actividad debe reflejar si la sesión está en curso o finalizada, para representar mejor quién sigue en el gimnasio.

**Objetivo del usuario:** mejorar el control de asistencia y de personas presentes, y evitar registros de asistencia de estudiantes que no estén físicamente en el gimnasio. El escaneo de esta demo es ilustrativo; la validación real de presencia queda como requisito para una implementación institucional.

## Continuidad

- Última acción (8 oct): F10, corrección de las limitaciones F6–F8 y de los hallazgos de la revisión; guía y README actualizados con los resultados.
- Antes (7 oct): implementar F6–F8 con subagentes (F6 Sonnet 5.5; F7 y F8 Opus 5.5) y verificar F9. Copia previa a los cambios: `../../tmp/smart-campus-pre-f6-snapshot-20261007/`.
- Correcciones del 8 de octubre de 2026 (limitaciones F6–F8 y revisión): búsqueda de Explorar actualiza solo resultados y mapa, sin reemplazar el campo (acentos con tecla muerta/IME y teclado móvil intactos); `role="group"` en chips y selector Mapa/Lista; tu propia reserva aparece como «Tu reserva» con enlace (motivo `own-reservation`) y la misma hora en otra sala como «Otra reserva tuya»; formateador de hora único `SCState.formatHour`; el formulario muestra «Quedan mm:ss» y pasa solo a «escanear de nuevo» al expirar; si el tiempo termina con el diálogo de finalizar abierto, el diálogo se cierra y se muestra el cierre por tiempo; ficha del gimnasio: «Ver gimnasio y registrar asistencia»; duraciones con coma decimal («1,5 horas»); insignia «En curso» con punto vivo. Copia previa: `../../tmp/smart-campus-pre-fixes-snapshot-20261008/`.
- Limitaciones conocidas: ninguna abierta de la revisión técnica; queda la revisión visual del usuario.
- Archivos de dominio: `data.js`, `state.js`, `demo-ai.js`; API exacta en `CONTRACT.md`. Pruebas en `tests/state.test.cjs` y `tests/assistant.test.cjs`.
- Archivos de UI: `index.html`, `styles.css`, `ui.js`, `app.js` y seis módulos en `views/`. Pruebas de helpers en `tests/views.test.cjs`.
- Pruebas de navegador: `tests/acceptance.browser.cjs`, `tests/accessibility.browser.cjs`. Reportes/capturas en `review/`.
- Pendientes: revisión visual del usuario de F6–F10. F0–F10 son la entrega actual.
- Workspace sin Git; archivos nuevos en la carpeta de entrega.
- Registro técnico y revisión del usuario son distintos. No marcar «revisado por el usuario» sin feedback explícito.
- Antes de continuar, leer este registro y comprobar los archivos reales. Anotar resultados de pruebas, archivos, pendientes y siguiente punto de entrada después de cada fase.

## Cierre técnico · 8 de octubre de 2026

- **Node (8 oct):** 63/63 aprobadas: dominio 44, asistente 14, helpers UI 5.
- **Navegador (8 oct):** 455 comprobaciones, apertura directa `file://`, cero errores de ejecución o assets, 22 capturas; incluye escaneo, QR equivocado, temporizador sin pérdida de foco, finalizar, fin por tiempo con reloj simulado, reserva desde el chat y reinicio. Nuevas en F10: búsqueda «robótica» con tecla muerta (IME) sin perder el campo ni el foco, grupos anunciados en chips y Mapa/Lista, «Tu reserva» con enlace y «Otra reserva tuya», botón «Ver gimnasio y registrar asistencia», cuenta atrás de la llegada y paso automático a «escanear de nuevo», cierre del diálogo de finalizar al terminar el tiempo sin mensaje contradictorio.
- **Accesibilidad (8 oct):** 108 estados de ruta/ancho; contraste, tamaño de texto, campos de 16 px, objetivos de 44 px, fuente de iconos y estados textuales; foco visible en siete rutas; escáner e indicadores sin animación con movimiento reducido. Sin hallazgos.
- **Históricos:** cierre F0–F5: 40 Node, 376 checks de navegador, 84 estados de accesibilidad, 19 capturas. Cierre F9 (7 oct): 60 Node, 441 checks de navegador, 108 estados de accesibilidad, 22 capturas.
- **Revisiones:** especificación de dominio y UI aprobadas; calidad de dominio y revisión integrada final aprobadas. No hallazgos pendientes.
- **Correcciones verificadas:** alternativas ordenadas por distancia/capacidad/hora y cálculo compartido; campos a 16 px; contraste del plano; foco de radios y confirmaciones; consultas vacías enfocan el campo, respuestas enfocan el resultado, escaneos rechazados y llegada caducada enfocan el error; recargar una confirmación vuelve a Explorar con datos limpios.
- **Feedback del usuario:** aprobación del diseño y solicitud explícita de implementar el plan completo. Aprobación visual final: aún no registrada.
- **Apertura:** `index.html` directo, o servidor local de README. Vista de teléfono centrada en pantalla ancha. Datos y acciones de ejemplo; estado en memoria.
