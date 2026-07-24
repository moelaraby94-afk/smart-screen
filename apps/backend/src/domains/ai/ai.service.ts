import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AiGenerateInput = {
  workspaceId: string;
  prompt: string;
  type: 'TEXT' | 'IMAGE_IDEA' | 'PLAYLIST_NAME' | 'SCHEDULE_SUGGESTION';
};

export type AiGenerateResult = {
  content: string;
  type: string;
  model: string;
};

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    const key = this.config.get<string>('OPENAI_API_KEY')?.trim();
    return Boolean(key);
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      return {
        content: this.fallbackResponse(input),
        type: input.type,
        model: 'fallback',
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(input.type);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        await res.text();
        return {
          content: `AI generation failed (${res.status}). ${this.fallbackResponse(input)}`,
          type: input.type,
          model: 'error',
        };
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        model: string;
      };

      return {
        content: data.choices[0]?.message?.content ?? '',
        type: input.type,
        model: data.model,
      };
    } catch {
      return {
        content: this.fallbackResponse(input),
        type: input.type,
        model: 'fallback',
      };
    }
  }

  private buildSystemPrompt(type: AiGenerateInput['type']): string {
    switch (type) {
      case 'TEXT':
        return 'You are a digital signage content writer. Generate concise, engaging text for display screens. Keep it short and impactful.';
      case 'IMAGE_IDEA':
        return 'You are a digital signage creative director. Suggest visual content ideas for display screens.';
      case 'PLAYLIST_NAME':
        return 'You are a digital signage organizer. Suggest a short, descriptive name for a playlist based on the user description.';
      case 'SCHEDULE_SUGGESTION':
        return 'You are a digital signage scheduling assistant. Suggest optimal scheduling times based on the user description.';
      default:
        return 'You are a helpful digital signage assistant.';
    }
  }

  private fallbackResponse(input: AiGenerateInput): string {
    switch (input.type) {
      case 'TEXT':
        return input.prompt.slice(0, 100);
      case 'PLAYLIST_NAME':
        return 'New Playlist';
      case 'SCHEDULE_SUGGESTION':
        return 'Consider scheduling during peak hours (9am-5pm) on weekdays.';
      default:
        return 'AI service not configured. Set OPENAI_API_KEY to enable.';
    }
  }
}
