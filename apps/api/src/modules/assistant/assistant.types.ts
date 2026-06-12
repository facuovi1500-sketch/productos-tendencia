export type AssistantIntent =
  | "CREATE_INQUIRY"
  | "CREATE_ORDER"
  | "UPDATE_CASH"
  | "REGISTER_DEPOSIT"
  | "MARK_ORDER_DELIVERED"
  | "MARK_INQUIRY_LOST";

export type AssistantPreview = {
  title: string;
  summary: string;
  fields: Record<string, string | number | null>;
  warnings: string[];
  missingFields: string[];
};

export type AssistantAction = {
  type: AssistantIntent;
  payload: Record<string, unknown>;
};

export type AssistantInterpretResponse = {
  intent: AssistantIntent;
  confidence: number;
  requiresConfirmation: true;
  canConfirm: boolean;
  preview: AssistantPreview;
  action: AssistantAction;
};

export type AssistantConfirmRequest = {
  intent: AssistantIntent;
  payload: Record<string, unknown>;
};
