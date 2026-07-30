$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.\node_modules\electron\dist\electron.exe')) {
  Write-Host 'Electron 尚未安装，请先运行 npm install。'
  exit 1
}
npm start
