# Mudaro · Requisitos del MVP

Versión 0.1 · 21/10/2026
Documento de referencia: *Mudaro · Modelo de negocio y dominio (MVP transportistas)*, que contiene el mapa de entidades, los estados y el script SQL.

---

## 1. Objetivo del MVP

Que una empresa de mudanzas pase de una llamada a un presupuesto aceptado y a una mudanza documentada sin salir de la herramienta, y que lo haga más rápido que con su método actual (WhatsApp, libreta, visita).

El MVP se considera validado cuando, en un piloto con 5 a 10 empresas de una misma región:

- Al menos la mitad de las empresas usa la herramienta en todos sus presupuestos durante 4 semanas seguidas.
- El tiempo medio desde que se crea la solicitud hasta que se envía el presupuesto baja respecto al método actual de cada empresa (medido en las entrevistas previas).
- La diferencia media entre horas estimadas y horas reales queda por debajo del 20 %.
- Al menos 3 empresas aceptan pagar una suscripción al terminar el piloto.

Estos umbrales son una propuesta inicial y se ajustan tras las entrevistas.

---

## 2. Alcance

### Dentro del MVP

- Alta de empresa, equipo, vehículos, tarifas y servicios extra.
- Catálogo de objetos con volúmenes.
- Solicitudes con enlace para que el cliente rellene su inventario.
- Cálculo automático de volumen, recursos, precio, coste y margen.
- Propuesta profesional y aceptación con firma.
- Agenda de trabajos con asignación de vehículos y operarios.
- Registro fotográfico, actas de recogida y entrega, incidencias.
- Cierre del trabajo con horas reales y exportación de datos para facturar.

### Fuera del MVP

- Marketplace (varias empresas cotizando la misma solicitud).
- Pagos, señales y retención de importes.
- Facturación propia (en Portugal requiere software certificado).
- Optimización de rutas y viajes de regreso.
- Valoraciones públicas de empresas.
- App para el cliente final con cuenta propia.

---

## 3. Actores y roles

| Actor | Acceso | Puede |
| --- | --- | --- |
| Administrador | App con cuenta | Todo lo de su empresa: configuración, precios, márgenes, solicitudes, presupuestos, agenda |
| Operario | App con cuenta | Ver sus trabajos asignados, subir fotos, recoger firmas, registrar incidencias. No ve precios ni márgenes |
| Cliente final | Enlace web con token, sin cuenta | Rellenar inventario, ver la propuesta, aceptarla y firmar actas |
| Equipo Mudaro | Panel interno | Mantener el catálogo global, dar de alta empresas del piloto, soporte |

---

## 4. Arquitectura y stack

| Pieza | Tecnología propuesta | Uso |
| --- | --- | --- |
| App de la empresa | Flutter (iOS, Android) | Administrador y operarios |
| Web del cliente | React with Next.js | Inventario, propuesta y aceptación desde el enlace |
| Panel interno | Web con Next.js (`apps/admin`, admin.mudaro.pt) | Equipo Mudaro: alta de empresas del piloto, catálogo global y soporte |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions | Datos, autenticación, fotos, lógica del enlace del cliente |
| Seguridad | RLS por `empresa_id` | Aislamiento total entre empresas |
| Rol de plataforma | Tabla `usuarios_plataforma` (o claim equivalente), con MFA obligatorio | Separa al equipo Mudaro de los usuarios de empresa (`administrador`, `operario`). Lo privilegiado pasa por Edge Functions que validan el rol; el panel no usa la clave de servicio |
| Mapas | Servicio de geocodificación y rutas (a decidir) | Coordenadas, km y tiempo de viaje |
| PDF | Edge Function | Generar la propuesta y las actas |
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
| RF-02 | Perfil de empresa: nombre, NIF, logo, contacto | P0 | El logo y los datos aparecen en la propuesta PDF |
| RF-03 | Invitar operarios por email o enlace | P0 | El invitado crea su cuenta y queda con rol operario en esa empresa |
| RF-04 | Cambiar rol y desactivar usuarios | P1 | Un usuario desactivado no puede iniciar sesión |

### M2 · Configuración

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-05 | Alta, edición y baja de vehículos con capacidad (m³), carga máxima (kg) y coste por km | P0 | Un vehículo inactivo no se propone en cálculos ni en la agenda |
| RF-06 | Configurar tarifa: precio y coste por hora de operario, precio por km, suplementos por piso y aparcamiento, mínimo por servicio, factor de estiba, velocidad media, IVA | P0 | Guardar cambios crea una versión nueva; los presupuestos enviados conservan la versión con la que se calcularon |
| RF-07 | Catálogo de servicios extra con modo de precio (fijo, por unidad, por m³, por hora) | P0 | Los extras activos aparecen en el inventario del cliente |
| RF-08 | Asistente de configuración inicial con valores por defecto | P1 | Una empresa nueva puede crear su primer presupuesto en menos de 10 minutos desde el registro |
| RF-09 | Ajustar volumen o peso de un objeto del catálogo solo para la empresa | P1 | El ajuste se usa en los cálculos de esa empresa y no afecta a las demás |

### M3 · Catálogo de objetos

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-10 | Catálogo global con categorías y objetos, cada uno con volumen, peso, minutos de manipulación y marcas (frágil, desmontaje, especial) | P0 | Catálogo inicial cargado con los objetos domésticos más habituales, revisado con al menos 2 transportistas |
| RF-11 | Búsqueda de objetos por nombre en PT, ES y EN | P0 | Buscar "sofá" o "sofa" devuelve los sofás del catálogo |
| RF-12 | Panel interno para mantener el catálogo | P1 | El equipo Mudaro puede añadir y corregir objetos sin desplegar código |

### M4 · Solicitudes

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-13 | Crear solicitud con nombre, teléfono, origen, destino y fecha aproximada | P0 | Se completa en 30 segundos o menos desde el móvil |
| RF-14 | Reutilizar un cliente existente al crear la solicitud | P1 | Al escribir el teléfono, sugiere el cliente si ya existe en la empresa |
| RF-15 | Generar enlace único con token y caducidad configurable | P0 | El enlace da acceso a una sola solicitud; caducado, muestra un aviso y no permite editar |
| RF-16 | Compartir el enlace con un mensaje predefinido | P0 | Abre la hoja de compartir del móvil con el texto y el enlace listos |
| RF-17 | Lista de solicitudes filtrable por estado | P0 | Muestra los estados del ciclo de vida de la solicitud |
| RF-18 | Recordatorio cuando el cliente no completa el inventario en X días | P1 | Notificación al administrador con opción de reenviar el enlace |
| RF-19 | Rellenar el inventario desde la app (por teléfono o en visita) | P0 | Queda registrado como inventario rellenado por la empresa |

### M5 · Inventario del cliente (web)

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-20 | Recorrido por habitaciones con objetos del catálogo y cantidades | P0 | El cliente añade, modifica y elimina objetos sin registrarse |
| RF-21 | Añadir objetos libres con descripción y medidas aproximadas | P0 | El objeto libre pide volumen o medidas; si no se dan, se marca para revisión |
| RF-22 | Subir fotos por objeto o por habitación | P0 | Las fotos se comprimen en el dispositivo antes de subir |
| RF-23 | Condiciones de acceso de cada dirección: piso, ascensor y tamaño, escaleras estrechas, distancia al aparcamiento, permiso de aparcamiento | P0 | Campos obligatorios antes de enviar |
| RF-24 | Selección de servicios extra de la empresa | P0 | Solo aparecen los extras activos |
| RF-25 | Guardado automático del borrador | P0 | Cerrar y reabrir el enlace conserva lo introducido |
| RF-26 | Enviar inventario | P0 | Pasa la solicitud a Inventario recibido y notifica a la empresa |
| RF-27 | Modificar el inventario tras recibir presupuesto | P1 | Crea una versión nueva; el presupuesto enviado pasa a Sustituido |
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

### M7 · Propuesta

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-38 | Generar propuesta con logo, líneas desglosadas, IVA, total, validez, qué incluye y qué no | P0 | Disponible como página web y como PDF |
| RF-39 | Anexar el inventario a la propuesta | P0 | El anexo muestra la versión exacta usada en el cálculo |
| RF-40 | Plantilla de condiciones editable por la empresa | P1 | Las condiciones se copian en cada propuesta al enviarla |
| RF-41 | Enviar la propuesta por el mismo enlace del cliente | P0 | El cliente la ve al abrir su enlace |
| RF-42 | Versionado de propuestas | P0 | Una propuesta enviada no se edita; cambiarla crea una versión nueva |

### M8 · Aceptación

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-43 | Aceptar la propuesta con nombre y firma dibujada | P0 | Se guardan firma, fecha y hora, IP y huella del documento |
| RF-44 | Rechazar la propuesta con motivo opcional | P1 | La empresa ve el motivo |
| RF-45 | Caducidad automática de propuestas | P0 | Pasada la validez, no se puede aceptar |
| RF-46 | Al aceptar, crear el trabajo y pasar la solicitud a Ganada | P0 | El trabajo aparece en la agenda en estado Programado |

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
| RF-62 | Expediente PDF del trabajo (propuesta, actas, fotos, incidencias) | P1 | Descargable desde el trabajo cerrado |

### M12 · Notificaciones

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-63 | Notificación push a la empresa cuando el cliente envía inventario o acepta | P0 | Llega en menos de 1 minuto |
| RF-64 | Email al cliente con copia de la propuesta aceptada y de las actas | P1 | Se envía solo si el cliente dio su email |

### M13 · Panel interno (equipo Mudaro)

Durante el piloto las empresas no se registran solas: el equipo Mudaro las da de alta (ver `architecture-system.md`, sección "Alta de empresas del piloto").

| ID | Requisito | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-65 | Alta de empresa desde el panel interno, con invitación al administrador por email o enlace | P0 | La empresa queda en estado "Convite pendente", sin usuarios activos, y el administrador recibe el convite. Si el equipo desmarca "Enviar o convite por email agora", el convite se envía después copiando el enlace |

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

---

## 6. Requisitos no funcionales

| ID | Área | Requisito |
| --- | --- | --- |
| RNF-01 | Aislamiento | Todas las tablas con datos de empresa tienen RLS por `empresa_id`. Ninguna consulta desde la app puede devolver datos de otra empresa |
| RNF-02 | Acceso del cliente | El enlace usa un token aleatorio de al menos 32 bytes, con caducidad. Solo las Edge Functions acceden a los datos con clave de servicio, tras validar el token |
| RNF-03 | Privacidad de precios | Tarifas, costes y márgenes nunca se envían al cliente ni al rol operario |
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

El esquema completo (22 tablas, tipos, restricciones y RLS) está en el documento de modelo de dominio. Puntos que la implementación debe respetar:

- Presupuestos, tarifas e inventarios son versionados. Nunca se sobrescribe una versión enviada.
- Cada línea de inventario copia volumen y peso del catálogo al crearse.
- Cada presupuesto guarda un `snapshot` con los datos usados en el cálculo.
- Las asignaciones usan restricciones `exclude` para impedir solapes.
- Segunda migración pendiente: índices sobre claves foráneas y políticas RLS específicas del rol operario.

---

## 8. Plan de entregas

Cada hito termina con algo que se puede probar con un transportista real.

| Hito | Contenido | Resultado esperado |
| --- | --- | --- |
| 0 · Validación | Entrevistas a 20 o 30 empresas y prueba manual con formulario y WhatsApp | Confirmar el dolor, recoger tarifas reales y valores de estiba y acceso |
| 1 · Del contacto al presupuesto | M1, M2, M3, M4, M5, M6, M7 (P0) | Una empresa crea una solicitud, el cliente rellena el inventario y recibe una propuesta |
| 2 · Aceptación y agenda | M8, M9, M12 (P0) | Las propuestas se aceptan y se convierten en trabajos programados |
| 3 · Mudanza documentada | M10, M11 (P0) | El equipo documenta recogida y entrega y cierra el trabajo |
| 4 · Piloto | Ajustes P1 según uso real, 5 a 10 empresas durante 8 semanas | Datos para medir los criterios de la sección 1 |

---

## 9. Métricas del piloto

| Métrica | Cómo se mide |
| --- | --- |
| Empresas activas por semana | Empresas con al menos 1 presupuesto enviado en la semana |
| Tiempo hasta presupuesto | Desde creación de la solicitud hasta envío de la propuesta |
| Tasa de inventario completado | Solicitudes con inventario enviado / solicitudes con enlace enviado |
| Tasa de aceptación | Propuestas aceptadas / propuestas enviadas |
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
| 3 | Cuenta para el cliente final y valoraciones | Tabla `cuentas_cliente` ligada a varias fichas de `clientes` |
| 3 | Canal B2B: inmobiliarias, gestores de alquiler, residencias | Solicitudes creadas por terceros con origen del contacto |
| 4 | Marketplace: varias empresas proponen sobre el mismo inventario | Inventario independiente del presupuesto |
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
