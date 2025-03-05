interface VSCodeExtension {
  isActive: boolean;
}

interface VSCodeExtensions {
  getExtension(extensionId: string): Promise<VSCodeExtension | undefined>;
}

interface VSCodeAPI {
  extensions: VSCodeExtensions;
}

declare global {
  interface Window {
    vscode?: VSCodeAPI;
  }
}

export const checkCursusExtension = async (): Promise<boolean> => {
  try {
    // Check if we're in a VS Code environment
    if (!window.vscode) return false;

    // Try to get the extension
    const extension = await window.vscode.extensions.getExtension('cursus.cursus');
    if (!extension) return false;

    // Check if the extension is active
    return extension.isActive;
  } catch (error) {
    console.error('Error checking Cursus extension:', error);
    return false;
  }
}; 