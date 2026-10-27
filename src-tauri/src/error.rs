use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum CryptoError {
    #[error("Versión de formato no soportada: {0}")]
    UnsupportedVersion(u8),

    #[error("Parámetros KDF fuera de los límites de seguridad permitidos")]
    InvalidKdfParameters,

    #[error("Longitud de nonce inválida: esperada {expected}, recibida {actual}")]
    InvalidNonceLength { expected: usize, actual: usize },

    #[error("Longitud de salt inválida: esperada {expected}, recibida {actual}")]
    InvalidSaltLength { expected: usize, actual: usize },

    #[error("Tamaño de payload excede el límite máximo de seguridad ({0} bytes)")]
    PayloadTooLarge(usize),

    #[error("Fallo de autenticación o descifrado: datos manipulados, clave incorrecta o AAD discordante")]
    DecryptionFailed,

    #[error("Fallo en la derivación KDF")]
    KdfDerivationFailed,

    #[error("Error de serialización o deserialización de datos")]
    SerializationError,

    #[error("La bóveda se encuentra bloqueada")]
    VaultLocked,

    #[error("Demasiados intentos fallidos de autenticación. Bloqueo temporal activado.")]
    RateLimited,
}
