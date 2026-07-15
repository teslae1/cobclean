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

	test('auto align method contents', async function () {
		const initial = `
       MYHEADER SECTION.
      COMPUTE X = A * B * |C
               DISPLAY X.
`;
		const exp = `
       MYHEADER SECTION.
           COMPUTE X = A * B * C
           DISPLAY X.
`;
		await assertFormatProcedureChangesContentAsync(initial, exp);
	});

	test('auto align header backward', async function () {
		const initial = `
             MYHEADER SECTION.
           |COMPUTE X = A * B * C
           DISPLAY X.
`;
		const exp = `
       MYHEADER SECTION.
           COMPUTE X = A * B * C
           DISPLAY X.
`;
		await assertFormatProcedureChangesContentAsync(initial, exp);

	});

	test('auto align header forward', async function () {
		const initial = `
   MYHEADER SECTION.
           |COMPUTE X = A * B * C
           DISPLAY X.
`;
		const exp = `
       MYHEADER SECTION.
           COMPUTE X = A * B * C
           DISPLAY X.
`;
		await assertFormatProcedureChangesContentAsync(initial, exp);

	});

	test('auto align for comments', async function () {
		const initial = `
       SECTION.
* MY FIRST COMMENT
               * MY SECOND COMMENT
      * MY THIRD COMMENT
           |COMPUTE X = A * B * C
           DISPLAY X.
`;
		const exp = `
       SECTION.
      * MY FIRST COMMENT
      * MY SECOND COMMENT
      * MY THIRD COMMENT
           COMPUTE X = A * B * C
           DISPLAY X.
`;

		await assertFormatProcedureChangesContentAsync(initial, exp);

	});

	test('scoped to single procedure', async function () {
		const initial = `
       first section.
           compute x = a * b * c
           display x.

       second.
           |compute pi = 3.14
           display pi.

       third.
           compute x = a * b * c
           display x.
    `;
		const exp = `
       first section.
           compute x = a * b * c
           display x.

       SECOND.
           COMPUTE PI = 3.14
           DISPLAY PI.

       third.
           compute x = a * b * c
           display x.
    `;

	await assertFormatProcedureChangesContentAsync(initial, exp);
	});
	

	test('auto-uppercasing', async function () {
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

		this.timeout(10000);
		await assertFormatProcedureChangesContentAsync(initial, exp);
	});

	async function assertFormatProcedureChangesContentAsync(initialContentIncludingCursorPosition: string,
		expContentAfterFormatting: string) {
		const position = getCurrentCursorPosition(initialContentIncludingCursorPosition);
		if (!position) {
			assert.fail("current cursor position could not be found in initial content of test");
		}
		const initialContent = removeChar(initialContentIncludingCursorPosition, cursorChar);
		const doc = await vscode.workspace.openTextDocument({
			content: initialContent
		});
		const editor = await vscode.window.showTextDocument(doc);
		editor.selection = new vscode.Selection(position, position);
		//await wait(10000);
		await vscode.commands.executeCommand('cobclean.formatProcedure');
		const actText = editor.document.getText();
		assert.strictEqual(actText, expContentAfterFormatting);
	}

	function getCurrentCursorPosition(initialContentIncludingCursorPosition: string): vscode.Position | undefined {
		let lineNr = 0;
		let charPos = 0;
		for(let i = 0; i < initialContentIncludingCursorPosition.length;i++){
			if(initialContentIncludingCursorPosition[i] === '\n'){
				lineNr++;
				charPos = 0;
			} 
			else if(initialContentIncludingCursorPosition[i] === cursorChar){
				return new vscode.Position(lineNr,charPos);
			}
			else{
				charPos++;
			}
		}
		return undefined;
	}
});
function removeChar(str: string, char: string) : string {
	let result = "";
	for(let i = 0; i < str.length;i++){
		if(str[i] == char){
			continue;
		}
		result += str[i];
	}
	return result;
}
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

