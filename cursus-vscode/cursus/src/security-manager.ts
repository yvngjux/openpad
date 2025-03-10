import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface SecurityOptions {
    allowedPaths?: string[];
    disallowedPaths?: string[];
    maxFileSize?: number;
    allowedOperations?: ('read' | 'write' | 'edit')[];
    requireConfirmation?: boolean;
}

export class SecurityManager {
    private readonly keytar = require('keytar');
    private readonly SERVICE_NAME = 'cursus-vscode';
    private readonly ACCOUNT_NAME = 'default';
    private readonly options: SecurityOptions;

    constructor(options: SecurityOptions = {}) {
        this.options = {
            allowedPaths: options.allowedPaths || [],
            disallowedPaths: options.disallowedPaths || [
                '**/node_modules/**',
                '**/.git/**',
                '**/package-lock.json',
                '**/yarn.lock'
            ],
            maxFileSize: options.maxFileSize || 1024 * 1024 * 5, // 5MB
            allowedOperations: options.allowedOperations || ['read', 'write', 'edit'],
            requireConfirmation: options.requireConfirmation ?? true
        };
    }

    public async validateToken(token: string): Promise<boolean> {
        if (!token) {
            return false;
        }

        try {
            // Store token securely
            await this.keytar.setPassword(this.SERVICE_NAME, this.ACCOUNT_NAME, token);
            return true;
        } catch (error) {
            console.error('Error storing token:', error);
            return false;
        }
    }

    public async getStoredToken(): Promise<string | null> {
        try {
            return await this.keytar.getPassword(this.SERVICE_NAME, this.ACCOUNT_NAME);
        } catch (error) {
            console.error('Error retrieving token:', error);
            return null;
        }
    }

    public async validateOperation(
        operation: 'read' | 'write' | 'edit',
        path: string,
        content?: string
    ): Promise<boolean> {
        // Check if operation is allowed
        if (!this.options.allowedOperations?.includes(operation)) {
            throw new Error(`Operation ${operation} is not allowed`);
        }

        // Check path against allowed/disallowed patterns
        if (!await this.validatePath(path)) {
            throw new Error(`Access to path ${path} is not allowed`);
        }

        // Check file size for write/edit operations
        if ((operation === 'write' || operation === 'edit') && content) {
            if (content.length > this.options.maxFileSize!) {
                throw new Error(`File size exceeds maximum allowed size of ${this.options.maxFileSize} bytes`);
            }
        }

        // Request user confirmation if required
        if (this.options.requireConfirmation) {
            const confirmation = await vscode.window.showWarningMessage(
                `Allow ${operation} operation on ${path}?`,
                { modal: true },
                'Yes',
                'No'
            );
            return confirmation === 'Yes';
        }

        return true;
    }

    private async validatePath(path: string): Promise<boolean> {
        const minimatch = require('minimatch');
        
        // Check against disallowed patterns
        for (const pattern of this.options.disallowedPaths!) {
            if (minimatch(path, pattern)) {
                return false;
            }
        }

        // If allowed paths are specified, check against them
        if (this.options.allowedPaths!.length > 0) {
            return this.options.allowedPaths!.some(pattern => minimatch(path, pattern));
        }

        return true;
    }

    public hashContent(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    public validateContentHash(content: string, hash: string): boolean {
        return this.hashContent(content) === hash;
    }
} 