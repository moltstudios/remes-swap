// Remes i18n — Phase 1: Spanish only (DR/AR conversational).
// Brief: "no language toggle". Every string is a real human sentence.

export const es = {
  brand: {
    name: "Remes",
    tagline: "El dólar que funciona en todas partes",
    shortBy: "Construido sobre Base · código abierto · sin custodia",
  },

  wallet: {
    connect: "Conectar",
    connecting: "Conectando...",
    connected: "Conectada",
    disconnected: "Sin billetera",
    wrongNetwork: "Red incorrecta",
    switchNetwork: "Cambiá a Base",
    copyAddress: "Copiar dirección",
    copied: "Copiado",
    disconnect: "Desconectar",
  },

  trust: {
    regulated: "Regulado por CNAD El Salvador",
    audited: "Auditado mensualmente",
    reserves: "Reservas 1:1 verificadas",
  },

  swap: {
    headline: "¿Cuánto quieres cambiar?",
    subhead: "De USDC a USDT. Sin bancos. Sin fronteras.",
    youSend: "Envías",
    youReceive: "Recibes",
    rate: "Precio",
    fee: "Comisión",
    network: "Comisión de red",
    youGet: "Recibes",
    minReceived: "Recibes al menos",
    impact: "Impacto",
    priceLock: "Precio fijo por 30 segundos",
    selectToken: "Elegir moneda",
    max: "Máx",
    insufficient: "No te alcanza",
    enterAmount: "Conecta tu wallet para empezar",
    swap: "CAMBIAR",
    swapping: "Cambiando...",
    approving: "Autorizando...",
    fetchingQuote: "Pidiendo precio...",
    quoteFailed: "No pudimos conseguir el precio. Intenta de nuevo.",
    networkFeeWarning: "Necesitás un poco de ETH en Base para la comisión de red.",
    impactHigh: "Tu intercambio moverá el precio. ¿Querés continuar?",
    impactWarning: "Impacto alto en el precio",
    reverseDirection: "Invertir",
  },

  confirm: {
    title: "Revisar tu cambio",
    subtitle: "Verificá los datos antes de firmar.",
    youSend: "Envías",
    youReceive: "Recibes",
    rate: "Precio",
    fee: "Comisión Remes",
    networkFee: "Comisión de red",
    route: "Ruta",
    total: "Total a enviar",
    nonCustodial: "Solo tú podés cancelar — tu billetera, tus fondos.",
    estimatedTime: "Termina en ~30 segundos",
    confirm: "CONFIRMAR EN WALLET",
    confirming: "Esperando tu firma...",
    backCta: "Volver",
  },

  done: {
    title: "¡Listo!",
    subtitle: "Tu cambio se completó.",
    youReceived: "Recibiste",
    youSent: "enviaste",
    viewTx: "Ver transacción",
    newSwap: "HACER OTRO CAMBIO",
    shareReceipt: "Compartir comprobante",
    sentTo: "Enviado a tu billetera",
    explorerNote: "A veces la red tarda unos segundos en mostrarlo.",
  },

  errors: {
    txRejected: "Cancelaste la transacción.",
    txFailed: "Algo falló. Tu billetera no fue debitada.",
    networkError: "Sin conexión. Revisa tu internet.",
    tryAgain: "Reintentar",
    goHome: "Volver al inicio",
  },

  common: {
    back: "Atrás",
    close: "Cerrar",
    cancel: "Cancelar",
    loading: "Cargando...",
    seconds: "segundos",
  },
} as const;

export type Dictionary = typeof es;