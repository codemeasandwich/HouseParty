import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, createProjectDir, type TestContext } from './utils/tempDir';
import { writeFileSync } from 'fs';

// Import mock and set it up before importing source files
import {
    mockState,
    resetMockState,
    setWorkspaceFolders,
    mockVSCodeApi
} from './mocks/vscode';
import { setVSCodeApi } from '../vscode-extension/src/vscodeApi';

// Set mock before importing components that use vscode
setVSCodeApi(mockVSCodeApi);

import { StateManager } from '../vscode-extension/src/stateManager';
import { StatusBarManager } from '../vscode-extension/src/statusBar';

describe('StatusBarManager', () => {
    let ctx: TestContext;
    let stateManager: StateManager;

    beforeEach(() => {
        resetMockState();
        ctx = createTestContext();
        stateManager = new StateManager({ claudeDir: ctx.claudeDir });
    });

    afterEach(() => {
        ctx.cleanup();
    });

    describe('Constructor', () => {
        test('creates status bar item on right side', () => {
            new StatusBarManager(stateManager);

            expect(mockState.statusBarItems.length).toBe(1);
        });

        test('sets command to claudePersona.switch', () => {
            new StatusBarManager(stateManager);

            expect(mockState.statusBarItems[0].command).toBe('claudePersona.switch');
        });

        test('shows status bar item immediately', () => {
            new StatusBarManager(stateManager);

            expect(mockState.statusBarItems[0].isVisible).toBe(true);
        });
    });

    describe('refresh() - No Folder', () => {
        test('shows "No Folder" when no workspace folders', () => {
            setWorkspaceFolders(undefined);
            const statusBar = new StatusBarManager(stateManager);

            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });

        test('sets tooltip to open folder message', () => {
            setWorkspaceFolders(undefined);
            const statusBar = new StatusBarManager(stateManager);

            statusBar.refresh();

            expect(mockState.statusBarItems[0].tooltip).toBe('Open a folder to use Claude personas');
        });

        test('shows "No Folder" when workspace folders is empty array', () => {
            setWorkspaceFolders([]);
            const statusBar = new StatusBarManager(stateManager);

            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });
    });

    describe('refresh() - With Folder', () => {
        test('shows TARS icon for JavaScript project', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(robot) TARS');
        });

        test('shows Red Queen icon for Unity project', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'unity');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(device-camera-video) Red Queen');
        });

        test('shows STEM icon for empty project', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(book) STEM');
        });

        test('uses saved persona over auto-detect', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            stateManager.setPersona(projectDir, 'stem');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(book) STEM');
        });

        test('sets tooltip with persona name', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].tooltip).toBe('Claude Persona: TARS\nClick to switch');
        });
    });

    describe('refresh() - Unknown Persona', () => {
        test('shows fallback for unknown persona', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            writeFileSync(ctx.stateFile, JSON.stringify({
                version: 1,
                default: 'stem',
                folders: {
                    [projectDir]: { persona: 'custom-persona', lastUsed: '2024-01-01' }
                }
            }));
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].text).toBe('$(question) custom-persona');
        });

        test('sets tooltip for unknown persona', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'empty');
            writeFileSync(ctx.stateFile, JSON.stringify({
                version: 1,
                default: 'stem',
                folders: {
                    [projectDir]: { persona: 'custom-persona', lastUsed: '2024-01-01' }
                }
            }));
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            const statusBar = new StatusBarManager(stateManager);
            statusBar.refresh();

            expect(mockState.statusBarItems[0].tooltip).toBe('Claude Persona: custom-persona\nClick to switch');
        });
    });

    describe('dispose()', () => {
        test('disposes status bar item', () => {
            const statusBar = new StatusBarManager(stateManager);
            expect(mockState.statusBarItems[0].isDisposed).toBe(false);

            statusBar.dispose();

            expect(mockState.statusBarItems[0].isDisposed).toBe(true);
        });
    });
});
