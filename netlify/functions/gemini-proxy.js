// netlify/functions/gemini-proxy.js
//
// 這個 function 是瀏覽器跟 Gemini API 之間的代理層：
// 瀏覽器 -> 這個 function（伺服器端執行，沒有CORS問題）-> Gemini API（含 Google Search grounding）
// API key 存在 Netlify 環境變數（GEMINI_API_KEY）裡，永遠不會出現在前端程式碼或瀏覽器中。

const GEMINI_MODEL = 'gemini-2.5-flash';

exports.handler = async function (event) {
  // 瀏覽器送 OPTIONS 預檢請求時，先回應允許
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method Not Allowed，請用 POST' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return respond(500, { error: '伺服器未設定 GEMINI_API_KEY，請到 Netlify 後台設定環境變數' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return respond(400, { error: '請求格式不是合法的 JSON' });
  }

  // 前端送來的格式是 { messages: [{ role:'user', content: '...prompt文字...' }] }
  const userMessage = (payload.messages || []).map(function (m) { return m.content; }).join('\n');
  if (!userMessage) {
    return respond(400, { error: '缺少 messages 欄位' });
  }

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    tools: [{ google_search: {} }]
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(geminiBody)
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return respond(upstream.status, { error: 'Gemini API 回應錯誤', detail: data });
    }

    // 把 Gemini 的回應格式，轉換成前端原本預期的 Claude 格式：
    // { content: [{ type: 'text', text: '...' }] }
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.map(function (p) { return p.text || ''; }).join('\n');

    return respond(200, { content: [{ type: 'text', text: text }] });
  } catch (err) {
    return respond(502, { error: '呼叫 Gemini API 失敗', detail: String(err) });
  }
};

function corsHeaders() {
  return {
    // 部署後建議把 * 換成你自己的網域，例如 'https://your-site.netlify.app'
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function respond(statusCode, bodyObj) {
  return {
    statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
    body: JSON.stringify(bodyObj)
  };
}
