# Towigo · Modelo de negocio

Documento vivo: lo construimos paso a paso. Cada paso recoge las decisiones tomadas y el porqué.

| Paso | Tema | Estado |
|---|---|---|
| 1 | Identidad: propósito, misión, visión y valores | ✅ Decidido |
| 2 | Clientes: a quién servimos y quién paga | ✅ Decidido |
| 3 | Propuesta de valor por cliente y alternativas | ⏳ Siguiente |
| 4 | Modelo de ingresos y precios | Pendiente |
| 5 | Canales y salida al mercado (piloto, primeros 1.000 usuarios) | Pendiente |
| 6 | Regulación y confianza (Fase 1 vs. producto sanitario, RGPD, evidencia) | Pendiente |
| 7 | Costes, equipo y métricas clave | Pendiente |
| 8 | Plan financiero y ronda | Pendiente |

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

## 3. Propuesta de valor *(siguiente paso)*
