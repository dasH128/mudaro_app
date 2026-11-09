# Mudaro · Requisitos del MVP

Versión 0.2 · 09/11/2026 (versión 0.1 del 21/10/2026)
Documento de referencia: *Mudaro · Modelo de negocio y dominio (MVP transportistas)*. El modelo de datos vigente, con pedido y envío separados, está en `docs/diagram/mudaro-model.dbml` y su construcción por pasos en `docs/plan-modelo-bd.md`.

---

## 1. Objetivo del MVP

Que una empresa de mudanzas pase de una llamada a un presupuesto aceptado y a una mudanza documentada sin salir de la herramienta, y que lo haga más rápido que con su método actual (WhatsApp, libreta, visita).

El MVP se considera validado cuando, en un piloto con 5 a 10 empresas de una misma región:

- Al menos la mitad de las empresas usa la herramienta en todos sus presupuestos durante 4 semanas seguidas.
- El tiempo medio desde que se crea el pedido hasta que se envía el presupuesto baja respecto al método actual de cada empresa (medido en las entrevistas previas).
- La diferencia media entre horas estimadas y horas reales queda por debajo del 20 %.
- Al menos 3 empresas aceptan pagar una suscripción al terminar el piloto.

Estos umbrales son una propuesta inicial y se ajustan tras las entrevistas.

---

## 2. Alcance

### Dentro del MVP

- Alta de empresa, equipo, vehículos, tarifas y servicios extra.
- Catálogo de objetos con volúmenes.
- Pedidos con enlace para que el cliente rellene su inventario.
- Cálculo automático de volumen, recursos, precio, coste y margen.
- Presupuesto profesional y aceptación con firma.
- Agenda de trabajos con asignación de vehículos y operarios.
- Registro fotográfico, actas de recogida y entrega, incidencias.
- Cierre del trabajo con horas reales y exportación de datos para facturar.

### Fuera del MVP

- Marketplace (varias empresas cotizando el mismo pedido). El modelo ya separa pedido y envío para permitirlo más adelante sin rehacerlo.
- Pagos, señales y retención de importes.
- Facturación propia (en Portugal requiere software certificado).
- Optimización de rutas y viajes de regreso.
- Valoraciones públicas de empresas.
- App para el cliente final con cuenta propia.

---

## 3. Actores y roles

| Actor | Acceso | Puede |
| --- | --- | --- |
| Administrador | App con cuenta | Todo lo de su empresa: configuración, precios, márgenes, pedidos, presupuestos, agenda |
| Operario | App con cuenta | Ver sus trabajos asignados, subir fotos, recoger firmas, registrar incidencias. No ve precios ni márgenes |
| Cliente final | Enlace web con token, sin cuenta | Rellenar inventario, ver el presupuesto, aceptarlo y firmar actas |
| Equipo Mudaro | Panel interno | Mantener el catálogo global, dar de alta empresas del piloto, soporte |

---

## 4. Arquitectura y stack

| Pieza | Tecnología propuesta | Uso |
| --- | --- | --- |
| App de la empresa | Flutter (iOS, Android) | Administrador y operarios |
| Web del cliente | React with Next.js | Inventario, presupuesto y aceptación desde el enlace |
| Panel interno | Web con Next.js (`apps/admin`, admin.mudaro.pt) | Equipo Mudaro: alta de empresas del piloto, catálogo global y soporte |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions | Datos, autenticación, fotos, lógica del enlace del cliente |
| Seguridad | RLS por `company_id` | Aislamiento total entre empresas |
| Rol de plataforma | Tabla `platform_users` (o claim equivalente), con MFA obligatorio | Separa al equipo Mudaro de los usuarios de empresa (`administrador`, `operario`). Lo privilegiado pasa por Edge Functions que validan el rol; el panel no usa la clave de servicio |
| Mapas | Servicio de geocodificación y rutas (a decidir) | Coordenadas, km y tiempo de viaje |
| PDF | Edge Function | Generar el presupuesto y las actas |
| Envío al cliente | Enlace compartido con la hoja nativa del móvil (WhatsApp, SMS, email) | Sin integración con la API de WhatsApp en el MVP |

---

## 5. Requisitos funcionales

Prioridad:
- **P0**: imprescindible para el piloto.
- **P1**: deseable en el MVP; se entrega si el calendario lo permite.
- **P2**: después del piloto.

### M1 · Empresa y equipo

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-01 | Registro de empresa con email y contraseña | P2 | El primer usuario queda como administrador de la empresa creada. Durante el piloto las empresas no se registran solas: las da de alta el equipo Mudaro (RF-65) |
| RF-02 | Perfil de empresa: nombre, NIF, logo, contacto | P0 | El logo y los datos aparecen en el presupuesto PDF |
| RF-03 | Invitar operarios por email o enlace | P0 | El invitado crea su cuenta y queda con rol operario en esa empresa |
| RF-04 | Cambiar rol y desactivar usuarios | P1 | Un usuario desactivado no puede iniciar sesión |

### M2 · Configuración

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-05 | Alta, edición y baja de vehículos con capacidad (m³), carga máxima (kg) y coste por km | P0 | Un vehículo inactivo no se propone en cálculos ni en la agenda |
| RF-06 | Configurar tarifa: precio y coste por hora de operario, precio por km, suplementos por piso y aparcamiento, mínimo por servicio, factor de estiba, velocidad media, IVA | P0 | Guardar cambios crea una versión nueva; los presupuestos enviados conservan la versión con la que se calcularon |
| RF-07 | Catálogo de servicios extra con modo de precio (fijo, por unidad, por m³, por hora) | P0 | Los extras activos aparecen en el inventario del cliente. Pendiente de análisis: cómo se eligen los extras cuando un pedido llega a varias empresas (sección 11) |
| RF-08 | Asistente de configuración inicial con valores por defecto | P1 | Una empresa nueva puede crear su primer presupuesto en menos de 10 minutos desde el registro |
| RF-09 | Ajustar volumen o peso de un objeto del catálogo solo para la empresa | P1 | El ajuste se usa en los cálculos de esa empresa y no afecta a las demás |

### M3 · Catálogo de objetos

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-10 | Catálogo global con categorías y objetos, cada uno con volumen, peso, minutos de manipulación y marcas (frágil, desmontaje, especial) | P0 | Catálogo inicial cargado con los objetos domésticos más habituales, revisado con al menos 2 transportistas |
| RF-11 | Búsqueda de objetos por nombre en PT, ES y EN | P0 | Buscar "sofá" o "sofa" devuelve los sofás del catálogo |
| RF-12 | Panel interno para mantener el catálogo | P1 | El equipo Mudaro puede añadir y corregir objetos sin desplegar código |

### M4 · Pedidos

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-13 | Crear pedido con nombre, teléfono, origen, destino y fecha aproximada | P0 | Se completa en 30 segundos o menos desde el móvil. El formulario crea el pedido y su envío a la empresa que lo crea |
| RF-14 | Reutilizar un cliente existente al crear el pedido | P1 | Al escribir el teléfono, sugiere el cliente si ya existe en la empresa. La ficha del cliente se vincula al envío, no al pedido |
| RF-15 | Generar enlace único con token y caducidad configurable | P0 | El enlace pertenece al pedido, no al envío. Caduca a los 7 días por defecto y se puede reenviar. Caducado, muestra un aviso y no permite editar el inventario; el cliente sigue pudiendo ver y aceptar un presupuesto vigente |
| RF-16 | Compartir el enlace del pedido con un mensaje predefinido | P0 | Abre la hoja de compartir del móvil con el texto y el enlace listos |
| RF-17 | Lista de envíos filtrable por estado | P0 | Muestra los estados del ciclo de vida del envío. Un pedido y su envío tienen el mismo número para la empresa |
| RF-18 | Recordatorio cuando el cliente no completa el inventario en X días | P1 | Se aplica por envío. Notificación al administrador con opción de reenviar el enlace |
| RF-19 | Rellenar el inventario desde la app (por teléfono o en visita) | P0 | Queda registrado como inventario rellenado por la empresa |
| RF-69 | Cancelar un pedido | P0 | Cancelar el pedido cancela su envío (o envíos) y avisa a las empresas afectadas. Un envío cancelado no se puede reactivar: hay que crear un pedido nuevo |

**Pedido y envío.** El pedido es la mudanza: direcciones, fecha, contacto del cliente, inventario y enlace. El envío es el pedido enviado a una empresa: lleva el estado y los presupuestos de esa empresa. En el MVP cada pedido tiene un solo envío. El modelo ya los separa para que, en fases posteriores, un mismo pedido pueda llegar a varias empresas.

- **Estados del envío:** nueva, esperando inventario, inventario recibido, presupuestada, ganada, perdida y cancelado. "Perdida" (el cliente no aceptó) y "cancelado" (se anula el pedido) son distintos y se miden por separado.
- **Propiedad:** el pedido creado por una empresa pertenece a esa empresa. La empresa ve su pedido y su envío, nunca los de otras.
- **Enlace:** único por pedido, caduca a los 7 días por defecto (configurable) y es reenviable. La caducidad solo impide editar el inventario.
- **Precios:** los precios de una empresa nunca se muestran a otra. El cliente ve los presupuestos que ha recibido; en el MVP solo recibe uno.
- **Cuenta de cliente y reclamación:** son de la fase 3 (sección 10) y no están en este MVP. El modelo ya permite el paso.

### M5 · Inventario del cliente (web)

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-20 | Recorrido por habitaciones con objetos del catálogo y cantidades | P0 | El cliente añade, modifica y elimina objetos sin registrarse |
| RF-21 | Añadir objetos libres con descripción y medidas aproximadas | P0 | El objeto libre pide volumen o medidas; si no se dan, se marca para revisión |
| RF-22 | Subir fotos por objeto o por habitación | P0 | Las fotos se comprimen en el dispositivo antes de subir |
| RF-23 | Condiciones de acceso de cada dirección: piso, ascensor y tamaño, escaleras estrechas, distancia al aparcamiento, permiso de aparcamiento | P0 | Campos obligatorios antes de enviar |
| RF-24 | Selección de servicios extra de la empresa | P0 | Solo aparecen los extras activos. Pendiente de análisis: ver sección 11 |
| RF-25 | Guardado automático del borrador | P0 | Cerrar y reabrir el enlace conserva lo introducido |
| RF-26 | Enviar inventario | P0 | Pasa el envío a Inventario recibido y notifica a la empresa |
| RF-27 | Modificar el inventario tras recibir presupuesto | P1 | Cualquier cambio que afecte al cálculo (objetos, cantidades, volúmenes, pesos) o a los accesos (piso, ascensor, aparcamiento, escaleras) crea una versión nueva del inventario; los cambios de fotos o notas no. Los presupuestos enviados que usaban la versión anterior pasan a Sustituido, el envío vuelve a Inventario recibido y la empresa debe presupuestar sobre la versión nueva. La versión nueva copia los ajustes manuales de la anterior y marca las líneas cuya base ha cambiado. Si el cambio llega después de aceptar: antes de la mudanza, la empresa genera un presupuesto nuevo que el cliente debe volver a aceptar (el aceptado sigue vigente hasta entonces, el envío no vuelve atrás de Ganada y el trabajo no se recrea); el día de la mudanza, se registra como incidencia con importe y firma del cliente (RF-53, RF-54) |
| RF-28 | Interfaz en portugués, español e inglés | P0 PT, P1 ES y EN | Idioma detectado por el navegador y seleccionable |
| RF-29 | Grabar un vídeo corto por habitación | P2 | Vídeo de hasta 60 s visible para la empresa |

### M6 · Motor de cálculo

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-30 | Calcular volumen total ajustado con el factor de estiba | P0 | Coincide con la suma manual de líneas × factor |
| RF-31 | Proponer vehículos según capacidad y número de viajes si no cabe | P0 | Elige la combinación más pequeña que cubre el volumen |
| RF-32 | Proponer número de operarios | P0 | Regla por tramos de volumen y objetos especiales, editable a mano |
| RF-33 | Estimar horas de carga y descarga con factor de acceso | P0 | Cambiar piso o ascensor modifica las horas estimadas |
| RF-34 | Calcular km y tiempo de viaje con el servicio de mapas | P0 | Incluye trayecto desde y hasta la base de la empresa |
| RF-35 | Calcular precio sugerido, coste estimado y margen | P0 | Aplica el mínimo por servicio si el precio queda por debajo |
| RF-36 | Mostrar alertas: sin ascensor, objetos especiales, aparcamiento lejano, objetos libres sin medidas | P0 | Las alertas aparecen antes de enviar el presupuesto |
| RF-37 | Ajustar manualmente cualquier valor calculado | P0 | Se guardan el valor sugerido y el final |

### M7 · Presupuesto

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-38 | Generar presupuesto con logo, líneas desglosadas, IVA, total, validez, qué incluye y qué no | P0 | Disponible como página web y como PDF |
| RF-39 | Anexar el inventario al presupuesto | P0 | El anexo muestra la versión exacta usada en el cálculo |
| RF-40 | Plantilla de condiciones editable por la empresa | P1 | Las condiciones se copian en cada presupuesto al enviarlo |
| RF-41 | Enviar el presupuesto por el enlace del pedido | P0 | El cliente lo ve al abrir el enlace del pedido |
| RF-42 | Versionado de presupuestos | P0 | Un presupuesto enviado no se edita; cambiarlo crea una versión nueva |

### M8 · Aceptación

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-43 | Aceptar el presupuesto con nombre y firma dibujada | P0 | Se guardan firma, fecha y hora, IP y huella del documento |
| RF-44 | Rechazar el presupuesto con motivo opcional | P1 | La empresa ve el motivo |
| RF-45 | Caducidad automática de presupuestos | P0 | Pasada la validez, no se puede aceptar |
| RF-46 | Al aceptar, crear el trabajo y pasar el envío a Ganada | P0 | El trabajo aparece en la agenda en estado Programado |

### M9 · Agenda

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-47 | Calendario de trabajos por día y semana | P0 | Muestra trabajos con vehículos y operarios asignados |
| RF-48 | Asignar vehículos y operarios a un trabajo | P0 | La base de datos rechaza asignaciones que se solapan |
| RF-49 | Vista del operario: mis trabajos de hoy | P0 | El operario solo ve sus trabajos, sin precios |
| RF-50 | Reprogramar o cancelar un trabajo | P1 | Cancelar libera las asignaciones |

### M10 · Ejecución de la mudanza

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-51 | Iniciar el trabajo y hacer fotos de recogida | P0 | Cada foto guarda fecha, hora, ubicación y autor |
| RF-52 | Acta de recogida firmada por el cliente en el móvil del operario | P0 | El trabajo pasa a En curso |
| RF-53 | Registrar incidencias: daño, objeto no declarado, retraso, acceso | P0 | Incluye fotos e importe adicional si aplica |
| RF-54 | Firma del cliente sobre una incidencia con importe | P1 | La incidencia queda aceptada o en disputa |
| RF-55 | Fotos y acta de entrega | P0 | El trabajo pasa a Entregado |
| RF-56 | Funcionamiento sin conexión | P0 | Fotos y firmas se guardan en el dispositivo y se sincronizan al recuperar la conexión |
| RF-57 | Evidencias y actas inmutables tras cerrar el trabajo | P0 | No hay opción de borrar ni editar; la base de datos lo impide |

### M11 · Cierre y datos

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-58 | Registrar horas y km reales | P0 | Obligatorio para pasar a Cerrado |
| RF-59 | Cerrar el trabajo | P0 | Solo si no quedan incidencias abiertas |
| RF-60 | Exportar trabajos cerrados a CSV para facturar | P0 | Incluye cliente, NIF, líneas, extras, IVA y total |
| RF-61 | Informe de estimado frente a real por empresa | P1 | Muestra desviación media de horas y de precio |
| RF-62 | Expediente PDF del trabajo (presupuesto, actas, fotos, incidencias) | P1 | Descargable desde el trabajo cerrado |

### M12 · Notificaciones

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-63 | Notificación push a la empresa cuando el cliente envía inventario o acepta | P0 | Llega en menos de 1 minuto. Se envía por envío |
| RF-64 | Email al cliente con copia del presupuesto aceptado y de las actas | P1 | Se envía solo si el cliente dio su email |

### M13 · Panel interno (equipo Mudaro)

Durante el piloto las empresas no se registran solas: el equipo Mudaro las da de alta (ver `architecture-system.md`, sección "Alta de empresas del piloto").

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-65 | Alta de empresa desde el panel interno, con invitación al administrador por email o enlace | P0 | La empresa queda en estado "Convite pendente", sin usuarios activos, y el administrador recibe el convite. Si el equipo desmarca "Enviar o convite por email agora", el convite se envía después copiando el enlace |
| RF-66 | Lista de empresas del piloto con estado calculado (convite pendente, em configuração, ativa, desativada), contador por estado, filtro por estado y búsqueda por nombre, NIF o email | P0 | El estado no se guarda: se calcula con las reglas de "Estado de la empresa". Los filtros y la búsqueda se reflejan en la URL |
| RF-67 | Detalle de empresa: convite del administrador (copiar enlace, reenviar email, generar enlace nuevo), utilizadores, progreso de configuración, verificación IMT y contrato RGPD, datos e histórico | P0 | El convite caduca a los 7 días (valor provisional). Reenviar actualiza la fecha de envío y la caducidad; generar un enlace crea uno nuevo. Ambas acciones quedan en el histórico (RNF-08) |
| RF-68 | Desactivar y reactivar una empresa desde el panel interno | P1 | Desactivar exige un motivo, que queda en el histórico. Los usuarios de una empresa desactivada no pueden entrar en la app. Reactivar no pide motivo |

**Reglas de validación del formulario de alta (RF-65).** Se aplican en servidor con zod; el cliente solo ayuda. Los mensajes se muestran en portugués de Portugal junto a cada campo.

| Campo | Obligatorio | Regla |
| --- | --- | --- |
| Nome comercial | Sí | Texto no vacío (sin contar espacios al principio y al final) |
| NIF | Sí | 9 dígitos con dígito de control correcto (módulo 11). No se restringe el primer dígito, para admitir empresarios en nombre individual |
| Telefone, Telemóvel del administrador | No | Si se rellena: 9 dígitos, con prefijo `+351` opcional y espacios permitidos |
| Email geral | No | Si se rellena: formato de email válido |
| Email del administrador | Sí | Formato de email válido. Es la dirección a la que llega el convite |
| Nome del administrador | Sí | Texto no vacío |
| Morada da base | No | Puede quedar en blanco; el administrador la confirma en el asistente de configuración |
| Fecha de verificación IMT y fecha de firma del contrato RGPD | Solo si su casilla está marcada | Formato `dd/mm/aaaa`, fecha real y no futura. Si se rellena sin marcar la casilla, también debe cumplir el formato |
| Referencia IMT y versión del contrato | No | Texto libre |
| Região, origem, notas internas | No | Região: una de las regiones del piloto (lista cerrada, aún por definir). Origem y notas: texto libre; las notas solo las ve el equipo Mudaro |

Se puede crear la empresa sin la verificación IMT ni el contrato RGPD (RNF-04), pero no se puede activar hasta tenerlos.

**Estado de la empresa (RF-66).** Se calcula en este orden:

| Estado | Condición |
| --- | --- |
| Desativada | Tiene fecha de desactivación (gana a todo lo demás) |
| Convite pendente | No está desactivada y el administrador no ha aceptado el convite |
| Em configuração | Convite aceptado y falta alguno de los 4 pasos obligatorios, la licencia IMT o el contrato RGPD |
| Ativa | Convite aceptado, 4 pasos obligatorios completos, licencia IMT verificada y contrato RGPD registrado |

Pasos obligatorios de configuración: cuenta del administrador, perfil de la empresa, vehículos y tarifa. "Serviços extra" es opcional y se muestra como hecho cuando los 4 anteriores están completos.

**Pendiente en el detalle de empresa (RF-67), sin flujo diseñado todavía:** editar datos de la empresa, registrar la licencia IMT o el contrato RGPD después del alta, y desactivar o consultar un utilizador concreto. En la maqueta estos botones se muestran inertes. Reenviar el convite sí funciona, también para operarios con convite pendente.

---

## 6. Requisitos no funcionales

| ID | Área | Requisito |
| --- | --- | --- |
| RNF-01 | Aislamiento | Todas las tablas con datos de empresa tienen RLS por `company_id`. Excepción: `orders`, `addresses`, `inventories`, `inventory_lines` e `inventory_extras` pertenecen al pedido y no llevan `company_id` propio (`orders` guarda `created_by_company_id`, que no se usa para la RLS); una empresa solo los lee si tiene un envío (`shipments`) en ese pedido. Ninguna consulta desde la app puede devolver datos de otra empresa |
| RNF-02 | Acceso del cliente | El enlace pertenece al pedido y usa un token aleatorio de al menos 32 bytes, con caducidad. Solo se guarda el hash del token. Solo las Edge Functions acceden a los datos con clave de servicio, tras validar el token |
| RNF-03 | Privacidad de precios | Tarifas, costes y márgenes nunca se envían al cliente ni al rol operario. Los precios de una empresa nunca se muestran a otra. El cliente ve los presupuestos que ha recibido |
| RNF-04 | RGPD | Contrato de encargo de tratamiento con cada empresa, política de privacidad para el cliente final y plazo de conservación de fotos y firmas configurable |
| RNF-05 | Almacenamiento | Fotos y firmas en un bucket privado con URLs firmadas y temporales |
| RNF-06 | Rendimiento | La web del cliente es usable en menos de 3 s con 4G en un móvil de gama media |
| RNF-07 | Offline | La app del operario funciona sin conexión durante toda la mudanza |
| RNF-08 | Auditoría | Cambios de estado, envíos y aceptaciones quedan registrados con usuario y hora |
| RNF-09 | Copias de seguridad | Copias diarias de la base de datos con restauración probada antes del piloto |
| RNF-10 | Idioma y formato | Interfaz en portugués como primer idioma. Euros, formato de fecha y números de Portugal |
| RNF-11 | Dispositivos | App en iOS y Android recientes. Web del cliente en Safari y Chrome móviles |
| RNF-12 | Observabilidad | Registro de errores en app y Edge Functions, con alertas al equipo |

---

## 7. Modelo de datos

El modelo vigente está en `docs/diagram/mudaro-model.dbml` (nombres en inglés, comentarios en español) y su construcción por pasos en `docs/plan-modelo-bd.md`. Puntos que la implementación debe respetar:

- Pedido (`orders`) y envío (`shipments`) son entidades separadas. Hay un envío por empresa; en el MVP, uno por pedido. La entidad "solicitud" del modelo anterior desaparece: su contenido se reparte entre pedido y envío.
- La ficha del cliente (`clients`) es de cada empresa y se vincula al envío (`shipments.client_id`). El pedido guarda solo el nombre y el teléfono de contacto.
- Direcciones e inventarios cuelgan del pedido, no del envío. Las versiones del inventario son de pedido.
- El enlace pertenece al pedido y se guarda como hash del token.
- Presupuestos, tarifas e inventarios son versionados. Nunca se sobrescribe una versión enviada.
- Cada presupuesto cuelga del envío, de una versión del inventario y de una versión de tarifa, y guarda un `snapshot` con los datos usados en el cálculo.
- Cada línea de inventario copia volumen y peso del catálogo al crearse.
- Los importes van en céntimos.
- Las asignaciones usan restricciones `exclude` para impedir solapes.
- Segunda migración pendiente: índices sobre claves foráneas y políticas RLS específicas del rol operario.

---

## 8. Plan de entregas

Cada hito termina con algo que se puede probar con un transportista real.

| Hito | Contenido | Resultado esperado |
| --- | --- | --- |
| 0 · Validación | Entrevistas a 20 o 30 empresas y prueba manual con formulario y WhatsApp | Confirmar el dolor, recoger tarifas reales y valores de estiba y acceso |
| 1 · Del contacto al presupuesto | M1, M2, M3, M4, M5, M6, M7 (P0) | Una empresa crea un pedido, el cliente rellena el inventario y recibe un presupuesto |
| 2 · Aceptación y agenda | M8, M9, M12 (P0) | Los presupuestos se aceptan y se convierten en trabajos programados |
| 3 · Mudanza documentada | M10, M11 (P0) | El equipo documenta recogida y entrega y cierra el trabajo |
| 4 · Piloto | Ajustes P1 según uso real, 5 a 10 empresas durante 8 semanas | Datos para medir los criterios de la sección 1 |

---

## 9. Métricas del piloto

| Métrica | Cómo se mide |
| --- | --- |
| Empresas activas por semana | Empresas con al menos 1 presupuesto enviado en la semana |
| Tiempo hasta presupuesto | Desde creación del pedido hasta envío del presupuesto |
| Tasa de inventario completado | Pedidos con inventario enviado / pedidos con enlace enviado |
| Tasa de aceptación | Presupuestos aceptados / presupuestos enviados |
| Precisión del cálculo | Desviación entre horas estimadas y reales, y entre precio sugerido y final |
| Incidencias por trabajo | Número y tipo de incidencias por trabajo cerrado |
| Intención de pago | Empresas que aceptan suscripción al final del piloto |

---

## 10. Escalado tras el MVP

El modelo de datos ya deja preparadas estas fases. El orden depende de lo que pidan las empresas del piloto.

| Fase | Funcionalidad | Qué la habilita |
| --- | --- | --- |
| 2 | Calibración automática por empresa (horas y factores ajustados con datos reales) | Estimado frente a real guardado en cada trabajo |
| 2 | Integración con InvoiceXpress, Moloni u otro software certificado | Trabajos cerrados con líneas y extras |
| 2 | Señal o depósito pagado por la plataforma (Stripe Connect o similar) | Presupuesto aceptado con importe y versión exacta |
| 3 | Cuenta para el cliente final y valoraciones | Tabla de cuentas de cliente (`client_accounts`); `orders` y `clients` ganan `account_id`. El cliente reclama el pedido con una invitación por enlace, con caducidad y prueba de email o teléfono |
| 3 | Canal B2B: inmobiliarias, gestores de alquiler, residencias | Pedidos creados por terceros con origen del contacto |
| 4 | Marketplace: varias empresas presupuestan sobre el mismo pedido, y el cliente compara sus presupuestos | Pedido y envío separados, e inventario del pedido independiente del presupuesto |
| 4 | Rutas y viajes de regreso | Direcciones con coordenadas y trabajos con fecha y vehículo |

---

## 11. Decisiones abiertas

- [ ] Valores iniciales del factor de estiba y del factor de acceso por piso y distancia.
- [ ] Regla de número de operarios: por tramos de volumen o siempre manual.
- [ ] Plazo de conservación de fotos y firmas.
- [ ] Si un operario puede pertenecer a varias empresas.
- [ ] Servicio de mapas y su coste por consulta.
- [ ] Fuente y responsable del catálogo inicial de objetos.
- [ ] Flutter Web o Angular para la web del cliente.
- [ ] Requisitos legales que el IMT exige a las empresas del piloto según el tipo de vehículo (verificar antes de dar de alta empresas).
- [ ] Precio de la suscripción y modelo de cobro tras el piloto.
- [ ] Caducidad real del convite al administrador (hoy 7 días como valor provisional): depende de la configuración de Supabase Auth.
- [ ] Regiones del piloto para el desplegable "Região" (hoy hay un valor de ejemplo).
- [ ] Diseño de los flujos pendientes del panel: editar empresa, registrar IMT y contrato RGPD, desactivar o ver utilizadores, cerrar sesión.
- [ ] Qué hacer si se da de alta una empresa con un NIF o un email de administrador que ya existen.
- [ ] Servicios extra (RF-07, RF-24): `inventory_extras` apunta a los extras de cada empresa, pero el inventario es del pedido. Pendiente de análisis: un catálogo global de tipos de extra con precio por empresa, o elegir los extras al presupuestar. Bloquea la tabla de extras (paso 2 del plan de BD) y la parte de extras del paso 4.
- [x] Palabra portuguesa de "presupuesto" en la interfaz (RNF-10): "Orçamento" (decidido el 09/11/2026). En el código el término es `quotes`. Pendiente de aplicar: los diseños de la empresa y la app todavía dicen "Proposta" y `proposals`.
- [ ] Diseño pendiente tras separar pedido y envío: pantalla de pedido creado con un único enlace, pestaña "Envío" en el detalle del pedido, aviso de inventario alterado (indica si crea versión y qué presupuestos afecta), reenvío del enlace del pedido y "marcar como perdido" sobre el envío.
