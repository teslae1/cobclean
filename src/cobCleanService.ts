import * as vscode from 'vscode';

const stringLiteralStartChar = "'";
const commentChar = "*";
const MOVE_KEYWORD = "MOVE";
const TO_KEYWORD = "TO";
const IN_KEYWORD = "IN";
const AMOUNT_SPACES_FOR_MARGIN_2 = "           ";
const MARGIN2_MAX_LINE_LEN = 72;
const knownKeywords: Set<string> = new Set(["MOVE", "TO", "IF", "END-IF", "PERFORM", "END-PERFORM", "DISPLAY", "COMPUTE", "UNTIL", "."]);


export class CobCleanService {
    async toggleCommentAsync(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const selection = editor.selection;
        if (selection.isEmpty) { return; }
        const src = editor.document.getText(selection);
        const srcLines = src.split('\n');
        if (srcLines.length < 1) { return; }

        let linesWithToggledComment = "";
        for (let i = 0; i < srcLines.length; i++) {
            if (srcLines[i].trim().length === 0) {
                linesWithToggledComment += srcLines[i];
            }
            if (isComment(srcLines[i])) {
                linesWithToggledComment += uncommentLine(srcLines[i]);
            }
            else {
                linesWithToggledComment += commentLine(srcLines[i]);
            }
            if(i < srcLines.length - 1){
                linesWithToggledComment += "\n";
            }
        }

        await replaceSourceAtRangeAsync(editor, selection, linesWithToggledComment);
    }
	async formatProcedureAsync() : Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const sourceStr = editor.document.getText();
        if (!sourceStr) { return; }
        const sourceLines = sourceStr.split('\n');
        await formatProcedureAsync(sourceLines, editor);
	}
}

function commentLine(srcLine: string) : string {
    if(srcLine[6] !== " "){
        //add spaces so contents is on right hand side of comment char
        srcLine = moveStartOfNonWhitespaceToIndex(srcLine, 7);
    }
    return srcLine.substring(0,6) + commentChar + srcLine.substring(6);
}

function uncommentLine(srcLine: string) : string {
    return srcLine.substring(0,6) + srcLine.substring(7);
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

async function formatProcedureAsync(sourceLines: string[], editor: vscode.TextEditor): Promise<void> {
    const sourceSection = getSourceOfprocedureToFormat(sourceLines, editor);
    if(!sourceSection){
        logError("sourceSection was undefined");
        return;
    }
    let formattedLines = sourceSection.sourceLines;

    formattedLines = doUppercasing(formattedLines);
    formattedLines = doBasicIndent(formattedLines);
    formattedLines = doMoveIdent(formattedLines);

    const newSource = createNewSourceStrFromLines(formattedLines, sourceSection.endPosition.line, sourceLines);
    const range = new vscode.Range(sourceSection.startPosition, sourceSection.endPosition);
    await replaceSourceAtRangeAsync(editor, range, newSource);
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
    let firstNonWhitespaceCharIndex = -1;
    for(let i = 0; i < sourceLine.length;i++){
        if(sourceLine[i] !== " "){ 
            firstNonWhitespaceCharIndex = i;
            break;
        }
    }
    if(firstNonWhitespaceCharIndex === -1){
        return sourceLine;
    }
    if (firstNonWhitespaceCharIndex > 11) { // when already indented like if contents - dont change it
        return sourceLine; 
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
            if(statement.moveArg.value.length > largestLenOfArg && statement.moveInArgs.length > 0){
                largestLenOfArg = statement.moveArg.value.length;
            }
            if(statement.toTargets.length > 0){
                for(let k = 0; k < statement.toTargets.length;k++){

                    if (statement.toTargets[k].inArgs.length > 0 && statement.toTargets[k].arg.value.length > largestLenOfArg) {
                        largestLenOfArg = statement.toTargets[k].arg.value.length;
                    }
                }
            }
            if(j === group.length - 1){
                endOfGroupLineIndex = getLastLineIndexOfStatement(statement); 
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
    toTargets: ToTarget[],
}

interface ToTarget{
    arg: LineItem,
    inArgs: LineItem[],
}

interface LineItem{
    value: string,
    lineIndex: number
}

enum MoveStatementParsingState {
    LocatingMoveArg,
    LocatingNextToArg,
    LocatingMoveInStatements,
    LocatingToArg,
    LocatingToInStatements,
    Done
}

function extractMoveStatement(formattedLines: string[], indexOfFoundMove: number) : MoveToStatement | undefined {
    const statement: MoveToStatement = { moveInArgs: [], toTargets: [], moveArg: { value: "", lineIndex: -1 } };

    let state = MoveStatementParsingState.LocatingMoveArg;
    let lastWord = "";
    let didSetMoveArg = false;
    let toTargetIndex = -1;
    for(let i = indexOfFoundMove;i < formattedLines.length && state !== MoveStatementParsingState.Done;i++){
        const line = formattedLines[i];
        if (isComment(line)) {
            break;
        }
        const words = line.trim().split(" ");
        for(let j = 0; j < words.length && state !== MoveStatementParsingState.Done;j++){
            if(words[j].trim().length === 0){ continue; }
            switch(state){
                case MoveStatementParsingState.LocatingMoveArg:
                    if (lastWord === MOVE_KEYWORD) {
                        statement.moveArg = { value: words[j], lineIndex: i };
                        didSetMoveArg = true;
                        state = MoveStatementParsingState.LocatingMoveInStatements;
                    }
                    break;
                case MoveStatementParsingState.LocatingMoveInStatements:
                    if (lastWord === IN_KEYWORD) {
                        statement.moveInArgs.push({ value: words[j], lineIndex: i });
                    }
                    if (words[j] === TO_KEYWORD) {
                        state = MoveStatementParsingState.LocatingToArg;
                    }
                    break;
                case MoveStatementParsingState.LocatingToArg:
                    if(lastWord === TO_KEYWORD){
                        statement.toTargets.push({ arg: { value: words[j], lineIndex: i }, inArgs: [] });
                        toTargetIndex++;
                        state = MoveStatementParsingState.LocatingNextToArg;
                    }
                    break;
                case MoveStatementParsingState.LocatingNextToArg:
                    if(words[j] === IN_KEYWORD){
                        state = MoveStatementParsingState.LocatingToInStatements;
                    }
                    else if(knownKeywords.has(words[j])){
                        //things like new MOVE statement start are encountered - so we need to stop
                        return statement;
                    }
                    else{
                        statement.toTargets.push({ arg: { value: words[j], lineIndex: i}, inArgs: [] });
                        toTargetIndex++;
                    }
                    break;
                case MoveStatementParsingState.LocatingToInStatements:
                    if(lastWord === IN_KEYWORD){
                        statement.toTargets[toTargetIndex].inArgs.push({ value: words[j], lineIndex: i });
                    }
                    else if(words[j] === IN_KEYWORD){
                        //skip to next word
                    }
                    else if(!knownKeywords.has(words[j])){
                        //there are multiple to targets - add it and switch state back to target locator
                        statement.toTargets.push({ arg: { value: words[j], lineIndex: i}, inArgs: [] });
                        toTargetIndex++;
                        state = MoveStatementParsingState.LocatingNextToArg;
                    }
                    else{
                        state = MoveStatementParsingState.Done;
                    }
                    break;
            }

            lastWord = words[j];
        }
    }
    if(!didSetMoveArg){
        return undefined;
    }

    return statement;
}

interface SourceSection{
    startPosition: vscode.Position,
    endPosition: vscode.Position,
    sourceLines: string[]
}

function getSourceOfprocedureToFormat(sourceLines: string[], 
    editor: vscode.TextEditor) : SourceSection | undefined {
    if(editor.selection.isEmpty){
        return getSourceForEntireProcedure(editor, sourceLines);
    }
    else{
        return GetSourceFromSelection(editor);
    }
}

function createGroupFormattedLines(group: MoveToStatement[], targetIndexOfIn: number): string[] {
    let groupFormattedLines = createGroupFormattedLinesWithIdentSettings(group, targetIndexOfIn, false);
    if (groupFormattedLines.some(l => l.length > MARGIN2_MAX_LINE_LEN)) {
        groupFormattedLines = createGroupFormattedLinesWithIdentSettings(group, targetIndexOfIn, true);
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

function getLastLineIndexOfStatement(statement: MoveToStatement) : number{
    if(statement.toTargets.length > 0){
        const lastTo = statement.toTargets[statement.toTargets.length - 1];
        if (lastTo.inArgs.length > 0) {
            return lastTo.inArgs[lastTo.inArgs.length - 1].lineIndex;
        }
        else{
            return lastTo.arg.lineIndex;
        }
    }
    else if(statement.moveInArgs.length > 0){
        return statement.moveInArgs[statement.moveInArgs.length - 1].lineIndex;
    }
    else{
        return statement.moveArg.lineIndex;
    }
}

function createMoveLine(keyword: string, 
    arg: string, 
    inArgs: LineItem[], 
    targetIndexOfIn: number,
    doSeperateLineForIn: boolean): string {
    const keywordIncludingSpaces = keyword === MOVE_KEYWORD ? keyword : "  " + keyword;
    let moveLine = AMOUNT_SPACES_FOR_MARGIN_2 + keywordIncludingSpaces + " " + arg;
    if (inArgs.length > 0 && !doSeperateLineForIn) {
        while (moveLine.length < targetIndexOfIn) {
            moveLine += " ";
        }
    }
    if (doSeperateLineForIn) {
        moveLine += "\n               ";
    }
    for (let k = 0; k < inArgs.length; k++) {
        moveLine += " " + IN_KEYWORD + " " + inArgs[k].value;
    }

    return moveLine;
}

function createGroupFormattedLinesWithIdentSettings(group: MoveToStatement[],
    targetIndexOfIn: number,
    doSeperateLineForIn: boolean): string[] {
    const groupFormattedLines: string [] = [];
    for (let i = 0; i < group.length; i++) {
        const statement = group[i];
        const moveLine = createMoveLine(MOVE_KEYWORD, 
            statement.moveArg.value, 
            statement.moveInArgs, 
            targetIndexOfIn, 
            doSeperateLineForIn);
        groupFormattedLines.push(moveLine);
        if(statement.toTargets.length > 0){// This will not be present in cases where the statement parser stopped early because of comment
            const toLine = createMoveLine(TO_KEYWORD,
                statement.toTargets[0].arg.value,
                statement.toTargets[0].inArgs,
                targetIndexOfIn,
                doSeperateLineForIn);
            groupFormattedLines.push(toLine);
            //handle multiple to targets
            for(let j = 1; j < statement.toTargets.length;j++){
                const oneOfMultipleToTargets = statement.toTargets[j];
                groupFormattedLines.push(
                    createMoveLine("  ", //just two space for anything other than first target since first target uses "TO" and this aligns it exactly like that
                        oneOfMultipleToTargets.arg.value,
                        oneOfMultipleToTargets.inArgs,
                        targetIndexOfIn,
                        doSeperateLineForIn
                    ));
            }
        }
    }
    return groupFormattedLines;
}

async function replaceSourceAtRangeAsync(editor: vscode.TextEditor, range: vscode.Range, newSource: string) : Promise<void> {
    await editor.edit(editBuilder => {
        editBuilder.replace(range, newSource);
    });
}

function getSourceForEntireProcedure(editor: vscode.TextEditor, sourceLines: string[]): SourceSection | undefined {

    const procedureHeaderStartLineIndex = getProcedureHeaderStartLine(editor, sourceLines);
    if (!procedureHeaderStartLineIndex) {
        logError("did not find any procedureHeaderStartLineIndex");
        return undefined;
    }
    let linesToFormat: string[] = [];
    let procedureEndLineIndex = sourceLines.length;
    for (let i = procedureHeaderStartLineIndex; i < sourceLines.length; i++) {
        if (i > procedureHeaderStartLineIndex && isProcedureHeader(sourceLines[i])) {
            procedureEndLineIndex = i;
            break;
        }
        else {
            linesToFormat.push(sourceLines[i]);
        }
    }
    return {
        sourceLines: linesToFormat,
        startPosition: new vscode.Position(procedureHeaderStartLineIndex, 0),
        endPosition: new vscode.Position(procedureEndLineIndex, 0)
    }
}

function GetSourceFromSelection(editor: vscode.TextEditor): SourceSection {
    const selection = editor.selection;
    const src = editor.document.getText(selection);
    const srcLines = src.split('\n');
    return {
        sourceLines: srcLines,
        startPosition: selection.start,
        endPosition: selection.end
    }
}

function logError(msg: string) {
    console.log(msg);
}

