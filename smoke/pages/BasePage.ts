import type { Page } from "@playwright/test";

export abstract class BasePage {
  constructor(protected page: Page) {}

  abstract goto(): Promise<void>;
  abstract waitForLoad(): Promise<void>;
}
