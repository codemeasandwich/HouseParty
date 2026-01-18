// VSCode API abstraction for testability
// This module provides interfaces that can be implemented by either real vscode or mocks

export interface StatusBarItem {
    text: string;
    tooltip: string | undefined;
    command: string | undefined;
    show(): void;
    hide(): void;
    dispose(): void;
}

export interface QuickPickItem {
    label: string;
    description?: string;
    [key: string]: unknown;
}

export interface FileSystemWatcher {
    onDidChange: (listener: () => void) => Disposable;
    onDidCreate: (listener: () => void) => Disposable;
    onDidDelete: (listener: () => void) => Disposable;
    dispose(): void;
}

export interface WorkspaceFolder {
    uri: { fsPath: string };
    name: string;
    index: number;
}

export interface Disposable {
    dispose(): void;
}

export interface ExtensionContext {
    subscriptions: Disposable[];
}

export enum StatusBarAlignment {
    Left = 1,
    Right = 2
}

export interface VSCodeWindow {
    createStatusBarItem(alignment?: StatusBarAlignment, priority?: number): StatusBarItem;
    showInformationMessage(message: string): Thenable<string | undefined>;
    showWarningMessage(message: string): Thenable<string | undefined>;
    showQuickPick<T extends QuickPickItem>(items: T[], options?: { placeHolder?: string }): Thenable<T | undefined>;
}

export interface VSCodeWorkspace {
    readonly workspaceFolders: WorkspaceFolder[] | undefined;
    createFileSystemWatcher(globPattern: string): FileSystemWatcher;
    onDidChangeWorkspaceFolders(listener: () => void): Disposable;
}

export interface VSCodeCommands {
    registerCommand(command: string, callback: (...args: unknown[]) => unknown): Disposable;
}

export interface VSCodeApi {
    window: VSCodeWindow;
    workspace: VSCodeWorkspace;
    commands: VSCodeCommands;
    StatusBarAlignment: typeof StatusBarAlignment;
}

// Default implementation that uses real vscode
let _vscodeApi: VSCodeApi | null = null;

export function getVSCodeApi(): VSCodeApi {
    if (_vscodeApi) {
        return _vscodeApi;
    }
    // Lazy load real vscode only when needed
    const vscode = require('vscode');
    return {
        window: vscode.window,
        workspace: vscode.workspace,
        commands: vscode.commands,
        StatusBarAlignment: vscode.StatusBarAlignment
    };
}

export function setVSCodeApi(api: VSCodeApi | null): void {
    _vscodeApi = api;
}
