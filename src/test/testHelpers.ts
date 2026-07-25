import * as assert from 'assert';
import * as vscode from 'vscode';

const cursorChar = '|';

export async function assertFormatProcedureChangesContentAsync(initialContentIncludingCursorPosition: string,
		expContentAfterFormatting: string,
    commandName: string) {
		const positions = getCurrentCursorPositions(initialContentIncludingCursorPosition);
		if (positions.length < 1) {
			assert.fail("current cursor position could not be found in initial content of test");
		}
		const initialContent = removeChar(initialContentIncludingCursorPosition, cursorChar);
		const doc = await vscode.workspace.openTextDocument({
			content: initialContent
		});
		const editor = await vscode.window.showTextDocument(doc);
    if(positions.length === 1){
      editor.selection = new vscode.Selection(positions[0], positions[0]);
    }
    else if(positions.length === 2){
      editor.selection = new vscode.Selection(positions[0], positions[1]);
    }
    else{
      assert.fail("got invalid cursor positions amount, do either 1 for normal or 2 for selection, got: " + positions.length);
    }
		//await wait(10000);
		await vscode.commands.executeCommand(commandName);
		const actText = editor.document.getText();
		assert.strictEqual(actText, expContentAfterFormatting);
	}

function getCurrentCursorPositions(initialContentIncludingCursorPosition: string): vscode.Position[] {
  let lineNr = 0;
  let charPos = 0;
  const positions: vscode.Position[] = [];
  for (let i = 0; i < initialContentIncludingCursorPosition.length; i++) {
    if (initialContentIncludingCursorPosition[i] === '\n') {
      lineNr++;
      charPos = 0;
    }
    else {
      if (initialContentIncludingCursorPosition[i] === cursorChar) {
        positions.push(new vscode.Position(lineNr, charPos));
      }
      charPos++;
    }
  }
  return positions;
}

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

