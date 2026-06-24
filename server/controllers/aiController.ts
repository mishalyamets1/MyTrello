import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ollamaChat } from "../ollama";

export const enhanceDescription = async (req: AuthRequest, res: Response) => {
    const {title, description, tags, mode} = req.body as {
        title?: string
        description?: string
        tags?: string[]
        mode?: 'generate' | 'improve'
    }

    if (!title?.trim()) {
        return res.status(400).json({success: false, error: 'title required'})
    }
    const resolvedMode = mode ?? (description?.trim() ? 'improve' : 'generate')
    const tagsText = Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'нет'

    const systemPrompt = `Ты помощник в task-менеджере.
            Отвечай на русском языке.
            Верни ТОЛЬКО текст описания задачи, без заголовков и markdown.
            Можешь немного приукрасить, но только совсем чуть-чуть текст, но приэтом не отходи от темы.`

    const userPrompt = resolvedMode === 'generate' ? `Напиши описание для задачи. Заголовок: "${title.trim()}", Теги: ${tagsText}` :
         `Улучши описание задачи, сохрани смысл и факты автора. Заголовок: ${title.trim()}, Теги: ${tagsText}, Текущее описание: ${description?.trim()}`

    try {
        const result = await ollamaChat([
            {role: 'system', content: systemPrompt},
            {role: 'user', content: userPrompt}
        ])
        res.json({success: true, data: {description: result}})
    } catch (e) {
        res.status(503).json({
            success: false,
            error: e instanceof Error ? e.message : 'Ollama unavailable'
        })
    }
        

}