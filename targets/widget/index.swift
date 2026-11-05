// Widget de Towigo: Owi en la pantalla de inicio y de bloqueo (iOS 17+).
// Datos: instantánea JSON que escribe la app en el App Group "group.app.towigo" (clave "owiWidget").
// Fase 1: solo emociones, recordatorios y datos; nunca indicaciones clínicas.
import SwiftUI
import WidgetKit

struct OwiSnapshot: Codable {
  var owiName: String
  var mood: String
  var message: String
  var nextLabel: String
  var nextValue: String
  var streak: Int
  var deepLink: String

  static let placeholder = OwiSnapshot(
    owiName: "Owi", mood: "happy", message: "¡Vamos juntos!",
    nextLabel: "Racha", nextValue: "0 días", streak: 0, deepLink: "towigo://hoy")

  static func load() -> OwiSnapshot {
    guard let defaults = UserDefaults(suiteName: "group.app.towigo"),
      let raw = defaults.string(forKey: "owiWidget"),
      let data = raw.data(using: .utf8),
      let snap = try? JSONDecoder().decode(OwiSnapshot.self, from: data)
    else { return .placeholder }
    return snap
  }
}

struct OwiEntry: TimelineEntry {
  let date: Date
  let snap: OwiSnapshot
}

struct OwiProvider: TimelineProvider {
  func placeholder(in context: Context) -> OwiEntry { OwiEntry(date: .now, snap: .placeholder) }
  func getSnapshot(in context: Context, completion: @escaping (OwiEntry) -> Void) {
    completion(OwiEntry(date: .now, snap: .load()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<OwiEntry>) -> Void) {
    // La app pide recargar al cambiar los datos; además refrescamos cada 30 minutos.
    let entry = OwiEntry(date: .now, snap: .load())
    completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(30 * 60))))
  }
}

struct OwiWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: OwiEntry

  var owiImage: some View {
    Image("owi_\(entry.snap.mood)").resizable().scaledToFit()
  }

  var body: some View {
    switch family {
    case .accessoryCircular:
      VStack(spacing: 0) {
        Text("\(entry.snap.streak)").font(.system(size: 20, weight: .bold))
        Text("Racha").font(.system(size: 9, weight: .medium))
      }
      .widgetAccentable()
    case .accessoryRectangular:
      HStack(spacing: 6) {
        owiImage.frame(width: 40, height: 40).widgetAccentable()
        VStack(alignment: .leading, spacing: 0) {
          Text(entry.snap.nextLabel).font(.system(size: 12, weight: .semibold))
          Text(entry.snap.nextValue).font(.system(size: 15, weight: .bold))
        }
      }
    case .systemMedium:
      HStack(spacing: 12) {
        owiImage.frame(width: 110, height: 110)
        VStack(alignment: .leading, spacing: 6) {
          Text(entry.snap.owiName).font(.system(size: 12, weight: .semibold)).foregroundColor(Color("owiGreen"))
          Text(entry.snap.message).font(.system(size: 15, weight: .semibold)).foregroundColor(Color("owiInk")).lineLimit(2)
          HStack(spacing: 14) {
            VStack(alignment: .leading) {
              Text(entry.snap.nextLabel).font(.system(size: 11)).foregroundColor(Color("owiSecondary"))
              Text(entry.snap.nextValue).font(.system(size: 15, weight: .bold)).foregroundColor(Color("owiInk"))
            }
            VStack(alignment: .leading) {
              Text("Racha").font(.system(size: 11)).foregroundColor(Color("owiSecondary"))
              Text("\(entry.snap.streak) días").font(.system(size: 15, weight: .bold)).foregroundColor(Color("owiCoral"))
            }
          }
        }
        Spacer(minLength: 0)
      }
    default:  // .systemSmall
      VStack(alignment: .leading, spacing: 4) {
        HStack(alignment: .top) {
          owiImage.frame(width: 72, height: 72)
          Spacer()
          VStack(alignment: .trailing, spacing: 0) {
            Text("\(entry.snap.streak)").font(.system(size: 20, weight: .bold)).foregroundColor(Color("owiCoral"))
            Text("Racha").font(.system(size: 10)).foregroundColor(Color("owiSecondary"))
          }
        }
        Spacer(minLength: 0)
        Text(entry.snap.message).font(.system(size: 13, weight: .semibold)).foregroundColor(Color("owiInk")).lineLimit(2)
      }
    }
  }
}

struct OwiWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OwiWidget", provider: OwiProvider()) { entry in
      OwiWidgetView(entry: entry)
        .containerBackground(Color("$widgetBackground"), for: .widget)
        .widgetURL(URL(string: entry.snap.deepLink))
    }
    .configurationDisplayName("Owi")
    .description("Owi te acompaña desde tu pantalla: su ánimo, tu racha y lo que toca hoy.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
  }
}

@main
struct TowigoWidgets: WidgetBundle {
  var body: some Widget {
    OwiWidget()
  }
}
