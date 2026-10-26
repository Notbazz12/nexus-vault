# NEXUS VAULT 🛡️
> Gestor de contraseñas profesional de alta seguridad para Windows y Linux.

![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Open%20Architecture-blue.svg)
![Security](https://img.shields.io/badge/Security-Argon2id%20%2B%20XChaCha20--Poly1305-cyan.svg)
![Platform](https://img.shields.io/badge/Platforms-Windows%20%7C%20Linux-emerald.svg)

---

## 1. Visión del Producto

**NEXUS VAULT** es un gestor de credenciales y datos sensibles de escritorio con arquitectura de conocimiento cero local (*local zero-knowledge*). Diseñado e implementado con una postura de seguridad por defecto (*secure-by-default*), combina un motor criptográfico nativo en **Rust** con una interfaz de usuario moderna, fluida y de grado profesional construida en **React**, **TypeScript** y **Tailwind CSS** sobre el marco **Tauri 2**.

Inspirado en la ergonomía y robustez de los mejores administradores del sector (Kaspersky Password Manager, Bitwarden, 1Password), pero con diseño, código fuente, modelos de datos e identidad visual 100% originales.

---

## 2. Pila Tecnológica

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Plataforma de Escritorio** | Tauri 2 | Binario nativo liviano, mínimo consumo de memoria, aislamiento de procesos, integración directa con WebView2 (Windows) y WebKitGTK (Linux). |
| **Backend & Criptografía** | Rust (Edition 2021) | Seguridad de memoria sin recolector de basura (*memory safety*), velocidad extrema, bibliotecas auditadas (`argon2`, `chacha20poly1305`, `zeroize`, `ring`/`rand_core`). |
| **Almacenamiento Local** | SQLite + Cifrado en Capas | Motor transaccional ACID embebido; los registros y metadatos se almacenan exclusivamente en payloads autenticados cifrados. |
| **Frontend UI** | React 18 + TypeScript | Tipado estricto en toda la capa de presentación y validación de contratos IPC. |
| **Herramienta de Construcción**| Vite | Bundling ultra-rápido, hot module replacement y árbol de dependencias optimizado. |
| **Estilos & Diseño** | Tailwind CSS + Lucide Icons | Estética Cyber/Fintech premium, tema oscuro por defecto con acentos azul eléctrico (#00D2FF) y cian (#00F0FF). |
| **Gestor de Estado** | Zustand | Estado no sensible en frontend (filtros, vistas activas, navegación). Cero persistencia no cifrada de secretos en memoria compartida. |
| **Pruebas Automatizadas** | Vitest + Cargo Test | Pruebas unitarias de frontend, pruebas unitarias e integración criptográfica en Rust con vectores oficiales. |

---

## 3. Principios Criptográficos Fundamentales

1. **Jerarquía de Claves de Dos Niveles (KEK / DEK)**:
   - **KEK (Key Encryption Key)**: Derivada de la contraseña maestra mediante **Argon2id** (OWASP 2023+ compliant).
   - **DEK (Data Encryption Key)**: Clave simétrica de 256 bits generada con CSPRNG del sistema operativo (`rand::rngs::OsRng`), protegida por la KEK.
   - Permite cambiar la contraseña maestra instantáneamente mediante re-cifrado transaccional de la DEK sin re-cifrar millones de registros individuales.
2. **Cifrado Autenticado (AEAD)**:
   - **XChaCha20-Poly1305**: Cifrado de flujo con nonce extendido de 192 bits (24 bytes) y autenticación Poly1305 de 128 bits. Elimina el riesgo de colisión de nonces en generaciones aleatorias masivas.
3. **Cero Texto Plano en Reposo**:
   - Títulos, URLs, nombres de usuario, contraseñas, notas privadas, etiquetas y tarjetas bancarias se cifran en estructuras JSON binarias serializadas autenticadas.
4. **Protección de Memoria**:
   - Uso de la trait `Zeroize` y `ZeroizeOnDrop` en Rust para sobreescribir con ceros las regiones de memoria volátil que alojaron secretos al bloquear la bóveda o salir del alcance.

---

## 4. Estructura del Repositorio

```text
nexus-vault/
├── ARCHITECTURE.md          # Arquitectura técnica detallada y flujo de datos
├── SECURITY.md              # Política de seguridad y manejo de vulnerabilidades
├── THREAT_MODEL.md          # Modelo de amenazas STRIDE y límites de seguridad
├── DEVELOPMENT_PLAN.md      # Plan maestro por fases (00 a 10)
├── TEST_REPORT.md           # Registro de ejecución de pruebas
├── CHANGELOG.md             # Historial de cambios
├── src-tauri/               # Backend nativo Rust (Tauri 2)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── crypto/          # Argon2id, XChaCha20-Poly1305, Zeroize
│   │   ├── storage/         # SQLite y persistencia de payloads cifrados
│   │   ├── domain/          # Modelos de dominio (Vault, Item, Folder, etc.)
│   │   ├── commands/        # Controladores IPC Tauri (rutas expuestas)
│   │   └── session/         # Temporizadores, bloqueo y portapapeles
├── src/                     # Frontend React + TypeScript
│   ├── components/          # Componentes de diseño shadcn/ui y tarjetas
│   ├── views/               # 13 pantallas requeridas
│   ├── store/               # Estados de interfaz con Zustand
│   ├── types/               # Definiciones TypeScript de entidades
│   ├── mock/                # Datos de prueba para Fase 01
│   ├── lib/                 # Utilidades frontend y formateadores
│   └── styles/              # Tailwind CSS
├── package.json
└── vite.config.ts
```

---

## 5. Vistas Implementadas

1. **Bienvenida & Onboarding**: Configuración inicial guiada.
2. **Creación de Contraseña Maestra**: Indicador de entropía, confirmación y recomendaciones de seguridad.
3. **Desbloqueo de Bóveda**: Entrada segura con protección contra ataques de fuerza bruta en memoria.
4. **Dashboard Principal**: Métricas clave de salud de la bóveda, actividad no sensible y accesos directos.
5. **Lista de Contraseñas**: Vista en dos paneles, búsqueda instantánea, filtros por carpetas y favoritos.
6. **Editor de Credenciales**: Formulario interactivo con visibilidad conmutable, validación y campos personalizados.
7. **Generador Criptográfico**: Configuración granular (longitud 8-128, mayúsculas, símbolos, sin ambiguos, frases de contraseña) y cálculo de entropía.
8. **Notas Seguras**: Editor y visualizador de notas privadas con soporte de formato enriquecido.
9. **Tarjetas e Identidades**: Almacenamiento seguro de medios de pago (sin CVV persistente) y datos de identidad.
10. **Centro de Seguridad**: Auditoría local en memoria de contraseñas débiles, reutilizadas y antiguas.
11. **Importación & Exportación**: Asistente con vista previa, mapeo de columnas y exportación cifrada.
12. **Configuración General**: Temporizadores de bloqueo, limpieza de portapapeles, tema y preferencias del sistema.
13. **Copias de Seguridad**: Generación y restauración de respaldos íntegros de la bóveda.

---

## 6. Ejecución del Proyecto

### Requisitos Previos
- **Node.js**: v20+ o v24+
- **pnpm**: v9+ o v11+
- **Rust**: 1.80+ (toolchain `x86_64-pc-windows-gnu` o `msvc`)

### Comandos de Desarrollo
```bash
# Instalar dependencias frontend
pnpm install

# Iniciar servidor de desarrollo frontend (Vite)
pnpm dev

# Ejecutar pruebas unitarias frontend
pnpm test

# Compilar frontend
pnpm build
```
