# Towigo Pro — panel del equipo sanitario

**Demo:** https://javicavero.github.io/towigo/#pro (o desde la app: Yo → Panel profesional).

## Qué incluye

- **Pacientes priorizados.** Lista ordenada por quién necesita revisión hoy, con los motivos visibles. Por ejemplo: inyección no registrada, hipoglucemias ≥4 %, TIR <70 %, glucosa en ayunas sobre objetivo, sin datos ≥3 días, efectos moderados o fuertes, ánimo bajo, meseta, cambio de fase próximo o mensaje pendiente. Incluye KPIs de la consulta, filtros y buscador.
- **Ficha clínica**, según el perfil:
  - Tipo 1: AGP de 14 días (mediana y percentiles 25–75 y 5–95), tiempo en rangos con los cortes de consenso, TIR, TBR, GMI y CV.
  - Tipo 2: glucosa en ayunas con su banda objetivo y HbA1c.
  - GLP-1: adherencia de 12 semanas con la dosis registrada y la fase actual de la pauta.
  - Para todos: peso y composición, efectos secundarios, ánimo de 14 días, hábitos, preguntas que el paciente preparó para la consulta e informe PDF.
- **Pauta y objetivos.** El profesional edita la pauta de escalado de GLP-1, la basal pautada (tipo 1), la proteína, la fuerza, el agua y los rangos de glucosa. Al guardar, se envía a la app del paciente junto con un mensaje de aviso. En la demo, si editas al paciente "(tú)", el cambio aparece en tu app.
- **Mensajería.** Bandeja ordenada por prioridad y conversación por paciente, con plantillas por especialidad (endocrinología, nutrición y psicología) y audios con transcripción (simulados en la demo).
- **Notas de consulta** internas del equipo, que el paciente no ve.

## Límites (Fase 1)

- La prioridad ordena la revisión y no genera indicaciones automáticas al paciente.
- Towigo no propone dosis: las pautas las introduce siempre el profesional.

## Pendiente para producción

- Autenticación de profesionales y roles (Supabase Auth + RLS por centro).
- Pacientes reales sincronizados.
- Auditoría de accesos (RGPD art. 9).
- Firma de cambios de pauta.
- Exportación al sistema de historia clínica (HL7 FHIR).
