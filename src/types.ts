// 토큰 타입 정의
export enum TokenType {
  // 데이터 타입
  NUMBER = '🔢',
  STRING = '📝',
  BOOLEAN_TRUE = '✅',
  BOOLEAN_FALSE = '❌',
  
  // 변수
  VAR = '📦',
  
  // 연산자
  PLUS = '➕',
  MINUS = '➖',
  MULTIPLY = '✖️',
  DIVIDE = '➗',
  CONCAT = '🔗',
  
  // 제어 흐름
  IF = '❓',
  LOOP = '🔁',
  THEN = '➡️',
  STOP = '🛑',
  
  // 입출력
  PRINT = '📢',
  INPUT = '👂',
  
  // 비교 연산자
  EQUALS = '🟰',
  GREATER = '⬆️',
  LESS = '⬇️',
  
  // 기타
  RANDOM = '🎲',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF'
}

// 토큰 인터페이스
export interface Token {
  type: TokenType;
  value: any;
  line: number;
  column: number;
}

// AST 노드 타입
export type ASTNode =
  | NumberNode
  | StringNode
  | BooleanNode
  | VariableNode
  | AssignmentNode
  | BinaryOpNode
  | PrintNode
  | InputNode
  | IfNode
  | LoopNode
  | RandomNode;

// AST 노드 인터페이스들
export interface NumberNode {
  type: 'Number';
  value: number;
}

export interface StringNode {
  type: 'String';
  value: string;
}

export interface BooleanNode {
  type: 'Boolean';
  value: boolean;
}

export interface VariableNode {
  type: 'Variable';
  name: string;
}

export interface AssignmentNode {
  type: 'Assignment';
  name: string;
  value: ASTNode;
}

export interface BinaryOpNode {
  type: 'BinaryOp';
  operator: TokenType;
  left: ASTNode;
  right: ASTNode;
}

export interface PrintNode {
  type: 'Print';
  value: ASTNode;
}

export interface InputNode {
  type: 'Input';
  prompt?: ASTNode;
}

export interface IfNode {
  type: 'If';
  condition: ASTNode;
  thenBody: ASTNode[];
}

export interface LoopNode {
  type: 'Loop';
  count: ASTNode;
  body: ASTNode[];
}

export interface RandomNode {
  type: 'Random';
  max?: ASTNode;
}

// 런타임 값 타입
export type RuntimeValue = number | string | boolean | null;

// 환경 (변수 저장소)
export class Environment {
  private variables: Map<string, RuntimeValue> = new Map();
  
  set(name: string, value: RuntimeValue): void {
    this.variables.set(name, value);
  }
  
  get(name: string): RuntimeValue {
    if (!this.variables.has(name)) {
      throw new Error(`변수 '${name}'을 찾을 수 없습니다`);
    }
    return this.variables.get(name)!;
  }
  
  has(name: string): boolean {
    return this.variables.has(name);
  }
}