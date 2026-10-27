# MODELO DE AMENAZAS (THREAT MODEL) - NEXUS VAULT 🛡️

## 1. Alcance y Metodología

El presente análisis evalúa los vectores de ataque y defensas de NEXUS VAULT utilizando la metodología **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) adaptada a aplicaciones de escritorio de alta seguridad.

---

## 2. Perfil de Adversarios y Capacidades

| Nivel de Adversario | Capacidades | En Alcance |
| :--- | :--- | :---: |
| **Adversario Pasivo de Disco** | Acceso al sistema de archivos local cuando la máquina está apagada o la bóveda bloqueada (ej. disco sustraído, backup filtrado). | **SÍ** |
| **Proceso No Privilegiado** | Aplicación ejecutándose en el mismo espacio de usuario intentando leer la base de datos o el portapapeles. | **SÍ** |
| **Adversario de Red / MITM** | Interceptación de tráfico en la red local o remota. | **SÍ** (NEXUS VAULT opera 100% offline; no hay tráfico de red de secretos). |
| **Adversario Físico Ocasional** | Acceso momentáneo al equipo mientras el usuario está ausente. | **SÍ** (Defendido mediante auto-bloqueo estricto). |
| **Malware en Espacio de Kernel / Rootkit** | Control total del sistema operativo, ganchos de teclado (keylogger), lectura arbitraria de memoria física con privilegios de administrador. | **NO (Limitación Honesta)** |

---

## 3. Matriz de Vectores de Ataque y Estado de Mitigación

A continuación se categorizan explícitamente las amenazas evaluadas, clasificándolas con rigor técnico entre **Mitigado**, **Parcialmente Mitigado** y **No Mitigado**.

| Vector de Ataque | Descripción y Superficie | Estrategia de Mitigación en NEXUS VAULT | Estado de Mitigación |
| :--- | :--- | :--- | :---: |
| **Robo del archivo `vault.db`** | Copia del archivo SQLite desde disco apagado o respaldo sustraído. | Cifrado autenticado XChaCha20-Poly1305 para todos los payloads. Cero texto plano en reposo. Derivación KEK costosa con Argon2id. | **MITIGADO** |
| **Manipulación de Registros Cifrados** | Alteración o corrupción deliberada de bits en la base de datos local para inducir fallos. | El código de autenticación Poly1305 valida la integridad criptográfica de cada bit antes de cualquier deserialización. Modificaciones abortan el descifrado. | **MITIGADO** |
| **Intercambio entre Registros (*Ciphertext Swapping*)** | Un atacante intercambia los blobs cifrados de la fila A a la fila B o inyecta un ítem en el sobre de la DEK. | **Datos Autenticados Adicionales (AAD)** obligatorios: cada payload autentica `version \|\| domain_separator \|\| context_id (UUID)`. El descifrado falla si el contexto no coincide. | **MITIGADO** |
| **Ataques de Fuerza Bruta Fuera de Línea** | Un adversario utiliza clústeres de GPU/ASIC para adivinar la contraseña maestra a partir de `vault_metadata`. | KDF **Argon2id** intensivo en memoria (`m=64 MiB, t=3, p=4`). Hace inviable el cómputo paralelo masivo en GPUs y protege contra ataques de canal lateral de caché. | **MITIGADO** |
| **Ataques a través del WebView (XSS / Inyección)** | Explotación de vulnerabilidades en la interfaz gráfica para ejecutar scripts maliciosos. | Política de Seguridad de Contenido (CSP) ultra-estricta sin scripts remotos ni `unsafe-eval`. Desactivación de ejecución remota y minimización de capacidades en Tauri 2. | **MITIGADO** |
| **Inyección de Protocolos vía Enlaces Externos** | Intento de abrir enlaces con esquemas maliciosos (`file:`, `javascript:`, rutas UNC) para ejecución remota de comandos. | Sanitización y validación previa obligatoria: únicamente esquemas `http://` y `https://` son autorizados para delegación al navegador del sistema operativo. | **MITIGADO** |
| **Ataque de Reversión (*Rollback / Replay*)** | Reemplazo de la base de datos actual por un respaldo legítimo antiguo para revertir cambios de contraseñas. | Se incluye un contador monotónico de revisiones y timestamps auditables dentro del payload cifrado de metadata. El usuario es notificado de discrepancias cronológicas. | **PARCIALMENTE MITIGADO** |
| **Acceso de Otros Usuarios en la Misma Máquina** | Cuentas de usuario locales estándar intentando leer los archivos de la aplicación. | Permisos de archivo restrictivos a nivel de sistema operativo: ACLs `icacls` en Windows exclusivas para el SID del usuario actual; `chmod 0600` en Linux. | **MITIGADO** (frente a usuarios estándar) |
| **Persistencia de Secretos en Memoria Residual** | Retención de fragmentos de contraseñas en memoria volátil tras el bloqueo. | En Rust: uso de `Zeroize`/`ZeroizeOnDrop` y `Zeroizing<T>`. En frontend: purga inmediata de estado Zustand al bloquear. Sin embargo, V8 no garantiza la recolección determinista de strings inmutables en heap. | **PARCIALMENTE MITIGADO** |
| **Extensiones Maliciosas de Navegador** | Extensiones de terceros en el navegador interceptando credenciales al autocompletar. | Native Messaging autenticado y con autorización explícita del usuario para cada dominio en fases futuras (Fase 09). Actualmente fuera del alcance local. | **PARCIALMENTE MITIGADO** |
| **Malware en Kernel / Rootkit / Keylogger** | Software malicioso con privilegios administrativos capturando pulsaciones del teclado o volcando memoria física. | **Límite honesto de seguridad**: Si el sistema operativo anfitrión está comprometido a nivel de ring 0/administrador, ninguna aplicación de espacio de usuario puede garantizar confidencialidad. | **NO MITIGADO** |
| **Ataques de Arranque en Frío (*Cold Boot Attacks*)** | Extracción física de la memoria RAM con el equipo encendido y la bóveda activamente desbloqueada. | Durante el tiempo en que la bóveda está desbloqueada, la DEK debe residir en RAM para operar. Se mitiga reduciendo el tiempo de permanencia con auto-bloqueo estricto por inactividad. | **PARCIALMENTE MITIGADO** |

---

## 4. Limitaciones Honestas de Seguridad

Ninguna aplicación de software puede garantizar invulnerabilidad frente a un entorno hostil subyacente. Declaramos explícitamente:

1. **Compromiso del Sistema Operativo**:
   - Si la computadora anfitriona está infectada por un keylogger activo a nivel de kernel, un troyano con privilegios de administrador o malware de acceso remoto (RAT), el adversario puede capturar la contraseña maestra mientras el usuario la escribe en su teclado físico.
   - NEXUS VAULT **no afirma proteger** contra malware de nivel de sistema operativo ni contra dispositivos manipulados a nivel de hardware.
2. **Ataques de Arranque en Frío (*Cold Boot Attacks*)**:
   - Mientras la bóveda se encuentra activamente desbloqueada y el usuario trabajando, la clave DEK reside necesariamente en la memoria RAM para permitir el descifrado inmediato de los registros consultados. Un atacante con acceso físico y herramientas de congelamiento de memoria podría potencialmente extraer la DEK de la RAM volátil.
   - *Mitigación implementada*: Se minimiza el tiempo de permanencia mediante auto-bloqueo configurable por inactividad y bloqueo al suspender el equipo.
3. **Pérdida de la Contraseña Maestra**:
   - Debido a la arquitectura de conocimiento cero estricto, **no existe puerta trasera, mecanismo de recuperación centralizado ni clave maestra alternativa**.
   - Si el usuario olvida su contraseña maestra, los datos cifrados son matemáticamente irrecuperables.
