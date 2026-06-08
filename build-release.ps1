# build-release.ps1 — gera o APK de release assinado

$keystoreProps = "keystore.properties"
$apkOut = "android\app\build\outputs\apk\release\app-release.apk"

# Verifica keystore.properties
if (-not (Test-Path $keystoreProps)) {
    Write-Error "Arquivo '$keystoreProps' nao encontrado. Crie-o com as credenciais da keystore."
    exit 1
}

$content = Get-Content $keystoreProps -Raw
if ($content -match "SUA_SENHA_AQUI|SEU_ALIAS_AQUI") {
    Write-Error "Preencha as credenciais em '$keystoreProps' antes de buildar."
    exit 1
}

Write-Host "Buildando APK release..." -ForegroundColor Cyan

Push-Location android
try {
    .\gradlew.bat assembleRelease
    if ($LASTEXITCODE -ne 0) { throw "Build falhou" }
} finally {
    Pop-Location
}

if (Test-Path $apkOut) {
    $size = [math]::Round((Get-Item $apkOut).Length / 1MB, 1)
    Write-Host ""
    Write-Host "APK gerado com sucesso!" -ForegroundColor Green
    Write-Host "Caminho : $apkOut" -ForegroundColor White
    Write-Host "Tamanho : ${size} MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Para instalar via ADB:" -ForegroundColor Yellow
    Write-Host "  adb install $apkOut" -ForegroundColor White
} else {
    Write-Error "APK nao encontrado em '$apkOut'"
    exit 1
}
