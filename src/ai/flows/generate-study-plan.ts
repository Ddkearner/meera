'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized study plans for students.
 *
 * @exports {
 *   generateStudyPlan: function - An async function that takes GenerateStudyPlanInput and returns a GenerateStudyPlanOutput.
 *   GenerateStudyPlanInput: type - The input type for the generateStudyPlan function.
 *   GenerateStudyPlanOutput: type - The output type for the generateStudyPlan function.
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyPlanInputSchema = z.object({
  courses: z
    .string()
    .describe('A comma-separated list of courses to study for.'),
  availableTime: z
    .string()
    .describe(
      'The amount of time available for studying, e.g., 2 hours per day.'
    ),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const GenerateStudyPlanOutputSchema = z.object({
  studyPlan: z
    .string()
    .describe('A personalized study plan based on the courses and available time.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const generateStudyPlanPrompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: {schema: GenerateStudyPlanInputSchema},
  output: {schema: GenerateStudyPlanOutputSchema},
  prompt: `You are a helpful AI assistant that generates personalized study plans for students.

  Based on the courses and available time provided, create a study plan that is effective and efficient.

  Courses: {{{courses}}}
  Available Time: {{{availableTime}}}

  Study Plan:
  `,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await generateStudyPlanPrompt(input);
    return output!;
  }
);
