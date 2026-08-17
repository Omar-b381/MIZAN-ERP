import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";
import "../i18n/config";

describe("Mizan ERP Scaffold Shell", () => {
  it("renders the application title in Arabic by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "ميزان ERP" })).toBeInTheDocument();
  });

  it("renders dashboard and module navigation elements", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "لوحة التحكم" })).toBeInTheDocument();
    expect(screen.getAllByText("إدارة الوحدات").length).toBeGreaterThan(0);
  });

  it("displays Phase 3 footer badge", () => {
    render(<App />);
    expect(screen.getByText(/Mizan ERP v0.3 • Phase 3/i)).toBeInTheDocument();
  });
});
