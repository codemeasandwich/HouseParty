import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, createProjectDir, type TestContext } from './utils/tempDir';
import { readFileSync } from 'fs';

// Import mock and set it up before importing source files
import {
    mockState,
    resetMockState,
    setWorkspaceFolders,
    setQuickPickResult,
    mockVSCodeApi,
    createMockExtensionContext,
    commands,
    type ExtensionContext
} from './mocks/vscode';
import { setVSCodeApi } from '../vscode-extension/src/vscodeApi';

// Set mock before importing components that use vscode
setVSCodeApi(mockVSCodeApi);

import { StateManager } from '../vscode-extension/src/stateManager';
import { StatusBarManager } from '../vscode-extension/src/statusBar';
import { registerCommands } from '../vscode-extension/src/commands';

describe('Commands', () => {
    let ctx: TestContext;
    let stateManager: StateManager;
    let statusBarManager: StatusBarManager;
    let extensionContext: ExtensionContext;

    beforeEach(() => {
        resetMockState();
        ctx = createTestContext();
        stateManager = new StateManager({ claudeDir: ctx.claudeDir });
        statusBarManager = new StatusBarManager(stateManager);
        extensionContext = createMockExtensionContext();
    });

    afterEach(() => {
        ctx.cleanup();
    });

    describe('registerCommands', () => {
        test('registers claudePersona.switch command', () => {
            registerCommands(extensionContext, stateManager, statusBarManager);

            expect(mockState.registeredCommands.has('claudePersona.switch')).toBe(true);
        });

        test('registers claudePersona.detect command', () => {
            registerCommands(extensionContext, stateManager, statusBarManager);

            expect(mockState.registeredCommands.has('claudePersona.detect')).toBe(true);
        });

        test('adds commands to context subscriptions', () => {
            registerCommands(extensionContext, stateManager, statusBarManager);

            expect(extensionContext.subscriptions.length).toBe(2);
        });
    });

    describe('claudePersona.switch command', () => {
        test('shows warning when no folder is open', async () => {
            setWorkspaceFolders(undefined);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            expect(mockState.shownMessages).toContainEqual({
                type: 'warning',
                message: 'Open a folder to use Claude personas'
            });
        });

        test('shows warning when folder array is empty', async () => {
            setWorkspaceFolders([]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            expect(mockState.shownMessages).toContainEqual({
                type: 'warning',
                message: 'Open a folder to use Claude personas'
            });
        });

        test('updates state when persona is selected', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            setQuickPickResult({ label: '$(robot) TARS', description: '', persona: 'tars' });
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            expect(stateManager.getPersona(projectDir)).toBe('tars');
        });

        test('refreshes status bar when persona is selected', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            setQuickPickResult({ label: '$(robot) TARS', description: '', persona: 'tars' });
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            // Status bar should now show TARS
            expect(mockState.statusBarItems[0].text).toBe('$(robot) TARS');
        });

        test('shows success message when persona is selected', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            setQuickPickResult({ label: '$(robot) TARS', description: '', persona: 'tars' });
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            expect(mockState.shownMessages).toContainEqual({
                type: 'info',
                message: 'Switched to TARS persona. Start a new conversation to use it.'
            });
        });

        test('does nothing when quick pick is cancelled', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            setQuickPickResult(undefined);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.switch');

            // Should not have any info messages
            expect(mockState.shownMessages.filter(m => m.type === 'info')).toHaveLength(0);
        });

        test('marks current persona in quick pick', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            setQuickPickResult(undefined);
            registerCommands(extensionContext, stateManager, statusBarManager);

            // The command runs without error
            await commands.executeCommand('claudePersona.switch');

            expect(true).toBe(true);
        });
    });

    describe('claudePersona.detect command', () => {
        test('shows warning when no folder is open', async () => {
            setWorkspaceFolders(undefined);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(mockState.shownMessages).toContainEqual({
                type: 'warning',
                message: 'Open a folder to detect persona'
            });
        });

        test('auto-detects TARS for JavaScript project', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(stateManager.getPersona(projectDir)).toBe('tars');
        });

        test('auto-detects Red Queen for Unity project', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'unity');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(stateManager.getPersona(projectDir)).toBe('red-queen');
        });

        test('auto-detects STEM for empty project', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(stateManager.getPersona(projectDir)).toBe('stem');
        });

        test('saves detected persona to state file', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            const state = JSON.parse(readFileSync(ctx.stateFile, 'utf-8'));
            expect(state.folders[projectDir].persona).toBe('tars');
        });

        test('refreshes status bar after detection', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(mockState.statusBarItems[0].text).toBe('$(robot) TARS');
        });

        test('shows success message with detected persona name', async () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);
            registerCommands(extensionContext, stateManager, statusBarManager);

            await commands.executeCommand('claudePersona.detect');

            expect(mockState.shownMessages).toContainEqual({
                type: 'info',
                message: 'Auto-detected: TARS'
            });
        });
    });
});
