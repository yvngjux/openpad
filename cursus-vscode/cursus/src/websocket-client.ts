import * as vscode from 'vscode';
import { SecurityManager, SecurityOptions } from './security-manager';

export interface CursusMessage {
    type: 'fileChange' | 'activeFileChange' | 'readFile' | 'writeFile' | 'editFile' | 'error' | 'editorState' | 'fileOperation';
    path?: string;
    content?: string;
    error?: string;
    operation?: FileOperation;
    state?: EditorState;
    cursor?: {
        line: number;
        character: number;
    };
    selection?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    hash?: string;
}

export interface FileOperation {
    type: 'read' | 'write' | 'edit';
    path: string;
    content?: string;
    cursor?: { line: number; character: number };
    selection?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
}

export interface EditorState {
    openFiles: string[];
    activeFile: string | null;
    visibleRanges: {
        file: string;
        ranges: { start: { line: number; character: number }; end: { line: number; character: number } }[];
    }[];
}

declare class WebSocket {
    constructor(url: string, options?: { headers?: Record<string, string> });
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    send(data: string): void;
    close(): void;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
    readonly readyState: number;
}

export class CursusWebSocketClient {
    private socket: WebSocket | null = null;
    private reconnectInterval: NodeJS.Timeout | null = null;
    private readonly url: string;
    private statusBarItem: vscode.StatusBarItem;
    private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
    private readonly securityManager: SecurityManager;

    constructor(private readonly token: string) {
        const config = vscode.workspace.getConfiguration('cursus');
        this.url = config.get<string>('serverUrl') || 'wss://your-cursus-backend.com';
        
        // Initialize security manager with configuration
        const securityOptions: SecurityOptions = {
            allowedPaths: config.get<string[]>('security.allowedPaths'),
            disallowedPaths: config.get<string[]>('security.disallowedPaths'),
            maxFileSize: config.get<number>('security.maxFileSize'),
            allowedOperations: config.get<('read' | 'write' | 'edit')[]>('security.allowedOperations'),
            requireConfirmation: config.get<boolean>('security.requireConfirmation')
        };
        this.securityManager = new SecurityManager(securityOptions);
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'cursus.toggleConnection';
        this.updateStatusBar();
        this.statusBarItem.show();
    }

    private updateStatusBar() {
        switch (this.connectionStatus) {
            case 'connected':
                this.statusBarItem.text = "$(check) Cursus Connected";
                this.statusBarItem.tooltip = "Click to disconnect from Cursus";
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'disconnected':
                this.statusBarItem.text = "$(circle-slash) Cursus Disconnected";
                this.statusBarItem.tooltip = "Click to connect to Cursus";
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'connecting':
                this.statusBarItem.text = "$(sync~spin) Connecting to Cursus...";
                this.statusBarItem.tooltip = "Attempting to connect to Cursus";
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'error':
                this.statusBarItem.text = "$(error) Cursus Error";
                this.statusBarItem.tooltip = "Connection error - click to retry";
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }
    }

    public async connect() {
        if (this.socket) {
            return;
        }

        // Validate token before connecting
        const isValid = await this.securityManager.validateToken(this.token);
        if (!isValid) {
            vscode.window.showErrorMessage('Invalid or expired token');
            return;
        }

        this.connectionStatus = 'connecting';
        this.updateStatusBar();

        try {
            this.socket = new WebSocket(this.url, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });

            this.socket.addEventListener('open', () => {
                this.connectionStatus = 'connected';
                this.updateStatusBar();
                vscode.window.showInformationMessage('Connected to Cursus');
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            });

            this.socket.addEventListener('message', (event) => this.handleMessage(event.data));

            this.socket.addEventListener('close', () => {
                this.connectionStatus = 'disconnected';
                this.updateStatusBar();
                vscode.window.showWarningMessage('Disconnected from Cursus. Attempting to reconnect...');
                this.socket = null;
                this.startReconnectInterval();
            });

            this.socket.addEventListener('error', () => {
                this.connectionStatus = 'error';
                this.updateStatusBar();
                vscode.window.showErrorMessage(`Cursus connection error occurred`);
                if (this.socket) {
                    this.socket.close();
                }
            });
        } catch (error) {
            this.connectionStatus = 'error';
            this.updateStatusBar();
            vscode.window.showErrorMessage(`Failed to connect to Cursus: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private startReconnectInterval() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                this.connect();
            }, 5000); // Try to reconnect every 5 seconds
        }
    }

    private async handleMessage(data: any) {
        try {
            const message: CursusMessage = JSON.parse(typeof data === 'string' ? data : data.toString());
            
            switch (message.type) {
                case 'fileOperation':
                    if (!message.operation) {
                        throw new Error('File operation details are required');
                    }
                    await this.handleFileOperation(message.operation);
                    break;

                case 'editorState':
                    await this.sendEditorState();
                    break;

                case 'readFile':
                    if (!message.path) {
                        throw new Error('File path is required for reading');
                    }

                    try {
                        const document = await vscode.workspace.openTextDocument(message.path);
                        this.send({
                            type: 'fileChange',
                            path: message.path,
                            content: document.getText()
                        });
                    } catch (error) {
                        throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                    break;

                case 'writeFile':
                    if (!message.path || !message.content) {
                        throw new Error('File path and content are required for writing');
                    }

                    try {
                        // Show progress indicator
                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "Writing file...",
                            cancellable: false
                        }, async () => {
                            const document = await vscode.workspace.openTextDocument(message.path!);
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(
                                document.uri,
                                new vscode.Range(0, 0, document.lineCount, 0),
                                message.content!
                            );
                            await vscode.workspace.applyEdit(edit);
                        });
                    } catch (error) {
                        throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            if (error instanceof Error) {
                this.send({
                    type: 'error',
                    error: error.message
                });
                vscode.window.showErrorMessage(`Cursus operation failed: ${error.message}`);
            }
        }
    }

    private async handleFileOperation(operation: FileOperation) {
        try {
            // Validate operation before proceeding
            const isAllowed = await this.securityManager.validateOperation(
                operation.type,
                operation.path,
                operation.content
            );

            if (!isAllowed) {
                throw new Error(`Operation ${operation.type} on ${operation.path} was denied`);
            }

            switch (operation.type) {
                case 'read':
                    await this.handleReadFile(operation.path);
                    break;
                case 'write':
                    if (!operation.content) {
                        throw new Error('Content is required for write operation');
                    }
                    await this.handleWriteFile(operation.path, operation.content);
                    break;
                case 'edit':
                    if (!operation.content) {
                        throw new Error('Content is required for edit operation');
                    }
                    await this.handleEditFile(operation.path, operation.content, operation.cursor, operation.selection);
                    break;
            }
        } catch (error) {
            throw new Error(`Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async handleReadFile(path: string) {
        try {
            const document = await vscode.workspace.openTextDocument(path);
            const content = document.getText();
            const hash = this.securityManager.hashContent(content);

            this.send({
                type: 'fileChange',
                path: path,
                content: content,
                hash: hash
            });
        } catch (error) {
            throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async handleWriteFile(path: string, content: string) {
        try {
            // Hash content before writing
            const hash = this.securityManager.hashContent(content);

            const document = await vscode.workspace.openTextDocument(path);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                content
            );
            await vscode.workspace.applyEdit(edit);

            // Verify content was written correctly
            const newContent = document.getText();
            if (!this.securityManager.validateContentHash(newContent, hash)) {
                throw new Error('Content verification failed after write');
            }
        } catch (error) {
            throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async handleEditFile(
        path: string, 
        content: string, 
        cursor?: { line: number; character: number },
        selection?: { start: { line: number; character: number }; end: { line: number; character: number } }
    ) {
        try {
            await this.handleWriteFile(path, content);
            
            if (cursor || selection) {
                const editor = await vscode.window.showTextDocument(vscode.Uri.file(path));
                
                if (selection) {
                    editor.selection = new vscode.Selection(
                        selection.start.line,
                        selection.start.character,
                        selection.end.line,
                        selection.end.character
                    );
                } else if (cursor) {
                    const position = new vscode.Position(cursor.line, cursor.character);
                    editor.selection = new vscode.Selection(position, position);
                }
            }
        } catch (error) {
            throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async sendEditorState() {
        const state: EditorState = {
            openFiles: vscode.workspace.textDocuments.map(doc => doc.uri.fsPath),
            activeFile: vscode.window.activeTextEditor?.document.uri.fsPath || null,
            visibleRanges: vscode.window.visibleTextEditors.map(editor => ({
                file: editor.document.uri.fsPath,
                ranges: editor.visibleRanges.map(range => ({
                    start: { line: range.start.line, character: range.start.character },
                    end: { line: range.end.line, character: range.end.character }
                }))
            }))
        };

        this.send({
            type: 'editorState',
            state
        });
    }

    public send(message: CursusMessage) {
        if (this.socket?.readyState === 1) { // WebSocket.OPEN
            try {
                this.socket.send(JSON.stringify(message));
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to send message to Cursus: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            vscode.window.showWarningMessage('Cannot send message: Not connected to Cursus');
        }
    }

    public disconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connectionStatus = 'disconnected';
        this.updateStatusBar();
    }

    public dispose() {
        this.disconnect();
        this.statusBarItem.dispose();
    }
} 