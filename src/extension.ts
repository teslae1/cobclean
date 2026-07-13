import * as vscode from 'vscode';
import { CobCleanService } from './cobCleanService';

export function activate(context: vscode.ExtensionContext) {

	const service = new CobCleanService();
	const disposable = vscode.commands.registerCommand('cobclean.formatProcedure', async () => {
		await service.formatProcedureAsync();
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
