# POLÍTICA DE SEGURIDAD - NEXUS VAULT 🔒

## 1. Declaración de Principios de Seguridad

NEXUS VAULT ha sido concebido bajo los principios de **Zero-Knowledge Local**, **Mínimo Privilegio**, **Defensa en Profundidad** y **Transparencia Criptográfica**.

Este documento establece las políticas de seguridad implementadas en el diseño y código, así como las directrices para el reporte responsable de vulnerabilidades.

---

## 2. Especificación de Primitivas Criptográficas

Todas las primitivas criptográficas implementadas en NEXUS VAULT provienen de bibliotecas ampliamente revisadas por la comunidad internacional, sometidas a auditorías independientes y mantenidas activamente en el ecosistema de Rust.

| Propósito | Primitiva | Justificación Técnica & Parámetros |
| :--- | :--- | :--- |
| **Derivación de Clave (KDF)** | **Argon2id** (RFC 9106) | Ganador del *Password Hashing Competition*. Combina resistencia contra ataques basados en GPU/ASIC (Argon2d) y ataques de canal lateral basados en caché (Argon2i).<br>• Parámetros por defecto: `m=64 MiB`, `t=3 iteraciones`, `p=4 hilos`, salida = 256 bits. |
| **Cifrado Autenticado (AEAD)** | **XChaCha20-Poly1305** | Cifrado simétrico de flujo con autenticación de datos asociados (AEAD).<br>• Nonce extendido de 192 bits (24 bytes) generado por CSPRNG.<br>• Resistencia absoluta a desastres por reutilización de nonce en comparación con AES-GCM (nonce de 96 bits). |
| **Generación Aleatoria (CSPRNG)** | `rand::rngs::OsRng` / `getrandom` | Acceso directo a las fuentes de entropía criptográfica del núcleo del sistema operativo (`BCryptGenRandom` en Windows, `getrandom`/`urandom` en Linux). |
| **Protección de Memoria** | `zeroize::Zeroize` / `ZeroizeOnDrop` | Sobreescritura determinista de búferes de memoria antes de su liberación, previniendo la retención de material sensible en páginas de memoria liberadas. |

---

## 3. Manejo de Secretos en Memoria

1. **Ciclo de Vida Mínimo**:
   - La contraseña maestra del usuario existe en memoria únicamente durante la derivación de la KEK (fracciones de segundo) y es inmediatamente destruida.
   - La clave de cifrado de datos (DEK) se almacena en memoria envuelta en una estructura `SessionGuard` que implementa `Drop` con `zeroize()`.
2. **Aislamiento del Frontend**:
   - El estado de la interfaz gráfica (Zustand) no almacena la lista completa de contraseñas en texto plano de forma persistente.
   - Los valores de contraseña solo se descifran bajo demanda del usuario o para vistas activas en pantalla.
3. **Prohibición de Registro en Logs**:
   - Se prohíbe el uso de `println!`, `dbg!`, `tracing` o `console.log` con estructuras que contengan campos clasificados como sensibles (contraseñas, notas privadas, DEK, KEK, nonces intermedios).
   - Se implementan redactores automáticos en las traits `std::fmt::Debug` para todos los modelos de dominio.

---

## 4. Gestión del Portapapeles

- Cuando el usuario copia una contraseña, nombre de usuario o nota privada al portapapeles, NEXUS VAULT inicia un temporizador de limpieza automática (por defecto: 30 segundos, configurable de 10 a 120 segundos).
- **Verificación de Contenido**: El borrado del portapapeles valida previamente que el contenido coincida con el valor colocado por la aplicación para no sobrescribir datos copiados posteriormente por el usuario en otras aplicaciones.

---

## 5. Prevención de Ataques de Fuerza Bruta en Desbloqueo

- El backend de Rust incluye un limitador de tasa (*Rate Limiter*) y retraso exponencial artificial en la respuesta tras 3 intentos fallidos consecutivos de ingreso de contraseña maestra dentro de una sesión activa.

---

## 6. Proceso de Reporte Responsable de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en NEXUS VAULT, por favor sigue este protocolo:

1. **No abras un issue público** en GitHub ni divulgues el problema en redes sociales.
2. Envía un reporte detallado con prueba de concepto (PoC) a: **security@nexusvault.local** (o al canal de seguridad establecido por el equipo de ingeniería).
3. Incluye:
   - Descripción de la vulnerabilidad.
   - Pasos para reproducirla.
   - Impacto estimado según el estándar CVSS v3.1.
   - Plataforma afectada (Windows, Linux o ambas).
4. El equipo responderá confirmando recepción en menos de 48 horas laborales y trabajará en un parche correctivo antes de la divulgación pública coordinada.
