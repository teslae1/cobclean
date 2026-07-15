import * as vscode from 'vscode';

const stringLiteralStartChar = "'";
const commentChar = "*";
const MOVE_KEYWORD = "MOVE";
const TO_KEYWORD = "TO";

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
    if(sourceLine.trim().length === 1) { return false; } // handles the single line "."
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

    let newSource = toUpperCaseExcludingStringLiterals(sourceLines[procedureHeaderStartLineIndex]);
    newSource = indentHeader(newSource);
    newSource += "\n";
    let procedureEndLineIndex = sourceLines.length;
    for (let lineIndex = procedureHeaderStartLineIndex + 1; lineIndex < sourceLines.length; lineIndex++) {
        if (isProcedureHeader(sourceLines[lineIndex])) {
            procedureEndLineIndex = lineIndex;
            break;
        }
        newSource += formatSourceLine(sourceLines[lineIndex]);
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

function formatSourceLine(initialSourceLine: string) {
    let sourceLine = toUpperCaseExcludingStringLiterals(initialSourceLine);
    sourceLine = indentProcedureSourceLine(sourceLine);
    if(sourceLine.trim().startsWith(MOVE_KEYWORD)){
        sourceLine = formatMove(sourceLine);
    }
    return sourceLine;
}

function indentProcedureSourceLine(sourceLine: string): string {
    if(isComment(sourceLine)){
        return indentComment(sourceLine);
    }
    return moveStartOfNonWhitespaceToIndex(sourceLine, 11);
}

function indentComment(sourceLine: string): string {
    return moveStartOfNonWhitespaceToIndex(sourceLine, 6);
}

function indentHeader(sourceLine: string) : string{
    return moveStartOfNonWhitespaceToIndex(sourceLine, 7);
}

function moveStartOfNonWhitespaceToIndex(sourceLine: string, index: number): string {
    let firstIndexOfNonWhitespace = -1;
    for(let i = 0; i < sourceLine.length;i++){
        if(sourceLine[i] != " "){
            firstIndexOfNonWhitespace = i;
            break;
        }
    }
    if(firstIndexOfNonWhitespace === -1){
        return sourceLine;
    }
    if (firstIndexOfNonWhitespace === index) {
        return sourceLine;
    }
    while (firstIndexOfNonWhitespace < index) {
        sourceLine = " " + sourceLine;
        firstIndexOfNonWhitespace++;
    }
    while (firstIndexOfNonWhitespace > index) {
        sourceLine = sourceLine.substring(1, sourceLine.length);
        firstIndexOfNonWhitespace--;
    }
    return sourceLine;
}


function formatMove(sourceLine: string): string {
    const moveHasInlineTo = sourceLine.includes(TO_KEYWORD);
    if(moveHasInlineTo){
        const split = sourceLine.split(TO_KEYWORD);
        sourceLine = split[0] + "\n             "+ TO_KEYWORD + split[1];
    }
    // if matches current move context (in params)
    // and is currently not following max align standard 
    //   if current is bigger than max align 
    //     set new max align and make parsing start over at first move again
    //   if current is smaller than max align
    //     edit it to follow max align and continue
    //
    return sourceLine;
}

