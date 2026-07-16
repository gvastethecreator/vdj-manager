import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { UiErrorNotice } from "../src/components/UiErrorNotice";

test("keeps technical detail opt-in and exposes recovery", () => {
  let retries = 0;
  render(
    <UiErrorNotice
      error={{ scope: "resources:configs", summary: "No se pudo cargar settings.xml", detail: "invoke unavailable" }}
      onRetry={() => { retries += 1; }}
    />,
  );
  expect(screen.getByText("No se pudo cargar settings.xml")).toBeInTheDocument();
  expect(screen.getByText("Detalle técnico")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(retries).toBe(1);
});

