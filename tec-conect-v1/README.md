# Tec Conect by CEM · prototipo conceptual

Demo responsive en español de **Campus Pulse**, **Talent Network**, **Mentor Match** y **Mi perfil**. Es un concepto: nombres, perfiles, publicaciones, empresas, materias, profesores, disponibilidad y solicitudes son ficticios. «Tec Conect by CEM» es un nombre de trabajo de una propuesta estudiantil, sujeto a revisión institucional; no representa un producto, logotipo ni aval oficial del Tecnológico de Monterrey.

## Estado de la entrega

La guía [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) recoge el alcance, las fases, los checkpoints y el registro para continuar en otra sesión. El [CHANGELOG.md](CHANGELOG.md) resume los cambios.

- **F0–F5 revisadas y completadas** (guía y alcance; perfil y preferencias; dashboard de Campus Pulse; registro, calendario y postulación; asistente de equipos; orientación académica y red de apoyo).
- **F5A y F6 revisadas y completadas** (intereses de Pulse separados por Eventos, Lecturas y Oportunidades; regresión, accesibilidad, marca y entrega). Todos los checkpoints están revisados y cerrados. Confirmación final del usuario el 6 de octubre de 2026: «marcalo como revisadas y completadas». El mockup queda entregado, sin pendientes de integración.

## Abrir

Abre `index.html` con doble clic: funciona como archivo local, sin instalación, backend ni conexión a Internet (fuentes, iconos y arte conceptual están incluidos). También puedes servir la carpeta:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

y visitar `http://127.0.0.1:8765/`. **Reiniciar demo** o recargar la página restauran los datos de ejemplo; todo vive en memoria.

Si el servidor se inicia desde la raíz del repositorio `innovation`, usa:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory tec-conect-v1
```

La guía común está en [`../README.md`](../README.md). Este README detalla los recorridos, el alcance del prototipo y las pruebas; `INTEGRATION_GUIDE.md` conserva el registro técnico de sus fases.

## Recorridos de demo

1. **Campus Pulse:** cambia entre **Para ti** y **Todo el campus**. El dashboard tiene Eventos y talleres, Artículos, Oportunidades CVDP y Mis guardados, con orden y visibilidad configurables. Hay 20 publicaciones de ejemplo (9 eventos/talleres, 7 artículos y 4 prácticas). En un evento: **Registrarme** → revisar perfil → **Confirmar registro**, y **Agregar a mi calendario** descarga un `.ics` de ejemplo sin registrarte. En la práctica de análisis financiero: **Postúlate** → escribir interés → confirmar. Los artículos y prácticas muestran resumen y enlazan a una fuente local completa.
2. **Preferencias (F5A):** en Mi perfil → Preferencias elige por separado **Eventos y talleres que me interesan**, **Temas que me gusta leer** y **Áreas donde busco oportunidades**. Caso de revisión: IA en Eventos, Psicología en Lecturas y Finanzas en Oportunidades → **Guardar preferencias** → Campus Pulse prioriza el artículo de Psicología y recomienda solo prácticas de Finanzas (incluida una de Finanzas en un centro de bienestar: cuenta el área del puesto, no el sector). Cada recomendación indica su grupo.
3. **Talent Network:** el asistente está arriba. Toca el chip «Startup de geles para correr» y **Encontrar mi equipo**: verás personas por rol (Marketing, Finanzas, Diseño / desarrollo web) con habilidades, evidencia, razón y disponibilidad declarada, sin rankings. También hay ejemplos de hackathon y de app para el campus. Debajo, el directorio «Personas para descubrir» con búsqueda y filtro; **Ver perfil** y **Enviar solicitud de contacto** simulan una solicitud pendiente.
4. **Mentor Match:** el asistente usa carrera y semestre del perfil. Toca «Finanzas → mercado bursátil mexicano» y **Explorar mi ruta** para ver una ruta de ejemplo en seis secciones (meta, etapas, materias, profesores, intercambio o concentración y siguiente conversación). Debajo está la red de apoyo: mentoría institucional asignada y director de Finanzas siempre visibles, profesores que puedes fijar o quitar, y un explorador de profesores. **Solicitar orientación** simula una solicitud pendiente.
5. **Mi perfil:** abre el avatar, edita descripción, proyectos, habilidades, contacto y visibilidad. El contacto es privado por defecto y nunca aparece en tarjetas públicas; con colaboración y descubrimiento activos, tu perfil aparece en Talent como «Tu perfil».

Los formularios rechazan texto vacío; cada persona, actividad o vacante admite una sola solicitud, registro o postulación por sesión, y repetir muestra el estado existente. Los borradores sobreviven a la navegación y al cambio de tamaño; **Guardar** confirma y **Cancelar** descarta. Nada de lo simulado sale del prototipo.

## Vistas y rutas

Rutas hash: `#/pulse`, `#/pulse/:id`, `#/pulse/:id/register`, `#/pulse/:id/apply`, `#/talent`, `#/talent/:id`, `#/talent/:id/contact`, `#/mentor`, `#/mentor/plan`, `#/mentor/:id`, `#/mentor/:id/request`, `#/profile`, `#/profile/edit` y `#/profile/preferences`. Una ruta desconocida vuelve a Pulse y lo anuncia. Teléfono: una columna y navegación inferior; tablet: dos columnas; escritorio: barra lateral, tres columnas para explorar y lista lateral en detalles.

## Accesibilidad y marca

- Contraste AA en texto y placeholders, objetivos táctiles de 44 px, foco visible, texto de 12 px o más, estados con icono y texto, anuncios para lectores de pantalla (`#live`) y foco gestionado tras cada acción. En teléfonos los campos usan 16 px para evitar el zoom de iOS.
- Poppins, Azul TEC `#0039A6` como ancla (morado en Talent y naranja en Mentor como acentos), Material Symbols Rounded, radios 4/8/12/24 px y marcador «Concepto · datos ficticios» en todas las vistas.

## Validación local

Pruebas Node (165):

```sh
node --test tests/state.test.cjs tests/profile.test.cjs tests/profile-view.test.cjs tests/pulse-content.test.cjs tests/pulse-state.test.cjs tests/f3-state.test.cjs tests/calendar.test.cjs tests/pulse-actions-view.test.cjs tests/demo-ai.test.cjs tests/f4-state.test.cjs tests/talent-view.test.cjs tests/career-ai.test.cjs tests/f5-state.test.cjs tests/mentor-view.test.cjs tests/brand.test.cjs tests/f6-hardening.test.cjs tests/f5a.test.cjs
```

Pruebas de navegador, con el servidor activo y Playwright disponible para Node:

```sh
node tests/browser.test.cjs
node tests/f1.browser.test.cjs
node tests/f2.browser.test.cjs
node tests/f3.browser.test.cjs
node tests/f4.browser.test.cjs
node tests/f5.browser.test.cjs
node tests/f6.browser.test.cjs
node tests/layout.test.cjs
node tests/a11y.audit.test.cjs
```

`TEC_URL` permite otra dirección local y `TEC_CHROMIUM` un ejecutable Chromium existente (útil si la copia de Playwright no coincide con su versión). Playwright solo se usa en las pruebas, no en la aplicación.

**Resultados de la entrega (F6):** 165 pruebas Node; navegador 107 heredadas, 109 F1, 97 F2, 145 F3, 131 F4, 163 F5 y 73 del recorrido integral F6 (los cuatro espacios, el caso F5A, teclado, persistencia y recarga); 108 comprobaciones de ruta/ancho/fuente a 360, 390, 430, 768, 1024 y 1440 px con apertura local y cero overflow; auditoría de accesibilidad y marca sin hallazgos en 44 estados de página. Los resultados de fases anteriores están en la guía.

## Galería

`review/final-390-*.png` y `review/final-1440-*.png`: Pulse, evento, registro confirmado, práctica, asistente de Talent, perfil de Talent, Mentor Match, ruta de Mentor, Mi perfil, Preferencias, fuente de artículo, preferencias por grupos y el caso Lecturas/Oportunidades. Las capturas por fase siguen en `review/`.

## Archivos

- `data.js`: contenido de ejemplo. `state.js`: estado y lógica, exportable a Node. `demo-ai.js`: respuestas deterministas de los asistentes. `calendar.js`: exportación `.ics`. `ui.js`: escape, iconos y enlaces seguros.
- `views/profile.js`, `views/pulse.js`, `views/pulse-actions.js`, `views/talent.js`, `views/mentor.js`: renderizadores por área. `app.js`: rutas, eventos delegados, foco y scroll.
- `styles.css` (base) y `profile.css`, `pulse.css`, `talent.css`, `mentor.css` (componentes por área). `demo-source.html`/`demo-source.js`: fuentes locales de artículos y prácticas.

## Limitaciones conocidas

Es un mockup en memoria: no guarda datos entre recargas ni envía nada. El manejador de clics de `app.js` concentra muchas acciones; las tarjetas de Talent y el perfil/solicitud de Mentor siguen en `app.js`; la fecha del encabezado está escrita a mano. Los asistentes solo reconocen sus ejemplos y, para otras consultas, ofrecen esos ejemplos en lugar de inventar recomendaciones.

Las referencias de planificación originales (`brandstrategy.md` y `talent-network.md`) pertenecen al workspace de origen y no están incluidas en este repositorio. Fuentes y licencias están en `assets/`.
