import { spawn } from 'child_process';
import { InsertUser, InsertFormSubmission, User, FormSubmission } from '@shared/schema';

interface CommandResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Executes a command in the Python TinyDB script
 */
async function executeCommand<T>(command: string, params: any = {}): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', ['server/tinydb_storage.py']);
    
    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`stderr: ${stderrData}`);
        return reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
      }
      
      try {
        const result = JSON.parse(stdoutData) as CommandResult<T>;
        if (!result.success) {
          return reject(new Error(result.error || 'Unknown error'));
        }
        resolve(result.data);
      } catch (err) {
        console.error('Error parsing Python output:', err);
        console.error('Output was:', stdoutData);
        reject(err);
      }
    });
    
    // Send the command data to the Python script
    pythonProcess.stdin.write(JSON.stringify({ command, params }));
    pythonProcess.stdin.end();
  });
}

// Export functions that match our IStorage interface
export async function getUser(id: number): Promise<User | undefined> {
  const result = await executeCommand<User>('get_user', { id });
  return result || undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await executeCommand<User>('get_user_by_username', { username });
  return result || undefined;
}

export async function createUser(user: InsertUser): Promise<User> {
  const result = await executeCommand<User>('create_user', { user });
  if (!result) {
    throw new Error('Failed to create user');
  }
  return result;
}

export async function createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
  const result = await executeCommand<FormSubmission>('create_form_submission', { submission });
  if (!result) {
    throw new Error('Failed to create form submission');
  }
  return result;
}

export async function getAllFormSubmissions(): Promise<FormSubmission[]> {
  const result = await executeCommand<FormSubmission[]>('get_all_form_submissions');
  if (!result) {
    return [];
  }
  return result;
}