# Extensión Nexus Vault para Edge

Rellena usuario y contraseña desde tu bóveda local. La extensión no guarda nada:
pide los datos a `nexus-vault-host.exe` (native messaging), que abre el mismo
`vault.db` que la app de escritorio y solo devuelve los logins del sitio abierto.

## Instalar
Con el instalador (`Nexus Vault_*_x64-setup.exe`) el host ya queda registrado en Edge:
solo carga la carpeta `%LOCALAPPDATA%\Nexus Vault\extension` como extensión desempaquetada.

Para desarrollo, sin instalador:
1. `powershell -ExecutionPolicy Bypass -File extension\install-host.ps1`
2. En Edge abre `edge://extensions`, activa **Modo de desarrollador**,
   pulsa **Cargar desempaquetada** y elige esta carpeta `extension`.
3. Crea tu bóveda en la app (`pnpm tauri dev`) si aún no existe.

El ID de la extensión es fijo (`jkgldpjmhklndjnniiflbbbecnbilkdl`) gracias a la
`key` del manifest. Si se publica en la tienda de Edge, añade el ID que asigne la
tienda a `allowed_origins` en `install-host.ps1`.

Al entrar en un campo de usuario o contraseña aparece un menú con tus logins de ese
sitio (o un aviso si no hay ninguno). Si la bóveda está bloqueada, el menú te ofrece
desbloquearla. En un campo de contraseña sin cuentas guardadas (un registro) ofrece
**Generar contraseña segura**, que rellena la contraseña y su confirmación. Al iniciar sesión en una web, la siguiente página te pregunta si quieres
guardar la contraseña; las guardadas desde Edge aparecen en la app al volver a desbloquearla.

La bóveda se bloquea sola a los 5 minutos sin uso, o al cerrar Edge.
