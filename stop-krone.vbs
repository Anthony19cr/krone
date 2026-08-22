Set objShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\stop-krone.ps1"""
objShell.Run cmd, 0, True
MsgBox "Servidores de Krone detenidos.", 64, "Krone"
