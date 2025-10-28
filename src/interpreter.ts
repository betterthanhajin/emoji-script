import { ASTNode, Environment, RuntimeValue, TokenType } from './types';
import * as readline from 'readline';

export class Interpreter {
  private env: Environment;
  private output: string[] = [];
  private rl?: readline.Interface;
  
  constructor() {
    this.env = new Environment();
  }
  
  private async prompt(message: string): Promise<string> {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    return new Promise((resolve) => {
      this.rl!.question(message, (answer) => {
        resolve(answer);
      });
    });
  }
  
  public async evaluate(nodes: ASTNode[]): Promise<string[]> {
    this.output = [];
    
    for (const node of nodes) {
      await this.evaluateNode(node);
    }
    
    if (this.rl) {
      this.rl.close();
    }
    
    return this.output;
  }
  
  private async evaluateNode(node: ASTNode): Promise<RuntimeValue> {
    switch (node.type) {
      case 'Number':
        return node.value;
      
      case 'String':
        return node.value;
      
      case 'Boolean':
        return node.value;
      
      case 'Variable':
        return this.env.get(node.name);
      
      case 'Assignment':
        const value = await this.evaluateNode(node.value);
        this.env.set(node.name, value);
        return value;
      
      case 'BinaryOp':
        return await this.evaluateBinaryOp(node);
      
      case 'Print':
        const printValue = await this.evaluateNode(node.value);
        const printStr = String(printValue);
        this.output.push(printStr);
        console.log(printStr);
        return null;
      
      case 'Input':
        const promptText = node.prompt 
          ? String(await this.evaluateNode(node.prompt))
          : '입력: ';
        const input = await this.prompt(promptText);
        
        // 숫자로 변환 시도
        const num = parseFloat(input);
        return isNaN(num) ? input : num;
      
      case 'If':
        const condition = await this.evaluateNode(node.condition);
        if (this.isTruthy(condition)) {
          for (const statement of node.thenBody) {
            await this.evaluateNode(statement);
          }
        }
        return null;
      
      case 'Loop':
        const countValue = await this.evaluateNode(node.count);
        const count = typeof countValue === 'number' ? countValue : 0;
        
        for (let i = 0; i < count; i++) {
          for (const statement of node.body) {
            await this.evaluateNode(statement);
          }
        }
        return null;
      
      case 'Random':
        const maxValue = node.max 
          ? await this.evaluateNode(node.max)
          : 100;
        const max = typeof maxValue === 'number' ? maxValue : 100;
        return Math.floor(Math.random() * max);
      
      default:
        throw new Error(`알 수 없는 노드 타입: ${(node as any).type}`);
    }
  }
  
  private async evaluateBinaryOp(node: any): Promise<RuntimeValue> {
    const left = await this.evaluateNode(node.left);
    const right = await this.evaluateNode(node.right);
    
    switch (node.operator) {
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new Error('➕ 연산자는 숫자만 지원합니다');
      
      case TokenType.MINUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }
        throw new Error('➖ 연산자는 숫자만 지원합니다');
      
      case TokenType.MULTIPLY:
        if (typeof left === 'number' && typeof right === 'number') {
          return left * right;
        }
        throw new Error('✖️ 연산자는 숫자만 지원합니다');
      
      case TokenType.DIVIDE:
        if (typeof left === 'number' && typeof right === 'number') {
          if (right === 0) {
            throw new Error('0으로 나눌 수 없습니다');
          }
          return left / right;
        }
        throw new Error('➗ 연산자는 숫자만 지원합니다');
      
      case TokenType.CONCAT:
        return String(left) + String(right);
      
      case TokenType.EQUALS:
        return left === right;
      
      case TokenType.GREATER:
        if (typeof left === 'number' && typeof right === 'number') {
          return left > right;
        }
        throw new Error('⬆️ 연산자는 숫자만 지원합니다');
      
      case TokenType.LESS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left < right;
        }
        throw new Error('⬇️ 연산자는 숫자만 지원합니다');
      
      default:
        throw new Error(`알 수 없는 연산자: ${node.operator}`);
    }
  }
  
  private isTruthy(value: RuntimeValue): boolean {
    if (value === null || value === false) return false;
    if (value === 0 || value === '') return false;
    return true;
  }
}