import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';

export interface PronunciationResult {
  overallScore: number;
  clarityScore: number;
  accuracyScore: number;
  fluencyScore: number;
  feedback: string;
  improvements: Array<{ text: string; suggestion: string }>;
}

@Injectable()
export class PronunciationService {
  private readonly logger = new Logger(PronunciationService.name);

  constructor(private readonly provider: OpenRouterProvider) {}

  async evaluate(spokenText: string, expectedText?: string): Promise<PronunciationResult> {
    const context = expectedText
      ? `\nTexte attendu: "${expectedText}"\nTexte prononcé: "${spokenText}"`
      : `\nTexte prononcé: "${spokenText}"`;

    const { content } = await this.provider.chat({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en phonétique et prononciation du français. Évalue la prononciation d'un apprenant à partir du texte transcrit par reconnaissance vocale.

Retourne UNIQUEMENT un objet JSON valide avec :
- overallScore (nombre 0-100): score global
- clarityScore (nombre 0-100): clarté et intelligibilité
- accuracyScore (nombre 0-100): précision phonétique (liaisons, voyelles, consonnes)
- fluencyScore (nombre 0-100): fluidité et rythme
- feedback (string): retour constructif en français (2-3 phrases)
- improvements (tableau d'objets avec: text, suggestion) : points spécifiques à améliorer

Analyse les indices dans le texte transcrit :
- Les erreurs de liaison (ex: "les_amis" prononcé sans liaison)
- Les confusions de voyelles (ex: "peu" vs "peux", "dessus" vs "dessous")
- Les omissions de lettres ou syllabes
- Les hésitations marquées par des répétitions ou coupures
- La fluidité générale du discours`,
        },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(content);
    return {
      overallScore: parsed.overallScore ?? 70,
      clarityScore: parsed.clarityScore ?? 70,
      accuracyScore: parsed.accuracyScore ?? 70,
      fluencyScore: parsed.fluencyScore ?? 70,
      feedback: parsed.feedback ?? '',
      improvements: parsed.improvements ?? [],
    };
  }
}
