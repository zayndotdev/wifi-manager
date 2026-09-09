$ips = @("192.168.1.1","192.168.1.2","192.168.1.3","192.168.1.4","192.168.1.8","192.168.1.9","192.168.1.10","192.168.1.12","192.168.1.13","192.168.1.19")

foreach ($ip in $ips) {
    try {
        $result = Resolve-DnsName -Name $ip -DnsOnly -ErrorAction Stop
        Write-Output "$ip -> $($result.NameHost)"
    } catch {
        Write-Output "$ip -> [NO PTR]"
    }
}
