$installer = "C:\Users\hp-new\Desktop\wifi-management\drivers\npcap-installer.exe"
if (Test-Path $installer) {
    Write-Host "Found installer at $installer"
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $installer
        $psi.Arguments = "/winpcap_mode=yes /S"
        $psi.Verb = "runas"
        $psi.UseShellExecute = $true
        $p = [System.Diagnostics.Process]::Start($psi)
        if ($p -ne $null) {
            Write-Host "Process started with PID: $($p.Id). Waiting for completion..."
            $p.WaitForExit()
            Write-Host "Process finished with ExitCode: $($p.ExitCode)"
        } else {
            Write-Host "Process returned null"
        }
    } catch {
        Write-Host "Error launching: $_"
    }
} else {
    Write-Host "Installer not found"
}
