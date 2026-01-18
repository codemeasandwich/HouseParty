import { StateManager } from './stateManager';
import { StatusBarManager } from './statusBar';
import { registerCommands } from './commands';
import { getVSCodeApi, type ExtensionContext, type FileSystemWatcher } from './vscodeApi';

let statusBarManager: StatusBarManager;
let stateManager: StateManager;
let stateFileWatcher: FileSystemWatcher;

export function activate(context: ExtensionContext) {
    const vscode = getVSCodeApi();

    stateManager = new StateManager();
    statusBarManager = new StatusBarManager(stateManager);

    // Register commands
    registerCommands(context, stateManager, statusBarManager);

    // Watch for state file changes
    const stateFilePath = stateManager.getStateFilePath();
    stateFileWatcher = vscode.workspace.createFileSystemWatcher(stateFilePath);
    stateFileWatcher.onDidChange(() => statusBarManager.refresh());
    stateFileWatcher.onDidCreate(() => statusBarManager.refresh());

    // Watch for workspace folder changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            statusBarManager.refresh();
        })
    );

    // Initial refresh
    statusBarManager.refresh();

    context.subscriptions.push(statusBarManager, stateFileWatcher);

    console.log('Claude Persona Switcher activated');
}

export function deactivate() {
    console.log('Claude Persona Switcher deactivated');
}
