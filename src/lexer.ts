import { Token, TokenType } from './types';

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  constructor(input: string) {
    this.input = input;
  }
  
  private peek(): string {
    if (this.position >= this.input.length) {
      return '';
    }
    return this.input[this.position];
  }
  
  private advance(): string {
    const char = this.peek();
    this.position++;
    this.column++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    }
    return char;
  }
  
  private skipWhitespace(): void {
    while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\r') {
      this.advance();
    }
  }
  
  private readString(): string {
    let result = '';
    this.advance(); // Skip opening quote
    
    while (this.peek() !== '"' && this.peek() !== '') {
      result += this.advance();
    }
    
    if (this.peek() === '"') {
      this.advance(); // Skip closing quote
    }
    
    return result;
  }
  
  private readNumber(): number {
    let numStr = '';
    
    while (this.peek() >= '0' && this.peek() <= '9' || this.peek() === '.') {
      numStr += this.advance();
    }
    
    return parseFloat(numStr);
  }
  
  private readIdentifier(): string {
    let result = '';
    
    while (this.peek() !== '' && this.peek() !== ' ' && this.peek() !== '\n' && 
           !this.isEmojiOperator(this.peek())) {
      result += this.advance();
    }
    
    return result;
  }
  
  private isEmojiOperator(char: string): boolean {
    const operators = ['📦', '🔢', '📝', '✅', '❌', '➕', '➖', '✖️', '➗', 
                       '🔗', '❓', '🔁', '➡️', '🛑', '📢', '👂', '🟰', 
                       '⬆️', '⬇️', '🎲'];
    return operators.includes(char);
  }
  
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;
      
      const char = this.peek();
      const currentLine = this.line;
      const currentColumn = this.column;
      
      // 줄바꿈
      if (char === '\n') {
        tokens.push({
          type: TokenType.NEWLINE,
          value: '\n',
          line: currentLine,
          column: currentColumn
        });
        this.advance();
        continue;
      }
      
      // 주석 처리 (💭로 시작)
      if (char === '💭') {
        while (this.peek() !== '\n' && this.peek() !== '') {
          this.advance();
        }
        continue;
      }
      
      // 이모지 토큰들
      const emojiTokenMap: { [key: string]: TokenType } = {
        '📦': TokenType.VAR,
        '🔢': TokenType.NUMBER,
        '📝': TokenType.STRING,
        '✅': TokenType.BOOLEAN_TRUE,
        '❌': TokenType.BOOLEAN_FALSE,
        '➕': TokenType.PLUS,
        '➖': TokenType.MINUS,
        '✖️': TokenType.MULTIPLY,
        '➗': TokenType.DIVIDE,
        '🔗': TokenType.CONCAT,
        '❓': TokenType.IF,
        '🔁': TokenType.LOOP,
        '➡️': TokenType.THEN,
        '🛑': TokenType.STOP,
        '📢': TokenType.PRINT,
        '👂': TokenType.INPUT,
        '🟰': TokenType.EQUALS,
        '⬆️': TokenType.GREATER,
        '⬇️': TokenType.LESS,
        '🎲': TokenType.RANDOM
      };
      
      if (emojiTokenMap[char]) {
        tokens.push({
          type: emojiTokenMap[char],
          value: char,
          line: currentLine,
          column: currentColumn
        });
        this.advance();
        continue;
      }
      
      // 문자열 리터럴
      if (char === '"') {
        const str = this.readString();
        tokens.push({
          type: TokenType.LITERAL,
          value: str,
          line: currentLine,
          column: currentColumn
        });
        continue;
      }
      
      // 숫자 리터럴
      if (char >= '0' && char <= '9') {
        const num = this.readNumber();
        tokens.push({
          type: TokenType.LITERAL,
          value: num,
          line: currentLine,
          column: currentColumn
        });
        continue;
      }
      
      // 식별자 (변수명)
      const identifier = this.readIdentifier();
      if (identifier) {
        tokens.push({
          type: TokenType.IDENTIFIER,
          value: identifier,
          line: currentLine,
          column: currentColumn
        });
        continue;
      }
      
      // 알 수 없는 문자는 건너뛰기
      this.advance();
    }
    
    tokens.push({
      type: TokenType.EOF,
      value: null,
      line: this.line,
      column: this.column
    });
    
    return tokens;
  }
}