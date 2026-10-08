# Registro de cambios — Tec Conect

## 6 de octubre de 2026 — Revisión final confirmada; todas las fases revisadas y completadas

- Revisión final de la entrega: 165 pruebas Node, 73 comprobaciones del recorrido integral F6 y 108 comprobaciones responsive aprobadas; auditoría de accesibilidad y marca en 44 estados de página sin hallazgos.
- Todas las fases (F0–F6, incluida F5A) marcadas como **revisadas y completadas** y todos los checkpoints como revisados y cerrados, según la confirmación del usuario «marcalo como revisadas y completadas».
- Corregida la frase desactualizada de F5A en la guía que todavía mencionaba CP5A y CP6 pendientes. Guía, README y continuidad sincronizados con el cierre final.
- Pendientes de integración: ninguno.

## 6 de octubre de 2026 — CP5A y CP6 cerrados; entrega completada

- **CP5A y CP6 de producto:** cerrados con el feedback del usuario «F5A and F6 correct, close CP5A and CP6», sin ajustes pedidos.
- Todas las fases (F0–F6, incluida F5A) y sus checkpoints están cerrados. Guía, README y este registro reflejan el estado final.

## 6 de octubre de 2026 — F5/CP5 completados; F5A y F6 integradas, CP5A y CP6 técnicos aprobados

### F5A — Intereses de Pulse por tipo de contenido

- Preferencias con tres grupos independientes: **Eventos y talleres que me interesan**, **Temas que me gusta leer** y **Áreas donde busco oportunidades** (`pulsePreferences.topicsByCategory`). La cuenta de ejemplo empieza con Finanzas, IA y Emprendimiento en Eventos y Lecturas, y Finanzas en Oportunidades. `migratePulsePreferences` convierte una lista única sin copiar intereses de lectura a áreas laborales.
- Las prácticas tienen `professionalAreaIds`; las oportunidades recomendadas usan solo esas áreas (no los temas de lectura o eventos ni el sector de la empresa). En «Para ti», si no hay ofertas en las áreas elegidas aparecen **Ver todas las oportunidades** y **Editar mis áreas**; un grupo vacío muestra contenido general con un acceso para configurarlo. Las razones indican el grupo.
- Contenido nuevo: tema **Psicología**, artículo ficticio «Cómo aprende tu mente: atención, descanso y memoria» y práctica «Practicante de finanzas · Mente Clara» (Finanzas en un centro de bienestar). Pulse pasa a 20 publicaciones.
- Mi perfil resume cada grupo por separado; la ficha de cada práctica aclara que coincidir no confirma elegibilidad.

### F6 — Integración, regresión y entrega

- **Accesibilidad:** texto mínimo de 12 px en todo el sitio; contraste corregido en chip de concepto, etiqueta de portada, placeholder e icono de búsqueda; anillo de foco del buscador y objetivos de 44 px; campos de 16 px en teléfonos; toast visual sin anuncio doble; foco en el título tras **Reiniciar demo**.
- **Marca:** radios en escala 4/8/12/24 px; SemiBold justificado para controles y etiquetas; pie de página con «nombre de trabajo sujeto a revisión institucional».
- **Robustez:** rutas con nombres internos (`#/constructor`, `#/__proto__`) vuelven a Pulse en lugar de fallar.
- **Mentor Match:** el filtro del explorador ofrece solo temas de profesores; textos «mentoría» actualizados; estado «Fijado en tu red» junto a la acción; Público/Privado con icono.
- **Pruebas nuevas:** `a11y.audit` (44 estados de página), `brand`, `f6-hardening`, `f5a` y `f6.browser` (recorrido integral con el caso Finanzas / Psicología). Varias suites derivan sus recuentos de los datos; las que dependían de la lista única de temas se actualizaron al contrato de tres grupos.
- **Verificación:** 165 pruebas Node; navegador 107, 109, 97, 145, 131, 163 y 73; 108 de layout; auditoría sin hallazgos. Dos revisiones independientes con sus hallazgos corregidos o documentados.
- **README** reescrito como documento de entrega; galería final en `review/final-*.png`.
- **CP5 de producto:** cerrado con «F5 correct, continue with F6». F5A se integró dentro de la pasada de F6; CP5A y CP6 de producto quedan pendientes.

## 6 de octubre de 2026 — F4/CP4 completados; F5 integrada, CP5 técnico aprobado

### F5 — Orientación académica y red de apoyo en Mentor Match

- `#/mentor` empieza con el asistente de orientación: carrera y semestre del perfil, meta editable (hasta 600 caracteres), chip «Finanzas → mercado bursátil mexicano» y **Explorar mi ruta**. Debajo están la red de apoyo y el explorador de profesores con filtro por tema.
- Una meta reconocida abre `#/mentor/plan` con seis secciones: meta y punto de partida, ruta en cuatro etapas (fundamentos, exploración, especialización y preparación profesional), materias de ejemplo, profesores para conversar, intercambio o concentración y siguiente conversación. Todo se rotula como ejemplo de orientación: no inscribe materias, no resuelve equivalencias ni gestiona intercambios.
- Intercambio y concentración siguen visibles; elegir una marca «Opción que estás explorando» y muestra qué revisar con el director. La meta se conserva al volver.
- Red de apoyo: Elena Cruz como mentoría institucional asignada y Rodrigo Navarro como Director de Finanzas, siempre visibles y sin control para quitarlos; profesores fijados (Paula Ortiz, Gabriel Soto) se añaden o quitan desde la ruta o el explorador, sin duplicados.
- Fichas, perfiles y solicitudes usan **Solicitar orientación** y el rol real. La orientación no cambia solicitudes ni registros.
- Archivos de producto: editados `data.js` (roles `supportRole`), `demo-ai.js`, `state.js`, `app.js`, `index.html`; añadidos `views/mentor.js` y `mentor.css`. Pruebas nuevas `career-ai`, `f5-state`, `mentor-view` y `f5.browser`; actualizadas por especificación `browser.test.cjs` (tema «Estadística aplicada» y «Solicitar orientación»), `profile.test.cjs` (forma inicial de `careerAssistant`) y `layout.test.cjs` (`#/mentor/plan`).
- **Verificación:** 140 pruebas Node; 163 comprobaciones UI F5 (390/1440 px); 131 F4; 145 F3; 109 F1; 107 heredadas; 97 F2; 108 de ruta/ancho/fuente. Cero errores de ejecución y cero overflow.
- **Revisión independiente:** sin hallazgos críticos ni altos; corregidos texto heredado menor de 12 px, botones de fijar que cambiaban de texto con `aria-pressed`, carrera y semestre desactualizados en la ruta tras editar el perfil, y salto de encabezado en las fichas de profesores.
- **Capturas:** `review/390-f5-mentor-*.png` y `review/1440-f5-mentor-*.png`.
- **CP4 de producto:** cerrado; el usuario pidió sustituir el ejemplo de agua por otro (se añadió «App para el campus») y respondió «F4 correct, continue with F5».

## 6 de octubre de 2026 — F3/CP3 completados; F4 integrada, CP4 técnico aprobado

### F4 — Asistente de equipos en Talent Network

- Bloque nuevo al comienzo de `#/talent`, antes del directorio: textarea (hasta 600 caracteres), botón **Encontrar mi equipo** y tres chips de consultas de ejemplo que llenan el campo sin responder. El directorio, su búsqueda y su filtro siguen debajo, ahora bajo el encabezado «Personas para descubrir».
- Tres escenarios deterministas y locales (`demo-ai.js`): startup de geles para correr (Marketing, Finanzas, Diseño / desarrollo web), equipo para un hackathon y app para el campus (Desarrollo de la app, Seguridad y privacidad, Investigación con estudiantes). Cada rol muestra hasta dos personas con habilidades coincidentes, evidencia del perfil, razón y disponibilidad declarada por separado; sin rankings ni porcentajes. Se indica la consulta respondida y «Respuesta de ejemplo».
- Una consulta que no nombra un escenario, o que nombra varios, ofrece los tres escenarios y no genera recomendaciones. Consulta vacía muestra un error accesible con foco en el campo. El perfil propio nunca se recomienda.
- **Ver perfil** abre el perfil existente; **Explorar personas con {habilidad}** fija el filtro de habilidad y limpia una búsqueda previa. Las solicitudes de contacto no cambian y las tarjetas muestran «Pendiente de aceptación».
- La consulta y el resultado sobreviven a navegación y resize; limpiar la búsqueda del directorio no los borra; **Reiniciar demo** los restaura.
- Archivos de producto: editados `state.js`, `app.js`, `index.html`; añadidos `demo-ai.js`, `views/talent.js` y `talent.css`. Pruebas nuevas `demo-ai`, `f4-state`, `talent-view` y `f4.browser`.
- **Cambio solicitado por el usuario:** se retiró el ejemplo «Proyecto de agua y sostenibilidad» y se añadió «App para el campus» (reservar espacios de estudio), que incorpora Ciberseguridad y recomienda a Mateo Salas. Una consulta sobre agua/sostenibilidad ahora ofrece los tres escenarios disponibles.
- **Verificación:** 106 pruebas Node; 131 comprobaciones UI F4 (390/1440 px); 145 F3; 109 F1; 107 heredadas; 97 F2; 102 de ruta/ancho/fuente. Cero errores de ejecución y cero overflow.
- **Revisión independiente:** sin hallazgos críticos. Su hallazgo alto (el desplazamiento tras el envío podía quedar anulado por la restauración de scroll) estaba corregido con `afterRestore` y verificado con aserciones de posición; también se corrigieron reconocimiento ambiguo, directorio vacío al explorar, etiqueta de consulta, habilidades exclusivas del perfil propio y texto pequeño de bajo contraste.
- **Capturas:** `review/390-f4-talent-*.png` y `review/1440-f4-talent-*.png`.
- **CP3 de producto:** cerrado; el usuario respondió «F3 correct, continue with F4».

## 6 de octubre de 2026 — F3 integrada, CP3 técnico aprobado

### F3 — Registro, calendario y postulación

- Rutas nuevas `#/pulse/:id/register` (eventos y talleres) y `#/pulse/:id/apply` (prácticas con flujo local), validadas por tipo; el resto recupera hacia Pulse.
- **Registro:** revisión de datos del perfil confirmado → confirmar → «Registro simulado». Repetir muestra el registro existente; la confirmación queda visible desde arriba con foco en el encabezado.
- **Calendario:** **Agregar a mi calendario** descarga un `.ics` (CRLF, líneas plegadas a 75 octetos, escape de texto, UID estable, `[EJEMPLO]` en el título, horas UTC). Es independiente del registro y de guardar; las horas sin zona se rechazan.
- **Postulación:** solo `practica-finanzas` usa el flujo local (**Postúlate**: revisar perfil, escribir interés de hasta 1,200 caracteres, confirmar → «Postulación simulada enviada»). Las tres prácticas conservan **Saber más** y abrir una fuente no registra nada.
- Estados visibles con icono y texto en tarjetas, detalle y confirmaciones; borradores de postulación sobreviven a navegación y resize; **Reiniciar demo** limpia registros, postulaciones y borradores.
- Archivos de producto: editados `data.js`, `state.js`, `app.js`, `index.html`, `pulse.css`, `views/pulse.js`; añadidos `calendar.js` y `views/pulse-actions.js`. Pruebas nuevas `f3-state`, `calendar`, `pulse-actions-view` y `f3.browser`; `layout.test.cjs` suma las dos rutas nuevas.
- **Verificación:** 74 pruebas Node; 145 comprobaciones UI F3 (390/1440 px); 109 UI F1; 107 UI heredadas; 97 UI F2; 102 comprobaciones de ruta/ancho/fuente. Cero errores de ejecución y cero overflow.
- **Revisión independiente:** sin hallazgos críticos ni altos; corregidas seis observaciones (desplazamiento al campo inválido, retraso al revocar el Blob, límite de 1,200 caracteres, horas sin zona, insignias sin región viva duplicada, y `DTSTAMP` determinista documentado como decisión de demo).
- **Capturas:** `review/390-f3-*.png` y `review/1440-f3-*.png`.
- **CP2 de producto:** cerrado; el usuario pidió continuar con F3 sin ajustes.

## 6 de octubre de 2026 — F1/CP1 completados; F2 integrada, CP2 técnico aprobado

### F1 — Perfil, preferencias y CP1

- Se editaron `state.js`, `app.js` e `index.html`; se añadieron `ui.js`, `views/profile.js` y `profile.css`, además de pruebas de perfil y preferencias.
- Se añadieron las rutas propias `#/profile`, `#/profile/edit` y `#/profile/preferences`, accesibles desde la cuenta.
- Perfil confirmado y borradores son independientes. Los borradores sobreviven a navegación y resize; guardar confirma, cancelar descarta y reiniciar restaura los datos iniciales.
- Proyectos y habilidades admiten alta, edición y eliminación. El contacto tiene visibilidad por campo, es privado por defecto y los enlaces se validan para HTTP(S).
- El perfil aparece en Talent Network solo cuando están activos descubrimiento y colaboración. La proyección pública no ofrece una solicitud de contacto al perfil propio y omite del DOM los campos de contacto marcados como privados; los campos marcados públicos sí pueden mostrarse.
- Se guardan temas y preferencias. El nombre e iniciales de la cuenta derivan del perfil confirmado.
- Un filtro de Talent que apunta a una habilidad que ya no existe se reconcilia con «Todas las habilidades»; filtros válidos, búsqueda y estado de otras áreas se conservan.
- Verificación registrada: **30 pruebas Node, 109 comprobaciones F1, 107 comprobaciones heredadas y 66 combinaciones de vista/tamaño** aprobadas en Chromium. Revisiones independientes de alcance y calidad aprobadas.
- CP1 técnico y de producto completados. Feedback: «Perfecto, sigamos fase 2».

### F2 — Dashboard y contenido de Campus Pulse (Integrada; CP2 técnico aprobado)

Se implementaron 18 contenidos de ejemplo: nueve eventos/talleres, seis artículos y tres prácticas. Se conservaron los seis IDs originales y las publicaciones de búsqueda de equipo se reclasificaron como artículos de colaboración. Se añadieron temas, incluidos Salud y Gobierno, etiquetas visibles en todos los modos, tarjetas y detalles, atribución de fuente para artículos y la etiqueta de emprendimiento para la práctica de marketing.

«Para ti» prioriza de forma estable las coincidencias con los temas guardados y conserva contenido sin coincidencia; sin temas o con personalización desactivada muestra contenido general. Los cuatro widgets (Eventos, Artículos, Oportunidades y Guardados) muestran hasta tres elementos con conteo y controles de categoría completa. El orden/visibilidad se edita en Preferencias con borrador, guardar/cancelar y retención al navegar o cambiar tamaño. Una categoría oculta sigue accesible; si se ocultan todas hay recuperación. Restaurar solo el layout no descarta el borrador de temas. Guardados sin duplicados mantienen contexto y recuperación de foco.

Las fichas de artículo muestran únicamente resumen y **Leer artículo completo**; las tres prácticas muestran overview y **Saber más** hacia sus fuentes locales completas. `demo-source.html` / `demo-source.js` usan una misma plantilla clásica para los dos tipos de fuente, presentan el contenido completo ficticio y enlaces salientes seguros. Las fuentes abren en nueva pestaña y funcionan localmente, sin CDN. F2 no implementa formulario «Postúlate»: el flujo local de postulación corresponde a F3. Se mantuvieron los modos y personalización antes del hero, y se ajustó la legibilidad con estilos acotados de Pulse.

Archivos de producto: editados `data.js`, `state.js`, `ui.js`, `app.js`, `index.html` y `views/profile.js`; añadidos `views/pulse.js`, `pulse.css`, `demo-source.html` y `demo-source.js`. Las pruebas Node, render y navegador se ampliaron. `styles.css` y `profile.css` no se modificaron en F2.

Revisión de calidad: tres hallazgos corregidos —visibilidad de etiquetas, metadatos de emprendimiento para la práctica de marketing y navegación profunda a categorías desde widgets—. Al entrar desde un widget, ahora se muestra el inicio de la categoría bajo el encabezado sticky con foco en la selección; el desplazamiento desde píldoras directas se conserva.

Verificación final registrada por root: **44 pruebas Node, 97 comprobaciones UI F2 a 390/1440 px, 109 UI F1, 107 UI heredadas y 90 comprobaciones de vista/ancho/fuente** (13 instancias de ruta SPA, incluidas variantes de detalle de artículo/práctica, más dos tipos de fuente local en seis anchos). Apertura por archivo y fuentes correctas; cero errores de ejecución y cero overflow. Revisiones independientes de especificación y calidad aprobadas sin hallazgos pendientes. CP2 técnico aprobado.

F2 no incluye registro a eventos, exportación de calendario ni postulación local (F3), ni IA o rediseño de Mentor Match. CP2 de producto sigue pendiente de revisión del usuario. Vista previa nativa sugerida: `?phase=f2#/pulse`; capturas en `review/390-pulse.png`, `review/1440-pulse.png`, `review/390-source-article.png`, `review/1440-source-article.png`, `review/390-source-opportunity.png` y `review/1440-source-opportunity.png`.

### CP2 — 6 de octubre de 2026 — Técnico aprobado; producto pendiente

- **Fase y estado:** F2 integrada; CP2 técnico aprobado; CP2 de producto pendiente. La fase no se marca completada hasta la revisión del usuario.
- **Archivos F2:** editados `data.js`, `state.js`, `ui.js`, `app.js`, `index.html`, `views/profile.js`; añadidos `views/pulse.js`, `pulse.css`, `demo-source.html` y `demo-source.js`; se ampliaron pruebas Node, render y navegador. `styles.css` y `profile.css` no se modificaron en F2.
- **Comportamientos clave:** dashboard «Para ti» / «Todo el campus»; cuatro widgets con vista previa y navegación a categorías; temas, prioridad estable y personalización persistidos; orden/visibilidad con borradores; artículos con resumen y fuente; tres prácticas con overview y CTA Saber más; fuentes locales con plantilla compartida; filtros y guardados conservados.
- **Navegación profunda corregida:** categorías abiertas desde widgets arrancan visibles bajo el encabezado sticky y reciben foco; el scroll iniciado desde píldoras se mantiene.
- **Métricas finales:** 44 Node, 97 UI F2 (390/1440 px), 109 UI F1, 107 UI heredadas y 90 comprobaciones responsive (13 instancias de rutas SPA más dos tipos de fuente, en seis anchos). Cero errores de ejecución y overflow; apertura local y fuentes correctas.
- **Revisión:** especificación y calidad aprobadas sin hallazgos pendientes; los tres hallazgos sobre etiquetas, metadatos de marketing y navegación profunda están corregidos.
- **Capturas/vista previa:** `review/390-pulse.png`, `review/1440-pulse.png`, `review/390-source-article.png`, `review/1440-source-article.png`, `review/390-source-opportunity.png`, `review/1440-source-opportunity.png`; `?phase=f2#/pulse`.
- **Feedback de producto:** pendiente.
- **Siguiente paso:** presentar Campus Pulse, un artículo y una práctica al usuario para CP2 de producto. Tras recibir y registrar feedback, comenzar F3: registro a eventos, calendario `.ics` y postulación local.

### Continuidad

- **Etapa actual:** entrega revisada y completada. F0–F6, incluida F5A, revisadas y completadas; todos sus checkpoints revisados y cerrados.
- **Último paso completado:** registrar la revisión final y la confirmación del usuario «marcalo como revisadas y completadas».
- **Pendiente:** nada.
- **Siguiente paso:** si se piden cambios nuevos, añadirlos como una fase nueva en la guía y repetir la regresión de su sección 6.
