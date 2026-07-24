# cobclean README

# todos
- [x] get basic running
- [x] get test suite running
npm test
- [x] setup task to do it
- [x] setup simple test framework 
- [x] setup git
- [X] support auto uppercasing
  - [X] support not uppercasing string constants
- [x] test to ensure the format only is paragraph wise
- [-] support auto align
  - [X] for comments - should start with * at col 8
  - [X] for the header (first line) - should start at 9
  - [X] for contents lets go with col 11 align for now
  - [X] for move inline to - seperate to two lines
  - [x] move align indents
    - [X] rewrite to do the linebreak and the other thing based on parsed output
    - [X] remember to handle no in param things
    - [X] remember to test for offset of multiple groups where line amount changes
    - [X] cleanup unused stuff
    - [x] fix todos in code
  - [x] for anything that is beyond border we need to make it pretty
  - [x] ensure no bug where comment is removed when within a move group
  - [x] a statement between two move groups should act as seperate groups
  - [x] fix bug this creates a weird ident
                move '123' to x in agroup 

** HAIL THE MACHINE GOD **
all tests are passing - review the changes and commit

  - [x] fix bug: preserving all intertwined comments
    - consider just doing general way of no seperation and preserve any intertwined comments
  - [ ] ensure it has proper stop for move groups
  - [ ] for anything move without general structure at top - follow standard structure
		const init = `
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
  - [ ] for last move need formatting reformats everything
		const init = `
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
  - [ ] for two seperate move sections keep indentation group wise
  - [ ] test that if move formatting on more indent crosses the right hand border 
        - if so we want to break the line somewhere for all in that move group
  - [ ] support same kind of formatting from video
- [ ] formatter able to align everything to do with paragraph 
- [ ] support multiple move targets in formatting
  - [ ] remember to still preserve intertwined comments when also supporting multi move targets
- [ ] remove dupliation from createGroupFormattedLines
- [ ] test if we can handle line break between targets
- [ ] consider method extractor function
- [ ] consider auto comment function
- [ ] consider better implementation of log error
- [ ] support unit test formatter
- [X] keep mouse at expected line
- [ ] support a good way of detecting end when not another procedure like a copybook
- [ ] figure out why the test output swaps actual and expected and outputs two things
- [ ] consider format all procedures
- [ ] once adding more features consider renaming test suite to be only procedure scoped
- [ ] add test to assert that scope is only current procedure
- [ ] do pretty readme and consider gif example
- [ ] do better error msg
- [ ] formatter also working on testcases
- [ ] reach first draft publish
- [ ] future features:
  - [ ] full formatter that can be invoked on the thing
  - [ ] convert current selection to comments