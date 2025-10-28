// 브라우저용 EmojiScript 인터프리터

class EmojiScriptWeb {
    constructor() {
        this.variables = new Map();
        this.output = [];
    }

    tokenize(code) {
        const tokens = [];
        let pos = 0;
        let line = 1;

        const emojiMap = {
            '📦': 'VAR', '📢': 'PRINT', '➕': 'PLUS', '➖': 'MINUS',
            '✖️': 'MULTIPLY', '➗': 'DIVIDE', '🔗': 'CONCAT',
            '❓': 'IF', '➡️': 'THEN', '🔁': 'LOOP', '🛑': 'STOP',
            '🎲': 'RANDOM', '🟰': 'EQUALS', '⬆️': 'GREATER', '⬇️': 'LESS',
            '✅': 'TRUE', '❌': 'FALSE', '💭': 'COMMENT'
        };

        while (pos < code.length) {
            let char = code[pos];

            // 공백 건너뛰기
            if (char === ' ' || char === '\t' || char === '\r') {
                pos++;
                continue;
            }

            // 줄바꿈
            if (char === '\n') {
                tokens.push({ type: 'NEWLINE', value: '\n', line });
                line++;
                pos++;
                continue;
            }

            // 주석
            if (char === '💭') {
                while (pos < code.length && code[pos] !== '\n') {
                    pos++;
                }
                continue;
            }

            // 이모지 토큰
            if (emojiMap[char]) {
                tokens.push({ type: emojiMap[char], value: char, line });
                pos++;
                continue;
            }

            // 문자열
            if (char === '"') {
                let str = '';
                pos++;
                while (pos < code.length && code[pos] !== '"') {
                    str += code[pos];
                    pos++;
                }
                if (pos < code.length) pos++; // closing "
                tokens.push({ type: 'STRING', value: str, line });
                continue;
            }

            // 숫자
            if (char >= '0' && char <= '9') {
                let num = '';
                while (pos < code.length && (code[pos] >= '0' && code[pos] <= '9' || code[pos] === '.')) {
                    num += code[pos];
                    pos++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(num), line });
                continue;
            }

            // 식별자
            let identifier = '';
            while (pos < code.length && code[pos] !== ' ' && code[pos] !== '\n' && 
                   !emojiMap[code[pos]]) {
                identifier += code[pos];
                pos++;
            }
            if (identifier) {
                tokens.push({ type: 'ID', value: identifier, line });
            }
        }

        tokens.push({ type: 'EOF', value: null, line });
        return tokens;
    }

    parse(tokens) {
        let pos = 0;
        const statements = [];

        const peek = () => tokens[pos];
        const advance = () => tokens[pos++];
        const skipNewlines = () => {
            while (peek().type === 'NEWLINE') advance();
        };

        const parseExpression = () => {
            let left = parsePrimary();

            while (['PLUS', 'MINUS', 'MULTIPLY', 'DIVIDE', 'CONCAT', 
                    'EQUALS', 'GREATER', 'LESS'].includes(peek().type)) {
                const op = advance().type;
                const right = parsePrimary();
                left = { type: 'BinaryOp', operator: op, left, right };
            }

            return left;
        };

        const parsePrimary = () => {
            const token = peek();

            if (token.type === 'NUMBER') {
                advance();
                return { type: 'Number', value: token.value };
            }

            if (token.type === 'STRING') {
                advance();
                return { type: 'String', value: token.value };
            }

            if (token.type === 'TRUE') {
                advance();
                return { type: 'Boolean', value: true };
            }

            if (token.type === 'FALSE') {
                advance();
                return { type: 'Boolean', value: false };
            }

            if (token.type === 'ID') {
                advance();
                return { type: 'Variable', name: token.value };
            }

            if (token.type === 'RANDOM') {
                advance();
                const max = peek().type !== 'NEWLINE' && peek().type !== 'EOF' 
                    ? parseExpression() 
                    : { type: 'Number', value: 100 };
                return { type: 'Random', max };
            }

            throw new Error(`예상치 못한 토큰: ${token.type} (줄 ${token.line})`);
        };

        while (peek().type !== 'EOF') {
            skipNewlines();
            if (peek().type === 'EOF') break;

            const token = peek();

            if (token.type === 'VAR') {
                advance();
                const name = advance();
                if (name.type !== 'ID') {
                    throw new Error(`변수명이 필요합니다 (줄 ${token.line})`);
                }
                const value = parseExpression();
                statements.push({ type: 'Assignment', name: name.value, value });
            } else if (token.type === 'PRINT') {
                advance();
                const value = parseExpression();
                statements.push({ type: 'Print', value });
            } else if (token.type === 'IF') {
                advance();
                const condition = parseExpression();
                if (peek().type !== 'THEN') {
                    throw new Error(`➡️가 필요합니다 (줄 ${token.line})`);
                }
                advance();
                skipNewlines();

                const body = [];
                while (peek().type !== 'STOP' && peek().type !== 'EOF') {
                    skipNewlines();
                    if (peek().type === 'STOP' || peek().type === 'EOF') break;

                    if (peek().type === 'VAR') {
                        advance();
                        const name = advance();
                        const value = parseExpression();
                        body.push({ type: 'Assignment', name: name.value, value });
                    } else if (peek().type === 'PRINT') {
                        advance();
                        const value = parseExpression();
                        body.push({ type: 'Print', value });
                    }
                    skipNewlines();
                }

                if (peek().type === 'STOP') advance();
                statements.push({ type: 'If', condition, body });
            } else if (token.type === 'LOOP') {
                advance();
                const count = parseExpression();
                skipNewlines();

                const body = [];
                while (peek().type !== 'STOP' && peek().type !== 'EOF') {
                    skipNewlines();
                    if (peek().type === 'STOP' || peek().type === 'EOF') break;

                    if (peek().type === 'VAR') {
                        advance();
                        const name = advance();
                        const value = parseExpression();
                        body.push({ type: 'Assignment', name: name.value, value });
                    } else if (peek().type === 'PRINT') {
                        advance();
                        const value = parseExpression();
                        body.push({ type: 'Print', value });
                    }
                    skipNewlines();
                }

                if (peek().type === 'STOP') advance();
                statements.push({ type: 'Loop', count, body });
            }

            skipNewlines();
        }

        return statements;
    }

    async evaluate(node) {
        switch (node.type) {
            case 'Number':
            case 'String':
            case 'Boolean':
                return node.value;

            case 'Variable':
                if (!this.variables.has(node.name)) {
                    throw new Error(`변수 '${node.name}'을 찾을 수 없습니다`);
                }
                return this.variables.get(node.name);

            case 'Assignment':
                const value = await this.evaluate(node.value);
                this.variables.set(node.name, value);
                return value;

            case 'Print':
                const printValue = await this.evaluate(node.value);
                this.output.push(String(printValue));
                return null;

            case 'BinaryOp':
                const left = await this.evaluate(node.left);
                const right = await this.evaluate(node.right);

                switch (node.operator) {
                    case 'PLUS': return left + right;
                    case 'MINUS': return left - right;
                    case 'MULTIPLY': return left * right;
                    case 'DIVIDE': 
                        if (right === 0) throw new Error('0으로 나눌 수 없습니다');
                        return left / right;
                    case 'CONCAT': return String(left) + String(right);
                    case 'EQUALS': return left === right;
                    case 'GREATER': return left > right;
                    case 'LESS': return left < right;
                }
                break;

            case 'If':
                const condition = await this.evaluate(node.condition);
                if (condition) {
                    for (const stmt of node.body) {
                        await this.evaluate(stmt);
                    }
                }
                return null;

            case 'Loop':
                const countValue = await this.evaluate(node.count);
                const count = Math.floor(countValue);
                for (let i = 0; i < count; i++) {
                    for (const stmt of node.body) {
                        await this.evaluate(stmt);
                    }
                }
                return null;

            case 'Random':
                const maxValue = await this.evaluate(node.max);
                return Math.floor(Math.random() * maxValue);
        }
    }

    async run(code) {
        this.variables.clear();
        this.output = [];

        try {
            const tokens = this.tokenize(code);
            const ast = this.parse(tokens);

            for (const node of ast) {
                await this.evaluate(node);
            }

            return { success: true, output: this.output };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// 전역 인스턴스
const interpreter = new EmojiScriptWeb();

function insertEmoji(emoji) {
    const editor = document.getElementById('code-editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    
    editor.value = text.substring(0, start) + emoji + text.substring(end);
    editor.selectionStart = editor.selectionEnd = start + emoji.length;
    editor.focus();
}

async function runCode() {
    const code = document.getElementById('code-editor').value;
    const outputDiv = document.getElementById('output');

    outputDiv.innerHTML = '<span class="info">🚀 실행 중...</span>\n\n';

    const result = await interpreter.run(code);

    if (result.success) {
        if (result.output.length === 0) {
            outputDiv.innerHTML = '<span class="info">출력이 없습니다.</span>';
        } else {
            outputDiv.innerHTML = '<span class="success">✅ 실행 완료!</span>\n\n' +
                result.output.join('\n');
        }
    } else {
        outputDiv.innerHTML = '<span class="error">❌ 오류 발생!</span>\n\n' +
            '<span class="error">' + result.error + '</span>';
    }
}

function clearEditor() {
    document.getElementById('code-editor').value = '';
    document.getElementById('output').innerHTML = '실행 결과가 여기에 표시됩니다...';
}

function loadExample() {
    const examples = [
        `💭 예제 1: 인사하기
📦 이름 "철수"
📢 "안녕하세요, " 🔗 이름 🔗 "님!"`,
        
        `💭 예제 2: 계산기
📦 a 10
📦 b 5
📢 "더하기: " 🔗 a ➕ b
📢 "곱하기: " 🔗 a ✖️ b`,
        
        `💭 예제 3: 반복문
📢 "별 출력하기:"
🔁 5
  📢 "⭐"
🛑`,
        
        `💭 예제 4: 조건문
📦 점수 85
❓ 점수 ⬆️ 80 ➡️
  📢 "🎉 합격!"
🛑`,
        
        `💭 예제 5: 랜덤 게임
📢 "🎲 주사위 굴리기!"
📦 주사위 🎲 6
📢 "결과: " 🔗 주사위`
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    document.getElementById('code-editor').value = randomExample;
}

// 키보드 단축키
document.getElementById('code-editor').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
});