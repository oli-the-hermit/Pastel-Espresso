; Installer hooks for the rename from Focus Space to Pastel Espresso (1.4.0).
;
; Windows names the install folder and the Apps entry after the product name, so
; without these hooks the 1.3 -> 1.4 update would install Pastel Espresso beside
; the old Focus Space app instead of replacing it. Before installing, they run the
; old app's own uninstaller silently; afterwards, they give the new app the
; Start-menu and desktop shortcuts the old one had (an update skips creating them).
;
; The data stays: both apps share the identifier and so the data folder, and the
; old uninstaller only deletes data when its "Delete the application data" box is
; ticked, which a silent run never does.
;
; A test build ("Pastel Espresso Test") replaces only the old "Focus Space Test",
; so it can be tried on a PC that has the real app installed.
;
; Remove in 1.5, once 1.4 has replaced every 1.3 install.

!macro PE_DefineOldProductName
  !ifndef PE_OLD_PRODUCTNAME
    !if "${PRODUCTNAME}" == "Pastel Espresso Test"
      !define PE_OLD_PRODUCTNAME "Focus Space Test"
    !else
      !define PE_OLD_PRODUCTNAME "Focus Space"
    !endif
  !endif
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro PE_DefineOldProductName
  Var /GLOBAL PeOldDir
  Var /GLOBAL PeOldStartMenu
  Var /GLOBAL PeOldDesktop
  StrCpy $PeOldStartMenu 0
  StrCpy $PeOldDesktop 0

  ; The installs are per user, so the old entry is in HKCU.
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PE_OLD_PRODUCTNAME}" "UninstallString"
  ${If} $0 != ""
    ReadRegStr $PeOldDir HKCU "Software\${MANUFACTURER}\${PE_OLD_PRODUCTNAME}" ""
    ${If} $PeOldDir == ""
      StrCpy $PeOldDir "$LOCALAPPDATA\${PE_OLD_PRODUCTNAME}"
    ${EndIf}

    ${If} ${FileExists} "$PeOldDir\uninstall.exe"
      ; Note the old shortcuts now: the uninstaller removes them.
      ${If} ${FileExists} "$SMPROGRAMS\${PE_OLD_PRODUCTNAME}.lnk"
        StrCpy $PeOldStartMenu 1
      ${EndIf}
      ${If} ${FileExists} "$DESKTOP\${PE_OLD_PRODUCTNAME}.lnk"
        StrCpy $PeOldDesktop 1
      ${EndIf}

      DetailPrint "Removing ${PE_OLD_PRODUCTNAME}, the app's former name"
      ; _?= runs the uninstaller in place, so ExecWait really waits for it.
      ClearErrors
      ExecWait '"$PeOldDir\uninstall.exe" /S _?=$PeOldDir' $1
      ${If} ${Errors}
      ${OrIf} $1 <> 0
        ; Not fatal: the new app still installs, beside the old one.
        DetailPrint "Couldn't remove ${PE_OLD_PRODUCTNAME} (exit code $1)"
      ${Else}
        ; Running in place leaves the uninstaller and its folder behind.
        Delete "$PeOldDir\uninstall.exe"
        RMDir "$PeOldDir"
        ; The old install path; the uninstaller keeps it unless data is deleted.
        DeleteRegKey HKCU "Software\${MANUFACTURER}\${PE_OLD_PRODUCTNAME}"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  !insertmacro PE_DefineOldProductName
  ${If} $PeOldStartMenu = 1
  ${AndIfNot} ${FileExists} "$SMPROGRAMS\${PRODUCTNAME}.lnk"
    CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  ${EndIf}
  ${If} $PeOldDesktop = 1
  ${AndIfNot} ${FileExists} "$DESKTOP\${PRODUCTNAME}.lnk"
    CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
  ${EndIf}
!macroend
