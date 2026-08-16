import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { UiErrorNotice } from "../src/components/UiErrorNotice";

test("keeps technical detail opt-in and exposes recovery", () => {
  let retries = 0;
  render(
    <UiErrorNotice
      error={{ scope: "resources:configs", summary: "settings.xml could not be loaded", detail: "invoke unavailable" }}
      onRetry={() => { retries += 1; }}
    />,
  );
  expect(screen.getByText("settings.xml could not be loaded")).toBeInTheDocument();
  expect(screen.getByText("Technical details")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retries).toBe(1);
});
