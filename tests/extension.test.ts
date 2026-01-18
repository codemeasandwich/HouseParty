import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { createTestContext, createProjectDir, type TestContext } from './utils/tempDir';

// Import mock and set it up before importing source files
import {
    mockState,
    resetMockState,
    setWorkspaceFolders,
    triggerWorkspaceFolderChange,
    triggerFileChange,
    triggerFileCreate,
    mockVSCodeApi,
    createMockExtensionContext,
    type ExtensionContext
} from './mocks/vscode';
import { setVSCodeApi } from '../vscode-extension/src/vscodeApi';

// Set mock before importing components that use vscode
setVSCodeApi(mockVSCodeApi);

import { activate, deactivate } from '../vscode-extension/src/extension';

describe('Extension', () => {
    let ctx: TestContext;
    let extensionContext: ExtensionContext;
    let consoleSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        resetMockState();
        ctx = createTestContext();
        extensionContext = createMockExtensionContext();
        consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
        // Set HOME to use our test claude dir
        process.env.HOME = ctx.homeDir;
    });

    afterEach(() => {
        ctx.cleanup();
        consoleSpy.mockRestore();
    });

    describe('activate()', () => {
        test('creates StateManager and StatusBarManager', () => {
            activate(extensionContext);

            expect(mockState.statusBarItems.length).toBe(1);
        });

        test('registers commands', () => {
            activate(extensionContext);

            expect(mockState.registeredCommands.has('claudePersona.switch')).toBe(true);
            expect(mockState.registeredCommands.has('claudePersona.detect')).toBe(true);
        });

        test('sets up file watcher for state file', () => {
            activate(extensionContext);

            expect(mockState.fileWatchers.length).toBe(1);
        });

        test('refreshes status bar on state file change', () => {
            setWorkspaceFolders(undefined);
            activate(extensionContext);
            mockState.statusBarItems[0].text = 'initial';

            triggerFileChange(0);

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });

        test('refreshes status bar on state file create', () => {
            setWorkspaceFolders(undefined);
            activate(extensionContext);
            mockState.statusBarItems[0].text = 'initial';

            triggerFileCreate(0);

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });

        test('sets up workspace folder change listener', () => {
            activate(extensionContext);

            expect(mockState.workspaceFolderChangeListeners.length).toBe(1);
        });

        test('refreshes status bar on workspace folder change', () => {
            setWorkspaceFolders(undefined);
            activate(extensionContext);
            mockState.statusBarItems[0].text = 'initial';

            triggerWorkspaceFolderChange();

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });

        test('performs initial refresh', () => {
            setWorkspaceFolders(undefined);
            activate(extensionContext);

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });

        test('adds disposables to context subscriptions', () => {
            activate(extensionContext);

            // 2 commands + 1 workspace listener + 1 statusBarManager + 1 fileWatcher = 5
            expect(extensionContext.subscriptions.length).toBe(5);
        });

        test('logs activation message', () => {
            activate(extensionContext);

            expect(consoleSpy).toHaveBeenCalledWith('Claude Persona Switcher activated');
        });
    });

    describe('activate() with workspace folders', () => {
        test('shows correct persona for JS project on activation', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            activate(extensionContext);

            expect(mockState.statusBarItems[0].text).toBe('$(robot) TARS');
        });

        test('shows correct persona for Unity project on activation', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'unity');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            activate(extensionContext);

            expect(mockState.statusBarItems[0].text).toBe('$(device-camera-video) Red Queen');
        });

        test('shows No Folder when no workspace folders on activation', () => {
            setWorkspaceFolders(undefined);

            activate(extensionContext);

            expect(mockState.statusBarItems[0].text).toBe('$(question) No Folder');
        });
    });

    describe('deactivate()', () => {
        test('logs deactivation message', () => {
            deactivate();

            expect(consoleSpy).toHaveBeenCalledWith('Claude Persona Switcher deactivated');
        });

        test('does not throw', () => {
            expect(() => deactivate()).not.toThrow();
        });
    });

    describe('Full Extension Lifecycle', () => {
        test('activation and deactivation cycle completes without error', () => {
            const projectDir = createProjectDir(ctx.tempDir, 'js');
            setWorkspaceFolders([{ uri: { fsPath: projectDir }, name: 'test', index: 0 }]);

            // Activate
            activate(extensionContext);
            expect(mockState.statusBarItems[0].text).toBe('$(robot) TARS');

            // Deactivate
            deactivate();

            // Dispose subscriptions
            extensionContext.subscriptions.forEach(d => d.dispose());

            expect(mockState.statusBarItems[0].isDisposed).toBe(true);
        });
    });
});
