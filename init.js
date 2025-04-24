// Función global para formatear el prompt
window.formatPrompt = function(path) {
    return `user@escape:/${path.join("/")}$ `;
};

// Asegurarse de que el filesystem está disponible antes de iniciar
function initGame() {
    // Verificar que el filesystem está cargado correctamente
    if (!window.filesystem || !window.getDir) {
        console.error('Error: Sistema de archivos no disponible');
        return;
    }

    // Configuración inicial del estado global
    window.gameState = {
        started: false,
        timeRemaining: 600,
        hints: 3,
        score: 0,
        errors: 0,
        discoveredFiles: new Set(),
        currentChallenge: null,
        timerInterval: null
    };

    // Asegurar que currentPath es global
    window.currentPath = ['home', 'user'];

    // Iniciar el estado del juego
    function startNewGame() {
        gameState.started = true;
        gameState.timeRemaining = 600;
        gameState.hints = 3;
        gameState.score = 0;
        gameState.errors = 0;
        gameState.discoveredFiles = new Set();
        currentPath = ['home', 'user'];
        
        // Seleccionar el primer reto
        gameState.currentChallenge = selectRandomChallenge();
        
        // Inicializar UI
        updateStats();
        updateTerminalHeader();
    }

    // Intentar cargar estado guardado
    if (loadGameState()) {
        const continueGame = confirm('Se encontró una partida guardada. ¿Deseas continuar?');
        if (continueGame) {
            startGame();
            return;
        }
    }

    // Preparar el input y UI
    const input = document.getElementById('command-input');
    input.value = '';
    input.disabled = false;
    
    // Limpiar terminal
    const output = document.getElementById('output');
    output.innerHTML = '';

    // Configurar estado inicial
    startNewGame();

    console.log('Sistema iniciado correctamente');
}

// Esperar a que el DOM y todos los scripts estén cargados
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que todos los componentes necesarios estén cargados
    const requiredComponents = [
        'filesystem.js',
        'game.js',
        'terminal.js'
    ];

    let loadedComponents = 0;
    const scripts = document.getElementsByTagName('script');
    
    for (let script of scripts) {
        if (requiredComponents.some(comp => script.src.includes(comp))) {
            loadedComponents++;
        }
    }

    if (loadedComponents === requiredComponents.length) {
        setTimeout(initGame, 100);
    } else {
        console.error('Error: No se han cargado todos los componentes necesarios');
    }
});