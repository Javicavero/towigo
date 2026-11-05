import ActivityKit
import ExpoModulesCore

/// Inicia / actualiza / termina la Live Activity de Owi. Solo hay una a la vez.
public class OwiLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OwiLiveActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
      return false
    }

    AsyncFunction("startOrUpdate") { (owiName: String, kind: String, state: [String: String]) in
      guard #available(iOS 16.2, *) else { return }
      let content = OwiActivityAttributes.ContentState(
        mood: state["mood"] ?? "happy", title: state["title"] ?? "", value: state["value"] ?? "",
        detail: state["detail"] ?? "", tone: state["tone"] ?? "green")
      let stale = Date().addingTimeInterval(kind == "glucose" ? 20 * 60 : 8 * 3600)
      if let current = Activity<OwiActivityAttributes>.activities.first(where: { $0.attributes.kind == kind }) {
        await current.update(ActivityContent(state: content, staleDate: stale))
        return
      }
      for other in Activity<OwiActivityAttributes>.activities { await other.end(nil, dismissalPolicy: .immediate) }
      _ = try? Activity.request(
        attributes: OwiActivityAttributes(owiName: owiName, kind: kind),
        content: ActivityContent(state: content, staleDate: stale))
    }

    AsyncFunction("end") { () in
      guard #available(iOS 16.2, *) else { return }
      for a in Activity<OwiActivityAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
    }
  }
}
