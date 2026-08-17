import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";
import "../i18n/config";

describe("Mizan ERP Scaffold Shell", () => {
  it("renders the application title in Arabic by default", () => {
    render(<App />);
    expect(screen.getByText("ميزان ERP")).toBeInTheDocument();
  });

  it("renders dashboard and module navigation elements", () => {
    render(<App />);
    expect(screen.getByText("لوحة التحكم")).toBeInTheDocument();
    expect(screen.getByText("إدارة الوحدات")).toBeInTheDocument();
  });

  it("displays SQLite WAL mode footnote", () => {
    render(<App />);
    expect(screen.getByText(/SQLite WAL Mode/i)).toBeInTheDocument();
  });
});
