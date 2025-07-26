import React, { useState,useRef, useEffect } from "react";
import { callGemini } from "./utils/GeminiAPI";
import EmojiPicker from "emoji-picker-react";
import './Chatbot.css';
const ChatBot = () => {
const [input, setInput] = useState("");
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);
const [isTyping, setIsTyping] = useState(false);
const [improvedText, setImprovedText] = useState("");
const [showTooltip, setShowTooltip] = useState(false);
const [status, setStatus] = useState("");
const [linkedinURL, setLinkedinURL] = useState("");
const [promptHistory, setPromptHistory] = useState([]);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [focus, setFocus] = useState("Relaxed");
const [responseStyle, setResponseStyle] = useState("Professional");
const [conversationLength, setConversationLength] = useState("Short");
const [wordLimit, setWordLimit] = useState("100 words");
const textareaRef = useRef(null);
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
  }
}, [input]);
function cleanMarkdown(text) {
return text
.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
.replace(/\*(.*?)\*/g, '<em>$1</em>')             // italic
.replace(/\n/g, '<br>');                          // line breaks
}
const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Prevents new line
    handleSend();
  }
};

const handleLinkedInQuestions = async () => {
if (!linkedinURL.trim()) {
alert("Please paste a LinkedIn job link first!");
return;
}
setLoading(true);
setIsTyping(true);
setStatus("Analyzing LinkedIn Job...");
// Mock job description for demo
const jobDescription = `
Job Title: Frontend Developer
Responsibilities: Build UI using React, integrate APIs, optimize performance.
Requirements: JavaScript, React.js, CSS, REST APIs.
Company: TechCorp Innovations
`;
const prompt = `
You are a helpful AI interview coach.
Based on the following job description, generate 5 interview questions to help a candidate prepare.
---
${jobDescription}
---
Format:
1. Question?
2. Question?
`;
try {
const questions = await callGemini(prompt);
setMessages((prev) => [
...prev,
{
sender: "bot",
text:
"📄 Based on the LinkedIn job, here are some interview questions:\n" +
cleanMarkdown(questions.trim())
}
]);
} catch (error) {
setMessages((prev) => [
...prev,
{
sender: "bot",
text: "❌ Failed to generate questions from the LinkedIn job link."
}
]);
}
setIsTyping(false);
setLoading(false);
setStatus("");
};
// Image Upload Handler
const handleImageUpload = (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
const imageUrl = reader.result;
setMessages((prev) => [
...prev,
{ sender: "user", text: `<img src="${imageUrl}" alt="uploaded image" style="max-width: 200px; border-radius: 8px;" />` },
]);
setInput(""); // Clear input
handleSend(imageUrl); // Optionally send image content
};
reader.readAsDataURL(file);
};
// Emoji Picker Handler (just inserts a smiley for now)
const handleEmojiPicker = () => {
setShowEmojiPicker((prev) => !prev);
};
const handleEmojiClick = (emojiData) => {
setInput((prevInput) => prevInput + emojiData.emoji);
};
const handleSend = async () => {
if (input.trim() === "" || isTyping) return;
const userMsg = { sender: "user", text: input };
setMessages((prev) => [...prev, userMsg]);
setInput("");
setLoading(true);
setIsTyping(true);
setStatus("Thinking...");
const history = messages
.map((msg) => `${msg.sender === "user" ? "You" : "Gemini"}: ${msg.text}`)
.join("\n");
const fullPrompt = `Focus: ${focus}\nStyle: ${responseStyle}\nLength: ${conversationLength}\nLimit: ${wordLimit}\n\n${history}\nYou: ${input}\nGemini:`;
try {
const reply = await callGemini(fullPrompt);
const botReply = cleanMarkdown(reply);
setMessages((prev) => [...prev, { sender: "bot", text: "" }]);
let index = 0;
const interval = setInterval(() => {
index++;
setMessages((prev) => {
const updated = [...prev];
const lastIndex = updated.length - 1;
if (updated[lastIndex]?.sender === "bot") {
updated[lastIndex].text = botReply.slice(0, index);
}
return updated;
});
if (index >= botReply.length) {
clearInterval(interval);
setLoading(false);
setIsTyping(false);
setStatus("");
} else {
setStatus("Typing...");
}
}, 20);
} catch (error) {
setMessages((prev) => [
...prev,
{ sender: "bot", text: "❌ Gemini failed to respond." },
]);
setLoading(false);
setIsTyping(false);
setStatus("");
}
};
const handleImprove = async () => {
  if (!input.trim() || isTyping) return;

  const context = messages
    .map(msg => `${msg.sender === 'user' ? 'User' : 'Gemini'}: ${msg.text}`)
    .join('\n');

  const improvementPrompt = `
You are an expert prompt rewriter.

Your job is to improve the user's next prompt to be clearer, more effective, and precise. Base it on the conversation so far, but do not alter the intent.

Return only the improved version. No explanation, markdown, or extra formatting.

--- Chat History ---
${context}

--- Original Prompt ---
${input}

--- Improved Prompt ---
`;

  try {
    const improved = await callGemini(improvementPrompt);
    setImprovedText(cleanMarkdown(improved.trim()));
    setShowTooltip(true);
  } catch (error) {
    alert("⚠️ Failed to improve message.");
  }
};

const handleAcceptImproved = () => {
setInput(cleanMarkdown(improvedText)); // Set as input
setPromptHistory(prev => [...prev, improvedText]); // Save to history
setImprovedText(""); // Clear current improved prompt
};
const handleRejectImproved = () => {
setPromptHistory(prev => [...prev, improvedText]); // Still save to history
setImprovedText(""); // Clear current improved prompt
};
return (
<div className="chat-layout">
{/* 📍 Left Sidebar */}
<div className="left-sidebar">
   <h3>🎯 Focus</h3>
   <select value={focus} onChange={e => setFocus(e.target.value)}>
      <option>Relaxed</option>
      <option>Corporate Office</option>
      <option>Schoolwork</option>
   </select>
   <h3>🎨 Response Style</h3>
   <select value={responseStyle} onChange={e => setResponseStyle(e.target.value)}>
      <option>Professional</option>
      <option>Casual</option>
      <option>Like a friend</option>
      <option>Full of emojis</option>
      <option>Gen Z slang</option>
      <option>Advertisement</option>
   </select>
   <h3>📏 Conversation Length</h3>
   <select value={conversationLength} onChange={e => setConversationLength(e.target.value)}>
      <option>Short</option>
      <option>Medium</option>
      <option>Long</option>
   </select>
   <h3>🔢 Word Limit</h3>
   <select value={wordLimit} onChange={e => setWordLimit(e.target.value)}>
      <option>50 words</option>
      <option>100 words</option>
      <option>200 words</option>
      <option>Unlimited</option>
   </select>
   <h3>🔗 LinkedIn Job Link</h3>
   <input
      type="text"
      placeholder="Paste LinkedIn job URL"
      className="linkedin-input"
      value={linkedinURL}
      onChange={(e) => setLinkedinURL(e.target.value)}
   />
   <button className="linkedin-btn" onClick={handleLinkedInQuestions}>
   Generate Interview Questions
   </button>
   <h3>⚙️ Power Tools</h3>
   <ul>
      <li>✨ Rephrase My Resume Bullet</li>
      <li>💡 Idea Generator</li>
      <li>🎓 College Assignment Helper Mode</li>
   </ul>
</div>

{/* 💬 Chat Main */}
<div className="chat-container">
   <h2 className="chat-title gradient-text">💬 Hello Himanshu</h2>
   <div className="chat-history">
      {messages.map((msg, idx) => (
      <div
      key={idx}
      className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}
      style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start" }}
      dangerouslySetInnerHTML={{ __html: msg.text }}
      />
      ))}
      {loading && (
      <div className="message-bubble bot-bubble loader-bubble">
         <span className="typing-dots">{status}<span className="dot-anim"></span></span>
         <button onClick={() => setIsTyping(false)} className="stop-button" title="Stop response">⏹</button>
      </div>
      )}
   </div>
   <div className="chat-input-container">
  <textarea
  ref={textareaRef}
  rows="1"
  value={input}
  onChange={e => setInput(e.target.value)}
  onKeyDown={e => {
    if (e.key === "Enter" && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSend();
    }
  }}
  placeholder={isTyping ? "Please wait for Gemini..." : "Type your message..."}
  className="chat-input"
  disabled={isTyping && loading}
/>


  <label htmlFor="image-upload" className="image-upload" title="Upload Image">
    🖼️
  </label>
  <input
  type="file"
  id="image-upload"
  accept="image/*"
  onChange={handleImageUpload}
  style={{ display: 'none' }}
/>


  <button
    type="button"
    className="emoji-button"
    onClick={handleEmojiPicker}
    title="Insert Emoji"
  >
    😊
  </button>
<div className="emoji-picker-container">
  {showEmojiPicker && (
    <div className="emoji-picker-wrapper">
      <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
    </div>
  )}
</div>

  <button
    type="button"
    className="send-button"
    onClick={handleSend}
    disabled={isTyping && loading}
    title="Send Message"
  >
    {isTyping ? "..." : "Send"}
  </button>
</div>
</div>
{/* ✨ Prompt Improvement Box */}
<div className="chat-sidebar">
  <h3 className="prompt-header">🧠 Prompt Improvement</h3>

  {/* 🪄 Improve Prompt Button */}
  {input.trim() && (
    <button
      onClick={handleImprove}
      className="improve-btn"
      title="Rewrite your prompt with AI help"
    >
      🪄 Improve Prompt
    </button>
  )}

  {/* Improved Prompt Display */}
  {improvedText && (
    <div className="improved-box fade-in">
      <p className="label">✨ Improved Prompt:</p>
      <div
        className="improved-text"
        dangerouslySetInnerHTML={{ __html: improvedText }}
      />
      <div className="prompt-actions">
        <button onClick={handleAcceptImproved} className="accept-btn">
          ✅ Use
        </button>
        <button onClick={handleRejectImproved} className="reject-btn">
          ❌ Discard
        </button>
      </div>
    </div>
  )}

  {/* Tooltip Hint (when there's no improvedText) */}
  {!improvedText && (
    <div className="tooltip-hint fade-in">
      <p>
        <span className="emoji">🪄</span>{" "}
        <i>Click the wand to rewrite your message with AI help.</i>
      </p>
      <p className="description">
        Gemini will suggest clearer prompts based on your current text +
        chat history.
      </p>
    </div>
  )}

  {/* Prompt History */}
  {promptHistory.length > 0 && (
    <div className="history-section fade-in">
      <h4 className="history-title">🕘 Previous Suggestions</h4>
      <ul className="history-list">
        {promptHistory.map((prompt, idx) => (
          <li
            key={idx}
            className="history-item"
            dangerouslySetInnerHTML={{ __html: prompt }}
          />
        ))}
      </ul>
    </div>
  )}
</div>

</div>
);
};
export default ChatBot;