import { StateManager, PERSONAS } from './stateManager';
import { StatusBarManager } from './statusBar';
import { getVSCodeApi, type ExtensionContext } from './vscodeApi';

export function registerCommands(
    context: ExtensionContext,
    stateManager: StateManager,
    statusBarManager: StatusBarManager
): void {
    const vscode = getVSCodeApi();

    // Switch persona command
    context.subscriptions.push(
        vscode.commands.registerCommand('claudePersona.switch', async () => {
            const folder = vscode.workspace.workspaceFolders?.[0];

            if (!folder) {
                vscode.window.showWarningMessage('Open a folder to use Claude personas');
                return;
            }

            const currentPersona = stateManager.getPersona(folder.uri.fsPath);

            const items = PERSONAS.map(p => ({
                label: `${p.icon} ${p.displayName}`,
                description: p.name === currentPersona ? '(current)' : '',
                persona: p.name
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a persona for this folder'
            });

            if (selected) {
                stateManager.setPersona(folder.uri.fsPath, (selected as { persona: string }).persona);
                statusBarManager.refresh();
                vscode.window.showInformationMessage(
                    `Switched to ${selected.label.replace(/\$\([^)]+\)\s*/, '')} persona. Start a new conversation to use it.`
                );
            }
        })
    );

    // Auto-detect persona command
    context.subscriptions.push(
        vscode.commands.registerCommand('claudePersona.detect', async () => {
            const folder = vscode.workspace.workspaceFolders?.[0];

            if (!folder) {
                vscode.window.showWarningMessage('Open a folder to detect persona');
                return;
            }

            const detected = stateManager.detectPersona(folder.uri.fsPath);
            stateManager.setPersona(folder.uri.fsPath, detected);
            statusBarManager.refresh();

            const info = stateManager.getPersonaInfo(detected);
            vscode.window.showInformationMessage(
                `Auto-detected: ${info?.displayName || detected}`
            );
        })
    );
}
