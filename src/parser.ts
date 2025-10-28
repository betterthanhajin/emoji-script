import { Token, TokenType, ASTNode } from './types';

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  
  private peek(): Token {
    return this.tokens[this.position];
  }
  
  private advance(): Token {
    return this.tokens[this.position++];
  }
  
  private expect(type: TokenType): Token {
    const token = this.advance();
    if (token.type !== type) {
      throw new Error(
        `예상한 토큰: ${type}, 실제 토큰: ${token.type} (${token.line}:${token.column})`
      );
    }
    return token;
  }
  
  private skipNewlines(): void {
    while (this.peek().type === TokenType.NEWLINE) {
      this.advance();
    }
  }
  
  public parse(): ASTNode[] {
    const statements: ASTNode[] = [];
    
    while (this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      
      if (this.peek().type === TokenType.EOF) break;
      
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
      
      this.skipNewlines();
    }
    
    return statements;
  }
  
  private parseStatement(): ASTNode | null {
    const token = this.peek();
    
    switch (token.type) {
      case TokenType.VAR:
        return this.parseAssignment();
      case TokenType.PRINT:
        return this.parsePrint();
      case TokenType.IF:
        return this.parseIf();
      case TokenType.LOOP:
        return this.parseLoop();
      default:
        return this.parseExpression();
    }
  }
  
  private parseAssignment(): ASTNode {
    this.advance(); // 📦
    
    const nameToken = this.expect(TokenType.IDENTIFIER);
    const value = this.parseExpression();
    
    return {
      type: 'Assignment',
      name: nameToken.value,
      value
    };
  }
  
  private parsePrint(): ASTNode {
    this.advance(); // 📢
    
    const value = this.parseExpression();
    
    return {
      type: 'Print',
      value
    };
  }
  
  private parseIf(): ASTNode {
    this.advance(); // ❓
    
    const condition = this.parseExpression();
    this.expect(TokenType.THEN); // ➡️
    this.skipNewlines();
    
    const thenBody: ASTNode[] = [];
    
    // 🛑이 나올 때까지 또는 EOF까지 본문 파싱
    while (this.peek().type !== TokenType.STOP && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.STOP || this.peek().type === TokenType.EOF) break;
      
      const statement = this.parseStatement();
      if (statement) {
        thenBody.push(statement);
      }
      this.skipNewlines();
    }
    
    if (this.peek().type === TokenType.STOP) {
      this.advance(); // 🛑
    }
    
    return {
      type: 'If',
      condition,
      thenBody
    };
  }
  
  private parseLoop(): ASTNode {
    this.advance(); // 🔁
    
    const count = this.parseExpression();
    this.skipNewlines();
    
    const body: ASTNode[] = [];
    
    // 🛑이 나올 때까지 또는 EOF까지 본문 파싱
    while (this.peek().type !== TokenType.STOP && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.STOP || this.peek().type === TokenType.EOF) break;
      
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
      this.skipNewlines();
    }
    
    if (this.peek().type === TokenType.STOP) {
      this.advance(); // 🛑
    }
    
    return {
      type: 'Loop',
      count,
      body
    };
  }
  
  private parseExpression(): ASTNode {
    return this.parseComparison();
  }
  
  private parseComparison(): ASTNode {
    let left = this.parseAdditive();
    
    while ([TokenType.EQUALS, TokenType.GREATER, TokenType.LESS].includes(this.peek().type)) {
      const operator = this.advance().type;
      const right = this.parseAdditive();
      
      left = {
        type: 'BinaryOp',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    
    while ([TokenType.PLUS, TokenType.MINUS, TokenType.CONCAT].includes(this.peek().type)) {
      const operator = this.advance().type;
      const right = this.parseMultiplicative();
      
      left = {
        type: 'BinaryOp',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  private parseMultiplicative(): ASTNode {
    let left = this.parsePrimary();
    
    while ([TokenType.MULTIPLY, TokenType.DIVIDE].includes(this.peek().type)) {
      const operator = this.advance().type;
      const right = this.parsePrimary();
      
      left = {
        type: 'BinaryOp',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  private parsePrimary(): ASTNode {
    const token = this.peek();
    
    switch (token.type) {
      case TokenType.LITERAL:
        this.advance();
        if (typeof token.value === 'number') {
          return { type: 'Number', value: token.value };
        } else {
          return { type: 'String', value: token.value };
        }
      
      case TokenType.BOOLEAN_TRUE:
        this.advance();
        return { type: 'Boolean', value: true };
      
      case TokenType.BOOLEAN_FALSE:
        this.advance();
        return { type: 'Boolean', value: false };
      
      case TokenType.IDENTIFIER:
        this.advance();
        return { type: 'Variable', name: token.value };
      
      case TokenType.INPUT:
        this.advance();
        const prompt = this.peek().type !== TokenType.NEWLINE && 
                      this.peek().type !== TokenType.EOF 
                      ? this.parseExpression() 
                      : undefined;
        return { type: 'Input', prompt };
      
      case TokenType.RANDOM:
        this.advance();
        const max = this.peek().type !== TokenType.NEWLINE && 
                   this.peek().type !== TokenType.EOF 
                   ? this.parseExpression() 
                   : undefined;
        return { type: 'Random', max };
      
      default:
        throw new Error(
          `예상치 못한 토큰: ${token.type} (${token.line}:${token.column})`
        );
    }
  }
}