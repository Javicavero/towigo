// Debe ser idéntica a la de targets/widget/OwiLiveActivity.swift (ActivityKit las empareja por nombre y forma).
import ActivityKit

struct OwiActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var mood: String
    var title: String
    var value: String
    var detail: String
    var tone: String
  }
  var owiName: String
  var kind: String
}
