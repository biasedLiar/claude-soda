export const ACCURACY_TOOLTIP =
  'Percentage of sodas correctly identified across all competitions.';

export const ADJUSTED_ACCURACY_TOOLTIP =
  'Accuracy adjusted for the chance level in each competition: (accuracy − 1/N) ÷ (1 − 1/N), where N = number of sodas. 0% = guessing at random, 100% = perfect, negative = worse than random. Averaged across competitions.';

export const ID_RATE_TOOLTIP =
  'Percentage of tastings where this soda was correctly identified.';

export const ADJUSTED_ID_RATE_TOOLTIP =
  'ID rate adjusted for the chance level per competition: (accuracy − 1/N) ÷ (1 − 1/N), where N = number of sodas. 0% = guessing at random, 100% = perfect, negative = identified less often than random chance.';

export const AVG_TASTE_WHEN_GUESSED_TOOLTIP =
  'Average taste score given when someone guesses this soda — regardless of whether they were right.';
