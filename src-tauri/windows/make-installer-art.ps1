# Draws the NSIS sidebar (164x314) and header (150x57) bitmaps from the app icon.
# Re-run after changing icons/icon.png:  powershell -File src-tauri\windows\make-installer-art.ps1
Add-Type -AssemblyName System.Drawing
$here = $PSScriptRoot
$icon = [System.Drawing.Image]::FromFile((Join-Path $here '..\icons\icon.png'))
$teal = [System.Drawing.Color]::FromArgb(0, 168, 142)
$tealDark = [System.Drawing.Color]::FromArgb(0, 110, 94)
$quality = {
    param($g)
    $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.TextRenderingHint = 'AntiAliasGridFit'
}

# Sidebar: teal gradient, white rounded tile with the padlock, product name below.
$side = New-Object System.Drawing.Bitmap 164, 314
$g = [System.Drawing.Graphics]::FromImage($side); & $quality $g
$rect = New-Object System.Drawing.Rectangle 0, 0, 164, 314
$g.FillRectangle((New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $teal, $tealDark, 90), $rect)
$tile = New-Object System.Drawing.Drawing2D.GraphicsPath
$x = 42; $y = 70; $s = 80; $r = 20
$tile.AddArc($x, $y, $r, $r, 180, 90); $tile.AddArc($x + $s - $r, $y, $r, $r, 270, 90)
$tile.AddArc($x + $s - $r, $y + $s - $r, $r, $r, 0, 90); $tile.AddArc($x, $y + $s - $r, $r, $r, 90, 90); $tile.CloseFigure()
$g.FillPath([System.Drawing.Brushes]::White, $tile)
$g.DrawImage($icon, $x + 10, $y + 10, $s - 20, $s - 20)
$center = New-Object System.Drawing.StringFormat; $center.Alignment = 'Center'
$g.DrawString('Nexus Vault', (New-Object System.Drawing.Font 'Segoe UI Semibold', 15), [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF 0, 172, 164, 30), $center)
$soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(215, 255, 255, 255))
$g.DrawString("Tus contrase$([char]0xF1)as,`ncifradas en tu equipo", (New-Object System.Drawing.Font 'Segoe UI', 8.5), $soft, (New-Object System.Drawing.RectangleF 0, 204, 164, 40), $center)
$side.Save((Join-Path $here 'installer-sidebar.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)

# Header: white strip with the padlock at the right edge (where NSIS shows it).
$head = New-Object System.Drawing.Bitmap 150, 57
$g = [System.Drawing.Graphics]::FromImage($head); & $quality $g
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($icon, 104, 8, 40, 40)
$g.DrawString('Nexus Vault', (New-Object System.Drawing.Font 'Segoe UI Semibold', 10), (New-Object System.Drawing.SolidBrush $tealDark), 6, 18)
$head.Save((Join-Path $here 'installer-header.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
