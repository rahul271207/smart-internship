import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import { Badge } from "./components/common/UI";

test("landing page presents the prototype title", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getAllByText(/Smart Internship Allocation Engine/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/independent prototype/i)).toBeTruthy();
});

test("status badge renders allocation states", () => {
  render(<Badge status="allocated">Allocated</Badge>);
  expect(screen.getByText("Allocated")).toBeTruthy();
});
