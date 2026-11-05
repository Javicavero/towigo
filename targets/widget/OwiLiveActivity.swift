// Live Activity de Owi: pantalla de bloqueo, Dynamic Island y Apple Watch (Smart Stack, watchOS 11+).
// Se usa en momentos con principio y fin: el día de la inyección, o la glucosa del sensor (tipo 1).
// La inicia la app con el módulo local "owi-live-activity". Fase 1: solo datos y ánimo, sin indicaciones.
import ActivityKit
import SwiftUI
import WidgetKit

// IMPORTANTE: esta estructura debe ser idéntica a la de modules/owi-live-activity/ios/OwiActivityAttributes.swift
struct OwiActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var mood: String  // una de las 12 emociones de Owi
    var title: String  // "Hoy toca tu inyección" · "Tu glucosa"
    var value: String  // "10:00" · "142 →"
    var detail: String  // "Abdomen derecho" · "hace 3 min · 78 % en rango"
    var tone: String  // "green" | "coral" | "low"
  }
  var owiName: String
  var kind: String  // "injection" | "glucose"
}

private func toneColor(_ tone: String) -> Color {
  switch tone {
  case "coral": return Color("owiCoral")
  case "low": return Color(red: 0.70, green: 0.15, blue: 0.12)
  default: return Color("owiGreen")
  }
}

struct OwiLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: OwiActivityAttributes.self) { context in
      // Pantalla de bloqueo (y Apple Watch en tamaño pequeño)
      OwiLockView(state: context.state, owiName: context.attributes.owiName)
        .activityBackgroundTint(Color.white)
        .activitySystemActionForegroundColor(Color("owiInk"))
        .widgetURL(URL(string: context.attributes.kind == "injection" ? "towigo://registrar/inyeccion" : "towigo://hoy"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image("owi_\(context.state.mood)").resizable().scaledToFit().frame(width: 52, height: 52)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.state.value).font(.system(size: 22, weight: .bold)).foregroundColor(toneColor(context.state.tone))
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.state.title).font(.system(size: 15, weight: .semibold))
            Text(context.state.detail).font(.system(size: 13)).foregroundColor(.secondary)
          }
        }
      } compactLeading: {
        Image("owi_\(context.state.mood)").resizable().scaledToFit().frame(width: 22, height: 22)
      } compactTrailing: {
        Text(context.state.value).font(.system(size: 14, weight: .bold)).foregroundColor(toneColor(context.state.tone))
      } minimal: {
        Image("owi_\(context.state.mood)").resizable().scaledToFit()
      }
    }
    .supplementalActivityFamilies([.small, .medium])
  }
}

struct OwiLockView: View {
  @Environment(\.activityFamily) var family
  let state: OwiActivityAttributes.ContentState
  let owiName: String

  var body: some View {
    if family == .small {
      // Apple Watch (Smart Stack) y CarPlay: compacto
      HStack(spacing: 6) {
        Image("owi_\(state.mood)").resizable().scaledToFit().frame(width: 34, height: 34)
        VStack(alignment: .leading, spacing: 0) {
          Text(state.title).font(.system(size: 12, weight: .semibold)).lineLimit(1)
          Text(state.value).font(.system(size: 18, weight: .bold)).foregroundColor(toneColor(state.tone))
        }
      }
    } else {
      HStack(spacing: 12) {
        Image("owi_\(state.mood)").resizable().scaledToFit().frame(width: 64, height: 64)
        VStack(alignment: .leading, spacing: 2) {
          Text(owiName).font(.system(size: 12, weight: .semibold)).foregroundColor(Color("owiGreen"))
          Text(state.title).font(.system(size: 16, weight: .semibold)).foregroundColor(Color("owiInk"))
          Text(state.detail).font(.system(size: 13)).foregroundColor(Color("owiSecondary")).lineLimit(1)
        }
        Spacer(minLength: 0)
        Text(state.value).font(.system(size: 26, weight: .bold)).foregroundColor(toneColor(state.tone))
      }
      .padding(14)
    }
  }
}
