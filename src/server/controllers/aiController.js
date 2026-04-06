/* global process */
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM = `You are RoadRescue AI, the official assistant for RoadRescue — an India-focused roadside assistance and emergency vehicle help service.

Help users with: towing, battery jump-starts, flat tires, fuel delivery, lockouts, and how to request help through the app. Be concise, friendly, and safety-aware (e.g. suggest moving to a safe place, emergency services for injuries).

If asked something unrelated to roadside help or the service, politely redirect or give a brief answer then offer roadside-related help.

Do not claim you can dispatch a truck or charge a card; explain they should use Emergency Request or contact support in the app.`;

const ROAD_RESCUE_KB = [
  {
    title: 'Emergency flow',
    text: 'To request help, open Emergency Request, allow GPS/location, choose service type, and submit. You can track assigned provider live on map once accepted.',
  },
  {
    title: 'Services',
    text: 'Core services include towing, battery jump start, flat tire support, fuel delivery, and lockout help.',
  },
  {
    title: 'Safety guidance',
    text: 'If your vehicle stops on road, move to a safe shoulder if possible, keep hazard lights on, and call emergency services first in case of injury.',
  },
  {
    title: 'Provider acceptance',
    text: 'A provider must accept the request before navigation/tracking is active.',
  },
  {
    title: 'Account roles',
    text: 'Customers create emergency requests. Providers receive nearby requests and can accept/ignore/complete jobs.',
  },
];

const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function scoreDoc(query, doc) {
  const q = new Set(tokenize(query));
  const d = new Set(tokenize(doc.text));
  let score = 0;
  for (const tok of q) {
    if (d.has(tok)) score += 1;
  }
  return score;
}

function retrieveContext(query) {
  return ROAD_RESCUE_KB
    .map((doc) => ({ doc, score: scoreDoc(query, doc) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => `- ${x.doc.title}: ${x.doc.text}`)
    .join('\n');
}

function toHistory(messages) {
  const hist = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.text ?? '') }],
  }));
  while (hist.length > 0 && hist[0].role !== 'user') {
    hist.shift();
  }
  return hist;
}

async function callGemini(messages, userText, contextBlock) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error('Gemini key missing');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `${SYSTEM}\n\nProject knowledge:\n${contextBlock || '- No matching internal context found.'}`,
  });

  const history = toHistory(messages);
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userText);
  return result.response.text();
}

async function callOllama(messages, userText, contextBlock) {
  const base = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  const body = {
    model,
    stream: false,
    messages: [
      {
        role: 'system',
        content: `${SYSTEM}\n\nProject knowledge:\n${contextBlock || '- No matching internal context found.'}`,
      },
      ...messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.text ?? ''),
      })),
      { role: 'user', content: userText },
    ],
  };

  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Ollama failed (${res.status}): ${txt || 'no response body'}`);
  }
  const data = await res.json();
  const text = data?.message?.content;
  if (!text) {
    throw new Error('Ollama returned empty response');
  }
  return text;
}

function preferredProvider() {
  // auto | ollama | gemini
  return (process.env.AI_PROVIDER || 'auto').toLowerCase();
}

export const aiHealth = async (req, res) => {
  const provider = preferredProvider();
  return res.json({
    success: true,
    provider,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim()),
  });
};

export const aiChat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages must be a non-empty array' });
    }

    const last = messages[messages.length - 1];
    const userText = String(last?.text ?? '').trim();
    if (last?.role !== 'user' || !userText) {
      return res.status(400).json({
        success: false,
        error: 'Last message must be from the user with non-empty text',
      });
    }

    const contextBlock = retrieveContext(userText);
    const provider = preferredProvider();

    if (provider === 'ollama') {
      const text = await callOllama(messages, userText, contextBlock);
      return res.json({ success: true, text, provider: 'ollama' });
    }
    if (provider === 'gemini') {
      const text = await callGemini(messages, userText, contextBlock);
      return res.json({ success: true, text, provider: 'gemini' });
    }

    try {
      const text = await callOllama(messages, userText, contextBlock);
      return res.json({ success: true, text, provider: 'ollama' });
    } catch (ollamaErr) {
      const text = await callGemini(messages, userText, contextBlock);
      return res.json({
        success: true,
        text,
        provider: 'gemini',
        fallback: 'ollama_failed',
        note: ollamaErr?.message || 'ollama unavailable',
      });
    }
  } catch (err) {
    console.error('aiChat error:', err?.message || err);
    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        'AI request failed. Configure AI_PROVIDER, OLLAMA_BASE_URL, or GEMINI_API_KEY.',
    });
  }
};
