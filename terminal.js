// Variables globales y referencias
const input = document.getElementById("command-input");
const output = document.getElementById("output");
let commandHistory = [];
let historyIndex = -1;

function handleCommand(command) {
    if (!window.gameState) {
        printLine('Error: El sistema no está inicializado.', 'error');
        console.error('gameState no está definido');
        return;
    }

    if (!command.trim()) {
        printLine('');
        return;
    }

    printLine(`${getPrompt()}${command}`, 'command');
    const normalizedCommand = command.trim(); // Normalizar comando
    const [cmd, ...args] = normalizedCommand.toLowerCase().split(' ');

    let isCorrectCommand = false; // Bandera para evitar mensajes de error en comandos correctos

    try {
        switch (cmd) {
            case 'ls':
                const flags = args.filter(arg => arg.startsWith('-'));
                const paths = args.filter(arg => !arg.startsWith('-'));
                listFiles(paths[0], flags);
                break;
            case 'cd':
                changeDir(args[0]);
                break;
            case 'cat':
                if (!args[0]) {
                    printLine("cat: falta operando", 'error');
                    gameState.errors++;
                    return;
                }
                catFile(args[0]);
                break;
            case 'pwd':
                printLine('/' + gameState.currentPath.join('/'));
                break;
            case 'clear':
                clearTerminal();
                break;
            case 'help':
                showHelp();
                break;
            case 'tree':
                showTree(args[0] || '.');
                break;
            case 'find':
                findFiles(args);
                break;
            case 'grep':
                if (args.length < 2) {
                    printLine("grep: faltan parámetros", 'error');
                    gameState.errors++;
                    return;
                }
                grepInFiles(args[0], args.slice(1));
                break;
            case 'hint':
                useHint();
                break;
            case './hack_tool.sh':
                if (normalizedCommand === './hack_tool.sh K3rn3l_P4ss_2024' && gameState.currentPath.join('/') === 'sys/kernel') {
                    printLine('Sistema hackeado con éxito.', 'success');
                    isCorrectCommand = true;
                } else {
                    printLine('Error: Contraseña incorrecta o ubicación inválida.', 'error');
                    gameState.errors++;
                }
                break;
            case './antivirus.sh':
                if (normalizedCommand === './antivirus.sh --remove malware.exe' && gameState.currentPath.join('/') === 'tmp/virus') {
                    printLine('Virus eliminado con éxito.', 'success');
                    isCorrectCommand = true;
                } else {
                    printLine('Error: Uso incorrecto o ubicación inválida.', 'error');
                    gameState.errors++;
                }
                break;
            case 'decrypt':
                if (normalizedCommand === 'decrypt recovery.dat XK-2024' && gameState.currentPath.join('/') === 'backup') {
                    printLine('Datos descifrados con éxito.', 'success');
                    isCorrectCommand = true;
                } else {
                    printLine('Error: Clave incorrecta o archivo inválido.', 'error');
                    gameState.errors++;
                }
                break;
            default:
                printLine(`${cmd}: comando no encontrado. Escribe 'help' para ver los comandos disponibles.`, 'error');
                gameState.errors++;
        }
    } catch (error) {
        console.error('Error ejecutando comando:', error);
        printLine('Error interno del sistema', 'error');
        gameState.errors++;
    }

    // Verificar progreso después de cada comando
    checkProgress(normalizedCommand, isCorrectCommand);
}

function listFiles(path = '.', flags = []) {
    let targetPath;
    let targetDir;
    
    try {
        // Resolver el path objetivo
        if (path === '.') {
            targetPath = [...gameState.currentPath];
            targetDir = getDir(targetPath);
        } else if (path === '..') {
            targetPath = gameState.currentPath.length > 1 ? gameState.currentPath.slice(0, -1) : [];
            targetDir = getDir(targetPath);
        } else if (path.startsWith('/')) {
            targetPath = path.split('/').filter(p => p);
            targetDir = getDir(targetPath);
        } else {
            targetPath = [...gameState.currentPath, path];
            targetDir = getDir(targetPath);
        }

        if (!targetDir) {
            printLine(`ls: no se puede acceder a '${path}': No existe el directorio`, 'error');
            gameState.errors++;
            return;
        }

        // Obtener y ordenar archivos
        let files = Object.entries(targetDir).sort((a, b) => {
            // Ordenar primero por tipo (directorios primero) y luego alfabéticamente
            const aIsDir = typeof a[1] === 'object';
            const bIsDir = typeof b[1] === 'object';
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            // Ignorar el punto inicial al ordenar alfabéticamente
            const aName = a[0].replace(/^\./, '');
            const bName = b[0].replace(/^\./, '');
            return aName.localeCompare(bName);
        });
        
        // Filtrar archivos ocultos si no se especifica -a
        if (!flags.includes('-a')) {
            files = files.filter(([name]) => !name.startsWith('.'));
        }
        
        if (flags.includes('-l')) {
            // Formato largo
            const now = new Date();
            const dateStr = now.toLocaleString('es-ES', { 
                month: 'short', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            files.forEach(([name, content]) => {
                const type = typeof content === 'object' ? 'd' : '-';
                const perms = type === 'd' ? 'rwxr-xr-x' : 'rw-r--r--';
                const size = typeof content === 'string' ? content.length : 4096;
                const nameElement = document.createElement('span');
                nameElement.className = type === 'd' ? 'file-directory' : 
                                     (name.endsWith('.sh') || name.endsWith('.exe')) ? 'file-executable' : 
                                     'file-regular';
                nameElement.textContent = name + (type === 'd' ? '/' : '');
                
                const line = `${type}${perms} 1 user user ${size.toString().padStart(8)} ${dateStr} `;
                printLine(line + nameElement.outerHTML);
            });
        } else {
            // Formato normal con clases CSS
            const formattedFiles = files.map(([name, content]) => {
                const element = document.createElement('span');
                element.className = typeof content === 'object' ? 'file-directory' :
                                  (name.endsWith('.sh') || name.endsWith('.exe')) ? 'file-executable' :
                                  'file-regular';
                element.textContent = name + (typeof content === 'object' ? '/' : '');
                return element.outerHTML;
            });

            // Calcular el ancho máximo de los nombres de archivo
            const maxLength = Math.max(...files.map(([name]) => name.length)) + 2;
            const terminalWidth = 80;
            const columns = Math.floor(terminalWidth / (maxLength + 2));
            const filesPerRow = Math.min(columns, files.length);
            
            // Crear filas con el espaciado correcto
            for (let i = 0; i < files.length; i += filesPerRow) {
                const rowFiles = formattedFiles.slice(i, i + filesPerRow);
                const row = rowFiles.map(file => {
                    const plainText = file.replace(/<[^>]+>/g, '');
                    const padding = ' '.repeat(maxLength - plainText.length + 2);
                    return file + padding;
                }).join('');
                printLine(row.trimEnd());
            }
        }
    } catch (error) {
        console.error('Error en ls:', error);
        printLine('Error al listar el directorio', 'error');
        gameState.errors++;
    }
}

function catFile(arg) {
    try {
        let targetPath;
        let targetDir;
        let fileName;

        if (arg.includes('/')) {
            const parts = arg.split('/');
            fileName = parts.pop(); // Última parte es el nombre del archivo
            const dirPath = parts.filter(p => p); // Resto es el directorio
            targetPath = arg.startsWith('/') ? dirPath : [...gameState.currentPath, ...dirPath];
            targetDir = getDir(targetPath);
        } else {
            targetDir = getDir(gameState.currentPath);
            fileName = arg;
        }

        if (!targetDir) {
            printLine(`cat: ${arg}: No existe el directorio`, 'error');
            gameState.errors++;
            return;
        }

        if (typeof targetDir[fileName] === 'string') {
            printLine(targetDir[fileName]);
            gameState.discoveredFiles.add(fileName);
        } else if (typeof targetDir[fileName] === 'object') {
            printLine(`cat: ${fileName}: Es un directorio`, 'error');
            gameState.errors++;
        } else {
            printLine(`cat: ${fileName}: No existe el archivo`, 'error');
            gameState.errors++;
        }
    } catch (error) {
        console.error('Error en cat:', error);
        printLine('Error al leer el archivo', 'error');
        gameState.errors++;
    }
}

function changeDir(arg) {
    let newPath;
    
    try {
        if (!arg || arg === '~') {
            newPath = ['home', 'user'];
        } else if (arg === '..') {
            newPath = gameState.currentPath.length > 1 ? gameState.currentPath.slice(0, -1) : [];
        } else if (arg === '.') {
            return; // Mantener el directorio actual
        } else if (arg.startsWith('/')) {
            newPath = arg.split('/').filter(p => p);
        } else {
            newPath = [...gameState.currentPath, arg];
        }

        const targetDir = getDir(newPath);
        if (!targetDir || typeof targetDir !== 'object') {
            printLine(`cd: ${arg}: No existe el directorio`, 'error');
            gameState.errors++;
            return;
        }

        // Si llegamos aquí, el directorio existe y es válido
        gameState.currentPath = newPath;
        updateTerminalHeader();
        
    } catch (error) {
        console.error('Error en cd:', error);
        printLine('Error al cambiar de directorio', 'error');
        gameState.errors++;
    }
}

function clearTerminal() {
    output.innerHTML = '';
}

function printLine(text, type = 'response') {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    if (text.includes('=== NUEVO RETO ===') || text.includes('Buena suerte, agente.')) {
        const spacer = document.createElement('div');
        spacer.style.height = '1rem';
        output.appendChild(spacer);
    }
    
    line.style.whiteSpace = 'pre';
    if (text.includes('<span')) {
        line.innerHTML = text;
    } else {
        line.textContent = text;
    }
    
    output.appendChild(line);
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
        document.getElementById('command-input').scrollIntoView({ behavior: 'smooth' });
    });
}

// Event listeners para el input
input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const command = input.value.trim();
        if (command) {
            commandHistory.unshift(command);
            if (commandHistory.length > 50) commandHistory.pop();
            historyIndex = -1;
            handleCommand(command);
            input.value = "";
        }
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[historyIndex];
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > -1) {
            historyIndex--;
            input.value = historyIndex === -1 ? "" : commandHistory[historyIndex];
        }
    } else if (e.key === "Tab") {
        e.preventDefault();
        autoComplete();
    }
});

function autoComplete() {
    const inputText = input.value.trim();
    const args = inputText.split(' ');
    const currentArg = args[0]; // Primer argumento es el comando

    if (args.length === 1 && !inputText.endsWith(' ')) {
        const commands = ['ls', 'cd', 'cat', 'pwd', 'clear', 'help', 'tree', 'find', 'grep', 'hint', './hack_tool.sh', './antivirus.sh', 'decrypt'];
        const possibilities = commands.filter(cmd => cmd.startsWith(currentArg));
        if (possibilities.length === 1) {
            input.value = possibilities[0] + ' ';
        } else if (possibilities.length > 1) {
            printLine(possibilities.join('  '));
        }
    } else {
        const dir = getDir(gameState.currentPath);
        if (!dir) return;
        const currentArgLast = args[args.length - 1];
        const possibilities = Object.keys(dir).filter(name => {
            if (currentArgLast.startsWith('.')) {
                return name.startsWith(currentArgLast);
            }
            return !name.startsWith('.') && name.startsWith(currentArgLast);
        });
        if (possibilities.length === 1) {
            args[args.length - 1] = possibilities[0];
            input.value = args.join(' ') + (typeof dir[possibilities[0]] === 'object' ? '/' : '');
        } else if (possibilities.length > 1) {
            printLine(possibilities.join('  '));
        }
    }
}

// Mantener el foco en el input
document.addEventListener('click', () => {
    if (gameState.started) {
        input.focus();
    }
});

input.addEventListener('blur', () => {
    if (gameState.started) {
        setTimeout(() => input.focus(), 10);
    }
});

function showTree(path = '.', prefix = '') {
    const dir = path === '.' ? getDir(gameState.currentPath) : getDir(resolvePath(path));
    if (!dir) {
        printLine(`tree: no se puede acceder a '${path}'`, 'error');
        gameState.errors++;
        return;
    }

    Object.entries(dir).forEach(([name, content], index, array) => {
        const isLast = index === array.length - 1;
        const line = `${prefix}${isLast ? '└── ' : '├── '}${name}${typeof content === 'object' ? '/' : ''}`;
        printLine(line);
        
        if (typeof content === 'object') {
            showTree(
                path === '.' ? name : `${path}/${name}`,
                `${prefix}${isLast ? '    ' : '│   '}`
            );
        }
    });
}

function findFiles(args) {
    const pattern = args[0];
    const showHidden = pattern.startsWith('.');
    let filesFound = 0;

    function searchInDir(dir, currentPath) {
        for (const [name, content] of Object.entries(dir)) {
            if (name.startsWith('.') && !showHidden) continue;
            const fullPath = [...currentPath, name].join('/');
            if (name.includes(pattern)) {
                printLine(fullPath);
                filesFound++;
            }
            if (typeof content === 'object') {
                searchInDir(content, [...currentPath, name]);
            }
        }
    }

    searchInDir(getDir(gameState.currentPath), gameState.currentPath);
}

function grepInFiles(pattern, files) {
    const searchDir = getDir(gameState.currentPath);
    
    files.forEach(file => {
        // Permitir buscar en archivos ocultos solo si se especifica explícitamente
        if (file.startsWith('.') || !file.startsWith('.')) {
            const content = searchDir[file];
            if (typeof content === 'string') {
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(pattern.toLowerCase())) {
                        printLine(`${file}:${index + 1}: ${line}`);
                    }
                });
            } else if (content === undefined) {
                printLine(`grep: ${file}: No existe el archivo`, 'error');
                gameState.errors++;
            } else {
                printLine(`grep: ${file}: No es un archivo de texto`, 'error');
                gameState.errors++;
            }
        }
    });
}

function showHelp() {
    const commands = [
        'Comandos disponibles:',
        '  ls [-l] [-a] [path]  - Listar archivos y directorios',
        '  cd [dir]            - Cambiar al directorio especificado',
        '  pwd                 - Mostrar directorio actual',
        '  cat <archivo>       - Mostrar contenido de un archivo',
        '  tree [path]         - Mostrar estructura de directorios en árbol',
        '  find <patrón>       - Buscar archivos por nombre',
        '  grep <patrón> <archivos...> - Buscar texto dentro de archivos',
        '  clear              - Limpiar la pantalla',
        '  help               - Mostrar esta ayuda',
        '  hint               - Mostrar una pista (quedan: ' + gameState.hints + ')'
    ];
    commands.forEach(cmd => printLine(cmd));
}

function resolvePath(path) {
    if (!path || typeof path !== 'string') {
        return gameState.currentPath;
    }
    
    let resolvedPath = [];
    
    if (path.startsWith('/')) {
        // Ruta absoluta
        resolvedPath = path.split('/').filter(p => p);
    } else if (path === '~') {
        resolvedPath = ['home', 'user'];
    } else {
        // Ruta relativa
        resolvedPath = [...gameState.currentPath];
        const parts = path.split('/');
        
        for (const part of parts) {
            // Preservar archivos ocultos en la resolución de rutas
            if (part === '..') {
                if (resolvedPath.length > 1) resolvedPath.pop();
            } else if (part === '.' || !part) {
                // No hacer nada para '.' o partes vacías
                continue;
            } else {
                resolvedPath.push(part);
            }
        }
    }
    
    return resolvedPath;
}

function getPrompt() {
    return window.formatPrompt(gameState.currentPath);
}