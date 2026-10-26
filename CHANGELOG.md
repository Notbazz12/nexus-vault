# CHANGELOG - NEXUS VAULT 📝

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.1.0-alpha] - 2026-10-26

### Añadido
- **Fase 01: Interfaz, Sistema de Diseño y Estado Frontend**:
  - Implementación completa de las 13 vistas requeridas con arquitectura modular en React 18 + TypeScript:
    1. `WelcomeView`: Bienvenida y configuración inicial guiada con garantías de seguridad.
    2. `CreateMasterView`: Creación de contraseña maestra con medidor de entropía visual en tiempo real y confirmación estricta.
    3. `UnlockView`: Desbloqueo de bóveda con input seguro y limitador de tasa ante intentos fallidos.
    4. `DashboardView`: Panel de control principal con índice de salud (gauge), accesos favoritos y actividad reciente.
    5. `PasswordsView`: Lista de credenciales con filtros, ordenamiento múltiple y panel contextual en dos columnas.
    6. `EditItemView`: Editor completo de credenciales con generador instantáneo y campos personalizados dinámicos.
    7. `GeneratorView`: Generador criptográfico CSPRNG de contraseñas complejas (8-128 caracteres) y frases de contraseña (passphrases).
    8. `NotesView`: Editor y visualizador de notas privadas cifradas con soporte para archivos adjuntos futuros.
    9. `CardsView`: Bóveda de tarjetas de pago e identidades personales (exclusión deliberada de códigos CVV).
    10. `SecurityCenterView`: Centro de seguridad con auditoría en memoria RAM de contraseñas repetidas, débiles y antiguas.
    11. `ImportExportView`: Asistente de importación CSV (Bitwarden, 1Password, Chrome) y exportación cifrada (.nexusbackup) / plana con advertencias.
    12. `SettingsView`: Configuración de auto-bloqueo, limpieza de portapapeles, atajos de teclado y rotación transaccional de contraseña maestra.
    13. `BackupsView`: Gestor de respaldos locales cifrados con verificación de suma de comprobación SHA-256.
  - Componentes compartidos de alta fidelidad: `Sidebar.tsx`, `Header.tsx`, `ItemDetailPanel.tsx`.
  - Estética Cyber/Fintech con paleta grafito profundo, azul eléctrico y cian (#00F0FF), soporte completo de temas oscuro y claro.
  - Tienda de estado no sensible con Zustand (`useVaultStore.ts`).
  - Datos mock enriquecidos y realistas (`vaultData.ts`).
  - Suite de pruebas automatizadas en Vitest con 8 pruebas unitarias pasando al 100%.

- **Fase 00: Investigación y Arquitectura**:
  - Inspección del sistema y verificación exitosa de herramientas nativas (Node v24.21.0, pnpm 11.28.5, Rust 1.99.1 GNU Toolchain, Git 2.56.0).
  - Documentación de arquitectura técnica (`ARCHITECTURE.md`) con diagramas Mermaid de flujo y modelo envelope encryption.
  - Especificación formal de estándares de seguridad (`SECURITY.md`) detallando Argon2id, XChaCha20-Poly1305, CSPRNG y `Zeroize`.
  - Definición rigurosa del modelo de amenazas STRIDE y límites honestos de protección (`THREAT_MODEL.md`).
  - Plan de desarrollo maestro por 11 fases (`DEVELOPMENT_PLAN.md`).
  - Registro inicial de pruebas automatizadas (`TEST_REPORT.md`).
  - Inicialización del repositorio Git local y configuración de `.gitignore`.
