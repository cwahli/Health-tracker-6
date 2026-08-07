import re

content = """
export interface LLMModel {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI';
  description: string;
  isDefault?: boolean;
}

export const AVAILABLE_LLMS: LLMModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast and cost-effective model for general multimodal tasks.',
    isDefault: true
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Advanced model for complex reasoning and long-context analysis.'
  }
];
"""

with open('src/utils/llm.ts', 'w') as f:
    f.write(content)
