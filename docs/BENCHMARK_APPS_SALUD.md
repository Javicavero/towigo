# Benchmark de apps de salud y mejoras para Towigo

_Noviembre 2026. Respeta los límites de la Fase 1: sin cálculo ni sugerencia de dosis y sin alertas clínicas automáticas._

## Qué hacen bien las mejores

| App | Qué hace bien | Qué aprendemos |
|---|---|---|
| **Omada (GLP-1 Companion)** | Programa de constancia: 67 % sigue con el tratamiento al año frente al 47–49 % habitual. El 63 % mantiene el peso 12 meses después de dejarlo. Educación sobre proteína y músculo. | La constancia es el producto. Hace falta un modo "después del GLP-1". |
| **WeightWatchers GLP-1** | Objetivo de proteína de 1 g/kg, vídeos de fuerza, registro de inyección (fármaco, dosis y zona) y de efectos secundarios. | Proteger el músculo es el gran mensaje clínico de 2025-26. |
| **MeAgain** | Compañero con personaje (Capy), varios widgets, sincronización con Apple Salud y Health Connect, rachas y celebraciones de hitos. **No exporta informes.** | Nuestro competidor más directo. Owi ya está a su nivel; el informe para el médico nos diferenciaría. |
| **MyTherapy** | Gratuita, recordatorios del escalado de dosis, gráficas de progreso. | Mostrar el calendario de escalado **que pauta el médico**, sin sugerir nada. |
| **mySugr** | HbA1c estimada, informes PDF/CSV para el equipo sanitario, retos. | El informe para la consulta es una función que se espera. |
| **Oviva** | DiGA de obesidad en Alemania (la más prescrita en 2024), terapia conductual y coach humano. Bajada de HbA1c en T2 en 3 meses. | Hay una vía regulatoria con reembolso: prepararse desde ya para la evidencia. |
| **Noom / Nourishly** | Microlecciones diarias, "misiones" y habilidades para gestionar la ansiedad por comer. | Contenido corto que da un motivo para abrir la app cada día. |
| **Apple Salud (iOS 26.x)** | Rediseño hacia un registro más simple y un papel de "coach" activo. | Integrarse en lugar de competir: leer pasos, peso y sueño. |

**Evidencia transversal:** la combinación de coach humano e IA retiene mucho mejor que la automatización pura. El abandono medio en estas apps ronda el 43 %, y un caso publicado pasó del 2 % de retención al ~40 % al añadir clínicos. El equipo humano (pestaña Equipo) es nuestra ventaja: hay que potenciarlo.

## Mejoras propuestas (por prioridad)

| # | Mejora | Inspiración | Impacto | Esfuerzo | ¿Cabe en la Fase 1? |
|---|---|---|---|---|---|
| 1 | **Informe para la consulta (PDF)**: inyecciones, zonas, peso, composición corporal, glucosa, HbA1c, efectos secundarios y adherencia de las últimas 4-12 semanas | mySugr, hueco de MeAgain | Muy alto | Medio | Sí (solo datos) |
| 2 | **Proteína y músculo**: objetivo de proteína que fija la nutricionista, contador rápido por comida y mini rutinas de fuerza de 10 min | WW, Omada | Muy alto | Medio | Sí (lo fija el equipo) |
| 3 | **Apple Salud / Health Connect**: leer pasos, peso, sueño y glucosa; escribir el peso | MeAgain, Apple | Alto | Medio (necesita build nativa) | Sí |
| 4 | **Calendario del escalado pautado**: el médico introduce las fases y la app las muestra y las recuerda | MyTherapy | Alto | Bajo | Sí (sin sugerir dosis) |
| 5 | **Microlecciones de 2 min y "misiones" semanales** narradas por Owi (náuseas, saciedad, comer fuera, ansiedad por comer) | Noom, Nourishly | Alto | Medio (contenido) | Sí |
| 6 | **Programa de constancia**: hitos en las semanas 4, 12, 26 y 52, mensaje del equipo en momentos de riesgo (inyección olvidada, meseta) y botón "hablar con mi equipo" | Omada, evidencia híbrida | Muy alto | Medio | Sí (el aviso va a una persona, no es una instrucción clínica) |
| 7 | **Modo mantenimiento** para quien deja o reduce el GLP-1: hábitos, peso estable y fuerza | Omada | Alto | Bajo-medio | Sí |
| 8 | **Registro con foto de comida** (sin calorías automáticas al principio; el equipo lo revisa) | Oviva, WW | Medio | Medio | Sí |
| 9 | **Celebraciones de hitos** compartibles (−5 %, 12 semanas…) con Owi | MeAgain | Medio | Bajo | Sí |
| 10 | **Widget de pantalla de bloqueo** y Live Activity el día de la inyección | MeAgain | Medio | Bajo (sobre lo ya hecho) | Sí |
| 11 | **Plan de evidencia DiGA / Europa** (métricas de resultados, estudio piloto) | Oviva | Estratégico | Alto | Preparar la Fase 2 |
| 12 | Métricas estimadas (HbA1c estimada) con aviso claro | mySugr | Medio | Bajo | Con cautela: revisar regulación |

## Recomendación

Siguiente sprint: **1 (informe PDF), 2 (proteína y fuerza), 4 (escalado pautado) y 6 (programa de constancia)**. Son las que más diferencian a Towigo de MeAgain y del resto, y son seguras en la Fase 1.

## Gluroo (tipo 1): lo que hemos copiado y adaptado

| Lo que hace bien Gluroo | En Towigo |
|---|---|
| Registrar escribiendo como en un chat ("dosed 2u 15m ago") | Chat con Owi que entiende "4 u de rápida hace 15 min", "45 g de carbos", "peso 98,5" y pide confirmación |
| GluCrew: varias personas acompañan y apuntan | "Tu gente" con permisos (resumen, apuntar por ti, "Necesito ayuda") y ánimos a través de Owi |
| Foto de la comida → carbohidratos, proteína… | Foto o descripción → estimación aproximada y editable; la nutricionista puede revisarla |
| Gráfica con glucosa, insulina y comidas juntas; vista por días | "Tu día en una gráfica" + lista del día |
| Glucosa en bloqueo, Live Activity y Apple Watch | Live Activity de Owi (bloqueo, Dynamic Island, Smart Stack del reloj) |
| Soporte para profesionales | Informe PDF para la consulta con preguntas del paciente |

Lo que **no** copiamos por la Fase 1: insulina activa (IOB), alertas automáticas de glucosa y cualquier cálculo de dosis.

Fuentes: https://gluroo.com · https://www.healthline.com/healthy/gluroo-the-simplest-yet-most-comprehensive-diabetes-tool-you-may-ever-need · https://gluroo.com/?p=3410 · https://gluroo.com/home-pmh/

## Estado

- Hechas en la versión 0.10: chat con Owi, check-in emocional, Tu gente, foto de comida, modo mantenimiento, Live Activity y Apple Watch, y el perfil tipo 1.
- Hechas en la versión 0.9: 1 (informe PDF), 2 (proteína y fuerza), 4 (pauta de escalado) y 6 (programa de constancia).

## Fuentes

- MeAgain: https://meagain.com/best-glp-1-tracker-apps
- MyTherapy: https://www.mytherapyapp.com/glp1-apps
- Comparativa Mumsnet: https://www.mumsnet.com/talk/weight-loss-injections/5546744-comparing-glp-1-tracking-apps-and-companion-tools-for-weight-loss-treatment
- Omada (constancia): https://investors.omadahealth.com/news-releases/news-release-details/omada-healths-glp-1-behavior-change-companion-programs-help
- Omada 2025: https://www.omadahealth.com/resource-center/a-year-in-real-world-research-omadas-top-glp-1-insights-of-2025
- WeightWatchers GLP-1: https://www.weightwatchers.com/us/how-it-works/glp-1-program · https://hitconsultant.net/2025/12/17/weight-watchers-launches-new-glp-1-program-and-ai-app-features/
- Oviva: https://oviva.com/global/wp-content/uploads/2022/08/Oviva_Factsheet.pdf
- mySugr: https://www.mysugr.com/app
- Apps para T2: https://appshunter.io/ios/topics/type-2-diabetes
- Apple Salud: https://www.macworld.com/article/3009615/leak-reveals-details-of-apples-secret-roadmap-ios-26-4-and-ios-27.html
- Revisión sistemática de coaching (Frontiers 2025): https://www.frontiersin.org/articles/10.3389/fdgth.2025.1536416/full
- Coach humano frente a automatización: https://www.pulse.bot/ai/news/why-removing-humans-from-care-may-undermine-outcomes-985d9740-cdfb-4430-a12c-87a43b04f7a0/
