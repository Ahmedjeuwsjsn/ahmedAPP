
export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string;
  tips: string;
}

export interface AnalysisResponse {
  identifiedIngredients: string[];
  recipes: Recipe[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
