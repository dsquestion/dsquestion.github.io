// ==================== 请修改以下两行 ====================
// 替换成你的 Cloudflare Worker 网址
const PROXY_URL = "https://deepseek-proxy.2118805206.workers.dev";
// 替换成你在 Worker 里设置的密码
const PROXY_PASSWORD = "mySecret123";
// ========================================================

// DOM 元素绑定
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// 记录对话历史（实现上下文功能）
let conversationHistory = [
    { role: "system", content: "你是一个乐于助人的助手，请用中文回答。" }
];

// 添加消息到界面
function addMessageToUI(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = content;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示"正在输入..."
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message';
    typingDiv.id = 'typingIndicator';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = '正在思考...';
    typingDiv.appendChild(bubble);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// 发送消息核心逻辑
async function sendMessage() {
    const userMessageText = userInput.value.trim();
    if (!userMessageText) return;
    
    userInput.value = '';
    sendBtn.disabled = true;
    userInput.style.height = 'auto';
    
    addMessageToUI('user', userMessageText);
    conversationHistory.push({ role: "user", content: userMessageText });
    showTypingIndicator();
    
    try {
        // 调用安全的代理（不是直接调用 DeepSeek）
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': PROXY_PASSWORD
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: conversationHistory,
                stream: false
            })
        });
        
        removeTypingIndicator();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const assistantReply = data.choices[0].message.content;
        
        addMessageToUI('assistant', assistantReply);
        conversationHistory.push({ role: "assistant", content: assistantReply });
        
        // 限制历史长度
        if (conversationHistory.length > 20) {
            conversationHistory = [
                conversationHistory[0],
                ...conversationHistory.slice(-19)
            ];
        }
        
    } catch (error) {
        removeTypingIndicator();
        console.error("API 调用错误:", error);
        addMessageToUI('assistant', `发生错误: ${error.message}。请检查网络或配置。`);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// 绑定事件
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});