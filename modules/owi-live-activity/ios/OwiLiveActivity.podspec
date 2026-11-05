Pod::Spec.new do |s|
  s.name           = 'OwiLiveActivity'
  s.version        = '0.1.0'
  s.summary        = 'Live Activity de Owi (Towigo)'
  s.author         = 'Towigo'
  s.homepage       = 'https://github.com/javicavero/towigo'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '16.2' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
