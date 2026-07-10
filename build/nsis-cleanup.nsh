; Limpeza completa de resíduos da Next Level Academia
; Este script é incluído no instalador NSIS gerado pelo electron-builder

!macro customUnInstall
  ; Perguntar se deseja remover dados do utilizador
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja remover todos os dados da aplicação (base de dados, configurações, uploads)?$\r$\n\
    $\r$\n\
    Se escolher Sim, todos os dados serão perdidos permanentemente.$\r$\n\
    Se escolher Não, os dados permanecerão para uma futura reinstalação." \
    IDYES removeUserData IDNO done

  removeUserData:
    ; Remover diretório de dados da aplicação (%APPDATA%/Next Level Academia)
    RMDir /r "$APPDATA\Next Level Academia"
    RMDir /r "$APPDATA\cv.nextlab.nextlevel"
    
    ; Remover diretório local (%LOCALAPPDATA%/next-level-app)
    RMDir /r "$LOCALAPPDATA\next-level-app"
    
    ; Remover licenças na home do utilizador
    Delete "$PROFILE\licencas.json"
    
    ; Remover entradas do registo (caso existam)
    DeleteRegKey HKCU "Software\cv.nextlab.nextlevel"
    DeleteRegKey HKLM "Software\cv.nextlab.nextlevel"
    
    Goto done

  done:
!macroend
