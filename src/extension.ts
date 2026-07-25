import * as vscode from 'vscode';
import { CobCleanService } from './cobCleanService';

export function activate(context: vscode.ExtensionContext) {

	const service = new CobCleanService();
	let disposable = vscode.commands.registerCommand('cobclean.formatProcedure', async () => {
		await service.formatProcedureAsync();
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cobclean.toggleComment', async () => {
		await service.toggleCommentAsync();
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
