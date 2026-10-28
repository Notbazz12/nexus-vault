# Extensión Nexus Vault para Edge

Rellena usuario y contraseña desde tu bóveda local. La extensión no guarda nada:
pide los datos a `nexus-vault-host.exe` (native messaging), que abre el mismo
`vault.db` que la app de escritorio y solo devuelve los logins del sitio abierto.

## Instalar
1. `powershell -ExecutionPolicy Bypass -File extension\install-host.ps1`
2. En Edge abre `edge://extensions`, activa **Modo de desarrollador**,
   pulsa **Cargar desempaquetada** y elige esta carpeta `extension`.
3. Crea tu bóveda en la app (`pnpm tauri dev`) si aún no existe.

El ID de la extensión es fijo (`jkgldpjmhklndjnniiflbbbecnbilkdl`) gracias a la
`key` del manifest. Si se publica en la tienda de Edge, añade el ID que asigne la
tienda a `allowed_origins` en `install-host.ps1`.

Al entrar en un campo de usuario o contraseña aparece un menú con tus logins de ese
sitio. Si la bóveda está bloqueada, el menú te ofrece desbloquearla.

La bóveda se bloquea sola a los 5 minutos sin uso, o al cerrar Edge.
