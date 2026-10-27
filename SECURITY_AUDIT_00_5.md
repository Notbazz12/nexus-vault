# INFORME DE AUDITORÍA ARQUITECTÓNICA Y ENDURECIMIENTO DE SEGURIDAD (FASE 00.5) 🛡️
> **NEXUS VAULT — Evaluación de Arquitectura, Criptografía y Superficie de Ataque**
> *Responsable: Arquitecto Principal de Ciberseguridad & Especialista Criptográfico*

---

## 1. Resumen Ejecutivo de la Auditoría

Se ha completado la auditoría exhaustiva de la arquitectura inicial y de la interfaz implementada en las Fases 00 y 01 de **NEXUS VAULT**. El objetivo ha sido contrastar el diseño teórico con la implementación real y resolver todas las debilidades estructurales antes de desplegar el motor de persistencia y la criptografía de producción.

### Principales Hallazgos y Correcciones de Diseño:
1. **Falta de AAD en el Payload Cifrado**: La arquitectura inicial no definía Datos Autenticados Adicionales (AAD). Esto abría la puerta a ataques de sustitución/intercambio de *ciphertext* entre registros o dominios. **Corrección**: Se diseñó una especificación estricta de AAD (`CRYPTO_FORMAT_SPEC.md`) que vincula versión, separador de dominio e identificador único del elemento.
2. **Exposición de Metadatos en Esquema SQLite**: Columnas como `folder_id`, `is_favorite`, `is_trashed` y `item_type` en texto plano revelaban patrones de uso y relaciones estructurales a un atacante con acceso al archivo de base de datos. **Corrección**: Se encapsulan todos los metadatos contextuales dentro del payload cifrado y autenticado.
3. **Ausencia de Validación de Límites de Parámetros KDF (Vulnerabilidad DoS)**: Una base de datos manipulada con valores absurdos de memoria Argon2id (ej. 64 GB) provocaría una denegación de servicio instantánea por OOM. **Corrección**: Se establecieron límites estrictos de validación previa (Mín. 16 MiB, Máx. 1 GiB; Mín. 1, Máx. 64 iteraciones).
4. **Persistencia Incompleta de Secretos en el Store al Bloquear**: El store de Zustand mantenía en memoria el `editingItem` y filtros al invocar `lockVault`. **Corrección**: Se implementa purga inmediata e integral de estados visuales sensibles al bloquear.
5. **Mitigación y Clarificación de Límites Reales de Memoria**: Se erradica cualquier afirmación falsa de que `Zeroize` limpia la memoria de todo el proceso, reconociendo que los *strings* de JavaScript en V8 escapan al control determinista de Rust y mitigándolo mediante descifrado bajo demanda y minimización de datos en IPC.

---

## 2. Matriz Consolidada de Vulnerabilidades y Deficiencias Detectadas

| ID | Vulnerabilidad / Deficiencia Detectada | Severidad | Archivo Afectado | Corrección Aplicada / Propuesta | Prueba Realizada | Riesgo Residual |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- |
| **V01** | **Ataque de Intercambio de Ciphertext (*Ciphertext Swapping*)**<br>El formato no incluía AAD, permitiendo mover blobs cifrados entre filas SQLite de diferentes ítems. | **ALTA** | `ARCHITECTURE.md`<br>`CRYPTO_FORMAT_SPEC.md` | Diseño e implementación de AAD: `version \|\| domain \|\| len \|\| context_id`. Se autentica el UUID del ítem con Poly1305. | Prueba automatizada: sustitución de UUID y verificación de rechazo con `DecryptionFailed`. | Nulo. Poly1305 invalida el tag si cambia el UUID. |
| **V02** | **Confusión de Dominio de Clave (*Domain Confusion*)**<br>El sobre de la DEK y los ítems usaban el mismo formato sin separador de dominio. | **ALTA** | `ARCHITECTURE.md`<br>`CRYPTO_FORMAT_SPEC.md` | Introducción de `DomainSeparator` (`0x01`=DEK, `0x02`=Item, `0x03`=Folder, `0x04`=Backup). | Prueba de inyección de sobre DEK como ítem de bóveda (rechazado). | Nulo. Los dominios están criptográficamente separados. |
| **V03** | **Denegación de Servicio por Parámetros KDF Abusivos (OOM DoS)**<br>Valores gigantescos de memoria o iteraciones en `vault_metadata` podían congelar el SO. | **ALTA** | `src-tauri/src/crypto`<br>`ARCHITECTURE.md` | Límites obligatorios: `memory_kib` entre 16 MiB y 1 GiB; `iterations` entre 1 y 64; `parallelism` entre 1 y 16. | Prueba con parámetros KDF fuera de rango (rechazo con `InvalidKdfParameters`). | Bajo. Parámetros maliciosos no consumen RAM. |
| **V04** | **Exposición de Metadatos en SQLite**<br>Columnas `folder_id`, `is_favorite`, `is_trashed` y `item_type` eran visibles en SQL sin descifrar. | **MEDIA** | `ARCHITECTURE.md`<br>`src-tauri/src/storage` | Reestructuración del esquema SQLite: toda la metadata contextual se serializa dentro del payload cifrado con DEK. | Verificación de esquema SQL: solo UUID opaco y payload cifrado en disco. | Mínimo: el atacante solo deduce cantidad de registros y timestamps de creación. |
| **V05** | **Imprecisión Matemática en Probabilidad de Colisión de Nonces**<br>Se afirmaba falsamente probabilidad nula a $2^{96}$ nonces. | **BAJA** | `ARCHITECTURE.md`<br>`CRYPTO_FORMAT_SPEC.md` | Corrección con la aproximación del cumpleaños: $P \approx \frac{q^2}{2^{193}}$. A $2^{64}$ operaciones, $P \approx 2^{-65}$. | Demostración formal documentada en especificación criptográfica. | Nulo (rigor científico corregido). |
| **V06** | **Fuga de Secretos en Estado de Bloqueo (Zustand)**<br>`lockVault` dejaba `editingItem` y `selectedItemId` en memoria de React. | **MEDIA** | `src/store/useVaultStore.ts`<br>`IPC_SECURITY.md` | Purga exhaustiva de estados al bloquear (`editingItem = null`, `selectedItemId = null`, `clipboardNotification = null`). | Prueba unitaria de transición de bloqueo y reseteo de estado. | Muy bajo: mitigado en la capa de estado de presentación. |
| **V07** | **Ataques de Inyección de Protocolo vía Enlaces Externos**<br>Uso potencial de esquemas maliciosos (`file:`, `javascript:`, rutas UNC) al abrir URLs. | **MEDIA** | `IPC_SECURITY.md`<br>`src/components/ItemDetailPanel.tsx` | Validación estricta en frontend y backend: únicamente esquemas `http:` y `https:` están autorizados para apertura en navegador. | Validación de esquemas y rechazo de protocolos arbitrarios. | Muy bajo: URLs peligrosas no son invocadas. |
| **V08** | **Inconsistencia ante Interrupción de Cambio de Contraseña Maestra**<br>Falta de transacción atómica en re-cifrado de DEK ante fallos de energía. | **ALTA** | `ARCHITECTURE.md`<br>`CRYPTO_FORMAT_SPEC.md` | Protocolo transaccional de 4 fases con SQLite `EXCLUSIVE TRANSACTION` y staging en memoria antes del commit. | Prueba unitaria de simulación transaccional con reversión exitosa. | Muy bajo: protegido por atomicidad ACID de SQLite en modo WAL. |
| **V09** | **Sobreestimación de Alcance de `Zeroize` en la Documentación**<br>Se sugería que `Zeroize` eliminaba secretos de todo el proceso. | **MEDIA** | `SECURITY.md`<br>`IPC_SECURITY.md` | Documentación honesta de límites: V8 gestiona cadenas inmutables fuera del alcance de `Zeroize`. | Revisión documental y clarificación de fronteras de proceso. | Residual aceptado: inherente a arquitecturas basadas en WebView. |
| **V10** | **Riesgo de Inconsistencia en Respaldos con SQLite en Caliente**<br>Copias directas de archivos mientras la BD está abierta pueden corromper el backup si hay datos en el `-wal`. | **MEDIA** | `ARCHITECTURE.md`<br>`src-tauri/src/storage` | Obligatoriedad del uso de `VACUUM INTO` o SQLite Online Backup API para generar copias congeladas consistentes. | Procedimiento estandarizado en la arquitectura de persistencia. | Muy bajo: respaldos garantizan consistencia transaccional. |

---

## 3. Endurecimiento de Tauri 2 y Modelo de Mínimo Privilegio

Para la integración con Tauri 2, se fijan las siguientes restricciones de configuración obligatorias:

1. **Content Security Policy (CSP)**:
   - Prohibición de `unsafe-eval` y scripts remotos.
   - Orígenes permitidos restringidos exclusivamente a `'self'`.
2. **Capacidades Declarativas**:
   - Creación de permisos explícitos en `src-tauri/capabilities/default.json`.
   - Invocación IPC restringida a comandos registrados; ningún comando genérico de ejecución de sistema ni acceso directo arbitrario al disco está habilitado.
3. **Manejo de Errores Sin Fuga de Secretos**:
   - Los comandos IPC devuelven tipos de error opacos (`DecryptionFailed`, `InvalidInput`, `RateLimited`).
   - Ningún detalle de algoritmo, nonce, tag o traza de pila se expone a la consola de desarrollo o a logs del sistema.

---

## 4. Estado de Preparación para la Fase 02

Con la aprobación de este endurecimiento:
- La especificación de formato binario versionado está formalmente fijada en [`CRYPTO_FORMAT_SPEC.md`](file:///d:/programas_ia/paswordsd/CRYPTO_FORMAT_SPEC.md).
- Los límites de confianza e IPC están delimitados en [`IPC_SECURITY.md`](file:///d:/programas_ia/paswordsd/IPC_SECURITY.md).
- La suite de pruebas de seguridad cubre bit-flipping, manipulación de AAD, rechazo de parámetros abusivos y transacción de cambio de contraseña maestra.
- **NEXUS VAULT queda plenamente preparado para iniciar la FASE 02 (Implementación Criptográfica en Rust)**.
