const filesystem = {
  home: {
    "readme.txt": "ALERTA: Sistema comprometido. Necesitas encontrar y eliminar el archivo malicioso antes de que sea tarde. Revisa /dev/logs/ para pistas.",
    dev: {
      "log.txt": "Última conexión: desconocida.",
      "nota.md": "Busca en /etc/clave"
    }
  },
  dev: {
    logs: {
      "security.log": "Intrusión detectada en /etc/system. Tiempo restante: 10 minutos",
      "access.log": "Último acceso autorizado: hace 48 horas"
    }
  },
  etc: {
    clave: {
      "codigo.txt": "La clave es 42",
      "mensaje.txt": "Solo queda un paso..."
    }
  }
};

// Nuevo archivo: game.js
let gameState = {
  discoveredClues: 0,
  timeRemaining: 600, // 10 minutos en segundos
  isGameOver: false
};

function updateGame() {
  if (gameState.timeRemaining <= 0) {
    endGame("¡Se acabó el tiempo! El sistema ha sido comprometido.");
  }
  gameState.timeRemaining--;
}

setInterval(updateGame, 1000);
