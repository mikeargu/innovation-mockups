# Tec CEM Smart Campus · mockup móvil

**Estado:** implementación y revisión técnica completadas, 7 de octubre de 2026. Las fases F0–F9 están implementadas (F6 reserva desde el chat, F7–F8 llegada al gimnasio con QR y temporizador); la revisión visual del usuario queda abierta para ajustes posteriores.

Demo local en español para presentar cómo un estudiante descubre y utiliza espacios, recursos y servicios. **Concepto · datos ficticios**: nombres, perfil, matrícula, ubicaciones, horarios, afluencia, requisitos y acciones son ejemplos. El nombre del producto es de trabajo y está sujeto a revisión institucional. Los diagramas no representan planos oficiales del campus.

## Apertura

Abre `index.html` directamente en el navegador, con fuentes e iconos locales. También puede servirse desde esta carpeta:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Después, visitar `http://127.0.0.1:8766/`. La experiencia mantiene el formato de teléfono en pantallas anchas.

Si el servidor se inicia desde la raíz del repositorio `innovation`, usa:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory smart-campus
```

La guía común está en [`../README.md`](../README.md). Para entender los recorridos, los datos de ejemplo y la estructura del código, continúa con este README y `INTEGRATION_GUIDE.md`.

## Recorridos de demostración

1. **Explorar:** mapa/lista, filtros y búsqueda entre nueve módulos. Abrir fichas y guardar favoritos.
2. **Biblioteca:** visualizar salas de 2/4/6/8 personas, elegir fecha y bloque, revisar reglas y confirmar. Abrir la reserva en Mi actividad y cancelarla para liberar el bloque.
3. **Gimnasios:** al llegar, abrir Profesional o PrepaTec y consultar horarios, recursos, requisitos y afluencia estimada. **Registrar asistencia** abre un escaneo simulado del QR de la entrada (también puede probarse el QR del otro gimnasio, que se rechaza). Con la llegada verificada, el formulario autocompletado pide duración y tipo de entrenamiento; **Registrar** inicia el temporizador. **Finalizar entrenamiento** lo termina antes; al llegar a cero termina por tiempo («Demo · simular fin del tiempo» lo muestra sin esperar). Mi actividad indica si la sesión está en curso o finalizada.
4. **Laboratorios:** consultar equipos y requisitos, después abrir el procedimiento de acceso con el área responsable.
5. **Asistente:** pedir «Necesito una sala en la biblioteca el viernes 9 de octubre a las 11:00 para 4 personas» (u otra fecha, hora o grupo de la demo): la respuesta ofrece salas disponibles y **Revisar reserva** abre la reserva prellenada; solo se guarda al confirmar. También hay ejemplos de sala para seis, impresión 3D y gimnasio menos concurrido.
6. **Mi actividad y cuenta:** consultar reservas, asistencias, favoritos e historial. Borrar historial conserva las operaciones; Reiniciar demo y recargar restauran todo el escenario inicial.

## Datos y acciones de ejemplo

El calendario de demostración usa el 7–9 de octubre de 2026. Las estimaciones de afluencia no son datos en vivo. La asistencia no concede autorización de acceso. Los laboratorios y la alberca mantienen la autorización bajo responsabilidad del área correspondiente. El asistente usa respuestas guionadas y ofrece ejemplos cuando no reconoce una consulta.

## Continuidad y comprobaciones

`INTEGRATION_GUIDE.md` contiene las fases, la evidencia técnica y el registro de continuidad. La revisión visual del usuario se registra por separado.

**Resultado:** 63 pruebas Node, 455 comprobaciones de navegador y 108 estados de pantalla/ancho en la auditoría de accesibilidad aprobados. Se revisó foco por teclado en siete recorridos principales. La apertura directa local funciona y el recorrido integral registró cero errores de ejecución o de assets. Hay 22 capturas en `review/` para teléfono y presentación.

```sh
node --test tests/state.test.cjs tests/assistant.test.cjs tests/views.test.cjs
node tests/acceptance.browser.cjs
node tests/accessibility.browser.cjs
```

Las dos comprobaciones de navegador requieren Playwright y Chrome. En este entorno se usó el Playwright ya incluido en el runtime de Codex, mediante `NODE_PATH=/Users/mike_argu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`, y el Chrome instalado. Las pruebas aceptan `SC_CHROMIUM` para otro ejecutable y `SC_URL` para un servidor local; por defecto comprueban `index.html` mediante `file://`. Esta dependencia se usa para comprobar la entrega; abrir la demo no requiere instalación.

**Capturas principales:** `review/390-explore-map.png`, `review/390-library-plan.png`, `review/390-reservation-confirmed.png`, `review/390-gym.png`, `review/390-gym-scan.png`, `review/390-gym-session.png`, `review/390-gym-finished.png`, `review/390-assistant-booking.png`, `review/390-assistant-library.png`, `review/390-activity-favorites.png` y `review/1440-explore.png`. Los resultados completos están en `review/acceptance-results.json` y `review/accessibility-results.json`.

## Organización

- `data.js`: catálogo, cuenta y fechas ficticias; `state.js`: disponibilidad, operaciones y controles de sesión; `demo-ai.js`: respuestas de ejemplo.
- `ui.js`: presentación, escape de texto, fechas y rutas; `views/`: pantallas por recorrido; `app.js`: eventos, navegación, foco y confirmaciones; `styles.css`: sistema visual móvil.
- `CONTRACT.md`: interfaces compartidas entre dominio y pantallas.

Recargar devuelve a Explorar con una sesión limpia, incluso desde una confirmación de reserva. **Reiniciar demo** también restaura la sesión y la pantalla inicial. Las consultas vacías devuelven foco al campo; las respuestas llevan foco al resultado; un escaneo rechazado enfoca su mensaje y, si ya hay una sesión en curso, enlaza a ella. El temporizador solo actualiza su texto cada segundo, sin redibujar la pantalla ni mover el foco.

Assets y licencias: `assets/SOURCES.txt`, `assets/OFL.txt`, `assets/MaterialSymbols-LICENSE.txt`. Las referencias de planificación originales (`smart-campus.md` y `brandstrategy.md`) pertenecen al workspace de origen y no están incluidas en este repositorio.
