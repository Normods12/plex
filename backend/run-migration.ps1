# Load .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

# Override with migration token
$env:STRAPI_URL = "http://localhost:1337"
# TOKEN WILL BE SET BELOW - update after restarting Strapi
$env:STRAPI_ADMIN_TOKEN = "98506391e0942b1e724ae2e7bb831d5cd887c59881e0109287a54a437806a62ced12cae4a6440b333ed4f922cca55a445c6908a88ff48de073adbf88537c11d15d371d8483214cd9c38acee9415aa48299e68f6401576bc8c943bc5197b3f543567ea72dbcfdedbc36cc305e52e7a7c0b2a1fa4a17f37e3ae48735068d727289"

Write-Host "Starting Plexonics Full Migration..."
Write-Host "Strapi: $env:STRAPI_URL"
Write-Host "Token:  $($env:STRAPI_ADMIN_TOKEN.Substring(0, [Math]::Min(20, $env:STRAPI_ADMIN_TOKEN.Length)))..."

& "..\node_modules\.bin\ts-node.cmd" scripts\full-migration.ts
