import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PersonaState {
    version: number;
    default: string;
    folders: {
        [path: string]: {
            persona: string;
            lastUsed: string;
        };
    };
}

export interface Persona {
    name: string;
    displayName: string;
    icon: string;
}

export const PERSONAS: Persona[] = [
    { name: 'tars', displayName: 'TARS', icon: '$(robot)' },
    { name: 'red-queen', displayName: 'Red Queen', icon: '$(device-camera-video)' },
    { name: 'stem', displayName: 'STEM', icon: '$(book)' }
];

export interface StateManagerConfig {
    claudeDir?: string;
}

export class StateManager {
    private stateFilePath: string;
    private skillsDir: string;

    constructor(config?: StateManagerConfig) {
        const claudeDir = config?.claudeDir || path.join(os.homedir(), '.claude');
        this.stateFilePath = path.join(claudeDir, 'persona-state.json');
        this.skillsDir = path.join(claudeDir, 'skills');
    }

    getStateFilePath(): string {
        return this.stateFilePath;
    }

    private readState(): PersonaState {
        try {
            const content = fs.readFileSync(this.stateFilePath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return { version: 1, default: 'stem', folders: {} };
        }
    }

    private writeState(state: PersonaState): void {
        fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
    }

    getPersona(folderPath: string): string {
        const state = this.readState();
        const folderState = state.folders[folderPath];

        if (folderState?.persona) {
            return folderState.persona;
        }

        // Auto-detect based on files
        return this.detectPersona(folderPath, state.default);
    }

    detectPersona(folderPath: string, defaultPersona: string = 'stem'): string {
        try {
            const files = fs.readdirSync(folderPath);

            // Check for JS/TS project
            if (files.includes('package.json') || files.includes('bun.lockb')) {
                return 'tars';
            }

            // Check for Unity/Unreal project
            if (files.includes('ProjectSettings') ||
                files.some(f => f.endsWith('.unity') || f.endsWith('.csproj') || f.endsWith('.uproject'))) {
                return 'red-queen';
            }
        } catch {
            // Ignore read errors
        }

        return defaultPersona;
    }

    setPersona(folderPath: string, persona: string): void {
        const state = this.readState();
        state.folders[folderPath] = {
            persona,
            lastUsed: new Date().toISOString()
        };
        this.writeState(state);
    }

    getPersonaInfo(name: string): Persona | undefined {
        return PERSONAS.find(p => p.name === name);
    }

    listPersonas(): Persona[] {
        return PERSONAS;
    }
}
