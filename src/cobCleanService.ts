import * as vscode from 'vscode';

const stringLiteralStartChar = "'";
const commentChar = "*";

export class CobCleanService {
	async formatProcedureAsync() : Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const sourceStr = editor.document.getText();
        if (!sourceStr) { return; }
        //look backwards to determine start of procedure
        const currentCursorPos = editor.selection.active;
        const currentCursorLine = currentCursorPos.line;
        const sourceLines = sourceStr.split('\n');
        let procedureHeaderStartLine = -1;
        for(let i = currentCursorLine; i >= 0;i--){
            if(isProcedureHeader(sourceLines[i])){
                procedureHeaderStartLine = i;
                break;
            }
        }
        if(procedureHeaderStartLine === -1){
            return;
        }

        await formatProcedureFromHeaderUntilNextHeaderOrEndAsync(procedureHeaderStartLine, sourceLines, editor);
	}

}

function isProcedureHeader(sourceLine: string) : Boolean {
    if (!sourceLine) { return false; }
    if (isComment(sourceLine)) { return false; }
    if(sourceLine.trim().length == 1) { return false; } // handles the single line "."
    const splitBySpaces = sourceLine.trim().split(" ");
    if(splitBySpaces.length === 1){
        return splitBySpaces[0].endsWith(".");
    }
    if(splitBySpaces.length === 2){
        return splitBySpaces[1].toUpperCase() === "SECTION.";
    }
    return false;
}
function isComment(sourceLine: string) {
    return sourceLine.trimStart().startsWith(commentChar);
}

async function formatProcedureFromHeaderUntilNextHeaderOrEndAsync(
    procedureHeaderStartLineIndex: number,
    sourceLines: string[], editor: vscode.TextEditor): Promise<void> {

    let newSource = toUpperCaseExcludingStringLiterals(sourceLines[procedureHeaderStartLineIndex]) + "\n";
    let procedureEndLineIndex = sourceLines.length;
    for (let lineIndex = procedureHeaderStartLineIndex + 1; lineIndex < sourceLines.length; lineIndex++) {
        if (isProcedureHeader(sourceLines[lineIndex])) {
            procedureEndLineIndex = lineIndex;
            break;
        }
        let newSourceLine = sourceLines[lineIndex];
        newSourceLine = toUpperCaseExcludingStringLiterals(newSourceLine);
        newSourceLine = indent(newSourceLine);
        newSource += newSourceLine;
        if(lineIndex < sourceLines.length - 1){
            newSource += "\n";
        }

    }
    const startPosition = new vscode.Position(procedureHeaderStartLineIndex, 0);
    const endPosition = new vscode.Position(procedureEndLineIndex, 0);
    const range = new vscode.Range(startPosition, endPosition);
    await editor.edit(editBuilder => {
        editBuilder.replace(range, newSource);
    });


    // when current line is either a single word postfixed by . 
    //      or two words - one word that is without . postfix and another that is "section." (case insensitive)
    //format forward from here until end of procedure
    // end of procedure is again whenever above thing occurs
}

function toUpperCaseExcludingStringLiterals(sourceLine: string): string {
    if(sourceLine.toUpperCase() === sourceLine){
        return sourceLine;
    }
    if(!sourceLine.includes(stringLiteralStartChar)){
        return sourceLine.toUpperCase();
    }
    let uppercasedSourceLine = "";
    let currentlyParsingStringLit = false;
    for(let i = 0; i < sourceLine.length;i++){
        if(currentlyParsingStringLit){
            uppercasedSourceLine += sourceLine[i];
            if(sourceLine[i] === stringLiteralStartChar){
                currentlyParsingStringLit = false;
            }
        }
        else{
            uppercasedSourceLine += sourceLine[i].toUpperCase();
            if(sourceLine[i] === stringLiteralStartChar){
                currentlyParsingStringLit = true;
            }
        }
    }
    return uppercasedSourceLine;
}

function indent(sourceLine: string): string {
    if(isComment(sourceLine)){
        let indexOfStartComment = sourceLine.indexOf(commentChar);
        if(indexOfStartComment == 6){
            return sourceLine;
        }
        while(indexOfStartComment < 6){
            sourceLine = " " + sourceLine;
            indexOfStartComment++;
        }
        while(indexOfStartComment > 6){
            sourceLine = sourceLine.substring(1,sourceLine.length);
            indexOfStartComment--;
        }
        return sourceLine;
    }
    return sourceLine;
}

