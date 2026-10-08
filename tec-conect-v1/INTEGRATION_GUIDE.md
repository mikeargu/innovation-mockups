# Tec Conect — guía de integración del mockup v2

**Fecha:** 6 de octubre de 2026.  
**Estado:** todas las fases (F0–F6, incluida F5A) revisadas y completadas; todos los checkpoints (CP0–CP6, incluido CP5A) revisados y cerrados. Revisión final confirmada por el usuario el 6 de octubre de 2026 con «marcalo como revisadas y completadas». El mockup queda entregado, sin pendientes de integración.
**Directorio de trabajo:** `/Users/mike_argu/Documents/scuola/innovation/mockups/tec-conect-v1/`.
**Objetivo:** integrar las aclaraciones del producto por partes, conservar el diseño aprobado y dejar un registro que permita continuar en otra sesión.

## 1. Punto de partida y dirección del producto

La v1 ya tiene ocho vistas, navegación por hash, diseño mobile first con versión web, fuentes locales y acciones simuladas. La última verificación de esa versión registró 10 pruebas de estado, 107 comprobaciones de recorrido y 48 combinaciones de vista/tamaño. Estos números describen la **v1**; los resultados de la v2 completada están registrados en CP6 y en la revisión final.

| Espacio | Dirección de la v2 |
|---|---|
| Campus Pulse | Dashboard personalizable de eventos, artículos y oportunidades profesionales; registro a eventos y exportación a calendario. |
| Talent Network | Asistente de IA para describir un equipo necesario, seguido por el directorio **«Personas para descubrir»**. |
| Mentor Match | Asistente de orientación académica y profesional que conecta una meta con materias, profesores y opciones de trayectoria. La red humana de apoyo queda debajo. |
| Mi perfil y preferencias | Edición de descripción, proyectos, habilidades, intereses, apertura a colaborar, contacto y preferencias de Campus Pulse. |

**Referencias locales:** `brandstrategy.md` y `talent-network.md` en la raíz del workspace. Las aclaraciones del usuario en esta guía actualizan el alcance del mockup, especialmente Mentor Match. No modificar el dossier original automáticamente como parte de estas fases.

**Nombre institucional:** CVDP significa **Centro de Vinculación y Desarrollo Profesional**. Se usará este nombre en las oportunidades y talleres de desarrollo profesional. [Fuente institucional del Tec](https://cvdp.tec.mx/es/contacto).

### Decisiones para implementar

- Mantener Poppins, Azul TEC `#0039A6`, superficies claras, tarjetas e iconos del diseño actual; conservar las versiones móvil, tablet y escritorio.
- Mantener las tres áreas principales en la navegación. Acceder a **Mi perfil y preferencias** desde el avatar/cuenta, tanto en móvil como en web.
- Los asistentes usan **escenarios y respuestas locales de demostración**. Sus respuestas mostrarán «Respuesta de ejemplo» y permitirán elegir otro escenario cuando una consulta no esté cubierta.
- Empresas, vacantes, profesores, materias, fechas y personas de la demo son ficticios. Los ejemplos académicos muestran la experiencia propuesta; no son un mapa curricular ni una oferta institucional vigente.
- Conservar el funcionamiento local, los scripts clásicos y el estado en memoria. Recargar o pulsar **Reiniciar demo** restaura la cuenta y los datos de ejemplo.
- El botón **Agregar a mi calendario** descargará un archivo `.ics` del evento de ejemplo. El registro a eventos y la postulación a prácticas se simularán dentro del mockup.
- **Personalización confirmada por el usuario:** temas elegidos más visibilidad y orden de secciones del dashboard.
- **Aclaración posterior:** los intereses de Eventos, Artículos y Oportunidades se configuran de forma independiente. El gusto por leer un tema no se convierte automáticamente en un área donde buscar trabajo. Este cambio quedó implementado y revisado en F5A.
- Cada estudiante tiene **un mentor institucional asignado**, según la aclaración del usuario. El director de carrera y los profesores fijados aparecen con sus propios roles.

### Conformidad con la estrategia de marca

Referencia: `brandstrategy.md` (§3–§6, §8, §10). Aplica a todas las fases.

- **Marcador de concepto:** el mockup muestra de forma visible que es un **concepto** con datos ficticios. «Tec Conect by CEM» es un nombre de trabajo sujeto a revisión institucional; indicarlo en la portada/README y en la entrega. Las etiquetas «Respuesta de ejemplo» y «Canal CVDP · oportunidad de ejemplo» complementan este marcador, no lo sustituyen.
- **Nombre institucional y CVDP:** el uso del nombre CVDP junto a empresas ficticias es solo ilustrativo. No simular logotipos, avales ni lockups del Tec; cualquier uso externo requiere revisión de Comunicación/Marca.
- **Color:** Azul TEC `#0039A6` como ancla. Los acentos por área (morado `#A12780` en Talent Network, naranja `#BB4C02` en Mentor Match) son colores miTec de producto, con asignación constante. No se usan para estados.
- **Estados:** todo estado (registrado, postulado, fijado, error) se comunica con texto e icono además del color.
- **Tipografía:** Poppins. Bamboo documenta Regular, Light y Bold; el mockup carga también SemiBold (600). Mantenerlo solo si hay una razón de jerarquía; en caso contrario, usar Bold. **Decisión F6:** se mantiene SemiBold para controles, etiquetas y subtítulos de tarjetas, como nivel intermedio entre el texto Regular y los títulos en Bold; los títulos siguen en Bold.
- **Forma y espaciado:** radios de la escala Bamboo (4, 8, 12 y 24 px) y espaciado en múltiplos de 4/8 px. En F6 todos los radios quedaron en la escala (4/8/12/24 px y 50 % en avatares) y `tests/brand.test.cjs` lo verifica.
- **Iconos:** un solo estilo, Material Symbols Rounded, sin deformar proporciones; nunca como único medio de comunicar.
- **Contenido:** sin rankings ni porcentajes de compatibilidad; perfiles y datos ficticios; nada aparenta estar implementado o validado si no lo está.

## 2. Qué mostrar en cada espacio

### Campus Pulse

Conservar la composición y el lenguaje visual actual. Añadir una vista **Para ti** basada en temas elegidos y una opción **Todo el campus** para explorar el contenido general. La personalización debe explicar la coincidencia con una etiqueta breve, por ejemplo «Por tu interés en Finanzas».

El dashboard tendrá secciones de **Eventos y talleres**, **Artículos**, **Oportunidades CVDP** y **Mis guardados**. En «Para ti», priorizar coincidencias de temas de manera estable. Sin temas elegidos, mostrar el contenido general y un acceso para elegir intereses. Las preferencias de orden/visibilidad se aplican al dashboard; las categorías siguen siendo accesibles mediante filtros.

Orden inicial: eventos, artículos, oportunidades y guardados; las cuatro secciones visibles. Temas iniciales del perfil de ejemplo: Finanzas, IA y Emprendimiento. Si se ocultan todas las secciones, mostrar un estado vacío con acceso a **Personalizar dashboard** y **Restaurar secciones**.

Configurar visibilidad con interruptores y orden con botones **Subir / Bajar** de al menos 44 px. Estos controles deben funcionar también en móvil y con teclado.

#### Ampliación F5A — Intereses por tipo de contenido

**Necesidad:** una persona puede estudiar Finanzas y disfrutar artículos de Psicología. Campus Pulse debe permitir ambas preferencias sin recomendarle puestos de Psicología por su interés de lectura.

En **Mi perfil → Preferencias**, reemplazar la selección única de temas por tres grupos con selecciones independientes:

| Grupo | Qué personaliza | Ejemplo |
|---|---|---|
| **Eventos y talleres que me interesan** | Actividades a las que quiero asistir o temas que quiero aprender. | IA, Storytelling, Emprendimiento. |
| **Temas que me gusta leer** | Artículos que quiero descubrir, aunque no estén relacionados con mi carrera. | Psicología, Finanzas. |
| **Áreas donde busco oportunidades** | Prácticas y puestos relacionados con las áreas profesionales que elijo. | Finanzas. |

- Mostrar la carrera del perfil como contexto del tercer grupo. Sus selecciones se guardan explícitamente y se pueden editar; cambiar la carrera no sobrescribe áreas ya elegidas.
- Añadir **Psicología** como tema seleccionable y contenido de ejemplo para mostrar el caso solicitado. La taxonomía debe distinguirlo de la etiqueta general Salud.
- Mantener los intereses profesionales del perfil separados de estos tres grupos de Pulse. Cada grupo muestra su propio resumen en Mi perfil.
- **Para ti:** eventos y artículos se priorizan mediante su propio grupo de temas. Las oportunidades recomendadas usan las áreas profesionales elegidas y los requisitos de la vacante; nunca los temas de lectura o de eventos.
- En el dashboard personalizado, una oportunidad sin coincidencia con las áreas laborales elegidas no se presenta como recomendada. **Todo el campus** y la exploración general de oportunidades permiten consultar todas las ofertas.
- Si un grupo no tiene selecciones, mostrar contenido general de ese grupo y un acceso para configurarlo. Los otros grupos conservan su personalización.
- Si hay áreas laborales elegidas y no existen ofertas coincidentes, mostrar un estado vacío con **Ver todas las oportunidades** y **Editar mis áreas**.
- Distinguir el área del puesto del sector de la empresa: un puesto de Finanzas en una empresa de Psicología puede coincidir con Finanzas; una vacante de Psicología no coincide por el simple gusto de leer ese tema.
- Los requisitos se muestran para revisar la oportunidad; una coincidencia de preferencias no confirma elegibilidad académica ni aceptación de una postulación.
- Guardar/cancelar, borradores, orden/visibilidad del dashboard y reinicio conservan el comportamiento existente. Las razones de recomendación indican el grupo que produjo la coincidencia.

**Recorrido de ejemplo:** perfil de Finanzas → elegir Psicología en Artículos y Finanzas en Oportunidades → guardar → leer contenido de Psicología y encontrar prácticas de Finanzas. Cambiar los temas de Eventos no modifica las otras dos selecciones.

#### Contenido de ejemplo

Mantener los IDs de las publicaciones actuales para conservar los enlaces. Presentar las dos publicaciones actuales de búsqueda de equipo como artículos/historias de colaboración; la sección Oportunidades tendrá fichas de prácticas e internships.

| Tipo | Nuevos ejemplos mínimos | Temas |
|---|---|---|
| Conferencia | Ingresos personales: entiende tu primer sueldo | Finanzas, desarrollo profesional |
| Conferencia | IA en fisiología: preguntas e investigación | IA, salud, investigación |
| Conferencia | Tratamiento del agua: soluciones y retos | Agua, sostenibilidad, investigación |
| Foro | Foro de discusión: ideas para mejorar el campus | Comunidad, participación |
| Foro | Foro de gobierno local: participación ciudadana | Gobierno, participación |
| Taller | Mejora tu CV: cuenta tu experiencia | CV, desarrollo profesional |
| Taller | Storytelling: comunica tu proyecto | Storytelling, comunicación, emprendimiento |
| Artículo | Cómo convertir un proyecto de clase en experiencia profesional | CV, desarrollo profesional |
| Artículo | Del laboratorio al campus: aprender con agua y datos | Agua, investigación |
| Práctica | Practicante de análisis financiero · Nexo Capital | Finanzas, desarrollo profesional |
| Práctica | Practicante de marketing · EnerGel Labs | Marketing, emprendimiento |
| Práctica | Practicante de desarrollo web · Cauce Digital | Tecnología, desarrollo web |

Las tres empresas son nombres ficticios para la demo. Usar un rótulo **«Canal CVDP · oportunidad de ejemplo»**, con identidad de empresa en texto/iniciales y el estilo propio de Tec Conect. Los talleres de CV y storytelling también mostrarán CVDP como canal de ejemplo, para explicar cómo la propuesta amplía la audiencia de sus servicios.

**Artículos:** Campus Pulse muestra título, fuente/fecha, temas y un resumen breve de dos o tres frases. Añadir el botón **Leer artículo completo**, dirigido a la publicación de origen. La ficha dentro de Pulse conserva el resumen; el contenido completo se consulta en el destino del botón. Para artículos ficticios, usar una página local de fuente de ejemplo claramente identificada, separada del dashboard.

**Oportunidades laborales:** mostrar puesto, empresa, ubicación/modalidad, fecha límite y un overview breve de dos o tres frases. La ficha dentro de Pulse también presenta este resumen. Añadir un CTA **Saber más** para consultar la oferta completa o **Postúlate** para iniciar la postulación, según el destino de cada oportunidad. El texto de requisitos y descripción completa pertenece al destino de la oferta.

#### Acciones

- Eventos y talleres: **Registrarme** → revisar los datos del perfil → confirmar → **Registro simulado**. Repetir la acción muestra el registro existente.
- Eventos y talleres: **Agregar a mi calendario** → descargar `.ics` con título marcado como ejemplo, inicio, fin, ubicación y descripción. Esta acción es independiente del registro y de guardar la publicación.
- Prácticas: overview + **Saber más** → destino de la oferta completa; o **Postúlate** → destino de postulación. Si la oportunidad usa el flujo local de demo, revisar perfil y escribir un breve interés → confirmar → **Postulación simulada enviada**, una vez por vacante y sesión. Abrir un destino externo no registra una postulación como enviada.
- Artículos: resumen + **Leer artículo completo** → fuente de origen; conservar **Guardar**. Las acciones de registro/calendario se muestran únicamente en eventos y talleres; postulación únicamente en prácticas.

### Talent Network

Añadir un bloque de asistente **al comienzo**, antes del directorio. Incluir textarea, botón **Encontrar mi equipo** y chips de consultas de ejemplo. Mantener el directorio, su búsqueda y sus filtros visibles debajo del bloque.

**Escenario principal:**

> Estoy empezando una startup de geles para correr. Necesito alguien de marketing, alguien de finanzas y alguien que diseñe la página web.

La respuesta organiza necesidades por rol: **Marketing**, **Finanzas** y **Diseño/desarrollo web**. Cada rol muestra personas de ejemplo, las habilidades que coinciden, evidencia del perfil y una razón breve. Ofrecer **Ver perfil** y **Explorar personas con esta habilidad**, reutilizando los perfiles y solicitudes de contacto actuales.

Añadir dos escenarios: formar un equipo para un hackathon y crear una app para el campus (programación, seguridad de los datos e investigación con estudiantes). El escenario de agua/sostenibilidad se retiró a pedido del usuario el 6 de octubre de 2026. Las consultas no reconocidas ofrecen los escenarios disponibles; no producen recomendaciones arbitrarias.

Conservar el encabezado **«Personas para descubrir»**. Mostrar por separado la disponibilidad declarada y la razón de coincidencia. No añadir rankings personales ni porcentajes de compatibilidad.

### Mentor Match

El contenido principal será el asistente de orientación, con contexto de carrera/semestre tomado del perfil, una meta editable y el botón **Explorar mi ruta**.

**Escenario principal:**

> Estoy en primer semestre de Finanzas y al terminar mi carrera quiero trabajar en el mercado bursátil mexicano. ¿Qué profesores y materias me ayudarían? ¿Me conviene un intercambio o una concentración?

La respuesta de ejemplo incluye:

1. **Tu meta y punto de partida:** resumen de carrera, semestre y objetivo.
2. **Ruta sugerida:** etapas de fundamentos, exploración, especialización y preparación profesional, con acciones concretas de ejemplo.
3. **Materias para explorar:** ejemplos de estadística aplicada, análisis de mercados e instrumentos financieros; cada ficha explica cómo se relaciona con la meta.
4. **Profesores para conversar:** perfiles ficticios relacionados con mercados, datos o investigación; acciones para abrir el perfil o fijarlo en la red de apoyo.
5. **Intercambio o concentración:** comparación por objetivo, experiencia buscada y aspectos que habría que revisar con el director. El usuario puede seleccionar una opción para explorar; ambas permanecen accesibles.
6. **Siguiente conversación:** temas para revisar con el mentor institucional y el director de Finanzas.

Etiquetar los cursos, profesores y alternativas como ejemplos de orientación. No simular inscripción académica, aprobación de equivalencias ni aceptación de un intercambio.

#### Red humana de apoyo debajo del asistente

- **Mi mentor institucional:** una persona asignada, siempre visible; no se cambia ni se elimina mediante «Fijar».
- **Mi director de carrera:** un contacto de ejemplo con el rol **Director de Finanzas**.
- **Profesores fijados:** el usuario añade o quita profesores desde las recomendaciones o el explorador de profesores. Evitar duplicados.
- Reutilizar las fichas y solicitudes actuales, ajustando su texto a **Solicitar orientación** y al rol real de la tarjeta.
- Reutilizar los IDs actuales cuando sea posible: Elena Cruz como mentora institucional, Rodrigo Navarro como director de Finanzas, Paula Ortiz y Gabriel Soto como profesores de ejemplo. Es una reasignación de roles ficticios del mockup.

### Mi perfil y preferencias

Cuenta inicial: **Valeria Álvarez, Finanzas, primer semestre**, con datos de contacto de ejemplo. El perfil podrá mostrar:

- Nombre mostrado, carrera, semestre y descripción personal.
- Áreas de interés profesional.
- Habilidades con nivel declarado.
- Proyectos: título, descripción, rol, etiquetas y enlace opcional; añadir, editar y eliminar.
- **Abierta/o a colaborar** y una elección explícita para mostrar el perfil en Talent Network.
- Contacto: correo de ejemplo, teléfono opcional y enlaces profesionales/portafolio.
- Preferencias de visibilidad del contacto. Por defecto, los datos de contacto son privados; la vista propia puede mostrar qué está oculto.

Separar **intereses profesionales** de **temas de Campus Pulse**. Las preferencias de Pulse incluyen temas, activar/desactivar «Para ti» y orden/visibilidad de secciones, como confirmó el usuario.

**Flujo:** abrir avatar → ver perfil → editar → guardar → ver cambios en cuenta/perfil → abrir preferencias → elegir temas → volver a Campus Pulse y comprobar la personalización.

Si el usuario activa descubrimiento y colaboración, su perfil puede aparecer en Talent Network como **Tu perfil** mediante una proyección pública. No renderizar contacto privado en tarjetas públicas.

## 3. Contratos de integración

### Estado compartido

Extender `createState()` conservando `saved`, `contacts`, filtros y posiciones actuales:

| Estado nuevo | Responsabilidad |
|---|---|
| `profile` | Nombre, carrera, semestre, descripción, intereses, habilidades declaradas, proyectos, contacto y visibilidad; apertura y descubrimiento. |
| `pulsePreferences` | Actualmente usa temas compartidos; en F5A tendrá `topicsByCategory.events`, `topicsByCategory.articles` y `topicsByCategory.opportunities`, además de personalización activa, orden y visibilidad de secciones. |
| `registrations[eventId]` | Registro simulado del estudiante a un evento. |
| `applications[opportunityId]` | Interés enviado, fecha de simulación y estado de postulación. |
| `talentAssistant` | Consulta, escenario y respuesta organizada por roles. |
| `careerAssistant` | Meta, escenario, ruta de ejemplo y alternativa seleccionada. |
| `assignedMentorId` | Un mentor institucional de ejemplo. |
| `pinnedSupportIds` | Director y profesores fijados, sin duplicados. |
| `drafts` | Borradores de perfil, proyectos, postulaciones y consultas, además de los formularios existentes. |

El reinicio restaura los valores iniciales de todos estos campos, incluidos mentor asignado y director fijado. Guardar un perfil actualiza los datos confirmados; cancelar abandona el borrador. La navegación y el resize conservan los borradores de la sesión.

Añadir operaciones probables y probar su comportamiento antes de conectar vistas: guardar perfil, cambiar preferencias, registrar evento, postular a práctica, fijar/quitar profesor y generar las dos respuestas de ejemplo. Los generadores de IA reciben texto y datos de ejemplo y devuelven resultados estructurados; no necesitan llamadas de red.

### Datos

- Publicaciones: añadir tipo, temas y metadatos correspondientes al tipo.
- Temas: usar una taxonomía compartida con IDs estables y etiquetas en español para publicaciones, preferencias y razones de personalización.
- Eventos/talleres: inicio y fin completos con zona horaria de ejemplo `America/Mexico_City`, organizador y ubicación/modalidad.
- Artículos: resumen independiente del contenido completo y un destino de lectura (`articleUrl`).
- Prácticas: empresa ficticia, puesto, modalidad, duración, fecha límite y overview; añadir etiqueta y destino del CTA (`ctaLabel`, `ctaUrl`) para **Saber más** o **Postúlate**. Los destinos de ejemplo deben ser funcionales; usar fuente local para el contenido ficticio o URL de origen para contenido autorizado.
- F5A: añadir `professionalAreaIds` a las prácticas para representar el área del puesto, independiente de temas generales o del sector de la empresa. Por ejemplo, análisis financiero → Finanzas; marketing → Marketing; desarrollo web → Tecnología / Desarrollo web. Los requisitos continúan en la ficha/fuente correspondiente.
- Orientación: escenarios, etapas, cursos de ejemplo, profesores y alternativas de trayectoria relacionados por IDs estables.
- Contactos de apoyo: rol explícito `institutionalMentor`, `degreeDirector` o `professor`.
- El adaptador del perfil propio a una persona del directorio debe usar la forma que consume el matching: habilidades, evidencia de proyectos y disponibilidad declarada.

### Rutas

| Ruta | Vista/acción |
|---|---|
| `#/pulse`, `#/pulse/:id` | Dashboard/filtro y ficha: detalle del evento o resumen de artículo/oportunidad con su CTA. |
| `#/pulse/:id/register` | Revisión y confirmación de registro a evento/taller. |
| `#/pulse/:id/apply` | Postulación a una práctica. |
| `#/talent`, `#/talent/:id`, `#/talent/:id/contact` | Asistente/directorio y flujos de contacto existentes. |
| `#/mentor` | Asistente académico/profesional y red humana debajo. |
| `#/mentor/plan` | Ruta y comparación de opciones generadas para la demo. |
| `#/mentor/:id`, `#/mentor/:id/request` | Perfil de apoyo y solicitud de orientación. |
| `#/profile` | Perfil propio. |
| `#/profile/edit` | Edición de perfil y proyectos. |
| `#/profile/preferences` | Temas y preferencias de Campus Pulse. |

Resolver las rutas reservadas (`profile`, `mentor/plan`) antes de buscar un ID de persona. Validar que `register` corresponda a evento/taller y `apply` a práctica. Las rutas desconocidas mantienen la recuperación actual hacia Pulse.

La navegación principal se genera únicamente desde las tres áreas. Los metadatos de `profile` y de las nuevas vistas deben permitir renderizar encabezado, título y foco sin añadir un cuarto destino a la barra inferior.

### Organización del código

Mantener `data.js` como ejemplos y `state.js` como lógica exportable a Node. Mantener `app.js` como controlador de rutas, eventos delegados, foco y scroll.

Al incorporar las nuevas vistas, extraer renderizadores por área a `views/profile.js`, `views/pulse.js`, `views/talent.js` y `views/mentor.js`. Reunir escape, iconos, tarjetas/controles comunes en `ui.js`; separar las respuestas deterministas en `demo-ai.js` y la exportación `.ics` en `calendar.js`. Son scripts clásicos, con funciones que reciben un contexto explícito de datos/estado/ruta.

Orden de carga: datos → estado → utilidades UI/IA/calendario → vistas → controlador. `index.html` seguirá funcionando al abrirse como archivo local. Conservar listeners delegados únicos y evitar que cada render agregue nuevos listeners globales.

## 4. Fases y checkpoints

Una fase termina con código integrado, sus comprobaciones y una evidencia visual. El checkpoint de producto presenta el resultado para revisión del usuario antes de comenzar la siguiente parte. Resolver dentro de la fase los errores funcionales y de accesibilidad encontrados en la revisión técnica.

### F0 — Revisar y fijar la guía

- [x] Documentar las aclaraciones y el estado inicial.
- [x] Confirmar con el usuario temas, orden y visibilidad del dashboard.
- [x] Revisar con el usuario el alcance de la guía y los checkpoints; autorizó comenzar F1.

**CP0:** revisar esta guía, especialmente el nuevo propósito de Mentor Match, los roles de apoyo y las fases. Registrar cualquier ajuste antes de escribir comportamiento nuevo.

### F1 — Perfil, preferencias y estado compartido

- [x] Extender el estado y su reinicio con los campos descritos arriba.
- [x] Añadir las rutas propias y el acceso desde avatar/cuenta en móvil y escritorio.
- [x] Implementar perfil, edición, proyectos e información de contacto/visibilidad.
- [x] Implementar selección de temas para Pulse y su opción de personalización.
- [x] Sustituir nombre/iniciales fijos en el shell por datos del perfil.
- [x] Cubrir guardar/cancelar, proyectos, visibilidad, borradores y reset.

**CP1 técnico:** proyectos sin título se rechazan; contenido de usuario se escapa; enlaces opcionales aceptan únicamente URLs HTTP/HTTPS; contacto privado se omite del perfil público; la navegación principal conserva tres áreas.

**CP1 producto — completado, 6 de octubre de 2026:** el usuario revisó el recorrido de perfil y preferencias y respondió: «Perfecto, sigamos fase 2». Quedan cerrados los checkpoints técnico y de producto de F1.

Alcance integrado de F1: `state.js`, `app.js` e `index.html` fueron editados; se añadieron `ui.js`, `views/profile.js`, `profile.css` y pruebas de perfil. Las rutas propias son `#/profile`, `#/profile/edit` y `#/profile/preferences`. El perfil confirmado se mantiene separado de los borradores; estos sobreviven a navegación y resize. Guardar confirma, cancelar descarta y reiniciar restaura perfil y preferencias. Proyectos y habilidades permiten alta, edición y eliminación. La visibilidad del contacto se controla por campo, es privada por defecto y los enlaces admiten HTTP(S) seguro. El perfil propio aparece en Talent Network solo con colaboración y descubrimiento activos; la proyección no ofrece una solicitud de contacto al perfil propio y omite del DOM los campos de contacto marcados privados, mientras que los públicos pueden mostrarse. Temas y preferencias se guardan; la identidad de cuenta deriva del perfil confirmado. Si deja de existir una habilidad elegida como filtro de Talent tras editar el perfil, el filtro vuelve a «Todas las habilidades»; filtros válidos, búsqueda y estado de otras áreas se conservan.

### F2 — Dashboard y contenido de Campus Pulse

**Estado: Completada; CP2 técnico aprobado y CP2 de producto cerrado (6 de octubre de 2026).** F2 conecta las preferencias guardadas con un dashboard «Para ti» / «Todo el campus», sus secciones y contenido de demostración. Incluye eventos, artículos y oportunidades CVDP, orden/visibilidad, resúmenes y CTAs hacia fuentes locales funcionales. No incluye registro a eventos, exportación de calendario ni postulación local (F3), ni IA o rediseño de Mentor Match.

- [x] Ampliar los ejemplos de eventos, artículos y prácticas según la tabla: 18 contenidos (nueve eventos/talleres, seis artículos y tres prácticas), conservando los seis IDs originales; reclasificar las publicaciones de búsqueda de equipo como artículos de colaboración.
- [x] Incorporar etiquetas por tema, tarjetas/detalles con chips visibles y fichas de prácticas con estilo de oferta laboral y overview breve.
- [x] Mostrar artículos únicamente como resumen en Pulse y añadir **Leer artículo completo** a la fuente local.
- [x] Mostrar overview de las tres prácticas y CTA **Saber más** hacia su fuente local completa; el flujo «Postúlate» local corresponde a F3.
- [x] Construir «Para ti» / «Todo el campus» y razones de coincidencia: ordenar establemente primero coincidencias de temas y conservar contenido sin coincidencia; mostrar contenido general sin temas o con personalización desactivada.
- [x] Conectar los temas guardados en preferencias.
- [x] Permitir mostrar/ocultar y subir/bajar secciones desde Preferencias, con borrador, guardar/cancelar y retención en navegación/resize.
- [x] Mantener filtros, guardados y navegación de detalle; los widgets conservan acceso a la categoría aunque esté oculta, y hay recuperación cuando todas se ocultan.

Los widgets son Eventos, Artículos, Oportunidades y Guardados; muestran hasta tres elementos, conteo y control para abrir la categoría completa. Restaurar layout solo restaura la disposición, sin descartar el borrador de temas. Los guardados sin duplicados mantienen contexto y recuperación de foco. Las fuentes están en `demo-source.html` / `demo-source.js`, se abren en pestaña nueva y funcionan localmente; las fuentes externas usan destinos seguros. Se conservaron los modos y controles antes del hero; los ajustes de legibilidad se limitaron a `pulse.css`.

**CP2 técnico — aprobado el 6 de octubre de 2026:** 44 pruebas Node; 97 comprobaciones UI F2 a 390/1440 px; 109 comprobaciones UI F1; 107 UI heredadas; 90 comprobaciones de vista/ancho/fuente (13 instancias de ruta SPA, incluidas variantes de artículo/práctica, y dos tipos de fuente local en seis anchos). Se registraron apertura por archivo, fuentes locales, cero errores de ejecución y cero overflow. Revisiones independientes de especificación y calidad aprobadas sin hallazgos pendientes.

La revisión de calidad resolvió tres hallazgos: chips de tema que no siempre eran visibles, metadatos de emprendimiento de la práctica de marketing y navegación profunda de categorías desde widgets. Al entrar desde un widget, ahora el inicio de la categoría queda visible bajo el encabezado sticky y recibe foco; el scroll originado en píldoras directas se conserva.

**CP2 producto — cerrado el 6 de octubre de 2026:** el usuario pidió continuar con «start with the F3» sin solicitar ajustes; se registra como autorización para comenzar F3 y cierre de CP2 sin cambios. La revisión prevista fue: revisar el dashboard, un artículo y una ficha de práctica a 390 y 1440 px. Comprobar que artículos y oportunidades presentan únicamente resumen/overview dentro de Pulse, que sus botones llevan al destino correcto y que los ejemplos cubren CV, storytelling, conferencias/foros y visibilidad de CVDP. Vista previa nativa: `?phase=f2#/pulse`. Capturas: `review/390-pulse.png`, `review/1440-pulse.png`, `review/390-source-article.png`, `review/1440-source-article.png`, `review/390-source-opportunity.png`, `review/1440-source-opportunity.png`. No hubo ajustes pedidos por el usuario.

### F3 — Registro, calendario y postulación

**Estado: Completada; CP3 técnico aprobado y CP3 de producto cerrado (6 de octubre de 2026).**

- [x] Implementar revisión/confirmación de registro para eventos y talleres.
- [x] Implementar exportación `.ics` con datos completos, escape de texto y finales de línea válidos.
- [x] Conectar los CTA de oportunidades a la oferta o al destino de postulación; implementar revisión de perfil, interés y confirmación para las postulaciones locales de demo.
- [x] Añadir estados visibles e impedir registros/postulaciones duplicados.
- [x] Cubrir acciones habilitadas por tipo de publicación, campos vacíos y reset.

**Alcance integrado de F3:** nuevas rutas `#/pulse/:id/register` (eventos/talleres) y `#/pulse/:id/apply` (prácticas con flujo local); ambas se validan por tipo y las demás recuperan hacia Pulse. `state.js` añade `registerForEvent`, `applyToInternship`, `pulseActions`, `actionProfileSummary`, `DEMO_DATE` e `INTEREST_MAX_LENGTH` (1,200); `drafts.applications` conserva el interés escrito y el reinicio limpia registros, postulaciones y borradores. `calendar.js` (nuevo) genera el `.ics` y `views/pulse-actions.js` (nuevo) renderiza detalle de acciones, revisión y confirmaciones; `app.js` conecta la descarga, el borrador y los envíos.

**Decisiones de F3:** solo `practica-finanzas` usa el flujo local (`applyMode: 'local'`) y muestra **Postúlate**; las tres prácticas conservan **Saber más** hacia su fuente local, de modo que la descripción completa sigue accesible y abrirla no registra nada. Los estados «Registro simulado» y «Postulación simulada enviada» se muestran con icono y texto en tarjetas, detalle y confirmación. El `.ics` usa horas UTC derivadas de la hora con zona de cada evento, rechaza horas sin zona y marca el título con `[EJEMPLO]`.

**CP3 técnico:** validar inicio/fin del `.ics`, ID estable y marca de ejemplo; exportar calendario no registra al estudiante; repetir registro/postulación local muestra el estado existente; abrir la fuente o postulación externa no equivale a confirmar envío; guardar sigue siendo una acción independiente.

**CP3 técnico — aprobado el 6 de octubre de 2026:** 74 pruebas Node; 145 comprobaciones UI F3 a 390/1440 px; 109 UI F1; 107 UI heredadas; 97 UI F2; 102 comprobaciones de ruta/ancho/fuente (las 90 anteriores más registro y postulación en seis anchos). Cero errores de ejecución y cero overflow. Una revisión independiente de código no encontró hallazgos críticos ni altos; se corrigieron sus seis observaciones: foco con desplazamiento al campo inválido, revocación del Blob con retraso (Safari), límite de 1,200 caracteres en el estado, rechazo de horas sin zona en el `.ics`, insignias sin región viva duplicada, y la marca de tiempo fija del `.ics` queda como decisión de demo (`DTSTAMP` determinista).

**CP3 producto — cerrado el 6 de octubre de 2026:** feedback del usuario: «F3 correct, continue with F4». Se registra como aprobación de F3 sin ajustes. La revisión prevista fue: mostrar evento → registro → calendario y práctica → postulación. Comprobar que las confirmaciones sean visibles desde la parte superior y que la persona entienda qué acción se simuló. Recorrido: `#/pulse/laboratorio-ideas` y `#/pulse/practica-finanzas`. Capturas: `review/390-f3-*.png` y `review/1440-f3-*.png` (detalle de evento, revisión de registro, registro confirmado, detalle de práctica, error de postulación, postulación confirmada y dashboard con estados).
### F4 — Asistente de equipos en Talent Network

**Estado: Completada; CP4 técnico aprobado y CP4 de producto cerrado (6 de octubre de 2026).**

- [x] Añadir textarea, chips y respuesta por roles sobre el directorio.
- [x] Implementar los tres escenarios de demostración y la recuperación para consultas no cubiertas.
- [x] Relacionar roles con los perfiles existentes y explicar coincidencias.
- [x] Conectar «Ver perfil» y filtros por habilidad sin alterar las solicitudes actuales.
- [x] Conservar el encabezado «Personas para descubrir».

**Alcance integrado de F4:** el bloque del asistente aparece al comienzo de `#/talent`, antes del directorio. `demo-ai.js` (nuevo) contiene los tres escenarios y `matchTeam(consulta, personas)`, una función determinista sin red que devuelve un resultado estructurado (`matched`, `unrecognized` o `empty`). `state.js` añade `setTalentAssistantQuery`, `submitTalentAssistant`, `exploreTalentSkill` y `TALENT_QUERY_MAX_LENGTH` (600); `views/talent.js` (nuevo) renderiza el bloque y `talent.css` (nuevo) sus estilos. `app.js` conecta chips, envío, exploración por habilidad y la consulta como borrador en `state.talentAssistant`, que sobrevive a navegación y resize y se restaura con **Reiniciar demo**.

**Decisiones de F4:**

- **Encabezado:** el código no tenía el encabezado «Personas para descubrir» (el directorio decía «Personas con las que puedes crear»); ahora el directorio lo usa, con foco al explorar una habilidad.
- **Reconocimiento:** una consulta se responde solo si nombra exactamente un escenario (geles, hackathon o app para el campus; con variantes comunes). Si no nombra ninguno o nombra varios, se ofrecen los tres escenarios y no se generan recomendaciones. La palabra «correr» no activa el escenario de geles.
- **Resultado:** por rol (hasta dos personas) con habilidades coincidentes, evidencia del perfil, razón y **disponibilidad declarada** en filas separadas; sin rankings ni porcentajes. Se muestra la consulta respondida y la etiqueta «Respuesta de ejemplo». El perfil propio nunca se recomienda.
- **Acciones:** **Ver perfil** abre el perfil existente y **Explorar personas con {habilidad}** fija el filtro de habilidad y limpia una búsqueda previa para no dejar el directorio vacío; las solicitudes de contacto no cambian y las tarjetas muestran «Pendiente de aceptación».
- **Código:** solo el bloque del asistente se extrajo a `views/talent.js`; las tarjetas y el directorio de Talent siguen en `app.js` hasta que otra fase los toque.

**CP4 técnico:** consulta vacía muestra feedback; geles → marketing/finanzas/web; chips llenan el campo; una consulta no reconocida ofrece ejemplos; navegación/resize retiene consulta; limpiar una búsqueda del directorio preserva otras áreas.

**CP4 técnico — aprobado el 6 de octubre de 2026:** 106 pruebas Node; 131 comprobaciones UI F4 a 390/1440 px (cifras tras sustituir el escenario de agua por la app para el campus); 109 UI F1; 97 UI F2; 145 UI F3; 107 UI heredadas; 102 comprobaciones de ruta/ancho/fuente. Cero errores de ejecución y cero overflow. Una revisión independiente de código no encontró hallazgos críticos; su hallazgo alto (el desplazamiento tras el envío podía quedar anulado por la restauración de scroll de `render`) ya estaba corregido con `afterRestore` y verificado en navegador con aserciones de posición. Además se corrigieron: reconocimiento ambiguo o por verbos comunes, búsqueda previa que dejaba vacío el directorio al explorar, etiqueta de la consulta respondida, habilidades exclusivas del perfil propio en los botones de exploración y texto pequeño de bajo contraste.

**CP4 producto — cerrado el 6 de octubre de 2026:** el usuario pidió sustituir el escenario de agua/sostenibilidad por otro ejemplo (se añadió «App para el campus») y después respondió «F4 correct, continue with F5». La revisión prevista fue: demostrar el prompt de geles para correr, abrir una persona recomendada y volver al directorio. Revisar que asistente y descubrimiento manual se complementen. Recorrido: `#/talent` → chip «Startup de geles para correr» → **Encontrar mi equipo** → **Ver perfil** → volver → **Explorar personas con Marketing**. Capturas: `review/390-f4-talent-*.png` y `review/1440-f4-talent-*.png` (vacío, error, resultado, exploración y consulta no reconocida). No cerrar CP4 hasta recibir y registrar el feedback del usuario.

### F5 — Orientación académica y red de apoyo en Mentor Match

**Estado: Completada; CP5 técnico aprobado y CP5 de producto cerrado (6 de octubre de 2026).**

- [x] Reemplazar el inicio centrado en un catálogo de mentores por el asistente de metas.
- [x] Implementar el escenario Finanzas → mercado bursátil mexicano con etapas, cursos, profesores y comparación intercambio/concentración.
- [x] Implementar la vista de ruta y conservar la meta al volver.
- [x] Reasignar los contactos ficticios a mentor institucional, director y profesores.
- [x] Mostrar la red de apoyo debajo del asistente; añadir fijar/quitar profesor.
- [x] Ajustar los textos de fichas y solicitudes al rol correspondiente.

**Alcance integrado de F5:** `#/mentor` muestra, en este orden, el asistente de orientación (carrera y semestre del perfil, meta editable, chip de ejemplo y **Explorar mi ruta**), la red de apoyo y un explorador de profesores con el filtro por tema. Una meta reconocida abre `#/mentor/plan` con las seis secciones (meta y punto de partida, ruta en cuatro etapas, materias, profesores, intercambio o concentración y siguiente conversación). `demo-ai.js` añade `careerScenarios` y `planCareer`; `state.js` añade `setCareerGoal`, `submitCareerAssistant`, `selectCareerAlternative`, `pinSupport`, `unpinSupport`, `supportNetwork` y `CAREER_GOAL_MAX_LENGTH` (600), y `careerAssistant` guarda `selectedAlternative`. `#/mentor/plan` se resuelve antes de los IDs de contacto. `views/mentor.js` y `mentor.css` son nuevos.

**Decisiones de F5:**

- **Roles:** los cuatro contactos conservan sus IDs y reciben `supportRole`: Elena Cruz (`institutionalMentor`, «Mentoría institucional · Finanzas»), Rodrigo Navarro (`degreeDirector`, «Director de Finanzas»), Paula Ortiz y Gabriel Soto (`professor`, docentes de mercados financieros y de estadística aplicada). Los textos de rol son neutrales salvo «Director de Finanzas», que pide esta guía.
- **Red de apoyo:** la mentora institucional y el director siempre se muestran y no tienen control para quitarlos; solo los profesores se fijan o quitan, sin duplicados, desde la ruta o el explorador. Los botones de fijar son acciones cuyo texto indica lo que harán («Fijar en mi red» / «Quitar de mi red»); las opciones de intercambio y concentración usan `aria-pressed` con texto constante y ambas siguen visibles.
- **Reconocimiento:** la meta se responde si menciona «bursátil», «BMV», «trading» o la frase «bolsa de valores»; «bolsa de trabajo» o «acciones» no la activan. Otras metas ofrecen el ejemplo disponible sin inventar una ruta.
- **Perfil vivo:** la ruta lee carrera y semestre del perfil al mostrarse, de modo que una edición posterior del perfil no deja datos viejos.
- **Solicitudes:** las fichas y perfiles usan **Solicitar orientación** y el rol real; la orientación no cambia solicitudes, registros ni el perfil, y solo una solicitud enviada muestra «Pendiente de aceptación».
- **Pruebas heredadas:** `browser.test.cjs` usaba el tema «Diseño» y el enlace «Solicitar mentoría», que esta fase reemplaza por especificación; ahora usa «Estadística aplicada» y «Solicitar orientación» con el mismo recorrido.

**CP5 técnico:** una sola persona asignada como mentor institucional; director/profesores conservan sus roles; fijar un profesor no duplica tarjetas; el mentor asignado permanece visible; los resultados de orientación no cambian registros académicos ni confirman contacto humano.

**CP5 técnico — aprobado el 6 de octubre de 2026:** 140 pruebas Node; 163 comprobaciones UI F5 a 390/1440 px; 131 UI F4; 145 UI F3; 97 UI F2; 109 UI F1; 107 UI heredadas; 108 comprobaciones de ruta/ancho/fuente (las 102 anteriores más `#/mentor/plan` en seis anchos). Cero errores de ejecución y cero overflow. Una revisión independiente de código no encontró hallazgos críticos ni altos; se corrigieron sus observaciones: texto heredado menor de 12 px en las superficies de F5, botones de fijar que cambiaban de texto con `aria-pressed`, ruta que conservaba carrera y semestre viejos tras editar el perfil y salto de nivel de encabezado en las fichas de profesores de la ruta.

**CP5 producto — cerrado el 6 de octubre de 2026:** feedback del usuario: «F5 correct, continue with F6». La revisión prevista fue: mostrar el caso de primer semestre de Finanzas, comparar intercambio/concentración, fijar un profesor y abrir al director de Finanzas. Revisar que la orientación sea el centro de la pantalla y que la red humana permanezca accesible debajo. Recorrido: `#/mentor` → chip «Finanzas → mercado bursátil mexicano» → **Explorar mi ruta** → **Explorar esta opción** en Intercambio → **Fijar en mi red** en Paula Ortiz → **Volver a Mentor Match** → abrir a Rodrigo Navarro. Capturas: `review/390-f5-mentor-*.png` y `review/1440-f5-mentor-*.png` (inicio, ruta, ruta con opción y profesor fijado, red de apoyo).

### F5A — Intereses de Pulse separados por eventos, artículos y oportunidades

**Estado: Revisada y completada; CP5A técnico aprobado y CP5A de producto cerrado (6 de octubre de 2026).** Ampliación solicitada por el usuario después de revisar el avance hasta F5. Esta guía la situaba antes de F6 y la regresión de F6 la incluye; al recibir «continue with F6» se integró dentro de la misma pasada de F6. Las revisiones de producto CP5A y CP6 quedaron cerradas con «F5A and F6 correct, close CP5A and CP6», y el usuario confirmó el cierre final con «marcalo como revisadas y completadas». Los resultados técnicos de F1–F5 permanecen como evidencia de sus versiones anteriores.

- [x] Separar el estado de preferencias en `topicsByCategory.events`, `.articles` y `.opportunities`; conservar `enabled`, `sectionOrder` y `sectionVisibility`.
- [x] Migrar la lista compartida actual a Eventos y Artículos. Inicializar Oportunidades explícitamente con Finanzas para la cuenta de ejemplo; no copiarle automáticamente intereses de lectura. Retirar la lista única como fuente de recomendaciones una vez realizada la conversión.
- [x] Añadir los tres grupos independientes a Preferencias y sus resúmenes a Mi perfil.
- [x] Añadir Psicología a la taxonomía y al menos un artículo ficticio de ese tema, con resumen y fuente completa local.
- [x] Clasificar las prácticas por área profesional del puesto y adaptar la selección de oportunidades recomendadas al tercer grupo.
- [x] Actualizar coincidencias y explicaciones por categoría: `events` → Eventos; `news` → Artículos; `opportunities` → Oportunidades. Los guardados usan el grupo del tipo de cada publicación.
- [x] Cubrir grupos vacíos, ausencia de oportunidades coincidentes, personalización desactivada, guardar/cancelar, retención de borradores y reinicio completo.
- [x] Actualizar pruebas, capturas y documentación antes de cerrar CP5A técnico.

**Alcance integrado de F5A:** `state.js` usa `pulsePreferences.topicsByCategory` (Eventos y Artículos con Finanzas, IA y Emprendimiento; Oportunidades con Finanzas) y añade `migratePulsePreferences` (convierte una lista única en Eventos y Artículos, deja Oportunidades vacía y conserva orden y visibilidad), `PULSE_GROUPS` y `hasPulseTopics`. `pulseMatchTopics` usa el grupo de cada categoría; para prácticas compara `professionalAreaIds` con las áreas elegidas, nunca los temas de lectura o eventos ni el sector de la empresa. En «Para ti», el widget de Oportunidades muestra solo ofertas de las áreas elegidas; si no hay coincidencias muestra **Ver todas las oportunidades** y **Editar mis áreas**. Un grupo vacío muestra contenido general con un acceso para configurarlo. Las razones indican el grupo: «Por tu interés en X · Eventos», «Por tu interés en X · Lecturas» y «Por tu área de búsqueda: X». La ficha de cada práctica aclara que coincidir no confirma elegibilidad.

**Datos de F5A:** tema **Psicología** (distinto de Salud); artículo ficticio «Cómo aprende tu mente: atención, descanso y memoria» (`mente-estudio`) con fuente local; `professionalAreaIds` en las prácticas (análisis financiero → Finanzas, marketing → Marketing, desarrollo web → Tecnología); y una cuarta práctica, «Practicante de finanzas · Mente Clara», puesto de Finanzas en un centro ficticio de bienestar psicológico, para mostrar que el área del puesto, no el sector, decide la coincidencia. Campus Pulse pasa a 20 publicaciones (9 eventos/talleres, 7 artículos y 4 prácticas).

**CP5A técnico:**

- Finanzas + lectura de Psicología: el artículo de Psicología se prioriza en Artículos; esa selección no cambia las áreas laborales ni recomienda una vacante de Psicología.
- Cambiar solo Eventos modifica sus recomendaciones, manteniendo Artículos y Oportunidades.
- Vaciar un grupo muestra contenido general de ese grupo sin borrar los demás.
- Un puesto financiero en una empresa de otro sector se clasifica por Finanzas; el sector no sustituye el área del puesto.
- **Todo el campus** mantiene acceso a todas las publicaciones. Las oportunidades fuera de las áreas elegidas no reciben una explicación de coincidencia falsa.
- Guardar/cancelar y reiniciar afectan correctamente los tres grupos; la migración conserva orden y visibilidad del dashboard.

**CP5A técnico — aprobado el 6 de octubre de 2026:** 16 pruebas específicas en `tests/f5a.test.cjs` cubren los seis criterios de arriba más migración, razones por grupo, resumen en Mi perfil y los tres grupos en Preferencias; la regresión integral F6 recorre el caso Finanzas / Psicología a 390 y 1440 px. Las pruebas que dependían de la lista única (`pulse-state`, `profile`, `pulse-content`, F1 y F2 de navegador) se actualizaron al contrato de tres grupos sin cambiar el comportamiento que verifican.

**CP5A producto — cerrado el 6 de octubre de 2026:** feedback del usuario: «F5A and F6 correct, close CP5A and CP6». La revisión prevista fue: revisar en móvil y web el caso «estudio Finanzas, leo Psicología y busco oportunidades de Finanzas». Comprobar que los tres grupos se entienden y que no se mezclan al guardar o al navegar. Recorrido: `#/profile/preferences` → quitar selecciones → IA en Eventos, Psicología en Lecturas, Finanzas en Oportunidades → **Guardar preferencias** → `#/pulse`. Capturas: `review/final-390-12-preferences-groups.png`, `review/final-1440-12-preferences-groups.png`, `review/final-390-13-pulse-reading-and-jobs.png` y `review/final-1440-13-pulse-reading-and-jobs.png`.

### F6 — Integración, regresión y entrega

**Estado: Revisada y completada; CP6 técnico aprobado y CP6 de producto cerrado (6 de octubre de 2026).**

- [x] Actualizar pruebas para nuevos tipos, rutas y estado; sustituir recuentos antiguos hardcodeados por expectativas de los nuevos ejemplos.
- [x] Completar los recorridos en móvil y escritorio, incluyendo perfil → preferencias → Pulse y meta → profesor fijado.
- [x] Incluir la separación de intereses de F5A y el caso Finanzas / lectura de Psicología en la regresión integral.
- [x] Revisar todas las vistas a 360, 390, 430, 768, 1024 y 1440 px.
- [x] Comprobar teclado, objetivos táctiles de 44 px, foco, contraste y ausencia de overflow.
- [x] Revisar conformidad de marca (ver «Conformidad con la estrategia de marca»): marcador de concepto/nombre de trabajo visible, estados con texto e icono además del color, radios en escala 4/8/12/24 px, peso SemiBold justificado o sustituido, un solo estilo de iconos.
- [x] Comprobar apertura local, fuentes incluidas, reset completo y refresh.
- [x] Revisar alcance y calidad; corregir hallazgos antes de registrar la entrega.
- [x] Actualizar README, capturas, resultados de pruebas y esta guía.

**Cambios de F6:**

- **Pruebas:** recuentos derivados de `data.js` en lugar de cifras fijas (personas, eventos, prácticas, profesores); las cifras de contenido de especificación siguen fijas en `pulse-content`. Nuevas: `tests/a11y.audit.test.cjs` (contraste AA de texto y placeholders frente a fondos sólidos y cada parada de degradado, colores sin interpretar, objetivos de 44 px, foco visible que cambia respecto al estado sin foco, un solo estilo de iconos, estados con icono y texto, texto de 12 px o más y errores de ejecución, en 44 estados de página a 390 y 1440 px), `tests/brand.test.cjs` (radios, tamaño mínimo, familias tipográficas, tokens y marcadores), `tests/f6-hardening.test.cjs` y `tests/f6.browser.test.cjs` (recorrido integral por los cuatro espacios, incluido el caso F5A, operación por teclado del asistente, persistencia entre áreas y recarga).
- **Accesibilidad:** todo texto de 7–11 px en `styles.css`, `pulse.css` y `profile.css` pasa a 12 px; chip de concepto y etiqueta de portada oscurecidos a `#4d597c`; placeholder e icono de búsqueda con contraste suficiente; anillo de foco del buscador en el color de acento y campo de 44 px; nombres en fichas de apoyo con objetivo de 44 px; separador «/» decorativo oculto a lectores; en teléfonos los campos usan 16 px para que iOS no haga zoom; el toast es visual (`aria-hidden`) y `#live` anuncia una sola vez; tras **Reiniciar demo** el foco vuelve al título.
- **Marca:** radios alineados a 4/8/12/24 px (50 % en avatares); SemiBold justificado (ver «Conformidad con la estrategia de marca»); el pie de página indica «nombre de trabajo sujeto a revisión institucional».
- **Robustez:** `resolveRoute` solo acepta las tres áreas, de modo que nombres internos como `#/constructor` o `#/__proto__` vuelven a Pulse en lugar de fallar.
- **Coherencia de Mentor Match:** el filtro del explorador ofrece solo temas de profesores; textos «mentoría» actualizados; el profesor fijado muestra «Fijado en tu red» además de la acción; las etiquetas Público/Privado del contacto llevan icono.

**CP6 técnico — aprobado el 6 de octubre de 2026:** 165 pruebas Node; navegador 107 heredadas, 109 F1, 97 F2, 145 F3, 131 F4, 163 F5 y 73 del recorrido integral F6; 108 comprobaciones de ruta/ancho/fuente a 360, 390, 430, 768, 1024 y 1440 px con apertura local, fuentes incluidas y cero overflow; auditoría de accesibilidad y marca sin hallazgos. Dos revisiones independientes: la de calidad no encontró hallazgos críticos y su hallazgo alto (rutas con nombres internos) y los medianos (puntos ciegos de la auditoría, zoom de iOS, anuncio doble) se corrigieron; la de especificación confirmó F1–F5 conforme y sus observaciones menores se corrigieron o se documentan abajo. En una de varias ejecuciones la suite F1 de navegador no imprimió resultado; tres ejecuciones seguidas posteriores pasaron, por lo que se registra como posible inestabilidad del entorno.

**Limitaciones conocidas (no bloquean la entrega):** el manejador de clics de `app.js` concentra muchas acciones y conviene dividirlo si el proyecto crece; las tarjetas de Talent y el perfil/solicitud de Mentor siguen en `app.js`; la fecha «Martes, 6 de octubre» del encabezado está escrita a mano; el estado vive en memoria y se modifica en sitio; algunos exports solo los usan las pruebas; los borradores de contacto/orientación no se borran tras enviar (la confirmación los oculta). Los profesores y alternativas de la ruta comparten la nota general de «Ejemplo de orientación» en lugar de una etiqueta por ficha.

**CP6 producto — cerrado el 6 de octubre de 2026:** feedback del usuario: «F5A and F6 correct, close CP5A and CP6». La revisión prevista fue: demo completa con datos ficticios y los cuatro espacios de experiencia. Entregar instrucciones de apertura y el estado final de los checkpoints. **Apertura:** abrir `index.html` directamente en el navegador (funciona como archivo local) o servir la carpeta con `python3 -m http.server 8765 --bind 127.0.0.1` y visitar `http://127.0.0.1:8765/`. **Reiniciar demo** o recargar restauran los datos de ejemplo. Galería final: `review/final-390-*.png` y `review/final-1440-*.png` (13 vistas por ancho, incluidas las de F5A). Estado de checkpoints: CP0–CP6, incluido CP5A, cerrados.

## 5. Protocolo para continuar en otra sesión

### Al empezar

1. Leer esta guía y el registro de continuidad de abajo.
2. Inspeccionar los archivos existentes; contrastar lo documentado con el código real.
3. Confirmar la última fase completada, sus comprobaciones y el feedback registrado.
4. Continuar únicamente la fase indicada o la parte solicitada por el usuario. No dar una fase por terminada porque exista una captura o un informe antiguo.
5. Conservar el diseño aprobado y los cambios ya revisados.

### Antes de terminar una sesión o acercarse al límite de uso

Actualizar el registro **mientras todavía se puede escribir**, aunque la fase esté incompleta. Registrar el último paso terminado, archivos editados, pruebas ejecutadas y resultado real, pendientes concretos y siguiente acción. Una fase parcial queda **En curso**, con una instrucción clara para continuar.

### Estados del registro

**Pendiente:** sin implementar. **En curso:** trabajo parcial. **En revisión:** entregable y sus comprobaciones listos para checkpoint. **Completada:** checkpoint cerrado con evidencia. **Revisada y completada:** implementación y revisión final confirmadas, con checkpoint cerrado. **Bloqueada:** falta una respuesta o dependencia concreta que impide continuar esa parte; otras partes independientes pueden avanzar.

| Fase | Estado al cierre | Resultado/evidencia | Siguiente paso |
|---|---|---|---|
| F0 | Revisada y completada | Guía revisada; personalización confirmada; usuario autorizó comenzar F1. | F0/CP0 cerrados. |
| F1 | Revisada y completada | Perfil, edición y preferencias integrados; 30 pruebas Node, 109 comprobaciones F1, 107 de regresión y 66 de layout aprobados; revisiones de alcance y calidad aprobadas; CP1 de producto cerrado. | F1/CP1 cerrados. |
| F2 | Revisada y completada | F2 integrada; CP2 técnico aprobado; 44 Node, 97 UI F2, 109 UI F1, 107 UI heredadas y 90 comprobaciones responsive registradas; revisiones independientes de especificación y calidad aprobadas sin hallazgos. CP2 de producto cerrado: el usuario pidió continuar con F3 sin ajustes. | F2/CP2 cerrados. |
| F3 | Revisada y completada | F3 integrada; CP3 técnico aprobado; 74 Node, 145 UI F3, 109 UI F1, 107 UI heredadas, 97 UI F2 y 102 de layout; revisión independiente sin hallazgos críticos ni altos y sus seis observaciones corregidas. CP3 de producto cerrado: «F3 correct, continue with F4». | F3/CP3 cerrados. |
| F4 | Revisada y completada | F4 integrada; CP4 técnico aprobado; 106 Node, 131 UI F4, 145 UI F3, 109 UI F1, 107 UI heredadas, 97 UI F2 y 102 de layout; revisión independiente sin hallazgos críticos y sus observaciones corregidas. CP4 de producto cerrado: escenario de agua sustituido por «App para el campus» y «F4 correct, continue with F5». | F4/CP4 cerrados. |
| F5 | Revisada y completada | F5 integrada; CP5 técnico aprobado; 140 Node, 163 UI F5, 131 UI F4, 145 UI F3, 109 UI F1, 107 UI heredadas, 97 UI F2 y 108 de layout; revisión independiente sin hallazgos críticos ni altos y sus observaciones corregidas. CP5 de producto cerrado: «F5 correct, continue with F6». | F5/CP5 cerrados. |
| F5A | Revisada y completada | Tres grupos independientes (Eventos, Lecturas, Oportunidades), Psicología, `professionalAreaIds` y práctica de Finanzas en otro sector; CP5A técnico aprobado con 16 pruebas específicas y el caso en la regresión integral. CP5A de producto cerrado: «F5A and F6 correct, close CP5A and CP6». | F5A/CP5A cerrados. |
| F6 | Revisada y completada | Regresión integral: 165 Node; 107, 109, 97, 145, 131, 163 y 73 en navegador; 108 de layout; auditoría de accesibilidad y marca sin hallazgos; dos revisiones independientes con sus hallazgos corregidos. CP6 de producto cerrado con el mismo feedback. | F6/CP6 cerrados; entrega completada. |

### Revisión final — 6 de octubre de 2026

- **Resultado:** todas las fases y checkpoints revisados y completados dentro del alcance del mockup.
- **Verificación de la revisión final:** 165 pruebas Node, 73 comprobaciones del recorrido integral F6 y 108 comprobaciones de ruta/ancho/fuente aprobadas; auditoría de accesibilidad y marca en 44 estados de página sin hallazgos. Se comprobó la separación de intereses entre Eventos, Lecturas y Oportunidades.
- **Confirmación del usuario:** «marcalo como revisadas y completadas».
- **Documentación:** corregida la frase de F5A que todavía describía CP5A y CP6 como pendientes; estados de la guía, README y registro de cambios sincronizados.
- **Pendientes de integración:** ninguno.

### Registro de continuidad actual

- **Última sesión:** 6 de octubre de 2026.
- **Último paso completado:** revisar la entrega completa y registrar todas las fases y checkpoints como revisados y completados con la confirmación final del usuario.
- **Archivos de producto modificados en F5A/F6:** `data.js` (Psicología, `mente-estudio`, `practica-finanzas-bienestar`, `professionalAreaIds`), `state.js`, `app.js`, `index.html`, `views/pulse.js`, `views/profile.js`, `views/mentor.js`, `styles.css`, `pulse.css`, `profile.css`, `mentor.css`. Pruebas nuevas: `f5a`, `brand`, `f6-hardening` (Node), `f6.browser` y `a11y.audit`; actualizadas `pulse-state`, `profile`, `pulse-content`, `f1.browser`, `f2.browser` (contrato de tres grupos) y varias suites para derivar recuentos de los datos.
- **Archivos de producto modificados en F5:** `data.js` (roles de apoyo de los cuatro contactos), `demo-ai.js`, `state.js`, `app.js`, `index.html`; añadidos `views/mentor.js` y `mentor.css`. Pruebas nuevas: `career-ai`, `f5-state`, `mentor-view` (Node) y `f5.browser`; actualizadas `browser.test.cjs` (tema y enlace de Mentor Match), `profile.test.cjs` (forma inicial de `careerAssistant`) y `layout.test.cjs` (`#/mentor/plan`).
- **Archivos de producto modificados en F4 (histórico):** `state.js`, `app.js`, `index.html`; añadidos `demo-ai.js`, `views/talent.js` y `talent.css`. Pruebas nuevas: `demo-ai`, `f4-state`, `talent-view` (Node) y `f4.browser`.
- **Archivos de producto modificados en F3 (histórico):** `data.js` (`applyMode` en `practica-finanzas`), `state.js`, `app.js`, `index.html`, `pulse.css`, `views/pulse.js`; añadidos `calendar.js` y `views/pulse-actions.js`. Pruebas nuevas: `f3-state`, `calendar`, `pulse-actions-view` (Node) y `f3.browser`; `layout.test.cjs` suma las dos rutas nuevas.
- **Fase/estado:** todas las fases (F0–F6, incluida F5A) revisadas y completadas; todos los checkpoints (CP0–CP6, incluido CP5A) revisados y cerrados. Confirmación final del usuario el 6 de octubre de 2026: «marcalo como revisadas y completadas». El mockup queda entregado.
- **Siguiente acción concreta:** ninguna pendiente. Si se piden cambios nuevos, añadirlos como una fase nueva en esta guía, implementarlos y repetir la regresión de la sección 6.
- **Verificación final registrada para F5A/F6:** ver «CP5A técnico — aprobado» y «CP6 técnico — aprobado».
- **Verificación final registrada para F5 (histórico):** ver «CP5 técnico — aprobado».
- **Verificación final registrada para F4 (histórico):** ver «CP4 técnico — aprobado».
- **Verificación final registrada para F3 (histórico):** ver «CP3 técnico — aprobado».
- **Registro histórico de F2:** CP2 técnico aprobado, CP2 de producto cerrado con la autorización del usuario para pasar a F3.
- **Último paso completado en F2 (histórico):** integrar F2, resolver los tres hallazgos de calidad y aprobar CP2 técnico; F1/CP1 se completó previamente.
- **Archivos de producto modificados en F2:** `data.js`, `state.js`, `ui.js`, `app.js`, `index.html`, `views/profile.js`; añadidos `views/pulse.js`, `pulse.css`, `demo-source.html`, `demo-source.js`; pruebas Node, render y navegador ampliadas. `styles.css` y `profile.css` no se modificaron en F2.
- **Decisión confirmada:** personalización de temas, orden y visibilidad, elegida por el usuario en esta sesión.
- **Verificación final registrada para F2:** 44 pruebas Node; 97 comprobaciones UI F2 a 390/1440 px; 109 UI F1; 107 UI heredadas; 90 comprobaciones de 13 instancias de rutas SPA más dos tipos de fuente local, en seis anchos. Apertura local y fuentes correctas; cero errores de ejecución y cero overflow. Revisiones de especificación y calidad aprobadas sin hallazgos pendientes. Capturas en `review/390-pulse.png`, `review/1440-pulse.png`, `review/390-source-article.png`, `review/1440-source-article.png`, `review/390-source-opportunity.png`, `review/1440-source-opportunity.png`; informe `review/layout-check.json`.
- **Hallazgos pendientes de v1:** ninguno registrado al cierre de la implementación anterior.
- **Hallazgo resuelto de F1:** el filtro de Talent vuelve a «Todas las habilidades» si desaparece su opción tras editar habilidades propias o desactivar colaboración/descubrimiento. Cubierto por cuatro pruebas de estado y la regresión de navegador.

### CP1 — 6 de octubre de 2026 — Completado

- **Fase y estado:** F1 integrada; checkpoints técnico y de producto aprobados y cerrados.
- **Integrado:** perfil propio, edición, proyectos/habilidades, contacto y visibilidad, colaboración/descubrimiento, temas y preferencia de personalización, identidad de cuenta dinámica y reinicio completo.
- **Archivos:** `state.js`, `app.js`, `index.html`, `ui.js`, `views/profile.js`, `profile.css`; pruebas y documentación actualizadas.
- **Comprobaciones:** 30 Node, 109 navegador F1, 107 regresión original, 66 vista/tamaño; todas aprobadas en Chromium. Revisiones independientes de alcance y calidad sin hallazgos pendientes.
- **Capturas:** `review/390-profile.png`, `review/1440-profile.png`, `review/390-profile-edit.png`, `review/1440-profile-edit.png`, `review/390-profile-preferences.png`, `review/1440-profile-preferences.png`.
- **Recorrido para revisar:** abrir avatar → editar descripción → añadir proyecto y habilidad → guardar → comprobar visibilidad pública → elegir temas y guardar preferencias.
- **Feedback del usuario:** «Perfecto, sigamos fase 2».
- **Resultado de producto:** CP1 cerrado; el usuario autorizó continuar con F2.
- **Siguiente acción:** (histórico al cierre de CP1) el usuario aprobó F1/CP1 con «Perfecto, sigamos fase 2»; F2 y CP2 se registran arriba.

### Plantilla para cada checkpoint

```md
### CPn — fecha
- Fase y estado:
- Qué quedó integrado:
- Archivos editados:
- Comprobaciones ejecutadas y resultados:
- Capturas o recorrido de revisión:
- Feedback del usuario y ajustes acordados:
- Pendientes concretos:
- Siguiente acción y archivo/punto de entrada:
```

## 6. Comprobaciones y puntos de cuidado conocidos

Desde el directorio del mockup:

```sh
node --test tests/state.test.cjs tests/profile.test.cjs tests/profile-view.test.cjs tests/pulse-state.test.cjs tests/pulse-content.test.cjs tests/f3-state.test.cjs tests/calendar.test.cjs tests/pulse-actions-view.test.cjs tests/demo-ai.test.cjs tests/f4-state.test.cjs tests/talent-view.test.cjs tests/career-ai.test.cjs tests/f5-state.test.cjs tests/mentor-view.test.cjs tests/brand.test.cjs tests/f6-hardening.test.cjs tests/f5a.test.cjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Con Playwright disponible para Node y el servidor activo:

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

Estos comandos reproducen los resultados registrados para F6 (165 pruebas Node; 107 UI heredadas, 109 UI F1, 97 UI F2, 145 UI F3, 131 UI F4, 163 UI F5 y 73 del recorrido integral F6; 108 de layout; auditoría de accesibilidad y marca sin hallazgos). Si la copia de Chromium de Playwright no coincide con su versión, indica un ejecutable existente con `TEC_CHROMIUM`. Cada fase nueva debe añadir sus archivos de prueba a esta lista.

Los scripts aceptan `TEC_URL` y `TEC_CHROMIUM`, según README. Si ya existe un servidor en el puerto, usarlo o elegir otro y configurar `TEC_URL`; no iniciar un servidor duplicado.

Preservar las correcciones comprobadas en v1:

- «Limpiar filtros» afecta únicamente al área actual.
- La confirmación de envío restaura scroll a cero después del render.
- El foco vuelve al control reemplazado o al campo adecuado.
- El enlace de saltar al contenido no modifica la ruta.
- El cambio de layout no borra borradores ni posiciones guardadas de listas.
- Las nuevas preferencias, solicitudes, consultas y pines participan en **Reiniciar demo**.

Cada fase añade pruebas de sus comportamientos reales. Los cambios documentales por sí solos no requieren volver a ejecutar la suite de la aplicación.
