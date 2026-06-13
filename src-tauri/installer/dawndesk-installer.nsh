!ifndef MUI_BGCOLOR
  !define MUI_BGCOLOR "111111"
!endif

!ifndef MUI_TEXTCOLOR
  !define MUI_TEXTCOLOR "FFFFFF"
!endif

!ifndef MUI_INSTFILESPAGE_COLORS
  !define MUI_INSTFILESPAGE_COLORS "FFFFFF 111111"
!endif

!define MUI_HEADERIMAGE_RIGHT
!define MUI_ABORTWARNING

!macro NSIS_HOOK_POSTINSTALL
  BrandingText "DawnDesk"
!macroend

!macro NSIS_HOOK_PREINSTALL
  BrandingText "DawnDesk"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  BrandingText "DawnDesk"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  BrandingText "DawnDesk"
!macroend
