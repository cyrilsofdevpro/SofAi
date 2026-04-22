[Setup]
AppName=SofAi Command Agent
AppVersion=1.0.0
AppPublisher=SofAi Team
AppPublisherURL=https://sofai.com
AppCopyright=Copyright 2026 SofAi Team
DefaultDirName={pf}\SofAi\CommandAgent
DefaultGroupName=SofAi
OutputDir=.\dist
OutputBaseFilename=SofAiCommandAgent-Setup
Compression=lz4
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Start SofAi Command Agent at system startup"; GroupDescription: "Startup"

[Files]
Source: "dist\{#SetupSetting('AppName')}-1.0.0.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\system_commander.py"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\requirements.txt"; DestDir: "{app}\backend"; Flags: ignoreversion

[Dirs]
Name: "{app}\backend"
Name: "{app}\logs"

[Icons]
Name: "{group}\SofAi Command Agent"; Filename: "{app}\SofAi Command Agent.exe"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,SofAi Command Agent}"; Filename: "{uninstallexe}"
Name: "{userdesktop}\SofAi Command Agent"; Filename: "{app}\SofAi Command Agent.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\SofAi Command Agent.exe"; Description: "Launch SofAi Command Agent"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Create startup shortcut if task selected
    if IsTaskSelected('autostart') then
    begin
      CreateDir(ExpandConstant('{userstartup}'));
      CreateShellLink(
        ExpandConstant('{userstartup}\SofAi Command Agent.lnk'),
        ExpandConstant('{app}\SofAi Command Agent.exe'),
        ExpandConstant('{app}'),
        '',
        0
      );
    end;
    
    // Register Windows service (optional)
    // This would require NSSM (Non-Sucking Service Manager) or similar
    ShellExec('open', 'cmd.exe', '/c echo Service registration would go here', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    DeleteFile(ExpandConstant('{userstartup}\SofAi Command Agent.lnk'));
  end;
end;
