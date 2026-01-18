// VSCode API Mock for testing extension code outside of VSCode runtime
import type { VSCodeApi } from '../../vscode-extension/src/vscodeApi';

export enum StatusBarAlignment {
    Left = 1,
    Right = 2
}

export interface Disposable {
    dispose(): void;
}

export interface StatusBarItem extends Disposable {
    text: string;
    tooltip: string | undefined;
    command: string | undefined;
    show(): void;
    hide(): void;
}

export interface QuickPickItem {
    label: string;
    description?: string;
    [key: string]: unknown;
}

export interface FileSystemWatcher extends Disposable {
    onDidChange: (listener: () => void) => Disposable;
    onDidCreate: (listener: () => void) => Disposable;
    onDidDelete: (listener: () => void) => Disposable;
}

export interface WorkspaceFolder {
    uri: { fsPath: string };
    name: string;
    index: number;
}

export interface ExtensionContext {
    subscriptions: Disposable[];
}

// Mock state for assertions
export const mockState = {
    statusBarItems: [] as MockStatusBarItem[],
    registeredCommands: new Map<string, (...args: unknown[]) => unknown>(),
    shownMessages: [] as { type: 'info' | 'warning' | 'error'; message: string }[],
    quickPickResult: undefined as QuickPickItem | undefined,
    workspaceFolders: undefined as WorkspaceFolder[] | undefined,
    fileWatchers: [] as MockFileSystemWatcher[],
    workspaceFolderChangeListeners: [] as (() => void)[]
};

export function resetMockState(): void {
    mockState.statusBarItems = [];
    mockState.registeredCommands.clear();
    mockState.shownMessages = [];
    mockState.quickPickResult = undefined;
    mockState.workspaceFolders = undefined;
    mockState.fileWatchers = [];
    mockState.workspaceFolderChangeListeners = [];
}

class MockStatusBarItem implements StatusBarItem {
    text = '';
    tooltip: string | undefined = undefined;
    command: string | undefined = undefined;
    private _visible = false;
    private _disposed = false;

    show(): void {
        this._visible = true;
    }

    hide(): void {
        this._visible = false;
    }

    dispose(): void {
        this._disposed = true;
        this._visible = false;
    }

    get isVisible(): boolean {
        return this._visible;
    }

    get isDisposed(): boolean {
        return this._disposed;
    }
}

class MockFileSystemWatcher implements FileSystemWatcher {
    private changeListeners: (() => void)[] = [];
    private createListeners: (() => void)[] = [];
    private _disposed = false;

    onDidChange(listener: () => void): Disposable {
        this.changeListeners.push(listener);
        return { dispose: () => { this.changeListeners = this.changeListeners.filter(l => l !== listener); } };
    }

    onDidCreate(listener: () => void): Disposable {
        this.createListeners.push(listener);
        return { dispose: () => { this.createListeners = this.createListeners.filter(l => l !== listener); } };
    }

    onDidDelete(listener: () => void): Disposable {
        return { dispose: () => {} };
    }

    dispose(): void {
        this._disposed = true;
    }

    triggerChange(): void {
        this.changeListeners.forEach(l => l());
    }

    triggerCreate(): void {
        this.createListeners.forEach(l => l());
    }

    get isDisposed(): boolean {
        return this._disposed;
    }
}

export const window = {
    createStatusBarItem(_alignment?: StatusBarAlignment, _priority?: number): StatusBarItem {
        const item = new MockStatusBarItem();
        mockState.statusBarItems.push(item);
        return item;
    },

    showInformationMessage(message: string): Thenable<string | undefined> {
        mockState.shownMessages.push({ type: 'info', message });
        return Promise.resolve(undefined);
    },

    showWarningMessage(message: string): Thenable<string | undefined> {
        mockState.shownMessages.push({ type: 'warning', message });
        return Promise.resolve(undefined);
    },

    showQuickPick<T extends QuickPickItem>(items: T[], _options?: { placeHolder?: string }): Thenable<T | undefined> {
        return Promise.resolve(mockState.quickPickResult as T | undefined);
    }
};

export const workspace = {
    get workspaceFolders(): WorkspaceFolder[] | undefined {
        return mockState.workspaceFolders;
    },

    createFileSystemWatcher(_globPattern: string): FileSystemWatcher {
        const watcher = new MockFileSystemWatcher();
        mockState.fileWatchers.push(watcher);
        return watcher;
    },

    onDidChangeWorkspaceFolders(listener: () => void): Disposable {
        mockState.workspaceFolderChangeListeners.push(listener);
        return { dispose: () => {
            mockState.workspaceFolderChangeListeners = mockState.workspaceFolderChangeListeners.filter(l => l !== listener);
        }};
    }
};

export const commands = {
    registerCommand(command: string, callback: (...args: unknown[]) => unknown): Disposable {
        mockState.registeredCommands.set(command, callback);
        return { dispose: () => { mockState.registeredCommands.delete(command); } };
    },

    executeCommand(command: string, ...args: unknown[]): Thenable<unknown> {
        const callback = mockState.registeredCommands.get(command);
        if (callback) {
            return Promise.resolve(callback(...args));
        }
        return Promise.reject(new Error(`Command ${command} not found`));
    }
};

// Create the mock VSCode API that implements VSCodeApi interface
export const mockVSCodeApi: VSCodeApi = {
    window,
    workspace,
    commands,
    StatusBarAlignment
};

// Helper to create mock extension context
export function createMockExtensionContext(): ExtensionContext {
    return {
        subscriptions: []
    };
}

// Helper to set workspace folders for testing
export function setWorkspaceFolders(folders: WorkspaceFolder[] | undefined): void {
    mockState.workspaceFolders = folders;
}

// Helper to set quick pick result for testing
export function setQuickPickResult(result: QuickPickItem | undefined): void {
    mockState.quickPickResult = result;
}

// Helper to trigger workspace folder change
export function triggerWorkspaceFolderChange(): void {
    mockState.workspaceFolderChangeListeners.forEach(l => l());
}

// Helper to trigger file watcher events
export function triggerFileChange(watcherIndex = 0): void {
    mockState.fileWatchers[watcherIndex]?.triggerChange();
}

export function triggerFileCreate(watcherIndex = 0): void {
    mockState.fileWatchers[watcherIndex]?.triggerCreate();
}
