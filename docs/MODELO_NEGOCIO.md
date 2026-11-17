# Towigo · Modelo de negocio

Documento vivo: lo construimos paso a paso. Cada paso recoge las decisiones tomadas y el porqué.

| Paso | Tema | Estado |
|---|---|---|
| 1 | Identidad: propósito, misión, visión y valores | ✅ Decidido |
| 2 | Clientes: a quién servimos y quién paga | ✅ Decidido |
| 3 | Propuesta de valor por cliente y alternativas | ✅ Decidido |
| 4 | Modelo de ingresos y precios | ✅ Decidido |
| 5 | Canales y salida al mercado (piloto, primeros 1.000 usuarios) | ✅ Decidido |
| 6 | Regulación y confianza (Fase 1 vs. producto sanitario, RGPD, evidencia) | ✅ Decidido |
| 7 | Costes, equipo y métricas clave | ✅ Decidido |
| 8 | Plan financiero y ronda | ⏳ Siguiente |

---

## 1. Identidad

### Propósito — por qué existimos
> **Hábitos acompañados. *Together we go.***

El nombre lo dice: **Towigo = *Together we go***. Un tratamiento (insulina, pastillas o GLP-1) solo funciona si se
convierte en hábitos que se sostienen día a día, y nadie los sostiene igual de bien solo. Towigo existe para que esos
hábitos se construyan **acompañados**: por Owi, por la gente de la persona y por su equipo sanitario.

### Misión — qué hacemos, para quién y cómo
> **Acompañar cada día a las personas con diabetes tipo 1, tipo 2 u obesidad en tratamiento con GLP-1, convirtiendo
> sus datos en hábitos y conectándolas con su equipo sanitario.**

- **Paciente primero:** la persona es la usuaria principal; si ella no usa la app cada día, no hay datos ni valor para nadie más.
- **Datos → hábitos:** registro en segundos, indicadores claros (Índice Towigo, tu semana) y un asistente que habla con sus datos.
- **Conexión con el equipo:** lo que pasa entre consultas llega a endocrinología, nutrición y psicología (panel profesional).

### Visión — dónde queremos estar en 5–10 años
> **Ser la plataforma de referencia en España y Europa para el seguimiento diario de las enfermedades metabólicas,
> integrada en la sanidad pública y privada.**

Empezar en España (idioma, red de contactos, sanidad privada accesible) y crecer a Europa con la misma plataforma
(i18n ya preparada), con integraciones clínicas y evidencia que permitan entrar en la sanidad pública.

### Valores — cómo decidimos
1. **Sin juicios.** Cercanía y tono amable; nunca culpar. Constancia por encima de perfección.
   *En la práctica:* Owi no regaña, los días malos cuentan, el ánimo se pregunta sin presionar.
2. **Rigor clínico.** La seguridad primero: la app no calcula ni sugiere dosis ni da indicaciones automáticas; el equipo
   sanitario decide. *En la práctica:* textos revisados, pruebas automáticas que lo vigilan, límites claros de la Fase 1.
3. **Equipo.** Paciente, familia y profesionales en el mismo lado; la tecnología al servicio de esa relación.
   *En la práctica:* compartir con el equipo o con tu gente siempre lo elige la persona; el profesional ve lo que importa, ordenado.

### Frase corta (para presentaciones)
> **Towigo — hábitos acompañados para la diabetes y el tratamiento con GLP-1. *Together we go.***

---

## 2. Clientes

### Decisión
| Pregunta | Decisión |
|---|---|
| Primer grupo de pacientes | **Personas con obesidad en tratamiento con GLP-1** (semaglutida, tirzepatida…), sobre todo en la sanidad privada |
| Quién paga primero | **El propio paciente** (suscripción) |
| Canal de entrada | **Clínicas y endocrinos** que ya conocemos, que recomiendan la app a sus pacientes (y usan el panel) |
| Dónde | **Piloto en una ciudad**, con 1–2 clínicas |

Tipo 1, tipo 2 y "tipo 2 + GLP-1" ya funcionan en la app y serán los siguientes mercados, sin rehacer nada.

### Por qué empezar por GLP-1 / obesidad
- **El problema es grande y medible: la mitad abandona el tratamiento en el primer año.** En el registro nacional danés
  (77.310 personas que empezaron semaglutida para perder peso), más de la mitad lo había dejado al año: el 18 % a los
  3 meses, el 31 % a los 6 y el 42 % a los 9 *(EASD 2025; dato preliminar, pendiente de publicación)*. En una cohorte de
  la Cleveland Clinic, solo el 19 % seguía con su medicación para la obesidad a los 12 meses; quienes seguían habían
  perdido de media un 10 % de peso, frente a un 2 % quienes lo dejaron *(Obesity, 2025)*.
- **Lo que hace que abandonen es justo donde Towigo ayuda:** efectos secundarios (sobre todo al principio y al subir
  dosis), coste, motivación cuando llega la meseta y miedo a recuperar el peso al dejarlo.
- **El músculo importa:** parte del peso que se pierde es masa magra; los estudios dan cifras muy distintas según cómo se
  mida (de ~15 % a ~40 % del peso perdido), por eso proteína y fuerza están en el centro de la app.
- **Pagan de su bolsillo y ya están acostumbrados a pagar** (el fármaco en privado), y valoran el acompañamiento.
- **Mercado de base amplio:** la obesidad en adultos en España pasó del 7,3 % en 1987 al 15,7 % en 2020
  *(Feijoo et al., Rev Esp Cardiol 2024)*.

### Los tres papeles (no son la misma persona)
| Papel | Quién | Qué necesita de Towigo |
|---|---|---|
| **Usuario** | Paciente con GLP-1 | Que el tratamiento funcione y se note: menos efectos, constancia, ver progreso, no recuperar después |
| **Pagador** | El mismo paciente | Que valga lo que cuesta: resultados y tranquilidad |
| **Recomendador (canal)** | Clínica / endocrino / nutricionista | Pacientes que no abandonan, datos entre consultas sin trabajo extra, mejor imagen de su servicio |

### Perfiles tipo (personas)
- **Laura, 44 años — "acabo de empezar".** Semaglutida en una clínica privada desde hace 3 semanas. Náuseas al subir dosis,
  dudas sobre qué comer, miedo a hacerlo mal. *Necesita:* registrar en segundos, entender sus efectos, hablar con su equipo sin esperar a la cita.
- **Marcos, 52 años — "me he estancado".** 6 meses con tirzepatida, ha perdido 12 kg pero lleva 4 semanas sin bajar.
  Se desmotiva y duda si seguir pagando. *Necesita:* ver lo que sí mejora (cintura, músculo, ánimo, Índice Towigo), hitos y apoyo.
- **Carmen, 38 años — "lo voy a dejar, ¿y ahora?".** Termina el tratamiento y teme recuperar el peso. *Necesita:* el modo
  mantenimiento (hábitos, fuerza, proteína, alertas suaves de tendencia) y seguir acompañada.

### Primeros usuarios (early adopters)
Personas que **empiezan un GLP-1 en una clínica privada** de la ciudad piloto (o lo empezaron hace menos de 3 meses), con
móvil, y cuyo médico o nutricionista les recomienda Towigo. Son los que más riesgo tienen de abandonar y los que más
notarán la ayuda.

### Qué tiene que demostrar el piloto (hipótesis)
1. **Uso:** al menos el 60 % de los pacientes sigue usando la app cada semana a los 3 meses.
2. **Persistencia:** más pacientes siguen con el tratamiento a los 3 y 6 meses que la referencia de la clínica.
3. **Disposición a pagar:** al menos el 30 % pasaría a la versión de pago al terminar la prueba gratuita.
4. **Valor para la clínica:** los profesionales usan el panel al menos una vez por semana y lo recomendarían.

*Por decidir:* ciudad y clínicas del piloto (con los contactos que ya hay).

**Fuentes:** [EurekAlert – registro danés, EASD 2025](https://www.eurekalert.org/news-releases/1097806) ·
[News-Medical](https://www.news-medical.net/news/20250915/StudyHalf-of-adults-without-diabetes-taking-weight-loss-drug-discontinue-treatment-within-a-year.aspx) ·
[MDedge – Cleveland Clinic](https://mdedge.com/content/most-stop-taking-weight-loss-drugs-within-1-year) ·
[Rev Esp Cardiol – Feijoo et al.](https://cardio2.elsevier.es/en-prevalence-of-obesity-in-spain-and-its-a-articulo-S1885585724000914-pdf) ·
[Barbell Medicine – masa magra](https://www.barbellmedicine.com/blog/glp-1-muscle-loss/)

---

## 3. Propuesta de valor

### Las dos promesas
| A quién | Promesa | Por qué es creíble |
|---|---|---|
| **Paciente con GLP-1** | **"Saca todo el partido a tu tratamiento y mantén el resultado después."** | Quien sigue el tratamiento pierde mucho más peso (≈10 % frente a ≈2 % a los 12 meses, Cleveland Clinic). Towigo ataca las causas del abandono y acompaña también al dejarlo. |
| **Clínica / endocrino** | **"Tus pacientes siguen el tratamiento y vuelven a consulta."** | La mitad abandona en el primer año: cada paciente que sigue es un paciente que vuelve. El panel avisa de quién necesita apoyo antes de que lo deje. |

### Frase de posicionamiento
> Para personas con obesidad que empiezan un tratamiento con GLP-1 en una clínica, **Towigo es la app que les acompaña
> cada día y les conecta con su equipo**, para que el tratamiento funcione y el resultado dure. A diferencia de los
> registros de inyecciones o las apps de dieta, **Towigo une paciente y clínica en la misma plataforma** y lo resume
> todo en **una cifra que se entiende: el Índice Towigo**.

### Lienzo de valor — paciente
| Lo que quiere conseguir | Lo que le duele | Cómo lo resuelve Towigo |
|---|---|---|
| Perder peso y no recuperarlo | Miedo al "efecto rebote" al dejar el fármaco | Modo mantenimiento; tendencias de peso; hábitos que siguen sin fármaco |
| Aguantar el tratamiento | Náuseas y efectos al subir dosis; no saber si es normal | Registro de efectos en segundos; consejos generales del equipo; aviso a la clínica cuando se repiten |
| Ver que merece la pena (y lo que paga) | Meseta: "no bajo, ¿para qué sigo?" | Índice Towigo y "Tu semana": se ve lo que sí mejora (constancia, ánimo, músculo, adherencia) |
| No perder músculo | No saber cuánta proteína o qué ejercicio | Anillo de proteína, rutinas de fuerza de 10 min, composición corporal |
| Sentirse acompañado | Esperar semanas a la próxima cita | Mensajes y audios del equipo, check-in de ánimo, su gente (familia) |

### Lienzo de valor — clínica
| Lo que quiere conseguir | Lo que le duele | Cómo lo resuelve Towigo |
|---|---|---|
| Que el paciente continúe (y vuelva) | Abandonos silenciosos que solo se ven cuando no viene | Panel con pacientes ordenados por prioridad y motivo (efectos, inyección olvidada, ánimo bajo) |
| Consultas más útiles | Llegar a consulta sin datos de lo ocurrido | Ficha con tendencias, Índice Towigo, informe PDF para la consulta |
| Seguimiento sin más carga | WhatsApp y llamadas sin orden | Bandeja de mensajes con plantillas; pautas y objetivos que llegan a la app |
| Diferenciarse | Programas de obesidad muy parecidos | Programa con app propia y datos de resultados que puede enseñar |

### Diferencias que destacamos
1. **Equipo conectado.** Paciente y clínica en la misma plataforma: el paciente registra y pregunta; el profesional ve,
   prioriza, responde y ajusta pautas y objetivos que llegan directamente a la app. Las apps de seguimiento de GLP-1 se
   quedan en el paciente; los chats con el nutricionista no tienen datos.
2. **Índice Towigo.** Una cifra de 0 a 100, como la puntuación de sueño, que resume tratamiento, peso, actividad,
   constancia, bienestar y nutrición. Para el paciente es motivación; para el profesional, una señal rápida de quién
   va bien y quién necesita ayuda. Incluye lo emocional y lo familiar, que las demás no miden.

*También cuentan (aunque no son el titular):* modo después del GLP-1, foco en músculo (proteína y fuerza), y Owi como
asistente cercano y sin juicios.

### Alternativas actuales
| Alternativa | Qué ofrece | Qué le falta frente a Towigo |
|---|---|---|
| **No hacer nada / libreta** | Lo más común | Sin seguimiento, sin aviso al equipo; de aquí sale buena parte del abandono |
| **WhatsApp con el nutricionista o la clínica** | Cercanía | Sin datos ordenados, no escala, depende de la disponibilidad del profesional |
| **Registros de inyecciones (p. ej. Shotsy, GLPeak)** | Dosis, zonas, efectos y peso; Shotsy ~5,79 $/mes en EE. UU. | Solo para el paciente, sin equipo; en inglés |
| **Programas de apps de dieta con GLP-1 (p. ej. Noom GLP-1 Companion)** | Seguimiento de medicación y efectos, proteína, entreno para conservar músculo | Pensado para EE. UU. y sus propios médicos; no conecta con la clínica del paciente |
| **Apps de calorías (MyFitnessPal, Fitia…)** | Registro de comida | No entienden el tratamiento ni sus efectos; sin equipo |
| **Programas de la farmacéutica** | — | No hemos encontrado una app de apoyo de Wegovy en España; además, en España Wegovy no está financiado: lo paga el paciente |

### Lo que NO prometemos (Fase 1)
- No ajustamos ni recomendamos dosis, ni sustituimos al médico.
- No prometemos un número de kilos: prometemos ayudar a que el tratamiento se siga y el resultado se mantenga.
- El Índice Towigo es una medida de hábitos, no un diagnóstico.

**Fuentes:** [Noom – GLP-1 Companion](https://www.noom.com/support/faqs/using-the-app/daily-features/2025/10/glp-1-companion/) ·
[Nutrition Insight – actualización de Noom](https://www.nutritioninsight.com/news/noom-upgrades-glp-1-weight-management-app-features-as-digital-therapeutics-gain-us-market-traction.html) ·
[Shotsy – App Store](https://apps.apple.com/us/app/-/id6499510249) ·
[GLPeak – App Store](https://apps.apple.com/us/app/glpeak-glp-1-shot-tracker/id6744581459) ·
[MyTherapy – comparativa de apps GLP-1](https://www.mytherapyapp.com/glp1-apps) ·
[Vozpópuli – Novo Nordisk España, Wegovy oral](https://www.vozpopuli.com/sanitatem/francisco-pajuelo-director-medico-de-novo-espana-la-llegada-de-wegovy-oral-amplia-las-opciones-para-individualizar-el-tratamiento-de-la-obesidad.html) ·
[Science Media Centre – Wegovy en España](https://sciencemediacentre.es/en/anti-obesity-drug-wegovy-be-sold-spain-starting-tomorrow)

---

## 4. Modelo de ingresos y precios

### Decisión
| Pregunta | Decisión |
|---|---|
| Modelo | **Freemium**: registro gratis para siempre; **Towigo Plus** de pago |
| Precio | **9,99 €/mes** o **79,99 €/año** (≈ 6,67 €/mes), IVA incluido |
| Prueba gratuita | **30 días** (cubre el primer mes de tratamiento); **3 meses** si llega desde una clínica del piloto |
| Clínica | **Panel profesional gratis durante el piloto**, a cambio de recomendar la app y compartir resultados anónimos |

**Referencia de precio:** el paciente ya paga de su bolsillo el fármaco, entre unos 180 € y 450 € al mes según el
medicamento y la dosis (Wegovy, Mounjaro; sin financiación pública para la obesidad). Towigo Plus cuesta **menos del
5 %** de eso: es fácil de justificar si ayuda a no abandonar un tratamiento en el que ya invierte tanto.

### Qué es gratis y qué es de pago
| Gratis (siempre) | Towigo Plus |
|---|---|
| Registrar inyección, peso, efectos, comida, fuerza | **Índice Towigo** completo (desglose y evolución) |
| Avisos (inyección, medicación, pesaje) | **Tu semana** y Progreso → Datos (tendencias y comparativas) |
| Pantalla Hoy con la cifra clave | **Asistente con IA** (preguntas, registro escribiendo, preguntas para la consulta) |
| **Mensajes con tu equipo** y check-in de ánimo | **Rutinas de fuerza** y objetivos de proteína personalizados |
| Tu gente (familia) | **Informe PDF** para la consulta |
| | **Modo mantenimiento** "después del GLP-1" |

**Regla de oro (valor "rigor clínico"):** nada que tenga que ver con la seguridad o con la comunicación con el equipo va
detrás del pago. Avisos, registro y mensajes con la clínica son siempre gratis. Así la clínica puede recomendar la app a
todos sus pacientes, paguen o no.

### Qué deja cada suscripción (estimación)
| Concepto | Mensual | Anual |
|---|---|---|
| Precio (IVA incl.) | 9,99 € | 79,99 € |
| Sin IVA (21 %) | 8,26 € | 66,11 € |
| Comisión tienda (15 %, programa para pequeñas empresas de Apple y Google) | −1,24 € | −9,92 € |
| **Neto para Towigo** | **7,02 €/mes** | **56,19 €/año (4,68 €/mes)** |

Si el 60 % elige el plan anual y el 40 % el mensual: **≈ 5,60 €/mes por suscriptor ≈ 67 € al año**.

### El piloto no es para ganar dinero, es para aprender
Ejemplo con 2 clínicas: ~200 pacientes nuevos con GLP-1 en 6 meses → ~140 instalan la app → si el 30 % paga tras la
prueba, ~42 suscriptores ≈ **2.800 €/año**. Lo que vale del piloto son los datos: uso, persistencia del tratamiento,
conversión y opinión de la clínica (paso 2). La referencia del sector en apps de salud y deporte es que **≈ 35–40 % de
las pruebas gratuitas acaba pagando** (mediana); nuestro objetivo del 30 % es prudente.

### A escala (orden de magnitud)
| Suscriptores de pago | Ingresos netos al año |
|---|---|
| 1.000 | ≈ 67.000 € |
| 10.000 | ≈ 670.000 € |
| 50.000 | ≈ 3,4 M€ |

Costes, punto de equilibrio y ronda: pasos 7 y 8.

### Después del piloto: nuevas fuentes de ingresos (por orden)
1. **Clínicas:** cuota del panel profesional (propuesta: **49 €/mes por profesional**, o un precio por paciente activo
   si la clínica quiere incluir Towigo Plus en su programa de obesidad y que el paciente no pague).
2. **Aseguradoras y mutuas:** licencias para sus asegurados, cuando haya datos de resultados del piloto.
3. **Otros perfiles:** tipo 2 + GLP-1, tipo 2 y tipo 1 (la app ya los soporta) con el mismo modelo.
4. **Farmacéuticas:** programas de apoyo al paciente, con mucho cuidado de independencia y cumplimiento (decisión futura).

*Nunca:* vender datos personales ni publicidad de productos de salud.

### Riesgo principal y cómo lo cubrimos
**El paciente deja de pagar cuando deja el fármaco.** Por eso el **modo mantenimiento** es de pago y es una pieza clave:
alarga la vida del cliente justo en el momento de más riesgo de recuperar peso (y es coherente con la misión).

**Fuentes:** [OCU – Mounjaro, precios](https://www.ocu.org/salud/medicamentos/noticias/tirzepatida-mounjaro-adelgazar) ·
[OCU – inyecciones para adelgazar](https://www.ocu.org/alimentacion/adelgazar/informe/inyecciones-adelgazar) ·
[Cuánto me cuesta – precios GLP-1 2026](https://cuantomecuesta.com/es/tratamiento-glp1-ozempic-adelgazar/) ·
[Athletech News – conversión en apps de salud (RevenueCat 2025)](https://athletechnews.com/fitness-apps-monetizable-winner-take-all-or-most/) ·
[Adapty – benchmarks Health & Fitness](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/)

---

## 5. Canales y salida al mercado

### Decisión
| Pregunta | Decisión |
|---|---|
| Ciudad del piloto | **Valencia** (mercado mediano: más fácil destacar; allí están los contactos) |
| Qué ofrecemos a la clínica | **Panel gratis + soporte** y **su marca dentro de la app** |
| Canales directos a pacientes | **Contenido útil, comunidades, farmacias y recomendación entre usuarios** |
| Ritmo | **Prudente**: preparar → piloto → crecer |

### Canal principal: la clínica recomienda
**Lo que recibe la clínica**
- Panel profesional gratis durante el piloto, formación de 30 minutos y una persona de contacto directa (respuesta en el día).
- **"Programa de obesidad de Clínica X con Towigo"**: el logo, el nombre y el equipo de la clínica aparecen dentro de la app
  del paciente (pantalla Equipo, mensajes, informe). Para la clínica es su programa; Towigo es la tecnología.

**El recorrido del paciente**
1. En consulta, al empezar el GLP-1, el profesional le recomienda Towigo y le da el **código de la clínica** (QR).
2. El paciente instala la app, introduce el código y queda **conectado con su equipo** (y con la marca de la clínica).
3. Tiene **3 meses de Towigo Plus gratis** (los de mayor riesgo de abandono).
4. A los 3 meses decide si sigue con Plus; lo gratis (registro, avisos, mensajes con la clínica) sigue siempre.

**Lo que NO hacemos:** pagar a la clínica o al profesional por cada paciente que se suscribe. Recomendar un producto a
cambio de dinero choca con la deontología médica y restaría credibilidad; el incentivo de la clínica es que sus pacientes
sigan el tratamiento (y vuelvan).

### Canales directos a pacientes
| Canal | Cómo | Para qué |
|---|---|---|
| **Contenido útil** | Guías y vídeos cortos (Instagram, TikTok, web) sobre lo que se busca al empezar: náuseas, qué comer, proteína, fuerza, meseta, qué pasa al dejarlo. Revisado por profesionales. | Atraer a quien busca respuestas y llevarlo a la app; posicionar a Towigo como referencia seria |
| **Comunidades** | Asociaciones de pacientes con obesidad y grupos de personas en tratamiento (con tu acceso a pacientes): charlas, sesiones de preguntas, prueba gratuita ampliada | Confianza y primeros usuarios muy implicados |
| **Farmacias** | La farmacia dispensa el fármaco cada mes: QR en el mostrador y un folleto "Saca todo el partido a tu tratamiento" | Llegar justo en el momento clave, también a quien no va a una clínica del piloto |
| **Recomendación entre usuarios** | Invitar a alguien da **1 mes de Towigo Plus gratis a los dos** | Crecimiento barato; las personas en tratamiento suelen conocer a otras |

### Calendario (ritmo prudente)
| Meses | Qué hacemos | Hito |
|---|---|---|
| **0–2 · Preparar** | Cuentas y datos en la nube seguros, RGPD (contrato de encargado del tratamiento con la clínica), código de clínica y marca de la clínica en la app, suscripciones en App Store y Google Play, medición de uso | App lista para pacientes reales |
| **3–8 · Piloto en Valencia** | 1–2 clínicas; formación; seguimiento semanal con la clínica; primeros contenidos y una farmacia de prueba | Datos de las 4 hipótesis del paso 2 |
| **9–12 · Crecer** | 5–10 clínicas en Valencia y alrededores; contenido constante; farmacias; comunidades; recomendación entre usuarios | **Primeros 1.000 usuarios** |

### De dónde salen los primeros 1.000 usuarios (estimación)
| Origen | Usuarios |
|---|---|
| Piloto (2 clínicas, meses 3–8) | ≈ 140 |
| Nuevas clínicas (≈ 8 clínicas × ≈ 8 pacientes nuevos al mes × 4 meses × 70 % instalan) | ≈ 180 |
| Contenido, comunidades y farmacias | ≈ 500 |
| Recomendación entre usuarios | ≈ 180 |
| **Total al mes 12** | **≈ 1.000 usuarios** (≈ 300 de pago si convierte el 30 %) |

Las clínicas solas no llegan a 1.000 en un año: **el contenido y las farmacias son imprescindibles** desde el mes 9.

### Qué medimos en cada canal
Instalaciones · % que conecta con su clínica · uso semanal a los 30 y 90 días · paso a pago · coste por usuario
(en los canales con gasto) · recomendaciones por usuario.

*Por decidir:* nombres de las clínicas y farmacias del piloto; quién crea el contenido (y quién lo revisa clínicamente).

---

## 6. Regulación y confianza

> Este apartado es un planteamiento de trabajo, no asesoramiento legal. Las conclusiones deben confirmarlas la consultora
> de producto sanitario y protección de datos (ver "Quién nos ayuda").

### Decisión
| Pregunta | Decisión |
|---|---|
| Estrategia regulatoria | **Fuera de producto sanitario en la Fase 1; marcado CE en la Fase 2** |
| Asistente con IA | **Datos mínimos**, sin identificadores, con contrato, sin que el proveedor los guarde, con consentimiento y aviso de IA |
| Evidencia | **Estudio observacional aprobado por un comité de ética (CEIm)** con la clínica del piloto |
| Quién nos ayuda | **Consultora externa** de producto sanitario y protección de datos (incluido delegado de protección de datos) |

### 6.1 Producto sanitario: dónde está la línea
En la UE, un software es producto sanitario cuando su **finalidad prevista** es médica: diagnosticar, prevenir, vigilar,
predecir o tratar una enfermedad, o dar información para tomar decisiones de diagnóstico o tratamiento (Reglamento
(UE) 2017/745, MDR). La guía europea **MDCG 2019-11** (revisada en junio de 2025) explica cómo decidirlo, y la **regla 11**
clasifica ese software, normalmente como **clase IIa o superior**, lo que exige un organismo notificado.

**Fase 1 — lo que Towigo SÍ es:** una app de hábitos, registro y comunicación con el equipo. Guarda lo que la persona
apunta, lo muestra de forma clara, recuerda lo que el equipo ha pautado y facilita hablar con la clínica.

**Lo que Towigo NO hace en la Fase 1 (y ya está así en la app):** calcular o sugerir dosis, dar indicaciones clínicas
automáticas, diagnosticar, sustituir las alarmas del sensor.

**Funciones a revisar con la consultora antes del piloto** (están en la frontera):
| Función | Riesgo | Ajuste propuesto para la Fase 1 |
|---|---|---|
| **Panel profesional: "prioridad alta" por señales clínicas** (efectos, glucosa, ánimo) | Ordenar pacientes por riesgo clínico puede verse como apoyo a decisiones clínicas | Ordenar por **hechos, no por riesgo**: el paciente pidió ayuda, mensajes sin responder, inyección no registrada, días sin registrar. Filtros que elige el profesional |
| **Índice Towigo con área de glucosa** | Una puntuación que integra tiempo en rango puede leerse como vigilancia de la enfermedad | En la Fase 1, **el índice mide hábitos** (tratamiento registrado, actividad, constancia, bienestar, nutrición, peso) y la glucosa se muestra aparte como dato |
| **Reacción a glucosa baja o alta** (Owi preocupado, frase) | Una "alerta" clínica es función de producto sanitario | Mostrar el dato tal cual + "sigue el plan de tu equipo" + recordatorio de que no sustituye las alarmas del sensor (ya está así) |
| **Asistente con IA** | Respuestas personalizadas que orienten el tratamiento | Límites ya activos (sin dosis ni indicaciones); derivar lo clínico al equipo; probar con casos límite antes del piloto |

**Fase 2 — marcado CE:** con el piloto hecho, preparar la versión clínica (priorización de riesgo, índice con glucosa,
avisos) como producto sanitario: sistema de calidad **ISO 13485**, ciclo de vida del software **IEC 62304**, gestión de
riesgos **ISO 14971**, usabilidad **IEC 62366**, evaluación clínica y revisión de un organismo notificado. Plazo
orientativo: 12–18 meses. Abre la puerta a aseguradoras, hospitales y sanidad pública (visión).

### 6.2 Protección de datos (RGPD y LOPDGDD)
Los datos de salud son una **categoría especial** (art. 9 RGPD): solo se tratan con una base legal reforzada.

| Obligación | Cómo lo cumplimos |
|---|---|
| **Base legal** | **Consentimiento explícito** de la persona para cada finalidad: usar la app, compartir con su clínica, compartir con su gente, asistente con IA (separados y revocables; ya están separados en la app) |
| **Papeles** | Towigo responsable de los datos de la app; la relación con la clínica (responsables independientes o encargado del tratamiento) la define la consultora y se firma en un **contrato** antes del piloto |
| **Evaluación de impacto (EIPD)** | **Obligatoria** antes de empezar: datos de salud a gran escala (art. 35 RGPD y lista de la AEPD) |
| **Delegado de protección de datos** | Muy probablemente obligatorio (tratar datos de salud a gran escala es la actividad principal); lo asume la consultora |
| **Minimización** | Solo los datos necesarios para cada función; el análisis de uso, sin datos de salud y opcional (ya es opcional en la app) |
| **Derechos** | Ver, exportar y borrar los datos desde la app (ya existe en Yo → Privacidad; falta conectarlo a la nube) |
| **Brechas** | Procedimiento para notificar a la AEPD en 72 horas y avisar a las personas afectadas |
| **Ubicación** | Datos alojados en la UE |

### 6.3 Asistente con IA
- **Datos mínimos:** a la IA solo le llega lo imprescindible de cada pregunta (p. ej. "semana 12, náuseas leves, 0 de 2
  sesiones de fuerza"), **sin nombre ni identificadores**.
- **Proveedor:** contrato de encargado del tratamiento, **sin conservación de los datos** ni uso para entrenar, y garantías
  para la transferencia internacional (el proveedor puede estar fuera de la UE).
- **Consentimiento propio** para activar el asistente; sin él, la app usa el asistente local del móvil.
- **Transparencia (Ley Europea de IA, art. 50):** desde el **2 de agosto de 2026** es obligatorio avisar de que se habla
  con una IA. La app ya lo indica en el chat ("no da indicaciones médicas"); añadir un aviso explícito de IA.

### 6.4 Seguridad
Cifrado en tránsito y en reposo · cuentas con verificación · acceso a los datos de cada paciente solo para él y su
clínica (reglas en la base de datos) · registro de accesos del panel profesional · copias de seguridad · pruebas de
seguridad externas antes del piloto · camino a **ISO 27001** cuando lleguen aseguradoras.

### 6.5 Evidencia: estudio del piloto
| Elemento | Propuesta |
|---|---|
| Tipo | Estudio **observacional prospectivo** en la clínica del piloto, aprobado por un **CEIm**; investigador principal: un médico de la clínica |
| Participantes | Adultos que empiezan un GLP-1 para la obesidad y aceptan participar (consentimiento del estudio aparte del de la app) |
| Resultado principal | **Persistencia en el tratamiento a 3 y 6 meses**, frente a la referencia histórica de la clínica |
| Otros resultados | Cambio de peso y cintura, uso de la app, ánimo (check-ins), calidad de vida con un cuestionario validado, satisfacción del paciente y del profesional |
| Para qué sirve | Publicar, convencer a nuevas clínicas, preparar la evaluación clínica del marcado CE y negociar con aseguradoras |

### 6.6 Cambios en la app que salen de este paso (para los meses 0–2)
1. Panel profesional: ordenar por hechos (no por riesgo) en la versión del piloto.
2. Índice Towigo de la Fase 1 sin área de glucosa (la glucosa, aparte).
3. Aviso explícito de IA en el chat y consentimiento propio para el asistente.
4. Envío a la IA solo de datos mínimos y sin identificadores (función del servidor).
5. Exportar y borrar datos conectado a la nube; registro de accesos del panel.

### Quién nos ayuda
Una **consultora externa** que: firme el análisis de si Towigo es o no producto sanitario en la Fase 1, haga la EIPD,
redacte los textos legales y los contratos con clínicas y proveedores, actúe como delegado de protección de datos y
prepare la hoja de ruta del marcado CE.

**Fuentes:** [MDCG 2019-11, explicada (OpenRegulatory)](https://openregulatory.com/mdcg/mdcg-2019-11) ·
[Emergo – revisión 1 de MDCG 2019-11](https://www.emergobyul.com/news/european-revision-primary-software-guidance-mdcg-2019-11-revision-1-small-changes-meaningful) ·
[Bristows – regla 11](https://www.bristows.com/news/deciphering-rule-11-new-guidance-on-the-classification-of-software-medical-devices-under-the-eu-mdr) ·
[Cooley – Ley de IA, art. 50 desde el 2 de agosto de 2026](https://cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026) ·
[Stibbe – obligaciones de transparencia](https://www.stibbe.com/publications-and-insights/the-ai-acts-transparency-obligations-rules-scope-and-timeline) ·
[AEPD – lista de tratamientos que requieren EIPD](https://www.aepd.es/es/prensa-y-comunicacion/notas-de-prensa/la-aepd-publica-el-listado-de-tratamientos-en-los-que-es)

---

## 7. Costes, equipo y métricas clave

### Decisión
| Pregunta | Decisión |
|---|---|
| Fundador | **Javi a dedicación completa** como CEO: clínicas, pacientes, piloto, inversores y producto |
| Tecnología | **Freelance o agencia**, por proyecto |
| Parte clínica | **Asesor médico (endocrino) + nutricionista** |
| Presupuesto primer año | **Ajustado: menos de 100.000 €** |

### Equipo del primer año
| Papel | Quién | Dedicación | Cómo se paga |
|---|---|---|---|
| CEO / producto | Javi | Completa | Sueldo mínimo o ninguno el primer año (ver presupuesto) |
| Desarrollo (app, nube, seguridad) | Freelance o agencia de React Native / Expo | ≈ 400 h en los meses 0–2; ≈ 40 h/mes después | Por horas o por proyecto |
| Asesor médico | Endocrino (idealmente de la clínica del piloto o cercano) | 4–6 h/mes | Pequeño pago + participación (≈ 0,5–1 %, a 2 años) |
| Contenido y nutrición | Nutricionista | ≈ 20 h/mes desde el mes 3 | Por horas |
| Regulación y datos | Consultora externa (paso 6) | Por proyecto + delegado de protección de datos | Por proyecto + cuota |
| Administración | Gestoría | Mensual | Cuota |

**Riesgo del modelo freelance:** el conocimiento de la app queda fuera de la empresa. **Cómo lo cubrimos:** el código es
siempre de Towigo (repositorio propio), con pruebas automáticas y documentación (ya existen), contrato con cesión de
derechos y entregas pequeñas revisadas. **Cuando llegue la financiación del paso 8**, incorporar un perfil técnico
fijo o un cofundador técnico.

### Presupuesto del primer año (estimación)
| Partida | Importe | Notas |
|---|---|---|
| Desarrollo — preparación (meses 0–2) | 18.000 € | ≈ 400 h × 45 €/h: cuentas y nube, sincronización, suscripciones, código y marca de clínica, cambios del paso 6 |
| Desarrollo — mejoras y mantenimiento (meses 3–12) | 16.000 € | ≈ 40 h/mes × 9 meses × 45 €/h |
| Prueba de seguridad externa | 4.000 € | Antes del piloto |
| Nube, tiendas y herramientas | 1.500 € | Base de datos y servidor en la UE, compilación, cuentas de Apple y Google, dominio y correo |
| Asistente con IA | 1.500 € | Provisión; se ajusta con el uso real (datos mínimos por pregunta) |
| Consultora: producto sanitario + RGPD | 12.000 € | Análisis de producto sanitario, evaluación de impacto, textos legales, contratos y delegado de protección de datos |
| Estudio del piloto | 4.000 € | Tasas del comité de ética, análisis estadístico, publicación |
| Asesor médico | 3.600 € | ≈ 300 €/mes + participación |
| Nutricionista (contenido) | 6.000 € | Meses 3–12 |
| Contenido y marketing | 8.000 € | Diseño, vídeo, material para clínicas y farmacias, campañas pequeñas en los meses 9–12 |
| Empresa y administración | 5.000 € | Constitución de la sociedad, gestoría, seguro de responsabilidad civil, registro de la marca Towigo |
| Viajes y eventos | 2.000 € | Clínicas, farmacias, congresos |
| **Subtotal** | **81.600 €** | |
| Imprevistos (10 %) | 8.200 € | |
| **Total primer año** | **≈ 90.000 €** | **Sin sueldo del fundador** |

**El sueldo de Javi** (p. ej. 1.500 €/mes = 18.000 €/año) llevaría el total a ≈ 108.000 €. Para quedarse por debajo de
100.000 € hay que cubrirlo con ayudas o capitalización de la prestación por desempleo (si aplica), o empezar a cobrar
cuando entre la financiación. Se decide en el paso 8.

**Ingresos del primer año** (paso 4): pequeños (≈ 300 suscriptores al mes 12 ≈ 20.000 €/año a ese ritmo). El primer año
se financia con fondos propios, ayudas y una ronda pequeña.

### Métricas clave (las que miramos cada semana)
**Métrica principal:** **pacientes activos cada semana que siguen su tratamiento** (registran su inyección o su
mantenimiento). Une la misión (hábitos acompañados) con el negocio.

| Área | Métrica | Objetivo inicial |
|---|---|---|
| Activación | % que en la primera semana conecta con su clínica y hace 3 registros | ≥ 70 % |
| Retención | % que sigue usando la app en la semana 4 y en la semana 12 | ≥ 70 % / ≥ 60 % |
| Persistencia | % que sigue el tratamiento a 3 y 6 meses (estudio) | Mejor que la referencia de la clínica |
| Conversión | % de pruebas gratuitas que pasan a pago | ≥ 30 % |
| Bajas | % de suscriptores que se dan de baja cada mes | ≤ 6 % |
| Clínicas | Clínicas activas y profesionales que usan el panel cada semana | 2 en el piloto → 5–10 al mes 12 |
| Satisfacción | Recomendación de pacientes y profesionales (NPS) | ≥ 40 |
| Eficiencia | Coste por usuario captado (canales con gasto) y coste de nube + IA por usuario activo | Por debajo de lo que deja cada suscriptor |
| Caja | Meses de caja que quedan | Siempre ≥ 6 meses |

*Por decidir:* nombres del asesor médico y del nutricionista; elegir freelance o agencia (pedir 2–3 presupuestos con el
alcance de los meses 0–2).

---

## 8. Plan financiero y ronda *(siguiente paso)*
