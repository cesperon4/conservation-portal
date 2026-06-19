export type ProgramStatusCreateInput = {
  sortOrder: number;
  adminStepNumber: string;
  customerStepNumber: string;
  name: string;
  customerName?: string;
  description?: string;
  milestone?: boolean;
  daysBeforeAlert?: number;
};

export function buildProgramStatusInput(
  overrides: Partial<ProgramStatusCreateInput> = {},
): ProgramStatusCreateInput {
  return {
    sortOrder: 1,
    adminStepNumber: "1",
    customerStepNumber: "1",
    name: "Application Submitted",
    customerName: "Submitted",
    description: "Customer has submitted an application for review.",
    milestone: true,
    ...overrides,
  };
}
