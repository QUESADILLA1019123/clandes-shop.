# CLANDES PREMIUM — paquete base

**Versión:** 15 octubre 2026. **Costo adicional:** $0 MXN (sujeto a cuotas gratuitas existentes).

## Contenido
- `index.html`: portada del proyecto.
- `tienda.html`: catálogo público dinámico (por defecto usuario `berrydigital`, o `?usuario=otro`).
- `panel-vendedor.html`: acceso con Supabase Auth, editor de 24 colores, plantillas, URL de fondo de imagen/video, vista previa, alta/edición de productos, activación y carga de stock.
- `assets/`: CSS, scripts y conexión a Supabase.
- `supabase/`: SQL opcional para columnas y SQL de consulta de políticas.

## Instalación desde Android / GitHub
1. Descomprime el ZIP en tu celular.
2. Abre el repositorio GitHub donde está tu sitio (verifica su nombre exacto).
3. Sube **el contenido de la carpeta** a la raíz del repositorio: `index.html`, `tienda.html`, `panel-vendedor.html`, `assets/` y, opcionalmente, `supabase/`.
4. Si GitHub te pregunta si reemplazar los archivos existentes, revisa primero: este paquete reconstruye esos tres HTML, no incluye todos los otros archivos históricos del repositorio. No elimines otros archivos existentes como `panel-maestro.html`.
5. En GitHub Pages, usa la rama y carpeta raíz configuradas actualmente. Espera la publicación.
6. Abre `panel-vendedor.html` en el sitio publicado. Inicia sesión con un usuario de **Supabase Auth** cuyo ID figure en `tiendas.propietario_id` y con tienda activa.
7. Si tu base de datos no tiene `productos.imagen_url` o `productos.video_url`, revisa y ejecuta `supabase/01-columnas-opcionales.sql` en SQL Editor. Las columnas de `tiendas` ya fueron añadidas anteriormente.
8. Ejecuta `supabase/02-revision-seguridad.sql` para inspeccionar RLS; **no publiques para terceros sin comprobar las políticas**.

## Limitaciones reales
- **No hay pago, checkout, ni entrega automática**. La página es un catálogo.
- Las opciones de plantilla guardan el nombre y el color, pero no son aún 5 diseños visuales completamente diferentes. La vista previa y el catálogo aplican color y fondo multimedia.
- **No hay carga directa de imágenes o videos**. Se admiten enlaces HTTPS públicos. Para subir archivos se debe configurar Supabase Storage con reglas de propietario y cuotas.
- La página pública muestra solo productos activos; la disponibilidad depende del campo `stock` existente.
- Insertar códigos en `inventario_digital` no garantiza que el campo `productos.stock` se actualice: eso depende de triggers o lógica existente en la base de datos.
- No se garantiza el esquema exacto de la base: revisa nombres y tipos de columnas antes de ejecutar SQL o cargar datos reales.
- No se incluye el panel maestro existente, ni se ha conectado el servidor Cafirexos.
- No se ha probado la conexión en vivo con la cuenta del usuario; hay que comprobar la instalación tras subirla.

## Seguridad importante
- `assets/config.js` contiene solo la **clave pública publishable**; nunca pongas `service_role`, `sb_secret_` ni contraseñas privadas en GitHub.
- Los filtros `.eq('tienda_id', ...)` en el navegador **no sustituyen RLS**. La base de datos debe limitar todas las escrituras a tiendas del usuario autenticado y evitar la lectura pública de códigos de inventario.
- `tiendas.propietario_id` debe vincularse con `auth.users.id`. Si está vacío, el vendedor no podrá entrar a su tienda.
- El catálogo requiere permisos de lectura pública **limitados** a tiendas activas y productos activos; no permitas acceso público a `inventario_digital`.
- Los enlaces multimedia deben ser HTTPS y estar autorizados para su publicación.
