import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

//		const initialContent = `
//       *********************
//       first section.
//       *********************
//           compute x = a * b * c
//           display x.
//
//       second.
//           compute pi = 3.14
//           display pi.
//    `;

const cursorChar = '|';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	

	test('test auto-uppercasing', async () => {
		const initial = `
       *********************
       first section.
       *********************
           DISPLAy |'SOMETHING THAT HAS lowercase'
		   .
    `;
		const exp = `
       *********************
       FIRST SECTION.
       *********************
           DISPLAY 'SOMETHING THAT HAS lowercase'
		   .
    `;
		await assertFormatProcedureChangesContentAsync(initial, exp);
	});

	async function assertFormatProcedureChangesContentAsync(initialContentIncludingCursorPosition: string,
		expContentAfterFormatting: string) {
		const doc = await vscode.workspace.openTextDocument({
			content: initialContentIncludingCursorPosition
		});
		const editor = await vscode.window.showTextDocument(doc);
		const position = getCurrentCursorPosition(initialContentIncludingCursorPosition);
		if (!position) {
			assert.fail("current cursor position could not be found in initial content of test");
		}
		editor.selection = new vscode.Selection(position, position);
		await vscode.commands.executeCommand('cobclean.formatProcedure');
		const actText = editor.document.getText();
		assert.strictEqual(actText, expContentAfterFormatting);
	}

	function getCurrentCursorPosition(initialContentIncludingCursorPosition: string): vscode.Position | undefined {
		let lineNr = 1;
		let charPos = 0;
		for(let i = 0; i < initialContentIncludingCursorPosition.length;i++){
			if(initialContentIncludingCursorPosition[i] == '\n'){
				lineNr++;
				charPos = 0;
			} 
			else if(initialContentIncludingCursorPosition[i] == cursorChar){
				return new vscode.Position(lineNr,charPos);
			}
			else{
				charPos++;
			}
		}
		return undefined;
	}
});
