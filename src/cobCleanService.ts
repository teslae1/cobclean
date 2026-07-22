import { format } from 'path';
import * as vscode from 'vscode';

const stringLiteralStartChar = "'";
const commentChar = "*";
const MOVE_KEYWORD = "MOVE";
const TO_KEYWORD = "TO";
const IN_KEYWORD = "IN";
const AMOUNT_SPACES_FOR_MARGIN_2 = "           ";

export class CobCleanService {
	async formatProcedureAsync() : Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const sourceStr = editor.document.getText();
        if (!sourceStr) { return; }
        const sourceLines = sourceStr.split('\n');
        const procedureHeaderStartLine = getProcedureHeaderStartLine(editor, sourceLines);
        if(!procedureHeaderStartLine){ return; }
        await formatProcedureFromHeaderUntilNextHeaderOrEndAsync(procedureHeaderStartLine, sourceLines, editor);
	}
}

function getProcedureHeaderStartLine(editor: vscode.TextEditor, sourceLines: string[]) : number | undefined{
    const currentCursorPos = editor.selection.active;
    const currentCursorLine = currentCursorPos.line;
    let procedureHeaderStartLine = -1;
    //look backwards to determine start of procedure
    for (let i = currentCursorLine; i >= 0; i--) {
        if (isProcedureHeader(sourceLines[i])) {
            procedureHeaderStartLine = i;
            break;
        }
    }
    if (procedureHeaderStartLine === -1) {
        return;
    }
    return procedureHeaderStartLine;
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

    const sourceSection = getSourceOfprocedureToFormat(procedureHeaderStartLineIndex, sourceLines);
    let formattedLines = sourceSection.sourceLines;

    formattedLines = doUppercasing(formattedLines);
    formattedLines = doBasicIndent(formattedLines);
    formattedLines = doMoveIdent(formattedLines);

    const newSource = createNewSourceStrFromLines(formattedLines, sourceSection.procedureEndLineIndex, sourceLines);
    const startPosition = new vscode.Position(procedureHeaderStartLineIndex, 0);
    const endPosition = new vscode.Position(sourceSection.procedureEndLineIndex, 0);
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
        if(sourceLine[i] !== " "){
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

function doMoveIdent(formattedLines: string[]) : string[] {
    const moveGroups = extractMoveGroups(formattedLines);

    let offset = 0;

    for(let i = 0; i < moveGroups.length;i++){
        const group = moveGroups[i];
        let endOfGroupLineIndex = -1;
        let largestLenOfArg = 1;
        for(let j = 0; j < group.length;j++){
            const statement = group[j];
            if(statement.moveArg.value.length > largestLenOfArg){
                largestLenOfArg = statement.moveArg.value.length;
            }
            if(statement.toArg.value.length > largestLenOfArg){
                largestLenOfArg = statement.toArg.value.length;
            }
            if(j === group.length - 1){
                endOfGroupLineIndex =getLastLineIndexOfStatement(statement); 
            }
        }

        const targetIndexOfIn = 16 + largestLenOfArg;
        const groupFormattedLines = createGroupFormattedLines(group, targetIndexOfIn);
        offset = replaceFormattedLinesWithNewGroupFormattedLines(formattedLines, groupFormattedLines, offset, group, endOfGroupLineIndex);
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
        else if(procedureEndLineIndex !== sourceLines.length && formattedLines[i].trim().length === 0){
            newSource += "\n";
        }
    }
    return newSource;
}

function extractMoveGroups(formattedLines: string[]) : MoveToStatement[][] {
    const moveGroups : MoveToStatement[][] = [];
    let currGroupIndex = -1;
    let currentlyParsingMoveGroup = false;
    for(let i = 0; i < formattedLines.length;i++){
        const line = formattedLines[i];
        if (isComment(line)) { continue; }
        if (!line.trim().startsWith(MOVE_KEYWORD)) {
            currentlyParsingMoveGroup = false;
            continue;
        }
        
        const moveStatement = extractMoveStatement(formattedLines, i);
        if(!moveStatement){
            continue;
        }

        const lastLineOfStatement = getLastLineIndexOfStatement(moveStatement);
        i = lastLineOfStatement;
        if(!currentlyParsingMoveGroup){
            currentlyParsingMoveGroup = true;
            moveGroups.push([]);
            currGroupIndex++;
        }

        moveGroups[currGroupIndex].push(moveStatement);
    }

    return moveGroups;
}

interface MoveToStatement{
    moveArg: LineItem,
    moveInArgs: LineItem[],
    toArg: LineItem,
    toInArgs: LineItem[],
}

interface LineItem{
    value: string,
    lineIndex: number
}

enum MoveStatementParsingState {
    LocatingMoveArg,
    LocatingMoveInStatements,
    LocatingToArg,
    LocatingToInStatements,
    Done
}

function extractMoveStatement(formattedLines: string[], indexOfFoundMove: number) : MoveToStatement | undefined {
    let moveArg : LineItem | undefined = undefined;
    let toArg : LineItem | undefined = undefined;
    let moveInArgs : LineItem[] = [];
    let toInArgs : LineItem[] = [];
    let state = MoveStatementParsingState.LocatingMoveArg;
    let lastWord = "";
    for(let i = indexOfFoundMove;i < formattedLines.length && state !== MoveStatementParsingState.Done;i++){
        const line = formattedLines[i];
        if (isComment(line)) { continue; }
        const words = line.trim().split(" ");
        for(let j = 0; j < words.length && state !== MoveStatementParsingState.Done;j++){
            if(words[j].trim().length == 0){ continue; }
            switch(state){
                case MoveStatementParsingState.LocatingMoveArg:
                    if (lastWord === MOVE_KEYWORD) {
                        moveArg = { value: words[j], lineIndex: i };
                        state = MoveStatementParsingState.LocatingMoveInStatements;
                    }
                    break;
                case MoveStatementParsingState.LocatingMoveInStatements:
                    if (lastWord === IN_KEYWORD) {
                        moveInArgs.push({ value: words[j], lineIndex: i });
                    }
                    if (words[j] === TO_KEYWORD) {
                        state = MoveStatementParsingState.LocatingToArg;
                    }
                    break;
                case MoveStatementParsingState.LocatingToArg:
                    if(lastWord === TO_KEYWORD){
                        toArg = {value: words[j], lineIndex: i};
                        state = MoveStatementParsingState.LocatingToInStatements;
                    }
                    break;
                case MoveStatementParsingState.LocatingToInStatements:
                    if(lastWord === IN_KEYWORD){
                        toInArgs.push({ value: words[j], lineIndex: i });
                    }
                    else if(words[j] === IN_KEYWORD){
                        //skip to next word
                    }
                    else{
                        state = MoveStatementParsingState.Done;
                    }
                    break;
            }

            lastWord = words[j];
        }
    }

    if(!moveArg){
        return;
    }
    if(!toArg){
        return;
    }
    return {
        moveArg: moveArg,
        moveInArgs: moveInArgs, 
        toArg: toArg, 
        toInArgs: toInArgs
    };
}

interface SourceSection{
    procedureEndLineIndex: number,
    sourceLines: string[]
}

function getSourceOfprocedureToFormat(procedureHeaderStartLineIndex: number, sourceLines: string[]) : SourceSection {
    let linesToFormat : string[] = [];
    let procedureEndLineIndex = sourceLines.length;
    for(let i = procedureHeaderStartLineIndex; i < sourceLines.length;i++){
        if (i > procedureHeaderStartLineIndex && isProcedureHeader(sourceLines[i])) {
            procedureEndLineIndex = i;
            break;
        }
        else{
            linesToFormat.push(sourceLines[i]);
        }
    }
    return { procedureEndLineIndex: procedureEndLineIndex, sourceLines: linesToFormat };
}

function createGroupFormattedLines(group: MoveToStatement[], targetIndexOfIn: number) : string[]{
        const groupFormattedLines : string[] = []; 
        for(let j = 0;j < group.length;j++){
            const statement = group[j];
            let moveLine = AMOUNT_SPACES_FOR_MARGIN_2 + MOVE_KEYWORD + " " + statement.moveArg.value;
            if(statement.moveInArgs.length > 0){
                while (moveLine.length < targetIndexOfIn) {
                    moveLine += " ";
                }
            }
            for(let k = 0; k < statement.moveInArgs.length;k++){
                moveLine += " " + IN_KEYWORD + " " + statement.moveInArgs[k].value;
            }
            groupFormattedLines.push(moveLine);
            let toLine = AMOUNT_SPACES_FOR_MARGIN_2 + "  " + TO_KEYWORD + " " + statement.toArg.value;
            if (statement.toInArgs.length > 0) {
                while (toLine.length < targetIndexOfIn) {
                    toLine += " ";
                }
            }
            for(let k = 0; k < statement.toInArgs.length;k++){
                toLine += " " + IN_KEYWORD + " " + statement.toInArgs[k].value;
            }
            groupFormattedLines.push(toLine);
        }

        return groupFormattedLines;
}

//returns new offset
function replaceFormattedLinesWithNewGroupFormattedLines(formattedLines: string[],
    groupFormattedLines: string[],
    offset: number,
    group: MoveToStatement[],
    endOfGroupLineIndex: number): number {
    const startOfGroupLineIndex = group[0].moveArg.lineIndex;
    const amountOfLinesToRemove = endOfGroupLineIndex - startOfGroupLineIndex + 1;
    const amountLinesToAdd = groupFormattedLines.length;

    formattedLines.splice(startOfGroupLineIndex + offset, amountOfLinesToRemove, ...groupFormattedLines);
    if (amountLinesToAdd < amountOfLinesToRemove) {
        offset -= amountOfLinesToRemove - amountLinesToAdd;
    }
    else if (amountLinesToAdd > amountOfLinesToRemove) {
        offset += amountLinesToAdd - amountOfLinesToRemove;
    }
    return offset;
}

function getLastLineIndexOfStatement(statement: any) : number{
    if(statement.toInArgs.length > 0){
        return statement.toInArgs[statement.toInArgs.length - 1].lineIndex;
    }
    else{
        return statement.toArg.lineIndex;
    }
}

