// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CursusWebSocketClient } from './websocket-client';

let cursusClient: CursusWebSocketClient | null = null;

class FileAccessManager {
	private readonly fileSubscriptions = new Map<string, vscode.Disposable[]>();

	constructor(private readonly client: CursusWebSocketClient) {}

	public trackFile(uri: vscode.Uri) {
		if (this.fileSubscriptions.has(uri.fsPath)) {
			return;
		}

		const subscriptions: vscode.Disposable[] = [];

		// Watch for file content changes
		subscriptions.push(
			vscode.workspace.onDidChangeTextDocument(event => {
				if (event.document.uri.fsPath === uri.fsPath) {
					this.client.send({
						type: 'fileChange',
						path: uri.fsPath,
						content: event.document.getText()
					});
				}
			})
		);

		// Watch for file deletion
		subscriptions.push(
			vscode.workspace.onDidDeleteFiles(event => {
				if (event.files.some(file => file.fsPath === uri.fsPath)) {
					this.stopTrackingFile(uri);
				}
			})
		);

		this.fileSubscriptions.set(uri.fsPath, subscriptions);
	}

	public stopTrackingFile(uri: vscode.Uri) {
		const subscriptions = this.fileSubscriptions.get(uri.fsPath);
		if (subscriptions) {
			subscriptions.forEach(disposable => disposable.dispose());
			this.fileSubscriptions.delete(uri.fsPath);
		}
	}

	public dispose() {
		for (const subscriptions of this.fileSubscriptions.values()) {
			subscriptions.forEach(disposable => disposable.dispose());
		}
		this.fileSubscriptions.clear();
	}
}

class EditorStateManager {
	private readonly eventDisposables: vscode.Disposable[] = [];

	constructor(
		private readonly client: CursusWebSocketClient,
		private readonly fileManager: FileAccessManager
	) {
		this.initializeEventHandlers();
	}

	private initializeEventHandlers() {
		// Editor focus and visibility
		this.eventDisposables.push(
			vscode.window.onDidChangeVisibleTextEditors(editors => {
				this.handleVisibleEditorsChange(editors);
			})
		);

		// Editor view changes (scrolling, etc.)
		this.eventDisposables.push(
			vscode.window.onDidChangeTextEditorVisibleRanges(event => {
				this.handleVisibleRangesChange(event);
			})
		);

		// Workspace changes
		this.eventDisposables.push(
			vscode.workspace.onDidChangeWorkspaceFolders(event => {
				this.handleWorkspaceChange(event);
			})
		);

		// File operations
		this.eventDisposables.push(
			vscode.workspace.onDidCreateFiles(event => {
				this.handleFilesCreated(event);
			}),
			vscode.workspace.onDidRenameFiles(event => {
				this.handleFilesRenamed(event);
			}),
			vscode.workspace.onDidDeleteFiles(event => {
				this.handleFilesDeleted(event);
			})
		);

		// Configuration changes
		this.eventDisposables.push(
			vscode.workspace.onDidChangeConfiguration(event => {
				if (event.affectsConfiguration('cursus')) {
					this.handleConfigurationChange();
				}
			})
		);
	}

	private handleVisibleEditorsChange(editors: readonly vscode.TextEditor[]) {
		this.client.send({
			type: 'editorState',
			state: {
				openFiles: editors.map(editor => editor.document.uri.fsPath),
				activeFile: vscode.window.activeTextEditor?.document.uri.fsPath || null,
				visibleRanges: editors.map(editor => ({
					file: editor.document.uri.fsPath,
					ranges: editor.visibleRanges.map(range => ({
						start: { line: range.start.line, character: range.start.character },
						end: { line: range.end.line, character: range.end.character }
					}))
				}))
			}
		});
	}

	private handleVisibleRangesChange(event: vscode.TextEditorVisibleRangesChangeEvent) {
		this.client.send({
			type: 'editorState',
			state: {
				openFiles: [event.textEditor.document.uri.fsPath],
				activeFile: event.textEditor.document.uri.fsPath,
				visibleRanges: [{
					file: event.textEditor.document.uri.fsPath,
					ranges: event.visibleRanges.map(range => ({
						start: { line: range.start.line, character: range.start.character },
						end: { line: range.end.line, character: range.end.character }
					}))
				}]
			}
		});
	}

	private handleWorkspaceChange(event: vscode.WorkspaceFoldersChangeEvent) {
		// Handle workspace folders being added or removed
		event.added.forEach(folder => {
			vscode.workspace.textDocuments
				.filter(doc => doc.uri.fsPath.startsWith(folder.uri.fsPath))
				.forEach(doc => this.fileManager.trackFile(doc.uri));
		});

		event.removed.forEach(folder => {
			vscode.workspace.textDocuments
				.filter(doc => doc.uri.fsPath.startsWith(folder.uri.fsPath))
				.forEach(doc => this.fileManager.stopTrackingFile(doc.uri));
		});
	}

	private handleFilesCreated(event: vscode.FileCreateEvent) {
		event.files.forEach(file => {
			this.client.send({
				type: 'fileChange',
				path: file.fsPath,
				content: '' // New file is empty
			});
		});
	}

	private handleFilesRenamed(event: vscode.FileRenameEvent) {
		event.files.forEach(({ oldUri, newUri }) => {
			this.fileManager.stopTrackingFile(oldUri);
			this.fileManager.trackFile(newUri);
		});
	}

	private handleFilesDeleted(event: vscode.FileDeleteEvent) {
		event.files.forEach(file => {
			this.fileManager.stopTrackingFile(file);
		});
	}

	private handleConfigurationChange() {
		const config = vscode.workspace.getConfiguration('cursus');
		const autoConnect = config.get<boolean>('autoConnect');
		
		if (autoConnect && !this.client) {
			const token = config.get<string>('token');
			if (token) {
				this.client.connect();
			}
		}
	}

	public dispose() {
		this.eventDisposables.forEach(disposable => disposable.dispose());
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('Cursus extension is now active!');

	// Get the token from configuration or ask user to input it
	const config = vscode.workspace.getConfiguration('cursus');
	let token = config.get<string>('token');

	if (!token) {
		token = await vscode.window.showInputBox({
			prompt: 'Please enter your Cursus authentication token',
			ignoreFocusOut: true,
			password: true, // Hide token input
			placeHolder: 'Enter your Cursus token...',
			validateInput: (value) => {
				return value && value.length > 0 ? null : 'Token is required';
			}
		});

		if (!token) {
			vscode.window.showErrorMessage('Cursus token is required to activate the extension');
			return;
		}

		// Save the token in configuration
		await config.update('token', token, true);
	}

	// Initialize WebSocket client
	cursusClient = new CursusWebSocketClient(token);
	const fileManager = new FileAccessManager(cursusClient);
	const editorManager = new EditorStateManager(cursusClient, fileManager);

	// Track currently open files
	vscode.workspace.textDocuments.forEach(document => {
		fileManager.trackFile(document.uri);
	});

	// Watch for newly opened files
	const fileOpenDisposable = vscode.workspace.onDidOpenTextDocument(document => {
		fileManager.trackFile(document.uri);
	});

	// Watch for file closures
	const fileCloseDisposable = vscode.workspace.onDidCloseTextDocument(document => {
		fileManager.stopTrackingFile(document.uri);
	});

	// Watch for active editor changes
	const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor && cursusClient) {
			cursusClient.send({
				type: 'activeFileChange',
				path: editor.document.uri.fsPath,
				content: editor.document.getText(),
				cursor: {
					line: editor.selection.active.line,
					character: editor.selection.active.character
				},
				selection: editor.selection.isEmpty ? undefined : {
					start: {
						line: editor.selection.start.line,
						character: editor.selection.start.character
					},
					end: {
						line: editor.selection.end.line,
						character: editor.selection.end.character
					}
				}
			});
		}
	});

	// Watch for selection changes
	const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
		if (cursusClient) {
			cursusClient.send({
				type: 'activeFileChange',
				path: event.textEditor.document.uri.fsPath,
				cursor: {
					line: event.selections[0].active.line,
					character: event.selections[0].active.character
				},
				selection: event.selections[0].isEmpty ? undefined : {
					start: {
						line: event.selections[0].start.line,
						character: event.selections[0].start.character
					},
					end: {
						line: event.selections[0].end.line,
						character: event.selections[0].end.character
					}
				}
			});
		}
	});

	// Register commands
	const connectCommand = vscode.commands.registerCommand('cursus.connect', () => {
		cursusClient?.connect();
	});

	const disconnectCommand = vscode.commands.registerCommand('cursus.disconnect', () => {
		cursusClient?.disconnect();
		cursusClient = null;
		vscode.window.showInformationMessage('Disconnected from Cursus');
	});

	const toggleConnectionCommand = vscode.commands.registerCommand('cursus.toggleConnection', () => {
		if (cursusClient) {
			cursusClient.disconnect();
			cursusClient = null;
			vscode.window.showInformationMessage('Disconnected from Cursus');
		} else {
			const token = config.get<string>('token');
			if (token) {
				cursusClient = new CursusWebSocketClient(token);
				cursusClient.connect();
			} else {
				vscode.window.showErrorMessage('Cursus token not found. Please set it in settings.');
			}
		}
	});

	// Add all disposables to context
	context.subscriptions.push(
		fileOpenDisposable,
		fileCloseDisposable,
		activeEditorDisposable,
		selectionChangeDisposable,
		fileManager,
		editorManager,
		connectCommand,
		disconnectCommand,
		toggleConnectionCommand
	);

	// Add client to disposables for cleanup
	if (cursusClient) {
		context.subscriptions.push(cursusClient);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (cursusClient) {
		cursusClient.dispose();
		cursusClient = null;
	}
}
