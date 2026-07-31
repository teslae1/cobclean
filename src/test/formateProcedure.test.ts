import * as vscode from 'vscode';
import { assertFormatProcedureChangesContentAsync } from './testHelpers'

const commandName = 'cobclean.formatProcedure';

suite('Format Procedure test suite', () => {

	vscode.window.showInformationMessage('Start all tests.');

  test('handles inline multi target move with IN parms', async function () {

		const initial = `
       MYHEADER |SECTION.
           move f to a in agroup b in bgroup c
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE F
             TO A IN AGROUP
                B IN BGROUP
                C
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

  test('handles inline multi target move', async function () {

		const initial = `
       MYHEADER |SECTION.
           move f to a b c
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE F
             TO A
                B
                C
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

  test('handles multiple move targets with single IN statement', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP
             TO A IN BGROUP
           MOVE AA  IN AGROUP TO BB BBB IN SOMEGROUP BBBB
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A   IN BGROUP
           MOVE AA  IN AGROUP
             TO BB
                BBB IN SOMEGROUP
                BBBB
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

  test('handles multiple move targets with in params', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP
             TO A IN BGROUP
           MOVE AA  IN AGROUP TO AA  IN BGROUP 
  AAA IN BGROUP                         
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A   IN BGROUP
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
                AAA IN BGROUP
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

  test('handles multiple move targets', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP
             TO A IN BGROUP
           MOVE AA  IN AGROUP TO BB BBB BBBB
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A  IN AGROUP
             TO A  IN BGROUP
           MOVE AA IN AGROUP
             TO BB
                BBB
                BBBB
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

  test('only formats selection if selection exists', async function () {
		const initial = `
       MYHEADER SECTION.

           COMPUTE A = A * B * C
           MOVE BB IN AGROUP
             TO BBBB IN BGROUP

|           MOVE A    IN AGROUP
             TO A IN BGROUP
           MOVE AA    IN AGROUP
             TO AA  IN BGROUP|

           COMPUTE A = A * B * C
           MOVE BB IN AGROUP
             TO BBBB IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.

           COMPUTE A = A * B * C
           MOVE BB IN AGROUP
             TO BBBB IN BGROUP

           MOVE A  IN AGROUP
             TO A  IN BGROUP
           MOVE AA IN AGROUP
             TO AA IN BGROUP

           COMPUTE A = A * B * C
           MOVE BB IN AGROUP
             TO BBBB IN BGROUP
           .
`;

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
  });

	test('handles linebreak intertwined with move statement', async function () {

		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP 

             TO B IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A IN AGROUP
             TO B IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('dont break margin2 already idented', async function () {

		const initial = `
       MYHEADER |SECTION.
           IF BOOL
             DISPLAY 'DONT MOVE THIS LINE'
           END-IF
           .
`;
		const exp = `
       MYHEADER SECTION.
           IF BOOL
             DISPLAY 'DONT MOVE THIS LINE'
           END-IF
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});


	test('support intertwined comment between move being preserved', async function () {

		const initial = `
       MYHEADER |SECTION.
           MOVE '123' IN BGROUP
      * SOME COMMENT
           TO X     IN AGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE '123' IN BGROUP
      * SOME COMMENT
           TO X     IN AGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('no indent when no in args for move arg', async function () {

		const initial = `
       MYHEADER |SECTION.
                move '123' to x in agroup 
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE '123'
             TO X IN AGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('a statement between two move groups should act as seperate groups', async function () {

		const initial = `
       MYHEADER |SECTION.
           MOVE A    IN AGROUP
             TO A IN BGROUP
           MOVE AA    IN AGROUP
             TO AA  IN BGROUP
           COMPUTE A = A * B * C
           MOVE BB IN AGROUP
             TO BBBB IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A  IN AGROUP
             TO A  IN BGROUP
           MOVE AA IN AGROUP
             TO AA IN BGROUP
           COMPUTE A = A * B * C
           MOVE BB   IN AGROUP
             TO BBBB IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('formatting move group keeps intertwined comments', async function () {

		const initial = `
       MYHEADER |SECTION.
           MOVE A   IN AGROUP
             TO A IN BGROUP
      * SOME COMMENT
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A IN AGROUP
             TO A IN BGROUP
      * SOME COMMENT
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('for a move with many in params that would wind up beyond margin 2 - do more idents', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A  IN AGROUP 
             TO A IN BGROUP IN BGROUP IN BGROUP IN BGROUP IN BGROUP IN BG
           MOVE AA IN AGROUP IN AGROUP IN AGROUP IN AGROUP IN AGROUP IN B
             TO AA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A
                IN AGROUP
             TO A
                IN BGROUP IN BGROUP IN BGROUP IN BGROUP IN BGROUP IN BG
           MOVE AA
                IN AGROUP IN AGROUP IN AGROUP IN AGROUP IN AGROUP IN B
             TO AA
                IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('for a move that would wind up beyond margin 2 - do more idents', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A  IN AGROUP 
             TO A IN BGROUPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
           MOVE AA IN AGROUPBGROUPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
             TO AA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A
                IN AGROUP
             TO A
                IN BGROUPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
           MOVE AA
                IN AGROUPBGROUPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
             TO AA
                IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align that decreases line count handles multigroup', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A  
		     IN AGROUP
             TO A  
			   IN BGROUP
           MOVE AA 
		     IN AGROUP
             TO AA 
			   IN BGROUP

           MOVE AAA  IN SECONDGROUP
             TO AAA  IN BGROUP
           MOVE AAAA IN SECONDGROUP
             TO AAAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A  IN AGROUP
             TO A  IN BGROUP
           MOVE AA IN AGROUP
             TO AA IN BGROUP

           MOVE AAA  IN SECONDGROUP
             TO AAA  IN BGROUP
           MOVE AAAA IN SECONDGROUP
             TO AAAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align that increases line count handles multigroup', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A   IN AGROUP TO A   IN BGROUP
           MOVE AA IN AGROUP TO AA IN BGROUP

           MOVE AAA IN SECONDGROUP TO AAA IN BGROUP
           MOVE AAAA IN SECONDGROUP TO AAAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A  IN AGROUP
             TO A  IN BGROUP
           MOVE AA IN AGROUP
             TO AA IN BGROUP

           MOVE AAA  IN SECONDGROUP
             TO AAA  IN BGROUP
           MOVE AAAA IN SECONDGROUP
             TO AAAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align indents handles partial no IN', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP 
             TO A 
           MOVE AA     IN AGROUP 
             TO AA IN BGROUP
           MOVE AAA IN AGROUP 
             TO AAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align indents handles no IN inline', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A TO A 
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A
             TO A
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align indents handles no IN', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A 
             TO A 
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A
             TO A
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('for movegroup new long move statement reindents everything', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A  IN AGROUP 
             TO A  IN BGROUP
           MOVE AA IN AGROUP 
             TO AA IN BGROUP
           MOVE AAA IN AGROUP TO AAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A   IN BGROUP
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('for movegroup creates indents when none', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP TO A IN BGROUP
           MOVE AA IN AGROUP TO AA IN BGROUP
           MOVE AAA IN AGROUP TO AAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A   IN BGROUP
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move align indents', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP 
             TO A IN BGROUP
           MOVE AA     IN AGROUP 
             TO   AA IN BGROUP
           MOVE AAA IN AGROUP 
             TO AAA IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A   IN AGROUP
             TO A   IN BGROUP
           MOVE AA  IN AGROUP
             TO AA  IN BGROUP
           MOVE AAA IN AGROUP
             TO AAA IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

	test('move statements is seperated into two lines', async function () {
		const initial = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP TO A IN BGROUP
           .
`;
		const exp = `
       MYHEADER SECTION.
           MOVE A IN AGROUP
             TO A IN BGROUP
           .
`;
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});

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
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
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
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);

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
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);

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

		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);

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

	await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
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
		await assertFormatProcedureChangesContentAsync(initial, exp, commandName);
	});
});

