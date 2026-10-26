# CHANGELOG - NEXUS VAULT 📝

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.1.0-alpha] - 2026-10-26

### Añadido
- **Fase 00: Investigación y Arquitectura**:
  - Inspección del sistema y verificación exitosa de herramientas nativas (Node v24.21.0, pnpm 11.28.5, Rust 1.99.1 GNU Toolchain, Git 2.56.0).
  - Documentación de arquitectura técnica (`ARCHITECTURE.md`) con diagramas Mermaid de flujo y modelo envelope encryption.
  - Especificación formal de estándares de seguridad (`SECURITY.md`) detallando Argon2id, XChaCha20-Poly1305, CSPRNG y `Zeroize`.
  - Definición rigurosa del modelo de amenazas STRIDE y límites honestos de protección (`THREAT_MODEL.md`).
  - Plan de desarrollo maestro por 11 fases (`DEVELOPMENT_PLAN.md`).
  - Registro inicial de pruebas automatizadas (`TEST_REPORT.md`).
  - Inicialización del repositorio Git local y configuración de `.gitignore`.
