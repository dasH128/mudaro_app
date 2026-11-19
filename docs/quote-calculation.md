# Mudaro · Cómo se calcula el orçamento

Fecha: 19/11/2026
Código: `packages/quotes/src/calculate.ts` (tests en `calculate.test.ts`).
Requisitos: RF-30 a RF-37. Decisiones: `docs/plan-paso-5-presupuestos.md` (P2, P3).

El cálculo propone un orçamento a partir de lo que declaró el cliente. Es una **sugerencia**: la empresa puede cambiar cualquier valor en el editor, y el orçamento guarda lo sugerido y lo final (RF-37).

> **Reglas provisionales.** Los valores por defecto y varias reglas (marcadas con ⚠️) son un punto de partida razonable, no datos del mercado. Hay que confirmarlos con 2 o 3 mudanzas reales de las empresas del piloto.

## De dónde salen los datos

| Dato | Origen |
| --- | --- |
| Objetos, cantidades, volumen y minutos de cada objeto | Versión vigente del inventario (la última enviada). Volumen y minutos los pone el catálogo de Mudaro al añadir el objeto |
| Piso, elevador y estacionamiento de cada punto | Accesos del inventario (origen, paradas y destino) |
| Precios, costes, factores y tramos | Tarifa vigente de la empresa (pantalla Tarifas). Cada empresa pone los suyos |
| Vehículos y su capacidad | Frota activa de la empresa |
| Coste por km de cada vehículo | Frota (solo lo ven los administradores) |
| Kilómetros | Los escribe la empresa en el editor, de la base a la base (P2). Más adelante, un servicio de mapas |

## El cálculo, paso a paso

### 1. Volumen (RF-30)

- **Volumen declarado** = suma de (cantidad × volumen por unidad) de cada objeto.
- **Volumen ajustado** = volumen declarado × **factor de estiba**.

El factor de estiba cubre el espacio que se pierde en el camión (huecos, objetos que no encajan). Por defecto 1,20: un 20 % más.

Un objeto libre sin medidas no suma volumen y genera la alerta "objetos sem medidas".

### 2. Vehículos (RF-31)

Con la frota activa se busca **la combinación de vehículos con menos capacidad total que cubre el volumen ajustado**. Si dos combinaciones tienen la misma capacidad, se elige la que tiene menos vehículos.

Si ni la frota entera llega, se usan todos los vehículos y se calculan los **viajes**: volumen ajustado ÷ capacidad total, redondeado hacia arriba. Los viajes multiplican los kilómetros.

Ejemplo con un camión de 20 m³, una carrinha de 12 m³ y otra de 8 m³:

| Volumen ajustado | Vehículos | Viajes |
| --- | --- | --- |
| 10 m³ | Carrinha de 12 | 1 |
| 19 m³ | Camión de 20 (las dos carrinhas también suman 20, pero son dos vehículos) | 1 |
| 25 m³ | Camión de 20 + carrinha de 8 | 1 |
| 50 m³ | Los tres (40 m³) | 2 |

### 3. Operários (RF-32)

Por tramos de volumen ajustado, según la tarifa:

| Volumen ajustado | Operários (por defecto) |
| --- | --- |
| Hasta 15 m³ | 2 |
| Hasta 30 m³ | 3 |
| Más de 30 m³ | 4 |

Si hay algún objeto marcado como **"pessoal extra"** (por ejemplo, un piano), se suma 1 operário.

### 4. Horas de manipulación (RF-33)

Cada objeto del catálogo tiene unos **minutos de manipulación**: ⚠️ los minutos que tarda **una persona** en cargar una unidad, y otros tantos en descargarla. Por ejemplo, un sofá de 3 lugares son 30 minutos.

- **Minutos base** = suma de (cantidad × minutos por unidad) de cada objeto.
- **Carga en el origen** = minutos base × factor de acceso del origen.
- **Descarga en el destino** = minutos base × factor de acceso del destino.
- ⚠️ **Cada parada** = un cuarto de los minutos base × factor de acceso de la parada.

El **factor de acceso** de un punto empieza en 1 (sin dificultad) y sube:

| Situación | Aumento (por defecto) |
| --- | --- |
| Cada piso sin elevador | +10 % |
| Cada piso con elevador pequeño | ⚠️ +5 % (cuenta la mitad de los pisos) |
| Cada piso con elevador normal | Nada |
| Cada 25 m completos de estacionamiento | +5 % |
| Cave o rés-do-chão (piso 0 o negativo) | Nada |

Ejemplo: un 3.º sin elevador con 60 m de estacionamiento → 1 + 3 × 10 % + 2 × 5 % = **1,40**.

Así, cambiar el piso o el elevador cambia las horas, como pide RF-33.

### 5. Viaje (RF-34)

- **Km totales** = km escritos × viajes.
- **Horas de viaje** = km totales ÷ velocidad media de la tarifa (por defecto 50 km/h).

### 6. Horas del equipo

**Horas** = minutos de manipulación ÷ 60 ÷ operários + horas de viaje, ⚠️ **redondeadas hacia arriba a la media hora**.

Las **horas de operário** (lo que se cobra y lo que cuesta) son operários × horas.

### 7. Precio (RF-35)

El cálculo propone estas líneas base del orçamento:

| Línea | Cantidad | Precio unitario |
| --- | --- | --- |
| Mão de obra | Horas de operário | Precio por hora de operário |
| Transporte | Km totales | Precio por km |
| Suplemento por andar sem elevador (si la tarifa lo tiene) | Pisos sin elevador (solo "não tem") | Suplemento por piso |
| Suplemento de estacionamento (si la tarifa lo tiene) | Puntos con estacionamiento a 50 m o más | Suplemento por punto |
| Ajuste ao mínimo (si hace falta) | 1 | Lo que falta hasta el mínimo por servicio |

**Precio** = suma de las líneas. Si queda por debajo del **mínimo por servicio** de la tarifa, se añade la línea de ajuste para llegar al mínimo.

Los **servicios extra** (embalaje, desmontaje…) no salen de este cálculo: la empresa los añade en el editor desde su lista de servicios, como incluidos u opcionales. El IVA se aplica al final sobre todas las líneas.

**Precio por hora del equipo** = operários × precio por hora. Es el que ve el cliente si la empresa presenta el orçamento "por hora, con estimativa".

### 8. Coste y margen (RF-35)

Solo los ven los administradores (RNF-03).

- **Coste** = horas de operário × coste por hora de operário + km totales × suma del coste por km de los vehículos usados.
- **Margen** = (precio − coste) ÷ precio.

### 9. Alertas (RF-36)

Aparecen en el editor antes de enviar:

| Alerta | Cuándo |
| --- | --- |
| Sem elevador | Algún punto con piso sin elevador |
| Estacionamento longe | Algún punto a 50 m o más |
| Objetos especiais | Hay objetos frágiles, a desmontar o de pessoal extra |
| Objetos sem medidas | Algún objeto sin volumen o sin minutos |
| Viagens extra | La frota no cabe en un viaje |
| Sem veículos | La empresa no tiene vehículos activos |
| Sem km | Aún no se escribieron los km |
| Mínimo aplicado | El precio subió al mínimo por servicio |
| Veículo sem custo | Un vehículo usado no tiene coste por km (el coste sale por debajo de lo real) |

## Ejemplo completo

Datos: tarifa de prueba (18 €/h de precio, 9 €/h de coste, 0,60 €/km, mínimo 120 €). Un sofá de 3 lugares (1,5 m³, 30 min) y 3 cadeiras (0,1 m³, 5 min). Origen: 3.º sin elevador, 20 m de estacionamiento. Destino: 1.º con elevador pequeño, 60 m. 30 km. Frota: camión de 20 m³ (0,50 €/km) y carrinha de 8 m³ (0,30 €/km).

| Paso | Cálculo | Resultado |
| --- | --- | --- |
| Volumen declarado | 1 × 1,5 + 3 × 0,1 | 1,8 m³ |
| Volumen ajustado | 1,8 × 1,20 | 2,16 m³ |
| Vehículos | El más pequeño que cubre 2,16 m³ | Carrinha de 8 m³, 1 viaje |
| Operários | Hasta 15 m³ | 2 |
| Minutos base | 1 × 30 + 3 × 5 | 45 min |
| Factor del origen | 1 + 3 × 10 % | 1,30 |
| Factor del destino | 1 + 0,5 × 10 % + 2 × 5 % | 1,15 |
| Manipulación | 45 × 1,30 + 45 × 1,15 | 110,25 min de persona |
| Viaje | 30 km ÷ 50 km/h | 0,6 h |
| Horas del equipo | 110,25 ÷ 60 ÷ 2 + 0,6 = 1,52 → media hora arriba | 2 h |
| Horas de operário | 2 × 2 | 4 h |
| Mão de obra | 4 h × 18 € | 72,00 € |
| Transporte | 30 km × 0,60 € | 18,00 € |
| Subtotal | 72 + 18 = 90 €, por debajo del mínimo | Ajuste ao mínimo: 30,00 € |
| **Precio sin IVA** | | **120,00 €** |
| Coste | 4 h × 9 € + 30 km × 0,30 € | 45,00 € |
| Margen | (120 − 45) ÷ 120 | 62,5 % |
| Alertas | | Sem elevador (3 pisos), Estacionamento longe (60 m), Mínimo aplicado |

Este ejemplo es uno de los tests (`calculate.test.ts`): si alguien cambia una regla, el test avisa.

## Qué puede cambiar cada empresa

En la pantalla **Tarifas**: precios y costes por hora, precio por km, suplementos, mínimo, IVA, factor de estiba, velocidad media, los porcentajes de acceso, los tramos de operários, cómo se presenta el precio y la validez del orçamento. Cada cambio crea una versión nueva de la tarifa; los orçamentos ya enviados no cambian.

En el **editor del orçamento**: cualquier valor calculado (operários, horas, km, vehículos, precio de cada línea) y los servicios extra.

## Pendiente de confirmar con el piloto

- Los valores por defecto de la tarifa (P3).
- Las reglas marcadas con ⚠️: qué representan los minutos de manipulación, el peso de las paradas, el elevador pequeño y el redondeo a la media hora.
- Si el viaje desde la base y de vuelta debe cobrarse al mismo precio por km o con otro.
