# Innovation

Repositorio de dos prototipos web conceptuales para explorar experiencias digitales para estudiantes del Tec de Monterrey, campus CEM. Son demos locales: los perfiles, publicaciones, espacios, horarios y operaciones son ficticios; no representan servicios oficiales ni se conectan a sistemas institucionales.

## Proyectos

- [Smart Campus v1](smart-campus-v1/README.md): ayuda a explorar espacios y servicios del campus, revisar laboratorios, planear una reserva de biblioteca y registrar una visita simulada al gimnasio.
- [Tec Conect v1](tec-conect-v1/README.md): reúne una experiencia de comunidad con eventos, artículos y oportunidades, además de herramientas conceptuales de talento, mentoría y perfil estudiantil.

Cada carpeta incluye el código de su demo, una guía de integración, pruebas y capturas de revisión. Consulta el README de cada proyecto para conocer sus recorridos y detalles.

## Requisitos

- Un navegador moderno.
- Python 3 solo si prefieres abrir las demos mediante un servidor local.
- Node.js es opcional y se usa únicamente para ejecutar las pruebas descritas en cada README.

No se necesita `npm install`, compilación, backend ni conexión a Internet para abrir las demos. También puedes abrir directamente el `index.html` de cada proyecto.

## Ejecutar Smart Campus v1

Desde la raíz del repositorio:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory smart-campus-v1
```

Abre <http://127.0.0.1:8766/>.

## Ejecutar Tec Conect v1

En otra terminal, también desde la raíz del repositorio:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory tec-conect-v1
```

Abre <http://127.0.0.1:8765/>. Puedes detener cada servidor con `Ctrl+C`.

## Notas

- Las acciones se simulan en el navegador y los cambios de estado no sobreviven a una recarga, salvo donde la propia demo indique lo contrario.
- Los asistentes usan ejemplos guionados; no llaman a un servicio de IA.
- Los nombres son de trabajo y los prototipos no implican aval institucional.
- Las fuentes e iconos locales incluyen sus licencias en las carpetas `assets/` de cada proyecto.
