// Spanish-first translations
// English is a secondary toggle. Default is ES.

export const es = {
  // Brand
  brand: {
    name: "Remes",
    tagline: "El dólar que funciona en todas partes",
  },

  // Navigation
  nav: {
    swap: "Intercambiar",
    history: "Historial",
    settings: "Ajustes",
    home: "Inicio",
  },

  // Wallet
  wallet: {
    connect: "Conectar billetera",
    connecting: "Conectando...",
    connected: "Conectado",
    disconnect: "Desconectar",
    copyAddress: "Copiar dirección",
    copied: "Copiado",
    viewOnExplorer: "Ver en BaseScan",
    installed: "Detectada",
    notInstalled: "No instalada",
    balance: "Saldo",
    noWallet: "No tenés una billetera? Probá estas opciones:",
    mobileNote:
      "En móvil, escaneá el código QR con tu billetera o usá la app integrada.",
    installMetaMask: "Instalar MetaMask",
    installCoinbase: "Instalar Coinbase Wallet",
    installTrust: "Instalar Trust Wallet",
  },

  // Landing / Hero
  landing: {
    headline: "Tu dólar digital, sin complicaciones.",
    subhead:
      "Cambiá USDC por USDT al instante. Sin bancos. Sin fronteras. Sin esperas.",
    trustLine: "Construido sobre Base — la red segura y de bajo costo.",
    ctaPrimary: "Empezar a intercambiar",
    ctaSecondary: "Ver tasa actual",
    feature1Title: "Sin custodia",
    feature1Body:
      "Tus fondos quedan en tu billetera. Nosotros nunca los tocamos.",
    feature2Title: "Costo bajo",
    feature2Body: "Comisión del 0.3% — y la red Base cuesta centavos por transacción.",
    feature3Title: "En español",
    feature3Body: "Diseñado primero para República Dominicana, Argentina y Venezuela.",
    feature4Title: "Transparente",
    feature4Body: "Ves la tasa exacta antes de confirmar. Sin sorpresas.",
    noLogin: "No necesitás crear cuenta para ver tasas.",
  },

  // Swap
  swap: {
    title: "Intercambiar",
    from: "De",
    to: "A",
    amount: "Cantidad",
    balance: "Saldo:",
    max: "Máx",
    selectToken: "Elegir token",
    rate: "Tasa",
    fee: "Comisión",
    networkFee: "Comisión de red",
    priceImpact: "Impacto en precio",
    minReceived: "Mínimo a recibir",
    slippage: "Tolerancia de deslizamiento",
    swap: "Intercambiar",
    swapping: "Intercambiando...",
    approving: "Aprobando...",
    insufficientBalance: "Saldo insuficiente",
    enterAmount: "Ingresá una cantidad",
    quoteLoading: "Obteniendo cotización...",
    quoteFailed: "No se pudo obtener la cotización",
    highImpactWarning: "Impacto en precio alto",
    highImpactBody:
      "Esta operación moverá el precio significativamente. ¿Querés continuar?",
    wrapNative: "Tu saldo es muy bajo para cubrir la comisión de red",
    pendingTitle: "Procesando intercambio",
    pendingBody: "Confirmá la transacción en tu billetera.",
    successTitle: "¡Listo!",
    successBody: "Tu intercambio se completó exitosamente.",
    failedTitle: "Algo salió mal",
    failedBody: "La transacción falló. Intentá de nuevo.",
    viewTransaction: "Ver transacción",
    newSwap: "Nuevo intercambio",
  },

  // History
  history: {
    title: "Historial",
    empty: "Todavía no hay intercambios",
    emptyBody: "Tus intercambios aparecerán acá una vez que completes uno.",
    columnDate: "Fecha",
    columnFrom: "De",
    columnTo: "A",
    columnAmount: "Cantidad",
    columnStatus: "Estado",
    statusPending: "Pendiente",
    statusCompleted: "Completado",
    statusFailed: "Fallido",
    exportCsv: "Exportar CSV",
    loadMore: "Cargar más",
  },

  // Settings
  settings: {
    title: "Ajustes",
    sectionGeneral: "General",
    sectionWallet: "Billetera",
    sectionAbout: "Acerca de",
    language: "Idioma",
    languageEs: "Español",
    languageEn: "English",
    slippage: "Tolerancia de deslizamiento",
    slippageHelp:
      "Si el precio cambia más de este porcentaje, la transacción se cancela automáticamente.",
    slippageAuto: "Automático (0.5%)",
    slippageCustom: "Personalizado",
    connectedWallets: "Billeteras conectadas",
    noWallets: "No hay billeteras conectadas",
    version: "Versión",
    privacy: "Privacidad",
    terms: "Términos",
    support: "Soporte",
    disconnectAll: "Desconectar todas",
  },

  // Common
  common: {
    cancel: "Cancelar",
    confirm: "Confirmar",
    close: "Cerrar",
    back: "Atrás",
    loading: "Cargando...",
    error: "Error",
    retry: "Reintentar",
    save: "Guardar",
    yes: "Sí",
    no: "No",
  },

  // Footer
  footer: {
    tagline: "Construido por Remes Labs. El dólar que funciona en todas partes.",
    poweredBy: "Desarrollado sobre Base",
  },
};

// Use a structural type so other locales can declare the same shape
// without inheriting the literal types from `as const`.
// (We strip the `readonly` modifier so en.ts can be a normal object.)
export type Dictionary = {
  brand: { name: string; tagline: string };
  nav: { swap: string; history: string; settings: string; home: string };
  wallet: {
    connect: string;
    connecting: string;
    connected: string;
    disconnect: string;
    copyAddress: string;
    copied: string;
    viewOnExplorer: string;
    installed: string;
    notInstalled: string;
    balance: string;
    noWallet: string;
    mobileNote: string;
    installMetaMask: string;
    installCoinbase: string;
    installTrust: string;
  };
  landing: {
    headline: string;
    subhead: string;
    trustLine: string;
    ctaPrimary: string;
    ctaSecondary: string;
    feature1Title: string;
    feature1Body: string;
    feature2Title: string;
    feature2Body: string;
    feature3Title: string;
    feature3Body: string;
    feature4Title: string;
    feature4Body: string;
    noLogin: string;
  };
  swap: {
    title: string;
    from: string;
    to: string;
    amount: string;
    balance: string;
    max: string;
    selectToken: string;
    rate: string;
    fee: string;
    networkFee: string;
    priceImpact: string;
    minReceived: string;
    slippage: string;
    swap: string;
    swapping: string;
    approving: string;
    insufficientBalance: string;
    enterAmount: string;
    quoteLoading: string;
    quoteFailed: string;
    highImpactWarning: string;
    highImpactBody: string;
    wrapNative: string;
    pendingTitle: string;
    pendingBody: string;
    successTitle: string;
    successBody: string;
    failedTitle: string;
    failedBody: string;
    viewTransaction: string;
    newSwap: string;
  };
  history: {
    title: string;
    empty: string;
    emptyBody: string;
    columnDate: string;
    columnFrom: string;
    columnTo: string;
    columnAmount: string;
    columnStatus: string;
    statusPending: string;
    statusCompleted: string;
    statusFailed: string;
    exportCsv: string;
    loadMore: string;
  };
  settings: {
    title: string;
    sectionGeneral: string;
    sectionWallet: string;
    sectionAbout: string;
    language: string;
    languageEs: string;
    languageEn: string;
    slippage: string;
    slippageHelp: string;
    slippageAuto: string;
    slippageCustom: string;
    connectedWallets: string;
    noWallets: string;
    version: string;
    privacy: string;
    terms: string;
    support: string;
    disconnectAll: string;
  };
  common: {
    cancel: string;
    confirm: string;
    close: string;
    back: string;
    loading: string;
    error: string;
    retry: string;
    save: string;
    yes: string;
    no: string;
  };
  footer: { tagline: string; poweredBy: string };
};