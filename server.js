import express from "express";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/generate", limiter, async (req, res) => {
  try {
    const { kind, topic, tone } = req.body || {};
    if (typeof topic !== "string" || topic.trim().length < 2 || topic.length > 1200) {
      return res.status(400).json({ error: "Informe um tema entre 2 e 1.200 caracteres." });
    }
    const allowed = ["Frase de reflexão","Legenda para redes sociais","Roteiro curto para vídeo","Conteúdo de vendas","Ideias de conteúdo","Prompt para gerar imagem"];
    const safeKind = allowed.includes(kind) ? kind : "Conteúdo para redes sociais";
    const prompt = `Você é o Criador IA, um assistente especialista em conteúdo original para redes sociais em português brasileiro.
Crie: ${safeKind}.
Tema e contexto do usuário: ${topic.trim()}
Estilo desejado: ${String(tone || "Claro e envolvente").slice(0,100)}
Entregue um resultado original, bem escrito, útil e pronto para adaptar/publicar. Siga exatamente o tipo de conteúdo solicitado. Não invente fatos, resultados ou garantias.`;
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: prompt
    });
    res.json({ text: response.output_text || "" });
  } catch (err) {
    console.error("Falha na geração:", err?.message || err);
    res.status(500).json({ error: "Erro ao gerar conteúdo. Confira a configuração da API e tente novamente." });
  }
});

app.get("/health", (_req,res)=>res.json({ok:true}));
const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Criador IA ativo na porta ${port}`));
