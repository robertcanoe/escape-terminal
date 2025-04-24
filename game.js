window.formatPrompt = function(path) {
    return `user@escape:/${path.join("/")}$ `;
};

// Función de impresión compartida
function printLine(text, type = 'response') {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    if (text.includes('=== NUEVO RETO ===')) {
        const spacer = document.createElement('div');
        spacer.style.height = '1rem';
        output.appendChild(spacer);
    }
    
    line.innerHTML = text;
    output.appendChild(line);
    
    if (text.includes('Buena suerte, agente.')) {
        const spacer = document.createElement('div');
        spacer.style.height = '1rem';
        output.appendChild(spacer);
    }
    
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
        document.getElementById('command-input').scrollIntoView({ behavior: 'smooth' });
    });
}

const CHALLENGES = {
    hackSystem: {
        name: "Hackear el Sistema Principal",
        description: "El sistema principal ha sido comprometido. Necesitas:\n1. Encontrar la contraseña del kernel (archivo .password)\n2. Localizar hack_tool.sh\n3. Usar el comando: ./hack_tool.sh K3rn3l_P4ss_2024\n\nPista inicial: Comienza buscando en /home/user",
        difficulty: "Difícil",
        paths: [
            {
                start: "/home/user",
                target: "/sys/kernel",
                files: {
                    "hack_tool.sh": "Herramienta de hackeo encontrada. Uso: ./hack_tool.sh [contraseña]",
                    ".password": "K3rn3l_P4ss_2024",
                    "notes.txt": "La vulnerabilidad está en el puerto 1337. Necesitas usar hack_tool.sh con la contraseña correcta."
                }
            }
        ],
        hints: [
            "Busca archivos ocultos que empiecen por '.' usando 'ls -a'",
            "La contraseña está en el archivo .password",
            "Una vez en /sys/kernel, ejecuta: ./hack_tool.sh K3rn3l_P4ss_2024"
        ],
        winConditions: {
            requiredFiles: ['.password', 'hack_tool.sh'],
            requiredPath: '/sys/kernel',
            requiredCommand: './hack_tool.sh K3rn3l_P4ss_2024'
        }
    },
    virusHunt: {
        name: "Caza del Virus",
        description: "Se ha detectado un virus en el sistema. Tu misión:\n1. Revisar los logs en /var/log\n2. Encontrar la ubicación del virus\n3. Localizar y ejecutar el antivirus\n4. Eliminar malware.exe\n\nPista inicial: Comienza revisando infection.log",
        difficulty: "Normal",
        paths: [
            {
                start: "/var/log",
                target: "/tmp/virus",
                files: {
                    "infection.log": "Virus detectado en /tmp/virus/malware.exe\nComando para eliminar: ./antivirus.sh --remove malware.exe",
                    "antivirus.sh": "Ejecuta este archivo para eliminar el virus. Uso: ./antivirus.sh --remove [archivo]"
                }
            }
        ],
        hints: [
            "Ejecuta 'cat infection.log' en /var/log",
            "Navega a /tmp/virus usando 'cd /tmp/virus'",
            "Ejecuta: ./antivirus.sh --remove malware.exe"
        ],
        winConditions: {
            requiredFiles: ['antivirus.sh', 'malware.exe'],
            requiredPath: '/tmp/virus',
            requiredCommand: './antivirus.sh --remove malware.exe'
        }
    },
    dataRecovery: {
        name: "Recuperación de Datos",
        description: "Datos críticos han sido cifrados. Tu misión:\n1. Encontrar el archivo cifrado (recovery.dat)\n2. Localizar la clave de descifrado (.key)\n3. Usar el comando: decrypt recovery.dat XK-2024\n\nPista inicial: Los archivos están en /backup",
        difficulty: "Normal",
        paths: [
            {
                start: "/backup",
                target: "/backup",
                files: {
                    "recovery.dat": "Datos críticos encontrados. Usa: decrypt recovery.dat [clave]",
                    ".key": "La clave de descifrado es: XK-2024"
                }
            }
        ],
        hints: [
            "Usa 'ls -a' para ver archivos ocultos en /backup",
            "La clave está en el archivo .key",
            "Ejecuta: decrypt recovery.dat XK-2024"
        ],
        winConditions: {
            requiredFiles: ['recovery.dat', '.key'],
            requiredPath: '/backup',
            requiredCommand: 'decrypt recovery.dat XK-2024'
        }
    }
};

// Estado global del juego
const gameState = {
    started: false,
    timeRemaining: 600,
    hints: 3,
    score: 0,
    errors: 0,
    discoveredFiles: new Set(),
    currentChallenge: null,
    timerInterval: null,
    lastCommand: ''
};

// Funciones de tiempo
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateStats();
        
        if (gameState.timeRemaining <= 120) {
            showEffect("⚠️ 2 MINUTOS RESTANTES ⚠️", "warning");
        }
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            gameOver("Se agotó el tiempo. Sistema bloqueado permanentemente.");
        }
    }, 1000);
}

function gameOver(message) {
    clearInterval(gameState.timerInterval);
    
    // Efectos de game over
    showEffect("❌ MISIÓN FALLIDA ❌", "error");
    setTimeout(() => {
        showEffect("💔 Sistema comprometido", "error");
    }, 1000);
    
    // Mostrar modal con mensaje
    showModal("GAME OVER", message);
    
    // Deshabilitar input
    const input = document.getElementById('command-input');
    input.disabled = true;
    
    // Esperar antes de volver al inicio
    setTimeout(() => {
        exitGame();
    }, 3000);
}

function exitGame() {
    const confirmation = confirm("¿Seguro que quieres salir? Perderás todo el progreso no guardado.");
    if (confirmation) {
        // Mostrar efecto de apagado
        showEffect("SISTEMA TERMINADO", "warning", () => {
            // Volver a la pantalla de inicio
            document.getElementById('terminal').style.display = 'none';
            document.getElementById('intro-screen').style.display = 'flex';
            
            // Limpiar terminal y estado
            clearTerminal();
            gameState.started = false;
            gameState.timeRemaining = 600;
            gameState.discoveredFiles = new Set();
            gameState.hints = 3;
            gameState.score = 0;
            gameState.errors = 0;
            
            // Limpiar intervalos
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            
            // Actualizar UI
            updateStats();
        });
    }
}

// Mejorar la función de selección de retos para evitar repeticiones
let usedChallenges = new Set();

function selectRandomChallenge() {
    const availableChallenges = Object.entries(CHALLENGES).filter(
        ([key]) => !usedChallenges.has(key)
    );
    
    // Si todos los retos han sido usados, reiniciar
    if (availableChallenges.length === 0) {
        usedChallenges.clear();
        return selectRandomChallenge();
    }
    
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    const [key, challenge] = availableChallenges[randomIndex];
    usedChallenges.add(key);
    return challenge;
}

function showChallengeBrief() {
    const challenge = gameState.currentChallenge;
    printLine("=== NUEVO RETO ===", "mission-header");
    printLine(`Nombre: ${challenge.name}`, "mission");
    printLine(`Dificultad: ${challenge.difficulty || "Normal"}`, "mission");
    printLine(`\nMISIÓN:\n${challenge.description}`, "mission");
    printLine("\nPuedes usar 'hint' para obtener pistas adicionales.", "mission");
    printLine("Los comandos se pueden copiar y pegar para mayor comodidad.", "mission");
    printLine("\nBuena suerte, agente.", "mission-footer");
}

// Función para usar pistas
function useHint() {
    if (gameState.hints <= 0) {
        printLine("No te quedan pistas disponibles.", "error");
        return;
    }
    
    const challenge = gameState.currentChallenge;
    const hintIndex = 3 - gameState.hints;
    if (hintIndex < challenge.hints.length) {
        gameState.hints--;
        updateStats();
        printLine(`💡 PISTA: ${challenge.hints[hintIndex]}`, "info");
    } else {
        printLine("No hay más pistas disponibles para este reto.", "error");
    }
}

// Verificar progreso
function checkProgress(command) {
    if (!gameState.currentChallenge) return;
    
    const challenge = gameState.currentChallenge;
    const winConditions = challenge.winConditions;
    
    // Track command attempts
    if (command.trim()) {
        if (!gameState.commandAttempts) {
            gameState.commandAttempts = [];
        }
        gameState.commandAttempts.push(command);
        gameState.lastCommand = command;
    }

    // Check file discoveries and give immediate feedback
    if (command.startsWith('cat ')) {
        const fileName = command.split(' ')[1];
        const currentDir = getDir(currentPath);
        if (currentDir && currentDir[fileName]) {
            if (!gameState.discoveredFiles.has(fileName)) {
                gameState.discoveredFiles.add(fileName);
                
                // Give feedback on important file discoveries
                if (winConditions.requiredFiles.includes(fileName)) {
                    gameState.score += 50;
                    showEffect("🔍 Archivo importante encontrado! +50 pts", "success");
                    
                    // Show progress hint
                    const remainingFiles = winConditions.requiredFiles.filter(
                        f => !gameState.discoveredFiles.has(f)
                    );
                    if (remainingFiles.length > 0) {
                        setTimeout(() => {
                            printLine(`💡 Progreso: ${winConditions.requiredFiles.length - remainingFiles.length}/${winConditions.requiredFiles.length} archivos encontrados`, "info");
                        }, 1000);
                    }
                }
                updateStats();
            }
        }
    }

    // Check directory progress
    const currentPathStr = '/' + currentPath.join('/');
    if (currentPathStr.endsWith(winConditions.requiredPath) && 
        !gameState.pathFound) {
        gameState.pathFound = true;
        showEffect("📁 ¡Ubicación correcta encontrada!", "success");
        gameState.score += 30;
        updateStats();
    }

    // Give contextual hints on repeated failed attempts
    if (gameState.commandAttempts && 
        gameState.commandAttempts.length > 5 &&
        !gameState.hintGiven) {
        const lastFiveCommands = gameState.commandAttempts.slice(-5);
        const hasRepeatedFailures = lastFiveCommands.every(cmd => 
            !cmd.startsWith(winConditions.requiredCommand)
        );
        
        if (hasRepeatedFailures) {
            gameState.hintGiven = true;
            setTimeout(() => {
                printLine("💭 Parece que necesitas ayuda. Usa 'hint' para obtener una pista", "info");
            }, 1000);
        }
    }
    
    // Comprobar victoria
    if (isVictoryConditionMet()) {
        victory();
    }
}

function isVictoryConditionMet() {
    const challenge = gameState.currentChallenge;
    const winConditions = challenge.winConditions;
    
    // Verificar que estamos en el directorio correcto
    const currentPathStr = '/' + currentPath.join('/');
    if (!currentPathStr.endsWith(winConditions.requiredPath)) {
        return false;
    }
    
    // Verificar que hemos encontrado todos los archivos requeridos
    for (const file of winConditions.requiredFiles) {
        if (!gameState.discoveredFiles.has(file)) {
            return false;
        }
    }
    
    // Verificar el comando requerido
    const lastCommand = gameState.lastCommand;
    if (winConditions.requiredCommand && lastCommand !== winConditions.requiredCommand) {
        return false;
    }
    
    return true;
}

function victory() {
    clearInterval(gameState.timerInterval);
    
    // Calcular puntuación final
    const timeBonus = Math.floor(gameState.timeRemaining / 10);
    gameState.score += timeBonus;
    
    // Verificar logros
    const achievements = checkAchievements();
    
    // Mostrar efectos de victoria
    showEffect("🏆 ¡RETO COMPLETADO! 🏆", "success");
    setTimeout(() => {
        showEffect("⭐ +" + timeBonus + " pts por tiempo", "success");
    }, 1000);
    
    // Mostrar pantalla de victoria
    showVictoryScreen(achievements);
    
    // Guardar progreso
    saveGameState();
    
    // Reproducir efecto de confeti
    showEffect("🎉", "success");
}

// Función para iniciar un nuevo reto
function startNewChallenge() {
    // Clear victory screen if it exists
    const victoryScreen = document.querySelector('.victory-screen');
    if (victoryScreen) {
        victoryScreen.remove();
        showEffect("🚀 INICIANDO NUEVA MISIÓN", "success");
    }
    
    // Reset state for new challenge
    gameState.timeRemaining = 600;
    gameState.discoveredFiles = new Set();
    gameState.errors = 0;
    gameState.pathFound = false;
    gameState.hintGiven = false;
    gameState.commandAttempts = [];
    currentPath = ['home', 'user'];
    
    // Select new challenge, ensuring it's different from the last one
    let newChallenge;
    do {
        newChallenge = selectRandomChallenge();
    } while (gameState.currentChallenge && newChallenge.name === gameState.currentChallenge.name);
    
    gameState.currentChallenge = newChallenge;
    
    // Clear terminal and show new challenge
    clearTerminal();
    showChallengeBrief();
    startTimer();
    
    // Enable input and update UI
    const input = document.getElementById('command-input');
    input.disabled = false;
    input.value = '';
    input.focus();
    
    // Update interface
    updateStats();
    updateTerminalHeader();
    
    // Save initial state
    saveGameState();

    // Show encouraging message
    setTimeout(() => {
        printLine("💫 ¡Nueva misión iniciada! Buena suerte.", "info");
    }, 1000);
}

// Iniciar juego
function startGame() {
    gameState.currentChallenge = selectRandomChallenge();
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('terminal').style.display = 'block';
    updateTerminalHeader();
    gameState.started = true;
    showChallengeBrief();
    startTimer();
    document.getElementById('command-input').focus();
}

// Funciones de UI y estadísticas
function updateStats() {
    document.querySelector('.time').textContent = formatTime(gameState.timeRemaining);
    document.querySelector('.hints').textContent = `💡 ${gameState.hints}`;
    document.querySelector('.score').textContent = `${gameState.score} pts`;
}

function showModal(title, content) {
    const modal = document.getElementById('modal-container');
    const modalTitle = modal.querySelector('h2');
    const modalContent = modal.querySelector('p');
    
    modalTitle.textContent = title;
    modalContent.textContent = content;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-container').style.display = 'none';
    document.getElementById('command-input').focus();
}

// Mejorar la función de efectos visuales
function showEffect(text, type, callback) {
    const effectsContainer = document.getElementById('effects-container');
    const effectDiv = document.createElement('div');
    effectDiv.className = `effect ${type}`;
    effectDiv.textContent = text;
    effectsContainer.appendChild(effectDiv);
    
    // Animación de entrada
    effectDiv.style.animation = 'fadeIn 0.3s ease-in';
    
    setTimeout(() => {
        // Animación de salida
        effectDiv.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            effectDiv.remove();
            if (callback) callback();
        }, 300);
    }, 2000);
}

// Mejorar el manejo de logros
function checkAchievements() {
    const achievements = [];
    
    if (gameState.timeRemaining > 480) { // Menos de 2 minutos
        achievements.push({
            name: 'Velocista',
            description: '¡Completaste el reto en menos de 2 minutos!',
            points: 100
        });
    }
    
    if (gameState.hints === 3) {
        achievements.push({
            name: 'Experto',
            description: '¡Completaste el reto sin usar pistas!',
            points: 150
        });
    }
    
    if (gameState.errors === 0) {
        achievements.push({
            name: 'Perfección',
            description: '¡No cometiste ningún error!',
            points: 200
        });
    }
    
    return achievements;
}

// Mejorar la pantalla de victoria
function showVictoryScreen(achievements) {
    const victoryDiv = document.createElement('div');
    victoryDiv.className = 'victory-screen fade-effect';
    
    let totalBonus = 0;
    const achievementsList = achievements.map(a => {
        totalBonus += a.points;
        return `<li class="achievement">
            <span class="achievement-name">${a.name}</span>
            <span class="achievement-desc">${a.description}</span>
            <span class="achievement-points">+${a.points}</span>
        </li>`;
    }).join('');
    
    victoryDiv.innerHTML = `
        <h2>¡MISIÓN COMPLETADA!</h2>
        <div class="stats-container">
            <div class="stat-item">
                <span class="stat-label">Tiempo:</span>
                <span class="stat-value">${formatTime(600 - gameState.timeRemaining)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Puntuación Base:</span>
                <span class="stat-value">${gameState.score}</span>
            </div>
            ${achievements.length > 0 ? `
                <div class="achievements-container">
                    <h3>Logros Desbloqueados:</h3>
                    <ul class="achievements-list">
                        ${achievementsList}
                    </ul>
                    <div class="bonus-points">
                        Bonus Total: +${totalBonus}
                    </div>
                </div>
            ` : ''}
            <div class="final-score">
                Puntuación Final: ${gameState.score + totalBonus}
            </div>
        </div>
        <div class="victory-buttons">
            <button onclick="startNewChallenge()" class="next-mission">Siguiente Misión</button>
            <button onclick="exitGame()" class="exit-game">Salir</button>
        </div>
    `;
    
    document.body.appendChild(victoryDiv);
    
    // Efecto de confeti
    showEffect("🎉", "success");
}

// Función para actualizar el encabezado del terminal
function updateTerminalHeader() {
    const headerTitle = document.querySelector('.terminal-title');
    headerTitle.textContent = `user@escape:/${currentPath.join('/')}`;
}

// Actualizar el estado después de cada comando
function afterCommand() {
    updateStats();
    saveGameState();
}

// Mostrar tutorial en el primer inicio
function showTutorial() {
    if (!localStorage.getItem('tutorialShown')) {
        showModal(
            "Bienvenido a Escape Terminal",
            "Usa comandos de Linux para resolver los retos. Escribe 'help' para ver los comandos disponibles. ¡El tiempo corre!"
        );
        localStorage.setItem('tutorialShown', 'true');
    }
}

// Mejorar el inicio del juego
const originalStartGame = startGame;
startGame = function() {
    originalStartGame();
    showTutorial();
    updateStats();
}

function saveGameState() {
    const state = {
        timeRemaining: gameState.timeRemaining,
        hints: gameState.hints,
        score: gameState.score,
        discoveredFiles: Array.from(gameState.discoveredFiles),
        currentPath: currentPath,
        currentChallenge: gameState.currentChallenge
    };
    
    try {
        localStorage.setItem('escapeTerminalState', JSON.stringify(state));
    } catch (error) {
        console.error('Error guardando estado:', error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem('escapeTerminalState');
        if (savedState) {
            const state = JSON.parse(savedState);
            gameState.timeRemaining = state.timeRemaining;
            gameState.hints = state.hints;
            gameState.score = state.score;
            gameState.discoveredFiles = new Set(state.discoveredFiles);
            gameState.currentChallenge = state.currentChallenge;
            currentPath = state.currentPath;
            return true;
        }
    } catch (error) {
        console.error('Error cargando estado:', error);
    }
    return false;
}