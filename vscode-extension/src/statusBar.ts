import { StateManager } from './stateManager';
import { getVSCodeApi, type StatusBarItem, type Disposable } from './vscodeApi';

export class StatusBarManager implements Disposable {
    private statusBarItem: StatusBarItem;
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        const vscode = getVSCodeApi();
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'claudePersona.switch';
        this.statusBarItem.show();
    }

    refresh(): void {
        const vscode = getVSCodeApi();
        const folder = vscode.workspace.workspaceFolders?.[0];

        if (!folder) {
            this.statusBarItem.text = '$(question) No Folder';
            this.statusBarItem.tooltip = 'Open a folder to use Claude personas';
            return;
        }

        const persona = this.stateManager.getPersona(folder.uri.fsPath);
        const info = this.stateManager.getPersonaInfo(persona);

        if (info) {
            this.statusBarItem.text = `${info.icon} ${info.displayName}`;
            this.statusBarItem.tooltip = `Claude Persona: ${info.displayName}\nClick to switch`;
        } else {
            this.statusBarItem.text = `$(question) ${persona}`;
            this.statusBarItem.tooltip = `Claude Persona: ${persona}\nClick to switch`;
        }
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
