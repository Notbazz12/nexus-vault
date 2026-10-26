# PLAN DE DESARROLLO MAESTRO - NEXUS VAULT 📋

Este documento establece la hoja de ruta técnica estructurada por fases secuenciales independientes para el desarrollo de **NEXUS VAULT**. Cada fase requiere criterios de aceptación estrictos y pruebas verificables antes de avanzar a la siguiente.

---

## Matriz de Fases y Estado

| Fase | Título | Entregables Principales | Estado |
| :---: | :--- | :--- | :---: |
| **00** | **Investigación y Arquitectura** | Inspección de herramientas (Node v24, pnpm, Rust 1.99 GNU, Git), repositorio, documentos base (`README`, `ARCHITECTURE`, `SECURITY`, `THREAT_MODEL`, `DEVELOPMENT_PLAN`, `TEST_REPORT`, `CHANGELOG`). | 🟢 **EN PROGRESO / COMPLETANDO** |
| **01** | **Sistema de Diseño e Interfaz** | Estructura frontend (React + TS + Tailwind + Lucide + Zustand), 13 vistas completas con diseño Cyber/Fintech, datos ficticios enriquecidos, pruebas con Vitest. | 🟡 **SIGUIENTE INMEDIATA** |
| **02** | **Motor Criptográfico en Rust** | Módulo de derivación Argon2id, cifrado XChaCha20-Poly1305 AEAD, envelope encryption (KEK/DEK), pruebas con vectores criptográficos oficiales en Cargo. | ⚪ Planificado |
| **03** | **Bóveda Funcional & Persistencia** | Base de datos SQLite local, almacenamiento de payloads cifrados, CRUD completo de credenciales, carpetas, favoritos, papelera con restauración. | ⚪ Planificado |
| **04** | **Generador & Centro de Seguridad** | Generador CSPRNG de contraseñas y contraseñas de palabras (passphrases), estimación de entropía y auditoría en memoria de salud de contraseñas. | ⚪ Planificado |
| **05** | **Módulos Adicionales** | Notas seguras cifradas, tarjetas de crédito/débito, identidades personales y módulo de configuración de preferencias de sistema. | ⚪ Planificado |
| **06** | **Importación, Exportación & Respaldos** | Asistente de importación CSV con mapeo de columnas y vista previa, exportación cifrada y plana con reautenticación, restauración atómica. | ⚪ Planificado |
| **07** | **Seguridad, Estabilización & Auditoría** | Pruebas de integración extremo a extremo, análisis estático (`clippy`, `eslint`), pruebas de inyección y robustez de memoria. | ⚪ Planificado |
| **08** | **Distribución & Empaquetado** | Generación de instaladores nativos para Windows (MSI / NSIS) y Linux (AppImage / DEB), instrucciones de instalación y firmas. | ⚪ Planificado |
| **09** | **Arquitectura de Extensión de Navegador** | Especificación y prototipado del protocolo Native Messaging seguro para navegadores basados en Chromium y Firefox. | ⚪ Planificado |
| **10** | **Protocolo de Sincronización Zero-Knowledge**| Diseño de arquitectura cliente-servidor con cifrado de extremo a extremo, resolución de conflictos y gestión de dispositivos. | ⚪ Planificado |

---

## Criterios de Aceptación para Fase 00:
1. Cadena de herramientas operativa (Node, pnpm, Rust, Cargo, Git).
2. Repositorio Git inicializado con ramas y commits limpios.
3. Documentación arquitectónica, de amenazas y de seguridad completa y aprobada.
4. Definición rigurosa de las 13 vistas y el sistema de diseño.

## Criterios de Aceptación para Fase 01:
1. Frontend funcional interactivo montado sobre Vite + React + TypeScript.
2. 13 vistas navegables con diseño coherente en tema oscuro (conmutador a tema claro).
3. Paleta cromática: Grafito profundo (`#0B0E14`), superficie (`#151921`), borde (`#202634`), acentos azul eléctrico (`#00D2FF`) y cian (`#00F0FF`).
4. Datos ficticios realistas para demostración integral (logins, notas, tarjetas, alertas de seguridad).
5. Pruebas unitarias de componentes y tiendas Zustand ejecutadas con Vitest.
