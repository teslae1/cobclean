import * as vscode from 'vscode';
import { assertFormatProcedureChangesContentAsync } from './testHelpers'

const commandName = 'cobclean.toggleComment';

suite('Comment Selection test suite', () => {

	test('toggle comment', async function () {
		const initial = `
      *********************
       FIRST SECTION.
      *********************
|      *      COMMENT 1 
      *     COMMENT 2
      * COMMENT 3 
      * COMMENT 4|
           .
`;
		const exp = `
      *********************
       FIRST SECTION.
      *********************
            COMMENT 1 
           COMMENT 2
       COMMENT 3 
       COMMENT 4
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('toggle comment', async function () {
		const initial = `
      *********************
       FIRST SECTION.
      *********************
|            COMMENT 1 
           COMMENT 2
COMMENT 3 
COMMENT 4|
           .
`;
		const exp = `
      *********************
       FIRST SECTION.
      *********************
      *      COMMENT 1 
      *     COMMENT 2
      * COMMENT 3 
      * COMMENT 4
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});
});

