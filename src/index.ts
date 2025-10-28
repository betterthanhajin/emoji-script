import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';

export async function runEmojiScript(code: string): Promise<string[]> {
  try {
    // 1. Lexical Analysis (토큰화)
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    // 2. Parsing (구문 분석)
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    // 3. Interpretation (실행)
    const interpreter = new Interpreter();
    const output = await interpreter.evaluate(ast);
    
    return output;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`실행 오류: ${error.message}`);
    }
    throw error;
  }
}

// CLI로 실행할 때
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('사용법: npm start <파일명.emo>');
    console.log('\n예제 프로그램:');
    console.log('================');
    console.log('📦 이름 "철수"');
    console.log('📢 "안녕하세요!" 🔗 이름');
    console.log('');
    console.log('📦 나이 25');
    console.log('📢 "나이: " 🔗 나이');
    console.log('');
    console.log('🔁 3');
    console.log('  📢 "반복!"');
    console.log('🛑');
    return;
  }
  
  const filename = args[0];
  
  try {
    const code = fs.readFileSync(filename, 'utf-8');
    console.log('🚀 EmojiScript 실행 중...\n');
    
    await runEmojiScript(code);
    
    console.log('\n✅ 실행 완료!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ 오류:', error.message);
    }
    process.exit(1);
  }
}

// 모듈로 사용될 때와 직접 실행될 때를 구분
if (require.main === module) {
  main();
}

export { Lexer, Parser, Interpreter };