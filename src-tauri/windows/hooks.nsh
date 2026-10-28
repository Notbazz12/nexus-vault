; Registers the Edge native-messaging host shipped next to the app.
; The manifest's "path" is relative, so Edge resolves it inside $INSTDIR.
!define NEXUS_HOST_KEY "Software\Microsoft\Edge\NativeMessagingHosts\com.nexusvault.host"

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "${NEXUS_HOST_KEY}" "" "$INSTDIR\com.nexusvault.host.json"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "${NEXUS_HOST_KEY}"
!macroend
