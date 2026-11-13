# serve.ps1 - Quick local HTTP server for development
# Requires Python 3 or PowerShell 7+
# Run from the project root folder

$port = 8080
$dir  = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Holsenbeck Lunch Reservation App" -ForegroundColor Cyan
Write-Host "  Serving on http://localhost:$port" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Make sure PocketBase is already" -ForegroundColor Yellow
Write-Host "running at http://127.0.0.1:8090" -ForegroundColor Yellow
Write-Host ""

# Try Python 3 first
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    Push-Location $dir
    python3 -m http.server $port
    Pop-Location
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Push-Location $dir
    python -m http.server $port
    Pop-Location
} else {
    Write-Host "Python not found. Trying PowerShell HTTP listener..." -ForegroundColor Yellow
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    Write-Host "Serving at http://localhost:$port/ - press Ctrl+C to stop" -ForegroundColor Green
    while ($listener.IsListening) {
        $ctx  = $listener.GetContext()
        $req  = $ctx.Request
        $res  = $ctx.Response
        $path = $req.Url.AbsolutePath -replace '^/', ''
        if (-not $path) { $path = 'index.html' }
        $file = Join-Path $dir $path
        if (Test-Path $file -PathType Leaf) {
            $bytes = [IO.File]::ReadAllBytes($file)
            $ext   = [IO.Path]::GetExtension($file).ToLower()
            $mime  = switch ($ext) {
                '.html' { 'text/html' }
                '.css'  { 'text/css' }
                '.js'   { 'application/javascript' }
                '.json' { 'application/json' }
                '.ico'  { 'image/x-icon' }
                default { 'application/octet-stream' }
            }
            $res.ContentType      = $mime
            $res.ContentLength64  = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.Close()
    }
}

