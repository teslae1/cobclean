import { format } from 'path';
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

    let procedureEndLineIndex = sourceLines.length;
    let formattedLines : string[] = [];
    for(let i = procedureHeaderStartLineIndex; i < sourceLines.length;i++){
        if (i > procedureHeaderStartLineIndex && isProcedureHeader(sourceLines[i])) {
            procedureEndLineIndex = i;
            break;
        }
        else{
            formattedLines.push(sourceLines[i]);
        }
    }

    formattedLines = doUppercasing(formattedLines);
    formattedLines = doBasicIndent(formattedLines);
    formattedLines = doMoveIdent(formattedLines);

    const newSource = createNewSourceStrFromLines(formattedLines, procedureEndLineIndex, sourceLines);
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

function doMoveIdent(formattedLines: string[]): string[] {
    formattedLines = doMoveLineBreakOnToTarget(formattedLines);
    formattedLines = doMoveIdentByIn(formattedLines);
    return formattedLines;
}

function doMoveIdentByIn(formattedLines: string[]) : string[] {
    //find a move group start index

    //identify the end of the move group and the longest length arg name of any
    //move ARG og to ARG
    //  end of move is defined as end of array or something that is not comment, move or to 

    // target index is then index 17 + length of longest param

    //now iterate from start to end of that group and make the in param start at that target foreach of the moves
}

function doMoveLineBreakOnToTarget(formattedLines: string[]): string[] {
    for(let i = 0; i < formattedLines.length;i++){
        const line = formattedLines[i];
        if(line.trim().startsWith(MOVE_KEYWORD)){
            if(line.includes(TO_KEYWORD)){
                const split = line.split(TO_KEYWORD);
                const newToLine = "             "+ TO_KEYWORD + split[1];
                formattedLines[i] = split[0];
                formattedLines.splice(i + 1, 0, newToLine);
                i++;
            }
        }
    }
    return formattedLines;
}

function doUppercasing(formattedLines: string[]): string[] {
    for(let i = 0; i < formattedLines.length;i++){
        formattedLines[i] = toUpperCaseExcludingStringLiterals(formattedLines[i]);
    }
    return formattedLines;
}

function doBasicIndent(formattedLines: string[]): string[] {
    formattedLines[0] = indentHeader(formattedLines[0]);
    for(let i = 1; i < formattedLines.length;i++){
        formattedLines[i] = indentProcedureSourceLine(formattedLines[i]);
    }
    return formattedLines;
}

function createNewSourceStrFromLines(formattedLines: string[], procedureEndLineIndex: number, sourceLines: string[]): string {
    let newSource = "";
    for(let i = 0; i < formattedLines.length;i++){
        newSource += formattedLines[i];
        if(i < formattedLines.length-1){
            newSource += "\n";
        }
        else if(procedureEndLineIndex != sourceLines.length && formattedLines[i].trim().length == 0){
            newSource += "\n";
        }
    }
    return newSource;
}

