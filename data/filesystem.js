// Sistema de archivos del juego
window.filesystem = {
    home: {
        user: {
            'readme.txt': 'Bienvenido al sistema. Algo no va bien...\nRevisa los logs del sistema en /var/log para más información.',
            'secret.txt': 'Primera pista: Busca en /etc/security/',
            '.hidden': 'Has encontrado un archivo oculto! Busca más archivos que empiecen por punto (.)'
        }
    },
    etc: {
        security: {
            'access.log': 'Último acceso: 23:59:59\nActividad sospechosa detectada\nIntento de acceso desde IP: 127.0.0.1',
            'backdoor.sh': 'Script malicioso detectado. Parece que alguien ha instalado una puerta trasera en el sistema.',
            'users.db': 'Base de datos de usuarios comprometida. Se requiere acceso root para reparar.'
        }
    },
    var: {
        log: {
            'system.log': 'Error crítico detectado en /tmp/virus/\nNivel de amenaza: ALTO\nSe recomienda acción inmediata',
            'infection.log': 'Virus detectado en sector 7\nTipo: Ransomware\nEstado: Activo\nUbicación: /tmp/virus/malware.exe',
            'access_attempts.log': 'Múltiples intentos de acceso detectados\nOrigen: Desconocido\nObjetivo: /sys/kernel'
        }
    },
    tmp: {
        virus: {
            'malware.exe': 'ARCHIVO MALICIOSO - NO EJECUTAR\nEste archivo está intentando cifrar el sistema.',
            'antivirus.sh': '#!/bin/bash\nEjecutar este script para eliminar el virus.',
            '.backdoor': 'Conexión remota establecida. Puerto: 1337'
        }
    },
    sys: {
        kernel: {
            'hack_tool.sh': 'Herramienta de hackeo encontrada.\nUso: ./hack_tool.sh [password]\nNecesitas la contraseña del kernel.',
            '.password': 'K3rn3l_P4ss_2024',
            'notes.txt': 'La vulnerabilidad está en el puerto 1337. Usar hack_tool.sh con la contraseña correcta.',
            'config.sys': 'Configuración del sistema\nModo: Emergencia\nAcceso: Restringido'
        }
    },
    backup: {
        'recovery.dat': 'DATOS CRÍTICOS - CIFRADOS\nSe requiere clave de descifrado con el comando `decrypt\nUsa: decrypt recovery.dat [clave]´.',
        '.key': 'La clave de descifrado es: XK-2024',
        'backup.log': 'Último respaldo: hace 2 días\nEstado: Completo\nArchivos: Cifrados'
    }
};

// Función mejorada para navegar por el filesystem
window.getDir = function(path) {
    // Si no hay path, devolver el root
    if (!path || path.length === 0) return window.filesystem;
    
    // Normalizar el path para manejar tanto arrays como strings
    let normalizedPath = Array.isArray(path) ? path : path.split('/').filter(Boolean);
    
    // Si el path es absoluto (comienza con /), eliminar el primer elemento vacío
    if (path[0] === '') {
        normalizedPath = normalizedPath.slice(1);
    }
    
    try {
        let current = window.filesystem;
        for (const segment of normalizedPath) {
            // Manejar '..' para subir un nivel
            if (segment === '..') {
                normalizedPath = normalizedPath.slice(0, -2);
                current = getDir(normalizedPath);
                continue;
            }
            // Manejar '.' para el directorio actual
            if (segment === '.') {
                continue;
            }
            // Verificar que el segmento existe y es un directorio
            if (!(segment in current) || typeof current[segment] === 'string') {
                return null;
            }
            current = current[segment];
        }
        return current;
    } catch (error) {
        console.error('Error accediendo al directorio:', path, error);
        return null;
    }
};