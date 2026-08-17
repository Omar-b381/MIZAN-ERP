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

  it("displays v1.0 Enterprise Edition footer badge", () => {
    render(<App />);
    expect(screen.getByText(/Mizan ERP v1.0 • Enterprise Edition/i)).toBeInTheDocument();
  });
});
