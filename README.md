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
  - [ ] move align indents
    - [x] rewrite to do the linebreak and the other thing based on parsed output
    - [ ] remember to handle no in param things
    - [ ] remember to test for offset of multiple groups where line amount changes
    - [ ] cleanup unused stuff
    - [ ] fix todos in code
		const init = `
       MYHEADER |SECTION.
           MOVE A IN AGROUP 
             TO A IN BGROUP
           MOVE AA IN AGROUP 
             TO AA IN BGROUP
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
  - [ ] for anything that is beyond border we need to make it pretty
  - [ ] ensure handles no in param
  - [ ] consider scenario where move group is seperated by a comment line if should still do move grouping
        - and in general consider what should cancel a move group? should it just be another none move thing?
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
- [ ] consider better implementation of log error
- [ ] support unit test formatter
- [X] keep mouse at expected line
- [ ] support a good way of detecting end when not another procedure like a copybook
- [ ] figure out why the test output swaps actual and expected and outputs two things
- [ ] consider format all procedures
- [ ] once adding more features consider renaming test suite to be only procedure scoped
- [ ] add test to assert that scope is only current procedure
- [ ] formatter also working on testcases
- [ ] reach first draft publish
- [ ] future features:
  - [ ] full formatter that can be invoked on the thing
  - [ ] convert current selection to comments