#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

async function checkCommand(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      logError(`Node.js version ${version} is too old. Please install Node.js 18 or higher.`);
      return false;
    }
    
    logSuccess(`Node.js ${version} detected`);
    return true;
  } catch (error) {
    logError('Node.js is not installed. Please install Node.js 18 or higher.');
    return false;
  }
}

async function checkDependencies(dir, name) {
  const nodeModulesPath = join(__dirname, dir, 'node_modules');
  
  if (!existsSync(nodeModulesPath)) {
    logWarning(`${name} dependencies not found. Installing...`);
    try {
      log(`Running: cd ${dir} && npm install`);
      const { stdout, stderr } = await execAsync(`cd ${dir} && npm install`, {
        cwd: join(__dirname, dir),
      });
      if (stderr && !stderr.includes('npm WARN')) {
        console.error(stderr);
      }
      logSuccess(`${name} dependencies installed`);
      return true;
    } catch (error) {
      logError(`Failed to install ${name} dependencies: ${error.message}`);
      return false;
    }
  } else {
    logSuccess(`${name} dependencies found`);
    return true;
  }
}

async function checkEnvFile() {
  const envPath = join(__dirname, 'backend', '.env');
  const envSamplePath = join(__dirname, 'backend', '.env.sample');
  
  if (!existsSync(envPath)) {
    logWarning('.env file not found. Creating from template...');
    
    if (existsSync(envSamplePath)) {
      try {
        const envContent = readFileSync(envSamplePath, 'utf-8');
        const fs = await import('fs/promises');
        await fs.writeFile(envPath, envContent);
        logSuccess('.env file created');
        logWarning('Please edit backend/.env and add your GEMINI_API_KEY');
      } catch (error) {
        logError(`Failed to create .env file: ${error.message}`);
        return false;
      }
    } else {
      // Create default .env file
      const defaultEnv = `PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_PATH=./chatbot.db
NODE_ENV=development
`;
      try {
        const fs = await import('fs/promises');
        await fs.writeFile(envPath, defaultEnv);
        logSuccess('.env file created');
        logWarning('Please edit backend/.env and add your GEMINI_API_KEY');
      } catch (error) {
        logError(`Failed to create .env file: ${error.message}`);
        return false;
      }
    }
  }
  
  // Check if API key is set
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    if (envContent.includes('your_gemini_api_key_here') || !envContent.includes('GEMINI_API_KEY=')) {
      logWarning('GEMINI_API_KEY not configured in backend/.env');
      logWarning('The app will start but API calls will fail until you add your API key');
    } else {
      logSuccess('.env file configured');
    }
  } catch (error) {
    logWarning('Could not read .env file');
  }
  
  return true;
}

async function checkDatabase() {
  const dbPath = join(__dirname, 'backend', 'chatbot.db');
  
  if (!existsSync(dbPath)) {
    logWarning('Database not found. Initializing...');
    try {
      const { stdout, stderr } = await execAsync('cd backend && npm run migrate', {
        cwd: join(__dirname, 'backend'),
      });
      if (stderr && !stderr.includes('npm WARN')) {
        console.error(stderr);
      }
      logSuccess('Database initialized');
      return true;
    } catch (error) {
      logError(`Failed to initialize database: ${error.message}`);
      return false;
    }
  } else {
    logSuccess('Database exists');
    return true;
  }
}

function startServer(name, command, cwd, port) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.cyan}Starting ${name}...${colors.reset}`);
    
    const [cmd, ...args] = command.split(' ');
    const server = spawn(cmd, args, {
      cwd: join(__dirname, cwd),
      stdio: 'inherit',
      shell: true,
    });
    
    let started = false;
    
    // Give server time to start
    setTimeout(() => {
      if (!started) {
        started = true;
        logSuccess(`${name} is starting on port ${port}`);
        log(`${colors.green}✓ ${name} running${colors.reset}\n`);
        resolve(server);
      }
    }, 2000);
    
    server.on('error', (error) => {
      if (!started) {
        started = true;
        logError(`Failed to start ${name}: ${error.message}`);
        reject(error);
      }
    });
    
    server.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        logError(`${name} exited with code ${code}`);
      }
    });
  });
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  AI Customer Support Chatbot - Setup & Runner', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Step 1: Check Node.js
  logStep('1', 'Checking Node.js installation...');
  if (!(await checkNodeVersion())) {
    process.exit(1);
  }
  
  // Step 2: Check npm
  logStep('2', 'Checking npm installation...');
  if (!(await checkCommand('npm'))) {
    logError('npm is not installed. Please install npm.');
    process.exit(1);
  }
  logSuccess('npm detected');
  
  // Step 3: Check and install dependencies
  logStep('3', 'Checking dependencies...');
  
  if (!(await checkDependencies('.', 'Root'))) {
    process.exit(1);
  }
  
  if (!(await checkDependencies('backend', 'Backend'))) {
    process.exit(1);
  }
  
  if (!(await checkDependencies('frontend', 'Frontend'))) {
    process.exit(1);
  }
  
  // Step 4: Check environment variables
  logStep('4', 'Checking environment configuration...');
  await checkEnvFile();
  
  // Step 5: Check database
  logStep('5', 'Checking database...');
  if (!(await checkDatabase())) {
    logWarning('Database check failed, but continuing...');
  }
  
  // Step 6: Start servers
  log('\n' + '='.repeat(60), 'bright');
  log('  Starting Application Servers', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  log(`${colors.yellow}Note:${colors.reset} Press Ctrl+C to stop both servers\n`);
  
  try {
    // Start backend
    const backend = await startServer('Backend', 'npm run dev', 'backend', 3001);
    
    // Wait a bit for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    const frontend = await startServer('Frontend', 'npm run dev', 'frontend', 5173);
    
    log('\n' + '='.repeat(60), 'green');
    log('  Application is running!', 'green');
    log('='.repeat(60), 'green');
    log(`\n${colors.cyan}Backend:${colors.reset} http://localhost:3001`);
    log(`${colors.cyan}Frontend:${colors.reset} http://localhost:5173`);
    log(`\n${colors.yellow}Open your browser and visit: ${colors.bright}http://localhost:5173${colors.reset}\n`);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n\nShutting down servers...', 'yellow');
      if (backend) backend.kill();
      if (frontend) frontend.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('\n\nShutting down servers...', 'yellow');
      if (backend) backend.kill();
      if (frontend) frontend.kill();
      process.exit(0);
    });
    
  } catch (error) {
    logError(`Failed to start servers: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

