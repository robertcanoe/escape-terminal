const CHALLENGES = {
    hackSystem: {
        name: "Hackear el Sistema Principal",
        description: "El sistema principal ha sido comprometido. Necesitas encontrar la vulnerabilidad y explotarla.",
        difficulty: "Difícil",
        paths: [
            {
                start: "/home/user",
                target: "/sys/kernel",
                files: {
                    "hack_tool.sh": "Herramienta de hackeo encontrada. Necesitas la contraseña del kernel.",
                    ".password": "K3rn3l_P4ss_2024",
                    "notes.txt": "La vulnerabilidad está en el puerto 1337"
                }
            }
        ],
        hints: [
            "Busca archivos ocultos que empiecen por '.'",
            "El archivo hack_tool.sh necesita una contraseña",
            "Revisa los logs del sistema en busca de pistas"
        ]
    },
    virusHunt: {
        name: "Caza del Virus",
        paths: [
            {
                start: "/var/log",
                target: "/tmp/virus",
                files: {
                    "infection.log": "Virus detectado en /tmp/virus/malware.exe",
                    "antivirus.sh": "Ejecuta este archivo para eliminar el virus"
                }
            }
        ]
    },
    dataRecovery: {
        name: "Recuperación de Datos",
        paths: [
            {
                start: "/backup",
                target: "/home/admin",
                files: {
                    "recovery.dat": "Datos críticos encontrados. Necesitas descifrarlos.",
                    ".key": "La clave de descifrado es: XK-2024"
                }
            }
        ]
    }
};

// Sistema de progreso y recompensas
const ACHIEVEMENTS = {
    quickSolver: "¡Velocista! Completaste el nivel en menos de 2 minutos",
    noHints: "¡Experto! Completaste el nivel sin usar pistas",
    perfectRun: "¡Perfección! No cometiste ningún error"
};

// Efectos visuales para eventos
const EFFECTS = {
    hack: "▓▒░ HACKEANDO ░▒▓",
    decrypt: "🔓 DESCIFRANDO... 🔓",
    warning: "⚠️ ALERTA ⚠️"
};

// Mejora del gameState
const gameState = {
    started: false,
    level: 1,
    inventory: [],
    discoveredFiles: new Set(),
    timeRemaining: 600,
    hints: 3,
    currentChallenge: null,
    achievements: [],
    score: 0,
    errors: 0
};

const STORY = {
    intro: [
        "INICIANDO SISTEMA...",
        "ADVERTENCIA: Acceso no autorizado detectado",
        "Tiempo restante antes del bloqueo total: 10:00",
        "Escribe 'help' para ver los comandos disponibles"
    ],
    levels: {
        1: {
            objective: "Encuentra el archivo que contiene la primera pista en /home/user/",
            hint: "Utiliza 'ls' para listar archivos y 'cat' para leerlos"
        },
        2: {
            objective: "Accede a los logs del sistema en /var/log/",
            hint: "Necesitas encontrar el archivo de registro más reciente"
        },
        3: {
            objective: "Encuentra y elimina el malware",
            hint: "Busca en los archivos ocultos que empiezan con '.'"
        }
    }
};

// Función para seleccionar reto aleatorio
function selectRandomChallenge() {
    const challenges = Object.keys(CHALLENGES);
    const randomIndex = Math.floor(Math.random() * challenges.length);
    const selectedChallenge = CHALLENGES[challenges[randomIndex]];
    
    // Verificar que los directorios del reto existan
    const path = selectedChallenge.paths[0];
    const startDir = getDir(path.start.split('/').filter(p => p));
    const targetDir = getDir(path.target.split('/').filter(p => p));
    
    if (!startDir || !targetDir) {
        // Si hay un problema, seleccionar otro reto
        return selectRandomChallenge();
    }
    
    // Inicializar el jugador en la ubicación correcta
    currentPath = path.start.split('/').filter(p => p);
    return selectedChallenge;
}

// Función mejorada de inicio de juego
function startGame() {
    // Reiniciar estado
    gameState.started = false;
    gameState.discoveredFiles = new Set();
    gameState.timeRemaining = 600;
    gameState.hints = 3;
    gameState.errors = 0;
    gameState.score = 0;
    
    // Seleccionar reto aleatorio
    gameState.currentChallenge = selectRandomChallenge();
    
    // Mostrar pantalla de inicio
    const introScreen = document.getElementById('intro-screen');
    showEffect("INICIANDO SISTEMA", "hack", () => {
        introScreen.style.display = 'none';
        document.getElementById('terminal').style.display = 'block';
        gameState.started = true;
        updateTerminalHeader();
        showChallengeBrief();
        startTimer();
        document.getElementById('command-input').focus();
    });
}

// Función para mostrar efectos visuales
function showEffect(text, type, callback) {
    const effectDiv = document.createElement('div');
    effectDiv.className = `effect ${type}`;
    effectDiv.textContent = EFFECTS[type];
    document.body.appendChild(effectDiv);
    
    setTimeout(() => {
        effectDiv.remove();
        if (callback) callback();
    }, 2000);
}

// Función para mostrar el briefing del reto
function showChallengeBrief() {
    const challenge = gameState.currentChallenge;
    printLine("\n=== NUEVO RETO ===");
    printLine(`Misión: ${challenge.name}`);
    printLine(`Inicio: ${challenge.paths[0].start}`);
    printLine(`Objetivo: ${challenge.paths[0].target}`);
    printLine("\nTiempo restante: 10:00");
    printLine("Buena suerte, agente.\n");
}

function startTimer() {
    const timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updatePrompt();
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(timerInterval);
            gameOver("Se agotó el tiempo. El sistema se ha bloqueado permanentemente.");
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updatePrompt() {
    const promptElement = document.querySelector('.prompt');
    promptElement.textContent = `[${formatTime(gameState.timeRemaining)}] $ `;
}

function gameOver(message) {
    printLine("\n=== GAME OVER ===");
    printLine(message);
    printLine("Recarga la página para intentarlo de nuevo.");
    document.getElementById('command-input').disabled = true;
}

// Mejora de la función de progreso
function checkProgress(command) {
    if (!gameState.currentChallenge) return;
    
    const challenge = gameState.currentChallenge;
    const path = challenge.paths[0];
    
    // Verificar si el jugador llegó al directorio objetivo
    if (currentPath.join('/') === path.target.split('/').filter(p => p).join('/')) {
        gameState.score += 100;
        showEffect("OBJETIVO ALCANZADO", "decrypt");
    }
    
    // Verificar archivos descubiertos
    Object.keys(path.files).forEach(file => {
        if (command.includes(`cat ${file}`)) {
            if (!gameState.discoveredFiles.has(file)) {
                gameState.discoveredFiles.add(file);
                gameState.score += 50;
                showEffect("ARCHIVO ENCONTRADO", "decrypt");
            }
        }
    });
    
    // Verificar victoria
    if (isChallengecComplete()) {
        completeChallenge();
    }
}

// Función para verificar victoria
function isChallengecComplete() {
    const challenge = gameState.currentChallenge;
    const requiredFiles = Object.keys(challenge.paths[0].files);
    return requiredFiles.every(file => gameState.discoveredFiles.has(file));
}

// Función para completar el reto
function completeChallenge() {
    const timeTaken = 600 - gameState.timeRemaining;
    let achievementsEarned = [];
    
    // Verificar logros
    if (timeTaken < 120) achievementsEarned.push(ACHIEVEMENTS.quickSolver);
    if (gameState.hints === 3) achievementsEarned.push(ACHIEVEMENTS.noHints);
    if (gameState.errors === 0) achievementsEarned.push(ACHIEVEMENTS.perfectRun);
    
    showVictoryScreen(achievementsEarned);
}

// Pantalla de victoria
function showVictoryScreen(achievements) {
    const victoryDiv = document.createElement('div');
    victoryDiv.className = 'victory-screen';
    victoryDiv.innerHTML = `
        <h2>¡MISIÓN COMPLETADA!</h2>
        <p>Puntuación: ${gameState.score}</p>
        <p>Tiempo: ${formatTime(600 - gameState.timeRemaining)}</p>
        <h3>Logros Desbloqueados:</h3>
        <ul>${achievements.map(a => `<li>${a}</li>`).join('')}</ul>
        <button onclick="startNewChallenge()">Siguiente Misión</button>
    `;
    document.body.appendChild(victoryDiv);
}

function useHint() {
    if (gameState.hints <= 0) {
        printLine("No te quedan pistas disponibles.");
        return;
    }
    
    const currentLevel = STORY.levels[gameState.level];
    if (!currentLevel) {
        printLine("No hay pistas disponibles para este nivel.");
        return;
    }
    
    gameState.hints--;
    printLine(`PISTA (quedan ${gameState.hints}): ${currentLevel.hint}`);
}

// Función mejorada para mostrar el output con espaciado
function printLine(text, type = 'normal') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    line.style.marginBottom = '0.5rem'; // Añade espacio entre líneas
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// Función mejorada para manejar comandos
function handleCommand(command) {
    if (!command.trim()) {
        printLine(''); // Añade línea vacía para comandos vacíos
        return;
    }

    // Añade el comando con el prompt
    printLine(`<span class="prompt">$</span> ${command}`, 'command');
    
    // Añade espacio antes de la respuesta
    setTimeout(() => {
        executeCommand(command);
        // Añade espacio después de la respuesta
        printLine('');
    }, 100);
}