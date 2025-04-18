const input = document.getElementById("command-input");
const output = document.getElementById("output");
let commandHistory = [];
let historyIndex = -1;

let currentPath = ['home', 'user'];

const filesystem = {
    home: {
        user: {
            'readme.txt': 'Bienvenido al sistema. Algo no va bien...',
            'secret.txt': 'Primera pista: Busca en /etc/security/',
            '.hidden': 'Has encontrado un archivo oculto!'
        }
    },
    etc: {
        security: {
            'access.log': 'Último acceso: 23:59:59',
            'backdoor.sh': 'Script malicioso detectado'
        }
    },
    var: {
        log: {
            'system.log': 'Error detectado en /tmp/virus/',
            'infection.log': 'Virus detectado en sector 7'
        }
    },
    tmp: {
        virus: {
            'malware.exe': 'Archivo malicioso encontrado',
            'antivirus.sh': 'Herramienta de limpieza'
        }
    },
    backup: {
        'recovery.dat': 'Datos críticos encontrados',
        '.key': 'La clave de descifrado es: XK-2024'
    },
    sys: {
        kernel: {
            'hack_tool.sh': 'Herramienta de hackeo activada',
            '.password': 'K3rn3l_P4ss_2024',
            'notes.txt': 'La vulnerabilidad está en el puerto 1337'
        }
    }
};

function getDir(path) {
  return path.reduce((acc, dir) => acc?.[dir], filesystem);
}

function listDir() {
  const dir = getDir(currentPath);
  return Object.keys(dir).join("  ");
}

function changeDir(arg) {
    if (!arg || arg === '~') {
        currentPath = ['home', 'user'];
    } else if (arg === '..') {
        if (currentPath.length > 1) currentPath.pop();
    } else if (arg.startsWith('/')) {
        // Manejo de rutas absolutas
        const newPath = arg.split('/').filter(p => p);
        const testPath = getDir(newPath);
        if (testPath && typeof testPath === 'object') {
            currentPath = newPath;
        } else {
            printLine(`cd: ${arg}: No existe el directorio`);
        }
    } else {
        // Manejo de rutas relativas
        const dir = getDir(currentPath);
        if (dir[arg] && typeof dir[arg] === 'object') {
            currentPath.push(arg);
        } else {
            printLine(`cd: ${arg}: No existe el directorio`);
        }
    }
    updateTerminalHeader();
}

function catFile(arg) {
  const dir = getDir(currentPath);
  if (dir[arg] && typeof dir[arg] === "string") {
    printLine(dir[arg]);
  } else {
    printLine(`cat: ${arg}: No such file`);
  }
}

function clearTerminal() {
    output.innerHTML = '';
}

function printLine(text, type = 'response') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    // Si es el inicio de un nuevo reto, añadir espacios extra
    if (text.includes('=== NUEVO RETO ===')) {
        const spacer = document.createElement('div');
        spacer.style.height = '1rem';
        output.appendChild(spacer);
    }
    
    line.innerHTML = text;
    output.appendChild(line);
    
    // Si es el final del briefing, añadir espacio extra
    if (text.includes('Buena suerte, agente.')) {
        const spacer = document.createElement('div');
        spacer.style.height = '1rem';
        output.appendChild(spacer);
    }
    
    // Auto-scroll mejorado
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
        input.scrollIntoView({ behavior: 'smooth' });
    });
}

function printHelp() {
    const commands = [
        "Comandos disponibles:",
        "  ls          - Lista archivos del directorio actual",
        "  cd [dir]    - Cambia al directorio especificado",
        "  cat [file]  - Muestra el contenido de un archivo",
        "  clear       - Limpia la pantalla",
        "  pwd         - Muestra el directorio actual",
        "  help        - Muestra esta ayuda",
        "  hint        - Muestra una pista (quedan: " + gameState.hints + ")"
    ];
    commands.forEach(cmd => printLine(cmd));
}

function getPrompt() {
  return `user@escape:/${currentPath.join("/")}$ `;
}

input.addEventListener("keydown", function(e) {
    switch(e.key) {
        case "Enter":
            const command = input.value.trim();
            if (command) {
                commandHistory.unshift(command);
                if (commandHistory.length > 50) commandHistory.pop();
                historyIndex = -1;
                
                handleCommand(command);
                input.value = "";
            }
            break;
            
        case "ArrowUp":
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            }
            break;
            
        case "ArrowDown":
            e.preventDefault();
            if (historyIndex > -1) {
                historyIndex--;
                input.value = historyIndex === -1 ? "" : commandHistory[historyIndex];
            }
            break;
            
        case "Tab":
            e.preventDefault();
            autoComplete();
            break;
    }
});

function autoComplete() {
    const input_text = input.value;
    const args = input_text.split(' ');
    const currentArg = args[args.length - 1];
    
    const dir = getDir(currentPath);
    if (!dir) return;
    
    const possibilities = Object.keys(dir).filter(name => 
        name.startsWith(currentArg)
    );
    
    if (possibilities.length === 1) {
        args[args.length - 1] = possibilities[0];
        input.value = args.join(' ');
    } else if (possibilities.length > 1) {
        printLine(possibilities.join('  '));
    }
}

function handleCommand(command) {
    if (!command.trim()) return;

    // Solo imprimimos el comando una vez
    printLine(`${getPrompt()}${command}`, 'command');

    // Ejecutar el comando
    executeCommand(command.toLowerCase().trim());

    // Forzar scroll al final
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
        input.scrollIntoView({ behavior: 'smooth' });
    });
}

function executeCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    // Añadir espacio antes de la respuesta
    printLine('');
    
    switch (cmd) {
        case 'ls':
            printLine(listDir());
            break;
        case 'cd':
            changeDir(args[0]);
            break;
        case 'cat':
            if (!args[0]) {
                printLine("cat: falta operando");
                return;
            }
            catFile(args[0]);
            break;
        case 'clear':
            clearTerminal();
            break;
        case 'help':
            printHelp();
            break;
        case 'hint':
            useHint();
            break;
        case 'pwd':
            printLine('/' + currentPath.join('/'));
            break;
        case '':
            break;
        default:
            printLine(`${cmd}: comando no encontrado`);
    }
    
    // Añadir espacio después de la respuesta
    printLine('');
    
    // Verificar progreso después de cada comando
    checkProgress(command);
}

function listFiles(path) {
    let targetDir = getDir(currentPath);
    if (path) {
        const newPath = resolvePath(path);
        targetDir = getDir(newPath);
        if (!targetDir) {
            printLine(`ls: no se puede acceder a '${path}': No existe el archivo o directorio`);
            return;
        }
    }
    
    const files = Object.keys(targetDir).sort().map(name => {
        const item = targetDir[name];
        if (typeof item === 'object') {
            return `\x1b[34m${name}/\x1b[0m`;  // Directorios en azul
        }
        return name;
    });
    
    printLine(files.join('  '));
}

function resolvePath(path) {
    if (path.startsWith('/')) {
        return path.split('/').filter(p => p);
    }
    if (path === '~') {
        return ['home', 'user'];
    }
    const resolvedPath = [...currentPath];
    path.split('/').forEach(part => {
        if (part === '..') {
            if (resolvedPath.length > 1) resolvedPath.pop();
        } else if (part && part !== '.') {
            resolvedPath.push(part);
        }
    });
    return resolvedPath;
}

function changeDirectory(path) {
    if (!path || path === '~') {
        currentPath = ['home', 'user'];
        return;
    }
    
    const newPath = resolvePath(path);
    const targetDir = getDir(newPath);
    
    if (!targetDir || typeof targetDir !== 'object') {
        printLine(`cd: ${path}: No existe el directorio`);
        return;
    }
    
    currentPath = newPath;
}

function updateTerminalHeader() {
    const headerTitle = document.querySelector('.terminal-title');
    headerTitle.textContent = `user@escape:/${currentPath.join('/')}`;
}

// Llamar a updateTerminalHeader al iniciar el juego
function startGame() {
    gameState.currentChallenge = selectRandomChallenge();
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('terminal').style.display = 'block';
    updateTerminalHeader(); // Inicializar el header
    gameState.started = true;
    showChallengeBrief();
    startTimer();
    document.getElementById('command-input').focus();
}

function exitGame() {
    const confirmation = confirm("¿Seguro que quieres salir del juego? Perderás todo el progreso.");
    if (confirmation) {
        // Mostrar efecto de apagado
        showEffect("SISTEMA TERMINADO", "warning", () => {
            // Volver a la pantalla de inicio
            document.getElementById('terminal').style.display = 'none';
            document.getElementById('intro-screen').style.display = 'flex';
            // Limpiar el terminal
            clearTerminal();
            // Resetear el estado del juego
            gameState.started = false;
            gameState.timeRemaining = 600;
            gameState.discoveredFiles = new Set();
            gameState.hints = 3;
            gameState.score = 0;
        });
    }
}

// Añadir el atajo de teclado Ctrl+C para salir
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'c') {
        exitGame();
    }
});

// Mantener el foco en el input
document.addEventListener('click', () => {
    input.focus();
});

input.addEventListener('blur', () => {
    setTimeout(() => input.focus(), 10);
});
