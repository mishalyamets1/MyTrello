
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:latest'

type ChatMessage = {role: 'system' | 'user' | 'assistant'; content: string}

export async function ollamaChat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages,
            stream: false
        })
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Ollama error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const content = data.message?.content?.trim()

    if (!content) {
        throw new Error('Ollama returned empty response')
    } 
    return content
}