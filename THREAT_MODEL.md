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

## 3. Matriz STRIDE

| Categoría | Amenaza Específica | Mitigación en NEXUS VAULT | Estado |
| :--- | :--- | :--- | :---: |
| **S - Spoofing** | Suplantación del usuario para desbloquear la bóveda. | Autenticación obligatoria con contraseña maestra de alta entropía. Derivación KDF costosa (Argon2id) que hace inviable el ataque de fuerza bruta fuera de línea. | Implementado |
| **T - Tampering** | Modificación maliciosa o corrupción de registros en la base de datos SQLite para forzar fallos o inyectar payloads. | Cifrado autenticado con **XChaCha20-Poly1305**. Cualquier alteración de un bit invalida el tag Poly1305, abortando el descifrado antes de exponer datos al deserializador. | Implementado |
| **R - Repudiation** | Modificación no registrada de configuración de seguridad o eliminación accidental. | Registro local transaccional no sensible de eventos de bóveda (creación, cambio de contraseña maestra, respaldos) con marcas de tiempo en SQLite. | Implementado |
| **I - Information Disclosure** | Extracción de contraseñas desde la base de datos en reposo, volcados de memoria tras el bloqueo, o portapapeles. | 1. Cifrado integral de campos (incluidos metadatos, nombres y URLs).<br>2. Borrado determinista de memoria con `Zeroize`.<br>3. Limpieza automática del portapapeles con verificación de contenido previo. | Implementado |
| **D - Denial of Service** | Intentos masivos repetidos de desbloqueo para saturar CPU o corromper transacciones SQLite. | 1. Limitador de tasa y retardo incremental tras fallos consecutivos.<br>2. Transacciones SQLite con modo WAL (Write-Ahead Logging) y atomicidad garantizada. | Implementado |
| **E - Elevation of Privilege** | Explotación de la interfaz Webview para ejecutar código arbitrario en el sistema operativo. | 1. Política de permisos mínimos en Tauri 2.<br>2. Desactivación de ejecución remota de scripts (`csp` estricto).<br>3. IPC cerrado: solo comandos Tauri explícitamente registrados son invocables. | Implementado |

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
