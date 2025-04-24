// Variables globales y referencias
const input = document.getElementById("command-input");
const output = document.getElementById("output");
let commandHistory = [];
let historyIndex = -1;
let currentPath = ['home', 'user'];

function handleCommand(command) {
    if (!command.trim()) {
        printLine('');
        return;
    }

    printLine(`${getPrompt()}${command}`, 'command');
    const [cmd, ...args] = command.toLowerCase().trim().split(' ');

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
                    printLine("cat: falta operando");
                    return;
                }
                catFile(args[0]);
                break;
            case 'pwd':
                printLine('/' + currentPath.join('/'));
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
                    printLine("grep: faltan parámetros");
                    return;
                }
                grepInFiles(args[0], args.slice(1));
                break;
            case 'hint':
                useHint();
                break;
            case '':
                break;
            default:
                printLine(`${cmd}: comando no encontrado`);
        }
    } catch (error) {
        console.error('Error ejecutando comando:', error);
        printLine('Error interno del sistema', 'error');
        gameState.errors++;
    }

    // Verificar progreso después de cada comando
    checkProgress(command);
}

function listFiles(path = '.', flags = []) {
    let targetPath;
    let targetDir;
    
    try {
        // Resolver el path objetivo
        if (path === '.') {
            targetPath = [...currentPath];
            targetDir = getDir(targetPath);
        } else if (path === '..') {
            targetPath = currentPath.length > 1 ? currentPath.slice(0, -1) : [];
            targetDir = getDir(targetPath);
        } else if (path.startsWith('/')) {
            targetPath = path.split('/').filter(p => p);
            targetDir = getDir(targetPath);
        } else {
            targetPath = [...currentPath, path];
            targetDir = getDir(targetPath);
        }

        if (!targetDir) {
            printLine(`ls: no se puede acceder a '${path}': No existe el directorio`);
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
                if (typeof content === 'object') {
                    element.className = 'file-directory';
                    element.textContent = name + '/';
                } else if (name.endsWith('.sh') || name.endsWith('.exe')) {
                    element.className = 'file-executable';
                    element.textContent = name;
                } else {
                    element.className = 'file-regular';
                    element.textContent = name;
                }
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
        printLine('Error al listar el directorio');
        gameState.errors++;
    }
}

function catFile(arg) {
    try {
        let targetPath;
        let targetDir;
        let fileName;

        if (arg.includes('/')) {
            // Si es una ruta con directorios
            const parts = arg.split('/');
           
            const dirPath = parts.join('/');
            
            if (arg.startsWith('/')) {
                targetPath = parts.filter(p => p);
            } else {
                targetPath = [...currentPath, ...parts.filter(p => p)];
            }
            targetDir = getDir(targetPath);
        } else {
            // Si es solo un nombre de archivo
            targetDir = getDir(currentPath);
            fileName = arg;
        }

        if (!targetDir) {
            printLine(`cat: ${arg}: No existe el directorio`);
            gameState.errors++;
            return;
        }

        if (typeof targetDir[fileName] === 'string') {
            printLine(targetDir[fileName]);
            // Registrar el archivo como descubierto
            gameState.discoveredFiles.add(fileName);
        } else if (typeof targetDir[fileName] === 'object') {
            printLine(`cat: ${fileName}: Es un directorio`);
            gameState.errors++;
        } else {
            printLine(`cat: ${arg}: No existe el archivo`);
            gameState.errors++;
        }
    } catch (error) {
        console.error('Error en cat:', error);
        printLine('Error al leer el archivo');
        gameState.errors++;
    }
}

function changeDir(arg) {
    let newPath;
    
    try {
        if (!arg || arg === '~') {
            newPath = ['home', 'user'];
        } else if (arg === '..') {
            newPath = currentPath.length > 1 ? currentPath.slice(0, -1) : [];
        } else if (arg === '.') {
            return; // Mantener el directorio actual
        } else if (arg.startsWith('/')) {
            newPath = arg.split('/').filter(p => p);
        } else {
            newPath = [...currentPath, arg];
        }

        const targetDir = getDir(newPath);
        if (!targetDir || typeof targetDir !== 'object') {
            printLine(`cd: ${arg}: No existe el directorio`);
            gameState.errors++;
            return;
        }

        // Si llegamos aquí, el directorio existe y es válido
        currentPath = newPath;
        updateTerminalHeader();
        
    } catch (error) {
        console.error('Error en cd:', error);
        printLine('Error al cambiar de directorio');
        gameState.errors++;
    }
}

function clearTerminal() {
    output.innerHTML = '';
}

function printLine(text, type = 'response') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    // Si el texto contiene HTML, asegurarse de que se renderice correctamente
    if (text.includes('<span')) {
        line.innerHTML = text;
    } else {
        line.textContent = text;
    }
    
    // Asegurar que se mantenga el espaciado
    line.style.whiteSpace = 'pre';
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
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
    const input_text = input.value;
    const args = input_text.split(' ');
    const currentArg = args[args.length - 1];
    
    const dir = getDir(currentPath);
    if (!dir) return;
    
    // Solo mostrar archivos ocultos si el usuario está escribiendo explícitamente un punto
    const possibilities = Object.keys(dir).filter(name => {
        if (currentArg.startsWith('.')) {
            return name.startsWith(currentArg);
        } else {
            return !name.startsWith('.') && name.startsWith(currentArg);
        }
    });
    
    if (possibilities.length === 1) {
        args[args.length - 1] = possibilities[0];
        input.value = args.join(' ');
    } else if (possibilities.length > 1) {
        printLine(possibilities.join('  '));
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
    const dir = path === '.' ? getDir(currentPath) : getDir(resolvePath(path));
    if (!dir) {
        printLine(`tree: no se puede acceder a '${path}'`);
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

    searchInDir(getDir(currentPath), currentPath);
}

function grepInFiles(pattern, files) {
    const searchDir = getDir(currentPath);
    
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
                printLine(`grep: ${file}: No existe el archivo`);
            } else {
                printLine(`grep: ${file}: No es un archivo de texto`);
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
    if (!path) return currentPath;
    
    let resolvedPath = [];
    
    if (path.startsWith('/')) {
        // Ruta absoluta
        resolvedPath = path.split('/').filter(p => p);
    } else if (path === '~') {
        resolvedPath = ['home', 'user'];
    } else {
        // Ruta relativa
        resolvedPath = [...currentPath];
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
    return window.formatPrompt(currentPath);
}
